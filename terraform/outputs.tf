output "api_endpoint" {
  description = "Base URL of the HTTP API (no trailing slash)."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "function_name" {
  description = "Name of the deployed Lambda function."
  value       = aws_lambda_function.api.function_name
}

output "release_version" {
  description = "Version the function reports on /health."
  value       = var.release_version
}
