provider "aws" {
  region     = var.region
  access_key = "AKIAZHFFEI4LPTYXH44C"
  secret_key = "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"
}

resource "aws_instance" "family" {
  ami           = var.ami
  instance_type = var.instance_type
  subnet_id     = var.subnet_id
  key_name      = var.key_name

  tags = {
    Name = "ExampleInstance"
  }
}


