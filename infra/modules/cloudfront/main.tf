terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# OAC（Origin Access Control）- フロントエンドS3用
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-oac-frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# OAC - 画像S3用
resource "aws_cloudfront_origin_access_control" "images" {
  name                              = "${var.project_name}-oac-images"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

locals {
  use_custom_domain = var.domain_name != "" && var.acm_certificate_arn != ""
}

resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_200"

  aliases = local.use_custom_domain ? [var.domain_name] : []

  # Origin 1: フロントエンドS3バケット
  origin {
    origin_id                = "s3-frontend"
    domain_name              = var.frontend_bucket_domain
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # Origin 2: EC2 APIサーバー
  origin {
    origin_id   = "ec2-api"
    domain_name = var.ec2_elastic_ip

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "X-Custom-Token"
      value = var.cloudfront_custom_token
    }
  }

  # Origin 3: 画像S3バケット
  origin {
    origin_id                = "s3-images"
    domain_name              = var.images_bucket_domain
    origin_access_control_id = aws_cloudfront_origin_access_control.images.id
  }

  # デフォルトキャッシュ動作: S3フロントエンド
  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_routing.arn
    }
  }

  # /api/* → EC2（キャッシュなし）
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    target_origin_id       = "ec2-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id          = data.aws_cloudfront_cache_policy.caching_disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer.id
  }

  # /health → EC2（ヘルスチェック用）
  ordered_cache_behavior {
    path_pattern           = "/health"
    target_origin_id       = "ec2-api"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_disabled.id
  }

  # /images/* → 画像S3（キャッシュあり）
  ordered_cache_behavior {
    path_pattern           = "/images/*"
    target_origin_id       = "s3-images"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]

    cache_policy_id = data.aws_cloudfront_cache_policy.caching_optimized.id
  }

  # SPA用: 404をindex.htmlで返す
  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn            = local.use_custom_domain ? var.acm_certificate_arn : null
    ssl_support_method             = local.use_custom_domain ? "sni-only" : null
    minimum_protocol_version       = local.use_custom_domain ? "TLSv1.2_2021" : "TLSv1"
    cloudfront_default_certificate = !local.use_custom_domain
  }

  tags = { Name = "${var.project_name}-cf" }
}

# SPAルーティング関数（サブパスへの直接アクセス対応）
resource "aws_cloudfront_function" "spa_routing" {
  name    = "${var.project_name}-spa-routing"
  runtime = "cloudfront-js-2.0"
  publish = true

  code = <<-JS
    async function handler(event) {
      const request = event.request;
      const uri = request.uri;
      if (!uri.includes('.') && uri !== '/') {
        request.uri = '/index.html';
      }
      return request;
    }
  JS
}

# マネージドキャッシュポリシー
data "aws_cloudfront_cache_policy" "caching_optimized" {
  name = "Managed-CachingOptimized"
}

data "aws_cloudfront_cache_policy" "caching_disabled" {
  name = "Managed-CachingDisabled"
}

data "aws_cloudfront_origin_request_policy" "all_viewer" {
  name = "Managed-AllViewer"
}
