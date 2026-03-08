# AWS SAM + CI/CD Complete Guide

> Building Serverless DevOps pipelines with SAM and CodePipeline

---

## Table of Contents

1. [SAM Overview](#1-sam-overview)
2. [Advanced SAM Templates](#2-advanced-sam-templates)
3. [Local Development](#3-local-development)
4. [CodePipeline Integration](#4-codepipeline-integration)
5. [Multi-Environment Strategy](#5-multi-environment-strategy)
6. [Testing Automation](#6-testing-automation)
7. [Production Best Practices](#7-production-best-practices)

---

## 1. SAM Overview

### 1.1 What is SAM

AWS Serverless Application Model (SAM) is an open-source framework for building serverless applications on AWS. It extends AWS CloudFormation with simplified syntax for defining serverless resources.

```yaml
# template.yaml - Minimal SAM application
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: python3.11
    Architectures:
      - x86_64

Resources:
  HelloWorldFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hello_world/
      Handler: app.lambda_handler
      Events:
        HelloWorld:
          Type: Api
          Properties:
            Path: /hello
            Method: get
```

### 1.2 SAM vs CDK Decision Matrix

| Scenario | Recommendation | Reason |
|----------|---------------|--------|
| Rapid prototyping | SAM | Low learning curve, concise templates |
| Complex architectures | CDK | Stronger programming language capabilities |
| Team familiar with CloudFormation | SAM | Seamless migration |
| Multi-language teams | CDK | TypeScript/Python/Java support |
| Simple Lambda applications | SAM | Minimal boilerplate code |

### 1.3 Essential SAM CLI Commands

```bash
# Initialize project
sam init --runtime python3.11 --name my-app --app-template hello-world

# Local build
sam build

# Local testing
sam local invoke HelloWorldFunction -e events/event.json

# Local API server
sam local start-api

# Deploy
sam deploy --guided

# Sync development (hot reload)
sam sync --watch

# View logs
sam logs -n HelloWorldFunction --tail
```

---

## 2. Advanced SAM Templates

### 2.1 Advanced Function Configuration

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: python3.11
    MemorySize: 512
    Architectures:
      - arm64  # Graviton2 for cost optimization
    Environment:
      Variables:
        LOG_LEVEL: INFO
        POWERTOOLS_SERVICE_NAME: my-service
    Layers:
      - !Ref PowertoolsLayer
    Tracing: Active  # X-Ray
    AutoPublishAlias: live
    DeploymentPreference:
      Type: Canary10Percent5Minutes
      Alarms:
        - !Ref ErrorsAlarm
      Hooks:
        PreTraffic: !Ref PreTrafficHookFunction
        PostTraffic: !Ref PostTrafficHookFunction

Resources:
  # Lambda PowerTools Layer
  PowertoolsLayer:
    Type: AWS::Serverless::LayerVersion
    Properties:
      LayerName: aws-lambda-powertools
      Description: AWS Lambda Powertools for Python
      ContentUri: layers/powertools/
      CompatibleRuntimes:
        - python3.11
        - python3.10
      LicenseInfo: MIT
      RetentionPolicy: Retain

  # Main API Function
  ApiFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: api/
      Handler: app.handler
      Description: API Handler
      Policies:
        - DynamoDBCrudPolicy:
            TableName: !Ref DataTable
        - SSMParameterReadPolicy:
            ParameterName: /my-app/config/*
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
            RestApiId: !Ref ApiGateway
```

---

## 3. Local Development

### 3.1 Local Development Environment Setup

```bash
# 1. Install SAM CLI
# macOS
brew tap aws/tap
brew install aws-sam-cli

# Verify installation
sam --version

# 2. Install Docker (required for local testing)
# Ensure Docker daemon is running

# 3. Configure AWS CLI
aws configure
```

### 3.2 Debugging Configuration

```json
// .vscode/launch.json - VS Code debugging
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "SAM Local Invoke",
      "type": "python",
      "request": "attach",
      "port": 5890,
      "host": "localhost",
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}/hello_world",
          "remoteRoot": "/var/task"
        }
      ]
    }
  ]
}
```

---

## 4. CodePipeline Integration

### 4.1 Pipeline Architecture

```yaml
# pipeline/template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: SAM CI/CD Pipeline

Parameters:
  GitHubOwner:
    Type: String
    Default: myorg
  GitHubRepo:
    Type: String
    Default: my-sam-app
  GitHubConnectionArn:
    Type: String
    Description: CodeStar Connection ARN

Resources:
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled

  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub ${AWS::StackName}-build
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec.yml
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/amazonlinux2-x86_64-standard:4.0
        PrivilegedMode: true

  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub ${AWS::StackName}-pipeline
      Stages:
        - Name: Source
          Actions:
            - Name: GitHub_Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: 1
              Configuration:
                ConnectionArn: !Ref GitHubConnectionArn
                FullRepositoryId: !Sub ${GitHubOwner}/${GitHubRepo}
                BranchName: main

        - Name: Build
          Actions:
            - Name: Build_and_Test
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref BuildProject

        - Name: Deploy_Dev
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub ${GitHubRepo}-dev
                TemplatePath: BuildArtifact::packaged.yaml
                Capabilities: CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
```

### 4.2 Buildspec Configuration

```yaml
# buildspec.yml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install aws-sam-cli
      - pip install pytest pytest-cov moto boto3

  pre_build:
    commands:
      - pip install flake8 black
      - flake8 hello_world/ --count --select=E9,F63,F7,F82
      - black --check hello_world/

  build:
    commands:
      - sam build
      - cd hello_world && pytest tests/ -v --cov=. --cov-report=xml
      - cd ..
      - sam package --output-template-file packaged.yaml --s3-bucket $ARTIFACT_BUCKET

reports:
  pytest-coverage:
    files:
      - hello_world/coverage.xml
    file-format: COBERTURAXML

artifacts:
  files:
    - packaged.yaml
    - template.yaml
```

---

## 5. Multi-Environment Strategy

### 5.1 Environment Configuration

```toml
# samconfig.toml
version = 0.1

[default.global.parameters]
stack_name = "my-sam-app"

[default.build.parameters]
cached = true
parallel = true

[default.deploy.parameters]
capabilities = "CAPABILITY_IAM CAPABILITY_AUTO_EXPAND"
confirm_changeset = true
resolve_s3 = true

[dev.deploy.parameters]
stack_name = "my-sam-app-dev"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=dev",
    "LogLevel=DEBUG",
    "EnableTracing=false"
]

[prod.deploy.parameters]
stack_name = "my-sam-app-prod"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=prod",
    "LogLevel=WARN",
    "EnableTracing=true"
]
```

---

## 6. Testing Automation

### 6.1 Unit Testing with Pytest

```python
# tests/test_handler.py
import json
import pytest
from unittest.mock import Mock
from hello_world import app

@pytest.fixture
def lambda_context():
    """Mock Lambda Context"""
    context = Mock()
    context.function_name = 'test-function'
    context.memory_limit_in_mb = 128
    context.aws_request_id = 'test-request-id'
    return context

@pytest.fixture
def apigw_event():
    """Sample API Gateway Event"""
    return {
        "body": '{"name": "Test"}',
        "resource": "/hello",
        "httpMethod": "GET",
        "headers": {"Accept": "application/json"},
        "requestContext": {"stage": "test"}
    }

def test_lambda_handler(apigw_event, lambda_context):
    """Test Lambda handler"""
    ret = app.lambda_handler(apigw_event, lambda_context)
    
    assert ret['statusCode'] == 200
    data = json.loads(ret['body'])
    assert 'message' in data
```

### 6.2 Integration Testing

```python
# tests/integration/test_api.py
import requests
import os

API_ENDPOINT = os.environ.get('API_ENDPOINT', 'http://localhost:3000')

def test_health_endpoint():
    """Health check endpoint test"""
    response = requests.get(f'{API_ENDPOINT}/health')
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'
```

---

## 7. Production Best Practices

### 7.1 Security Checklist

```yaml
# Production security configuration
Globals:
  Function:
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
          
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
            Resource: !GetAtt DataTable.Arn
```

### 7.2 Cost Optimization

```yaml
# cost-optimized-template.yaml
Globals:
  Function:
    # Use Graviton2 (ARM64) for cost savings
    Architectures:
      - arm64
    MemorySize: 256  # Adjust based on actual usage
    AutoPublishAlias: live
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrentExecutions: 100
```

### 7.3 Troubleshooting Guide

```bash
# Common issues diagnosis

# 1. Deployment failures
sam deploy --debug
aws cloudformation describe-stack-events --stack-name my-stack

# 2. Function errors
sam logs -n MyFunction --tail --include-traces
aws logs tail /aws/lambda/my-function --follow

# 3. Permission issues
aws lambda get-policy --function-name my-function
```

---

*Part of AWS DevTools Hero Learning Path*
