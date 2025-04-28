// output.tf
output "instance_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.family.public_ip
}

output "instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.family.id
}