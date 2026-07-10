output "function_arn" {
  value = aws_lambda_function.api.arn
}

output "invoke_arn" {
  value = aws_lambda_function.api.invoke_arn
}

output "iam_role_arn" {
  value = aws_iam_role.lambda.arn
}
