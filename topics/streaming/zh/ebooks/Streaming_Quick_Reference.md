# 流媒体服务速查手册

> 快速查阅命令、配置和最佳实践

---

## 📋 目录

- [Kinesis 命令](#kinesis-命令)
- [MSK (Kafka) 命令](#msk-kafka-命令)
- [视频服务命令](#视频服务命令)
- [CLI 参考](#cli-参考)
- [定价参考](#定价参考)

---

## Kinesis 命令

### Kinesis Data Streams

```bash
# 创建流
aws kinesis create-stream --stream-name my-stream --shard-count 2

# 列出流
aws kinesis list-streams

# 描述流
aws kinesis describe-stream --stream-name my-stream

# 删除流
aws kinesis delete-stream --stream-name my-stream

# 更新分片数
aws kinesis update-shard-count \
    --stream-name my-stream \
    --target-shard-count 4 \
    --scaling-type UNIFORM_SCALING

# 发送记录
aws kinesis put-record \
    --stream-name my-stream \
    --data $(echo -n '{"key":"value"}' | base64) \
    --partition-key user-123

# 批量发送
aws kinesis put-records \
    --stream-name my-stream \
    --records \
        Data=$(echo -n '{"key":"value1"}' | base64),PartitionKey=key1 \
        Data=$(echo -n '{"key":"value2"}' | base64),PartitionKey=key2

# 获取分片迭代器
aws kinesis get-shard-iterator \
    --stream-name my-stream \
    --shard-id shardId-000000000000 \
    --shard-iterator-type LATEST

# 读取记录
aws kinesis get-records --shard-iterator <iterator-value>

# 监控指标
aws cloudwatch get-metric-statistics \
    --namespace AWS/Kinesis \
    --metric-name IncomingRecords \
    --dimensions Name=StreamName,Value=my-stream \
    --start-time 2024-01-01T00:00:00Z \
    --end-time 2024-01-01T01:00:00Z \
    --period 3600 \
    --statistics Sum
```

### Kinesis Firehose

```bash
# 创建 Firehose 交付流到 S3
aws firehose create-delivery-stream \
    --delivery-stream-name logs-to-s3 \
    --delivery-stream-type DirectPut \
    --extended-s3-destination-configuration \
        RoleARN=arn:aws:iam::123456789:role/firehose-role,\
        BucketARN=arn:aws:s3:::data-lake-bucket,\
        Prefix=logs/,\
        CompressionFormat=GZIP,\
        BufferingHints={SizeInMBs=64,IntervalInSeconds=300}

# 发送记录
aws firehose put-record \
    --delivery-stream-name logs-to-s3 \
    --record Data=$(echo -n '{"log":"message"}' | base64)

# 描述交付流
aws firehose describe-delivery-stream \
    --delivery-stream-name logs-to-s3
```

---

## MSK (Kafka) 命令

```bash
# 创建 MSK 集群
aws kafka create-cluster \
    --cluster-name my-kafka-cluster \
    --kafka-version 3.5.1 \
    --number-of-broker-nodes 3 \
    --broker-node-group-info \
        "ClientSubnets=['subnet-1','subnet-2','subnet-3'],\
         InstanceType=kafka.m5.large,\
         SecurityGroups=['sg-12345678']"

# 列出集群
aws kafka list-clusters

# 获取引导代理
aws kafka get-bootstrap-brokers --cluster-arn <cluster-arn>

# Kafka 命令行工具
# 创建 Topic
kafka-topics.sh --create \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --partitions 3 \
    --replication-factor 2

# 列出 Topics
kafka-topics.sh --list --bootstrap-server $BOOTSTRAP_SERVERS

# 发送消息
kafka-console-producer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders

# 消费消息
kafka-console-consumer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --from-beginning

# 查看消费者组
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --list

# 消费者组详情
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --describe \
    --group my-consumer-group
```

---

## 视频服务命令

### MediaConvert

```bash
# 创建转码作业
aws mediaconvert create-job \
    --role arn:aws:iam::123456789:role/MediaConvertRole \
    --settings file://job-settings.json

# 列出作业
aws mediaconvert list-jobs

# 取消作业
aws mediaconvert cancel-job --id <job-id>
```

### MediaLive

```bash
# 创建频道
aws medialive create-channel \
    --name live-channel \
    --input-attachments '[{"InputId":"input-1"}]' \
    --destinations '[{"Id":"destination-1"}]'

# 启动频道
aws medialive start-channel --channel-id <channel-id>

# 停止频道
aws medialive stop-channel --channel-id <channel-id>

# 删除频道
aws medialive delete-channel --channel-id <channel-id>
```

### IVS (Interactive Video Service)

```bash
# 创建频道
aws ivs create-channel \
    --name my-live-channel \
    --type STANDARD

# 获取流密钥
aws ivs create-stream-key --channel-arn <channel-arn>

# 获取频道信息
aws ivs get-channel --arn <channel-arn>

# 列出频道
aws ivs list-channels

# 删除频道
aws ivs delete-channel --arn <channel-arn>

# 注入 Metadata
aws ivs put-metadata \
    --channel-arn <channel-arn> \
    --metadata '{"type":"quiz","question":"What is AWS?"}'
```

---

## CLI 参考

### 常用 AWS CLI 配置

```bash
# 配置默认区域
export AWS_DEFAULT_REGION=us-east-1

# Kinesis 特定配置
export AWS_KINESIS_ENDPOINT=https://kinesis.us-east-1.amazonaws.com

# 查询流指标
aws cloudwatch get-metric-statistics \
    --namespace AWS/Kinesis \
    --metric-name IncomingBytes \
    --dimensions Name=StreamName,Value=my-stream \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 3600 \
    --statistics Sum

# 获取日志
aws logs filter-log-events \
    --log-group-name /aws/lambda/my-function \
    --start-time $(date -d '1 hour ago' +%s)000
```

---

## 定价参考

### Kinesis Data Streams

| 计费项 | 价格 |
|--------|------|
| 分片小时 | $0.015/分片小时 |
| PUT 负载单元 (25KB) | $0.014/百万记录 |
| 扩展数据检索 | $0.013/GB |
| 长期保留 (默认 24h) | 包含 |
| 额外保留 (最高 365天) | $0.10/GB/月 |

### Kinesis Data Firehose

| 目的地 | 价格 |
|--------|------|
| S3 | $0.029/GB |
| Redshift | $0.029/GB + Redshift 费用 |
| OpenSearch | $0.029/GB + OpenSearch 费用 |
| 数据格式转换 | $0.018/GB |
| 动态分区 | $0.006/GB |

### MSK

| 实例类型 | 价格/小时 |
|----------|-----------|
| kafka.t3.small | $0.072 |
| kafka.m5.large | $0.21 |
| kafka.m5.xlarge | $0.42 |
| kafka.m5.2xlarge | $0.84 |

### IVS

| 计费项 | 价格 |
|--------|------|
| 输入小时 (Basic) | $0.60/小时 |
| 输入小时 (Standard) | $2.00/小时 |
| 输出流量 (前 100TB) | $0.15/GB |
| 存储 | $0.05/GB/月 |

---

## 故障排除

### Kinesis 常见问题

```bash
# 检查分片迭代器是否过期
aws kinesis get-records --shard-iterator <iterator>
# 如果返回 ExpiredIteratorException，需要重新获取

# 检查写入限制
aws cloudwatch get-metric-statistics \
    --metric-name WriteProvisionedThroughputExceeded \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Sum

# 检查消费者延迟
aws cloudwatch get-metric-statistics \
    --metric-name GetRecords.IteratorAgeMilliseconds \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Average
```

---

## Rekognition 视频分析命令

```bash
# 创建人脸集合
aws rekognition create-collection --collection-id my-faces-collection

# 列出人脸集合
aws rekognition list-collections

# 索引人脸
aws rekognition index-faces \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=photo.jpg}' \
    --external-image-id "person-name"

# 搜索人脸
aws rekognition search-faces-by-image \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=query.jpg}' \
    --face-match-threshold 90

# Kinesis Video Streams
# 创建视频流
aws kinesisvideo create-stream \
    --stream-name my-video-stream \
    --data-retention-in-hours 24

# 获取视频流端点
aws kinesisvideo get-data-endpoint \
    --stream-name my-video-stream \
    --api-name PUT_MEDIA

# Rekognition Stream Processor
# 创建流处理器
aws rekognition create-stream-processor \
    --input "KinesisVideoStream={Arn=arn:aws:kinesisvideo:...}" \
    --output "KinesisDataStream={Arn=arn:aws:kinesis:...}" \
    --name my-stream-processor \
    --settings "LabelDetection={MinConfidence=60}" \
    --role-arn arn:aws:iam::123456789:role/RekognitionRole

# 列出流处理器
aws rekognition list-stream-processors

# 启动流处理器
aws rekognition start-stream-processor --name my-stream-processor

# 停止流处理器
aws rekognition stop-stream-processor --name my-stream-processor

# 删除流处理器
aws rekognition delete-stream-processor --name my-stream-processor
```

## 参考链接

- [Kinesis 文档](https://docs.aws.amazon.com/kinesis/)
- [MSK 文档](https://docs.aws.amazon.com/msk/)
- [Elemental 文档](https://docs.aws.amazon.com/elemental/)
- [IVS 文档](https://docs.aws.amazon.com/ivs/)
- [Rekognition 文档](https://docs.aws.amazon.com/rekognition/)
