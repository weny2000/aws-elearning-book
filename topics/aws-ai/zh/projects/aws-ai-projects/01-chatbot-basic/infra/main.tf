# Bedrock 聊天机器人基础设施

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# IAM Policy for Bedrock access
resource "aws_iam_role_policy" "bedrock_access" {
  name = "bedrock-access"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream"
        ]
        Resource = [
          "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-*",
          "arn:aws:bedrock:${var.aws_region}::foundation-model/amazon.nova-*"
        ]
      }
    ]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
resource "aws_lambda_function" "chatbot" {
  function_name = "${var.project_name}-chatbot"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      AWS_REGION = var.aws_region
    }
  }

  tracing_config {
    mode = "Active"
  }
}

# API Gateway
resource "aws_api_gateway_rest_api" "chatbot" {
  name        = "${var.project_name}-api"
  description = "Bedrock Chatbot API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "chat" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  parent_id   = aws_api_gateway_rest_api.chatbot.root_resource_id
  path_part   = "chat"
}

resource "aws_api_gateway_method" "chat_post" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "POST"
  authorization = "NONE"

  request_validator_id = aws_api_gateway_request_validator.chatbot.id
  request_models = {
    "application/json" = aws_api_gateway_model.chat_request.name
  }
}

resource "aws_api_gateway_integration" "lambda_chat" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.chatbot.invoke_arn
}

# Request Validator
resource "aws_api_gateway_request_validator" "chatbot" {
  rest_api_id                 = aws_api_gateway_rest_api.chatbot.id
  name                        = "chatbot-validator"
  validate_request_body       = true
  validate_request_parameters = false
}

# Request Model
resource "aws_api_gateway_model" "chat_request" {
  rest_api_id  = aws_api_gateway_rest_api.chatbot.id
  content_type = "application/json"
  name         = "ChatRequest"
  description  = "Chat request model"

  schema = jsonencode({
    type = "object"
    required = ["message"]
    properties = {
      message = {
        type = "string"
        minLength = 1
        maxLength = 10000
      }
      model = {
        type = "string"
        enum = ["nova-micro", "nova-lite", "nova-pro", "claude-sonnet"]
      }
      system_prompt = {
        type = "string"
        maxLength = 2000
      }
    }
  })
}

# CORS
resource "aws_api_gateway_method" "chat_options" {
  rest_api_id   = aws_api_gateway_rest_api.chatbot.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({ statusCode = 200 })
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "chatbot" {
  depends_on = [
    aws_api_gateway_integration.lambda_chat,
    aws_api_gateway_method.chat_post
  ]

  rest_api_id = aws_api_gateway_rest_api.chatbot.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda Permission
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.chatbot.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.chatbot.execution_arn}/*/*"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "chatbot" {
  name              = "/aws/lambda/${aws_lambda_function.chatbot.function_name}"
  retention_in_days = 7
}

# CloudWatch Alarm for errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda function error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.chatbot.function_name
  }
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts"
}

# Data sources
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../src/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# Variables
variable "project_name" {
  description = "Project name"
  type        = string
  default     = "bedrock-chatbot"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment (dev/prod)"
  type        = string
  default     = "dev"
}

# Outputs
output "api_endpoint" {
  description = "API Gateway endpoint URL"
  value       = "${aws_api_gateway_deployment.chatbot.invoke_url}/chat"
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.chatbot.function_name
}
