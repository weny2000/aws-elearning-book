# AWS 存储与数据库速查手册

> 快速查阅命令、配置和最佳实践

---

## 📋 目录

- [存储服务速查](#存储服务速查)
- [数据库服务速查](#数据库服务速查)
- [CLI 命令参考](#cli-命令参考)
- [定价参考](#定价参考)
- [限制与配额](#限制与配额)

---

## 存储服务速查

### S3 常用操作

```bash
# 创建 Bucket
aws s3 mb s3://my-unique-bucket-name --region us-east-1

# 上传文件
aws s3 cp file.txt s3://my-bucket/
aws s3 sync ./local-folder s3://my-bucket/remote-folder

# 设置存储类别
aws s3 cp file.txt s3://my-bucket/ --storage-class GLACIER

# 启用版本控制
aws s3api put-bucket-versioning \
    --bucket my-bucket \
    --versioning-configuration Status=Enabled

# 生命周期规则
aws s3api put-bucket-lifecycle-configuration \
    --bucket my-bucket \
    --lifecycle-configuration file://lifecycle.json

# 跨域配置 (CORS)
aws s3api put-bucket-cors \
    --bucket my-bucket \
    --cors-configuration file://cors.json

# 预签名 URL (临时访问)
aws s3 presign s3://my-bucket/private-file.txt --expires-in 3600
```

### EFS 常用操作

```bash
# 创建 EFS 文件系统
aws efs create-file-system \
    --creation-token my-efs \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted

# 创建挂载目标
aws efs create-mount-target \
    --file-system-id fs-12345678 \
    --subnet-id subnet-12345678 \
    --security-groups sg-12345678

# 获取挂载命令
aws efs describe-mount-targets --file-system-id fs-12345678

# 挂载 (Linux)
sudo mount -t nfs4 \
    -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
    fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

### EBS 常用操作

```bash
# 创建卷
aws ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100 \
    --volume-type gp3 \
    --iops 5000 \
    --encrypted

# 附加卷
aws ec2 attach-volume \
    --volume-id vol-12345678 \
    --instance-id i-12345678 \
    --device /dev/xvdb

# 扩展卷 (不停机)
aws ec2 modify-volume \
    --volume-id vol-12345678 \
    --size 200

# 创建快照
aws ec2 create-snapshot \
    --volume-id vol-12345678 \
    --description "Backup before upgrade"

# 从快照恢复
aws ec2 create-volume \
    --snapshot-id snap-12345678 \
    --availability-zone us-east-1a
```

---

## 数据库服务速查

### RDS 常用操作

```bash
# 创建 RDS 实例
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

# 创建只读副本
aws rds create-db-instance-read-replica \
    --db-instance-identifier my-postgres-replica \
    --source-db-instance-identifier my-postgres

# 创建快照
aws rds create-db-snapshot \
    --db-instance-identifier my-postgres \
    --db-snapshot-identifier my-postgres-snapshot-$(date +%Y%m%d)

# 修改实例 (扩展存储)
aws rds modify-db-instance \
    --db-instance-identifier my-postgres \
    --allocated-storage 200 \
    --apply-immediately

# 重启实例
aws rds reboot-db-instance --db-instance-identifier my-postgres

# 删除实例
aws rds delete-db-instance \
    --db-instance-identifier my-postgres \
    --final-db-snapshot-identifier my-postgres-final-snapshot
```

### Aurora 常用操作

```bash
# 创建 Aurora 集群
aws rds create-db-cluster \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --master-username admin \
    --master-user-password SecurePass123!

# 创建写入器实例
aws rds create-db-instance \
    --db-instance-identifier aurora-writer-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# 添加读取器
aws rds create-db-instance \
    --db-instance-identifier aurora-reader-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# 创建全局数据库
aws rds create-global-cluster \
    --global-cluster-identifier my-global-db \
    --source-db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql
```

### DynamoDB 常用操作

```bash
# 创建表
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=UserId,AttributeType=S \
    --key-schema AttributeName=UserId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# 创建 GSI
aws dynamodb update-table \
    --table-name Users \
    --attribute-definitions AttributeName=Email,AttributeType=S \
    --global-secondary-index-updates file://gsi.json

# 写入数据
aws dynamodb put-item \
    --table-name Users \
    --item '{
        "UserId": {"S": "user123"},
        "Name": {"S": "John Doe"},
        "Email": {"S": "john@example.com"}
    }'

# 查询数据
aws dynamodb query \
    --table-name Users \
    --key-condition-expression "UserId = :userId" \
    --expression-attribute-values '{":userId":{"S":"user123"}}'

# 扫描表
aws dynamodb scan --table-name Users --limit 10

# 备份表
aws dynamodb create-backup \
    --table-name Users \
    --backup-name users-backup-$(date +%Y%m%d)

# 删除表
aws dynamodb delete-table --table-name Users

# 导出到 S3
aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:123456789:table/Users \
    --s3-bucket my-backup-bucket \
    --export-format DYNAMODB_JSON
```

### ElastiCache 常用操作

```bash
# 创建 Redis 集群
aws elasticache create-replication-group \
    --replication-group-id my-redis \
    --replication-group-description "Production Redis" \
    --engine redis \
    --cache-node-type cache.r6g.large \
    --num-cache-clusters 3 \
    --automatic-failover-enabled \
    --multi-az-enabled

# 创建 Memcached 集群
aws elasticache create-cache-cluster \
    --cache-cluster-id my-memcached \
    --engine memcached \
    --cache-node-type cache.r6g.large \
    --num-cache-nodes 2

# 连接到 Redis
redis-cli -h my-redis.abcxyz.cache.amazonaws.com -p 6379

# 基本命令
SET key value
GET key
EXPIRE key 3600
DEL key
FLUSHALL  # 危险：清空所有数据
```

---

## CLI 命令参考

### AWS CLI 配置

```bash
# 配置凭证
aws configure
aws configure --profile production

# 设置区域
export AWS_DEFAULT_REGION=us-east-1
aws configure set region us-west-2 --profile dev

# 查看当前配置
aws configure list
aws sts get-caller-identity
```

### 常用筛选与格式化

```bash
# JMESPath 查询
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType]'

# 输出格式
aws rds describe-db-instances --output table
aws s3api list-buckets --output json --query 'Buckets[*].Name'

# 分页处理
aws s3api list-objects-v2 --bucket my-bucket --max-items 100
aws s3api list-objects-v2 --bucket my-bucket --starting-token next-token
```

---

## 定价参考

### S3 定价 (us-east-1)

| 存储类别 | 存储费用/GB/月 | 请求费用 | 检索费用 |
|----------|---------------|----------|----------|
| Standard | $0.023 | PUT: $0.005/千 | 免费 |
| Standard-IA | $0.0125 | PUT: $0.01/千 | $0.01/GB |
| One Zone-IA | $0.01 | PUT: $0.01/千 | $0.01/GB |
| Glacier | $0.004 | PUT: $0.03/千 | $0.01/GB |
| Deep Archive | $0.00099 | PUT: $0.03/千 | $0.02/GB |
| Intelligent-Tiering | $0.023 | PUT: $0.005/千 | 免费 |

### RDS 定价 (db.t3.medium)

| 引擎 | 按需/小时 | 预留 1年 | 预留 3年 |
|------|-----------|----------|----------|
| MySQL | $0.068 | $0.043 | $0.028 |
| PostgreSQL | $0.068 | $0.043 | $0.028 |
| MariaDB | $0.068 | $0.043 | $0.028 |
| SQL Server | $0.136 | $0.087 | $0.057 |
| Oracle | $0.170 | $0.108 | $0.071 |

### DynamoDB 定价

| 计费项 | 按需 | 预置 |
|--------|------|------|
| 写入 | $1.25/百万 | $0.00065/WCU/小时 |
| 读取 | $0.25/百万 | $0.00013/RCU/小时 |
| 存储 | $0.25/GB/月 | $0.25/GB/月 |
| DAX | $0.269/节点/小时 | - |
| 全局表写入 | 2x 标准写入 | 2x WCU |

---

## 限制与配额

### S3 限制

| 项目 | 限制 |
|------|------|
| Bucket 数量/账户 | 100 (可提升) |
| 对象大小 | 5 TB |
| 单次上传 | 5 GB (使用分段上传) |
| 分段上传段数 | 10,000 |
| Bucket 名称长度 | 3-63 字符 |
| 每秒 PUT/DELETE | 3,500/前缀 |
| 每秒 GET | 5,500/前缀 |

### RDS 限制

| 项目 | 限制 |
|------|------|
| 实例数量 | 40 (可提升) |
| 最大存储 | 64 TB (MySQL/PostgreSQL) |
| 只读副本 | 15 个跨区域 |
| 备份保留期 | 0-35 天 |
| 单 AZ 故障转移 | < 60 秒 |
| 多 AZ 故障转移 | < 120 秒 |

### DynamoDB 限制

| 项目 | 限制 |
|------|------|
| 表数量/账户 | 2,500 (可提升) |
| 表大小 | 无限制 |
| 项目大小 | 400 KB |
| 分区键长度 | 2,048 字节 |
| 排序键长度 | 1,024 字节 |
| 属性名称长度 | 64 KB |
| 索引/表 | 20 GSI + 5 LSI |
| BatchGetItem | 100 个项目/100 MB |
| BatchWriteItem | 25 个项目/16 MB |

### EBS 限制

| 项目 | 限制 |
|------|------|
| 卷大小 | 64 TB |
| IOPS (io2) | 256,000 |
| 吞吐 (gp3) | 1,000 MB/s |
| 快照/卷 | 无限制 |
| 同时附加 | 16 实例 (io2) |

---

## 故障排除速查

### 连接问题

```bash
# 测试 RDS 连通性
telnet my-db.abcxyz.us-east-1.rds.amazonaws.com 5432
nc -zv my-db.abcxyz.us-east-1.rds.amazonaws.com 5432

# 检查安全组
aws ec2 describe-security-groups --group-ids sg-12345678

# 检查网络 ACL
aws ec2 describe-network-acls --filters Name=vpc-id,Values=vpc-12345678
```

### 性能问题

```bash
# 查看 RDS 慢查询日志
aws rds describe-db-log-files --db-instance-identifier my-postgres
aws rds download-db-log-file-portion \
    --db-instance-identifier my-postgres \
    --log-file-name postgresql/log/slowquery.log

# 查看 DynamoDB 限流
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ThrottledRequests \
    --dimensions Name=TableName,Value=MyTable \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Sum
```

### 存储空间问题

```bash
# 检查 RDS 存储空间
aws rds describe-db-instances \
    --db-instance-identifier my-postgres \
    --query 'DBInstances[0].[AllocatedStorage,MaxAllocatedStorage]'

# 检查 S3 Bucket 大小
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

## 相关链接

- [S3 文档](https://docs.aws.amazon.com/s3/)
- [RDS 文档](https://docs.aws.amazon.com/rds/)
- [DynamoDB 文档](https://docs.aws.amazon.com/dynamodb/)
- [AWS 定价计算器](https://calculator.aws/)
- [AWS 服务配额](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html)
