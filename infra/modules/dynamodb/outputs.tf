output "recipes_table_name" {
  value = aws_dynamodb_table.recipes.name
}

output "recipes_table_arn" {
  value = aws_dynamodb_table.recipes.arn
}

output "shopping_lists_table_name" {
  value = aws_dynamodb_table.shopping_lists.name
}

output "shopping_lists_table_arn" {
  value = aws_dynamodb_table.shopping_lists.arn
}
