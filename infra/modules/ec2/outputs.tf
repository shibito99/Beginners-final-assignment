output "elastic_ip"    { value = aws_eip.main.public_ip }
output "iam_role_arn"  { value = aws_iam_role.ec2.arn }
output "instance_id"   { value = aws_instance.main.id }
