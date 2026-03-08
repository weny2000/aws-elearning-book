# AWS SAM + CI/CD Complete Guide

> Complete DevOps Practices for Building Serverless Applications with SAM and CodePipeline

---

## Table of Contents

1. [SAM Overview and Core Concepts](#1-sam-overview-and-core-concepts)
2. [SAM Template Advanced Features](#2-sam-template-advanced-features)
3. [Local Development and Debugging](#3-local-development-and-debugging)
4. [CodePipeline Integration](#4-codepipeline-integration)
5. [Multi-Environment Deployment Strategies](#5-multi-environment-deployment-strategies)
6. [Test Automation](#6-test-automation)
7. [Production Best Practices](#7-production-best-practices)

---

## 1. SAM Overview and Core Concepts

### 1.1 What is SAM

AWS Serverless Application Model (SAM) is an open-source framework for building serverless applications on AWS. It extends AWS CloudFormation, providing simplified syntax to define Serverless resources.

```yaml
# template.yaml - Minimal SAM Application
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

### 1.2 SAM vs CDK Selection Guide

| Scenario | Recommendation | Reason |
|----------|---------------|--------|
| Rapid Prototyping | SAM | Low learning curve, concise templates |
| Complex Architecture | CDK | Stronger programming language capabilities |
| Team familiar with CloudFormation | SAM | Seamless migration |
| Multi-language Team | CDK | TypeScript/Python/Java etc. |
| Simple Lambda Applications | SAM | Minimal boilerplate code |

### 1.3 SAM CLI Core Commands

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
deploy guided
sam deploy --guided

# Sync development (hot reload)
sam sync --watch

# View logs
sam logs -n HelloWorldFunction --tail
```

---

## 2. SAM Template Advanced Features

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

  # Main Function
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

  # Event-driven Function
  EventProcessorFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: processor/
      Handler: app.process
      ReservedConcurrentExecutions: 100
      Events:
        SQSEvent:
          Type: SQS
          Properties:
            Queue: !GetAtt ProcessingQueue.Arn
            BatchSize: 10
            MaximumBatchingWindowInSeconds: 5
            FunctionResponseTypes:
              - ReportBatchItemFailures

  # DynamoDB Table
  DataTable:
    Type: AWS::Serverless::SimpleTable
    Properties:
      TableName: !Sub ${AWS::StackName}-data
      PrimaryKey:
        Name: PK
        Type: String
      SortKey:
        Name: SK
        Type: String
      BillingMode: PAY_PER_REQUEST
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true

  # SQS Queue
  ProcessingQueue:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub ${AWS::StackName}-processing
      VisibilityTimeout: 120
      RedrivePolicy:
        deadLetterTargetArn: !GetAtt DLQ.Arn
        maxReceiveCount: 3

  DLQ:
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub ${AWS::StackName}-dlq
      MessageRetentionPeriod: 1209600  # 14 days

  # API Gateway
  ApiGateway:
    Type: AWS::Serverless::Api
    Properties:
      StageName: Prod
      TracingEnabled: true
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      AccessLogSetting:
        DestinationArn: !GetAtt ApiGatewayAccessLogGroup.Arn
        Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","routeKey":"$context.routeKey","status":"$context.status","responseLength":"$context.responseLength","integrationLatency":"$context.integrationLatency"}'
      Auth:
        DefaultAuthorizer: CognitoAuthorizer
        Authorizers:
          CognitoAuthorizer:
            UserPoolArn: !GetAtt UserPool.Arn

  ApiGatewayAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub /aws/apigateway/${AWS::StackName}
      RetentionInDays: 30

  # CloudWatch Alarm
  ErrorsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub ${AWS::StackName}-errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 60
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref ApiFunction

  # CodeDeploy Hook Functions
  PreTrafficHookFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hooks/
      Handler: pre_traffic.handler
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - codedeploy:PutLifecycleEventHookExecutionStatus
              Resource: '*'

  PostTrafficHookFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: hooks/
      Handler: post_traffic.handler
      Policies:
        - Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - codedeploy:PutLifecycleEventHookExecutionStatus
              Resource: '*'
```

### 2.2 SAM Policy Templates

```yaml
# SAM Built-in Policy Templates
Policies:
  # DynamoDB
  - DynamoDBReadPolicy:
      TableName: !Ref MyTable
  - DynamoDBCrudPolicy:
      TableName: !Ref MyTable
      
  # S3
  - S3ReadPolicy:
      BucketName: !Ref MyBucket
  - S3CrudPolicy:
      BucketName: !Ref MyBucket
      
  # SQS/SNS
  - SQSSendMessagePolicy:
      QueueName: !GetAtt MyQueue.QueueName
  - SNSPublishMessagePolicy:
      TopicName: !GetAtt MyTopic.TopicName
      
  # Secrets Manager
  - SecretsManagerReadWrite:
      
  # SSM Parameter Store
  - SSMParameterReadPolicy:
      ParameterName: /my-app/config/*
      
  # Custom Inline Policy
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - logs:CreateLogGroup
          - logs:CreateLogStream
          - logs:PutLogEvents
        Resource: '*'
      - Effect: Allow
        Action:
          - xray:PutTraceSegments
          - xray:PutTelemetryRecords
        Resource: '*'
```

---

## 3. Local Development and Debugging

### 3.1 Local Development Environment Setup

```bash
# 1. Install SAM CLI
# macOS
brew tap aws/tap
brew install aws-sam-cli

# Linux
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install

# Verify installation
sam --version

# 2. Install Docker (for local testing)
# Ensure Docker daemon is running

# 3. Install AWS CLI
aws configure
```

### 3.2 Local Debugging Configuration

```json
// .vscode/launch.json - VS Code Debugging Configuration
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

```python
# Debuggable Lambda Handler
import ptvsd  # VS Code Debugger

def lambda_handler(event, context):
    # Enable debugger (local development only)
    if os.environ.get('AWS_SAM_LOCAL'):
        ptvsd.enable_attach(address=('0.0.0.0', 5890))
        ptvsd.wait_for_attach()
    
    # Business logic
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello!'})
    }
```

### 3.3 Local Testing Best Practices

```bash
# 1. Build
sam build

# 2. Start local API server
sam local start-api --env-vars env.json --debug-port 5890

# 3. Test single function
sam local invoke HelloWorldFunction -e events/event.json

# 4. Generate test events
sam local generate-event apigateway aws-proxy > events/api-event.json

# 5. Use Docker network (connect to local database)
sam local invoke HelloWorldFunction \
  --env-vars env.json \
  --docker-network host
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
  GitHubBranch:
    Type: String
    Default: main
  GitHubConnectionArn:
    Type: String
    Description: CodeStar Connection ARN

Resources:
  # S3 Bucket for artifacts
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30

  # CodeBuild Project - Build & Test
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
      ServiceRole: !GetAtt BuildRole.Arn

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub ${AWS::StackName}-pipeline
      RoleArn: !GetAtt PipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        # Source Stage
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
                BranchName: !Ref GitHubBranch
              OutputArtifacts:
                - Name: SourceCode

        # Build Stage
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
              InputArtifacts:
                - Name: SourceCode
              OutputArtifacts:
                - Name: BuildArtifact

        # Deploy to Dev
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
                ParameterOverrides: |
                  {
                    "Environment": "dev"
                  }
              InputArtifacts:
                - Name: BuildArtifact

        # Approval for Staging
        - Name: Approve_Staging
          Actions:
            - Name: Manual_Approval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: Approve deployment to staging

        # Deploy to Staging
        - Name: Deploy_Staging
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub ${GitHubRepo}-staging
                TemplatePath: BuildArtifact::packaged.yaml
                Capabilities: CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
                ParameterOverrides: |
                  {
                    "Environment": "staging"
                  }
              InputArtifacts:
                - Name: BuildArtifact

        # Deploy to Production
        - Name: Deploy_Production
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub ${GitHubRepo}-prod
                TemplatePath: BuildArtifact::packaged.yaml
                Capabilities: CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
                ParameterOverrides: |
                  {
                    "Environment": "prod"
                  }
              InputArtifacts:
                - Name: BuildArtifact
```

### 4.2 Buildspec Configuration

```yaml
# buildspec.yml
version: 0.2

env:
  variables:
    AWS_DEFAULT_REGION: ap-northeast-1
  secrets-manager:
    GITHUB_TOKEN: github/token

phases:
  install:
    runtime-versions:
      python: 3.11
      nodejs: 18
    commands:
      # Install SAM CLI
      - pip install aws-sam-cli
      - sam --version
      
      # Install test dependencies
      - pip install pytest pytest-cov moto boto3

  pre_build:
    commands:
      # Code quality checks
      - echo "Running code quality checks..."
      - pip install flake8 black
      - flake8 hello_world/ --count --select=E9,F63,F7,F82 --show-source --statistics
      - black --check hello_world/

  build:
    commands:
      # Build SAM application
      - echo "Building SAM application..."
      - sam build
      
      # Run unit tests
      - echo "Running unit tests..."
      - cd hello_world
      - pytest tests/ -v --cov=. --cov-report=xml
      - cd ..
      
      # Package
      - echo "Packaging SAM application..."
      - sam package --output-template-file packaged.yaml --s3-bucket $ARTIFACT_BUCKET

  post_build:
    commands:
      # Validate template
      - echo "Validating template..."
      - sam validate --lint
      
      # Generate test reports
      - echo "Generating test reports..."

reports:
  pytest-coverage:
    files:
      - hello_world/coverage.xml
    file-format: COBERTURAXML
    base-directory: .
  pytest-report:
    files:
      - hello_world/test_report.xml
    file-format: JUNITXML
    base-directory: .

artifacts:
  files:
    - packaged.yaml
    - template.yaml
    - samconfig.toml
  discard-paths: no

cache:
  paths:
    - '/root/.cache/pip/**/*'
```

---

## 5. Multi-Environment Deployment Strategies

### 5.1 Environment Configuration Management

```yaml
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

# Development Environment
[dev.deploy.parameters]
stack_name = "my-sam-app-dev"
s3_prefix = "my-sam-app-dev"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=dev",
    "LogLevel=DEBUG",
    "EnableTracing=false"
]

# Staging Environment
[staging.deploy.parameters]
stack_name = "my-sam-app-staging"
s3_prefix = "my-sam-app-staging"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=staging",
    "LogLevel=INFO",
    "EnableTracing=true"
]

# Production Environment
[prod.deploy.parameters]
stack_name = "my-sam-app-prod"
s3_prefix = "my-sam-app-prod"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=prod",
    "LogLevel=WARN",
    "EnableTracing=true"
]
```

### 5.2 Deployment Script

```bash
#!/bin/bash
# deploy.sh - Multi-Environment Deployment Script

set -e

ENV=${1:-dev}
ACTION=${2:-deploy}

echo "Environment: $ENV"
echo "Action: $ACTION"

case $ACTION in
  build)
    sam build
    ;;
    
  deploy)
    sam build
    sam deploy --config-env $ENV
    ;;
    
  sync)
    # Fast sync (development)
    sam sync --config-env $ENV --watch
    ;;
    
  delete)
    sam delete --config-env $ENV
    ;;
    
  logs)
    # View logs
    FUNCTION_NAME=$(aws cloudformation describe-stacks \
      --stack-name my-sam-app-$ENV \
      --query 'Stacks[0].Outputs[?OutputKey==`ApiFunction`].OutputValue' \
      --output text)
    sam logs -n $FUNCTION_NAME --tail
    ;;
    
  *)
    echo "Usage: $0 [dev|staging|prod] [build|deploy|sync|delete|logs]"
    exit 1
    ;;
