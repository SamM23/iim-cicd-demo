# Offline tests: AWS is mocked, so no credentials or cost. Needs Terraform >= 1.7.
mock_provider "aws" {}

variables {
  owner = "test-owner"
}

run "carries_mandatory_tags" {
  command = plan

  assert {
    condition = alltrue([
      for k in ["Project", "App", "Environment", "Owner", "ManagedBy"] :
      contains(keys(aws_lambda_function.api.tags), k)
    ])
    error_message = "Lambda is missing a mandatory tag."
  }

  assert {
    condition     = aws_lambda_function.api.tags["ManagedBy"] == "Terraform" && aws_lambda_function.api.tags["Environment"] == "prod"
    error_message = "ManagedBy/Environment tags have unexpected values."
  }
}

run "injects_release_version" {
  command = plan

  variables {
    release_version = "abc123"
  }

  assert {
    condition     = aws_lambda_function.api.environment[0].variables["APP_VERSION"] == "abc123"
    error_message = "release_version must reach the function as APP_VERSION."
  }
}

run "stays_cheap_and_serverless" {
  command = plan

  assert {
    condition     = aws_apigatewayv2_api.http.protocol_type == "HTTP"
    error_message = "Use the HTTP API, not the more expensive REST API."
  }

  assert {
    condition     = aws_lambda_function.api.memory_size <= 256
    error_message = "Keep Lambda memory small for the lab."
  }

  assert {
    condition     = aws_cloudwatch_log_group.lambda.retention_in_days <= 14
    error_message = "Log retention must stay short."
  }
}

run "exposes_expected_routes" {
  command = plan

  assert {
    condition     = length(aws_apigatewayv2_route.routes) == 2
    error_message = "Expected GET /health and GET /openings."
  }
}

run "lambda_trust_is_not_wildcard" {
  command = plan

  assert {
    condition     = !strcontains(aws_iam_role.lambda.assume_role_policy, "\"*\"")
    error_message = "Lambda execution role trust policy must not use a wildcard."
  }
}

run "rejects_non_prod_environment" {
  command = plan

  variables {
    environment = "devl"
  }

  expect_failures = [var.environment]
}

run "rejects_placeholder_owner" {
  command = plan

  variables {
    owner = "REPLACE-WITH-YOUR-GITHUB-USERNAME"
  }

  expect_failures = [var.owner]
}
