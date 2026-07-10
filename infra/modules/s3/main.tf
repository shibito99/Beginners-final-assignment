data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

# ---- フロントエンドバケット ----

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-frontend-${local.account_id}"
  tags   = { Name = "${var.project_name}-frontend" }
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "cloudfront.amazonaws.com" }
      Action    = "s3:GetObject"
      Resource  = "${aws_s3_bucket.frontend.arn}/*"
      Condition = {
        StringEquals = {
          "AWS:SourceArn" = var.cloudfront_distribution_arn
        }
      }
    }]
  })
}

# ---- 画像バケット ----

resource "aws_s3_bucket" "images" {
  bucket = "${var.project_name}-images-${local.account_id}"
  tags   = { Name = "${var.project_name}-images" }
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket                  = aws_s3_bucket.images.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = ["*"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_policy" "images" {
  bucket = aws_s3_bucket.images.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "AllowCloudFrontRead"
        Effect   = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.images.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = var.cloudfront_distribution_arn
          }
        }
      },
      {
        Sid      = "AllowLambdaReadWrite"
        Effect   = "Allow"
        Principal = { AWS = var.lambda_iam_role_arn }
        Action   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}
