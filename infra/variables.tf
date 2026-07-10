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
