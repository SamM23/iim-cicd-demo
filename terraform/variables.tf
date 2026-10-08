variable "aws_region" {
  description = "Region for all resources. Must match the AWS_REGION repository variable."
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name. Must match app_name used in bootstrap so the deploy role covers these resources."
  type        = string
  default     = "iim-cicd-demo"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,30}$", var.app_name))
    error_message = "app_name must be 3-31 chars: lowercase letters, digits and hyphens, starting with a letter."
  }
}

variable "environment" {
  description = "Deployment environment. The workshop deploys prod only."
  type        = string
  default     = "prod"

  validation {
    condition     = var.environment == "prod"
    error_message = "This workshop deploys prod only."
  }
}

variable "owner" {
  description = "Owner tag value, normally your GitHub username."
  type        = string

  validation {
    condition     = length(var.owner) > 0 && !startswith(var.owner, "REPLACE")
    error_message = "Set owner in env/prod.tfvars to your GitHub username."
  }
}

variable "release_version" {
  description = "Version injected into the function as APP_VERSION. The pipeline passes the git SHA."
  type        = string
  default     = "dev"
}

variable "log_retention_days" {
  description = "CloudWatch log retention. Kept short to limit cost."
  type        = number
  default     = 7

  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 14
    error_message = "log_retention_days must be between 1 and 14 for this lab."
  }
}
