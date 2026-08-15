variable "aws_region" {
  description = "AWS region. us-east-1 is the region permitted by the org SCP."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

variable "project" {
  type    = string
  default = "kampeni"
}

variable "instance_type" {
  description = "EC2 instance type. t3.small runs all 7 services within the $20/month budget."
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair to use for SSH access. Create this in the AWS Console first."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "Your IP address in CIDR notation for SSH access, e.g. 41.90.64.0/32"
  type        = string
  default     = "0.0.0.0/0"
}

variable "domain_name" {
  description = "Optional — your domain e.g. api.kampeni.net. Leave blank to use Elastic IP directly."
  type        = string
  default     = ""
}

variable "auth0_domain" {
  type    = string
  default = "dev-vrovqw5w4cxdhkwb.eu.auth0.com"
}

variable "auth0_audience" {
  type    = string
  default = "https://api.kampeni.net"
}

variable "openai_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "tarjumi_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "youtube_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "internal_trigger_secret" {
  type      = string
  sensitive = true
  default   = "9b69b07cf26dde7450724b7e7f4c43f01cc8ecc67ef85e04f928865fbe36e010"
}

variable "alert_email" {
  description = "Email address for budget and cost alerts."
  type        = string
  default     = "kampeni399@gmail.com"
}
