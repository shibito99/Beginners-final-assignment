variable "aws_region" {
  description = "AWSリージョン"
  type        = string
  default     = "ap-northeast-1"
}

variable "project_name" {
  description = "プロジェクト名（リソース名のプレフィックスに使用）"
  type        = string
  default     = "recipe-app"
}

variable "ec2_key_name" {
  description = "EC2キーペア名"
  type        = string
  default     = "recipe-app-key"
}

variable "ec2_public_key" {
  description = "EC2キーペアの公開鍵"
  type        = string
}

variable "db_name" {
  description = "RDSデータベース名"
  type        = string
  default     = "recipe_app_production"
}

variable "db_username" {
  description = "RDSマスターユーザー名"
  type        = string
  default     = "recipe_admin"
}

variable "db_password" {
  description = "RDSマスターパスワード"
  type        = string
  sensitive   = true
}

variable "cloudfront_custom_token" {
  description = "CloudFrontからEC2へのカスタムトークン（直接アクセス防止）"
  type        = string
  sensitive   = true
}

variable "acm_certificate_arn" {
  description = "ACM証明書ARN（us-east-1）。カスタムドメインを使用しない場合は空文字"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "カスタムドメイン名。使用しない場合は空文字"
  type        = string
  default     = ""
}
