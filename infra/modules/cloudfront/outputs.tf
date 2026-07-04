output "domain_name"        { value = aws_cloudfront_distribution.main.domain_name }
output "distribution_arn"  { value = aws_cloudfront_distribution.main.arn }
output "frontend_oac_arn"  { value = aws_cloudfront_origin_access_control.frontend.arn }
output "images_oac_arn"    { value = aws_cloudfront_origin_access_control.images.arn }
