# Streaming Services Quick Reference

> Quick reference for commands, configurations, and best practices

---

## 📋 Table of Contents

- [Kinesis Commands](#kinesis-commands)
- [MSK (Kafka) Commands](#msk-kafka-commands)
- [Video Service Commands](#video-service-commands)
- [CLI Reference](#cli-reference)
- [Pricing Reference](#pricing-reference)

---

## Kinesis Commands

### Kinesis Data Streams

```bash
# Create stream
aws kinesis create-stream --stream-name my-stream --shard-count 2

# List streams
aws kinesis list-streams

# Describe stream
aws kinesis describe-stream --stream-name my-stream

# Delete stream
aws kinesis delete-stream --stream-name my-stream

# Update shard count
aws kinesis update-shard-count \
    --stream-name my-stream \
    --target-shard-count 4 \
    --scaling-type UNIFORM_SCALING

# Send record
aws kinesis put-record \
    --stream-name my-stream \
    --data $(echo -n '{"key":"value"}' | base64) \
    --partition-key user-123

# Batch send
aws kinesis put-records \
    --stream-name my-stream \
    --records \
        Data=$(echo -n '{"key":"value1"}' | base64),PartitionKey=key1 \
        Data=$(echo -n '{"key":"value2"}' | base64),PartitionKey=key2

# Get shard iterator
aws kinesis get-shard-iterator \
    --stream-name my-stream \
    --shard-id shardId-000000000000 \
    --shard-iterator-type LATEST

# Read records
aws kinesis get-records --shard-iterator <iterator-value>

# Monitor metrics
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
# Create Firehose delivery stream to S3
aws firehose create-delivery-stream \
    --delivery-stream-name logs-to-s3 \
    --delivery-stream-type DirectPut \
    --extended-s3-destination-configuration \
        RoleARN=arn:aws:iam::123456789:role/firehose-role,\
        BucketARN=arn:aws:s3:::data-lake-bucket,\
        Prefix=logs/,\
        CompressionFormat=GZIP,\
        BufferingHints={SizeInMBs=64,IntervalInSeconds=300}

# Send record
aws firehose put-record \
    --delivery-stream-name logs-to-s3 \
    --record Data=$(echo -n '{"log":"message"}' | base64)

# Describe delivery stream
aws firehose describe-delivery-stream \
    --delivery-stream-name logs-to-s3
```

---

## MSK (Kafka) Commands

```bash
# Create MSK cluster
aws kafka create-cluster \
    --cluster-name my-kafka-cluster \
    --kafka-version 3.5.1 \
    --number-of-broker-nodes 3 \
    --broker-node-group-info \
        "ClientSubnets=['subnet-1','subnet-2','subnet-3'],\
         InstanceType=kafka.m5.large,\
         SecurityGroups=['sg-12345678']"

# List clusters
aws kafka list-clusters

# Get bootstrap brokers
aws kafka get-bootstrap-brokers --cluster-arn <cluster-arn>

# Kafka command line tools
# Create Topic
kafka-topics.sh --create \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --partitions 3 \
    --replication-factor 2

# List Topics
kafka-topics.sh --list --bootstrap-server $BOOTSTRAP_SERVERS

# Send message
kafka-console-producer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders

# Consume message
kafka-console-consumer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --from-beginning

# View consumer groups
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --list

# Consumer group details
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --describe \
    --group my-consumer-group
```

---

## Video Service Commands

### MediaConvert

```bash
# Create transcoding job
aws mediaconvert create-job \
    --role arn:aws:iam::123456789:role/MediaConvertRole \
    --settings file://job-settings.json

# List jobs
aws mediaconvert list-jobs

# Cancel job
aws mediaconvert cancel-job --id <job-id>
```

### MediaLive

```bash
# Create channel
aws medialive create-channel \
    --name live-channel \
    --input-attachments '[{"InputId":"input-1"}]' \
    --destinations '[{"Id":"destination-1"}]'

# Start channel
aws medialive start-channel --channel-id <channel-id>

# Stop channel
aws medialive stop-channel --channel-id <channel-id>

# Delete channel
aws medialive delete-channel --channel-id <channel-id>
```

### IVS (Interactive Video Service)

```bash
# Create channel
aws ivs create-channel \
    --name my-live-channel \
    --type STANDARD

# Get stream key
aws ivs create-stream-key --channel-arn <channel-arn>

# Get channel info
aws ivs get-channel --arn <channel-arn>

# List channels
aws ivs list-channels

# Delete channel
aws ivs delete-channel --arn <channel-arn>

# Inject Metadata
aws ivs put-metadata \
    --channel-arn <channel-arn> \
    --metadata '{"type":"quiz","question":"What is AWS?"}'
```

---

## CLI Reference

### Common AWS CLI Configuration

```bash
# Configure default region
export AWS_DEFAULT_REGION=us-east-1

# Kinesis specific configuration
export AWS_KINESIS_ENDPOINT=https://kinesis.us-east-1.amazonaws.com

# Query stream metrics
aws cloudwatch get-metric-statistics \
    --namespace AWS/Kinesis \
    --metric-name IncomingBytes \
    --dimensions Name=StreamName,Value=my-stream \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 3600 \
    --statistics Sum

# Get logs
aws logs filter-log-events \
    --log-group-name /aws/lambda/my-function \
    --start-time $(date -d '1 hour ago' +%s)000
```

---

## Pricing Reference

### Kinesis Data Streams

| Billing Item | Price |
|--------------|-------|
| Shard Hour | $0.015/shard-hour |
| PUT Payload Unit (25KB) | $0.014/million records |
| Extended Data Retrieval | $0.013/GB |
| Long-term Retention (default 24h) | Included |
| Additional Retention (up to 365 days) | $0.10/GB/month |

### Kinesis Data Firehose

| Destination | Price |
|-------------|-------|
| S3 | $0.029/GB |
| Redshift | $0.029/GB + Redshift charges |
| OpenSearch | $0.029/GB + OpenSearch charges |
| Data Format Conversion | $0.018/GB |
| Dynamic Partitioning | $0.006/GB |

### MSK

| Instance Type | Price/Hour |
|---------------|------------|
| kafka.t3.small | $0.072 |
| kafka.m5.large | $0.21 |
| kafka.m5.xlarge | $0.42 |
| kafka.m5.2xlarge | $0.84 |

### IVS

| Billing Item | Price |
|--------------|-------|
| Input Hours (Basic) | $0.60/hour |
| Input Hours (Standard) | $2.00/hour |
| Output Traffic (first 100TB) | $0.15/GB |
| Storage | $0.05/GB/month |

---

## Troubleshooting

### Kinesis Common Issues

```bash
# Check if shard iterator has expired
aws kinesis get-records --shard-iterator <iterator>
# If ExpiredIteratorException is returned, need to reacquire

# Check write limits
aws cloudwatch get-metric-statistics \
    --metric-name WriteProvisionedThroughputExceeded \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Sum

# Check consumer lag
aws cloudwatch get-metric-statistics \
    --metric-name GetRecords.IteratorAgeMilliseconds \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Average
```

---

## Rekognition Video Analysis Commands

```bash
# Create face collection
aws rekognition create-collection --collection-id my-faces-collection

# List face collections
aws rekognition list-collections

# Index face
aws rekognition index-faces \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=photo.jpg}' \
    --external-image-id "person-name"

# Search face
aws rekognition search-faces-by-image \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=query.jpg}' \
    --face-match-threshold 90

# Kinesis Video Streams
# Create video stream
aws kinesisvideo create-stream \
    --stream-name my-video-stream \
    --data-retention-in-hours 24

# Get video stream endpoint
aws kinesisvideo get-data-endpoint \
    --stream-name my-video-stream \
    --api-name PUT_MEDIA

# Rekognition Stream Processor
# Create stream processor
aws rekognition create-stream-processor \
    --input "KinesisVideoStream={Arn=arn:aws:kinesisvideo:...}" \
    --output "KinesisDataStream={Arn=arn:aws:kinesis:...}" \
    --name my-stream-processor \
    --settings "LabelDetection={MinConfidence=60}" \
    --role-arn arn:aws:iam::123456789:role/RekognitionRole

# List stream processors
aws rekognition list-stream-processors

# Start stream processor
aws rekognition start-stream-processor --name my-stream-processor

# Stop stream processor
aws rekognition stop-stream-processor --name my-stream-processor

# Delete stream processor
aws rekognition delete-stream-processor --name my-stream-processor
```

## Reference Links

- [Kinesis Documentation](https://docs.aws.amazon.com/kinesis/)
- [MSK Documentation](https://docs.aws.amazon.com/msk/)
- [Elemental Documentation](https://docs.aws.amazon.com/elemental/)
- [IVS Documentation](https://docs.aws.amazon.com/ivs/)
- [Rekognition Documentation](https://docs.aws.amazon.com/rekognition/)
