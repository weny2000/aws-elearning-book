# AWS SAM + CI/CD 完全ガイド

> SAM と CodePipeline を使用して Serverless アプリケーションを構築する完全な DevOps 実践

---

## 目次

1. [SAM 概要とコアコンセプト](#1-sam-概要とコアコンセプト)
2. [SAM テンプレートの高度な機能](#2-sam-テンプレートの高度な機能)
3. [ローカル開発とデバッグ](#3-ローカル開発とデバッグ)
4. [CodePipeline 統合](#4-codepipeline-統合)
5. [マルチ環境デプロイ戦略](#5-マルチ環境デプロイ戦略)
6. [テスト自動化](#6-テスト自動化)
7. [本番環境のベストプラクティス](#7-本番環境のベストプラクティス)

---

## 1. SAM 概要とコアコンセプト

### 1.1 SAM とは

AWS Serverless Application Model (SAM) は、AWS 上でサーバーレスアプリケーションを構築するためのオープンソースフレームワークです。AWS CloudFormation を拡張し、Serverless リソースを定義するための簡略化された構文を提供します。

```yaml
# template.yaml - 最小限の SAM アプリケーション
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

### 1.2 SAM と CDK の選択ガイド

| シナリオ | 推奨 | 理由 |
|------|------|------|
| 迅速なプロトタイピング | SAM | 学習曲線が低く、テンプレートが簡潔です |
| 複雑なアーキテクチャ | CDK | プログラミング言語の表現力が高いです |
| チームが CloudFormation を熟知 | SAM | シームレスに移行できます |
| マルチ言語チーム | CDK | TypeScript/Python/Java などが利用可能です |
| シンプルな Lambda アプリケーション | SAM | 最小限のボイラープレートコードです |

### 1.3 SAM CLI コアコマンド

```bash
# プロジェクトを初期化
sam init --runtime python3.11 --name my-app --app-template hello-world

# ローカルビルド
sam build

# ローカルテスト
sam local invoke HelloWorldFunction -e events/event.json

# ローカル API サーバー
sam local start-api

# デプロイ
deploy guided
sam deploy --guided

# 同期開発（ホットリロード）
sam sync --watch

# ログ表示
sam logs -n HelloWorldFunction --tail
```

---

## 2. SAM テンプレートの高度な機能

### 2.1 高度な関数設定

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Globals:
  Function:
    Timeout: 30
    Runtime: python3.11
    MemorySize: 512
    Architectures:
      - arm64  # Graviton2 でコスト最適化
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
  # Lambda PowerTools レイヤー
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

  # メイン関数
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

  # イベント駆動関数
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

  # DynamoDB テーブル
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

  # SQS キュー
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
      MessageRetentionPeriod: 1209600  # 14 日間

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

  # CloudWatch アラーム
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

  # CodeDeploy Hook 関数
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

### 2.2 SAM ポリシーテンプレート

```yaml
# SAM 組み込みポリシーテンプレート
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
      
  # カスタムインラインポリシー
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

## 3. ローカル開発とデバッグ

### 3.1 ローカル開発環境のセットアップ

```bash
# 1. SAM CLI をインストール
# macOS
brew tap aws/tap
brew install aws-sam-cli

# Linux
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install

# インストールを確認
sam --version

# 2. Docker をインストール（ローカルテスト用）
# Docker デーモンが実行中であることを確認します

# 3. AWS CLI をインストール
aws configure
```

### 3.2 ローカルデバッグ設定

```json
// .vscode/launch.json - VS Code デバッグ設定
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
# デバッグ可能な Lambda ハンドラー
import ptvsd  # VS Code デバッガー

def lambda_handler(event, context):
    # デバッガーを有効化（ローカル開発のみ）
    if os.environ.get('AWS_SAM_LOCAL'):
        ptvsd.enable_attach(address=('0.0.0.0', 5890))
        ptvsd.wait_for_attach()
    
    # ビジネスロジック
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello!'})
    }
```

### 3.3 ローカルテストのベストプラクティス

```bash
# 1. ビルド
sam build

# 2. ローカル API サーバーを起動
sam local start-api --env-vars env.json --debug-port 5890

# 3. 個別関数のテスト
sam local invoke HelloWorldFunction -e events/event.json

# 4. テストイベントを生成
sam local generate-event apigateway aws-proxy > events/api-event.json

# 5. Docker ネットワークを使用（ローカルデータベースに接続）
sam local invoke HelloWorldFunction \
  --env-vars env.json \
  --docker-network host
```

---

## 4. CodePipeline 統合

### 4.1 Pipeline アーキテクチャ

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
  # アーティファクト用 S3 バケット
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

  # CodeBuild プロジェクト - ビルドとテスト
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

### 4.2 Buildspec 設定

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
      # SAM CLI をインストール
      - pip install aws-sam-cli
      - sam --version
      
      # テスト依存関係をインストール
      - pip install pytest pytest-cov moto boto3

  pre_build:
    commands:
      # コード品質チェック
      - echo "Running code quality checks..."
      - pip install flake8 black
      - flake8 hello_world/ --count --select=E9,F63,F7,F82 --show-source --statistics
      - black --check hello_world/

  build:
    commands:
      # SAM アプリケーションをビルド
      - echo "Building SAM application..."
      - sam build
      
      # 単体テストを実行
      - echo "Running unit tests..."
      - cd hello_world
      - pytest tests/ -v --cov=. --cov-report=xml
      - cd ..
      
      # パッケージング
      - echo "Packaging SAM application..."
      - sam package --output-template-file packaged.yaml --s3-bucket $ARTIFACT_BUCKET

  post_build:
    commands:
      # テンプレートを検証
      - echo "Validating template..."
      - sam validate --lint
      
      # テストレポートを生成
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

## 5. マルチ環境デプロイ戦略

### 5.1 環境設定管理

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

# 開発環境
[dev.deploy.parameters]
stack_name = "my-sam-app-dev"
s3_prefix = "my-sam-app-dev"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=dev",
    "LogLevel=DEBUG",
    "EnableTracing=false"
]

# ステージング環境
[staging.deploy.parameters]
stack_name = "my-sam-app-staging"
s3_prefix = "my-sam-app-staging"
region = "ap-northeast-1"
parameter_overrides = [
    "Environment=staging",
    "LogLevel=INFO",
    "EnableTracing=true"
]

# 本番環境
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

### 5.2 デプロイスクリプト

```bash
#!/bin/bash
# deploy.sh - マルチ環境デプロイスクリプト

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
    # 高速同期（開発用）
    sam sync --config-env $ENV --watch
    ;;
    
  delete)
    sam delete --config-env $ENV
    ;;
    
  logs)
    # ログを表示
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

## 6. テスト自動化

### 6.1 単体テスト

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
    """Lambda ハンドラーをテスト"""
    ret = app.lambda_handler(apigw_event, lambda_context)
    
    assert ret['statusCode'] == 200
    
    data = json.loads(ret['body'])
    assert 'message' in data
    assert 'Test' in data['message']

@patch('boto3.resource')
def test_dynamodb_interaction(mock_boto, lambda_context):
    """DynamoDB 相互作用をテスト（Moto を使用）"""
    from moto import mock_dynamodb
    
    @mock_dynamodb
    def _test():
        # テストコード
        pass
    
    _test()
```

### 6.2 統合テスト

```python
# tests/integration/test_api.py
import requests
import pytest
import os

API_ENDPOINT = os.environ.get('API_ENDPOINT', 'http://localhost:3000')

@pytest.fixture(scope='module')
def api_client():
    """API クライアント fixture"""
    class APIClient:
        def __init__(self, base_url):
            self.base_url = base_url
        
        def get(self, path):
            return requests.get(f"{self.base_url}{path}")
        
        def post(self, path, json=None):
            return requests.post(f"{self.base_url}{path}", json=json)
    
    return APIClient(API_ENDPOINT)

def test_health_endpoint(api_client):
    """ヘルスチェックエンドポイントのテスト"""
    response = api_client.get('/health')
    
    assert response.status_code == 200
    data = response.json()
    assert data['status'] == 'healthy'

def test_create_item(api_client):
    """アイテム作成テスト"""
    payload = {'name': 'Test Item', 'value': 123}
    response = api_client.post('/items', json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data['id'] is not None
    assert data['name'] == payload['name']
```

---

## 7. 本番環境のベストプラクティス

### 7.1 セキュリティチェックリスト

```yaml
# 本番環境のセキュリティ設定
Globals:
  Function:
    # 最小権限の原則
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - logs:CreateLogGroup
              - logs:CreateLogStream
              - logs:PutLogEvents
            Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
          
          # 特定リソースのみにアクセス許可
          - Effect: Allow
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
            Resource: !GetAtt DataTable.Arn
    
    # VPC 設定（必要な場合）
    VpcConfig:
      SecurityGroupIds:
        - !Ref LambdaSecurityGroup
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
    
    # 暗号化
    KmsKeyArn: !Ref LambdaKMSKey
    
    # 環境変数の暗号化
    Environment:
      Variables:
        DATABASE_URL: '{{resolve:secretsmanager:prod/db/url}}'
```

### 7.2 コスト最適化

```yaml
# cost-optimized-template.yaml
Globals:
  Function:
    # Graviton2 (ARM64) を使用してコストを削減
    Architectures:
      - arm64
    
    # メモリ最適化
    MemorySize: 256  # 実際の使用状況に応じて調整
    
    # Provisioned Concurrency（本番環境のみ）
    AutoPublishAlias: live
    ProvisionedConcurrencyConfig:
      ProvisionedConcurrentExecutions: 100

Resources:
  # S3 Intelligent-Tiering を使用
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

  # DynamoDB On-Demand（開発環境）
  DataTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST  # 開発環境
      # BillingMode: PROVISIONED   # 本番環境で AutoScaling と組み合わせて使用
```

### 7.3 トラブルシューティングガイド

```bash
# よくある問題の診断

# 1. デプロイ失敗
sam deploy --debug  # 詳細なエラーを表示
aws cloudformation describe-stack-events --stack-name my-stack

# 2. 関数エラー
sam logs -n MyFunction --tail --include-traces
aws logs tail /aws/lambda/my-function --follow

# 3. コールドスタート問題
# 初期化コードを確認
# Provisioned Concurrency を使用

# 4. 権限問題
aws lambda get-policy --function-name my-function
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::account:role/my-role \
  --action-names dynamodb:GetItem \
  --resource-arns arn:aws:dynamodb:region:account:table/my-table

# 5. API Gateway エラー
aws apigateway get-test-invoke-method \
  --rest-api-id xxx \
  --resource-id xxx \
  --http-method GET
```

---

*AWS DevTools Hero Learning Path の一部*
*Serverless Topic Integration の一部*
