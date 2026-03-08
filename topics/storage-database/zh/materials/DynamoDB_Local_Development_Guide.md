# DynamoDB 本地开发指南

> 使用 DynamoDB Local 和 Testcontainers 构建高效的本地开发环境

---

## 目录

1. [DynamoDB Local 概述](#1-dynamodb-local-概述)
2. [本地开发环境搭建](#2-本地开发环境搭建)
3. [Testcontainers 集成](#3-testcontainers-集成)
4. [测试策略](#4-测试策略)
5. [CI/CD 集成](#5-cicd-集成)
6. [与 CDK 集成](#6-与-cdk-集成)

---

## 1. DynamoDB Local 概述

### 1.1 什么是 DynamoDB Local

DynamoDB Local 是 DynamoDB 的可下载版本，支持在本地开发和测试应用程序，无需访问 AWS 云服务。

```
优势:
├── 无需网络连接
├── 无 AWS 费用
├── 快速迭代开发
├── 可预测的性能测试
├── 数据隔离
└── 支持 API 兼容性测试
```

### 1.2 运行模式对比

| 特性 | DynamoDB Local | DynamoDB Cloud |
|------|---------------|----------------|
| 成本 | 免费 | 按使用量付费 |
| 延迟 | <1ms | 网络延迟 |
| 容量模式 | 无限制 | Provisioned/On-Demand |
| 全局表 | 不支持 | 支持 |
| DynamoDB Streams | 支持 | 支持 |
| 事务 | 支持 | 支持 |
| TTL | 支持 | 支持 |

---

## 2. 本地开发环境搭建

### 2.1 Docker 方式运行

```bash
# 启动 DynamoDB Local
docker run -d \
  --name dynamodb-local \
  -p 8000:8000 \
  -v $(pwd)/dynamodb-data:/home/dynamodblocal/data \
  amazon/dynamodb-local:latest \
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data

# 参数说明:
# -sharedDb: 所有客户端共享同一数据库
# -dbPath: 数据持久化路径
# -inMemory: 内存模式（数据不持久化）
```

### 2.2 Docker Compose 配置

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

  # 可选: NoSQL Workbench 替代方案
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
# 启动服务
docker-compose up -d

# 验证
curl http://localhost:8000/shell/
# 访问管理界面: http://localhost:8001
```

### 2.3 客户端配置

```python
# Python boto3 配置
import boto3
import os

def get_dynamodb_client():
    """获取 DynamoDB 客户端（本地或云端）"""
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

# 资源方式
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

## 3. Testcontainers 集成

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
    """Session-scoped DynamoDB Local container"""
    container = DynamoDBLocalContainer()
    container.start()
    
    # 等待服务就绪
    import time
    time.sleep(2)
    
    yield container
    
    container.stop()

@pytest.fixture
def dynamodb_client(dynamodb_container):
    """每个测试的 DynamoDB 客户端"""
    endpoint = dynamodb_container.get_endpoint()
    
    client = boto3.client(
        'dynamodb',
        endpoint_url=endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # 清理表
    tables = client.list_tables()['TableNames']
    for table in tables:
        client.delete_table(TableName=table)
    
    yield client

@pytest.fixture
def dynamodb_resource(dynamodb_container):
    """DynamoDB 资源对象"""
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

### 3.2 测试示例

```python
# tests/test_user_repository.py
import pytest
from src.repositories.user_repository import UserRepository

@pytest.fixture
def user_table(dynamodb_resource):
    """创建用户表"""
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
    
    # 清理
    table.delete()
    table.wait_until_not_exists()

class TestUserRepository:
    def test_create_user(self, user_table, dynamodb_resource):
        """测试创建用户"""
        repo = UserRepository(dynamodb_resource)
        
        user = repo.create_user({
            'userId': 'user-123',
            'email': 'test@example.com',
            'name': 'Test User'
        })
        
        assert user['userId'] == 'user-123'
        assert user['email'] == 'test@example.com'
    
    def test_get_user_by_email(self, user_table, dynamodb_resource):
        """测试通过邮箱查询用户"""
        repo = UserRepository(dynamodb_resource)
        
        # 创建测试数据
        repo.create_user({
            'userId': 'user-456',
            'email': 'findme@example.com',
            'name': 'Find Me'
        })
        
        # 查询
        user = repo.get_user_by_email('findme@example.com')
        
        assert user is not None
        assert user['name'] == 'Find Me'
    
    def test_transaction_write(self, user_table, dynamodb_resource):
        """测试事务写入"""
        repo = UserRepository(dynamodb_resource)
        
        # 事务创建多个用户
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
        // 测试代码
    }
}
```

---

## 4. 测试策略

### 4.1 测试金字塔

```
        /\
       /  \     E2E 测试 (本地 API 调用)
      /____\    
     /      \   集成测试 (Repository + DynamoDB Local)
    /________\  
   /          \ 单元测试 (Mock DynamoDB)
  /____________\
```

### 4.2 Moto Mock 测试

```python
# 单元测试使用 Moto Mock
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
    """单元测试 - 使用 Moto Mock"""
    # 创建表
    dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')
    
    table = dynamodb.create_table(
        TableName='Users',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # 测试
    repo = UserRepository(dynamodb)
    user = repo.create_user({'userId': 'test-123', 'name': 'Test'})
    
    assert user['userId'] == 'test-123'

def test_create_user_integration(dynamodb_resource):
    """集成测试 - 使用 DynamoDB Local"""
    repo = UserRepository(dynamodb_resource)
    # ... 测试代码
```

### 4.3 性能基准测试

```python
# tests/benchmark/test_dynamodb_performance.py
import pytest
import time
from concurrent.futures import ThreadPoolExecutor

def benchmark_write_throughput(dynamodb_client, table_name):
    """基准测试: 写入吞吐量"""
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
    """性能基线测试"""
    # 创建测试表
    dynamodb_client.create_table(
        TableName='PerformanceTest',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    throughput = benchmark_write_throughput(dynamodb_client, 'PerformanceTest')
    
    # 断言本地性能足够好
    assert throughput > 500, f"Write throughput too slow: {throughput}"
```

---

## 5. CI/CD 集成

### 5.1 GitHub Actions 配置

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

### 5.2 CodeBuild 配置

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
      # 启动 DynamoDB Local
      - docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -inMemory -sharedDb
      - sleep 5  # 等待启动
      
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

## 6. 与 CDK 集成

### 6.1 本地开发堆栈

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

    // VPC for local development
    const vpc = new ec2.Vpc(this, 'LocalDevVpc', {
      maxAzs: 2,
    });

    // ECS Cluster for running DynamoDB Local
    const cluster = new ecs.Cluster(this, 'LocalCluster', {
      vpc,
    });

    // DynamoDB Local as Fargate service
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

    // Production DynamoDB Table
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

### 6.2 数据迁移脚本

```python
# scripts/migrate_local_to_cloud.py
"""
从 DynamoDB Local 迁移数据到云端 DynamoDB
"""
import boto3
import os
import json
from tqdm import tqdm

def migrate_table(table_name, local_endpoint='http://localhost:8000'):
    """迁移单个表"""
    # 本地客户端
    local_client = boto3.client(
        'dynamodb',
        endpoint_url=local_endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # 云端客户端
    cloud_client = boto3.client('dynamodb', region_name='ap-northeast-1')
    
    # 扫描本地表
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
    
    # 批量写入云端
    print("Writing to cloud table...")
    with tqdm(total=len(items)) as pbar:
        for i in range(0, len(items), 25):  # BatchWrite 限制 25 项
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

## 7. 最佳实践总结

### 7.1 开发工作流

```
1. 本地开发
   └── Docker Compose 启动 DynamoDB Local
   
2. 单元测试
   └── Moto Mock (快速)
   
3. 集成测试
   └── Testcontainers (隔离)
   
4. 预发布验证
   └── 云端测试表
   
5. 生产部署
   └── 蓝绿部署
```

### 7.2 配置管理

```python
# src/config.py
import os

class Config:
    """配置管理"""
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
