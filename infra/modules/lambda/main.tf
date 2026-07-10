data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Lambda実行ロール
resource "aws_iam_role" "lambda" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ]
        Resource = [
          var.recipes_table_arn,
          "${var.recipes_table_arn}/index/*",
          var.shopping_lists_table_arn,
          "${var.shopping_lists_table_arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = "${var.images_bucket_arn}/*"
      }
    ]
  })
}

# メインLambda関数（全APIルートを1関数で処理）
# デプロイ前に backend/lambda/ を lambda.zip としてパッケージングする
resource "aws_lambda_function" "api" {
  function_name    = "${var.project_name}-api"
  role             = aws_iam_role.lambda.arn
  handler          = "handler.lambda_handler"
  runtime          = "ruby3.2"
  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      RECIPES_TABLE        = var.recipes_table_name
      SHOPPING_LISTS_TABLE = var.shopping_lists_table_name
      IMAGES_BUCKET        = var.images_bucket_name
      REGION               = data.aws_region.current.name
    }
  }

  tags = { Name = "${var.project_name}-api" }
}

# Lambda → API Gateway の呼び出し許可
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}
