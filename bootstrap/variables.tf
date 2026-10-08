variable "aws_region" {
  description = "Region for the state backend and the deployed app."
  type        = string
  default     = "us-east-1"
}

variable "github_owner" {
  description = "Your GitHub username (owner of the fork)."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9-]+$", var.github_owner))
    error_message = "github_owner must be only your GitHub username, for example SamM23: no URL, no slashes, no spaces. Copy the exact capitalisation from GitHub."
  }
}

variable "github_repo" {
  description = "Name of your fork (without owner). Only this repo can assume the roles."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9._-]+$", var.github_repo))
    error_message = "github_repo must be only the repository name, for example iim-cicd-demo: not a URL and no slashes. Copy the exact capitalisation from GitHub."
  }
}

variable "app_name" {
  description = "Must equal app_name in terraform/env/prod.tfvars. Roles may only manage resources with this prefix."
  type        = string
  default     = "iim-cicd-demo"
}

variable "create_oidc_provider" {
  description = "Set false if this account already has the GitHub OIDC provider (only one is allowed per account)."
  type        = bool
  default     = true
}
