# Amazon S3 完全指南

> 从入门到精通的 S3 使用手册

---

## 目录

1. [S3 核心概念](#核心概念)
2. [存储类别详解](#存储类别详解)
3. [安全最佳实践](#安全最佳实践)
4. [性能优化](#性能优化)
5. [成本管理](#成本管理)
6. [常见使用场景](#常见使用场景)

---

## 核心概念

### Bucket 命名规则

```
✅ 有效名称:
- my-unique-bucket-2024
- company.data.storage
- logs.us-east-1.production

❌ 无效名称:
- MyBucket (大写字母)
- bucket_name (下划线)
- 192.168.1.1 (IP地址格式)
- bucket..name (连续点号)
```

**命名最佳实践**:
- 使用环境前缀: `prod-`, `dev-`, `test-`
- 使用区域后缀: `-us-east-1`, `-eu-west-1`
- 使用应用名称: `webapp-`, `api-`, `analytics-`

### 对象元数据

```python
import boto3

s3 = boto3.client('s3')

# 上传带元数据的对象
s3.put_object(
    Bucket='my-bucket',
    Key='documents/report.pdf',
    Body=file_content,
    Metadata={
        'department': 'finance',
        'project': 'q4-report',
        'classification': 'confidential',
        'retention-years': '7'
    },
    ContentType='application/pdf',
    ContentDisposition='attachment; filename="report.pdf"'
)
```

---

## 存储类别详解

### 选择决策流程

```mermaid
flowchart TD
    A[数据访问频率?] -->|频繁| B[S3 Standard]
    A -->|不频繁| C{可接受检索延迟?}
    A -->|归档| D{保存时长?}
    
    C -->|< 毫秒| E[S3 Standard-IA]
    C -->|分钟级| F[S3 Glacier Instant Retrieval]
    
    D -->|< 1年| G[S3 Glacier Flexible]
    D -->|> 1年| H[S3 Glacier Deep Archive]
    
    I[访问模式未知?] -->|是| J[S3 Intelligent-Tiering]
```

### Intelligent-Tiering 配置

```python
import boto3

s3 = boto3.client('s3')

# 启用自动归档
s3.put_bucket_intelligent_tiering_configuration(
    Bucket='my-data-lake',
    Id='DeepArchiveArchive',
    IntelligentTieringConfiguration={
        'Status': 'Enabled',
        'Tierings': [
            {
                'Days': 90,
                'AccessTier': 'ARCHIVE_ACCESS'  # 90天后归档
            },
            {
                'Days': 180,
                'AccessTier': 'DEEP_ARCHIVE_ACCESS'  # 180天后深度归档
            }
        ],
        'Filter': {
            'Prefix': 'logs/',
            'Tag': {
                'Key': 'Archive',
                'Value': 'true'
            }
        }
    }
)
```

---

## 安全最佳实践

### Bucket Policy 模板

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EnforceSSLOnly",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::secure-bucket",
                "arn:aws:s3:::secure-bucket/*"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        },
        {
            "Sid": "DenyUnencryptedUploads",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::secure-bucket/*",
            "Condition": {
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "aws:kms"
                }
            }
        },
        {
            "Sid": "AllowSpecificVPCOnly",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::secure-bucket",
                "arn:aws:s3:::secure-bucket/*"
            ],
            "Condition": {
                "StringNotEquals": {
                    "aws:VpcSourceIp": [
                        "10.0.0.0/8",
                        "172.16.0.0/12"
                    ]
                }
            }
        }
    ]
}
```

### 预签名 URL 安全

```python
import boto3
from datetime import timedelta

s3 = boto3.client('s3')

# 生成安全的临时访问 URL
def generate_secure_url(bucket, key, expiration_minutes=15):
    """
    生成安全的预签名 URL
    - 短有效期 (默认15分钟)
    - 仅允许特定 IP
    - 强制 HTTPS
    """
    url = s3.generate_presigned_url(
        'get_object',
        Params={
            'Bucket': bucket,
            'Key': key,
            'ResponseContentDisposition': 'attachment'
        },
        ExpiresIn=expiration_minutes * 60
    )
    return url

# 带 IP 限制的 URL (需要结合 CloudFront 或 Lambda@Edge)
def generate_restricted_url(bucket, key, allowed_ip):
    """生成带 IP 限制的访问 URL"""
    # 实际实现需要结合 CloudFront Signed URLs
    # 或 Lambda@Edge 进行实时验证
    pass
```

---

## 性能优化

### 多部分上传最佳实践

```python
import boto3
from concurrent.futures import ThreadPoolExecutor
import os

s3 = boto3.client('s3')

def multipart_upload_with_progress(file_path, bucket, key):
    """带进度跟踪的多部分上传"""
    
    file_size = os.path.getsize(file_path)
    part_size = 100 * 1024 * 1024  # 100MB 分段
    
    # 初始化上传
    mpu = s3.create_multipart_upload(
        Bucket=bucket,
        Key=key,
        ServerSideEncryption='aws:kms'
    )
    upload_id = mpu['UploadId']
    
    parts = []
    part_number = 1
    
    try:
        with open(file_path, 'rb') as f:
            while True:
                data = f.read(part_size)
                if not data:
                    break
                
                # 上传分段
                response = s3.upload_part(
                    Bucket=bucket,
                    Key=key,
                    UploadId=upload_id,
                    PartNumber=part_number,
                    Body=data
                )
                
                parts.append({
                    'PartNumber': part_number,
                    'ETag': response['ETag']
                })
                
                progress = (part_number * part_size / file_size) * 100
                print(f"上传进度: {min(progress, 100):.2f}%")
                part_number += 1
        
        # 完成上传
        s3.complete_multipart_upload(
            Bucket=bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        
        print("上传完成!")
        
    except Exception as e:
        # 中止上传
        s3.abort_multipart_upload(
            Bucket=bucket,
            Key=key,
            UploadId=upload_id
        )
        raise e

# 并发上传多个文件
def concurrent_uploads(file_list, bucket):
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(multipart_upload_with_progress, f, bucket, os.path.basename(f))
            for f in file_list
        ]
        for future in futures:
            future.result()
```

### S3 Select 优化查询

```python
# 使用 S3 Select 查询 CSV/JSON 而不下载完整文件
import boto3

s3 = boto3.client('s3')

def query_large_csv(bucket, key, query):
    """使用 S3 Select 查询大文件"""
    
    response = s3.select_object_content(
        Bucket=bucket,
        Key=key,
        Expression=query,
        ExpressionType='SQL',
        InputSerialization={
            'CSV': {
                'FileHeaderInfo': 'USE',
                'RecordDelimiter': '\n',
                'FieldDelimiter': ','
            }
        },
        OutputSerialization={
            'JSON': {
                'RecordDelimiter': '\n'
            }
        }
    )
    
    results = []
    for event in response['Payload']:
        if 'Records' in event:
            records = event['Records']['Payload'].decode('utf-8')
            results.extend(records.strip().split('\n'))
    
    return results

# 示例查询
results = query_large_csv(
    'data-lake-bucket',
    'sales/2024.csv',
    "SELECT * FROM s3object s WHERE s.region = 'APAC' AND s.amount > 10000"
)
```

---

## 成本管理

### 生命周期策略模板

```python
import boto3

s3 = boto3.client('s3')

# 综合生命周期策略
def configure_cost_optimized_lifecycle(bucket):
    """配置成本优化的生命周期策略"""
    
    lifecycle_policy = {
        'Rules': [
            {
                'ID': 'TransitionToIA',
                'Status': 'Enabled',
                'Filter': {
                    'Prefix': 'data/'
                },
                'Transitions': [
                    {
                        'Days': 30,
                        'StorageClass': 'STANDARD_IA'
                    },
                    {
                        'Days': 90,
                        'StorageClass': 'GLACIER'
                    }
                ]
            },
            {
                'ID': 'DeleteOldVersions',
                'Status': 'Enabled',
                'Filter': {},
                'NoncurrentVersionExpiration': {
                    'NoncurrentDays': 90
                },
                'NoncurrentVersionTransitions': [
                    {
                        'NoncurrentDays': 30,
                        'StorageClass': 'STANDARD_IA'
                    }
                ]
            },
            {
                'ID': 'AbortIncompleteMultipart',
                'Status': 'Enabled',
                'Filter': {},
                'AbortIncompleteMultipartUpload': {
                    'DaysAfterInitiation': 7
                }
            },
            {
                'ID': 'ExpireOldLogs',
                'Status': 'Enabled',
                'Filter': {
                    'Prefix': 'logs/'
                },
                'Expiration': {
                    'Days': 365
                }
            }
        ]
    }
    
    s3.put_bucket_lifecycle_configuration(
        Bucket=bucket,
        LifecycleConfiguration=lifecycle_policy
    )
```

### 成本监控

```python
# 使用 S3 Inventory 分析存储成本
import boto3

def analyze_storage_costs(bucket):
    """分析 S3 存储成本分布"""
    
    s3 = boto3.client('s3')
    cloudwatch = boto3.client('cloudwatch')
    
    # 获取各存储类别的使用情况
    metrics = cloudwatch.get_metric_statistics(
        Namespace='AWS/S3',
        MetricName='BucketSizeBytes',
        Dimensions=[
            {'Name': 'BucketName', 'Value': bucket},
            {'Name': 'StorageType', 'Value': 'StandardStorage'}
        ],
        StartTime=datetime.utcnow() - timedelta(days=7),
        EndTime=datetime.utcnow(),
        Period=86400,
        Statistics=['Average']
    )
    
    # 计算预估成本
    storage_gb = metrics['Datapoints'][0]['Average'] / (1024**3)
    standard_cost = storage_gb * 0.023
    ia_cost = storage_gb * 0.0125
    glacier_cost = storage_gb * 0.004
    
    print(f"存储分析 ({bucket}):")
    print(f"  当前存储量: {storage_gb:.2f} GB")
    print(f"  Standard 成本: ${standard_cost:.2f}/月")
    print(f"  如果迁移到 IA: ${ia_cost:.2f}/月 (节省 ${standard_cost-ia_cost:.2f})")
    print(f"  如果迁移到 Glacier: ${glacier_cost:.2f}/月 (节省 ${standard_cost-glacier_cost:.2f})")
```

---

## 常见使用场景

### 场景1: 静态网站托管

```yaml
# CloudFormation: S3 静态网站
Resources:
  WebsiteBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-static-website
      WebsiteConfiguration:
        IndexDocument: index.html
        ErrorDocument: error.html
        RoutingRules:
          - RoutingRuleCondition:
              KeyPrefixEquals: "docs/"
            RedirectRule:
              HostName: docs.example.com
              ReplaceKeyPrefixWith: "documentation/"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: false
        BlockPublicPolicy: false
        IgnorePublicAcls: false
        RestrictPublicBuckets: false

  WebsiteBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteBucket
      PolicyDocument:
        Statement:
          - Sid: PublicReadGetObject
            Effect: Allow
            Principal: "*"
            Action: "s3:GetObject"
            Resource: !Sub "${WebsiteBucket}/*"
```

### 场景2: 数据湖基础

```python
# 数据湖分区策略
def create_partitioned_key(event_type, date, file_id):
    """
    创建分区键以优化 Athena 查询
    格式: event_type=xxx/year=2024/month=01/day=15/file_id.json
    """
    return (
        f"event_type={event_type}/"
        f"year={date.year}/"
        f"month={date.month:02d}/"
        f"day={date.day:02d}/"
        f"{file_id}.json"
    )

# 写入示例
date = datetime.now()
key = create_partitioned_key('clickstream', date, uuid.uuid4())

s3.put_object(
    Bucket='data-lake-raw',
    Key=key,
    Body=json.dumps(event_data),
    ContentType='application/json'
)
```

### 场景3: 日志归档与分析

```python
# 日志处理管道
import gzip
import io

def process_log_files(bucket, prefix):
    """处理日志文件并归档"""
    
    s3 = boto3.client('s3')
    
    # 列出所有日志文件
    response = s3.list_objects_v2(
        Bucket=bucket,
        Prefix=prefix
    )
    
    for obj in response.get('Contents', []):
        key = obj['Key']
        
        # 下载并压缩
        file_obj = s3.get_object(Bucket=bucket, Key=key)
        content = file_obj['Body'].read()
        
        compressed = io.BytesIO()
        with gzip.GzipFile(fileobj=compressed, mode='wb') as f:
            f.write(content)
        
        # 上传到归档位置
        archive_key = key.replace('logs/raw/', 'logs/archive/') + '.gz'
        s3.put_object(
            Bucket=bucket,
            Key=archive_key,
            Body=compressed.getvalue(),
            StorageClass='GLACIER'
        )
        
        # 删除原始文件
        s3.delete_object(Bucket=bucket, Key=key)
```

---

## 总结

S3 是 AWS 最基础也是最强大的服务之一。掌握这些最佳实践，您可以:

- **降低成本**: 使用生命周期管理和合适的存储类别
- **提升性能**: 多部分上传、S3 Select、Transfer Acceleration
- **确保安全**: 加密、访问控制、审计日志
- **构建应用**: 静态网站、数据湖、日志分析

持续优化您的 S3 使用方式，最大化云存储价值！
