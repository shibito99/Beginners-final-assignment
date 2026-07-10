output "api_endpoint" {
  value = aws_apigatewayv2_stage.prod.invoke_url
}

output "execution_arn" {
  value = aws_apigatewayv2_api.main.execution_arn
}

# CloudFrontのカスタムオリジン用（スキームなしのホスト名）
output "api_domain" {
  value = replace(aws_apigatewayv2_api.main.api_endpoint, "https://", "")
}
