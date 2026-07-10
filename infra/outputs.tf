output "cloudfront_domain" {
  description = "CloudFrontドメイン名（フロントエンドURL）"
  value       = module.cloudfront.domain_name
}

output "api_gateway_endpoint" {
  description = "API GatewayエンドポイントURL"
  value       = module.api_gateway.api_endpoint
}

output "frontend_bucket_name" {
  description = "フロントエンドS3バケット名"
  value       = module.s3.frontend_bucket_name
}

output "images_bucket_name" {
  description = "画像S3バケット名"
  value       = module.s3.images_bucket_name
}

output "recipes_table_name" {
  description = "DynamoDB レシピテーブル名"
  value       = module.dynamodb.recipes_table_name
}
