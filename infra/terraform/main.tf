terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state — create this bucket manually before first apply:
  #   aws s3 mb s3://kampeni-terraform-state --region eu-west-1
  #   aws s3api put-bucket-versioning --bucket kampeni-terraform-state \
  #     --versioning-configuration Status=Enabled
  backend "s3" {
    bucket         = "kampeni-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "kampeni-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
