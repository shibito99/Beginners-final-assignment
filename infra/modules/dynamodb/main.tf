resource "aws_dynamodb_table" "recipes" {
  name         = "${var.project_name}-recipes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "recipeId"

  attribute {
    name = "recipeId"
    type = "S"
  }

  attribute {
    name = "genre"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # ジャンル×作成日でのクエリ用
  global_secondary_index {
    name            = "genre-createdAt-index"
    hash_key        = "genre"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # 作成日ソート用（全件取得時）
  global_secondary_index {
    name            = "createdAt-index"
    hash_key        = "createdAt"
    projection_type = "ALL"
  }

  tags = { Name = "${var.project_name}-recipes" }
}

resource "aws_dynamodb_table" "shopping_lists" {
  name         = "${var.project_name}-shopping-lists"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "listId"

  attribute {
    name = "listId"
    type = "S"
  }

  tags = { Name = "${var.project_name}-shopping-lists" }
}
