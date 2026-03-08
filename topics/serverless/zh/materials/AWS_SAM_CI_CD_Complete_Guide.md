# AWS SAM + CI/CD 完全指南

> 使用 SAM 和 CodePipeline 构建 Serverless 应用的完整 DevOps 实践

---

## 目录

1. [SAM 概述与核心概念](#1-sam-概述与核心概念)
2. [SAM 模板高级特性](#2-sam-模板高级特性)
3. [本地开发与调试](#3-本地开发与调试)
4. [CodePipeline 集成](#4-codepipeline-集成)
5. [多环境部署策略](#5-多环境部署策略)
6. [测试自动化](#6-测试自动化)
7. [生产最佳实践](#7-生产最佳实践)

---

## 1. SAM 概述与核心概念

### 1.1 SAM 是什么

AWS Serverless Application Model (SAM) 是一种开源框架，用于在 AWS 上构建无服务器应用程序。它扩展了 AWS CloudFormation，提供简化的语法来定义 Serverless 资源。

```yaml
# template.yaml - 最小 SAM 应用
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

### 1.2 SAM vs CDK 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 快速原型 | SAM | 学习曲线低，模板简洁 |
| 复杂架构 | CDK | 编程语言表达能力更强 |
| 团队熟悉 CloudFormation | SAM | 无缝迁移 |
| 多语言团队 | CDK | TypeScript/Python/Java 等 |
| 简单 Lambda 应用 | SAM | 最小样板代码 |

### 1.3 SAM CLI 核心命令

```bash
# 初始化项目
sam init --runtime python3.11 --name my-app --app-template hello-world

# 本地构建
sam build

# 本地测试
sam local invoke HelloWorldFunction -e events/event.json

# 本地 API 服务器
sam local start-api

# 部署
deploy guided
sam deploy --guided

# 同步开发（热重载）
sam sync --watch

# 日志查看
sam logs -n HelloWorldFunction --tail
```

---

## 2. SAM 模板高级特性

### 2.1 高级函数配置

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
  # Lambda PowerTools 层
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

  # 主函数
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

  # 事件驱动函数
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

  # DynamoDB 表
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

  # SQS 队列
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

  # CloudWatch 告警
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

  # CodeDeploy Hook 函数
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

### 2.2 SAM 策略模板

```yaml
# SAM 内置策略模板
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
      
  # 自定义内联策略
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

## 3. 本地开发与调试

### 3.1 本地开发环境设置

```bash
# 1. 安装 SAM CLI
# macOS
brew tap aws/tap
brew install aws-sam-cli

# Linux
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install

# 验证安装
sam --version

# 2. 安装 Docker (用于本地测试)
# 确保 Docker 守护进程正在运行

# 3. 安装 AWS CLI
aws configure
```

### 3.2 本地调试配置

```json
// .vscode/launch.json - VS Code 调试配置
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
# 可调试的 Lambda 处理程序
import ptvsd  # VS Code 调试器

def lambda_handler(event, context):
    # 启用调试器 (仅本地开发)
    if os.environ.get('AWS_SAM_LOCAL'):
        ptvsd.enable_attach(address=('0.0.0.0', 5890))
        ptvsd.wait_for_attach()
    
    # 业务逻辑
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello!'})
    }
```

### 3.3 本地测试最佳实践

```bash
# 1. 构建
sam build

# 2. 启动本地 API 服务器
sam local start-api --env-vars env.json --debug-port 5890

# 3. 单个函数测试
sam local invoke HelloWorldFunction -e events/event.json

# 4. 生成测试事件
sam local generate-event apigateway aws-proxy > events/api-event.json

# 5. 使用 Docker 网络 (连接本地数据库)
sam local invoke HelloWorldFunction \
  --env-vars env.json \
  --docker-network host
```

---

## 4. CodePipeline 集成

### 4.1 Pipeline 架构

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

### 4.2 Buildspec 配置

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
      # 安装 SAM CLI
      - pip install aws-sam-cli
      - sam --version
      
      # 安装测试依赖
      - pip install pytest pytest-cov moto boto3

  pre_build:
    commands:
      # 代码质量检查
      - echo "Running code quality checks..."
      - pip install flake8 black
      - flake8 hello_world/ --count --select=E9,F63,F7,F82 --show-source --statistics
      - black --check hello_world/

  build:
    commands:
      # 构建 SAM 应用
      - echo "Building SAM application..."
      - sam build
      
      # 运行单元测试
      - echo "Running unit tests..."
      - cd hello_world
      - pytest tests/ -v --cov=. --cov-report=xml
      - cd ..
      
      # 打包
      - echo "Packaging SAM application..."
      - sam package --output-template-file packaged.yaml --s3-bucket $ARTIFACT_BUCKET

  post_build:
    commands:
      # 验证模板
      - echo "Validating template..."
      - sam validate --lint
      
      # 生成测试报告
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

## 5. 多环境部署策略

### 5.1 环境配置管理

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

# 开发环境
[dev.deploy.parameters]
stack_name = "my-sam-app-dev"
s3_prefix = "my-sam-app-dev"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=dev",
    "LogLevel=DEBUG",
    "EnableTracing=false"
]

# 预发布环境
[staging.deploy.parameters]
stack_name = "my-sam-app-staging"
s3_prefix = "my-sam-app-staging"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=staging",
    "LogLevel=INFO",
    "EnableTracing=true"
]

# 生产环境
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

### 5.2 部署脚本

```bash
#!/bin/bash
# deploy.sh - 多环境部署脚本

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
    # 快速同步（开发）
    sam sync --config-env $ENV --watch
    ;;
    
  delete)
    sam delete --config-env $ENV
    ;;
    
  logs)
    # 查看日志
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

## 6. 测试自动化

### 6.1 单元测试

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
    """测试 Lambda 处理程序"""
    ret = app.lambda_handler(apigw_event, lambda_context)
    
    assert ret['statusCode'] == 200
    
    data = json.loads(ret['body'])
    assert 'message' in data
    assert 'Test' in data['message']

@patch('boto3.resource')
def test_dynamodb_interaction(mock_boto, lambda_context):
    """测试 DynamoDB 交互（使用 Moto）"""
    from moto import mock_dynamodb
    
    @mock_dynamodb
    def _test():
        # 测试代码
        pass
    
    _test()
```

### 6.2 集成测试

```python
# tests/integration/test_api.py
import requests
import pytest
import os

API_ENDPOINT = os.environ.get('API_ENDPOINT', 'http://localhost:3000')

@pytest.fixture(scope='module')
def api_client():
    """API 客户端 fixture"""
    class APIClient:
        def __init__(self, base_url):
            self.base_url = base_url
        
        def get(self, path):
            return requests.get(f"{self.base_url}{path}")
        
        def post(self, path, json=None):
            return requests.post(f"{self.base_url}{path}", json=json)
    
    return APIClient(API_ENDPOINT)

def test_health_endpoint(api_client):
    """健康检查端点测试"""
    response = api_client.get('/health')
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'

def test_create_item(api_client):
    """创建项测试"""
    payload = {'name': 'Test Item', 'value': 123}
    response = api_client.post('/items', json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data['id'] is not None
    assert data['name'] == payload['name']
```

---

## 7. 生产最佳实践

### 7.1 安全清单

```yaml
# 生产环境安全配置
Globals:
  Function:
    # 最小权限原则
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
          
          # 仅允许特定资源访问
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
            Resource: !GetAtt DataTable.Arn
    
    # VPC 配置（如需要）
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
    
    # 加密
    KmsKeyArn: !Ref LambdaKMSKey
    
    # 环境变量加密
    Environment:
      Variables:
        DATABASE_URL: '{{resolve:secretsmanager:prod/db/url}}'
```

### 7.2 成本优化

```yaml
# cost-optimized-template.yaml
Globals:
  Function:
    # 使用 Graviton2 (ARM64) 节省成本
    Architectures:
      - arm64
    
    # 内存优化
    MemorySize: 256  # 根据实际使用调整
    
    # Provisioned Concurrency（仅生产环境）
    AutoPublishAlias: live
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrentExecutions: 100

Resources:
  # 使用 S3 Intelligent-Tiering
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

  # DynamoDB On-Demand（开发环境）
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST  # 开发环境
      # BillingMode: PROVISIONED   # 生产环境配合 AutoScaling
```

### 7.3 故障排除指南

```bash
# 常见问题诊断

# 1. 部署失败
sam deploy --debug  # 查看详细错误
aws cloudformation describe-stack-events --stack-name my-stack

# 2. 函数错误
sam logs -n MyFunction --tail --include-traces
aws logs tail /aws/lambda/my-function --follow

# 3. 冷启动问题
# 检查初始化代码
# 使用 Provisioned Concurrency

# 4. 权限问题
aws lambda get-policy --function-name my-function
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:role/my-role \
  --action-names dynamodb:GetItem \
  --resource-arns arn:aws:dynamodb:region:account:table/my-table

# 5. API Gateway 错误
aws apigateway get-test-invoke-method \
  --rest-api-id xxx \
  --resource-id xxx \
  --http-method GET
```

---

*Part of AWS DevTools Hero Learning Path*
*Part of Serverless Topic Integration*
