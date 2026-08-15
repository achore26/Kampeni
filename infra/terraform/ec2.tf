# Latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "kampeni" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.kampeni.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2.name

  root_block_device {
    volume_size = 30   # GB — enough for Docker images + Postgres data
    volume_type = "gp3"
    encrypted   = true
  }

  # Bootstrap script — installs Docker and pulls the repo on first boot
  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    aws_region  = var.aws_region
    ecr_registry = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    s3_bucket   = aws_s3_bucket.raw.bucket
  }))

  tags = { Name = "${local.prefix}-server" }
}

# Fixed public IP — survives instance stop/start
resource "aws_eip" "kampeni" {
  instance = aws_instance.kampeni.id
  domain   = "vpc"
}
