// variables.tf
variable "region" {
  description = "The AWS region to deploy resources"
  default     = "us-east-2"
}

variable "ami" {
  description = "The AMI to use for the instance"
  default     = "ami-04f167a56786e4b09"
}

variable "instance_type" {
  description = "The type of instance to create"
  default     = "t2.micro"
}

variable "subnet_id" {
  description = "The subnet ID to launch the instance in"
  default     = "subnet-0595a93931ebf6286"
}

variable "key_name" {
  description = "The key name to use for the instance"
  default     = "Family"
}