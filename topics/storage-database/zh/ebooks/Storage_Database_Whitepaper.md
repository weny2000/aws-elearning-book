# AWS 文件存储与数据库技术白皮书

> 全面掌握 AWS 数据存储服务：从对象存储到专用数据库

---

## 目录

> **学习指引**: 本白皮书按"存储类型→数据库服务→运维实践"递进。建议先掌握前4章存储基础，再深入学习数据库选型与运维。

1. **[存储与数据库概述](#1-存储与数据库概述)**  
   *建立全局视野：理解 AWS 存储服务分类体系、数据访问模式和选型决策树，为后续专项学习建立框架。*

2. **[Amazon S3 对象存储](#2-amazon-s3-对象存储)**  
   *掌握云存储基石：深入学习 S3 核心概念、存储类别、生命周期管理——AWS 使用最广泛的存储服务。*

3. **[文件存储服务](#3-文件存储服务)**  
   *扩展文件级存储：对比 EFS、FSx 系列服务，理解何时选择托管文件系统而非对象存储。*

4. **[Amazon EBS 块存储](#4-amazon-ebs-块存储)**  
   *EC2 存储基础：学习卷类型选择、快照策略、I/O 优化，为 EC2 工作负载设计最优存储方案。*

5. **[关系型数据库](#5-关系型数据库)**  
   *托管数据库服务：深入 RDS、Aurora 架构，掌握多可用区、只读副本、性能洞察等核心能力。*

6. **[Amazon DynamoDB](#6-amazon-dynamodb)**  
   *NoSQL 数据建模：学习键值/文档数据库设计、分区键策略、DAX 缓存、全局表等高级特性。*

7. **[内存数据库与缓存](#7-内存数据库与缓存)**  
   *加速数据访问：掌握 ElastiCache (Redis/Memcached) 和 MemoryDB 的使用场景与性能调优。*

8. **[专用数据库服务](#8-专用数据库服务)**  
   *为特定场景选择：了解 DocumentDB、Keyspaces、Neptune、Timestream、QLDB 等专用数据库。*

9. **[数据迁移与集成](#9-数据迁移与集成)**  
   *数据流动方案：学习 DMS、SCT、DataSync、Glue 等迁移工具，掌握异构数据库迁移策略。*

10. **[备份与灾难恢复](#10-备份与灾难恢复)**  
    *保护数据资产：对比 AWS Backup、快照、跨区域复制等备份方案，设计 RPO/RTO 满足业务需求。*

11. **[性能优化与监控](#11-性能优化与监控)**  
    *提升存储效率：学习 CloudWatch 存储指标、Performance Insights、DynamoDB 容量模式优化。*

12. **[数据库容器化与 Docker](#12-数据库容器化与-docker)** 🐳  
    *现代化运维：学习本地 Docker 数据库开发、RDS 代理、ECS/EKS 数据库部署、LocalStack 本地测试。*

13. **[安全与合规](#13-安全与合规)**  
    *数据安全体系：整合前述知识，学习加密(KMS)、IAM 授权、VPC 隔离、合规审计等全栈安全策略。*

---

## 1. 存储与数据库概述

### 1.1 AWS 存储服务分类

```mermaid
flowchart TB
    subgraph Object["对象存储"]
        S3[S3 Standard]
        S3IA[S3 Standard-IA]
        S3Glacier[S3 Glacier]
        S3Intelligent[S3 Intelligent-Tiering]
    end
    
    subgraph File["文件存储"]
        EFS[EFS Standard]
        EFSIA[EFS IA]
        FSxWin[FSx Windows]
        FSxLustre[FSx Lustre]
        FSxONTAP[FSx ONTAP]
        FSxOpenZFS[FSx OpenZFS]
    end
    
    subgraph Block["块存储"]
        GP3[gp3 通用型]
        IO2[io2 预置 IOPS]
        ST1[st1 吞吐优化]
        SC1[sc1 Cold]
    end
    
    subgraph Database["数据库"]
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

### 1.2 存储服务对比

| 特性 | S3 | EFS | EBS | FSx |
|------|----|-----|-----|-----|
| **存储类型** | 对象 | 文件 (NFS) | 块 | 文件 (多协议) |
| **访问方式** | HTTP API | NFSv4 | iSCSI | SMB/NFS/Lustre |
| **可用性** | 99.99% | 99.99% | 99.9% | 99.99% |
| **持久性** | 99.999999999% | 高 | 99.8-99.9% | 高 |
| **延迟** | 毫秒级 | 毫秒级 | 微秒级 | 亚毫秒级 |
| **最大容量** | 无限 | PB级 | 64TB/卷 | PB级 |
| **多可用区** | 自动 | 自动 | 需配置 | 自动 |
| **使用场景** | 数据湖、备份、静态网站 | 共享文件、容器存储 | 数据库存储、EC2启动卷 | Windows应用、HPC |

### 1.3 数据库服务对比

| 数据库 | 类型 | 一致性模型 | 适用场景 |
|--------|------|-----------|----------|
| **RDS** | 关系型 | 强一致性 | 传统OLTP、ERP、CRM |
| **Aurora** | 云原生关系型 | 强一致性 | 高吞吐量OLTP、SaaS |
| **DynamoDB** | NoSQL (键值/文档) | 最终一致性/强一致性 | 互联网应用、游戏、IoT |
| **DocumentDB** | 文档型 (MongoDB兼容) | 强一致性 | 内容管理、移动应用 |
| **Keyspaces** | 宽列 (Cassandra兼容) | 最终一致性 | 时序数据、日志、物联网 |
| **Neptune** | 图数据库 | 强一致性 | 推荐引擎、知识图谱、欺诈检测 |
| **QLDB** | 账本数据库 | 不可篡改 | 供应链、金融交易 |
| **Timestream** | 时序数据库 | 强一致性 | 监控、IoT传感器数据 |
| **ElastiCache** | 内存缓存 | 最终一致性 | 会话缓存、实时分析 |

### 1.4 数据存储选型决策框架

```mermaid
flowchart TD
    A[开始选型] --> B{数据结构?}
    
    B -->|非结构化| C{访问频率?}
    B -->|半结构化| D{查询复杂度?}
    B -->|结构化| E{事务要求?}
    
    C -->|低频归档| F[S3 Glacier]
    C -->|通用访问| G[S3 Standard]
    C -->|共享文件| H[EFS/FSx]
    
    D -->|简单键值| I[DynamoDB]
    D -->|文档查询| J[DocumentDB]
    D -->|图查询| K[Neptune]
    D -->|时序查询| L[Timestream]
    
    E -->|强ACID| M{吞吐量?}
    E -->|最终一致| N[DynamoDB]
    
    M -->|超高吞吐| O[Aurora]
    M -->|标准吞吐| P[RDS]
    M -->|分析负载| Q[Redshift]
```

---

## 2. Amazon S3 对象存储

### 2.1 S3 核心概念

```mermaid
flowchart TB
    subgraph S3Architecture["S3 架构"]
        Bucket[Bucket<br/>全局唯一命名空间]
        Object[Object<br/>数据 + 元数据]
        Prefix[Prefix<br/>逻辑文件夹]
    end
    
    subgraph S3Features["核心特性"]
        Versioning[版本控制]
        Lifecycle[生命周期管理]
        Encryption[加密]
        Replication[复制]
        Events[事件通知]
    end
    
    Bucket --> Object
    Object --> Prefix
    Bucket --> S3Features
```

**核心组件**:
- **Bucket**: 全局唯一命名空间，类似顶级文件夹
- **Object**: 数据 + 元数据 + 版本ID，最大 5TB
- **Prefix**: 逻辑路径，用于组织数据

### 2.2 存储类别选择

| 存储类别 | 适用场景 | 最短存储期 | 检索时间 |
|----------|----------|-----------|----------|
| **S3 Standard** | 频繁访问 | 无 | 毫秒级 |
| **S3 IA** | 不频繁访问 | 30天 | 毫秒级 |
| **S3 One Zone-IA** | 可重建数据 | 30天 | 毫秒级 |
| **S3 Glacier** | 长期归档 | 90天 | 分钟级 |
| **S3 Glacier Deep Archive** | 法规归档 | 180天 | 12小时 |
| **S3 Intelligent-Tiering** | 访问模式未知 | 无 | 毫秒级 |

```python
# S3 智能分层配置
import boto3

s3 = boto3.client('s3')

# 创建带 Intelligent-Tiering 的 Bucket
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

### 2.3 S3 安全最佳实践

```yaml
# S3 Bucket 安全策略模板
Resources:
  SecureBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: secure-data-bucket
      
      # 加密配置
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref BucketKey
            BucketKeyEnabled: true
      
      # 公共访问阻止
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # 版本控制
      VersioningConfiguration:
        Status: Enabled
      
      # 日志记录
      LoggingConfiguration:
        DestinationBucketName: !Ref LogBucket
        LogFilePrefix: access-logs/
      
      # 对象锁定 (合规保留)
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
```

### 2.4 S3 访问控制

```python
# Bucket Policy - 限制特定 VPC 访问
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

### 2.5 S3 事件与通知

```python
# 配置 S3 事件通知
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

### 2.6 S3 性能优化

```python
# 多部分上传 - 大文件优化
import boto3
from boto3.s3.transfer import TransferConfig

s3 = boto3.client('s3')

# 配置传输参数
config = TransferConfig(
    multipart_threshold=1024 * 25,  # 25MB
    max_concurrency=10,              # 10 个并发上传
    multipart_chunksize=1024 * 25,  # 25MB 分块
    use_threads=True
)

# 上传大文件
s3.upload_file(
    'large-file.zip',
    'my-bucket',
    'data/large-file.zip',
    Config=config
)

# S3 Select - 查询 CSV/JSON 而不下载完整文件
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

## 3. 文件存储服务

### 3.1 Amazon EFS 托管文件系统

```mermaid
flowchart TB
    subgraph EFS["EFS 架构"]
        subgraph AZ1["可用区 1"]
            M1[挂载目标 1]
        end
        
        subgraph AZ2["可用区 2"]
            M2[挂载目标 2]
        end
        
        subgraph AZ3["可用区 3"]
            M3[挂载目标 3]
        end
        
        FS[EFS 文件系统]
    end
    
    subgraph Clients["客户端"]
        EC2[EC2 实例]
        Lambda[Lambda]
        EKS[EKS 容器]
        OnPrem[本地数据中心]
    end
    
    FS --> M1
    FS --> M2
    FS --> M3
    
    M1 --> EC2
    M2 --> Lambda
    M3 --> EKS
    M1 --> OnPrem
```

**EFS 存储类别**:

| 类别 | 适用场景 | 成本节省 |
|------|----------|----------|
| **Standard** | 频繁访问 | 基准 |
| **IA (Infrequent Access)** | 不频繁访问 | 92% |
| **Archive** | 很少访问 | 97% |
| **One Zone** | 可重建数据 | 47% |

```python
# 创建 EFS 文件系统
import boto3

efs = boto3.client('efs')

# 创建文件系统
response = efs.create_file_system(
    CreationToken='my-efs-token',
    PerformanceMode='generalPurpose',  # 或 'maxIO'
    ThroughputMode='elastic',  # 或 'provisioned' / 'bursting'
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

# 在多个可用区创建挂载目标
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

### 3.2 Amazon FSx 专用文件系统

```mermaid
flowchart LR
    subgraph FSxFamily["FSx 产品家族"]
        Windows[FSx for Windows<br/>SMB / NTFS / AD]
        Lustre[FSx for Lustre<br/>HPC / 机器学习]
        ONTAP[FSx for ONTAP<br/>NFS / SMB / iSCSI]
        OpenZFS[FSx for OpenZFS<br/>NFS / ZFS 特性]
    end
    
    subgraph UseCases["适用场景"]
        AD[Active Directory<br/>文件共享]
        HPC[高性能计算<br/>EDA/仿真]
        Hybrid[混合云<br/>NAS 迁移]
        DevOps[开发运维<br/>CI/CD]
    end
    
    Windows --> AD
    Lustre --> HPC
    ONTAP --> Hybrid
    OpenZFS --> DevOps
```

**FSx for Windows File Server**:

```powershell
# PowerShell: 创建 FSx for Windows 文件系统
$Params = @{
    FileSystemType = 'WINDOWS'
    StorageCapacity = 300  # GB
    SubnetIds = @('subnet-12345678', 'subnet-87654321')
    SecurityGroupIds = @('sg-12345678')
    WindowsConfiguration = @{
        ActiveDirectoryId = 'd-1234567890'
        DeploymentType = 'MULTI_AZ_1'  # 或 SINGLE_AZ_1
        ThroughputCapacity = 32  # MB/s
        WeeklyMaintenanceStartTime = '1:05:00'  # 周日 5:00 AM
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

**FSx for Lustre (HPC 场景)**:

```yaml
# CloudFormation: FSx for Lustre
Resources:
  FSxLustre:
    Type: AWS::FSx::FileSystem
    Properties:
      FileSystemType: LUSTRE
      StorageCapacity: 12000  # GB, 最小 1.2TB
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      SecurityGroupIds:
        - !Ref FSxSecurityGroup
      LustreConfiguration:
        DeploymentType: SCRATCH_2  # 或 PERSISTENT_1
        DataCompressionType: LZ4
        AutoImportPolicy: NEW_CHANGED  # 自动从 S3 导入
        ExportPath: !Sub s3://${DataBucket}/exports
        ImportPath: !Sub s3://${DataBucket}/imports
        WeeklyMaintenanceStartTime: '1:05:00'
```

### 3.3 文件存储选型指南

| 需求 | 推荐服务 | 原因 |
|------|----------|------|
| Linux 容器共享存储 | EFS | NFSv4.1, 自动扩展 |
| Windows 文件共享 | FSx Windows | SMB, AD 集成 |
| HPC / 机器学习 | FSx Lustre | 亚毫秒级延迟, 100+ GB/s |
| NetApp ONTAP 迁移 | FSx ONTAP | 功能兼容, 混合云 |
| ZFS 快照/克隆 | FSx OpenZFS | 原生 ZFS 特性 |
| 简单低成本文件 | EFS One Zone | 成本优化 |

---

## 4. Amazon EBS 块存储

### 4.1 EBS 卷类型对比

| 卷类型 | 使用场景 | 最大 IOPS | 最大吞吐 | 延迟 |
|--------|----------|-----------|----------|------|
| **gp3** | 通用 SSD | 16,000 | 1,000 MB/s | 单数毫秒 |
| **gp2** | 通用 SSD (旧) | 16,000 | 250 MB/s | 单数毫秒 |
| **io2** | 高I/O 关键应用 | 256,000 | 4,000 MB/s | 亚毫秒 |
| **io2 Block Express** | 最高性能 | 256,000 | 4,000 MB/s | 亚毫秒 |
| **st1** | 吞吐优化 HDD | 500 | 500 MB/s | 数毫秒 |
| **sc1** | Cold HDD | 250 | 250 MB/s | 数毫秒 |

```python
# 创建高性能 EBS 卷
import boto3

ec2 = boto3.client('ec2')

# 创建 io2 Block Express 卷
volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=100,  # GB
    VolumeType='io2',
    Iops=50000,
    Throughput=1000,  # MB/s
    Encrypted=True,
    KmsKeyId='alias/aws/ebs',
    MultiAttachEnabled=True,  # 允许多实例挂载
    TagSpecifications=[{
        'ResourceType': 'volume',
        'Tags': [
            {'Key': 'Name', 'Value': 'high-performance-db'},
            {'Key': 'Environment', 'Value': 'production'}
        ]
    }]
)

# 创建 gp3 卷 (成本优化)
gp3_volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=500,
    VolumeType='gp3',
    Iops=8000,       # 可独立配置 IOPS
    Throughput=500,  # 可独立配置吞吐
    Encrypted=True
)
```

### 4.2 EBS 快照与恢复

```python
# 自动化快照管理
import boto3

ec2 = boto3.client('ec2')

def create_lifecycle_snapshots():
    """创建带生命周期管理的快照"""
    
    # 创建快照
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
    
    # 启用快照归档 (节省 75% 成本)
    ec2.modify_snapshot_tier(
        SnapshotId=snapshot['SnapshotId'],
        StorageTier='archive'
    )
    
    return snapshot

def cleanup_old_snapshots():
    """清理过期快照"""
    snapshots = ec2.describe_snapshots(
        OwnerIds=['self'],
        Filters=[
            {'Name': 'tag:AutoDelete', 'Values': ['true']}
        ]
    )['Snapshots']
    
    for snapshot in snapshots:
        # 根据标签判断保留策略
        tags = {tag['Key']: tag['Value'] for tag in snapshot.get('Tags', [])}
        retention_days = int(tags.get('Retention', '7').split('-')[0])
        
        create_time = snapshot['StartTime'].replace(tzinfo=None)
        age_days = (datetime.now() - create_time).days
        
        if age_days > retention_days:
            ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
            print(f"Deleted snapshot: {snapshot['SnapshotId']}")
```

### 4.3 EBS 性能优化

```yaml
# CloudFormation: EBS 优化 EC2 实例
Resources:
  DatabaseServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: r6i.2xlarge
      EbsOptimized: true  # 启用 EBS 优化
      
      BlockDeviceMappings:
        # 根卷
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 100
            VolumeType: gp3
            Iops: 5000
            Encrypted: true
            DeleteOnTermination: true
            
        # 数据卷 - 高 IOPS
        - DeviceName: /dev/xvdb
          Ebs:
            VolumeSize: 500
            VolumeType: io2
            Iops: 32000
            Throughput: 1000
            Encrypted: true
            KmsKeyId: !Ref DatabaseKey
            
        # 日志卷 - 高吞吐
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
          # 配置 RAID 0 提升性能
          mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/xvdb /dev/xvdc
          mkfs.xfs /dev/md0
          mkdir /data
          mount /dev/md0 /data
          
          # 启用 EBS 初始化优化
          echo 0 > /sys/block/xvdb/queue/add_random
          echo 0 > /sys/block/xvdc/queue/add_random
```

---

## 5. 关系型数据库

### 5.1 Amazon RDS 托管数据库

```mermaid
flowchart TB
    subgraph RDS["RDS 架构"]
        subgraph Primary["主实例"]
            PDB[(数据库)]
            PLog[事务日志]
        end
        
        subgraph Standby["备用实例"]
            SDB[(副本)]
            SLog[日志回放]
        end
        
        subgraph Storage["托管存储"]
            EBS1[EBS 卷 1]
            EBS2[EBS 卷 2]
        end
    end
    
    PLog -->|同步复制| SLog
    PDB -->|多可用区| SDB
    PDB --> EBS1
    SDB --> EBS2
```

**支持的引擎**:

| 引擎 | 版本 | 适用场景 |
|------|------|----------|
| **MySQL** | 5.7, 8.0 | Web 应用、CMS |
| **PostgreSQL** | 12-16 | 企业应用、地理数据 |
| **MariaDB** | 10.6+ | MySQL 替代 |
| **Oracle** | 19c, 21c | 企业 ERP |
| **SQL Server** | 2019, 2022 | .NET 应用 |

```python
# 创建高可用 RDS PostgreSQL 实例
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
    
    # 高可用配置
    MultiAZ=True,
    
    # 备份配置
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    PreferredMaintenanceWindow='Mon:04:00-Mon:05:00',
    
    # 加密
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    # 网络
    VPCSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='production-db-subnet-group',
    PubliclyAccessible=False,
    
    # 监控
    EnablePerformanceInsights=True,
    PerformanceInsightsRetentionPeriod=7,
    EnableCloudwatchLogsExports=['postgresql', 'upgrade'],
    MonitoringInterval=60,
    MonitoringRoleArn='arn:aws:iam::123456789:role/rds-monitoring-role',
    
    # 删除保护
    DeletionProtection=True,
    
    Tags=[
        {'Key': 'Name', 'Value': 'Production PostgreSQL'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)
```

### 5.2 Amazon Aurora 云原生数据库

```mermaid
flowchart TB
    subgraph Aurora["Aurora 架构"]
        subgraph StorageLayer["共享存储层 (6副本)"]
            AZ1[(可用区 1)]
            AZ2[(可用区 2)]
            AZ3[(可用区 3)]
        end
        
        subgraph Compute["计算层"]
            Writer[写入器实例]
            Reader1[读取器 1]
            Reader2[读取器 2]
            ReaderN[读取器 N...]
        end
    end
    
    Writer -->|写入| AZ1
    Writer -->|写入| AZ2
    Writer -->|写入| AZ3
    
    Reader1 -->|读取| AZ1
    Reader2 -->|读取| AZ2
    ReaderN -->|读取| AZ3
    
    Writer -.->|复制| Reader1
    Writer -.->|复制| Reader2
    Writer -.->|复制| ReaderN
```

**Aurora 特性**:

| 特性 | Aurora MySQL | Aurora PostgreSQL |
|------|--------------|-------------------|
| **最大容量** | 128 TB | 128 TB |
| **读取副本** | 15 个 | 15 个 |
| **复制延迟** | < 20ms | < 20ms |
| **故障转移** | < 30 秒 | < 30 秒 |
| **性能提升** | 5x MySQL | 3x PostgreSQL |
| **Serverless v2** | ✅ | ✅ |

```python
# 创建 Aurora Serverless v2 集群
import boto3

rds = boto3.client('rds')

# 创建集群
cluster = rds.create_db_cluster(
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    EngineVersion='15.4',
    
    # Serverless v2 配置
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,   # ACU
        'MaxCapacity': 64.0,  # ACU
        'SecondsUntilAutoPause': 300  # 5 分钟空闲后暂停
    },
    
    MasterUsername='dbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # 网络
    VpcSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='aurora-subnet-group',
    
    # 备份
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 加密
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    DeletionProtection=True
)

# 创建写入器实例
writer = rds.create_db_instance(
    DBInstanceIdentifier='aurora-writer-1',
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    DBInstanceClass='db.serverless',
    
    # Serverless v2 需要指定容量范围
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,
        'MaxCapacity': 64.0
    }
)
```

### 5.3 RDS 只读副本与跨区域复制

```yaml
# CloudFormation: 跨区域 Aurora 全局数据库
Resources:
  # 主区域集群
  PrimaryCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: aurora-global-primary
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DatabaseName: myapp
      
  # 启用全局数据库
  GlobalCluster:
    Type: AWS::RDS::GlobalCluster
    Properties:
      GlobalClusterIdentifier: aurora-global-db
      SourceDBClusterIdentifier: !Ref PrimaryCluster
      Engine: aurora-mysql
      
  # 主写入器实例
  PrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBClusterIdentifier: !Ref PrimaryCluster
      DBInstanceIdentifier: primary-writer
      Engine: aurora-mysql
      DBInstanceClass: db.r6g.xlarge
      
  # 辅助区域 (需在其他区域栈中创建)
  # SecondaryCluster:
  #   Type: AWS::RDS::DBCluster
  #   Properties:
  #     DBClusterIdentifier: aurora-secondary
  #     Engine: aurora-mysql
  #     GlobalClusterIdentifier: !Ref GlobalCluster
```

---

## 6. Amazon DynamoDB

### 6.1 DynamoDB 核心概念

```mermaid
flowchart TB
    subgraph DynamoDB["DynamoDB 数据模型"]
        subgraph Table["表 (Table)"]
            PK["主键 (Primary Key)"]
            
            subgraph PKTypes["主键类型"]
                SP["简单主键<br/>Partition Key"]
                CP["复合主键<br/>Partition + Sort Key"]
            end
        end
        
        subgraph Items["项目 (Items)"]
            Item1["PK: user#123<br/>SK: profile<br/>属性: {...}"]
            Item2["PK: user#123<br/>SK: orders#2024<br/>属性: {...}"]
            Item3["PK: product#456<br/>SK: metadata<br/>属性: {...}"]
        end
        
        subgraph Indexes["索引"]
            GSI["全局二级索引 (GSI)"]
            LSI["本地二级索引 (LSI)"]
        end
    end
    
    PK --> PKTypes
    Table --> Items
    Table --> Indexes
```

**数据建模最佳实践**:

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
# DynamoDB 单表设计示例
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ecommerce-entities')

# 用户实体
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'PROFILE',
    'entity_type': 'user',
    'user_id': '12345',
    'name': 'John Doe',
    'email': 'john@example.com',
    'created_at': '2024-01-15T10:00:00Z'
})

# 订单实体 (同一用户下)
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'ORDER#2024-001',
    'entity_type': 'order',
    'order_id': '2024-001',
    'total': 299.99,
    'status': 'shipped',
    'GSI1PK': 'ORDER',
    'GSI1SK': '2024-01-15T10:30:00Z'  # 按时间排序
})

# 查询用户所有订单
response = table.query(
    KeyConditionExpression=Key('PK').eq('USER#12345') & 
                          Key('SK').begins_with('ORDER#')
)
orders = response['Items']

# 使用 GSI 查询所有订单 (按时间)
response = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('ORDER') & 
                          Key('GSI1SK').between('2024-01-01', '2024-01-31')
)
recent_orders = response['Items']
```

### 6.2 DynamoDB 容量模式

| 模式 | 适用场景 | 特点 |
|------|----------|------|
| **按需 (On-Demand)** | 不可预测流量、新应用 | 按请求付费，自动扩展 |
| **预置 (Provisioned)** | 可预测流量、成本敏感 | 指定 RCU/WCU，可自动扩展 |
| **Reserved Capacity** | 长期稳定负载 | 预付节省费用 |

```python
# 创建自动扩展的预置容量表
import boto3

dynamodb = boto3.client('dynamodb')

# 创建表
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

# 配置自动扩展
application_autoscaling = boto3.client('application-autoscaling')

# 读取容量自动扩展
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

### 6.3 DynamoDB 高级特性

```python
# DAX (DynamoDB Accelerator) - 微秒级延迟
import boto3

dax = boto3.client('dax')

# 创建 DAX 集群
cluster = dax.create_cluster(
    ClusterName='my-dax-cluster',
    NodeType='dax.r5.large',
    ReplicationFactor=3,  # 3 个节点
    IamRoleArn='arn:aws:iam::123456789:role/DAXRole',
    SubnetGroup='dax-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    SSESpecification={
        'Enabled': True
    }
)

# 使用 DAX 客户端
from amazondax import AmazonDaxClient

dax_client = AmazonDaxClient(
    endpoints=['my-dax-cluster.abc123.dax-clusters.us-east-1.amazonaws.com:8111']
)

# 缓存读取 - 微秒级延迟
response = dax_client.get_item(
    TableName='my-table',
    Key={'id': {'S': '12345'}}
)
```

```python
# DynamoDB Streams + Lambda 触发器
import boto3

lambda_client = boto3.client('lambda')

event_source_mapping = lambda_client.create_event_source_mapping(
    EventSourceArn='arn:aws:dynamodb:us-east-1:123456789:table/my-table/stream/2024-01-01T00:00:00.000',
    FunctionName='process-dynamodb-stream',
    StartingPosition='LATEST',
    BatchSize=100,
    MaximumBatchingWindowInSeconds=5,
    ParallelizationFactor=10,  # 并发处理分区
    DestinationConfig={
        'OnFailure': {
            'Destination': 'arn:aws:sns:us-east-1:123456789:stream-failures'
        }
    }
)
```

### 6.4 DynamoDB 全局表

```python
# 创建多区域 DynamoDB 全局表
import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# 在第一个区域创建表
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

# 转换为全局表
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

## 7. 内存数据库与缓存

### 7.1 Amazon ElastiCache

```mermaid
flowchart TB
    subgraph ElastiCache["ElastiCache 架构"]
        subgraph Redis["Redis 模式"]
            ClusterMode["集群模式"]
            Sentinel["哨兵模式"]
            Single["单节点"]
        end
        
        subgraph Memcached["Memcached"]
            MCCluster["多节点集群"]
            MCSingle["单节点"]
        end
    end
    
    subgraph Clients["客户端"]
        App1[Web 应用]
        App2[移动后端]
        Lambda[Lambda 函数]
    end
    
    ClusterMode --> App1
    MCCluster --> App2
    Single --> Lambda
```

**Redis vs Memcached**:

| 特性 | Redis | Memcached |
|------|-------|-----------|
| **数据结构** | 字符串、列表、集合、哈希、位图等 | 仅键值对 |
| **持久化** | RDB、AOF | 无 |
| **复制** | 主从复制 | 无 |
| **集群** | 原生集群模式 | 客户端分片 |
| **事务** | 支持 | 不支持 |
| **发布/订阅** | 支持 | 不支持 |
| **使用场景** | 会话、排行榜、实时分析 | 简单缓存 |

```python
# 创建 ElastiCache Redis 集群模式
import boto3

elasticache = boto3.client('elasticache')

# 创建 Redis 6.x 集群
cluster = elasticache.create_replication_group(
    ReplicationGroupId='production-redis',
    ReplicationGroupDescription='Production Redis Cluster',
    
    # 引擎配置
    Engine='redis',
    EngineVersion='7.0',
    
    # 节点配置
    NodeGroupConfiguration=[
        {
            'NodeGroupId': '0001',
            'Slots': '0-5461',
            'ReplicaCount': 2,  # 每个分片 2 个副本
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
    
    # 实例类型
    CacheNodeType='cache.r6g.xlarge',
    
    # 网络
    CacheSubnetGroupName='redis-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    
    # 加密
    AtRestEncryptionEnabled=True,
    TransitEncryptionEnabled=True,
    
    # 自动故障转移
    AutomaticFailoverEnabled=True,
    MultiAZEnabled=True,
    
    # 快照
    SnapshotRetentionLimit=35,
    SnapshotWindow='05:00-06:00',
    
    # 维护
    PreferredMaintenanceWindow='sun:06:00-sun:07:00'
)
```

### 7.2 缓存策略

```python
# 常用缓存模式实现
import redis
import json
from functools import wraps

class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 3600  # 1小时
    
    def cache_aside(self, key, loader_func, ttl=None):
        """Cache-Aside (Lazy Loading) 模式"""
        # 先尝试从缓存获取
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # 缓存未命中，从数据库加载
        data = loader_func()
        
        # 写入缓存
        self.redis.setex(
            key,
            ttl or self.default_ttl,
            json.dumps(data)
        )
        
        return data
    
    def write_through(self, key, data, db_write_func):
        """Write-Through 模式"""
        # 先写数据库
        result = db_write_func(data)
        
        # 再写缓存
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        return result
    
    def write_behind(self, key, data):
        """Write-Behind (Write-Back) 模式"""
        # 只写缓存
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        # 异步写入数据库 (使用队列)
        self.redis.lpush('write_queue', json.dumps({
            'key': key,
            'data': data
        }))
    
    def invalidate_cache(self, pattern):
        """缓存失效"""
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)

# 使用示例
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

## 8. 专用数据库服务

### 8.1 Amazon DocumentDB (MongoDB 兼容)

```python
# 创建 DocumentDB 集群
import boto3

docdb = boto3.client('docdb')

cluster = docdb.create_db_cluster(
    DBClusterIdentifier='documentdb-production',
    Engine='docdb',
    MasterUsername='docdbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # 实例配置
    DBClusterParameterGroupName='docdb.5.0',
    DBSubnetGroupName='docdb-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # 备份
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 加密
    StorageEncrypted=True,
    KmsKeyId='alias/aws/docdb',
    
    DeletionProtection=True
)

# 添加实例
instance = docdb.create_db_instance(
    DBClusterIdentifier='documentdb-production',
    DBInstanceIdentifier='docdb-instance-1',
    DBInstanceClass='db.r6g.large',
    Engine='docdb'
)
```

### 8.2 Amazon Neptune (图数据库)

```python
# 创建 Neptune 集群
import boto3

neptune = boto3.client('neptune')

cluster = neptune.create_db_cluster(
    DBClusterIdentifier='neptune-production',
    Engine='neptune',
    
    # 实例配置
    DBSubnetGroupName='neptune-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # 备份
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 加密
    StorageEncrypted=True,
    KmsKeyId='alias/aws/neptune',
    
    DeletionProtection=True,
    
    # 启用 IAM 认证
    IAMAuthEnabled=True
)

# Neptune 查询示例 (Gremlin)
"""
# 创建顶点
 g.addV('person').property('id', 'john').property('name', 'John')
 
 # 创建边
 g.V().has('person', 'id', 'john')
   .addE('knows')
   .to(g.V().has('person', 'id', 'jane'))
   .property('since', '2020-01-01')
 
 # 遍历查询
 g.V().has('person', 'id', 'john')
   .out('knows')
   .values('name')
"""
```

### 8.3 Amazon Keyspaces (Cassandra 兼容)

```python
# 使用 Amazon Keyspaces (托管 Cassandra)
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

# 配置
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

# 创建键空间
session.execute("""
    CREATE KEYSPACE IF NOT EXISTS mykeyspace
    WITH REPLICATION = {
        'class': 'SingleRegionStrategy'
    }
""")

# 创建表
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

### 8.4 专用数据库选型指南

| 数据库 | 数据模型 | 查询语言 | 最佳场景 |
|--------|----------|----------|----------|
| **DocumentDB** | 文档 (JSON) | MongoDB API | 内容管理、用户画像 |
| **Neptune** | 图 (属性图/RDF) | Gremlin/SPARQL | 推荐系统、知识图谱、欺诈检测 |
| **Keyspaces** | 宽列 | CQL | 物联网、时序数据、日志 |
| **QLDB** | 不可变账本 | PartiQL | 供应链、金融交易 |
| **Timestream** | 时序 | SQL | 监控指标、IoT 传感器 |

---

## 9. 数据迁移与集成

### 9.1 AWS Database Migration Service (DMS)

```mermaid
flowchart LR
    Source[源数据库<br/>On-Prem/Cloud] --> DMS[AWS DMS]
    DMS --> Target[目标数据库<br/>RDS/DynamoDB/S3]
    
    S3[(S3 数据湖)] -.-> DMS
    DMS -.-> Kinesis[Kinesis 流]
    
    style DMS fill:#ff9900
```

```python
# 创建 DMS 复制任务
import boto3

dms = boto3.client('dms')

# 创建源端点
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

# 创建目标端点 (DynamoDB)
target_endpoint = dms.create_endpoint(
    EndpointIdentifier='target-dynamodb',
    EndpointType='target',
    EngineName='dynamodb',
    ServiceAccessRoleArn='arn:aws:iam::123456789:role/DMS-DynamoDB-Role'
)

# 创建复制实例
replication_instance = dms.create_replication_instance(
    ReplicationInstanceIdentifier='dms-instance-1',
    ReplicationInstanceClass='dms.c5.2xlarge',
    AllocatedStorage=100,
    VpcSecurityGroupIds=['sg-12345678'],
    ReplicationSubnetGroupIdentifier='dms-subnet-group',
    PubliclyAccessible=False,
    MultiAZ=True
)

# 创建复制任务
task = dms.create_replication_task(
    ReplicationTaskIdentifier='postgres-to-dynamodb',
    SourceEndpointArn=source_endpoint['Endpoint']['EndpointArn'],
    TargetEndpointArn=target_endpoint['Endpoint']['EndpointArn'],
    ReplicationInstanceArn=replication_instance['ReplicationInstance']['ReplicationInstanceArn'],
    MigrationType='full-load-and-cdc',  # 全量 + 增量
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

### 9.2 AWS Glue 数据集成

```python
# AWS Glue ETL 作业
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

# 从 S3 读取数据
datasource = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={
        "paths": ["s3://raw-data-bucket/customers/"]
    },
    format="json"
)

# 数据转换
mapped = ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("customer_id", "string", "id", "string"),
        ("full_name", "string", "name", "string"),
        ("email_address", "string", "email", "string"),
        ("signup_date", "string", "created_at", "timestamp")
    ]
)

# 过滤有效记录
filtered = Filter.apply(
    frame=mapped,
    f=lambda x: x["email"] is not None and "@" in x["email"]
)

# 写入 DynamoDB
glueContext.write_dynamic_frame.from_options(
    frame=filtered,
    connection_type="dynamodb",
    connection_options={
        "dynamodb.output.tableName": "CustomerTable",
        "dynamodb.throughput.write.percent": "1.0"
    }
)

# 同时写入 S3 作为数据湖
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

### 9.3 数据管道编排

```yaml
# AWS Step Functions 数据管道
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

## 10. 备份与灾难恢复

### 10.1 备份策略矩阵

| 服务 | 原生备份 | 快照 | 跨区域复制 | RTO | RPO |
|------|----------|------|-----------|-----|-----|
| **S3** | 版本控制 | ✅ | CRR | 分钟级 | 同步 |
| **RDS** | 自动备份 | ✅ | 跨区域快照 | 分钟-小时 | 5分钟-24小时 |
| **Aurora** | 持续备份 | ✅ | 全局数据库 | < 1分钟 | < 5秒 |
| **DynamoDB** | 时间点恢复 | ✅ | 全局表 | 分钟级 | 同步 |
| **EBS** | 快照 | ✅ | 跨区域复制 | 分钟级 | 快照间隔 |
| **EFS** | 备份服务 | ✅ | 跨区域复制 | 分钟级 | 小时级 |

### 10.2 AWS Backup 集中管理

```python
# AWS Backup 配置
import boto3

backup = boto3.client('backup')

# 创建备份计划
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
                    'DeleteAfterDays': 2555  # 7年
                },
                'RecoveryPointTags': {
                    'BackupType': 'Weekly'
                }
            }
        ]
    }
)

# 创建资源分配
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

### 10.3 跨区域灾难恢复

```mermaid
flowchart TB
    subgraph Primary["主区域 (us-east-1)"]
        P_RDS[(RDS Primary)]
        P_DDB[(DynamoDB)]
        P_S3[S3 Bucket]
        
        P_RDS -->|快照复制| S3_Snapshot[(S3 快照存储)]
    end
    
    subgraph DR["灾备区域 (us-west-2)"]
        D_RDS[(RDS Standby)]
        D_DDB[(DynamoDB Global)]
        D_S3[S3 Bucket]
    end
    
    S3_Snapshot -.-> D_RDS
    P_DDB -.->|全局表复制| D_DDB
    P_S3 -.->|CRR| D_S3
    
    Route53[Route 53<br/>故障转移] -->|正常| P_RDS
    Route53 -->|故障| D_RDS
```

```python
# 自动化灾难恢复演练
import boto3

def initiate_dr_failover():
    """启动灾难恢复故障转移"""
    
    rds = boto3.client('rds', region_name='us-west-2')
    route53 = boto3.client('route53')
    
    # 1. 提升只读副本为主实例
    rds.promote_read_replica(
        DBInstanceIdentifier='dr-postgres-replica',
        BackupRetentionPeriod=7
    )
    
    # 2. 更新 Route 53 DNS
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
    
    # 3. 激活 DynamoDB 全局表写入
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

## 11. 性能优化与监控

### 11.1 CloudWatch 监控指标

```python
# 自定义 CloudWatch 仪表板
import boto3

cloudwatch = boto3.client('cloudwatch')

# 创建数据库监控仪表板
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

# 创建告警
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

### 11.2 性能优化检查清单

```markdown
## 数据库性能优化检查清单

### RDS/Aurora
- [ ] 启用 Performance Insights
- [ ] 配置合适的实例类型 (CPU/内存平衡)
- [ ] 使用 Provisioned IOPS (io2) 或 gp3 存储
- [ ] 启用查询缓存 (MySQL) 或共享缓冲区优化 (PostgreSQL)
- [ ] 配置只读副本分担读负载
- [ ] 定期分析慢查询日志
- [ ] 使用连接池 (RDS Proxy)

### DynamoDB
- [ ] 使用复合主键设计避免热分区
- [ ] 合理设计 GSI 支持查询模式
- [ ] 启用 DAX 缓存高频查询
- [ ] 使用批量操作 (BatchGetItem/BatchWriteItem)
- [ ] 按需模式 vs 预置容量评估
- [ ] 监控 ThrottledRequests 指标
- [ ] 使用并行扫描处理大数据集

### ElastiCache
- [ ] 选择合适的缓存策略 (Cache-Aside/Write-Through)
- [ ] 设置合理的 TTL
- [ ] 启用集群模式支持横向扩展
- [ ] 监控缓存命中率
- [ ] 配置内存淘汰策略
- [ ] 使用管道 (Pipeline) 减少往返延迟

### S3
- [ ] 使用 S3 Transfer Acceleration
- [ ] 多部分上传大文件
- [ ] 启用 S3 Select 减少数据传输
- [ ] 使用 CloudFront 缓存频繁访问对象
- [ ] 配置生命周期策略自动归档
```

---

## 12. 数据库容器化与 Docker

### 12.1 数据库容器化概述

数据库容器化是现代应用架构的重要组成部分，提供一致的开发环境和简化的部署流程。

```mermaid
flowchart TB
    subgraph Traditional["传统部署"]
        DB1[(MySQL)]
        DB2[(PostgreSQL)]
        DB3[(Redis)]
    end
    
    subgraph Containerized["容器化部署"]
        Docker[(Docker)]
        C1[MySQL Container]
        C2[Postgres Container]
        C3[Redis Container]
    end
    
    Traditional -->|迁移| Containerized
```

**容器化数据库的优势**:

| 特性 | 虚拟机 | Docker 容器 |
|------|--------|-------------|
| 启动时间 | 分钟级 | 秒级 |
| 资源占用 | GB 级 | MB 级 |
| 环境一致性 | 差 | 优秀 |
| 版本管理 | 复杂 | 简单 (镜像标签) |
| 开发测试 | 困难 | 极易 |
| 生产部署 | 传统 | 云原生友好 |

### 12.2 常用数据库 Docker 镜像

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

### 12.3 生产级数据库容器配置

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

### 12.4 数据库备份与恢复脚本

```bash
#!/bin/bash
# backup.sh - 容器内数据库备份脚本

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
# restore.sh - 数据库恢复脚本

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

### 12.5 AWS 数据库服务与 Docker 集成

**本地开发使用 AWS 数据库服务镜像**:

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

  # AWS RDS 模拟 (使用实际数据库)
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

  # 本地 S3 (MinIO)
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

  # 初始化脚本
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

### 12.6 AWS DMS 与 Docker 数据迁移实战

**使用 Docker 运行 DMS 复制实例本地模拟**:

```yaml
# docker-compose.dms.yml
version: '3.8'

services:
  # 源数据库 (模拟本地 MySQL)
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

  # 目标数据库 (模拟 RDS PostgreSQL)
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

  # DMS 本地测试工具
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

  # AWS CLI 用于触发实际 DMS 任务
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

**DMS 数据验证脚本**:

```bash
#!/bin/bash
# dms-validate.sh - 验证 DMS 迁移结果

SOURCE_HOST=${SOURCE_HOST:-source-mysql}
TARGET_HOST=${TARGET_HOST:-target-postgres}
SOURCE_DB=${SOURCE_DB:-source_db}
TARGET_DB=${TARGET_DB:-target_db}

echo "=== DMS 数据验证 ==="

# 源表记录数
echo "源数据库记录数:"
docker exec source-mysql mysql -u root -prootpass -e "
    SELECT 
        table_name,
        table_rows
    FROM information_schema.tables
    WHERE table_schema = '${SOURCE_DB}'
" 2>/dev/null

# 目标表记录数
echo -e "\n目标数据库记录数:"
docker exec target-postgres psql -U postgres -d ${TARGET_DB} -c "
    SELECT 
        schemaname,
        relname as table_name,
        n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
" 2>/dev/null

# 数据校验和比较
echo -e "\n数据校验:"
docker exec dms-local bash /scripts/compare-data.sh
```

### 12.7 Amazon RDS 与 Docker 开发工作流

**本地开发使用与 RDS 相同版本的 Docker 镜像**:

```yaml
# docker-compose.rds-dev.yml
version: '3.8'

services:
  # 与 RDS MySQL 8.0.33 版本一致的本地开发环境
  mysql-rds:
    image: mysql:8.0.33  # 与 RDS 版本一致
    container_name: mysql-rds-local
    environment:
      MYSQL_ROOT_PASSWORD: ${RDS_MASTER_PASSWORD}
      MYSQL_DATABASE: ${RDS_DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - rds_mysql_data:/var/lib/mysql
      - ./my.cnf:/etc/mysql/my.cnf:ro  # 使用与 RDS 相似的配置
    command: >
      mysqld
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb_buffer_pool_size=256M
      --max_connections=100
      --slow_query_log=1
      --long_query_time=2

  # 数据库迁移工具 (Flyway/Liquibase)
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

  # 数据库管理工具
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

**RDS 参数组模拟配置** (my.cnf):

```ini
[mysqld]
# 与 RDS 默认参数组相似配置
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

### 12.8 Aurora 与 Docker 测试环境

**使用 Docker 模拟 Aurora 读写分离**:

```yaml
# docker-compose.aurora.yml
version: '3.8'

services:
  # Aurora 写入器 (模拟)
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

  # Aurora 读取器 (模拟只读副本)
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
        # 等待写入器启动
        sleep 30 &&
        # 从写入器复制数据
        mysqldump -h aurora-writer -u root -paurora123 --all-databases > /tmp/dump.sql &&
        mysql -u root -paurora123 < /tmp/dump.sql &&
        # 配置只读
        mysql -u root -paurora123 -e 'SET GLOBAL read_only = ON;' &&
        mysqld
      "
    depends_on:
      - aurora-writer

  # 读写分离代理 (ProxySQL)
  proxysql:
    image: proxysql/proxysql:latest
    ports:
      - "6033:6033"   # 应用端口
      - "6032:6032"   # 管理端口
    volumes:
      - ./proxysql.cnf:/etc/proxysql.cnf:ro
    depends_on:
      - aurora-writer
      - aurora-reader

volumes:
  aurora_writer_data:
  aurora_reader_data:
```

**ProxySQL 配置** (proxysql.cnf):

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

### 12.9 Docker 卷性能优化

```yaml
# 高性能数据库卷配置
version: '3.8'

services:
  postgres-perf:
    image: postgres:16-alpine
    volumes:
      # 使用命名卷
      - type: volume
        source: postgres_fast
        target: /var/lib/postgresql/data
        volume:
          nocopy: true
      # 绑定挂载用于备份
      - type: bind
        source: /fast/ssd/backups
        target: /backups
    # 性能调优
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

# 使用本地驱动器获得最佳性能
volumes:
  postgres_fast:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /fast/ssd/postgres
```

### 12.7 数据库容器监控

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

## 13. 安全与合规

### 12.1 数据加密策略

```mermaid
flowchart TB
    subgraph Encryption["加密层次"]
        Transit["传输中加密<br/>TLS 1.3"]
        Rest["静态加密"]
        Client["客户端加密"]
    end
    
    subgraph KMS["KMS 密钥管理"]
        AWSManaged["AWS 托管密钥<br/>(免费)"]
        CustomerManaged["客户托管密钥<br/>(CMK)"]
        CloudHSM["CloudHSM<br/>(专属硬件)"]
    end
    
    subgraph Services["服务集成"]
        S3Enc[S3 SSE-S3/SSE-KMS]
        RDSEnc[RDS 加密]
        DynamoEnc[DynamoDB 加密]
        EBSDec[EBS 加密]
    end
    
    Rest --> KMS
    KMS --> Services
```

```python
# 使用 KMS 客户托管密钥
import boto3

kms = boto3.client('kms')

# 创建 CMK
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

# 创建别名
kms.create_alias(
    AliasName='alias/production-database-key',
    TargetKeyId=key_id
)

# 配置密钥策略
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

### 12.2 合规性配置

```yaml
# 符合 GDPR/PCI DSS 的 S3 配置
Resources:
  CompliantBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: compliant-data-bucket
      
      # 加密
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKey
            BucketKeyEnabled: true
      
      # 对象锁定 - 防删除
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
      
      # 公共访问阻止
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # 版本控制
      VersioningConfiguration:
        Status: Enabled
      
      # 日志记录
      LoggingConfiguration:
        DestinationBucketName: !Ref AuditLogBucket
        LogFilePrefix: s3-access-logs/
      
      # 标记敏感数据
      Tags:
        - Key: Classification
          Value: Confidential
        - Key: DataSubject
          Value: PII
        - Key: RetentionPeriod
          Value: 7Years
```

### 12.3 审计与日志

```python
# 启用 CloudTrail 数据事件记录
import boto3

cloudtrail = boto3.client('cloudtrail')

# 创建跟踪
trail = cloudtrail.create_trail(
    Name='data-access-trail',
    S3BucketName='cloudtrail-logs-bucket',
    IsMultiRegionTrail=True,
    EnableLogFileValidation=True,
    KMSKeyId='alias/cloudtrail-encryption'
)

# 配置事件选择器记录数据事件
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

# 启用日志记录
cloudtrail.start_logging(Name='data-access-trail')
```

### 12.4 数据脱敏与令牌化

```python
# 使用 AWS Macie 自动发现敏感数据
import boto3

macie = boto3.client('macie2')

# 启用 Macie
macie.enable_macie(
    status='ENABLED',
    findingPublishingFrequency='FIFTEEN_MINUTES'
)

# 创建敏感数据发现作业
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
    customDataIdentifierIds=[],  # 使用内置标识符
    samplingPercentage=100
)

# 使用 AWS Glue 数据脱敏
"""
# PySpark 脱敏示例
def mask_pii(df):
    from pyspark.sql.functions import regexp_replace, sha2
    
    # 脱敏邮箱
    df = df.withColumn('email', 
        regexp_replace('email', '(?<=.{2}).(?=.*@)', '*'))
    
    # 哈希 SSN
    df = df.withColumn('ssn_hash', 
        sha2('ssn', 256)).drop('ssn')
    
    # 截断信用卡号
    df = df.withColumn('card_last4',
        regexp_replace('credit_card', '.*(\d{4})$', '****$1'))
    
    return df
"""
```

---

## 总结

AWS 提供了完整的数据存储与数据库服务矩阵，满足从简单对象存储到复杂专用数据库的各种需求：

### 存储服务选择速查

| 需求 | 推荐服务 |
|------|----------|
| 数据湖/备份/静态网站 | S3 |
| Linux 共享文件 | EFS |
| Windows 文件共享 | FSx for Windows |
| HPC/机器学习 | FSx for Lustre |
| EC2 启动/数据卷 | EBS |

### 数据库服务选择速查

| 需求 | 推荐服务 |
|------|----------|
| 传统关系型应用 | RDS |
| 高吞吐量云原生 | Aurora |
| 互联网规模 NoSQL | DynamoDB |
| MongoDB 兼容 | DocumentDB |
| 图数据/知识图谱 | Neptune |
| 时序数据 | Timestream |
| 内存缓存 | ElastiCache |
| 不可篡改账本 | QLDB |

### 关键最佳实践

1. **安全优先**: 始终启用加密、最小权限原则、定期审计
2. **备份策略**: 3-2-1 原则 (3 份副本、2 种介质、1 份异地)
3. **监控告警**: 建立完整的可观测性体系
4. **成本优化**: 使用生命周期管理、选择合适的存储类别
5. **高可用**: 多可用区部署、跨区域复制、自动故障转移

持续优化性能、安全性和成本，构建可靠的数据存储架构。

---

*版本: v1.0*  
*更新日期: 2026-03-02*
