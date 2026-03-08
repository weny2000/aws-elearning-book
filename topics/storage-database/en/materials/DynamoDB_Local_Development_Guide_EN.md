# DynamoDB Local Development Guide

> Build efficient local development environments using DynamoDB Local and Testcontainers

---

## Table of Contents

1. [DynamoDB Local Overview](#1-dynamodb-local-overview)
2. [Local Development Environment Setup](#2-local-development-environment-setup)
3. [Testcontainers Integration](#3-testcontainers-integration)
4. [Testing Strategies](#4-testing-strategies)
5. [CI/CD Integration](#5-cicd-integration)
6. [CDK Integration](#6-cdk-integration)

---

## 1. DynamoDB Local Overview

### 1.1 What is DynamoDB Local

DynamoDB Local is a downloadable version of DynamoDB that supports developing and testing applications locally without accessing AWS cloud services.

```
Advantages:
├── No network connection required
├── No AWS costs
├── Fast iterative development
├── Predictable performance testing
├── Data isolation
└── Supports API compatibility testing
```

### 1.2 Runtime Mode Comparison

| Feature | DynamoDB Local | DynamoDB Cloud |
|---------|---------------|----------------|
| Cost | Free | Pay-per-use |
| Latency | <1ms | Network latency |
| Capacity Mode | Unlimited | Provisioned/On-Demand |
| Global Tables | Not supported | Supported |
| DynamoDB Streams | Supported | Supported |
| Transactions | Supported | Supported |
| TTL | Supported | Supported |

---

## 2. Local Development Environment Setup

### 2.1 Running with Docker

```bash
# Start DynamoDB Local
docker run -d \
  --name dynamodb-local \
  -p 8000:8000 \
  -v $(pwd)/dynamodb-data:/home/dynamodblocal/data \
  amazon/dynamodb-local:latest \
  -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data

# Parameter description:
# -sharedDb: All clients share the same database
# -dbPath: Data persistence path
# -inMemory: In-memory mode (data not persisted)
```

### 2.2 Docker Compose Configuration

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

  # Optional: NoSQL Workbench alternative
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
# Start services
docker-compose up -d

# Verify
curl http://localhost:8000/shell/
# Access admin interface: http://localhost:8001
```

### 2.3 Client Configuration

```python
# Python boto3 configuration
import boto3
import os

def get_dynamodb_client():
    """Get DynamoDB client (local or cloud)"""
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

# Resource approach
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

## 3. Testcontainers Integration

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
    
    # Wait for service ready
    import time
    time.sleep(2)
    
    yield container
    
    container.stop()

@pytest.fixture
def dynamodb_client(dynamodb_container):
    """DynamoDB client per test"""
    endpoint = dynamodb_container.get_endpoint()
    
    client = boto3.client(
        'dynamodb',
        endpoint_url=endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # Clean tables
    tables = client.list_tables()['TableNames']
    for table in tables:
        client.delete_table(TableName=table)
    
    yield client

@pytest.fixture
def dynamodb_resource(dynamodb_container):
    """DynamoDB resource object"""
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

### 3.2 Test Examples

```python
# tests/test_user_repository.py
import pytest
from src.repositories.user_repository import UserRepository

@pytest.fixture
def user_table(dynamodb_resource):
    """Create user table"""
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
    
    # Cleanup
    table.delete()
    table.wait_until_not_exists()

class TestUserRepository:
    def test_create_user(self, user_table, dynamodb_resource):
        """Test creating user"""
        repo = UserRepository(dynamodb_resource)
        
        user = repo.create_user({
            'userId': 'user-123',
            'email': 'test@example.com',
            'name': 'Test User'
        })
        
        assert user['userId'] == 'user-123'
        assert user['email'] == 'test@example.com'
    
    def test_get_user_by_email(self, user_table, dynamodb_resource):
        """Test querying user by email"""
        repo = UserRepository(dynamodb_resource)
        
        # Create test data
        repo.create_user({
            'userId': 'user-456',
            'email': 'findme@example.com',
            'name': 'Find Me'
        })
        
        # Query
        user = repo.get_user_by_email('findme@example.com')
        
        assert user is not None
        assert user['name'] == 'Find Me'
    
    def test_transaction_write(self, user_table, dynamodb_resource):
        """Test transaction write"""
        repo = UserRepository(dynamodb_resource)
        
        # Transaction create multiple users
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
        // Test code
    }
}
```

---

## 4. Testing Strategies

### 4.1 Testing Pyramid

```
        /\
       /  \     E2E Tests (Local API calls)
      /____\    
     /      \   Integration Tests (Repository + DynamoDB Local)
    /________\  
   /          \ Unit Tests (Mock DynamoDB)
  /____________\
```

### 4.2 Moto Mock Testing

```python
# Unit tests using Moto Mock
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
    """Unit test - Using Moto Mock"""
    # Create table
    dynamodb = boto3.resource('dynamodb', region_name='ap-northeast-1')
    
    table = dynamodb.create_table(
        TableName='Users',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    # Test
    repo = UserRepository(dynamodb)
    user = repo.create_user({'userId': 'test-123', 'name': 'Test'})
    
    assert user['userId'] == 'test-123'

def test_create_user_integration(dynamodb_resource):
    """Integration test - Using DynamoDB Local"""
    repo = UserRepository(dynamodb_resource)
    # ... test code
```

### 4.3 Performance Benchmark Testing

```python
# tests/benchmark/test_dynamodb_performance.py
import pytest
import time
from concurrent.futures import ThreadPoolExecutor

def benchmark_write_throughput(dynamodb_client, table_name):
    """Benchmark: Write throughput"""
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
    """Performance baseline test"""
    # Create test table
    dynamodb_client.create_table(
        TableName='PerformanceTest',
        KeySchema=[{'AttributeName': 'PK', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'PK', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )
    
    throughput = benchmark_write_throughput(dynamodb_client, 'PerformanceTest')
    
    # Assert local performance is good enough
    assert throughput > 500, f"Write throughput too slow: {throughput}"
```

---

## 5. CI/CD Integration

### 5.1 GitHub Actions Configuration

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

### 5.2 CodeBuild Configuration

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
      # Start DynamoDB Local
      - docker run -d --name dynamodb-local -p 8000:8000 amazon/dynamodb-local:latest -jar DynamoDBLocal.jar -inMemory -sharedDb
      - sleep 5  # Wait for startup
      
  build:
    commands:
      - export DYNAMODB_LOCAL=true
      - pytest tests/ -v --cov=src --cov-report=xml
      
reports:
  coverage:
    files:
      - coverage.xml
    file-format: COBERTURAXML
```

---

## 6. CDK Integration

### 6.1 Local Development Stack

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

### 6.2 Data Migration Script

```python
# scripts/migrate_local_to_cloud.py
"""
Migrate data from DynamoDB Local to cloud DynamoDB
"""
import boto3
import os
import json
from tqdm import tqdm

def migrate_table(table_name, local_endpoint='http://localhost:8000'):
    """Migrate single table"""
    # Local client
    local_client = boto3.client(
        'dynamodb',
        endpoint_url=local_endpoint,
        region_name='ap-northeast-1',
        aws_access_key_id='dummy',
        aws_secret_access_key='dummy'
    )
    
    # Cloud client
    cloud_client = boto3.client('dynamodb', region_name='ap-northeast-1')
    
    # Scan local table
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
    
    # Batch write to cloud
    print("Writing to cloud table...")
    with tqdm(total=len(items)) as pbar:
        for i in range(0, len(items), 25):  # BatchWrite limit 25 items
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

## 7. Best Practices Summary

### 7.1 Development Workflow

```
1. Local Development
   └── Docker Compose start DynamoDB Local
   
2. Unit Testing
   └── Moto Mock (fast)
   
3. Integration Testing
   └── Testcontainers (isolated)
   
4. Staging Validation
   └── Cloud test tables
   
5. Production Deployment
   └── Blue-green deployment
```

### 7.2 Configuration Management

```python
# src/config.py
import os

class Config:
    """Configuration management"""
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
