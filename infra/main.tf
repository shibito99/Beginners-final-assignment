terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket       = "recipe-app-tfstate-237228997080"
    key          = "prod/terraform.tfstate"
    region       = "ap-northeast-1"
    use_lockfile = true
    encrypt      = true
  }
}

provider "aws" {
  region = var.aws_region
}

# us-east-1 プロバイダー（ACM証明書はus-east-1必須）
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# DynamoDB テーブル
module "dynamodb" {
  source       = "./modules/dynamodb"
  project_name = var.project_name
}

# API Gateway（execution_arnをLambdaに渡すため先に定義）
module "api_gateway" {
  source            = "./modules/api_gateway"
  project_name      = var.project_name
  lambda_invoke_arn = module.lambda.invoke_arn
}

# Lambda 関数
module "lambda" {
  source                    = "./modules/lambda"
  project_name              = var.project_name
  recipes_table_name        = module.dynamodb.recipes_table_name
  recipes_table_arn         = module.dynamodb.recipes_table_arn
  shopping_lists_table_name = module.dynamodb.shopping_lists_table_name
  shopping_lists_table_arn  = module.dynamodb.shopping_lists_table_arn
  images_bucket_name        = module.s3.images_bucket_name
  images_bucket_arn         = module.s3.images_bucket_arn
  api_gateway_execution_arn = module.api_gateway.execution_arn
}

# S3 バケット（フロントエンド・画像）
module "s3" {
  source                      = "./modules/s3"
  project_name                = var.project_name
  lambda_iam_role_arn         = module.lambda.iam_role_arn
  frontend_oac_arn            = module.cloudfront.frontend_oac_arn
  images_oac_arn              = module.cloudfront.images_oac_arn
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
}

# CloudFront
module "cloudfront" {
  source                 = "./modules/cloudfront"
  project_name           = var.project_name
  frontend_bucket_domain = module.s3.frontend_bucket_domain
  images_bucket_domain   = module.s3.images_bucket_domain
  api_gateway_domain     = module.api_gateway.api_domain
  acm_certificate_arn    = var.acm_certificate_arn
  domain_name            = var.domain_name

  providers = {
    aws = aws.us_east_1
  }
}
