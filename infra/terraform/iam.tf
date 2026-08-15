data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# Instance role — gives the EC2 instance access to S3 and ECR without access keys
resource "aws_iam_role" "ec2" {
  name               = "${local.prefix}-ec2"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy" "ec2_s3" {
  name = "s3-raw-storage"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
      Resource = [aws_s3_bucket.raw.arn, "${aws_s3_bucket.raw.arn}/*"]
    }]
  })
}

resource "aws_iam_role_policy" "ec2_ecr" {
  name = "ecr-pull"
  role = aws_iam_role.ec2.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.prefix}-ec2"
  role = aws_iam_role.ec2.name
}

# ── GitHub Actions IAM user — only needs ECR push + describe ─────────────────
resource "aws_iam_user" "github_actions" {
  name = "${local.prefix}-github-actions"
}

resource "aws_iam_user_policy" "github_actions" {
  name = "ecr-push"
  user = aws_iam_user.github_actions.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
        ]
        Resource = [for repo in aws_ecr_repository.services : repo.arn]
      }
    ]
  })
}

resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name
}
