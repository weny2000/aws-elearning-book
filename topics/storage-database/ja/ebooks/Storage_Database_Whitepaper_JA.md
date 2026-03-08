# AWS ファイルストレージとデータベース技術ホワイトペーパー

> AWS データストレージサービスを包括的に習得：オブジェクトストレージから専用データベースまで

---

## 目次

> **学習ガイド**: 本ホワイトペーパーは「ストレージタイプ→データベースサービス→運用実践」の順に進めます。最初の4章のストレージ基礎を習得してから、データベースの選定と運用を深く学習することを推奨します。

1. **[ストレージとデータベースの概要](#1-ストレージとデータベースの概要)**  
   *グローバルな視点を確立：AWS ストレージサービス分類体系、データアクセスモード、選定意思決定ツリーを理解し、今後の専門学習のためのフレームワークを構築します。*

2. **[Amazon S3 オブジェクトストレージ](#2-amazon-s3-オブジェクトストレージ)**  
   *クラウドストレージの基礎を習得：S3 のコアコンセプト、ストレージクラス、ライフサイクル管理について深く学習します——AWS で最も広く使用されているストレージサービスです。*

3. **[ファイルストレージサービス](#3-ファイルストレージサービス)**  
   *ファイルレベルストレージの拡張：EFS、FSx シリーズサービスを比較し、マネージドファイルシステムをオブジェクトストレージではなく選ぶ場面を理解します。*

4. **[Amazon EBS ブロックストレージ](#4-amazon-ebs-ブロックストレージ)**  
   *EC2 ストレージ基礎：ボリュームタイプの選択、スナップショット戦略、I/O 最適化について学習し、EC2 ワークロードに最適なストレージ構成を設計します。*

5. **[リレーショナルデータベース](#5-リレーショナルデータベース)**  
   *マネージドデータベースサービス：RDS、Aurora アーキテクチャを深く学習し、マルチAZ、リードレプリカ、Performance Insights などのコア機能を習得します。*

6. **[Amazon DynamoDB](#6-amazon-dynamodb)**  
   *NoSQL データモデリング：キーバリュー/ドキュメントデータベース設計、パーティションキー戦略、DAX キャッシュ、グローバルテーブルなどの高度な機能を学習します。*

7. **[インメモリデータベースとキャッシュ](#7-インメモリデータベースとキャッシュ)**  
   *データアクセスの高速化：ElastiCache (Redis/Memcached) と MemoryDB の使用シナリオとパフォーマンスチューニングを習得します。*

8. **[専用データベースサービス](#8-専用データベースサービス)**  
   *特定のシナリオ向けの選択：DocumentDB、Keyspaces、Neptune、Timestream、QLDB などの専用データベースについて理解します。*

9. **[データ移行と統合](#9-データ移行と統合)**  
   *データフロー戦略：DMS、SCT、DataSync、Glue などの移行ツールを学習し、異種データベース間の移行戦略を習得します。*

10. **[バックアップとディザスタリカバリ](#10-バックアップとディザスタリカバリ)**  
    *データ資産の保護：AWS Backup、スナップショット、クロスリージョンレプリケーションなどのバックアップ戦略を比較し、RPO/RTO を満たすビジネス要件を設計します。*

11. **[パフォーマンス最適化とモニタリング](#11-パフォーマンス最適化とモニタリング)**  
    *ストレージ効率の向上：CloudWatch ストレージメトリクス、Performance Insights、DynamoDB キャパシティモードの最適化について学習します。*

12. **[データベースコンテナ化と Docker](#12-データベースコンテナ化と-docker)** 🐳  
    *モダン運用：ローカル Docker データベース開発、RDS プロキシ、ECS/EKS データベースデプロイ、LocalStack ローカルテストについて学習します。*

13. **[セキュリティとコンプライアンス](#13-セキュリティとコンプライアンス)**  
    *データセキュリティ体系：前述の知識を統合し、暗号化(KMS)、IAM 認可、VPC 分離、コンプライアンス監査などのフルスタックセキュリティ戦略を学習します。*

---

## 1. ストレージとデータベースの概要

### 1.1 AWS ストレージサービス分類

```mermaid
flowchart TB
    subgraph Object["オブジェクトストレージ"]
        S3[S3 Standard]
        S3IA[S3 Standard-IA]
        S3Glacier[S3 Glacier]
        S3Intelligent[S3 Intelligent-Tiering]
    end
    
    subgraph File["ファイルストレージ"]
        EFS[EFS Standard]
        EFSIA[EFS IA]
        FSxWin[FSx Windows]
        FSxLustre[FSx Lustre]
        FSxONTAP[FSx ONTAP]
        FSxOpenZFS[FSx OpenZFS]
    end
    
    subgraph Block["ブロックストレージ"]
        GP3[gp3 汎用型]
        IO2[io2 プロビジョンド IOPS]
        ST1[st1 スループット最適化]
        SC1[sc1 Cold]
    end
    
    subgraph Database["データベース"]
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

### 1.2 ストレージサービス比較

| 特性 | S3 | EFS | EBS | FSx |
|------|----|-----|-----|-----|
| **ストレージタイプ** | オブジェクト | ファイル (NFS) | ブロック | ファイル (マルチプロトコル) |
| **アクセス方式** | HTTP API | NFSv4 | iSCSI | SMB/NFS/Lustre |
| **可用性** | 99.99% | 99.99% | 99.9% | 99.99% |
| **耐久性** | 99.999999999% | 高 | 99.8-99.9% | 高 |
| **レイテンシー** | ミリ秒級 | ミリ秒級 | マイクロ秒級 | サブミリ秒級 |
| **最大容量** | 無制限 | PB級 | 64TB/ボリューム | PB級 |
| **マルチAZ** | 自動 | 自動 | 要設定 | 自動 |
| **使用シナリオ** | データレイク、バックアップ、静的ウェブサイト | 共有ファイル、コンテナストレージ | データベースストレージ、EC2ブートボリューム | Windowsアプリケーション、HPC |

### 1.3 データベースサービス比較

| データベース | タイプ | 整合性モデル | 適用シナリオ |
|--------|------|-----------|----------|
| **RDS** | リレーショナル | 強い整合性 | 従来のOLTP、ERP、CRM |
| **Aurora** | クラウドネイティブリレーショナル | 強い整合性 | 高スループットOLTP、SaaS |
| **DynamoDB** | NoSQL (キーバリュー/ドキュメント) | 結果整合性/強い整合性 | インターネットアプリケーション、ゲーム、IoT |
| **DocumentDB** | ドキュメント型 (MongoDB互換) | 強い整合性 | コンテンツ管理、モバイルアプリケーション |
| **Keyspaces** | ワイドカラム (Cassandra互換) | 結果整合性 | 時系列データ、ログ、IoT |
| **Neptune** | グラフデータベース | 強い整合性 | 推薦エンジン、ナレッジグラフ、詐欺検出 |
| **QLDB** | 台帳データベース | 改ざん不可 | サプライチェーン、金融取引 |
| **Timestream** | 時系列データベース | 強い整合性 | モニタリング、IoTセンサーデータ |
| **ElastiCache** | インメモリキャッシュ | 結果整合性 | セッションキャッシュ、リアルタイム分析 |

### 1.4 データストレージ選定意思決定フレームワーク

```mermaid
flowchart TD
    A[選定開始] --> B{データ構造?}
    
    B -->|非構造化| C{アクセス頻度?}
    B -->|半構造化| D{クエリ複雑度?}
    B -->|構造化| E{トランザクション要件?}
    
    C -->|低頻度アーカイブ| F[S3 Glacier]
    C -->|汎用アクセス| G[S3 Standard]
    C -->|共有ファイル| H[EFS/FSx]
    
    D -->|シンプルキーバリュー| I[DynamoDB]
    D -->|ドキュメントクエリ| J[DocumentDB]
    D -->|グラフクエリ| K[Neptune]
    D -->|時系列クエリ| L[Timestream]
    
    E -->|強いACID| M{スループット?}
    E -->|結果整合性| N[DynamoDB]
    
    M -->|超高スループット| O[Aurora]
    M -->|標準スループット| P[RDS]
    M -->|分析ワークロード| Q[Redshift]
```

---

## 2. Amazon S3 オブジェクトストレージ

### 2.1 S3 コアコンセプト

```mermaid
flowchart TB
    subgraph S3Architecture["S3 アーキテクチャ"]
        Bucket[Bucket<br/>グローバル一意の名前空間]
        Object[Object<br/>データ + メタデータ]
        Prefix[Prefix<br/>論理フォルダ]
    end
    
    subgraph S3Features["コア機能"]
        Versioning[バージョニング]
        Lifecycle[ライフサイクル管理]
        Encryption[暗号化]
        Replication[レプリケーション]
        Events[イベント通知]
    end
    
    Bucket --> Object
    Object --> Prefix
    Bucket --> S3Features
```

**コアコンポーネント**:
- **Bucket**: グローバル一意の名前空間、トップレベルフォルダに類似
- **Object**: データ + メタデータ + バージョンID、最大 5TB
- **Prefix**: 論理パス、データの整理に使用

### 2.2 ストレージクラス選択

| ストレージクラス | 適用シナリオ | 最短保存期間 | 取得時間 |
|----------|----------|-----------|----------|
| **S3 Standard** | 頻繁なアクセス | なし | ミリ秒級 |
| **S3 IA** | 低頻度アクセス | 30日 | ミリ秒級 |
| **S3 One Zone-IA** | 再構築可能なデータ | 30日 | ミリ秒級 |
| **S3 Glacier** | 長期アーカイブ | 90日 | 分単位 |
| **S3 Glacier Deep Archive** | 規制アーカイブ | 180日 | 12時間 |
| **S3 Intelligent-Tiering** | アクセスパターン不明 | なし | ミリ秒級 |

```python
# S3 インテリジェントティアリング設定
import boto3

s3 = boto3.client('s3')

# Intelligent-Tiering 付き Bucket の作成
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

### 2.3 S3 セキュリティのベストプラクティス

```yaml
# S3 Bucket セキュリティポリシーテンプレート
Resources:
  SecureBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: secure-data-bucket
      
      # 暗号化設定
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref BucketKey
            BucketKeyEnabled: true
      
      # パブリックアクセスブロック
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # バージョニング
      VersioningConfiguration:
        Status: Enabled
      
      # ログ記録
      LoggingConfiguration:
        DestinationBucketName: !Ref LogBucket
        LogFilePrefix: access-logs/
      
      # オブジェクトロック (コンプライアンス保持)
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
```

### 2.4 S3 アクセス制御

```python
# Bucket Policy - 特定 VPC アクセス制限
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

### 2.5 S3 イベントと通知

```python
# S3 イベント通知の設定
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

### 2.6 S3 パフォーマンス最適化

```python
# マルチパートアップロード - 大ファイル最適化
import boto3
from boto3.s3.transfer import TransferConfig

s3 = boto3.client('s3')

# 転送パラメータの設定
config = TransferConfig(
    multipart_threshold=1024 * 25,  # 25MB
    max_concurrency=10,              # 10 並行アップロード
    multipart_chunksize=1024 * 25,  # 25MB チャンク
    use_threads=True
)

# 大ファイルのアップロード
s3.upload_file(
    'large-file.zip',
    'my-bucket',
    'data/large-file.zip',
    Config=config
)

# S3 Select - 完全なファイルをダウンロードせずに CSV/JSON をクエリ
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

## 3. ファイルストレージサービス

### 3.1 Amazon EFS マネージドファイルシステム

```mermaid
flowchart TB
    subgraph EFS["EFS アーキテクチャ"]
        subgraph AZ1["可用ゾーン 1"]
            M1[マウントターゲット 1]
        end
        
        subgraph AZ2["可用ゾーン 2"]
            M2[マウントターゲット 2]
        end
        
        subgraph AZ3["可用ゾーン 3"]
            M3[マウントターゲット 3]
        end
        
        FS[EFS ファイルシステム]
    end
    
    subgraph Clients["クライアント"]
        EC2[EC2 インスタンス]
        Lambda[Lambda]
        EKS[EKS コンテナ]
        OnPrem[オンプレミスデータセンター]
    end
    
    FS --> M1
    FS --> M2
    FS --> M3
    
    M1 --> EC2
    M2 --> Lambda
    M3 --> EKS
    M1 --> OnPrem
```

**EFS ストレージクラス**:

| クラス | 適用シナリオ | コスト削減 |
|------|----------|----------|
| **Standard** | 頻繁なアクセス | ベースライン |
| **IA (Infrequent Access)** | 低頻度アクセス | 92% |
| **Archive** | ほとんどアクセスしない | 97% |
| **One Zone** | 再構築可能なデータ | 47% |

```python
# EFS ファイルシステムの作成
import boto3

efs = boto3.client('efs')

# ファイルシステムの作成
response = efs.create_file_system(
    CreationToken='my-efs-token',
    PerformanceMode='generalPurpose',  # または 'maxIO'
    ThroughputMode='elastic',  # または 'provisioned' / 'bursting'
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

# 複数の可用ゾーンにマウントターゲットを作成
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

### 3.2 Amazon FSx 専用ファイルシステム

```mermaid
flowchart LR
    subgraph FSxFamily["FSx プロダクトファミリー"]
        Windows[FSx for Windows<br/>SMB / NTFS / AD]
        Lustre[FSx for Lustre<br/>HPC / 機械学習]
        ONTAP[FSx for ONTAP<br/>NFS / SMB / iSCSI]
        OpenZFS[FSx for OpenZFS<br/>NFS / ZFS 機能]
    end
    
    subgraph UseCases["適用シナリオ"]
        AD[Active Directory<br/>ファイル共有]
        HPC[高性能コンピューティング<br/>EDA/シミュレーション]
        Hybrid[ハイブリッドクラウド<br/>NAS 移行]
        DevOps[開発運用<br/>CI/CD]
    end
    
    Windows --> AD
    Lustre --> HPC
    ONTAP --> Hybrid
    OpenZFS --> DevOps
```

**FSx for Windows File Server**:

```powershell
# PowerShell: FSx for Windows ファイルシステムの作成
$Params = @{
    FileSystemType = 'WINDOWS'
    StorageCapacity = 300  # GB
    SubnetIds = @('subnet-12345678', 'subnet-87654321')
    SecurityGroupIds = @('sg-12345678')
    WindowsConfiguration = @{
        ActiveDirectoryId = 'd-1234567890'
        DeploymentType = 'MULTI_AZ_1'  # または SINGLE_AZ_1
        ThroughputCapacity = 32  # MB/s
        WeeklyMaintenanceStartTime = '1:05:00'  # 日曜日 5:00 AM
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

**FSx for Lustre (HPC シナリオ)**:

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
        DeploymentType: SCRATCH_2  # または PERSISTENT_1
        DataCompressionType: LZ4
        AutoImportPolicy: NEW_CHANGED  # S3 から自動インポート
        ExportPath: !Sub s3://${DataBucket}/exports
        ImportPath: !Sub s3://${DataBucket}/imports
        WeeklyMaintenanceStartTime: '1:05:00'
```

### 3.3 ファイルストレージ選定ガイド

| 要件 | 推奨サービス | 理由 |
|------|----------|------|
| Linux コンテナ共有ストレージ | EFS | NFSv4.1, 自動拡張 |
| Windows ファイル共有 | FSx Windows | SMB, AD 統合 |
| HPC / 機械学習 | FSx Lustre | サブミリ秒レイテンシー, 100+ GB/s |
| NetApp ONTAP 移行 | FSx ONTAP | 機能互換, ハイブリッドクラウド |
| ZFS スナップショット/クローン | FSx OpenZFS | ネイティブ ZFS 機能 |
| シンプルな低コストファイル | EFS One Zone | コスト最適化 |

---

## 4. Amazon EBS ブロックストレージ

### 4.1 EBS ボリュームタイプ比較

| ボリュームタイプ | 使用シナリオ | 最大 IOPS | 最大スループット | レイテンシー |
|--------|----------|-----------|----------|------|
| **gp3** | 汎用 SSD | 16,000 | 1,000 MB/s | シングルミリ秒 |
| **gp2** | 汎用 SSD (旧) | 16,000 | 250 MB/s | シングルミリ秒 |
| **io2** | 高I/O 重要アプリケーション | 256,000 | 4,000 MB/s | サブミリ秒 |
| **io2 Block Express** | 最高パフォーマンス | 256,000 | 4,000 MB/s | サブミリ秒 |
| **st1** | スループット最適化 HDD | 500 | 500 MB/s | 数ミリ秒 |
| **sc1** | Cold HDD | 250 | 250 MB/s | 数ミリ秒 |

```python
# 高性能 EBS ボリュームの作成
import boto3

ec2 = boto3.client('ec2')

# io2 Block Express ボリュームの作成
volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=100,  # GB
    VolumeType='io2',
    Iops=50000,
    Throughput=1000,  # MB/s
    Encrypted=True,
    KmsKeyId='alias/aws/ebs',
    MultiAttachEnabled=True,  # 複数インスタンスマウントを許可
    TagSpecifications=[{
        'ResourceType': 'volume',
        'Tags': [
            {'Key': 'Name', 'Value': 'high-performance-db'},
            {'Key': 'Environment', 'Value': 'production'}
        ]
    }]
)

# gp3 ボリュームの作成 (コスト最適化)
gp3_volume = ec2.create_volume(
    AvailabilityZone='us-east-1a',
    Size=500,
    VolumeType='gp3',
    Iops=8000,       # IOPS を独立して設定可能
    Throughput=500,  # スループットを独立して設定可能
    Encrypted=True
)
```

### 4.2 EBS スナップショットと復旧

```python
# 自動化されたスナップショット管理
import boto3

ec2 = boto3.client('ec2')

def create_lifecycle_snapshots():
    """ライフサイクル管理付きスナップショットの作成"""
    
    # スナップショットの作成
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
    
    # スナップショットアーカイブを有効化 (75% コスト削減)
    ec2.modify_snapshot_tier(
        SnapshotId=snapshot['SnapshotId'],
        StorageTier='archive'
    )
    
    return snapshot

def cleanup_old_snapshots():
    """期限切れスナップショットのクリーンアップ"""
    snapshots = ec2.describe_snapshots(
        OwnerIds=['self'],
        Filters=[
            {'Name': 'tag:AutoDelete', 'Values': ['true']}
        ]
    )['Snapshots']
    
    for snapshot in snapshots:
        # タグから保持ポリシーを判定
        tags = {tag['Key']: tag['Value'] for tag in snapshot.get('Tags', [])}
        retention_days = int(tags.get('Retention', '7').split('-')[0])
        
        create_time = snapshot['StartTime'].replace(tzinfo=None)
        age_days = (datetime.now() - create_time).days
        
        if age_days > retention_days:
            ec2.delete_snapshot(SnapshotId=snapshot['SnapshotId'])
            print(f"Deleted snapshot: {snapshot['SnapshotId']}")
```

### 4.3 EBS パフォーマンス最適化

```yaml
# CloudFormation: EBS 最適化 EC2 インスタンス
Resources:
  DatabaseServer:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: r6i.2xlarge
      EbsOptimized: true  # EBS 最適化を有効化
      
      BlockDeviceMappings:
        # ルートボリューム
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 100
            VolumeType: gp3
            Iops: 5000
            Encrypted: true
            DeleteOnTermination: true
            
        # データボリューム - 高 IOPS
        - DeviceName: /dev/xvdb
          Ebs:
            VolumeSize: 500
            VolumeType: io2
            Iops: 32000
            Throughput: 1000
            Encrypted: true
            KmsKeyId: !Ref DatabaseKey
            
        # ログボリューム - 高スループット
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
          # RAID 0 設定でパフォーマンス向上
          mdadm --create /dev/md0 --level=0 --raid-devices=2 /dev/xvdb /dev/xvdc
          mkfs.xfs /dev/md0
          mkdir /data
          mount /dev/md0 /data
          
          # EBS 初期化最適化を有効化
          echo 0 > /sys/block/xvdb/queue/add_random
          echo 0 > /sys/block/xvdc/queue/add_random
```

---

## 5. リレーショナルデータベース

### 5.1 Amazon RDS マネージドデータベース

```mermaid
flowchart TB
    subgraph RDS["RDS アーキテクチャ"]
        subgraph Primary["プライマリインスタンス"]
            PDB[(データベース)]
            PLog[トランザクションログ]
        end
        
        subgraph Standby["スタンバイインスタンス"]
            SDB[(レプリカ)]
            SLog[ログ再生]
        end
        
        subgraph Storage["マネージドストレージ"]
            EBS1[EBS ボリューム 1]
            EBS2[EBS ボリューム 2]
        end
    end
    
    PLog -->|同期レプリケーション| SLog
    PDB -->|マルチAZ| SDB
    PDB --> EBS1
    SDB --> EBS2
```

**サポートされるエンジン**:

| エンジン | バージョン | 適用シナリオ |
|------|------|----------|
| **MySQL** | 5.7, 8.0 | Web アプリケーション、CMS |
| **PostgreSQL** | 12-16 | エンタープライズアプリケーション、地理データ |
| **MariaDB** | 10.6+ | MySQL 代替 |
| **Oracle** | 19c, 21c | エンタープライズ ERP |
| **SQL Server** | 2019, 2022 | .NET アプリケーション |

```python
# 高可用性 RDS PostgreSQL インスタンスの作成
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
    
    # 高可用性設定
    MultiAZ=True,
    
    # バックアップ設定
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    PreferredMaintenanceWindow='Mon:04:00-Mon:05:00',
    
    # 暗号化
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    # ネットワーク
    VPCSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='production-db-subnet-group',
    PubliclyAccessible=False,
    
    # モニタリング
    EnablePerformanceInsights=True,
    PerformanceInsightsRetentionPeriod=7,
    EnableCloudwatchLogsExports=['postgresql', 'upgrade'],
    MonitoringInterval=60,
    MonitoringRoleArn='arn:aws:iam::123456789:role/rds-monitoring-role',
    
    # 削除保護
    DeletionProtection=True,
    
    Tags=[
        {'Key': 'Name', 'Value': 'Production PostgreSQL'},
        {'Key': 'Environment', 'Value': 'production'}
    ]
)
```

### 5.2 Amazon Aurora クラウドネイティブデータベース

```mermaid
flowchart TB
    subgraph Aurora["Aurora アーキテクチャ"]
        subgraph StorageLayer["共有ストレージレイヤー (6レプリカ)"]
            AZ1[(可用ゾーン 1)]
            AZ2[(可用ゾーン 2)]
            AZ3[(可用ゾーン 3)]
        end
        
        subgraph Compute["コンピュートレイヤー"]
            Writer[ライターインスタンス]
            Reader1[リーダー 1]
            Reader2[リーダー 2]
            ReaderN[リーダー N...]
        end
    end
    
    Writer -->|書き込み| AZ1
    Writer -->|書き込み| AZ2
    Writer -->|書き込み| AZ3
    
    Reader1 -->|読み取り| AZ1
    Reader2 -->|読み取り| AZ2
    ReaderN -->|読み取り| AZ3
    
    Writer -.->|レプリケーション| Reader1
    Writer -.->|レプリケーション| Reader2
    Writer -.->|レプリケーション| ReaderN
```

**Aurora の特性**:

| 特性 | Aurora MySQL | Aurora PostgreSQL |
|------|--------------|-------------------|
| **最大容量** | 128 TB | 128 TB |
| **リードレプリカ** | 15 個 | 15 個 |
| **レプリケーション遅延** | < 20ms | < 20ms |
| **フェイルオーバー** | < 30 秒 | < 30 秒 |
| **パフォーマンス向上** | 5x MySQL | 3x PostgreSQL |
| **Serverless v2** | ✅ | ✅ |

```python
# Aurora Serverless v2 クラスタの作成
import boto3

rds = boto3.client('rds')

# クラスタの作成
cluster = rds.create_db_cluster(
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    EngineVersion='15.4',
    
    # Serverless v2 設定
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,   # ACU
        'MaxCapacity': 64.0,  # ACU
        'SecondsUntilAutoPause': 300  # 5 分間アイドル後に一時停止
    },
    
    MasterUsername='dbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # ネットワーク
    VpcSecurityGroupIds=['sg-12345678'],
    DBSubnetGroupName='aurora-subnet-group',
    
    # バックアップ
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 暗号化
    StorageEncrypted=True,
    KmsKeyId='alias/aws/rds',
    
    DeletionProtection=True
)

# ライターインスタンスの作成
writer = rds.create_db_instance(
    DBInstanceIdentifier='aurora-writer-1',
    DBClusterIdentifier='aurora-serverless-v2',
    Engine='aurora-postgresql',
    DBInstanceClass='db.serverless',
    
    # Serverless v2 ではキャパシティ範囲を指定する必要があります
    ServerlessV2ScalingConfiguration={
        'MinCapacity': 0.5,
        'MaxCapacity': 64.0
    }
)
```

### 5.3 RDS リードレプリカとクロスリージョンレプリケーション

```yaml
# CloudFormation: クロスリージョン Aurora グローバルデータベース
Resources:
  # プライマリリージョンクラスタ
  PrimaryCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: aurora-global-primary
      Engine: aurora-mysql
      EngineVersion: 8.0.mysql_aurora.3.04.0
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DatabaseName: myapp
      
  # グローバルデータベースを有効化
  GlobalCluster:
    Type: AWS::RDS::GlobalCluster
    Properties:
      GlobalClusterIdentifier: aurora-global-db
      SourceDBClusterIdentifier: !Ref PrimaryCluster
      Engine: aurora-mysql
      
  # プライマリライターインスタンス
  PrimaryInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBClusterIdentifier: !Ref PrimaryCluster
      DBInstanceIdentifier: primary-writer
      Engine: aurora-mysql
      DBInstanceClass: db.r6g.xlarge
      
  # セカンダリリージョン (別のリージョンスタックで作成)
  # SecondaryCluster:
  #   Type: AWS::RDS::DBCluster
  #   Properties:
  #     DBClusterIdentifier: aurora-secondary
  #     Engine: aurora-mysql
  #     GlobalClusterIdentifier: !Ref GlobalCluster
```

---

## 6. Amazon DynamoDB

### 6.1 DynamoDB コアコンセプト

```mermaid
flowchart TB
    subgraph DynamoDB["DynamoDB データモデル"]
        subgraph Table["テーブル (Table)"]
            PK["主キー (Primary Key)"]
            
            subgraph PKTypes["主キータイプ"]
                SP["シンプル主キー<br/>Partition Key"]
                CP["複合主キー<br/>Partition + Sort Key"]
            end
        end
        
        subgraph Items["項目 (Items)"]
            Item1["PK: user#123<br/>SK: profile<br/>属性: {...}"]
            Item2["PK: user#123<br/>SK: orders#2024<br/>属性: {...}"]
            Item3["PK: product#456<br/>SK: metadata<br/>属性: {...}"]
        end
        
        subgraph Indexes["インデックス"]
            GSI["グローバルセカンダリインデックス (GSI)"]
            LSI["ローカルセカンダリインデックス (LSI)"]
        end
    end
    
    PK --> PKTypes
    Table --> Items
    Table --> Indexes
```

**データモデリングのベストプラクティス**:

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
# DynamoDB シングルテーブル設計例
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('ecommerce-entities')

# ユーザーエンティティ
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'PROFILE',
    'entity_type': 'user',
    'user_id': '12345',
    'name': 'John Doe',
    'email': 'john@example.com',
    'created_at': '2024-01-15T10:00:00Z'
})

# 注文エンティティ (同じユーザー下)
table.put_item(Item={
    'PK': 'USER#12345',
    'SK': 'ORDER#2024-001',
    'entity_type': 'order',
    'order_id': '2024-001',
    'total': 299.99,
    'status': 'shipped',
    'GSI1PK': 'ORDER',
    'GSI1SK': '2024-01-15T10:30:00Z'  # 時間順にソート
})

# ユーザーのすべての注文をクエリ
response = table.query(
    KeyConditionExpression=Key('PK').eq('USER#12345') & 
                          Key('SK').begins_with('ORDER#')
)
orders = response['Items']

# GSI を使用してすべての注文をクエリ (時間順)
response = table.query(
    IndexName='GSI1',
    KeyConditionExpression=Key('GSI1PK').eq('ORDER') & 
                          Key('GSI1SK').between('2024-01-01', '2024-01-31')
)
recent_orders = response['Items']
```

### 6.2 DynamoDB キャパシティモード

| モード | 適用シナリオ | 特徴 |
|------|----------|------|
| **オンデマンド (On-Demand)** | 予測不可能なトラフィック、新しいアプリケーション | リクエストごとに課金、自動スケーリング |
| **プロビジョンド (Provisioned)** | 予測可能なトラフィック、コスト重視 | RCU/WCU を指定、自動スケーリング可能 |
| **Reserved Capacity** | 長期間の安定した負荷 | 前払いでコスト削減 |

```python
# 自動スケーリング付きプロビジョンドキャパシティテーブルの作成
import boto3

dynamodb = boto3.client('dynamodb')

# テーブルの作成
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

# 自動スケーリングの設定
application_autoscaling = boto3.client('application-autoscaling')

# 読み取りキャパシティの自動スケーリング
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

### 6.3 DynamoDB 高度な機能

```python
# DAX (DynamoDB Accelerator) - マイクロ秒級レイテンシー
import boto3

dax = boto3.client('dax')

# DAX クラスタの作成
cluster = dax.create_cluster(
    ClusterName='my-dax-cluster',
    NodeType='dax.r5.large',
    ReplicationFactor=3,  # 3 ノード
    IamRoleArn='arn:aws:iam::123456789:role/DAXRole',
    SubnetGroup='dax-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    SSESpecification={
        'Enabled': True
    }
)

# DAX クライアントの使用
from amazondax import AmazonDaxClient

dax_client = AmazonDaxClient(
    endpoints=['my-dax-cluster.abc123.dax-clusters.us-east-1.amazonaws.com:8111']
)

# キャッシュ読み取り - マイクロ秒級レイテンシー
response = dax_client.get_item(
    TableName='my-table',
    Key={'id': {'S': '12345'}}
)
```

```python
# DynamoDB Streams + Lambda トリガー
import boto3

lambda_client = boto3.client('lambda')

event_source_mapping = lambda_client.create_event_source_mapping(
    EventSourceArn='arn:aws:dynamodb:us-east-1:123456789:table/my-table/stream/2024-01-01T00:00:00.000',
    FunctionName='process-dynamodb-stream',
    StartingPosition='LATEST',
    BatchSize=100,
    MaximumBatchingWindowInSeconds=5,
    ParallelizationFactor=10,  # パーティションを並行処理
    DestinationConfig={
        'OnFailure': {
            'Destination': 'arn:aws:sns:us-east-1:123456789:stream-failures'
        }
    }
)
```

### 6.4 DynamoDB グローバルテーブル

```python
# マルチリージョン DynamoDB グローバルテーブルの作成
import boto3

dynamodb = boto3.client('dynamodb', region_name='us-east-1')

# 最初のリージョンでテーブルを作成
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

# グローバルテーブルに変換
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

## 7. インメモリデータベースとキャッシュ

### 7.1 Amazon ElastiCache

```mermaid
flowchart TB
    subgraph ElastiCache["ElastiCache アーキテクチャ"]
        subgraph Redis["Redis モード"]
            ClusterMode["クラスターモード"]
            Sentinel["センチネルモード"]
            Single["シングルノード"]
        end
        
        subgraph Memcached["Memcached"]
            MCCluster["マルチノードクラスター"]
            MCSingle["シングルノード"]
        end
    end
    
    subgraph Clients["クライアント"]
        App1[Web アプリケーション]
        App2[モバイルバックエンド]
        Lambda[Lambda 関数]
    end
    
    ClusterMode --> App1
    MCCluster --> App2
    Single --> Lambda
```

**Redis vs Memcached**:

| 特性 | Redis | Memcached |
|------|-------|-----------|
| **データ構造** | 文字列、リスト、セット、ハッシュ、ビットマップなど | キーバリューのみ |
| **永続化** | RDB、AOF | なし |
| **レプリケーション** | マスタースレーブレプリケーション | なし |
| **クラスター** | ネイティブクラスターモード | クライアントシャーディング |
| **トランザクション** | サポート | サポート外 |
| **パブリッシュ/サブスクライブ** | サポート | サポート外 |
| **使用シナリオ** | セッション、ランキング、リアルタイム分析 | シンプルなキャッシュ |

```python
# ElastiCache Redis クラスターモードの作成
import boto3

elasticache = boto3.client('elasticache')

# Redis 6.x クラスターの作成
cluster = elasticache.create_replication_group(
    ReplicationGroupId='production-redis',
    ReplicationGroupDescription='Production Redis Cluster',
    
    # エンジン設定
    Engine='redis',
    EngineVersion='7.0',
    
    # ノード設定
    NodeGroupConfiguration=[
        {
            'NodeGroupId': '0001',
            'Slots': '0-5461',
            'ReplicaCount': 2,  # シャードあたり 2 レプリカ
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
    
    # インスタンスタイプ
    CacheNodeType='cache.r6g.xlarge',
    
    # ネットワーク
    CacheSubnetGroupName='redis-subnet-group',
    SecurityGroupIds=['sg-12345678'],
    
    # 暗号化
    AtRestEncryptionEnabled=True,
    TransitEncryptionEnabled=True,
    
    # 自動フェイルオーバー
    AutomaticFailoverEnabled=True,
    MultiAZEnabled=True,
    
    # スナップショット
    SnapshotRetentionLimit=35,
    SnapshotWindow='05:00-06:00',
    
    # メンテナンス
    PreferredMaintenanceWindow='sun:06:00-sun:07:00'
)
```

### 7.2 キャッシュ戦略

```python
# よく使用されるキャッシュパターンの実装
import redis
import json
from functools import wraps

class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
        self.default_ttl = 3600  # 1時間
    
    def cache_aside(self, key, loader_func, ttl=None):
        """Cache-Aside (Lazy Loading) パターン"""
        # まずキャッシュから取得を試みる
        cached = self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # キャッシュミス、データベースから読み込み
        data = loader_func()
        
        # キャッシュに書き込み
        self.redis.setex(
            key,
            ttl or self.default_ttl,
            json.dumps(data)
        )
        
        return data
    
    def write_through(self, key, data, db_write_func):
        """Write-Through パターン"""
        # まずデータベースに書き込み
        result = db_write_func(data)
        
        # キャッシュに書き込み
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        return result
    
    def write_behind(self, key, data):
        """Write-Behind (Write-Back) パターン"""
        # キャッシュのみに書き込み
        self.redis.setex(
            key,
            self.default_ttl,
            json.dumps(data)
        )
        
        # 非同期でデータベースに書き込み (キューを使用)
        self.redis.lpush('write_queue', json.dumps({
            'key': key,
            'data': data
        }))
    
    def invalidate_cache(self, pattern):
        """キャッシュの無効化"""
        for key in self.redis.scan_iter(match=pattern):
            self.redis.delete(key)

# 使用例
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

## 8. 専用データベースサービス

### 8.1 Amazon DocumentDB (MongoDB 互換)

```python
# DocumentDB クラスタの作成
import boto3

docdb = boto3.client('docdb')

cluster = docdb.create_db_cluster(
    DBClusterIdentifier='documentdb-production',
    Engine='docdb',
    MasterUsername='docdbadmin',
    MasterUserPassword='SecurePassword123!',
    
    # インスタンス設定
    DBClusterParameterGroupName='docdb.5.0',
    DBSubnetGroupName='docdb-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # バックアップ
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 暗号化
    StorageEncrypted=True,
    KmsKeyId='alias/aws/docdb',
    
    DeletionProtection=True
)

# インスタンスの追加
instance = docdb.create_db_instance(
    DBClusterIdentifier='documentdb-production',
    DBInstanceIdentifier='docdb-instance-1',
    DBInstanceClass='db.r6g.large',
    Engine='docdb'
)
```

### 8.2 Amazon Neptune (グラフデータベース)

```python
# Neptune クラスタの作成
import boto3

neptune = boto3.client('neptune')

cluster = neptune.create_db_cluster(
    DBClusterIdentifier='neptune-production',
    Engine='neptune',
    
    # インスタンス設定
    DBSubnetGroupName='neptune-subnet-group',
    VpcSecurityGroupIds=['sg-12345678'],
    
    # バックアップ
    BackupRetentionPeriod=35,
    PreferredBackupWindow='03:00-04:00',
    
    # 暗号化
    StorageEncrypted=True,
    KmsKeyId='alias/aws/neptune',
    
    DeletionProtection=True,
    
    # IAM 認証を有効化
    IAMAuthEnabled=True
)

# Neptune クエリ例 (Gremlin)
"""
# 頂点の作成
 g.addV('person').property('id', 'john').property('name', 'John')
 
 # エッジの作成
 g.V().has('person', 'id', 'john')
   .addE('knows')
   .to(g.V().has('person', 'id', 'jane'))
   .property('since', '2020-01-01')
 
 # トラバーサルクエリ
 g.V().has('person', 'id', 'john')
   .out('knows')
   .values('name')
"""
```

### 8.3 Amazon Keyspaces (Cassandra 互換)

```python
# Amazon Keyspaces (マネージド Cassandra) の使用
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

# 設定
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

# キースペースの作成
session.execute("""
    CREATE KEYSPACE IF NOT EXISTS mykeyspace
    WITH REPLICATION = {
        'class': 'SingleRegionStrategy'
    }
""")

# テーブルの作成
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

### 8.4 専用データベース選定ガイド

| データベース | データモデル | クエリ言語 | 最適なシナリオ |
|--------|----------|----------|----------|
| **DocumentDB** | ドキュメント (JSON) | MongoDB API | コンテンツ管理、ユーザープロファイル |
| **Neptune** | グラフ (プロパティグラフ/RDF) | Gremlin/SPARQL | 推薦システム、ナレッジグラフ、詐欺検出 |
| **Keyspaces** | ワイドカラム | CQL | IoT、時系列データ、ログ |
| **QLDB** | 不変台帳 | PartiQL | サプライチェーン、金融取引 |
| **Timestream** | 時系列 | SQL | モニタリングメトリクス、IoT センサーデータ |

---

## 9. データ移行と統合

### 9.1 AWS Database Migration Service (DMS)

```mermaid
flowchart LR
    Source[ソースデータベース<br/>オンプレ/クラウド] --> DMS[AWS DMS]
    DMS --> Target[ターゲットデータベース<br/>RDS/DynamoDB/S3]
    
    S3[(S3 データレイク)] -.-> DMS
    DMS -.-> Kinesis[Kinesis ストリーム]
    
    style DMS fill:#ff9900
```

```python
# DMS レプリケーションタスクの作成
import boto3

dms = boto3.client('dms')

# ソースエンドポイントの作成
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

# ターゲットエンドポイントの作成 (DynamoDB)
target_endpoint = dms.create_endpoint(
    EndpointIdentifier='target-dynamodb',
    EndpointType='target',
    EngineName='dynamodb',
    ServiceAccessRoleArn='arn:aws:iam::123456789:role/DMS-DynamoDB-Role'
)

# レプリケーションインスタンスの作成
replication_instance = dms.create_replication_instance(
    ReplicationInstanceIdentifier='dms-instance-1',
    ReplicationInstanceClass='dms.c5.2xlarge',
    AllocatedStorage=100,
    VpcSecurityGroupIds=['sg-12345678'],
    ReplicationSubnetGroupIdentifier='dms-subnet-group',
    PubliclyAccessible=False,
    MultiAZ=True
)

# レプリケーションタスクの作成
task = dms.create_replication_task(
    ReplicationTaskIdentifier='postgres-to-dynamodb',
    SourceEndpointArn=source_endpoint['Endpoint']['EndpointArn'],
    TargetEndpointArn=target_endpoint['Endpoint']['EndpointArn'],
    ReplicationInstanceArn=replication_instance['ReplicationInstance']['ReplicationInstanceArn'],
    MigrationType='full-load-and-cdc',  # フルロード + CDC
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

### 9.2 AWS Glue データ統合

```python
# AWS Glue ETL ジョブ
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

# S3 からデータを読み込み
datasource = glueContext.create_dynamic_frame.from_options(
    connection_type="s3",
    connection_options={
        "paths": ["s3://raw-data-bucket/customers/"]
    },
    format="json"
)

# データ変換
mapped = ApplyMapping.apply(
    frame=datasource,
    mappings=[
        ("customer_id", "string", "id", "string"),
        ("full_name", "string", "name", "string"),
        ("email_address", "string", "email", "string"),
        ("signup_date", "string", "created_at", "timestamp")
    ]
)

# 有効なレコードをフィルタリング
filtered = Filter.apply(
    frame=mapped,
    f=lambda x: x["email"] is not None and "@" in x["email"]
)

# DynamoDB に書き込み
glueContext.write_dynamic_frame.from_options(
    frame=filtered,
    connection_type="dynamodb",
    connection_options={
        "dynamodb.output.tableName": "CustomerTable",
        "dynamodb.throughput.write.percent": "1.0"
    }
)

# データレイクとして S3 にも書き込み
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

### 9.3 データパイプラインオーケストレーション

```yaml
# AWS Step Functions データパイプライン
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

## 10. バックアップとディザスタリカバリ

### 10.1 バックアップ戦略マトリックス

| サービス | ネイティブバックアップ | スナップショット | クロスリージョンレプリケーション | RTO | RPO |
|------|----------|------|-----------|-----|-----|
| **S3** | バージョニング | ✅ | CRR | 分単位 | 同期 |
| **RDS** | 自動バックアップ | ✅ | クロスリージョンスナップショット | 分-時間 | 5分-24時間 |
| **Aurora** | 継続的バックアップ | ✅ | グローバルデータベース | < 1分 | < 5秒 |
| **DynamoDB** | ポイントインタイムリカバリ | ✅ | グローバルテーブル | 分単位 | 同期 |
| **EBS** | スナップショット | ✅ | クロスリージョンレプリケーション | 分単位 | スナップショット間隔 |
| **EFS** | バックアップサービス | ✅ | クロスリージョンレプリケーション | 分単位 | 時間単位 |

### 10.2 AWS Backup 集中管理

```python
# AWS Backup 設定
import boto3

backup = boto3.client('backup')

# バックアッププランの作成
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

# リソース割り当ての作成
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

### 10.3 クロスリージョンディザスタリカバリ

```mermaid
flowchart TB
    subgraph Primary["プライマリリージョン (us-east-1)"]
        P_RDS[(RDS Primary)]
        P_DDB[(DynamoDB)]
        P_S3[S3 Bucket]
        
        P_RDS -->|スナップショットコピー| S3_Snapshot[(S3 スナップショットストレージ)]
    end
    
    subgraph DR["災害復旧リージョン (us-west-2)"]
        D_RDS[(RDS Standby)]
        D_DDB[(DynamoDB Global)]
        D_S3[S3 Bucket]
    end
    
    S3_Snapshot -.-> D_RDS
    P_DDB -.->|グローバルテーブルレプリケーション| D_DDB
    P_S3 -.->|CRR| D_S3
    
    Route53[Route 53<br/>フェイルオーバー] -->|通常時| P_RDS
    Route53 -->|障害時| D_RDS
```

```python
# 自動化されたディザスタリカバリ演習
import boto3

def initiate_dr_failover():
    """ディザスタリカバリフェイルオーバーを開始"""
    
    rds = boto3.client('rds', region_name='us-west-2')
    route53 = boto3.client('route53')
    
    # 1. リードレプリカをプライマリに昇格
    rds.promote_read_replica(
        DBInstanceIdentifier='dr-postgres-replica',
        BackupRetentionPeriod=7
    )
    
    # 2. Route 53 DNS を更新
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
    
    # 3. DynamoDB グローバルテーブルの書き込みを有効化
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

## 11. パフォーマンス最適化とモニタリング

### 11.1 CloudWatch モニタリングメトリクス

```python
# カスタム CloudWatch ダッシュボード
import boto3

cloudwatch = boto3.client('cloudwatch')

# データベースモニタリングダッシュボードの作成
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

# アラームの作成
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

### 11.2 パフォーマンス最適化チェックリスト

```markdown
## データベースパフォーマンス最適化チェックリスト

### RDS/Aurora
- [ ] Performance Insights を有効化
- [ ] 適切なインスタンスタイプを設定 (CPU/メモリバランス)
- [ ] Provisioned IOPS (io2) または gp3 ストレージを使用
- [ ] クエリキャッシュを有効化 (MySQL) または共有バッファを最適化 (PostgreSQL)
- [ ] 読み取り負荷分散のためリードレプリカを設定
- [ ] スロークエリログを定期的に分析
- [ ] 接続プールを使用 (RDS Proxy)

### DynamoDB
- [ ] ホットパーティションを回避する複合主キー設計を使用
- [ ] クエリパターンをサポートする適切な GSI 設計
- [ ] 高頻度クエリのために DAX キャッシュを有効化
- [ ] バッチ操作を使用 (BatchGetItem/BatchWriteItem)
- [ ] オンデマンドモード vs プロビジョンドキャパシティの評価
- [ ] ThrottledRequests メトリクスをモニタリング
- [ ] 大規模データセットには並列スキャンを使用

### ElastiCache
- [ ] 適切なキャッシュ戦略を選択 (Cache-Aside/Write-Through)
- [ ] 適切な TTL を設定
- [ ] 水平スケーリングのためにクラスターモードを有効化
- [ ] キャッシュヒット率をモニタリング
- [ ] メモリ削除ポリシーを設定
- [ ] ラウンドトリップ遅延を減らすためにパイプラインを使用

### S3
- [ ] S3 Transfer Acceleration を使用
- [ ] 大ファイルはマルチパートアップロード
- [ ] データ転送を減らすために S3 Select を有効化
- [ ] 頻繁にアクセスされるオブジェクトには CloudFront キャッシュを使用
- [ ] 自動アーカイブのためにライフサイクルポリシーを設定
```

---

## 12. データベースコンテナ化と Docker

### 12.1 データベースコンテナ化の概要

データベースコンテナ化は、一貫性のある開発環境と簡略化されたデプロイメントプロセスを提供する、モダンなアプリケーションアーキテクチャの重要な構成要素です。

```mermaid
flowchart TB
    subgraph Traditional["従来のデプロイメント"]
        DB1[(MySQL)]
        DB2[(PostgreSQL)]
        DB3[(Redis)]
    end
    
    subgraph Containerized["コンテナ化デプロイメント"]
        Docker[(Docker)]
        C1[MySQL Container]
        C2[Postgres Container]
        C3[Redis Container]
    end
    
    Traditional -->|移行| Containerized
```

**コンテナ化データベースの利点**:

| 特性 | 仮想マシン | Docker コンテナ |
|------|--------|-------------|
| 起動時間 | 分単位 | 秒単位 |
| リソース使用量 | GB 単位 | MB 単位 |
| 環境一貫性 | 低い | 優秀 |
| バージョン管理 | 複雑 | シンプル (イメージタグ) |
| 開発テスト | 困難 | 非常に容易 |
| 本番デプロイメント | 従来型 | クラウドネイティブ対応 |

### 12.2 よく使用されるデータベース Docker イメージ

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

### 12.3 本番環境向けデータベースコンテナ設定

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

### 12.4 データベースバックアップと復旧スクリプト

```bash
#!/bin/bash
# backup.sh - コンテナ内データベースバックアップスクリプト

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
# restore.sh - データベース復旧スクリプト

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

### 12.5 AWS データベースサービスと Docker の統合

**ローカル開発での AWS データベースサービスイメージの使用**:

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

  # AWS RDS シミュレーション (実際のデータベースを使用)
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

  # ローカル S3 (MinIO)
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

  # 初期化スクリプト
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

### 12.6 AWS DMS と Docker データ移行実践

**Docker を使用した DMS レプリケーションインスタンスのローカルシミュレーション**:

```yaml
# docker-compose.dms.yml
version: '3.8'

services:
  # ソースデータベース (ローカル MySQL をシミュレート)
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

  # ターゲットデータベース (RDS PostgreSQL をシミュレート)
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

  # DMS ローカルテストツール
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

  # 実際の DMS タスクをトリガーするための AWS CLI
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

**DMS データ検証スクリプト**:

```bash
#!/bin/bash
# dms-validate.sh - DMS 移行結果の検証

SOURCE_HOST=${SOURCE_HOST:-source-mysql}
TARGET_HOST=${TARGET_HOST:-target-postgres}
SOURCE_DB=${SOURCE_DB:-source_db}
TARGET_DB=${TARGET_DB:-target_db}

echo "=== DMS データ検証 ==="

# ソーステーブルのレコード数
echo "ソースデータベースのレコード数:"
docker exec source-mysql mysql -u root -prootpass -e "
    SELECT 
        table_name,
        table_rows
    FROM information_schema.tables
    WHERE table_schema = '${SOURCE_DB}'
" 2>/dev/null

# ターゲットテーブルのレコード数
echo -e "\nターゲットデータベースのレコード数:"
docker exec target-postgres psql -U postgres -d ${TARGET_DB} -c "
    SELECT 
        schemaname,
        relname as table_name,
        n_live_tup as row_count
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
" 2>/dev/null

# データチェックサムの比較
echo -e "\nデータ検証:"
docker exec dms-local bash /scripts/compare-data.sh
```

### 12.7 Amazon RDS と Docker 開発ワークフロー

**RDS と同じバージョンの Docker イメージを使用したローカル開発**:

```yaml
# docker-compose.rds-dev.yml
version: '3.8'

services:
  # RDS MySQL 8.0.33 バージョンと一致するローカル開発環境
  mysql-rds:
    image: mysql:8.0.33  # RDS バージョンと一致
    container_name: mysql-rds-local
    environment:
      MYSQL_ROOT_PASSWORD: ${RDS_MASTER_PASSWORD}
      MYSQL_DATABASE: ${RDS_DB_NAME}
    ports:
      - "3306:3306"
    volumes:
      - rds_mysql_data:/var/lib/mysql
      - ./my.cnf:/etc/mysql/my.cnf:ro  # RDS に似た設定を使用
    command: >
      mysqld
      --default-authentication-plugin=mysql_native_password
      --character-set-server=utf8mb4
      --collation-server=utf8mb4_unicode_ci
      --innodb_buffer_pool_size=256M
      --max_connections=100
      --slow_query_log=1
      --long_query_time=2

  # データベース移行ツール (Flyway/Liquibase)
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

  # データベース管理ツール
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

**RDS パラメータグループシミュレーション設定** (my.cnf):

```ini
[mysqld]
# RDS デフォルトパラメータグループに似た設定
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

### 12.8 Aurora と Docker テスト環境

**Docker を使用した Aurora 読み書き分離のシミュレーション**:

```yaml
# docker-compose.aurora.yml
version: '3.8'

services:
  # Aurora ライター (シミュレート)
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

  # Aurora リーダー (リードレプリカをシミュレート)
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
        # ライターの起動を待機
        sleep 30 &&
        # ライターからデータをコピー
        mysqldump -h aurora-writer -u root -paurora123 --all-databases > /tmp/dump.sql &&
        mysql -u root -paurora123 < /tmp/dump.sql &&
        # 読み取り専用を設定
        mysql -u root -paurora123 -e 'SET GLOBAL read_only = ON;' &&
        mysqld
      "
    depends_on:
      - aurora-writer

  # 読み書き分離プロキシ (ProxySQL)
  proxysql:
    image: proxysql/proxysql:latest
    ports:
      - "6033:6033"   # アプリケーションポート
      - "6032:6032"   # 管理ポート
    volumes:
      - ./proxysql.cnf:/etc/proxysql.cnf:ro
    depends_on:
      - aurora-writer
      - aurora-reader

volumes:
  aurora_writer_data:
  aurora_reader_data:
```

**ProxySQL 設定** (proxysql.cnf):

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

### 12.9 Docker ボリュームパフォーマンス最適化

```yaml
# 高性能データベースボリューム設定
version: '3.8'

services:
  postgres-perf:
    image: postgres:16-alpine
    volumes:
      # 名前付きボリュームを使用
      - type: volume
        source: postgres_fast
        target: /var/lib/postgresql/data
        volume:
          nocopy: true
      # バックアップ用のバインドマウント
      - type: bind
        source: /fast/ssd/backups
        target: /backups
    # パフォーマンスチューニング
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

# 最適なパフォーマンスのためローカルドライバーを使用
volumes:
  postgres_fast:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /fast/ssd/postgres
```

### 12.7 データベースコンテナモニタリング

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

## 13. セキュリティとコンプライアンス

### 13.1 データ暗号化戦略

```mermaid
flowchart TB
    subgraph Encryption["暗号化レイヤー"]
        Transit["転送中暗号化<br/>TLS 1.3"]
        Rest["保存時暗号化"]
        Client["クライアント暗号化"]
    end
    
    subgraph KMS["KMS キー管理"]
        AWSManaged["AWS マネージドキー<br/>(無料)"]
        CustomerManaged["カスタマーマネージドキー<br/>(CMK)"]
        CloudHSM["CloudHSM<br/>(専用ハードウェア)"]
    end
    
    subgraph Services["サービス統合"]
        S3Enc[S3 SSE-S3/SSE-KMS]
        RDSEnc[RDS 暗号化]
        DynamoEnc[DynamoDB 暗号化]
        EBSDec[EBS 暗号化]
    end
    
    Rest --> KMS
    KMS --> Services
```

```python
# カスタマーマネージドキーを使用した KMS
import boto3

kms = boto3.client('kms')

# CMK の作成
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

# エイリアスの作成
kms.create_alias(
    AliasName='alias/production-database-key',
    TargetKeyId=key_id
)

# キーポリシーの設定
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

### 13.2 コンプライアンス設定

```yaml
# GDPR/PCI DSS 準拠の S3 設定
Resources:
  CompliantBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: compliant-data-bucket
      
      # 暗号化
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref ComplianceKey
            BucketKeyEnabled: true
      
      # オブジェクトロック - 削除防止
      ObjectLockEnabled: true
      ObjectLockConfiguration:
        ObjectLockEnabled: Enabled
        Rule:
          DefaultRetention:
            Mode: COMPLIANCE
            Years: 7
      
      # パブリックアクセスブロック
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      
      # バージョニング
      VersioningConfiguration:
        Status: Enabled
      
      # ログ記録
      LoggingConfiguration:
        DestinationBucketName: !Ref AuditLogBucket
        LogFilePrefix: s3-access-logs/
      
      # 機密データのタグ付け
      Tags:
        - Key: Classification
          Value: Confidential
        - Key: DataSubject
          Value: PII
        - Key: RetentionPeriod
          Value: 7Years
```

### 13.3 監査とログ

```python
# CloudTrail データイベントログ記録を有効化
import boto3

cloudtrail = boto3.client('cloudtrail')

# トレイルの作成
trail = cloudtrail.create_trail(
    Name='data-access-trail',
    S3BucketName='cloudtrail-logs-bucket',
    IsMultiRegionTrail=True,
    EnableLogFileValidation=True,
    KMSKeyId='alias/cloudtrail-encryption'
)

# データイベントを記録するためのイベントセレクター設定
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

# ログ記録を有効化
cloudtrail.start_logging(Name='data-access-trail')
```

### 13.4 データマスキングとトークン化

```python
# AWS Macie を使用した機密データの自動検出
import boto3

macie = boto3.client('macie2')

# Macie の有効化
macie.enable_macie(
    status='ENABLED',
    findingPublishingFrequency='FIFTEEN_MINUTES'
)

# 機密データ検出ジョブの作成
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
    customDataIdentifierIds=[],  # 組み込み識別子を使用
    samplingPercentage=100
)

# AWS Glue データマスキングの使用
"""
# PySpark マスキング例
def mask_pii(df):
    from pyspark.sql.functions import regexp_replace, sha2
    
    # メールアドレスをマスキング
    df = df.withColumn('email', 
        regexp_replace('email', '(?<=.{2}).(?=.*@)', '*'))
    
    # SSN をハッシュ化
    df = df.withColumn('ssn_hash', 
        sha2('ssn', 256)).drop('ssn')
    
    # クレジットカード番号を切り詰め
    df = df.withColumn('card_last4',
        regexp_replace('credit_card', '.*(\d{4})$', '****$1'))
    
    return df
"""
```

---

## まとめ

AWS は、シンプルなオブジェクトストレージから複雑な専用データベースまで、あらゆるニーズに応える完全なデータストレージとデータベースサービスマトリックスを提供しています：

### ストレージサービス選択クイックリファレンス

| 要件 | 推奨サービス |
|------|----------|
| データレイク/バックアップ/静的ウェブサイト | S3 |
| Linux 共有ファイル | EFS |
| Windows ファイル共有 | FSx for Windows |
| HPC/機械学習 | FSx for Lustre |
| EC2 ブート/データボリューム | EBS |

### データベースサービス選択クイックリファレンス

| 要件 | 推奨サービス |
|------|----------|
| 従来のリレーショナルアプリケーション | RDS |
| 高スループットクラウドネイティブ | Aurora |
| インターネット規模の NoSQL | DynamoDB |
| MongoDB 互換 | DocumentDB |
| グラフデータ/ナレッジグラフ | Neptune |
| 時系列データ | Timestream |
| インメモリキャッシュ | ElastiCache |
| 不変台帳 | QLDB |

### 重要なベストプラクティス

1. **セキュリティ優先**: 常に暗号化を有効化、最小権限の原則、定期的な監査
2. **バックアップ戦略**: 3-2-1 原則 (3 つのコピー、2 種類のメディア、1 つは異なる場所)
3. **モニタリングアラート**: 完全なオブザーバビリティ体系を構築
4. **コスト最適化**: ライフサイクル管理を使用、適切なストレージクラスを選択
5. **高可用性**: マルチAZデプロイメント、クロスリージョンレプリケーション、自動フェイルオーバー

パフォーマンス、セキュリティ、コストを継続的に最適化し、信頼性の高いデータストレージアーキテクチャを構築してください。

---

*バージョン: v1.0*  
*更新日: 2026-03-02*
