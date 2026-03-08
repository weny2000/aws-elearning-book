# Amazon S3 Complete Guide

> Comprehensive S3 handbook from beginner to expert

---

## Table of Contents

1. [S3 Core Concepts](#core-concepts)
2. [Storage Class Deep Dive](#storage-class-deep-dive)
3. [Security Best Practices](#security-best-practices)
4. [Performance Optimization](#performance-optimization)
5. [Cost Management](#cost-management)
6. [Common Use Cases](#common-use-cases)

---

## Core Concepts

### Bucket Naming Rules

```
✅ Valid Names:
- my-unique-bucket-2024
- company.data.storage
- logs.us-east-1.production

❌ Invalid Names:
- MyBucket (uppercase letters)
- bucket_name (underscore)
- 192.168.1.1 (IP address format)
- bucket..name (consecutive periods)
```

**Naming Best Practices**:
- Use environment prefixes: `prod-`, `dev-`, `test-`
- Use region suffixes: `-us-east-1`, `-eu-west-1`
- Use application names: `webapp-`, `api-`, `analytics-`

### Object Metadata

```python
import boto3

s3 = boto3.client('s3')

# Upload object with metadata
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

## Storage Class Deep Dive

### Selection Decision Flow

```mermaid
flowchart TD
    A[Data Access Frequency?] -->|Frequent| B[S3 Standard]
    A -->|Infrequent| C{Acceptable Retrieval Latency?}
    A -->|Archive| D{Retention Period?}
    
    C -->|< Milliseconds| E[S3 Standard-IA]
    C -->|Minutes| F[S3 Glacier Instant Retrieval]
    
    D -->|< 1 Year| G[S3 Glacier Flexible]
    D -->|> 1 Year| H[S3 Glacier Deep Archive]
    
    I[Unknown Access Pattern?] -->|Yes| J[S3 Intelligent-Tiering]
```

### Intelligent-Tiering Configuration

```python
import boto3

s3 = boto3.client('s3')

# Enable automatic archiving
s3.put_bucket_intelligent_tiering_configuration(
    Bucket='my-data-lake',
    Id='DeepArchiveArchive',
    IntelligentTieringConfiguration={
        'Status': 'Enabled',
        'Tierings': [
            {
                'Days': 90,
                'AccessTier': 'ARCHIVE_ACCESS'  # Archive after 90 days
            },
            {
                'Days': 180,
                'AccessTier': 'DEEP_ARCHIVE_ACCESS'  # Deep archive after 180 days
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

## Security Best Practices

### Bucket Policy Templates

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

### Presigned URL Security

```python
import boto3
from datetime import timedelta

s3 = boto3.client('s3')

# Generate secure temporary access URL
def generate_secure_url(bucket, key, expiration_minutes=15):
    """
    Generate secure presigned URL
    - Short expiration (default 15 minutes)
    - Allow only specific IP
    - Force HTTPS
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

# URL with IP restriction (requires CloudFront or Lambda@Edge)
def generate_restricted_url(bucket, key, allowed_ip):
    """Generate URL with IP restriction"""
    # Actual implementation requires CloudFront Signed URLs
    # or Lambda@Edge for real-time validation
    pass
```

---

## Performance Optimization

### Multipart Upload Best Practices

```python
import boto3
from concurrent.futures import ThreadPoolExecutor
import os

s3 = boto3.client('s3')

def multipart_upload_with_progress(file_path, bucket, key):
    """Multipart upload with progress tracking"""
    
    file_size = os.path.getsize(file_path)
    part_size = 100 * 1024 * 1024  # 100MB chunks
    
    # Initialize upload
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
                
                # Upload part
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
                print(f"Upload progress: {min(progress, 100):.2f}%")
                part_number += 1
        
        # Complete upload
        s3.complete_multipart_upload(
            Bucket=bucket,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={'Parts': parts}
        )
        
        print("Upload complete!")
        
    except Exception as e:
        # Abort upload
        s3.abort_multipart_upload(
            Bucket=bucket,
            Key=key,
            UploadId=upload_id
        )
        raise e

# Concurrent upload of multiple files
def concurrent_uploads(file_list, bucket):
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [
            executor.submit(multipart_upload_with_progress, f, bucket, os.path.basename(f))
            for f in file_list
        ]
        for future in futures:
            future.result()
```

### S3 Select Optimization Queries

```python
# Use S3 Select to query CSV/JSON without downloading full file
import boto3

s3 = boto3.client('s3')

def query_large_csv(bucket, key, query):
    """Query large file using S3 Select"""
    
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

# Example query
results = query_large_csv(
    'data-lake-bucket',
    'sales/2024.csv',
    "SELECT * FROM s3object s WHERE s.region = 'APAC' AND s.amount > 10000"
)
```

---

## Cost Management

### Lifecycle Policy Templates

```python
import boto3

s3 = boto3.client('s3')

# Comprehensive lifecycle policy
def configure_cost_optimized_lifecycle(bucket):
    """Configure cost-optimized lifecycle policy"""
    
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

### Cost Monitoring

```python
# Use S3 Inventory to analyze storage costs
import boto3

def analyze_storage_costs(bucket):
    """Analyze S3 storage cost distribution"""
    
    s3 = boto3.client('s3')
    cloudwatch = boto3.client('cloudwatch')
    
    # Get usage by storage class
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
    
    # Calculate estimated costs
    storage_gb = metrics['Datapoints'][0]['Average'] / (1024**3)
    standard_cost = storage_gb * 0.023
    ia_cost = storage_gb * 0.0125
    glacier_cost = storage_gb * 0.004
    
    print(f"Storage Analysis ({bucket}):")
    print(f"  Current Storage: {storage_gb:.2f} GB")
    print(f"  Standard Cost: ${standard_cost:.2f}/month")
    print(f"  If migrated to IA: ${ia_cost:.2f}/month (save ${standard_cost-ia_cost:.2f})")
    print(f"  If migrated to Glacier: ${glacier_cost:.2f}/month (save ${standard_cost-glacier_cost:.2f})")
```

---

## Common Use Cases

### Use Case 1: Static Website Hosting

```yaml
# CloudFormation: S3 Static Website
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

### Use Case 2: Data Lake Foundation

```python
# Data lake partitioning strategy
def create_partitioned_key(event_type, date, file_id):
    """
    Create partition key to optimize Athena queries
    Format: event_type=xxx/year=2024/month=01/day=15/file_id.json
    """
    return (
        f"event_type={event_type}/"
        f"year={date.year}/"
        f"month={date.month:02d}/"
        f"day={date.day:02d}/"
        f"{file_id}.json"
    )

# Write example
date = datetime.now()
key = create_partitioned_key('clickstream', date, uuid.uuid4())

s3.put_object(
    Bucket='data-lake-raw',
    Key=key,
    Body=json.dumps(event_data),
    ContentType='application/json'
)
```

### Use Case 3: Log Archiving and Analysis

```python
# Log processing pipeline
import gzip
import io

def process_log_files(bucket, prefix):
    """Process log files and archive"""
    
    s3 = boto3.client('s3')
    
    # List all log files
    response = s3.list_objects_v2(
        Bucket=bucket,
        Prefix=prefix
    )
    
    for obj in response.get('Contents', []):
        key = obj['Key']
        
        # Download and compress
        file_obj = s3.get_object(Bucket=bucket, Key=key)
        content = file_obj['Body'].read()
        
        compressed = io.BytesIO()
        with gzip.GzipFile(fileobj=compressed, mode='wb') as f:
            f.write(content)
        
        # Upload to archive location
        archive_key = key.replace('logs/raw/', 'logs/archive/') + '.gz'
        s3.put_object(
            Bucket=bucket,
            Key=archive_key,
            Body=compressed.getvalue(),
            StorageClass='GLACIER'
        )
        
        # Delete original file
        s3.delete_object(Bucket=bucket, Key=key)
```

---

## Summary

S3 is one of AWS's most fundamental yet powerful services. Mastering these best practices allows you to:

- **Reduce Costs**: Use lifecycle management and appropriate storage classes
- **Improve Performance**: Multipart uploads, S3 Select, Transfer Acceleration
- **Ensure Security**: Encryption, access control, audit logging
- **Build Applications**: Static websites, data lakes, log analysis

Continuously optimize your S3 usage to maximize cloud storage value!
