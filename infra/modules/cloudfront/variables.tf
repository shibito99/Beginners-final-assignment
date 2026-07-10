variable "project_name" {
  type = string
}

variable "frontend_bucket_domain" {
  type = string
}

variable "images_bucket_domain" {
  type = string
}

variable "api_gateway_domain" {
  description = "API GatewayのドメインはHTTPS前提（スキームなし）"
  type        = string
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "domain_name" {
  type    = string
  default = ""
}
