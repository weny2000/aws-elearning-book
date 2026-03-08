# AWS File Storage and Database Technical Whitepaper

> Master AWS Data Storage Services: From Object Storage to Purpose-Built Databases

---

## Table of Contents

> **Learning Guide**: This whitepaper follows a "Storage Types → Database Services → Operations Practices" progression. It is recommended to master the first 4 chapters on storage fundamentals before diving deeper into database selection and operations.

1. **[Storage and Database Overview](#1-storage-and-database-overview)**  
   *Establish a global perspective: Understand AWS storage service classification, data access patterns, and selection decision trees to build a framework for subsequent specialized learning.*

2. **[Amazon S3 Object Storage](#2-amazon-s3-object-storage)**  
   *Master the cloud storage cornerstone: Deep dive into S3 core concepts, storage classes, lifecycle management — AWS's most widely used storage service.*

3. **[File Storage Services](#3-file-storage-services)**  
   *Expand file-level storage: Compare EFS, FSx families, and understand when to choose managed file systems over object storage.*

4. **[Amazon EBS Block Storage](#4-amazon-ebs-block-storage)**  
   *EC2 storage foundation: Learn volume type selection, snapshot strategies, I/O optimization to design optimal storage solutions for EC2 workloads.*

5. **[Relational Databases](#5-relational-databases)**  
   *Managed database services: Deep dive into RDS, Aurora architecture, mastering Multi-AZ, read replicas, Performance Insights, and other core capabilities.*

6. **[Amazon DynamoDB](#6-amazon-dynamodb)**  
   *NoSQL data modeling: Learn key-value/document database design, partition key strategies, DAX caching, global tables, and other advanced features.*

7. **[In-Memory Databases and Caching](#7-in-memory-databases-and-caching)**  
   *Accelerate data access: Master ElastiCache (Redis/Memcached) and MemoryDB use cases and performance tuning.*

8. **[Purpose-Built Database Services](#8-purpose-built-database-services)**  
   *Choosing for specific scenarios: Learn about DocumentDB, Keyspaces, Neptune, Timestream, QLDB, and other specialized databases.*

9. **[Data Migration and Integration](#9-data-migration-and-integration)**  
   *Data flow solutions: Learn DMS, SCT, DataSync, Glue, and other migration tools, mastering heterogeneous database migration strategies.*

10. **[Backup and Disaster Recovery](#10-backup-and-disaster-recovery)**  
    *Protect data assets: Compare AWS Backup, snapshots, cross-region replication, and design RPO/RTO to meet business requirements.*

11. **[Performance Optimization and Monitoring](#11-performance-optimization-and-monitoring)**  
    *Improve storage efficiency: Learn CloudWatch storage metrics, Performance Insights, DynamoDB capacity mode optimization.*

12. **[Database Containerization and Docker](#12-database-containerization-and-docker)** 🐳  
    *Modern operations: Learn local Docker database development, RDS Proxy, ECS/EKS database deployment, LocalStack local testing.*

13. **[Security and Compliance](#13-security-and-compliance)**  
    *Data security architecture: Integrate previous knowledge, learn encryption (KMS), IAM authorization, VPC isolation, compliance auditing, and full-stack security strategies.*

---

## 1. Storage and Database Overview

### 1.1 AWS Storage Service Classification

```mermaid
flowchart TB
    subgraph Object["Object Storage"]
        S3[S3 Standard]
        S3IA[S3 Standard-IA]
        S3Glacier[S3 Glacier]
        S3Intelligent[S3 Intelligent-Tiering]
    end
    
    subgraph File["File Storage"]
        EFS[EFS Standard]
        EFSIA[EFS IA]
        FSxWin[FSx Windows]
        FSxLustre[FSx Lustre]
        FSxONTAP[FSx ONTAP]
        FSxOpenZFS[FSx OpenZFS]
    end
    
    subgraph Block["Block Storage"]
        GP3[gp3 General Purpose]
        IO2[io2 Provisioned IOPS]
        ST1[st1 Throughput Optimized]
        SC1[sc1 Cold]
    end
    
    subgraph Database["Database"]
        RDS[RDS]
        Aurora[Aurora]
        DDB[DynamoDB]
        ElastiCache[ElastiCache]
        DocumentDB[DocumentDB]
        Neptune[Neptune]
        Keyspaces[Keyspaces]
        QLDB[QLDB]
        Timestream[Timestream]
    end
```

### 1.2 Storage Service Comparison

| Feature | S3 | EFS | EBS | FSx |
|---------|----|-----|-----|-----|
| **Storage Type** | Object | File (NFS) | Block | File (Multi-protocol) |
| **Access Method** | HTTP API | NFSv4 | iSCSI | SMB/NFS/Lustre |
| **Availability** | 99.99% | 99.99% | 99.9% | 99.99% |
| **Durability** | 99.999999999% | High | 99.8-99.9% | High |
| **Latency** | Milliseconds | Milliseconds | Microseconds | Sub-milliseconds |
| **Maximum Capacity** | Unlimited | Petabytes | 64TB/volume | Petabytes |
| **Multi-AZ** | Automatic | Automatic | Requires Configuration | Automatic |
| **Use Cases** | Data lakes, backups, static websites | Shared files, container storage | Database storage, EC2 boot volumes | Windows applications, HPC |

### 1.3 Database Service Comparison

| Database | Type | Consistency Model | Use Cases |
|----------|------|-------------------|-----------|
| **RDS** | Relational | Strong Consistency | Traditional OLTP, ERP, CRM |
| **Aurora** | Cloud-Native Relational | Strong Consistency | High-throughput OLTP, SaaS |
| **DynamoDB** | NoSQL (Key-Value/Document) | Eventually Consistent/Strong Consistency | Internet applications, gaming, IoT |
| **DocumentDB** | Document (MongoDB-compatible) | Strong Consistency | Content management, mobile applications |
| **Keyspaces** | Wide-Column (Cassandra-compatible) | Eventually Consistent | Time-series data, logs, IoT |
| **Neptune** | Graph Database | Strong Consistency | Recommendation engines, knowledge graphs, fraud detection |
| **QLDB** | Ledger Database | Immutable | Supply chain, financial transactions |
| **Timestream** | Time-Series Database | Strong Consistency | Monitoring, IoT sensor data |
| **ElastiCache** | In-Memory Cache | Eventually Consistent | Session caching, real-time analytics |

### 1.4 Data Storage Selection Decision Framework

```mermaid
flowchart TD
    A[Start Selection] --> B{Data Structure?}
    
    B -->|Unstructured| C{Access Frequency?}
    B -->|Semi-structured| D{Query Complexity?}
    B -->|Structured| E{Transaction Requirements?}
    
    C -->|Low-frequency Archive| F[S3 Glacier]
    C -->|General Access| G[S3 Standard]
    C -->|Shared Files| H[EFS/FSx]
    
    D -->|Simple Key-Value| I[DynamoDB]
    D -->|Document Queries| J[DocumentDB]
    D -->|Graph Queries| K[Neptune]
    D -->|Time-Series Queries| L[Timestream]
    
    E -->|Strong ACID| M{Throughput?}
    E -->|Eventual Consistency| N[DynamoDB]
    
    M -->|Ultra-high Throughput| O[Aurora]
    M -->|Standard Throughput| P[RDS]
    M -->|Analytics Workload| Q[Redshift]
```

---

## 2. Amazon S3 Object Storage

### 2.1 S3 Core Concepts

```mermaid
flowchart TB
    subgraph S3Architecture["S3 Architecture"]
        Bucket[Bucket<br/>Globally Unique Namespace]
        Object[Object<br/>Data + Metadata]
        Prefix[Prefix<br/>Logical Folder]
    end
    
    subgraph S3Features["Core Features"]
        Versioning[Versioning]
        Lifecycle[Lifecycle Management]
        Encryption[Encryption]
        Replication[Replication]
        Events[Event Notifications]
    end
    
    Bucket --> Object
    Object --> Prefix
    Bucket --> S3Features
```

**Core Components**:
- **Bucket**: Globally unique namespace, similar to top-level folders
- **Object**: Data + Metadata + Version ID, maximum 5TB
- **Prefix**: Logical path for organizing data

### 2.2 Storage Class Selection

| Storage Class | Use Cases | Minimum Storage Duration | Retrieval Time |
|---------------|-----------|--------------------------|----------------|
| **S3 Standard** | Frequent access | None | Milliseconds |
| **S3 IA** | Infrequent access | 30 days | Milliseconds |
| **S3 One Zone-IA** | Reconstructable data | 30 days | Milliseconds |
| **S3 Glacier** | Long-term archive | 90 days | Minutes |
| **S3 Glacier Deep Archive** | Regulatory archive | 180 days | 12 hours |
| **S3 Intelligent-Tiering** | Unknown access patterns | None | Milliseconds |

```python
# S3 Intelligent-Tiering Configuration
import boto3

s3 = boto3.client('s3')

# Create Bucket with Intelligent-Tiering
s3.put_bucket_intelligent_tiering_configuration(
    Bucket='my-data-lake',
    Id='MyITConfig',
    IntelligentTieringConfiguration={
        'Status': 'Enabled',
        'Tierings': [
            {
                'Days': 90,
                'AccessTier': 'ARCHIVE_ACCESS'
            },
            {
                'Days': 180,
                'AccessTier': 'DEEP_ARCHIVE_ACCESS'
            }
        ]
    }
)
```

### 2.3 S3 Security Best Practices

```yaml
# S3 Bucket Security Policy Template
Resources:
  SecureBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: secure-data-bucket
      
      # Encryption Configuration
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref BucketKey
            BucketKeyEnabled: true
      
      # Public Access Block
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # Versioning
      VersioningConfiguration:
        Status: Enabled
      
      # Logging
      LoggingConfiguration:
        DestinationBucketName: !Ref LogBucket
        LogFilePrefix: access-logs/
      
      # Object Lock (Compliance Retention)
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
```

### 2.4 S3 Access Control

```python
# Bucket Policy - Restrict Specific VPC Access
bucket_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "DenyNonSSL",
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
            "Sid": "AllowVPCEndpointOnly",
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

s3.put_bucket_policy(
    Bucket='secure-bucket',
    Policy=json.dumps(bucket_policy)
)
```

### 2.5 S3 Events and Notifications

```python
# Configure S3 Event Notifications
s3.put_bucket_notification_configuration(
    Bucket='data-lake-bucket',
    NotificationConfiguration={
        'LambdaFunctionConfigurations': [
            {
                'LambdaFunctionArn': 'arn:aws:lambda:us-east-1:123456789:function:process-image',
                'Events': ['s3:ObjectCreated:*'],
                'Filter': {
                    'KeyFilterRules': [
                        {
                            'Name': 'prefix',
                            'Value': 'uploads/images/'
                        },
                        {
                            'Name': 'suffix',
                            'Value': '.jpg'
                        }
                    ]
                }
            }
        ],
        'QueueConfigurations': [
            {
                'QueueArn': 'arn:aws:sqs:us-east-1:123456789:virus-scan-queue',
                'Events': ['s3:ObjectCreated:*']
            }
        ],
        'TopicConfigurations': [
            {
                'TopicArn': 'arn:aws:sns:us-east-1:123456789:delete-alerts',
                'Events': ['s3:ObjectRemoved:*']
            }
        ]
    }
)
```

### 2.6 S3 Performance Optimization

```python
# Multipart Upload - Large File Optimization
import boto3
from boto3.s3.transfer import TransferConfig

s3 = boto3.client('s3')

# Configure Transfer Parameters
config = TransferConfig(
    multipart_threshold=1024 * 25,  # 25MB
    max_concurrency=10,              # 10 Concurrent Uploads
    multipart_chunksize=1024 * 25,  # 25MB Chunks
    use_threads=True
)

# Upload Large File
s3.upload_file(
    'large-file.zip',
    'my-bucket',
    'data/large-file.zip',
    Config=config
)

# S3 Select - Query CSV/JSON Without Downloading Full File
response = s3.select_object_content(
    Bucket='data-lake',
    Key='sales/2024.csv',
    Expression="SELECT * FROM s3object s WHERE s.region = 'APAC'",
    ExpressionType='SQL',
    InputSerialization={
        'CSV': {
            'FileHeaderInfo': 'USE',
            'RecordDelimiter': '\n'
        }
    },
    OutputSerialization={
        'CSV': {
            'RecordDelimiter': '\n'
        }
    }
)
```

---

## 3. File Storage Services

### 3.1 Amazon EFS Managed File System

```mermaid
flowchart TB
    subgraph EFS["EFS Architecture"]
        subgraph AZ1["Availability Zone 1"]
            M1[Mount Target 1]
        end
        
        subgraph AZ2["Availability Zone 2"]
            M2[Mount Target 2]
        end
        
        subgraph AZ3["Availability Zone 3"]
            M3[Mount Target 3]
        end
        
        FS[EFS File System]
    end
    
    subgraph Clients["Clients"]
        EC2[EC2 Instances]
        Lambda[Lambda]
        EKS[EKS Containers]
        OnPrem[On-Premises Data Center]
    end
    
    FS --> M1
    FS --> M2
    FS --> M3
    
    M1 --> EC2
    M2 --> Lambda
    M3 --> EKS
    M1 --> OnPrem
```

**EFS Storage Classes**:

| Class | Use Cases | Cost Savings |
|-------|-----------|--------------|
| **Standard** | Frequent access | Baseline |
| **IA (Infrequent Access)** | Infrequent access | 92% |
| **Archive** | Rarely accessed | 97% |
| **One Zone** | Reconstructable data | 47% |

```python
# Create EFS File System
import boto3

efs = boto3.client('efs')

# Create File System
response = efs.create_file_system(
    CreationToken='my-efs-token',
    PerformanceMode='generalPurpose',  # or 'maxIO'
    ThroughputMode='elastic',  # or 'provisioned' / 'bursting'
    Encrypted=True,
    KmsKeyId='alias/aws/elasticfilesystem',
    LifecyclePolicies=[
        {
            'TransitionToIA': 'AFTER_30_DAYS',
            'TransitionToArchive': 'AFTER_90_DAYS'
        }
    ],
    Tags=[
        {'Key': 'Name', 'Value': 'production-efs'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)

file_system_id = response['FileSystemId']

# Create Mount Targets in Multiple Availability Zones
ec2 = boto3.client('ec2')
vpcs = ec2.describe_subnets(
    Filters=[{'Name': 'vpc-id', 'Values': ['vpc-123456']}]
)

for subnet in vpcs['Subnets']:
    efs.create_mount_target(
        FileSystemId=file_system_id,
        SubnetId=subnet['SubnetId'],
        SecurityGroups=['sg-123456']
    )
```

### 3.2 Amazon FSx Specialized File Systems

```mermaid
flowchart LR
    subgraph FSxFamily["FSx Product Family"]
        Windows[FSx for Windows<br/>SMB / NTFS / AD]
        Lustre[FSx for Lustre<br/>HPC / Machine Learning]
        ONTAP[FSx for ONTAP<br/>NFS / SMB / iSCSI]
        OpenZFS[FSx for OpenZFS<br/>NFS / ZFS Features]
    end
    
    subgraph UseCases["Use Cases"]
        AD[Active Directory<br/>File Sharing]
        HPC[High Performance Computing<br/>EDA/Simulation]
        Hybrid[Hybrid Cloud<br/>NAS Migration]
        DevOps[DevOps<br/>CI/CD]
    end
    
    Windows --> AD
    Lustre --> HPC
    ONTAP --> Hybrid
    OpenZFS --> DevOps
```

**FSx for Windows File Server**:

```powershell
# PowerShell: Create FSx for Windows File System
$Params = @{
    FileSystemType = 'WINDOWS'
    StorageCapacity = 300  # GB
    SubnetIds = @('subnet-12345678', 'subnet-87654321')
    SecurityGroupIds = @('sg-12345678')
    WindowsConfiguration = @{
        ActiveDirectoryId = 'd-1234567890'
        DeploymentType = 'MULTI_AZ_1'  # or SINGLE_AZ_1
        ThroughputCapacity = 32  # MB/s
        WeeklyMaintenanceStartTime = '1:05:00'  # Sunday 5:00 AM
        DailyAutomaticBackupStartTime = '03:00'
        AutomaticBackupRetentionDays = 35
        CopyTagsToBackups = $true
    }
    Tags = @(
        @{Key='Name'; Value='corp-file-server'},
        @{Key='Department'; Value='Engineering'}
    )
}

New-FSxFileSystem @Params
```

**FSx for Lustre (HPC Scenarios)**:

```yaml
# CloudFormation: FSx for Lustre
Resources:
  FSxLustre:
    Type: AWS::FSx::FileSystem
    Properties:
      FileSystemType: LUSTRE
      StorageCapacity: 12000  # GB, minimum 1.2TB
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref FSxSecurityGroup
      LustreConfiguration:
        DeploymentType: SCRATCH_2  # or PERSISTENT_1
        DataCompressionType: LZ4
        AutoImportPolicy: NEW_CHANGED  # Auto-import from S3
        ExportPath: !Sub s3://${DataBucket}/exports
        ImportPath: !Sub s3://${DataBucket}/imports
        WeeklyMaintenanceStartTime: '1:05:00'
```

### 3.3 File Storage Selection Guide

| Requirement | Recommended Service | Reason |
|-------------|---------------------|--------|
| Linux container shared storage | EFS | NFSv4.1, auto-scaling |
| Windows file sharing | FSx Windows | SMB, AD integration |
| HPC / Machine Learning | FSx Lustre | Sub-millisecond latency, 100+ GB/s |
| NetApp ONTAP migration | FSx ONTAP | Feature compatibility, hybrid cloud |
| ZFS snapshots/clones | FSx OpenZFS | Native ZFS features |
| Simple low-cost files | EFS One Zone | Cost optimization |

---

## 4. Amazon EBS Block Storage

### 4.1 EBS Volume Type Comparison

| Volume Type | Use Cases | Max IOPS | Max Throughput | Latency |
|-------------|-----------|----------|----------------|---------|
| **gp3** | General-purpose SSD | 16,000 | 1,000 MB/s | Single-digit milliseconds |
| **gp2** | General-purpose SSD (Legacy) | 16,000 | 250 MB/s | Single-digit milliseconds |
| **io2** | High I/O Critical Applications | 256,000 | 4,000 MB/s | Sub-millisecond |
| **io2 Block Express** | Highest Performance | 256,000 | 4,000 MB/s | Sub-millisecond |
| **st1** | Throughput-optimized HDD | 500 | 500 MB/s | Several milliseconds |
| **sc1** | Cold HDD | 250 | 250 MB/s | Several milliseconds |

```python
# Create High-Performance EBS Volume
import boto3

ec2 = boto3.client('ec2')

# Create io2 Block Express Volume
volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=100,  # GB
    VolumeType='io2',
    Iops=50000,
    Throughput=1000,  # MB/s
    Encrypted=True,
    KmsKeyId='alias/aws/ebs',
    MultiAttachEnabled=True,  # Allow multi-instance attachment
    TagSpecifications=[{
        'ResourceType': 'volume',
        'Tags': [
            {'Key': 'Name', 'Value': 'high-performance-db'},
            {'Key': 'Environment', 'Value': 'production'}
        ]
    }]
)

# Create gp3 Volume (Cost Optimized)
gp3_volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=500,
    VolumeType='gp3',
    Iops=8000,       # Independently configurable IOPS
    Throughput=500,  # Independently configurable throughput
    Encrypted=True
)
```

### 4.2 EBS Snapshots and Recovery

```python
# Automated Snapshot Management
import boto3

ec2 = boto3.client('ec2')

def create_lifecycle_snapshots():
    """Create snapshots with lifecycle management"""
    
    # Create Snapshot
    snapshot = ec2.create_snapshot(
        VolumeId='vol-12345678',
        Description='Daily backup - production DB',
        TagSpecifications=[{
            'ResourceType': 'snapshot',
            'Tags': [
                {'Key': 'Name', 'Value': 'db-daily-backup'},
                {'Key': 'Retention', 'Value': '7-days'},
                {'Key': 'AutoDelete', 'Value': 'true'}
            ]
        }]
    )
    
    # Enable Snapshot Archive (75% cost savings)
    ec2.modify_snapshot_tier(
        SnapshotId=snapshot['SnapshotId'],
        StorageTier='archive'
    )
    
    return snapshot

def cleanup_old_snapshots():
    """Clean up expired snapshots"""
    snapshots = ec2.describe_snapshots(
        OwnerIds=['self'],
        Filters=[
            {'Name': 'tag:AutoDelete', 'Values': ['true']}
        ]
    )['Snapshots']
    
    for snapshot in snapshots:
        # Determine retention policy based on tags
        tags = {tag['Key']: tag['Value'] for tag in snapshot.get('Tags', [])}
        retention_days = int(tags.get('Retention', '7').split('-')[0])
        
        create_time = snapshot['StartTime'].replace(tzinfo=None)
        age_days = (datetime.now() - create_time).days
        
        if age_days > retention_days:
            ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
            print(f"Deleted snapshot: {snapshot['SnapshotId']}")
```

### 4.3 EBS Performance Optimization

```yaml
# CloudFormation: EBS-Optimized EC2 Instance
Resources:
  DatabaseServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: r6i.2xlarge
      EbsOptimized: true  # Enable EBS Optimization
      
      BlockDeviceMappings:
        # Root Volume
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 100
            VolumeType: gp3
            Iops: 5000
            Encrypted: true
            DeleteOnTermination: true
            
        # Data Volume - High IOPS
        - DeviceName: /dev/xvdb
          Ebs:
            VolumeSize: 500
            VolumeType: io2
            Iops: 32000
            Throughput: 1000
            Encrypted: true
            KmsKeyId: !Ref DatabaseKey
            
        # Log Volume - High Throughput
        - DeviceName: /dev/xvdc
          Ebs:
            VolumeSize: 1000
            VolumeType: gp3
            Iops: 16000
            Throughput: 1000
            Encrypted: true
      
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          # Configure RAID 0 for Performance
          mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/xvdb /dev/xvdc
          mkfs.xfs /dev/md0
          mkdir /data
          mount /dev/md0 /data
          
          # Enable EBS Initialization Optimization
          echo 0 > /sys/block/xvdb/queue/add_random
          echo 0 > /sys/block/xvdc/queue/add_random
```

---

## 5. Relational Databases

### 5.1 Amazon RDS Managed Databases

```mermaid
flowchart TB
    subgraph RDS["RDS Architecture"]
        subgraph Primary["Primary Instance"]
            PDB[(Database)]
            PLog[Transaction Log]
        end
        
        subgraph Standby["Standby Instance"]
            SDB[(Replica)]
            SLog[Log Replay]
        end
        
        subgraph Storage["Managed Storage"]
            EBS1[EBS Volume 1]
            EBS2[EBS Volume 2]
        end
    end
    
    PLog -->|Synchronous Replication| SLog
    PDB -->|Multi-AZ| SDB
    PDB --> EBS1
    SDB --> EBS2
```

**Supported Engines**:

| Engine | Versions | Use Cases |
|--------|----------|-----------|
| **MySQL** | 5.7, 8.0 | Web applications, CMS |
| **PostgreSQL** | 12-16 | Enterprise applications, geospatial data |
| **MariaDB** | 10.6+ | MySQL alternative |
| **Oracle** | 19c, 21c | Enterprise ERP |
| **SQL Server** | 2019, 2022 | .NET applications |

```python
# Create High-Availability RDS PostgreSQL Instance
import boto3

rds = boto3.client('rds')

response = rds.create_db_instance(
    DBInstanceIdentifier='production-postgres',
    DBInstanceClass='db.r6g.xlarge',
    Engine='postgres',
    EngineVersion='15.4',
    AllocatedStorage=500,
    StorageType='io1',
    Iops=20000,
    
    # High Availability Configuration
    MultiAZ=True,
    
    # Backup Configuration
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    PreferredMaintenanceWindow='Mon:04:00-Mon:05:00',
    
    # Encryption
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    # Network
    VPCSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='production-db-subnet-group',
    PubliclyAccessible=False,
    
    # Monitoring
    EnablePerformanceInsights=True,
    PerformanceInsightsRetentionPeriod=7,
    EnableCloudwatchLogsExports=['postgresql', 'upgrade'],
    MonitoringInterval=60,
    MonitoringRoleArn='arn:aws:iam::123456789:role/rds-monitoring-role',
    
    # Deletion Protection
    DeletionProtection=True,
    
    Tags=[
        {'Key': 'Name', 'Value': 'Production PostgreSQL'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)
```

### 5.2 Amazon Aurora Cloud-Native Database

```mermaid
flowchart TB
    subgraph Aurora["Aurora Architecture"]
        subgraph StorageLayer["Shared Storage Layer (6 Replicas)"]
            AZ1[(Availability Zone 1)]
            AZ2[(Availability Zone 2)]
            AZ3[(Availability Zone 3)]
        end
        
        subgraph Compute["Compute Layer"]
            Writer[Writer Instance]
            Reader1[Reader 1]
            Reader2[Reader 2]
            ReaderN[Reader N...]
        end
    end
    
    Writer -->|Write| AZ1
    Writer -->|Write| AZ2
    Writer -->|Write| AZ3
    
    Reader1 -->|Read| AZ1
    Reader2 -->|Read| AZ2
    ReaderN -->|Read| AZ3
    
    Writer -.->|Replication| Reader1
    Writer -.->|Replication| Reader2
    Writer -.->|Replication| ReaderN
```

**Aurora Features**:

| Feature | Aurora MySQL | Aurora PostgreSQL |
|---------|--------------|-------------------|
| **Maximum Capacity** | 128 TB | 128 TB |
| **Read Replicas** | 15 | 15 |
| **Replication Latency** | < 20ms | < 20ms |
| **Failover** | < 30 seconds | < 30 seconds |
| **Performance Improvement** | 5x MySQL | 3x PostgreSQL |
| **Serverless v2** | ✅ | ✅ |

```python
# Create Aurora Serverless v2 Cluster
import boto3

rds = boto3.client('rds')

# Create Cluster
cluster = rds.create_db_cluster(
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    EngineVersion='15.4',
    
    # Serverless v2 Configuration
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,   # ACU
        'MaxCapacity': 64.0,  # ACU
        'SecondsUntilAutoPause': 300  # Pause after 5 minutes idle
    },
    
    MasterUsername='dbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # Network
    VpcSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='aurora-subnet-group',
    
    # Backup
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # Encryption
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    DeletionProtection=True
)

# Create Writer Instance
writer = rds.create_db_instance(
    DBInstanceIdentifier='aurora-writer-1',
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    DBInstanceClass='db.serverless',
    
    # Serverless v2 requires capacity range specification
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,
        'MaxCapacity': 64.0
    }
)
```

### 5.3 RDS Read Replicas and Cross-Region Replication

```yaml
# CloudFormation: Cross-Region Aurora Global Database
Resources:
  # Primary Region Cluster
  PrimaryCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: aurora-global-primary
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DatabaseName: myapp
      
  # Enable Global Database
  GlobalCluster:
    Type: AWS::RDS::GlobalCluster
    Properties:
      GlobalClusterIdentifier: aurora-global-db
      SourceDBClusterIdentifier: !Ref PrimaryCluster
      Engine: aurora-mysql
      
  # Primary Writer Instance
  PrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBClusterIdentifier: !Ref PrimaryCluster
      DBInstanceIdentifier: primary-writer
      Engine: aurora-mysql
      DBInstanceClass: db.r6g.xlarge
      
  # Secondary Region (Create in other region stack)
  # SecondaryCluster:
  #   Type: AWS::RDS::DBCluster
  #   Properties:
  #     DBClusterIdentifier: aurora-secondary
  #     Engine: aurora-mysql
  #     GlobalClusterIdentifier: !Ref GlobalCluster
```

---

## 6. Amazon DynamoDB

### 6.1 DynamoDB Core Concepts

```mermaid
flowchart TB
    subgraph DynamoDB["DynamoDB Data Model"]
        subgraph Table["Table"]
            PK["Primary Key"]
            
            subgraph PKTypes["Primary Key Types"]
                SP["Simple Primary Key<br/>Partition Key"]
                CP["Composite Primary Key<br/>Partition + Sort Key"]
            end
        end
        
        subgraph Items["Items"]
            Item1["PK: user#123<br/>SK: profile<br/>Attributes: {...}"]
            Item2["PK: user#123<br/>SK: orders#2024<br/>Attributes: {...}"]
            Item3["PK: product#456<br/>SK: metadata<br/>Attributes: {...}"]
        end
        
        subgraph Indexes["Indexes"]
            GSI["Global Secondary Index (GSI)"]
            LSI["Local Secondary Index (LSI)"]
        end
    end
    
    PK --> PKTypes
    Table --> Items
    Table --> Indexes
```

**Data Modeling Best Practices**:

```json
{
  "TableName": "ecommerce-entities",
  "KeySchema": [
    {"AttributeName": "PK", "KeyType": "HASH"},
    {"AttributeName": "SK", "KeyType": "RANGE"}
  ],
  "AttributeDefinitions": [
    {"AttributeName": "PK", "AttributeType": "S"},
    {"AttributeName": "SK", "AttributeType": "S"},
    {"AttributeName": "GSI1PK", "AttributeType": "S"},
    {"AttributeName": "GSI1SK", "AttributeType": "S"}
  ],
  "GlobalSecondaryIndexes": [
    {
      "IndexName": "GSI1",
      "KeySchema": [
        {"AttributeName": "GSI1PK", "KeyType": "HASH"},
        {"AttributeName": "GSI1SK", "KeyType": "RANGE"}
      ],
      "Projection": {"ProjectionType": "ALL"}
    }
  ]
}
```

```python
# DynamoDB Single-Table Design Example
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ecommerce-entities')

# User Entity
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'PROFILE',
    'entity_type': 'user',
    'user_id': '12345',
    'name': 'John Doe',
    'email': 'john@example.com',
    'created_at': '2024-01-15T10:00:00Z'
})

# Order Entity (Same User)
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'ORDER#2024-001',
    'entity_type': 'order',
    'order_id': '2024-001',
    'total': 299.99,
    'status': 'shipped',
    'GSI1PK': 'ORDER',
    'GSI1SK': '2024-01-15T10:30:00Z'  # Sorted by time
})

# Query All User Orders
response = table.query(
    KeyConditionExpression=Key('PK').eq('USER#12345') & 
                          Key('SK').begins_with('ORDER#')
)
orders = response['Items']

# Query All Orders Using GSI (By Time)
response = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('ORDER') & 
                          Key('GSI1SK').between('2024-01-01', '2024-01-31')
)
recent_orders = response['Items']
```

### 6.2 DynamoDB Capacity Modes

| Mode | Use Cases | Characteristics |
|------|-----------|-----------------|
| **On-Demand** | Unpredictable traffic, new applications | Pay per request, auto-scaling |
| **Provisioned** | Predictable traffic, cost-sensitive | Specify RCU/WCU, can auto-scale |
| **Reserved Capacity** | Long-term stable workloads | Prepay for savings |

```python
# Create Auto-Scaling Provisioned Capacity Table
import boto3

dynamodb = boto3.client('dynamodb')

# Create Table
table = dynamodb.create_table(
    TableName='auto-scaling-table',
    KeySchema=[
        {'AttributeName': 'id', 'KeyType': 'HASH'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'id', 'AttributeType': 'S'}
    ],
    BillingMode='PROVISIONED',
    ProvisionedThroughput={
        'ReadCapacityUnits': 5,
        'WriteCapacityUnits': 5
    }
)

# Configure Auto-Scaling
application_autoscaling = boto3.client('application-autoscaling')

# Read Capacity Auto-Scaling
application_autoscaling.register_scalable_target(
    ServiceNamespace='dynamodb',
    ResourceId='table/auto-scaling-table',
    ScalableDimension='dynamodb:table:ReadCapacityUnits',
    MinCapacity=5,
    MaxCapacity=1000
)

application_autoscaling.put_scaling_policy(
    PolicyName='DynamoDBReadScalingPolicy',
    ServiceNamespace='dynamodb',
    ResourceId='table/auto-scaling-table',
    ScalableDimension='dynamodb:table:ReadCapacityUnits',
    PolicyType='TargetTrackingScaling',
    TargetTrackingScalingPolicyConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'DynamoDBReadCapacityUtilization'
        },
        'TargetValue': 70.0,
        'ScaleInCooldown': 60,
        'ScaleOutCooldown': 60
    }
)
```

### 6.3 DynamoDB Advanced Features

```python
# DAX (DynamoDB Accelerator) - Microsecond Latency
import boto3

dax = boto3.client('dax')

# Create DAX Cluster
cluster = dax.create_cluster(
    ClusterName='my-dax-cluster',
    NodeType='dax.r5.large',
    ReplicationFactor=3,  # 3 Nodes
    IamRoleArn='arn:aws:iam::123456789:role/DAXRole',
    SubnetGroup='dax-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    SSESpecification={
        'Enabled': True
    }
)

# Use DAX Client
from amazondax import AmazonDaxClient

dax_client = AmazonDaxClient(
    endpoints=['my-dax-cluster.abc123.dax-clusters.us-east-1.amazonaws.com:8111']
)

# Cached Read - Microsecond Latency
response = dax_client.get_item(
    TableName='my-table',
    Key={'id': {'S': '12345'}}
)
```

```python
# DynamoDB Streams + Lambda Trigger
import boto3

lambda_client = boto3.client('lambda')

event_source_mapping = lambda_client.create_event_source_mapping(
    EventSourceArn='arn:aws:dynamodb:us-east-1:123456789:table/my-table/stream/2024-01-01T00:00:00.000',
    FunctionName='process-dynamodb-stream',
    StartingPosition='LATEST',
    BatchSize=100,
    MaximumBatchingWindowInSeconds=5,
    ParallelizationFactor=10,  # Concurrent partition processing
    DestinationConfig={
        'OnFailure': {
            'Destination': 'arn:aws:sns:us-east-1:123456789:stream-failures'
        }
    }
)
```

### 6.4 DynamoDB Global Tables

```python
# Create Multi-Region DynamoDB Global Table
import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# Create Table in First Region
table = dynamodb.create_table(
    TableName='global-users',
    KeySchema=[
        {'AttributeName': 'user_id', 'KeyType': 'HASH'}
    ],
    AttributeDefinitions=[
        {'AttributeName': 'user_id', 'AttributeType': 'S'}
    ],
    BillingMode='PAY_PER_REQUEST',
    StreamSpecification={
        'StreamEnabled': True,
        'StreamViewType': 'NEW_AND_OLD_IMAGES'
    }
)

# Convert to Global Table
dynamodb.update_table(
    TableName='global-users',
    ReplicaUpdates=[
        {
            'Create': {
                'RegionName': 'eu-west-1',
                'KMSMasterKeyId': 'alias/aws/dynamodb',
                'ProvisionedThroughputOverride': {
                    'ReadCapacityUnits': 5,
                    'WriteCapacityUnits': 5
                },
                'GlobalSecondaryIndexOverrides': [],
                'TableClassOverride': 'STANDARD'
            }
        },
        {
            'Create': {
                'RegionName': 'ap-northeast-1',
                'KMSMasterKeyId': 'alias/aws/dynamodb'
            }
        }
    ]
)
```

---

## 7. In-Memory Databases and Caching

### 7.1 Amazon ElastiCache

```mermaid
flowchart TB
    subgraph ElastiCache["ElastiCache Architecture"]
        subgraph Redis["Redis Mode"]
            ClusterMode["Cluster Mode"]
            Sentinel["Sentinel Mode"]
            Single["Single Node"]
        end
        
        subgraph Memcached["Memcached"]
            MCCluster["Multi-Node Cluster"]
            MCSingle["Single Node"]
        end
    end
    
    subgraph Clients["Clients"]
        App1[Web Application]
        App2[Mobile Backend]
        Lambda[Lambda Function]
    end
    
    ClusterMode --> App1
    MCCluster --> App2
    Single --> Lambda
```

**Redis vs Memcached**:

| Feature | Redis | Memcached |
|---------|-------|-----------|
| **Data Structures** | Strings, Lists, Sets, Hashes, Bitmaps, etc. | Key-value only |
| **Persistence** | RDB, AOF | None |
| **Replication** | Master-slave replication | None |
| **Clustering** | Native cluster mode | Client-side sharding |
| **Transactions** | Supported | Not supported |
| **Pub/Sub** | Supported | Not supported |
| **Use Cases** | Sessions, leaderboards, real-time analytics | Simple caching |

```python
# Create ElastiCache Redis Cluster Mode
import boto3

elasticache = boto3.client('elasticache')

# Create Redis 6.x Cluster
cluster = elasticache.create_replication_group(
    ReplicationGroupId='production-redis',
    ReplicationGroupDescription='Production Redis Cluster',
    
    # Engine Configuration
    Engine='redis',
    EngineVersion='7.0',
    
    # Node Configuration
    NodeGroupConfiguration=[
        {
            'NodeGroupId': '0001',
            'Slots': '0-5461',
            'ReplicaCount': 2,  # 2 Replicas per Shard
            'PrimaryAvailabilityZone': 'us-east-1a',
            'ReplicaAvailabilityZones': ['us-east-1b', 'us-east-1c']
        },
        {
            'NodeGroupId': '0002',
            'Slots': '5462-10922',
            'ReplicaCount': 2,
            'PrimaryAvailabilityZone': 'us-east-1b',
            'ReplicaAvailabilityZones': ['us-east-1a', 'us-east-1c']
        },
        {
            'NodeGroupId': '0003',
            'Slots': '10923-16383',
            'ReplicaCount': 2,
            'PrimaryAvailabilityZone': 'us-east-1c',
            'ReplicaAvailabilityZones': ['us-east-1a', 'us-east-1b']
        }
    ],
    
    # Instance Type
    CacheNodeType='cache.r6g.xlarge',
    
    # Network
    CacheSubnetGroupName='redis-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    
    # Encryption
    AtRestEncryptionEnabled=True,
    TransitEncryptionEnabled=True,
    
    # Auto Failover
    AutomaticFailoverEnabled=True,
    MultiAZEnabled=True,
    
    # Snapshots
    SnapshotRetentionLimit=35,
    SnapshotWindow='05:00-06:00',
    
    # Maintenance
    PreferredMaintenanceWindow='sun:06:00-sun:07:00'
)
```

### 7.2 Caching Strategies

```python
# Common Caching Pattern Implementations
import redis
import json
from functools import wraps

class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 3600  # 1 hour
    
    def cache_aside(self, key, loader_func, ttl=None):
        """Cache-Aside (Lazy Loading) Pattern"""
        # Try to get from cache first
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # Cache miss, load from database
        data = loader_func()
        
        # Write to cache
        self.redis.setex(
            key,
            ttl or self.default_ttl,
            json.dumps(data)
        )
        
        return data
    
    def write_through(self, key, data, db_write_func):
        """Write-Through Pattern"""
        # Write to database first
        result = db_write_func(data)
        
        # Then write to cache
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        return result
    
    def write_behind(self, key, data):
        """Write-Behind (Write-Back) Pattern"""
        # Write to cache only
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        # Async write to database (using queue)
        self.redis.lpush('write_queue', json.dumps({
            'key': key,
            'data': data
        }))
    
    def invalidate_cache(self, pattern):
        """Cache Invalidation"""
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)

# Usage Examples
cache = CacheManager(redis_client)

# Cache-Aside
def get_user(user_id):
    return cache.cache_aside(
        f"user:{user_id}",
        lambda: database.get_user(user_id),
        ttl=1800
    )

# Write-Through
def update_user(user_id, user_data):
    return cache.write_through(
        f"user:{user_id}",
        user_data,
        lambda data: database.update_user(user_id, data)
    )
```

---

## 8. Purpose-Built Database Services

### 8.1 Amazon DocumentDB (MongoDB-compatible)

```python
# Create DocumentDB Cluster
import boto3

docdb = boto3.client('docdb')

cluster = docdb.create_db_cluster(
    DBClusterIdentifier='documentdb-production',
    Engine='docdb',
    MasterUsername='docdbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # Instance Configuration
    DBClusterParameterGroupName='docdb.5.0',
    DBSubnetGroupName='docdb-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # Backup
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # Encryption
    StorageEncrypted=True,
    KmsKeyId='alias/aws/docdb',
    
    DeletionProtection=True
)

# Add Instances
instance = docdb.create_db_instance(
    DBClusterIdentifier='documentdb-production',
    DBInstanceIdentifier='docdb-instance-1',
    DBInstanceClass='db.r6g.large',
    Engine='docdb'
)
```

### 8.2 Amazon Neptune (Graph Database)

```python
# Create Neptune Cluster
import boto3

neptune = boto3.client('neptune')

cluster = neptune.create_db_cluster(
    DBClusterIdentifier='neptune-production',
    Engine='neptune',
    
    # Instance Configuration
    DBSubnetGroupName='neptune-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # Backup
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # Encryption
    StorageEncrypted=True,
    KmsKeyId='alias/aws/neptune',
    
    DeletionProtection=True,
    
    # Enable IAM Authentication
    IAMAuthEnabled=True
)

# Neptune Query Example (Gremlin)
"""
# Create Vertex
 g.addV('person').property('id', 'john').property('name', 'John')
 
 # Create Edge
 g.V().has('person', 'id', 'john')
   .addE('knows')
   .to(g.V().has('person', 'id', 'jane'))
   .property('since', '2020-01-01')
 
 # Traversal Query
 g.V().has('person', 'id', 'john')
   .out('knows')
   .values('name')
"""
```

### 8.3 Amazon Keyspaces (Cassandra-compatible)

```python
# Using Amazon Keyspaces (Managed Cassandra)
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

# Configuration
ssl_context = SSLContext(PROTOCOL_TLSv1_2)
ssl_context.load_verify_locations('path/to/sf-class2-root.crt')
ssl_context.verify_mode = CERT_REQUIRED

auth_provider = PlainTextAuthProvider(
    username='SERVICEUSERNAME',
    password='SERVICEPASSWORD'
)

cluster = Cluster(
    ['cassandra.us-east-1.amazonaws.com'],
    ssl_context=ssl_context,
    auth_provider=auth_provider,
    port=9142
)

session = cluster.connect()

# Create Keyspace
session.execute("""
    CREATE KEYSPACE IF NOT EXISTS mykeyspace
    WITH REPLICATION = {
        'class': 'SingleRegionStrategy'
    }
""")

# Create Table
session.execute("""
    CREATE TABLE IF NOT EXISTS mykeyspace.events (
        device_id text,
        event_time timestamp,
        event_type text,
        payload text,
        PRIMARY KEY (device_id, event_time)
    ) WITH CLUSTERING ORDER BY (event_time DESC)
""")
```

### 8.4 Purpose-Built Database Selection Guide

| Database | Data Model | Query Language | Best Scenarios |
|----------|------------|----------------|----------------|
| **DocumentDB** | Document (JSON) | MongoDB API | Content management, user profiles |
| **Neptune** | Graph (Property Graph/RDF) | Gremlin/SPARQL | Recommendation systems, knowledge graphs, fraud detection |
| **Keyspaces** | Wide-Column | CQL | IoT, time-series data, logs |
| **QLDB** | Immutable Ledger | PartiQL | Supply chain, financial transactions |
| **Timestream** | Time-Series | SQL | Monitoring metrics, IoT sensors |

---

## 9. Data Migration and Integration

### 9.1 AWS Database Migration Service (DMS)

```mermaid
flowchart LR
    Source[Source Database<br/>On-Prem/Cloud] --> DMS[AWS DMS]
    DMS --> Target[Target Database<br/>RDS/DynamoDB/S3]
    
    S3[(S3 Data Lake)] -.-> DMS
    DMS -.-> Kinesis[Kinesis Streams]
    
    style DMS fill:#ff9900
```

```python
# Create DMS Replication Task
import boto3

dms = boto3.client('dms')

# Create Source Endpoint
source_endpoint = dms.create_endpoint(
    EndpointIdentifier='source-postgres',
    EndpointType='source',
    EngineName='postgres',
    ServerName='on-prem-db.company.com',
    Port=5432,
    DatabaseName='production',
    Username='dms_user',
    Password='SecurePassword123!',
    ExtraConnectionAttributes='captureDdls=true'
)

# Create Target Endpoint (DynamoDB)
target_endpoint = dms.create_endpoint(
    EndpointIdentifier='target-dynamodb',
    EndpointType='target',
    EngineName='dynamodb',
    ServiceAccessRoleArn='arn:aws:iam::123456789:role/DMS-DynamoDB-Role'
)

# Create Replication Instance
replication_instance = dms.create_replication_instance(
    ReplicationInstanceIdentifier='dms-instance-1',
    ReplicationInstanceClass='dms.c5.2xlarge',
    AllocatedStorage=100,
    VpcSecurityGroupIds=['sg-12345678'],
    ReplicationSubnetGroupIdentifier='dms-subnet-group',
    PubliclyAccessible=False,
    MultiAZ=True
)

# Create Replication Task
task = dms.create_replication_task(
    ReplicationTaskIdentifier='postgres-to-dynamodb',
    SourceEndpointArn=source_endpoint['Endpoint']['EndpointArn'],
    TargetEndpointArn=target_endpoint['Endpoint']['EndpointArn'],
    ReplicationInstanceArn=replication_instance['ReplicationInstance']['ReplicationInstanceArn'],
    MigrationType='full-load-and-cdc',  # Full + Incremental
    TableMappings=json.dumps({
        'rules': [
            {
                'rule-type': 'selection',
                'rule-id': '1',
                'rule-name': '1',
                'object-locator': {
                    'schema-name': 'public',
                    'table-name': 'users'
                },
                'rule-action': 'include'
            },
            {
                'rule-type': 'object-mapping',
                'rule-id': '2',
                'rule-name': '2',
                'rule-action': 'map-record-to-record',
                'object-locator': {
                    'schema-name': 'public',
                    'table-name': 'users'
                },
                'target-table-name': 'UserTable'
            }
        ]
    })
)
```

### 9.2 AWS Glue Data Integration

```python
# AWS Glue ETL Job
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

# Read from S3
datasource = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={
        "paths": ["s3://raw-data-bucket/customers/"]
    },
    format="json"
)

# Data Transformation
mapped = ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("customer_id", "string", "id", "string"),
        ("full_name", "string", "name", "string"),
        ("email_address", "string", "email", "string"),
        ("signup_date", "string", "created_at", "timestamp")
    ]
)

# Filter Valid Records
filtered = Filter.apply(
    frame=mapped,
    f=lambda x: x["email"] is not None and "@" in x["email"]
)

# Write to DynamoDB
glueContext.write_dynamic_frame.from_options(
    frame=filtered,
    connection_type="dynamodb",
    connection_options={
        "dynamodb.output.tableName": "CustomerTable",
        "dynamodb.throughput.write.percent": "1.0"
    }
)

# Also Write to S3 as Data Lake
glueContext.write_dynamic_frame.from_options(
    frame=filtered,
    connection_type="s3",
    connection_options={
        "path": "s3://data-lake-bucket/processed/customers/"
    },
    format="parquet"
)

job.commit()
```

### 9.3 Data Pipeline Orchestration

```yaml
# AWS Step Functions Data Pipeline
StateMachine:
  Type: AWS::StepFunctions::StateMachine
  Properties:
    StateMachineName: data-pipeline
    RoleArn: !GetAtt StepFunctionsRole.Arn
    Definition:
      StartAt: Extract
      States:
        Extract:
          Type: Task
          Resource: arn:aws:states:::glue:startJobRun.sync
          Parameters:
            JobName: extract-job
          Next: Transform
          
        Transform:
          Type: Task
          Resource: arn:aws:states:::glue:startJobRun.sync
          Parameters:
            JobName: transform-job
          Next: LoadToMultipleTargets
          
        LoadToMultipleTargets:
          Type: Parallel
          Branches:
            - StartAt: LoadToRDS
              States:
                LoadToRDS:
                  Type: Task
                  Resource: arn:aws:states:::dynamodb:putItem
                  End: true
                  
            - StartAt: LoadToS3
              States:
                LoadToS3:
                  Type: Task
                  Resource: arn:aws:lambda:::function:upload-to-s3
                  End: true
                  
            - StartAt: LoadToRedshift
              States:
                LoadToRedshift:
                  Type: Task
                  Resource: arn:aws:states:::redshift:data:executeStatement.sync
                  End: true
          Next: Validate
          
        Validate:
          Type: Task
          Resource: arn:aws:lambda:::function:validate-data
          Next: CheckValidation
          
        CheckValidation:
          Type: Choice
          Choices:
            - Variable: $.validation_status
              StringEquals: SUCCESS
              Next: NotifySuccess
          Default: NotifyFailure
          
        NotifySuccess:
          Type: Task
          Resource: arn:aws:states:::sns:publish
          Parameters:
            TopicArn: !Ref PipelineTopic
            Message: "Data pipeline completed successfully"
          End: true
          
        NotifyFailure:
          Type: Task
          Resource: arn:aws:states:::sns:publish
          Parameters:
            TopicArn: !Ref PipelineTopic
            Message: "Data pipeline failed"
          End: true
```

---

## 10. Backup and Disaster Recovery

### 10.1 Backup Strategy Matrix

| Service | Native Backup | Snapshots | Cross-Region Replication | RTO | RPO |
|---------|---------------|-----------|--------------------------|-----|-----|
| **S3** | Versioning | ✅ | CRR | Minutes | Synchronous |
| **RDS** | Automated Backup | ✅ | Cross-Region Snapshots | Minutes-Hours | 5 minutes-24 hours |
| **Aurora** | Continuous Backup | ✅ | Global Database | < 1 minute | < 5 seconds |
| **DynamoDB** | Point-in-Time Recovery | ✅ | Global Tables | Minutes | Synchronous |
| **EBS** | Snapshots | ✅ | Cross-Region Replication | Minutes | Snapshot Interval |
| **EFS** | Backup Service | ✅ | Cross-Region Replication | Minutes | Hourly |

### 10.2 AWS Backup Centralized Management

```python
# AWS Backup Configuration
import boto3

backup = boto3.client('backup')

# Create Backup Plan
backup_plan = backup.create_backup_plan(
    BackupPlan={
        'BackupPlanName': 'production-backup-plan',
        'Rules': [
            {
                'RuleName': 'daily-backup',
                'TargetBackupVaultName': 'Default',
                'ScheduleExpression': 'cron(0 5 ? * * *)',
                'StartWindowMinutes': 60,
                'CompletionWindowMinutes': 120,
                'Lifecycle': {
                    'MoveToColdStorageAfterDays': 30,
                    'DeleteAfterDays': 365
                },
                'RecoveryPointTags': {
                    'BackupType': 'Daily'
                }
            },
            {
                'RuleName': 'weekly-backup',
                'TargetBackupVaultName': 'Default',
                'ScheduleExpression': 'cron(0 5 ? * 1 *)',
                'Lifecycle': {
                    'DeleteAfterDays': 2555  # 7 years
                },
                'RecoveryPointTags': {
                    'BackupType': 'Weekly'
                }
            }
        ]
    }
)

# Create Resource Assignment
selection = backup.create_backup_selection(
    BackupPlanId=backup_plan['BackupPlanId'],
    BackupSelection={
        'SelectionName': 'production-resources',
        'IamRoleArn': 'arn:aws:iam::123456789:role/AWSBackupRole',
        'Resources': [
            'arn:aws:dynamodb:us-east-1:123456789:table/*',
            'arn:aws:rds:us-east-1:123456789:db:*',
            'arn:aws:elasticfilesystem:us-east-1:123456789:file-system/*'
        ],
        'ListOfTags': [
            {
                'ConditionType': 'STRINGEQUALS',
                'ConditionKey': 'Environment',
                'ConditionValue': 'production'
            }
        ]
    }
)
```

### 10.3 Cross-Region Disaster Recovery

```mermaid
flowchart TB
    subgraph Primary["Primary Region (us-east-1)"]
        P_RDS[(RDS Primary)]
        P_DDB[(DynamoDB)]
        P_S3[S3 Bucket]
        
        P_RDS -->|Snapshot Replication| S3_Snapshot[(S3 Snapshot Storage)]
    end
    
    subgraph DR["DR Region (us-west-2)"]
        D_RDS[(RDS Standby)]
        D_DDB[(DynamoDB Global)]
        D_S3[S3 Bucket]
    end
    
    S3_Snapshot -.-> D_RDS
    P_DDB -.->|Global Table Replication| D_DDB
    P_S3 -.->|CRR| D_S3
    
    Route53[Route 53<br/>Failover] -->|Normal| P_RDS
    Route53 -->|Failure| D_RDS
```

```python
# Automated Disaster Recovery Drill
import boto3

def initiate_dr_failover():
    """Initiate disaster recovery failover"""
    
    rds = boto3.client('rds', region_name='us-west-2')
    route53 = boto3.client('route53')
    
    # 1. Promote Read Replica to Primary
    rds.promote_read_replica(
        DBInstanceIdentifier='dr-postgres-replica',
        BackupRetentionPeriod=7
    )
    
    # 2. Update Route 53 DNS
    route53.change_resource_record_sets(
        HostedZoneId='Z123456789',
        ChangeBatch={
            'Changes': [
                {
                    'Action': 'UPSERT',
                    'ResourceRecordSet': {
                        'Name': 'db.example.com',
                        'Type': 'CNAME',
                        'TTL': 60,
                        'ResourceRecords': [
                            {'Value': 'dr-postgres.abcxyz.us-west-2.rds.amazonaws.com'}
                        ]
                    }
                }
            ]
        }
    )
    
    # 3. Activate DynamoDB Global Table Writes
    dynamodb = boto3.client('dynamodb', region_name='us-west-2')
    dynamodb.update_table(
        TableName='global-users',
        ReplicaUpdates=[
            {
                'Update': {
                    'RegionName': 'us-west-2',
                    'ReadCapacityUnits': 10,
                    'WriteCapacityUnits': 10
                }
            }
        ]
    )
```

---

## 11. Performance Optimization and Monitoring

### 11.1 CloudWatch Monitoring Metrics

```python
# Custom CloudWatch Dashboard
import boto3

cloudwatch = boto3.client('cloudwatch')

# Create Database Monitoring Dashboard
dashboard_body = {
    "widgets": [
        {
            "type": "metric",
            "properties": {
                "title": "RDS CPU Utilization",
                "metrics": [
                    ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "production-postgres"]
                ],
                "period": 60,
                "stat": "Average",
                "region": "us-east-1"
            }
        },
        {
            "type": "metric", 
            "properties": {
                "title": "DynamoDB Throttled Requests",
                "metrics": [
                    ["AWS/DynamoDB", "ThrottledRequests", "TableName", "UserTable"]
                ],
                "period": 60,
                "stat": "Sum",
                "region": "us-east-1"
            }
        },
        {
            "type": "metric",
            "properties": {
                "title": "ElastiCache Memory Usage",
                "metrics": [
                    ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "CacheClusterId", "redis-cluster"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "us-east-1"
            }
        }
    ]
}

cloudwatch.put_dashboard(
    DashboardName='Database-Monitoring',
    DashboardBody=json.dumps(dashboard_body)
)

# Create Alarms
cloudwatch.put_metric_alarm(
    AlarmName='rds-high-cpu',
    AlarmDescription='RDS CPU > 80% for 5 minutes',
    MetricName='CPUUtilization',
    Namespace='AWS/RDS',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=1,
    Threshold=80,
    ComparisonOperator='GreaterThanThreshold',
    Dimensions=[
        {'Name': 'DBInstanceIdentifier', 'Value': 'production-postgres'}
    ],
    AlarmActions=[
        'arn:aws:sns:us-east-1:123456789:dba-alerts'
    ]
)
```

### 11.2 Performance Optimization Checklist

```markdown
## Database Performance Optimization Checklist

### RDS/Aurora
- [ ] Enable Performance Insights
- [ ] Configure appropriate instance types (CPU/memory balance)
- [ ] Use Provisioned IOPS (io2) or gp3 storage
- [ ] Enable query cache (MySQL) or shared buffer optimization (PostgreSQL)
- [ ] Configure read replicas to distribute read load
- [ ] Regularly analyze slow query logs
- [ ] Use connection pooling (RDS Proxy)

### DynamoDB
- [ ] Use composite primary key design to avoid hot partitions
- [ ] Properly design GSI to support query patterns
- [ ] Enable DAX caching for high-frequency queries
- [ ] Use batch operations (BatchGetItem/BatchWriteItem)
- [ ] Evaluate On-Demand vs Provisioned capacity
- [ ] Monitor ThrottledRequests metrics
- [ ] Use parallel scan for large datasets

### ElastiCache
- [ ] Choose appropriate caching strategy (Cache-Aside/Write-Through)
- [ ] Set reasonable TTL
- [ ] Enable cluster mode for horizontal scaling
- [ ] Monitor cache hit rate
- [ ] Configure memory eviction policy
- [ ] Use pipeline to reduce round-trip latency

### S3
- [ ] Use S3 Transfer Acceleration
- [ ] Multipart upload for large files
- [ ] Enable S3 Select to reduce data transfer
- [ ] Use CloudFront for frequently accessed objects
- [ ] Configure lifecycle policies for automatic archival
```

---

## 12. Database Containerization and Docker

### 12.1 Database Containerization Overview

Database containerization is an important part of modern application architecture, providing consistent development environments and simplified deployment processes.

```mermaid
flowchart TB
    subgraph Traditional["Traditional Deployment"]
        DB1[(MySQL)]
        DB2[(PostgreSQL)]
        DB3[(Redis)]
    end
    
    subgraph Containerized["Containerized Deployment"]
        Docker[(Docker)]
        C1[MySQL Container]
        C2[Postgres Container]
        C3[Redis Container]
    end
    
    Traditional -->|Migrate| Containerized
```

**Advantages of Containerized Databases**:

| Feature | Virtual Machines | Docker Containers |
|---------|------------------|-------------------|
| Startup Time | Minutes | Seconds |
| Resource Usage | GB-level | MB-level |
| Environment Consistency | Poor | Excellent |
| Version Management | Complex | Simple (image tags) |
| Development Testing | Difficult | Extremely easy |
| Production Deployment | Traditional | Cloud-native friendly |

### 12.2 Common Database Docker Images

**MySQL / MariaDB**:

```yaml
# docker-compose.mysql.yml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: mysql-prod
    environment:
      MYSQL_ROOT_PASSWORD: SecureRootPass123!
      MYSQL_DATABASE: myapp
      MYSQL_USER: appuser
      MYSQL_PASSWORD: AppPass456!
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./mysql/my.cnf:/etc/mysql/conf.d/custom.cnf
    command: >
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p$${MYSQL_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    ports:
      - "8080:80"
    environment:
      PMA_HOST: mysql
      PMA_PORT: 3306
      PMA_ARBITRARY: 1
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:
```

**PostgreSQL**:

```yaml
# docker-compose.postgres.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: myapp
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres/init:/docker-entrypoint-initdb.d
    command:
      - "postgres"
      - "-c"
      - "max_connections=200"
      - "-c"
      - "shared_buffers=256MB"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    ports:
      - "5050:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    volumes:
      - pgadmin_data:/var/lib/pgadmin

volumes:
  postgres_data:
  pgadmin_data:
```

**Redis**:

```yaml
# docker-compose.redis.yml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: redis-cache
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  redis-commander:
    image: rediscommander/redis-commander:latest
    ports:
      - "8081:8081"
    environment:
      REDIS_HOSTS: local:redis:6379

volumes:
  redis_data:
```

**MongoDB**:

```yaml
# docker-compose.mongodb.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mongodb
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: AdminPass123!
      MONGO_INITDB_DATABASE: myapp
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
      - ./mongo/init.js:/docker-entrypoint-initdb.d/init.js:ro

  mongo-express:
    image: mongo-express:latest
    ports:
      - "8082:8081"
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: AdminPass123!
      ME_CONFIG_MONGODB_URL: mongodb://admin:AdminPass123!@mongodb:27017/
    depends_on:
      - mongodb

volumes:
  mongo_data:
```

### 12.3 Production-Grade Database Container Configuration

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  postgres-primary:
    image: postgres:16-alpine
    container_name: postgres-primary
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --locale=en_US.UTF-8"
    ports:
      - "5432:5432"
    volumes:
      - type: volume
        source: postgres_primary_data
        target: /var/lib/postgresql/data
      - type: bind
        source: ./backups
        target: /backups
    command: >
      postgres
      -c wal_level=replica
      -c max_wal_senders=10
      -c max_replication_slots=10
      -c hot_standby=on
      -c shared_buffers=1GB
      -c effective_cache_size=3GB
      -c work_mem=16MB
      -c maintenance_work_mem=256MB
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 30s
    restart: always
    networks:
      - db-network

  postgres-replica:
    image: postgres:16-alpine
    container_name: postgres-replica
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    command: >
      bash -c 
      "
      pg_basebackup -h postgres-primary -D /var/lib/postgresql/data -U replicator -v -P -W &&
      echo 'standby_mode = on' >> /var/lib/postgresql/data/recovery.conf &&
      echo 'primary_conninfo = host=postgres-primary port=5432 user=replicator password=${REPLICATOR_PASSWORD}' >> /var/lib/postgresql/data/recovery.conf &&
      postgres
      "
    depends_on:
      - postgres-primary
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
    networks:
      - db-network

  pgbackup:
    image: postgres:16-alpine
    container_name: postgres-backup
    environment:
      PGHOST: postgres-primary
      PGUSER: ${DB_USER}
      PGPASSWORD: ${DB_PASSWORD}
      BACKUP_DIR: /backups
      BACKUP_RETENTION_DAYS: "7"
    volumes:
      - ./backups:/backups
      - ./scripts/backup.sh:/backup.sh:ro
    command: >
      sh -c "echo '0 2 * * * /backup.sh' | crontab - && crond -f"
    depends_on:
      - postgres-primary
    networks:
      - db-network

volumes:
  postgres_primary_data:
    driver: local
  postgres_replica_data:
    driver: local

networks:
  db-network:
    driver: bridge
```

### 12.4 Database Backup and Recovery Scripts

```bash
#!/bin/bash
# backup.sh - Database Backup Script Inside Container

set -e

DB_NAME=${DB_NAME:-myapp}
BACKUP_DIR=${BACKUP_DIR:-/backups}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql"

echo "Starting backup of ${DB_NAME} at $(date)"

# Create backup
pg_dump -h postgres-primary -U ${PGUSER} -d ${DB_NAME} \
    --verbose \
    --format=plain \
    --file=${BACKUP_FILE}

# Compress backup
gzip ${BACKUP_FILE}
BACKUP_FILE="${BACKUP_FILE}.gz"

# Verify backup
if [ -f "${BACKUP_FILE}" ]; then
    echo "Backup completed: ${BACKUP_FILE}"
    ls -lh ${BACKUP_FILE}
else
    echo "Backup failed!"
    exit 1
fi

# Clean old backups
echo "Cleaning backups older than ${RETENTION_DAYS} days"
find ${BACKUP_DIR} -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup process completed at $(date)"
```

```bash
#!/bin/bash
# restore.sh - Database Recovery Script

BACKUP_FILE=$1
DB_NAME=${DB_NAME:-myapp}
CONTAINER_NAME=${CONTAINER_NAME:-postgres-primary}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Restoring database from ${BACKUP_FILE}"

# Copy backup to container
docker cp ${BACKUP_FILE} ${CONTAINER_NAME}:/tmp/restore.sql.gz

# Restore database
docker exec ${CONTAINER_NAME} bash -c "
    gunzip -c /tmp/restore.sql.gz | psql -U ${DB_USER} -d ${DB_NAME}
"

echo "Restore completed"
```

### 12.5 AWS Database Services and Docker Integration

**Local Development Using AWS Database Service Images**:

```yaml
# docker-compose.aws-local.yml
version: '3.8'

services:
  # DynamoDB Local
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb"
    volumes:
      - dynamodb_data:/home/dynamodblocal/data

  # AWS RDS Simulation (Using Actual Database)
  postgres-aws:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${RDS_USERNAME}
      POSTGRES_PASSWORD: ${RDS_PASSWORD}
      POSTGRES_DB: ${RDS_DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - postgres_aws_data:/var/lib/postgresql/data

  # Local S3 (MinIO)
  minio:
    image: minio/minio:latest
    container_name: minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: ${AWS_ACCESS_KEY_ID}
      MINIO_ROOT_PASSWORD: ${AWS_SECRET_ACCESS_KEY}
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

  # Initialization Script
  init-aws:
    image: amazon/aws-cli:latest
    environment:
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_DEFAULT_REGION: us-east-1
    entrypoint: /bin/sh
    command: >
      -c "
      aws --endpoint-url=http://minio:9000 s3 mb s3://my-bucket || true &&
      aws --endpoint-url=http://dynamodb-local:8000 dynamodb create-table \\
        --table-name my-table \\
        --attribute-definitions AttributeName=id,AttributeType=S \\
        --key-schema AttributeName=id,KeyType=HASH \\
        --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 || true
      "
    depends_on:
      - minio
      - dynamodb-local

volumes:
  dynamodb_data:
  postgres_aws_data:
  minio_data:
```

### 12.6 AWS DMS and Docker Data Migration Practice

**Using Docker to Run DMS Replication Instance Local Simulation**:

```yaml
# docker-compose.dms.yml
version: '3.8'

services:
  # Source Database (Simulate Local MySQL)
  source-mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: source_db
      MYSQL_USER: dms_user
      MYSQL_PASSWORD: dms_pass
    ports:
      - "3306:3306"
    volumes:
      - source_mysql_data:/var/lib/mysql
      - ./mysql/init-source.sql:/docker-entrypoint-initdb.d/init.sql

  # Target Database (Simulate RDS PostgreSQL)
  target-postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: target_db
    ports:
      - "5432:5432"
    volumes:
      - target_postgres_data:/var/lib/postgresql/data

  # DMS Local Test Tool
  dms-local:
    image: amazonlinux:2
    volumes:
      - ./dms-scripts:/scripts
      - ~/.aws:/root/.aws:ro
    command: >
      bash -c "
        yum install -y mysql postgresql jq &&
        tail -f /dev/null
      "
    depends_on:
      - source-mysql
      - target-postgres

  # AWS CLI for Triggering Actual DMS Tasks
  aws-cli:
    image: amazon/aws-cli:latest
    environment:
      AWS_PROFILE: default
    volumes:
      - ~/.aws:/root/.aws:ro
      - ./dms-config:/config
    command: >
      sh -c "
        aws dms describe-replication-tasks --region us-east-1
      "

volumes:
  source_mysql_data:
  target_postgres_data:
```

**DMS Data Validation Script**:

```bash
#!/bin/bash
# dms-validate.sh - Validate DMS Migration Results

SOURCE_HOST=${SOURCE_HOST:-source-mysql}
TARGET_HOST=${TARGET_HOST:-target-postgres}
SOURCE_DB=${SOURCE_DB:-source_db}
TARGET_DB=${TARGET_DB:-target_db}

echo "=== DMS Data Validation ==="

# Source Table Record Count
echo "Source Database Record Count:"
docker exec source-mysql mysql -u root -prootpass -e "
    SELECT 
        table_name,
        table_rows
    FROM information_schema.tables
    WHERE table_schema = '${SOURCE_DB}'
" 2>/dev/null

# Target Table Record Count
echo -e "\nTarget Database Record Count:"
docker exec target-postgres psql -U postgres -d ${TARGET_DB} -c "
    SELECT 
        schemaname,
        relname as table_name,
        n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
" 2>/dev/null

# Data Checksum Comparison
echo -e "\nData Validation:"
docker exec dms-local bash /scripts/compare-data.sh
```

### 12.7 Amazon RDS and Docker Development Workflow

**Local Development Using Docker Images with Same Version as RDS**:

```yaml
# docker-compose.rds-dev.yml
version: '3.8'

services:
  # Local Development Environment with Same Version as RDS MySQL 8.0.33
  mysql-rds:
    image: mysql:8.0.33  # Same as RDS Version
    container_name: mysql-rds-local
    environment:
      MYSQL_ROOT_PASSWORD: ${RDS_MASTER_PASSWORD}
      MYSQL_DATABASE: ${RDS_DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - rds_mysql_data:/var/lib/mysql
      - ./my.cnf:/etc/mysql/my.cnf:ro  # Use Config Similar to RDS
    command: >
      mysqld
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb_buffer_pool_size=256M
      --max_connections=100
      --slow_query_log=1
      --long_query_time=2

  # Database Migration Tool (Flyway/Liquibase)
  db-migrate:
    image: flyway/flyway:latest
    volumes:
      - ./migrations:/flyway/sql
    environment:
      FLYWAY_URL: jdbc:mysql://mysql-rds:3306/${RDS_DB_NAME}
      FLYWAY_USER: root
      FLYWAY_PASSWORD: ${RDS_MASTER_PASSWORD}
    command: migrate
    depends_on:
      - mysql-rds

  # Database Management Tool
  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    ports:
      - "8080:80"
    environment:
      PMA_HOST: mysql-rds
      PMA_PORT: 3306

volumes:
  rds_mysql_data:
```

**RDS Parameter Group Simulation Configuration** (my.cnf):

```ini
[mysqld]
# Similar to RDS Default Parameter Group Configuration
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_connections = 100
innodb_buffer_pool_size = 256M
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 1
slow_query_log = 1
long_query_time = 2
performance_schema = 1
```

### 12.8 Aurora and Docker Test Environment

**Using Docker to Simulate Aurora Read/Write Splitting**:

```yaml
# docker-compose.aurora.yml
version: '3.8'

services:
  # Aurora Writer (Simulated)
  aurora-writer:
    image: mysql:8.0
    container_name: aurora-writer
    environment:
      MYSQL_ROOT_PASSWORD: aurora123
      MYSQL_DATABASE: aurora_db
    ports:
      - "3306:3306"
    volumes:
      - aurora_writer_data:/var/lib/mysql
    command: >
      mysqld
      --server-id=1
      --log-bin=mysql-bin
      --binlog-format=ROW
      --gtid-mode=ON
      --enforce-gtid-consistency=ON

  # Aurora Reader (Simulate Read Replica)
  aurora-reader:
    image: mysql:8.0
    container_name: aurora-reader
    environment:
      MYSQL_ROOT_PASSWORD: aurora123
      MYSQL_DATABASE: aurora_db
    ports:
      - "3307:3306"
    volumes:
      - aurora_reader_data:/var/lib/mysql
    command: >
      bash -c "
        # Wait for writer to start
        sleep 30 &&
        # Copy data from writer
        mysqldump -h aurora-writer -u root -paurora123 --all-databases > /tmp/dump.sql &&
        mysql -u root -paurora123 < /tmp/dump.sql &&
        # Configure Read-Only
        mysql -u root -paurora123 -e 'SET GLOBAL read_only = ON;' &&
        mysqld
      "
    depends_on:
      - aurora-writer

  # Read/Write Splitting Proxy (ProxySQL)
  proxysql:
    image: proxysql/proxysql:latest
    ports:
      - "6033:6033"   # Application Port
      - "6032:6032"   # Admin Port
    volumes:
      - ./proxysql.cnf:/etc/proxysql.cnf:ro
    depends_on:
      - aurora-writer
      - aurora-reader

volumes:
  aurora_writer_data:
  aurora_reader_data:
```

**ProxySQL Configuration** (proxysql.cnf):

```ini
datadir="/var/lib/proxysql"

admin_variables=
{
    admin_credentials="admin:admin"
    mysql_ifaces="0.0.0.0:6032"
}

mysql_variables=
{
    threads=4
    max_connections=2048
    default_query_delay=0
    default_query_timeout=36000000
    have_compress=true
    poll_timeout=2000
}

mysql_servers =
(
    { hostgroup_id=1, hostname="aurora-writer", port=3306 },
    { hostgroup_id=2, hostname="aurora-reader", port=3306 }
)

mysql_users =
(
    { username="root", password="aurora123", default_hostgroup=1 }
)

mysql_query_rules =
(
    {
        rule_id=100
        active=1
        match_pattern="^SELECT.*FOR UPDATE"
        destination_hostgroup=1
        apply=1
    },
    {
        rule_id=200
        active=1
        match_pattern="^SELECT"
        destination_hostgroup=2
        apply=1
    }
)
```

### 12.9 Docker Volume Performance Optimization

```yaml
# High-Performance Database Volume Configuration
version: '3.8'

services:
  postgres-perf:
    image: postgres:16-alpine
    volumes:
      # Use Named Volume
      - type: volume
        source: postgres_fast
        target: /var/lib/postgresql/data
        volume:
          nocopy: true
      # Bind Mount for Backups
      - type: bind
        source: /fast/ssd/backups
        target: /backups
    # Performance Tuning
    sysctls:
      - net.core.somaxconn=65535
    ulimits:
      nofile:
        soft: 65536
        hard: 65536
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 8G

# Use Local Driver for Best Performance
volumes:
  postgres_fast:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /fast/ssd/postgres
```

### 12.7 Database Container Monitoring

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  # PostgreSQL Exporter
  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    environment:
      DATA_SOURCE_NAME: "postgresql://postgres:password@postgres:5432/postgres?sslmode=disable"
    ports:
      - "9187:9187"
    depends_on:
      - postgres

  # Redis Exporter
  redis-exporter:
    image: oliver006/redis_exporter:latest
    environment:
      REDIS_ADDR: redis://redis:6379
    ports:
      - "9121:9121"
    depends_on:
      - redis

  # MySQL Exporter
  mysql-exporter:
    image: prom/mysqld-exporter:latest
    environment:
      DATA_SOURCE_NAME: "exporter:password@(mysql:3306)/"
    ports:
      - "9104:9104"
    depends_on:
      - mysql

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards

volumes:
  prometheus_data:
  grafana_data:
```

---

## 13. Security and Compliance

### 12.1 Data Encryption Strategy

```mermaid
flowchart TB
    subgraph Encryption["Encryption Layers"]
        Transit["In-Transit Encryption<br/>TLS 1.3"]
        Rest["At-Rest Encryption"]
        Client["Client-Side Encryption"]
    end
    
    subgraph KMS["KMS Key Management"]
        AWSManaged["AWS Managed Keys<br/>(Free)"]
        CustomerManaged["Customer Managed Keys<br/>(CMK)"]
        CloudHSM["CloudHSM<br/>(Dedicated Hardware)"]
    end
    
    subgraph Services["Service Integration"]
        S3Enc[S3 SSE-S3/SSE-KMS]
        RDSEnc[RDS Encryption]
        DynamoEnc[DynamoDB Encryption]
        EBSDec[EBS Encryption]
    end
    
    Rest --> KMS
    KMS --> Services
```

```python
# Using KMS Customer Managed Keys
import boto3

kms = boto3.client('kms')

# Create CMK
key = kms.create_key(
    Description='Production Database Encryption Key',
    KeyUsage='ENCRYPT_DECRYPT',
    KeySpec='SYMMETRIC_DEFAULT',
    Origin='AWS_KMS',
    Tags=[
        {'TagKey': 'Environment', 'TagValue': 'production'},
        {'TagKey': 'Service', 'TagValue': 'databases'}
    ]
)

key_id = key['KeyMetadata']['KeyId']

# Create Alias
kms.create_alias(
    AliasName='alias/production-database-key',
    TargetKeyId=key_id
)


# Configure Key Policy
kms.put_key_policy(
    KeyId=key_id,
    PolicyName='default',
    Policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::123456789:root"
                },
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow RDS Service",
                "Effect": "Allow",
                "Principal": {
                    "Service": "rds.amazonaws.com"
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:GenerateDataKey*"
                ],
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "kms:CallerAccount": "123456789"
                    }
                }
            }
        ]
    })
)
```

### 12.2 Compliance Configuration

```yaml
# GDPR/PCI DSS Compliant S3 Configuration
Resources:
  CompliantBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: compliant-data-bucket
      
      # Encryption
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKey
            BucketKeyEnabled: true
      
      # Object Lock - Deletion Prevention
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
      
      # Public Access Block
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # Versioning
      VersioningConfiguration:
        Status: Enabled
      
      # Logging
      LoggingConfiguration:
        DestinationBucketName: !Ref AuditLogBucket
        LogFilePrefix: s3-access-logs/
      
      # Tag Sensitive Data
      Tags:
        - Key: Classification
          Value: Confidential
        - Key: DataSubject
          Value: PII
        - Key: RetentionPeriod
          Value: 7Years
```

### 12.3 Auditing and Logging

```python
# Enable CloudTrail Data Event Logging
import boto3

cloudtrail = boto3.client('cloudtrail')

# Create Trail
trail = cloudtrail.create_trail(
    Name='data-access-trail',
    S3BucketName='cloudtrail-logs-bucket',
    IsMultiRegionTrail=True,
    EnableLogFileValidation=True,
    KMSKeyId='alias/cloudtrail-encryption'
)

# Configure Event Selectors for Data Events
cloudtrail.put_event_selectors(
    TrailName='data-access-trail',
    EventSelectors=[
        {
            'ReadWriteType': 'All',
            'IncludeManagementEvents': True,
            'DataResources': [
                {
                    'Type': 'AWS::S3::Object',
                    'Values': [
                        'arn:aws:s3:::sensitive-data-bucket/',
                        'arn:aws:s3:::financial-reports/'
                    ]
                },
                {
                    'Type': 'AWS::Lambda::Function',
                    'Values': [
                        'arn:aws:lambda:us-east-1:123456789:function:data-processor'
                    ]
                }
            ]
        }
    ]
)

# Enable Logging
cloudtrail.start_logging(Name='data-access-trail')
```

### 12.4 Data Masking and Tokenization

```python
# Use AWS Macie to Automatically Discover Sensitive Data
import boto3

macie = boto3.client('macie2')

# Enable Macie
macie.enable_macie(
    status='ENABLED',
    findingPublishingFrequency='FIFTEEN_MINUTES'
)

# Create Sensitive Data Discovery Job
job = macie.create_classification_job(
    jobType='SCHEDULED',
    name='daily-sensitive-data-scan',
    scheduleFrequency={
        'dailySchedule': {}
    },
    s3JobDefinition={
        'bucketDefinitions': [
            {
                'accountId': '123456789',
                'buckets': [
                    'customer-data-bucket',
                    'financial-reports'
                ]
            }
        ],
        'scoping': {
            'includes': {
                'and': [
                    {
                        'simpleScopeTerm': {
                            'comparator': 'EQ',
                            'key': 'OBJECT_EXTENSION',
                            'values': ['csv', 'json', 'parquet']
                        }
                    }
                ]
            }
        }
    },
    customDataIdentifierIds=[],  # Use Built-in Identifiers
    samplingPercentage=100
)

# Use AWS Glue for Data Masking
"""
# PySpark Masking Example
def mask_pii(df):
    from pyspark.sql.functions import regexp_replace, sha2
    
    # Mask Email
    df = df.withColumn('email', 
        regexp_replace('email', '(?<=.{2}).(?=.*@)', '*'))
    
    # Hash SSN
    df = df.withColumn('ssn_hash', 
        sha2('ssn', 256)).drop('ssn')
    
    # Truncate Credit Card Number
    df = df.withColumn('card_last4',
        regexp_replace('credit_card', '.*(\\d{4})$', '****$1'))
    
    return df
"""
```

---

## Summary

AWS provides a comprehensive data storage and database service matrix, meeting various needs from simple object storage to complex purpose-built databases:

### Storage Service Selection Quick Reference

| Requirement | Recommended Service |
|-------------|---------------------|
| Data lake/backup/static website | S3 |
| Linux shared files | EFS |
| Windows file sharing | FSx for Windows |
| HPC/machine learning | FSx for Lustre |
| EC2 boot/data volumes | EBS |

### Database Service Selection Quick Reference

| Requirement | Recommended Service |
|-------------|---------------------|
| Traditional relational applications | RDS |
| High-throughput cloud-native | Aurora |
| Internet-scale NoSQL | DynamoDB |
| MongoDB compatible | DocumentDB |
| Graph data/knowledge graphs | Neptune |
| Time-series data | Timestream |
| In-memory caching | ElastiCache |
| Immutable ledger | QLDB |

### Key Best Practices

1. **Security First**: Always enable encryption, principle of least privilege, regular auditing
2. **Backup Strategy**: 3-2-1 principle (3 copies, 2 media types, 1 offsite)
3. **Monitoring Alerts**: Establish comprehensive observability system
4. **Cost Optimization**: Use lifecycle management, select appropriate storage classes
5. **High Availability**: Multi-AZ deployment, cross-region replication, automatic failover

Continuously optimize performance, security, and cost to build reliable data storage architecture.

---

*Version: v1.0*  
*Updated: 2026-03-02*
