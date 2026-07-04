variable "project_name"     { type = string }
variable "subnet_id"         { type = string }
variable "security_group_id" { type = string }
variable "key_name"          { type = string }
variable "ec2_public_key"    { type = string }
variable "image_bucket_arn"  { type = string }
variable "db_host"           { type = string }
variable "db_name"           { type = string }

variable "cloudfront_token" {
  type      = string
  sensitive = true
}

variable "db_username" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}
