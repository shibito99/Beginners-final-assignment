terraform {
  required_version = ">= 1.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "recipe-app-tfstate"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    dynamodb_table = "recipe-app-tfstate-lock"
    encrypt        = true
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

module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
}

module "security_group" {
  source                    = "./modules/security_group"
  project_name              = var.project_name
  vpc_id                    = module.vpc.vpc_id
  cloudfront_prefix_list_id = data.aws_ec2_managed_prefix_list.cloudfront.id
}

module "ec2" {
  source                = "./modules/ec2"
  project_name          = var.project_name
  subnet_id             = module.vpc.public_subnet_id
  security_group_id     = module.security_group.ec2_sg_id
  key_name              = var.ec2_key_name
  ec2_public_key        = var.ec2_public_key
  image_bucket_arn      = module.s3.image_bucket_arn
  cloudfront_token      = var.cloudfront_custom_token
  db_host               = module.rds.db_endpoint
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
}

module "rds" {
  source             = "./modules/rds"
  project_name       = var.project_name
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security_group.rds_sg_id
  db_name            = var.db_name
  db_username        = var.db_username
  db_password        = var.db_password
}

module "s3" {
  source                   = "./modules/s3"
  project_name             = var.project_name
  ec2_iam_role_arn         = module.ec2.iam_role_arn
  frontend_oac_arn         = module.cloudfront.frontend_oac_arn
  images_oac_arn           = module.cloudfront.images_oac_arn
  cloudfront_distribution_arn = module.cloudfront.distribution_arn
}

module "cloudfront" {
  source                  = "./modules/cloudfront"
  project_name            = var.project_name
  frontend_bucket_domain  = module.s3.frontend_bucket_domain
  images_bucket_domain    = module.s3.images_bucket_domain
  ec2_elastic_ip          = module.ec2.elastic_ip
  cloudfront_custom_token = var.cloudfront_custom_token
  acm_certificate_arn     = var.acm_certificate_arn
  domain_name             = var.domain_name

  providers = {
    aws = aws.us_east_1
  }
}

# CloudFront マネージドプレフィックスリスト
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing"
}
