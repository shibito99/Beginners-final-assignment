variable "project_name" {
  type = string
}

variable "frontend_bucket_domain" {
  type = string
}

variable "images_bucket_domain" {
  type = string
}

variable "ec2_elastic_ip" {
  type = string
}

variable "cloudfront_custom_token" {
  type      = string
  sensitive = true
}

variable "acm_certificate_arn" {
  type    = string
  default = ""
}

variable "domain_name" {
  type    = string
  default = ""
}
