# AWS Storage and Database Quick Reference

> Quick reference for commands, configurations, and best practices

---

## 📋 Table of Contents

- [Storage Services Quick Reference](#storage-services-quick-reference)
- [Database Services Quick Reference](#database-services-quick-reference)
- [CLI Command Reference](#cli-command-reference)
- [Pricing Reference](#pricing-reference)
- [Limits and Quotas](#limits-and-quotas)

---

## Storage Services Quick Reference

### S3 Common Operations

```bash
# Create Bucket
aws s3 mb s3://my-unique-bucket-name --region us-east-1

# Upload File
aws s3 cp file.txt s3://my-bucket/
aws s3 sync ./local-folder s3://my-bucket/remote-folder

# Set Storage Class
aws s3 cp file.txt s3://my-bucket/ --storage-class GLACIER

# Enable Versioning
aws s3api put-bucket-versioning \
    --bucket my-bucket \
    --versioning-configuration Status=Enabled

# Lifecycle Rules
aws s3api put-bucket-lifecycle-configuration \
    --bucket my-bucket \
    --lifecycle-configuration file://lifecycle.json

# CORS Configuration
aws s3api put-bucket-cors \
    --bucket my-bucket \
    --cors-configuration file://cors.json

# Presigned URL (Temporary Access)
aws s3 presign s3://my-bucket/private-file.txt --expires-in 3600
```

### EFS Common Operations

```bash
# Create EFS File System
aws efs create-file-system \
    --creation-token my-efs \
    --performance-mode generalPurpose \
    --throughput-mode elastic \
    --encrypted

# Create Mount Target
aws efs create-mount-target \
    --file-system-id fs-12345678 \
    --subnet-id subnet-12345678 \
    --security-groups sg-12345678

# Get Mount Command
aws efs describe-mount-targets --file-system-id fs-12345678

# Mount (Linux)
sudo mount -t nfs4 \
    -o nfsvers=4.1,rsize=1048576,wsize=1048576,hard,timeo=600,retrans=2 \
    fs-12345678.efs.us-east-1.amazonaws.com:/ /mnt/efs
```

### EBS Common Operations

```bash
# Create Volume
aws ec2 create-volume \
    --availability-zone us-east-1a \
    --size 100 \
    --volume-type gp3 \
    --iops 5000 \
    --encrypted

# Attach Volume
aws ec2 attach-volume \
    --volume-id vol-12345678 \
    --instance-id i-12345678 \
    --device /dev/xvdb

# Extend Volume (No Downtime)
aws ec2 modify-volume \
    --volume-id vol-12345678 \
    --size 200

# Create Snapshot
aws ec2 create-snapshot \
    --volume-id vol-12345678 \
    --description "Backup before upgrade"

# Restore from Snapshot
aws ec2 create-volume \
    --snapshot-id snap-12345678 \
    --availability-zone us-east-1a
```

---

## Database Services Quick Reference

### RDS Common Operations

```bash
# Create RDS Instance
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

# Create Read Replica
aws rds create-db-instance-read-replica \
    --db-instance-identifier my-postgres-replica \
    --source-db-instance-identifier my-postgres

# Create Snapshot
aws rds create-db-snapshot \
    --db-instance-identifier my-postgres \
    --db-snapshot-identifier my-postgres-snapshot-$(date +%Y%m%d)

# Modify Instance (Scale Storage)
aws rds modify-db-instance \
    --db-instance-identifier my-postgres \
    --allocated-storage 200 \
    --apply-immediately

# Reboot Instance
aws rds reboot-db-instance --db-instance-identifier my-postgres

# Delete Instance
aws rds delete-db-instance \
    --db-instance-identifier my-postgres \
    --final-db-snapshot-identifier my-postgres-final-snapshot
```

### Aurora Common Operations

```bash
# Create Aurora Cluster
aws rds create-db-cluster \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --master-username admin \
    --master-user-password SecurePass123!

# Create Writer Instance
aws rds create-db-instance \
    --db-instance-identifier aurora-writer-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# Add Reader
aws rds create-db-instance \
    --db-instance-identifier aurora-reader-1 \
    --db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql \
    --db-instance-class db.r6g.large

# Create Global Database
aws rds create-global-cluster \
    --global-cluster-identifier my-global-db \
    --source-db-cluster-identifier my-aurora-cluster \
    --engine aurora-mysql
```

### DynamoDB Common Operations

```bash
# Create Table
aws dynamodb create-table \
    --table-name Users \
    --attribute-definitions AttributeName=UserId,AttributeType=S \
    --key-schema AttributeName=UserId,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST

# Create GSI
aws dynamodb update-table \
    --table-name Users \
    --attribute-definitions AttributeName=Email,AttributeType=S \
    --global-secondary-index-updates file://gsi.json

# Write Data
aws dynamodb put-item \
    --table-name Users \
    --item '{
        "UserId": {"S": "user123"},
        "Name": {"S": "John Doe"},
        "Email": {"S": "john@example.com"}
    }'

# Query Data
aws dynamodb query \
    --table-name Users \
    --key-condition-expression "UserId = :userId" \
    --expression-attribute-values '{":userId":{"S":"user123"}}'

# Scan Table
aws dynamodb scan --table-name Users --limit 10

# Backup Table
aws dynamodb create-backup \
    --table-name Users \
    --backup-name users-backup-$(date +%Y%m%d)

# Delete Table
aws dynamodb delete-table --table-name Users

# Export to S3
aws dynamodb export-table-to-point-in-time \
    --table-arn arn:aws:dynamodb:us-east-1:123456789:table/Users \
    --s3-bucket my-backup-bucket \
    --export-format DYNAMODB_JSON
```

### ElastiCache Common Operations

```bash
# Create Redis Cluster
aws elasticache create-replication-group \
    --replication-group-id my-redis \
    --replication-group-description "Production Redis" \
    --engine redis \
    --cache-node-type cache.r6g.large \
    --num-cache-clusters 3 \
    --automatic-failover-enabled \
    --multi-az-enabled

# Create Memcached Cluster
aws elasticache create-cache-cluster \
    --cache-cluster-id my-memcached \
    --engine memcached \
    --cache-node-type cache.r6g.large \
    --num-cache-nodes 2

# Connect to Redis
redis-cli -h my-redis.abcxyz.cache.amazonaws.com -p 6379

# Basic Commands
SET key value
GET key
EXPIRE key 3600
DEL key
FLUSHALL  # Danger: Clear all data
```

---

## CLI Command Reference

### AWS CLI Configuration

```bash
# Configure Credentials
aws configure
aws configure --profile production

# Set Region
export AWS_DEFAULT_REGION=us-east-1
aws configure set region us-west-2 --profile dev

# View Current Configuration
aws configure list
aws sts get-caller-identity
```

### Common Filtering and Formatting

```bash
# JMESPath Query
aws ec2 describe-instances --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType]'

# Output Format
aws rds describe-db-instances --output table
aws s3api list-buckets --output json --query 'Buckets[*].Name'

# Pagination
aws s3api list-objects-v2 --bucket my-bucket --max-items 100
aws s3api list-objects-v2 --bucket my-bucket --starting-token next-token
```

---

## Pricing Reference

### S3 Pricing (us-east-1)

| Storage Class | Storage Cost/GB/Month | Request Cost | Retrieval Cost |
|---------------|----------------------|--------------|----------------|
| Standard | $0.023 | PUT: $0.005/1,000 | Free |
| Standard-IA | $0.0125 | PUT: $0.01/1,000 | $0.01/GB |
| One Zone-IA | $0.01 | PUT: $0.01/1,000 | $0.01/GB |
| Glacier | $0.004 | PUT: $0.03/1,000 | $0.01/GB |
| Deep Archive | $0.00099 | PUT: $0.03/1,000 | $0.02/GB |
| Intelligent-Tiering | $0.023 | PUT: $0.005/1,000 | Free |

### RDS Pricing (db.t3.medium)

| Engine | On-Demand/Hour | Reserved 1-Year | Reserved 3-Year |
|--------|----------------|-----------------|-----------------|
| MySQL | $0.068 | $0.043 | $0.028 |
| PostgreSQL | $0.068 | $0.043 | $0.028 |
| MariaDB | $0.068 | $0.043 | $0.028 |
| SQL Server | $0.136 | $0.087 | $0.057 |
| Oracle | $0.170 | $0.108 | $0.071 |

### DynamoDB Pricing

| Billing Item | On-Demand | Provisioned |
|--------------|-----------|-------------|
| Write | $1.25/million | $0.00065/WCU/hour |
| Read | $0.25/million | $0.00013/RCU/hour |
| Storage | $0.25/GB/month | $0.25/GB/month |
| DAX | $0.269/node/hour | - |
| Global Table Write | 2x Standard Write | 2x WCU |

---

## Limits and Quotas

### S3 Limits

| Item | Limit |
|------|-------|
| Buckets per Account | 100 (Can be increased) |
| Object Size | 5 TB |
| Single Upload | 5 GB (Use multipart upload) |
| Multipart Upload Parts | 10,000 |
| Bucket Name Length | 3-63 Characters |
| PUT/DELETE per Second | 3,500/prefix |
| GET per Second | 5,500/prefix |

### RDS Limits

| Item | Limit |
|------|-------|
| Instance Count | 40 (Can be increased) |
| Maximum Storage | 64 TB (MySQL/PostgreSQL) |
| Read Replicas | 15 Cross-Region |
| Backup Retention | 0-35 Days |
| Single-AZ Failover | < 60 seconds |
| Multi-AZ Failover | < 120 seconds |

### DynamoDB Limits

| Item | Limit |
|------|-------|
| Tables per Account | 2,500 (Can be increased) |
| Table Size | Unlimited |
| Item Size | 400 KB |
| Partition Key Length | 2,048 Bytes |
| Sort Key Length | 1,024 Bytes |
| Attribute Name Length | 64 KB |
| Indexes per Table | 20 GSI + 5 LSI |
| BatchGetItem | 100 Items/100 MB |
| BatchWriteItem | 25 Items/16 MB |

### EBS Limits

| Item | Limit |
|------|-------|
| Volume Size | 64 TB |
| IOPS (io2) | 256,000 |
| Throughput (gp3) | 1,000 MB/s |
| Snapshots per Volume | Unlimited |
| Concurrent Attachments | 16 Instances (io2) |

---

## Troubleshooting Quick Reference

### Connection Issues

```bash
# Test RDS Connectivity
telnet my-db.abcxyz.us-east-1.rds.amazonaws.com 5432
nc -zv my-db.abcxyz.us-east-1.rds.amazonaws.com 5432

# Check Security Groups
aws ec2 describe-security-groups --group-ids sg-12345678

# Check Network ACLs
aws ec2 describe-network-acls --filters Name=vpc-id,Values=vpc-12345678
```

### Performance Issues

```bash
# View RDS Slow Query Log
aws rds describe-db-log-files --db-instance-identifier my-postgres
aws rds download-db-log-file-portion \
    --db-instance-identifier my-postgres \
    --log-file-name postgresql/log/slowquery.log

# View DynamoDB Throttling
aws cloudwatch get-metric-statistics \
    --namespace AWS/DynamoDB \
    --metric-name ThrottledRequests \
    --dimensions Name=TableName,Value=MyTable \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-02T00:00:00Z \
    --period 3600 \
    --statistics Sum
```

### Storage Space Issues

```bash
# Check RDS Storage Space
aws rds describe-db-instances \
    --db-instance-identifier my-postgres \
    --query 'DBInstances[0].[AllocatedStorage,MaxAllocatedStorage]'

# Check S3 Bucket Size
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

## Related Links

- [S3 Documentation](https://docs.aws.amazon.com/s3/)
- [RDS Documentation](https://docs.aws.amazon.com/rds/)
- [DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS Pricing Calculator](https://calculator.aws/)
- [AWS Service Quotas](https://docs.aws.amazon.com/general/latest/gr/aws_service_limits.html)
