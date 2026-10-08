output "github_actions_variables" {
  description = "Add each entry as a repository variable (Settings > Secrets and variables > Actions > Variables). None are secrets."
  value = {
    AWS_REGION          = var.aws_region
    TF_STATE_BUCKET     = aws_s3_bucket.tf_state.bucket
    TF_LOCK_TABLE       = aws_dynamodb_table.tf_locks.name
    AWS_PLAN_ROLE_ARN   = aws_iam_role.plan.arn
    AWS_DEPLOY_ROLE_ARN = aws_iam_role.deploy.arn
  }
}
