data "aws_caller_identity" "current" {}

locals {
  prefix       = "${var.project}-${var.environment}"
  ecr_registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
}

output "server_ip" {
  description = "Elastic IP — point your domain here and add to GitHub secret EC2_HOST"
  value       = aws_eip.kampeni.public_ip
}

output "api_url" {
  description = "Set this as VITE_API_URL in your frontend build"
  value       = var.domain_name != "" ? "https://${var.domain_name}/api/v1" : "http://${aws_eip.kampeni.public_ip}/api/v1"
}

output "ecr_registry" {
  description = "Add this as GitHub secret ECR_REGISTRY"
  value       = local.ecr_registry
}

output "ecr_urls" {
  description = "ECR image URLs per service"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "s3_bucket" {
  description = "Add this as MINIO_BUCKET in your .env on EC2"
  value       = aws_s3_bucket.raw.bucket
}

output "github_actions_access_key_id" {
  description = "Add as GitHub secret AWS_ACCESS_KEY_ID"
  value       = aws_iam_access_key.github_actions.id
}

output "github_actions_secret_access_key" {
  description = "Add as GitHub secret AWS_SECRET_ACCESS_KEY"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}

output "next_steps" {
  value = <<-EOT

    ── After terraform apply ────────────────────────────────────────────────────

    1. SSH into your server:
       ssh -i ~/.ssh/<your-key>.pem ubuntu@${aws_eip.kampeni.public_ip}

    2. Copy your .env file to the server:
       scp -i ~/.ssh/<your-key>.pem .env ubuntu@${aws_eip.kampeni.public_ip}:/opt/kampeni/.env

    3. Copy docker-compose.prod.yml:
       scp -i ~/.ssh/<your-key>.pem docker-compose.prod.yml ubuntu@${aws_eip.kampeni.public_ip}:/opt/kampeni/docker-compose.yml

    4. Run migrations (first time only):
       ssh ubuntu@${aws_eip.kampeni.public_ip} "cd /opt/kampeni && docker compose run --rm api-gateway python -m alembic upgrade head"

    5. Add these to GitHub Secrets:
       EC2_HOST        = ${aws_eip.kampeni.public_ip}
       EC2_SSH_KEY     = (contents of your .pem file)
       ECR_REGISTRY    = ${local.ecr_registry}
       AWS_ACCESS_KEY_ID     = (from github_actions_access_key_id output)
       AWS_SECRET_ACCESS_KEY = (run: terraform output -raw github_actions_secret_access_key)

  EOT
}