esac
```

---

## 6. Test Automation

### 6.1 Unit Testing

```python
# tests/test_handler.py
import json
import pytest
from unittest.mock import Mock, patch
from hello_world import app

@pytest.fixture
def lambda_context():
    """Mock Lambda Context"""
    context = Mock()
    context.function_name = 'test-function'
    context.memory_limit_in_mb = 128
    context.invoked_function_arn = 'arn:aws:lambda:region:account-id:function:test-function'
    context.aws_request_id = 'test-request-id'
    return context

@pytest.fixture
def apigw_event():
    """Sample API Gateway Event"""
    return {
        "body": '{"name": "Test"}',
        "resource": "/hello",
        "path": "/hello",
        "httpMethod": "GET",
        "headers": {
            "Accept": "application/json"
        },
        "queryStringParameters": None,
        "pathParameters": None,
        "stageVariables": None,
        "requestContext": {
            "accountId": "123456789012",
            "apiId": "test-api-id",
            "stage": "test"
        }
    }

def test_lambda_handler(apigw_event, lambda_context):
    """Test Lambda handler"""
    ret = app.lambda_handler(apigw_event, lambda_context)
    
    assert ret['statusCode'] == 200
    
    data = json.loads(ret['body'])
    assert 'message' in data
    assert 'Test' in data['message']

