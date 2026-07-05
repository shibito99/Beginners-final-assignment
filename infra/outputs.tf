output "cloudfront_domain" {
  description = "CloudFrontドメイン名（フロントエンドURL）"
  value       = module.cloudfront.domain_name
}

output "ec2_elastic_ip" {
  description = "EC2 Elastic IP"
  value       = module.ec2.elastic_ip
}

output "frontend_bucket_name" {
  description = "フロントエンドS3バケット名"
  value       = module.s3.frontend_bucket_name
}

output "images_bucket_name" {
  description = "画像S3バケット名"
  value       = module.s3.images_bucket_name
}
