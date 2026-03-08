# DynamoDB ローカル開発ガイド

> DynamoDB Local と Testcontainers を使用して効率的なローカル開発環境を構築する

---

## 目次

1. [DynamoDB Local 概要](#1-dynamodb-local-概要)
2. [ローカル開発環境の構築](#2-ローカル開発環境の構築)
3. [Testcontainers 統合](#3-testcontainers-統合)
4. [テスト戦略](#4-テスト戦略)
5. [CI/CD 統合](#5-cicd-統合)
6. [CDK との統合](#6-cdk-との統合)

---

## 1. DynamoDB Local 概要

### 1.1 DynamoDB Local とは

DynamoDB Local は、DynamoDB のダウンロード可能なバージョンであり、AWS クラウドサービスにアクセスすることなく、ローカルでアプリケーションの開発とテストを行うことができます。

```
メリット:
├── ネットワーク接続が不要
├── AWS 料金が発生しない
├── 高速なイテレーティブ開発
├── 予測可能なパフォーマンステスト
├── データの分離
└── API 互換性テストのサポート
```

### 1.2 実行モードの比較

| 機能 | DynamoDB Local | DynamoDB Cloud |
|------|---------------|----------------|
| コスト | 無料 | 従量課金制 |
| レイテンシ | <1ms | ネットワークレイテンシ |
| キャパシティモード | 無制限 | Provisioned/On-Demand |
| グローバルテーブル | 非サポート | サポート |
| DynamoDB Streams | サポート | サポート |
| トランザクション | サポート | サポート |
| TTL | サポート | サポート |

---

## 2. ローカル開発環境の構築

### 2.1 Docker での実行

```bash
# DynamoDB Local の起動
docker run -d \
  --name dynamodb-local \
  -p 8000:8000 \
  -v $(pwd)/dynamodb-data:/home/dynamodblocal/data \
  amazon/dynamodb-local:latest \
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data

# パラメータ説明:
# -sharedDb: すべてのクライアントが同一データベースを共有
# -dbPath: データ永続化パス
# -inMemory: メモリモード（データは永続化されない）
```

### 2.2 Docker Compose 設定

```yaml
# docker-compose.yml
version: '3.8'

services:
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    volumes:
      - dynamodb-data:/home/dynamodblocal/data
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data"
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8000/shell/ || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 5

  dynamodb-admin:
    image: aaronshaf/dynamodb-admin:latest
    container_name: dynamodb-admin
    ports:
      - "8001:8001"
    environment:
      - DYNAMO_ENDPOINT=http://dynamodb-local:8000
    depends_on:
      dynamodb-local:
        condition: service_healthy

  # オプション: NoSQL Workbench の代替案
  dynamodb-gui:
    image: @raising/dynamodb-gui
    ports:
      - "8002:8000"
    environment:
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000

volumes:
  dynamodb-data:
```

```bash
# サービスの起動
docker-compose up -d

# 検証
curl http://localhost:8000/shell/
# 管理画面へアクセス: http://localhost:8001
```

### 2.3 クライアント設定

```python
# Python boto3 設定
import boto3
import os

def get_dynamodb_client():
    """DynamoDB クライアントの取得（ローカルまたはクラウド）"""
    is_local = os.environ.get('AWS_SAM_LOCAL') or os.environ.get('DYNAMODB_LOCAL')
    
    if is_local:
        return boto3.client(
            'dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='ap-northeast-1',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    else:
        return boto3.client('dynamodb')

# リソース方式
def get_dynamodb_resource():
    is_local = os.environ.get('DYNAMODB_LOCAL')
    
    if is_local:
        return boto3.resource(
            'dynamodb',
            endpoint_url='http://localhost:8000',
            region_name='ap-northeast-1',
            aws_access_key_id='dummy',
            aws_secret_access_key='dummy'
        )
    return boto3.resource('dynamodb')
```

```javascript
// Node.js AWS SDK v3
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

const isLocal = process.env.DYNAMODB_LOCAL === 'true';

const clientConfig = isLocal ? {
  endpoint: 'http://localhost:8000',
  region: 'ap-northeast-1',
  credentials: {
    accessKeyId: 'dummy',
    secretAccessKey: 'dummy'
  }
} : {};

const client = new DynamoDBClient(clientConfig);
export const docClient = DynamoDBDocumentClient.from(client);
```

---

## 3. Testcontainers 統合

### 3.1 Python Testcontainers

```python
# tests/conftest.py
import pytest
from testcontainers.core.container import DockerContainer
from testcontainers.core.waiting_utils import wait_for
import boto3

class DynamoDBLocalContainer(DockerContainer):
    def __init__(self):
        super().__init__("amazon/dynamodb-local:latest")
        self.with_exposed_ports(8000)
        self.with_command("-jar DynamoDBLocal.jar -inMemory -sharedDb")
    
    def get_endpoint(self):
        host = self.get_container_host_ip()
        port = self.get_exposed_port(8000)
        return f"http://{host}:{port}"

@pytest.fixture(scope="session")
def dynamodb_container():
    """Session スコープの DynamoDB Local コンテナ"""
    container = DynamoDBLocalContainer()
    container.start()
    
    # サービス準備完了まで待機
    import time
    time.sleep(2)
    
    yield container
    
    container.stop()

@pytest.fixture
def dynamodb_client(dynamodb_container):
    """各テスト用の DynamoDB クライアント"""
    endpoint = dynamodb_container.get_endpoint()
    
    client = boto3.client(
        'dynamodb',
        endpoint_url=endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # テーブルのクリーンアップ
    tables = client.list_tables()['TableNames']
    for table in tables:
        client.delete_table(TableName=table)
    
    yield client

@pytest.fixture
def dynamodb_resource(dynamodb_container):
    """DynamoDB リソースオブジェクト"""
    endpoint = dynamodb_container.get_endpoint()
    
    resource = boto3.resource(
        'dynamodb',
        endpoint_url=endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    yield resource
```

### 3.2 テスト例

```python
# tests/test_user_repository.py
import pytest
from src.repositories.user_repository import UserRepository

@pytest.fixture
def user_table(dynamodb_resource):
    """ユーザーテーブルの作成"""
    table = dynamodb_resource.create_table(
        TableName='Users',
        KeySchema=[
            {'AttributeName': 'PK', 'KeyType': 'HASH'},
            {'AttributeName': 'SK', 'KeyType': 'RANGE'}
        ],
        AttributeDefinitions=[
            {'AttributeName': 'PK', 'AttributeType': 'S'},
            {'AttributeName': 'SK', 'AttributeType': 'S'},
            {'AttributeName': 'Email', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[
            {
                'IndexName': 'EmailIndex',
                'KeySchema': [
                    {'AttributeName': 'Email', 'KeyType': 'HASH'}
                ],
                'Projection': {'ProjectionType': 'ALL'}
            }
        ],
        BillingMode='PAY_PER_REQUEST'
    )
    
    table.wait_until_exists()
    yield table
    
    # クリーンアップ
    table.delete()
    table.wait_until_not_exists()

class TestUserRepository:
    def test_create_user(self, user_table, dynamodb_resource):
        """ユーザー作成のテスト"""
        repo = UserRepository(dynamodb_resource)
        
        user = repo.create_user({
            'userId': 'user-123',
            'email': 'test@example.com',
            'name': 'Test User'
        })
        
        assert user['userId'] == 'user-123'
        assert user['email'] == 'test@example.com'
    
    def test_get_user_by_email(self, user_table, dynamodb_resource):
        """メールアドレスによるユーザー検索のテスト"""
        repo = UserRepository(dynamodb_resource)
        
        # テストデータの作成
        repo.create_user({
            'userId': 'user-456',
            'email': 'findme@example.com',
            'name': 'Find Me'
        })
        
        # 検索
        user = repo.get_user_by_email('findme@example.com')
        
        assert user is not None
        assert user['name'] == 'Find Me'
    
    def test_transaction_write(self, user_table, dynamodb_resource):
        """トランザクション書き込みのテスト"""
        repo = UserRepository(dynamodb_resource)
        
        # 複数ユーザーのトランザクション作成
        users = [
            {'userId': 'user-1', 'email': 'user1@example.com'},
            {'userId': 'user-2', 'email': 'user2@example.com'}
        ]
        
        result = repo.batch_create_users(users)
        assert result['ProcessedItems'] == 2
```

### 3.3 Java Testcontainers

```java
// src/test/java/com/example/DynamoDBLocalTest.java
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.net.URI;

@Testcontainers
public class DynamoDBLocalTest {
    
    @Container
    public static GenericContainer dynamoDBLocal = new GenericContainer<>("amazon/dynamodb-local:latest")
        .withExposedPorts(8000)
        .withCommand("-jar DynamoDBLocal.jar -inMemory -sharedDb");
    
    private DynamoDbClient client;
    
    @BeforeEach
    void setUp() {
        String endpoint = String.format("http://%s:%d",
            dynamoDBLocal.getHost(),
            dynamoDBLocal.getFirstMappedPort()
        );
        
        client = DynamoDbClient.builder()
            .region(Region.AP_NORTHEAST_1)
            .endpointOverride(URI.create(endpoint))
            .build();
    }
    
    @Test
    void testCreateTable() {
        // テストコード
    }
}
```

---

## 4. テスト戦略

### 4.1 テストピラミッド

```
        /\
       /  \     E2E テスト (ローカル API 呼び出し)
      /____\    
     /      \   統合テスト (Repository + DynamoDB Local)
    /________\  
   /          \ ユニットテスト (Mock DynamoDB)
  /____________\
```

### 4.2 Moto Mock テスト

```python
# ユニットテストで Moto Mock を使用
import pytest
from moto import mock_dynamodb
import boto3
from src.repositories.user_repository import UserRepository

@pytest.fixture
def mocked_dynamodb():
    """Moto mock fixture"""
    with mock_dynamodb():
        yield boto3.resource('dynamodb', region_name='ap-northeast-1')

@mock_dynamodb
def test_create_user_unit():
    """ユニットテスト - Moto Mock を使用"""
    # テーブル作成
    dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')
    
    table = dynamodb.create_table(
        TableName='Users',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # テスト
    repo = UserRepository(dynamodb)
    user = repo.create_user({'userId': 'test-123', 'name': 'Test'})
    
    assert user['userId'] == 'test-123'

def test_create_user_integration(dynamodb_resource):
    """統合テスト - DynamoDB Local を使用"""
    repo = UserRepository(dynamodb_resource)
    # ... テストコード
```

### 4.3 パフォーマンスベンチマークテスト

```python
# tests/benchmark/test_dynamodb_performance.py
import pytest
import time
from concurrent.futures import ThreadPoolExecutor

def benchmark_write_throughput(dynamodb_client, table_name):
    """ベンチマーク: 書き込みスループット"""
    items = [
        {
            'PK': {'S': f'USER#{i}'},
            'SK': {'S': 'PROFILE'},
            'Data': {'S': 'x' * 1000}
        }
        for i in range(1000)
    ]
    
    start = time.time()
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(
                dynamodb_client.put_item,
                TableName=table_name,
                Item=item
            )
            for item in items
        ]
        for f in futures:
            f.result()
    
    elapsed = time.time() - start
    throughput = len(items) / elapsed
    
    print(f"Write throughput: {throughput:.2f} items/sec")
    return throughput

def test_performance_baseline(dynamodb_client):
    """パフォーマンスベースラインテスト"""
    # テストテーブルの作成
    dynamodb_client.create_table(
        TableName='PerformanceTest',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    throughput = benchmark_write_throughput(dynamodb_client, 'PerformanceTest')
    
    # ローカルパフォーマンスが十分良好であることを確認
    assert throughput > 500, f"Write throughput too slow: {throughput}"
```

---

## 5. CI/CD 統合

### 5.1 GitHub Actions 設定

```yaml
# .github/workflows/test.yml
name: Test with DynamoDB Local

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      dynamodb-local:
        image: amazon/dynamodb-local:latest
        ports:
          - 8000:8000
        options: >-
          --workdir /home/dynamodblocal
          --entrypoint java
          --health-cmd "curl -f http://localhost:8000/shell/ || exit 1"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r requirements.txt
        pip install pytest pytest-cov
    
    - name: Run tests
      env:
        DYNAMODB_LOCAL: true
        DYNAMODB_ENDPOINT: http://localhost:8000
      run: |
        pytest tests/ -v --cov=src --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
```

### 5.2 CodeBuild 設定

```yaml
# buildspec-test.yml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install -r requirements.txt
      - pip install pytest pytest-cov
      
  pre_build:
    commands:
      # DynamoDB Local の起動
      - docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -inMemory -sharedDb
      - sleep 5  # 起動待機
      
  build:
    commands:
      - export DYNAMODB_LOCAL=true
      - pytest tests/ -v --cov=src --cov-report=xml
      
eports:
  coverage:
    files:
      - coverage.xml
    file-format: COBERTURAXML
```

---

## 6. CDK との統合

### 6.1 ローカル開発スタック

```typescript
// lib/local-dev-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class LocalDevStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ローカル開発用 VPC
    const vpc = new ec2.Vpc(this, 'LocalDevVpc', {
      maxAzs: 2,
    });

    // DynamoDB Local を実行する ECS クラスター
    const cluster = new ecs.Cluster(this, 'LocalCluster', {
      vpc,
    });

    // Fargate サービスとしての DynamoDB Local
    const taskDef = new ecs.FargateTaskDefinition(this, 'DynamoDBTask', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    taskDef.addContainer('dynamodb-local', {
      image: ecs.ContainerImage.fromRegistry('amazon/dynamodb-local:latest'),
      portMappings: [{ containerPort: 8000 }],
      command: ['-jar', 'DynamoDBLocal.jar', '-inMemory', '-sharedDb'],
    });

    new ecs.FargateService(this, 'DynamoDBService', {
      cluster,
      taskDefinition: taskDef,
      assignPublicIp: true,
      desiredCount: 1,
    });

    // 本番用 DynamoDB テーブル
    const table = new dynamodb.Table(this, 'UsersTable', {
      tableName: 'Users',
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    table.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'Email', type: dynamodb.AttributeType.STRING },
    });
  }
}
```

### 6.2 データ移行スクリプト

```python
# scripts/migrate_local_to_cloud.py
"""
DynamoDB Local からクラウド DynamoDB へのデータ移行
"""
import boto3
import os
import json
from tqdm import tqdm

def migrate_table(table_name, local_endpoint='http://localhost:8000'):
    """単一テーブルの移行"""
    # ローカルクライアント
    local_client = boto3.client(
        'dynamodb',
        endpoint_url=local_endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # クラウドクライアント
    cloud_client = boto3.client('dynamodb', region_name='ap-northeast-1')
    
    # ローカルテーブルのスキャン
    print(f"Scanning local table: {table_name}")
    items = []
    response = local_client.scan(TableName=table_name)
    items.extend(response['Items'])
    
    while 'LastEvaluatedKey' in response:
        response = local_client.scan(
            TableName=table_name,
            ExclusiveStartKey=response['LastEvaluatedKey']
        )
        items.extend(response['Items'])
    
    print(f"Found {len(items)} items")
    
    # クラウドへの一括書き込み
    print("Writing to cloud table...")
    with tqdm(total=len(items)) as pbar:
        for i in range(0, len(items), 25):  # BatchWrite 制限 25 項目
            batch = items[i:i+25]
            
            cloud_client.batch_write_item(
                RequestItems={
                    table_name: [
                        {'PutRequest': {'Item': item}}
                        for item in batch
                    ]
                }
            )
            pbar.update(len(batch))
    
    print("Migration complete!")

if __name__ == '__main__':
    import sys
    table_name = sys.argv[1] if len(sys.argv) > 1 else 'Users'
    migrate_table(table_name)
```

---

## 7. ベストプラクティスまとめ

### 7.1 開発ワークフロー

```
1. ローカル開発
   └── Docker Compose で DynamoDB Local を起動
   
2. ユニットテスト
   └── Moto Mock (高速)
   
3. 統合テスト
   └── Testcontainers (分離)
   
4. ステージング検証
   └── クラウドテストテーブル
   
5. 本番デプロイ
   └── ブルー/グリーンデプロイメント
```

### 7.2 設定管理

```python
# src/config.py
import os

class Config:
    """設定管理"""
    DYNAMODB_ENDPOINT = os.environ.get('DYNAMODB_ENDPOINT')
    DYNAMODB_REGION = os.environ.get('AWS_REGION', 'ap-northeast-1')
    
    @classmethod
    def is_local(cls):
        return cls.DYNAMODB_ENDPOINT is not None
    
    @classmethod
    def get_dynamodb_config(cls):
        config = {'region_name': cls.DYNAMODB_REGION}
        
        if cls.is_local():
            config['endpoint_url'] = cls.DYNAMODB_ENDPOINT
            config['aws_access_key_id'] = 'dummy'
            config['aws_secret_access_key'] = 'dummy'
        
        return config
```

---

*Part of AWS DevTools Hero Learning Path*
*Part of Storage-Database Topic Integration*
