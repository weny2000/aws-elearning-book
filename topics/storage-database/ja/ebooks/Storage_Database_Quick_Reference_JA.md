# AWS ストレージとデータベースクイックリファレンス

> コマンド、設定、ベストプラクティスのクイック参照

---

## 📋 目次

- [ストレージサービスクイックリファレンス](#ストレージサービスクイックリファレンス)
- [データベースサービスクイックリファレンス](#データベースサービスクイックリファレンス)
- [CLI コマンドリファレンス](#cli-コマンドリファレンス)
- [価格リファレンス](#価格リファレンス)
- [制限とクォータ](#制限とクォータ)

---

## ストレージサービスクイックリファレンス

### S3 よく使用される操作

```bash
# Bucket の作成
aws s3 mb s3://my-unique-bucket-name --region us-east-1

# ファイルのアップロード
aws s3 cp file.txt s3://my-bucket/
aws s3 sync ./local-folder s3://my-bucket/remote-folder

# ストレージクラスの設定
aws s3 cp file.txt s3://my-bucket/ --storage-class GLACIER

# バージョニングの有効化
aws s3api put-bucket-versioning \
    --bucket my-bucket \
    --versioning-configuration Status=Enabled

# ライフサイクルルール
aws s3api put-bucket-lifecycle-configuration \
    --bucket my-bucket \
    --lifecycle-configuration file://lifecycle.json

# クロスオリジン設定 (CORS)
aws s3api put-bucket-cors \
    --bucket my-bucket \
    --cors-configuration file://cors.json

# プリサインURL (一時アクセス)
aws s3 presign s3://my-bucket/private-file.txt --expires-in 3600
```

### EFS よく使用される操作

```bash
# EFS ファイルシステムの作成
aws efs create-file-system \
    --creation-token my-efs \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted

# マウントターゲットの作成
aws efs create-mount-target \
    --file-system-id fs-12345678 \
    --subnet-id subnet-12345678 \
    --security-groups sg-12345678

# マウントコマンドの取得
aws efs describe-mount-targets --file-system-id fs-12345678

# マウント (Linux)
sudo mount -t nfs4 \
    -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
    fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

### EBS よく使用される操作

```bash
# ボリュームの作成
aws ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100 \
    --volume-type gp3 \
    --iops 5000 \
    --encrypted

# ボリュームのアタッチ
aws ec2 attach-volume \
    --volume-id vol-12345678 \
    --instance-id i-12345678 \
    --device /dev/xvdb

# ボリュームの拡張 (ダウンタイムなし)
aws ec2 modify-volume \
    --volume-id vol-12345678 \
    --size 200

# スナップショットの作成
aws ec2 create-snapshot \
    --volume-id vol-12345678 \
    --description "Backup before upgrade"

# スナップショットからの復旧
aws ec2 create-volume \
    --snapshot-id snap-12345678 \
    --availability-zone us-east-1a
```

---

## データベースサービスクイックリファレンス

### RDS よく使用される操作

```bash
# RDS インスタンスの作成
aws rds create-db-instance \
    --db-instance-identifier my-postgres \
    --db-instance-class db.t3.medium \
    --engine postgres \
    --master-username admin \
    --master-user-password SecurePass123! \
    --allocated-storage 100 \
    --storage-type gp3 \
    --multi-az \
    --backup-retention-period 7

# リードレプリカの作成
aws rds create-db-instance-read-replica \
    --db-instance-identifier my-postgres-replica \
    --source-db-instance-identifier my-postgres

# スナップショットの作成
aws rds create-db-snapshot \
    --db-instance-identifier my-postgres \
    --db-snapshot-identifier my-postgres-snapshot-$(date +%Y%m%d)

# インスタンスの変更 (ストレージ拡張)
aws rds modify-db-instance \
    --db-instance-identifier my-postgres \
    --allocated-storage 200 \
    --apply-immediately

# インスタンスの再起動
aws rds reboot-db-instance --db-instance-identifier my-postgres

# インスタンスの削除
aws rds delete-db-instance \
    --db-instance-identifier my-postgres \
    --final-db-snapshot-identifier my-postgres-final-snapshot
```

### Aurora よく使用される操作

```bash
# Aurora クラスタの作成
aws rds create-db-cluster \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --master-username admin \
    --master-user-password SecurePass123!

# ライターインスタンスの作成
aws rds create-db-instance \
    --db-instance-identifier aurora-writer-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# リーダーの追加
aws rds create-db-instance \
    --db-instance-identifier aurora-reader-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# グローバルデータベースの作成
aws rds create-global-cluster \
    --global-cluster-identifier my-global-db \
    --source-db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql
```

### DynamoDB よく使用される操作

```bash
# テーブルの作成
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=UserId,AttributeType=S \
    --key-schema AttributeName=UserId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# GSI の作成
aws dynamodb update-table \
    --table-name Users \
    --attribute-definitions AttributeName=Email,AttributeType=S \
    --global-secondary-index-updates file://gsi.json

# データの書き込み
aws dynamodb put-item \
    --table-name Users \
    --item '{
        "UserId": {"S": "user123"},
        "Name": {"S": "John Doe"},
        "Email": {"S": "john@example.com"}
    }'

# データのクエリ
aws dynamodb query \
    --table-name Users \
    --key-condition-expression "UserId = :userId" \
    --expression-attribute-values '{":userId":{"S":"user123"}}'

# テーブルのスキャン
aws dynamodb scan --table-name Users --limit 10

# テーブルのバックアップ
aws dynamodb create-backup \
    --table-name Users \
    --backup-name users-backup-$(date +%Y%m%d)

# テーブルの削除
aws dynamodb delete-table --table-name Users

# S3 へのエクスポート
aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:123456789:table/Users \
    --s3-bucket my-backup-bucket \
    --export-format DYNAMODB_JSON
```

### ElastiCache よく使用される操作

```bash
# Redis クラスタの作成
aws elasticache create-replication-group \
    --replication-group-id my-redis \
    --replication-group-description "Production Redis" \
    --engine redis \
    --cache-node-type cache.r6g.large \
    --num-cache-clusters 3 \
    --automatic-failover-enabled \
    --multi-az-enabled

# Memcached クラスタの作成
aws elasticache create-cache-cluster \
    --cache-cluster-id my-memcached \
    --engine memcached \
    --cache-node-type cache.r6g.large \
    --num-cache-nodes 2

# Redis への接続
redis-cli -h my-redis.abcxyz.cache.amazonaws.com -p 6379

# 基本的なコマンド
SET key value
GET key
EXPIRE key 3600
DEL key
FLUSHALL  # 注意：すべてのデータを削除
```

---

## CLI コマンドリファレンス

### AWS CLI 設定

```bash
# 認証情報の設定
aws configure
aws configure --profile production

# リージョンの設定
export AWS_DEFAULT_REGION=us-east-1
aws configure set region us-west-2 --profile dev

# 現在の設定の確認
aws configure list
aws sts get-caller-identity
```

### よく使用されるフィルタとフォーマット

```bash
# JMESPath クエリ
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType]'

# 出力フォーマット
aws rds describe-db-instances --output table
aws s3api list-buckets --output json --query 'Buckets[*].Name'

# ページネーション処理
aws s3api list-objects-v2 --bucket my-bucket --max-items 100
aws s3api list-objects-v2 --bucket my-bucket --starting-token next-token
```

---

## 価格リファレンス

### S3 価格 (us-east-1)

| ストレージクラス | ストレージ料金/GB/月 | リクエスト料金 | 取得料金 |
|----------|---------------|----------|----------|
| Standard | $0.023 | PUT: $0.005/千 | 無料 |
| Standard-IA | $0.0125 | PUT: $0.01/千 | $0.01/GB |
| One Zone-IA | $0.01 | PUT: $0.01/千 | $0.01/GB |
| Glacier | $0.004 | PUT: $0.03/千 | $0.01/GB |
| Deep Archive | $0.00099 | PUT: $0.03/千 | $0.02/GB |
| Intelligent-Tiering | $0.023 | PUT: $0.005/千 | 無料 |

### RDS 価格 (db.t3.medium)

| エンジン | オンデマンド/時間 | リザーブド 1年 | リザーブド 3年 |
|------|-----------|----------|----------|
| MySQL | $0.068 | $0.043 | $0.028 |
| PostgreSQL | $0.068 | $0.043 | $0.028 |
| MariaDB | $0.068 | $0.043 | $0.028 |
| SQL Server | $0.136 | $0.087 | $0.057 |
| Oracle | $0.170 | $0.108 | $0.071 |

### DynamoDB 価格

| 課金項目 | オンデマンド | プロビジョンド |
|--------|------|----------|
| 書き込み | $1.25/百万 | $0.00065/WCU/時間 |
| 読み取り | $0.25/百万 | $0.00013/RCU/時間 |
| ストレージ | $0.25/GB/月 | $0.25/GB/月 |
| DAX | $0.269/ノード/時間 | - |
| グローバルテーブル書き込み | 2x 標準書き込み | 2x WCU |

---

## 制限とクォータ

### S3 制限

| 項目 | 制限 |
|------|------|
| アカウントあたりの Bucket 数 | 100 (引き上げ可能) |
| オブジェクトサイズ | 5 TB |
| 単一アップロード | 5 GB (マルチパートアップロードを使用) |
| マルチパートアップロードのパート数 | 10,000 |
| Bucket 名の長さ | 3-63 文字 |
| 秒あたり PUT/DELETE | 3,500/プレフィックス |
| 秒あたり GET | 5,500/プレフィックス |

### RDS 制限

| 項目 | 制限 |
|------|------|
| インスタンス数 | 40 (引き上げ可能) |
| 最大ストレージ | 64 TB (MySQL/PostgreSQL) |
| リードレプリカ | 15 個クロスリージョン |
| バックアップ保持期間 | 0-35 日 |
| 単一AZフェイルオーバー | < 60 秒 |
| マルチAZフェイルオーバー | < 120 秒 |

### DynamoDB 制限

| 項目 | 制限 |
|------|------|
| アカウントあたりのテーブル数 | 2,500 (引き上げ可能) |
| テーブルサイズ | 無制限 |
| 項目サイズ | 400 KB |
| パーティションキーの長さ | 2,048 バイト |
| ソートキーの長さ | 1,024 バイト |
| 属性名の長さ | 64 KB |
| テーブルあたりのインデックス | 20 GSI + 5 LSI |
| BatchGetItem | 100 項目/100 MB |
| BatchWriteItem | 25 項目/16 MB |

### EBS 制限

| 項目 | 制限 |
|------|------|
| ボリュームサイズ | 64 TB |
| IOPS (io2) | 256,000 |
| スループット (gp3) | 1,000 MB/s |
| ボリュームあたりのスナップショット | 無制限 |
| 同時アタッチ | 16 インスタンス (io2) |

---

## トラブルシューティングクイックリファレンス

### 接続問題

```bash
# RDS 接続性のテスト
telnet my-db.abcxyz.us-east-1.rds.amazonaws.com 5432
nc -zv my-db.abcxyz.us-east-1.rds.amazonaws.com 5432

# セキュリティグループの確認
aws ec2 describe-security-groups --group-ids sg-12345678

# ネットワーク ACL の確認
aws ec2 describe-network-acls --filters Name=vpc-id,Values=vpc-12345678
```

### パフォーマンス問題

```bash
# RDS スロークエリログの確認
aws rds describe-db-log-files --db-instance-identifier my-postgres
aws rds download-db-log-file-portion \
    --db-instance-identifier my-postgres \
    --log-file-name postgresql/log/slowquery.log

# DynamoDB スロットリングの確認
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ThrottledRequests \
    --dimensions Name=TableName,Value=MyTable \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Sum
```

### ストレージ容量問題

```bash
# RDS ストレージ容量の確認
aws rds describe-db-instances \
    --db-instance-identifier my-postgres \
    --query 'DBInstances[0].[AllocatedStorage,MaxAllocatedStorage]'

# S3 Bucket サイズの確認
aws cloudwatch get-metric-statistics \
    --namespace AWS/S3 \
    --metric-name BucketSizeBytes \
    --dimensions Name=BucketName,Value=my-bucket Name=StorageType,Value=StandardStorage \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 86400 \
    --statistics Average
```

---

## 関連リンク

- [S3 ドキュメント](https://docs.aws.amazon.com/s3/)
- [RDS ドキュメント](https://docs.aws.amazon.com/rds/)
- [DynamoDB ドキュメント](https://docs.aws.amazon.com/dynamodb/)
- [AWS 価格計算ツール](https://calculator.aws/)
- [AWS サービスクォータ](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html)