@patch('boto3.resource')
def test_dynamodb_interaction(mock_boto, lambda_context):
    """Test DynamoDB interaction (using Moto)"""
    from moto import mock_dynamodb
    
    @mock_dynamodb
    def _test():
        # Test code
        pass
    
    _test()
```

### 6.2 Integration Testing

```python
# tests/integration/test_api.py
import requests
import pytest
import os

API_ENDPOINT = os.environ.get('API_ENDPOINT', 'http://localhost:3000')

@pytest.fixture(scope='module')
def api_client():
    """API client fixture"""
    class APIClient:
        def __init__(self, base_url):
            self.base_url = base_url
        
        def get(self, path):
            return requests.get(f"{self.base_url}{path}")
        
        def post(self, path, json=None):
            return requests.post(f"{self.base_url}{path}", json=json)
    
    return APIClient(API_ENDPOINT)

def test_health_endpoint(api_client):
    """Health check endpoint test"""
    response = api_client.get('/health')
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'

def test_create_item(api_client):
    """Create item test"""
    payload = {'name': 'Test Item', 'value': 123}
    response = api_client.post('/items', json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data['id'] is not None
    assert data['name'] == payload['name']
```

---

## 7. Production Best Practices

### 7.1 Security Checklist

```yaml
# Production Environment Security Configuration
Globals:
  Function:
    # Least privilege principle
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
          
          # Only allow specific resource access
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
            Resource: !GetAtt DataTable.Arn
    
    # VPC Configuration (if needed)
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
    
    # Encryption
    KmsKeyArn: !Ref LambdaKMSKey
    
    # Environment variable encryption
    Environment:
      Variables:
        DATABASE_URL: '{{resolve:secretsmanager:prod/db/url}}'
```

### 7.2 Cost Optimization

```yaml
# cost-optimized-template.yaml
Globals:
  Function:
    # Use Graviton2 (ARM64) for cost savings
    Architectures:
      - arm64
    
    # Memory optimization
    MemorySize: 256  # Adjust based on actual usage
    
    # Provisioned Concurrency (production only)
    AutoPublishAlias: live
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrentExecutions: 100

Resources:
  # Use S3 Intelligent-Tiering
  StorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      IntelligentTieringConfigurations:
        - Id: ArchiveOldData
          Status: Enabled
          Tierings:
            - Days: 90
              AccessTier: ARCHIVE_ACCESS
            - Days: 180
              AccessTier: DEEP_ARCHIVE_ACCESS

  # DynamoDB On-Demand (development environment)
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST  # Development environment
      # BillingMode: PROVISIONED   # Production with AutoScaling
```

### 7.3 Troubleshooting Guide

```bash
# Common Issue Diagnostics

# 1. Deployment failures
sam deploy --debug  # View detailed errors
aws cloudformation describe-stack-events --stack-name my-stack

# 2. Function errors
sam logs -n MyFunction --tail --include-traces
aws logs tail /aws/lambda/my-function --follow

# 3. Cold start issues
# Check initialization code
# Use Provisioned Concurrency

# 4. Permission issues
aws lambda get-policy --function-name my-function
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:role/my-role \
  --action-names dynamodb:GetItem \
  --resource-arns arn:aws:dynamodb:region:account:table/my-table

# 5. API Gateway errors
aws apigateway get-test-invoke-method \
  --rest-api-id xxx \
  --resource-id xxx \
  --http-method GET
```

---

*Part of AWS DevTools Hero Learning Path*
*Part of Serverless Topic Integration*
