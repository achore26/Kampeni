#!/bin/bash
set -e

# ── System update ─────────────────────────────────────────────────────────────
apt-get update -y
apt-get upgrade -y

# ── Docker ────────────────────────────────────────────────────────────────────
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu
systemctl enable docker
systemctl start docker

# ── Docker Compose v2 ─────────────────────────────────────────────────────────
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── AWS CLI v2 ────────────────────────────────────────────────────────────────
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
apt-get install -y unzip
unzip /tmp/awscliv2.zip -d /tmp
/tmp/aws/install

# ── App directory ─────────────────────────────────────────────────────────────
mkdir -p /opt/kampeni
chown ubuntu:ubuntu /opt/kampeni

# ── ECR login helper (runs on every boot via cron) ───────────────────────────
cat > /usr/local/bin/ecr-login.sh << 'EOF'
#!/bin/bash
aws ecr get-login-password --region ${aws_region} | \
  docker login --username AWS --password-stdin ${ecr_registry}
EOF
chmod +x /usr/local/bin/ecr-login.sh

# Run ECR login now and on every reboot (token expires every 12h)
/usr/local/bin/ecr-login.sh
echo "0 */6 * * * root /usr/local/bin/ecr-login.sh" >> /etc/crontab

# Write instance metadata for the deploy script to use
cat > /opt/kampeni/.instance-config << EOF
AWS_REGION=${aws_region}
ECR_REGISTRY=${ecr_registry}
S3_BUCKET=${s3_bucket}
EOF

echo "Bootstrap complete" >> /var/log/kampeni-setup.log
