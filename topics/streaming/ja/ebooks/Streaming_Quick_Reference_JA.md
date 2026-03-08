# ストリーミングサービスクイックリファレンス

> コマンド、設定、ベストプラクティスの素早い参照用ガイド

---

## 📋 目次

- [Kinesis コマンド](#kinesis-コマンド)
- [MSK (Kafka) コマンド](#msk-kafka-コマンド)
- [ビデオサービスコマンド](#ビデオサービスコマンド)
- [CLI リファレンス](#cli-リファレンス)
- [価格リファレンス](#価格リファレンス)

---

## Kinesis コマンド

### Kinesis Data Streams

```bash
# ストリームを作成
aws kinesis create-stream --stream-name my-stream --shard-count 2

# ストリームを一覧表示
aws kinesis list-streams

# ストリームの詳細を表示
aws kinesis describe-stream --stream-name my-stream

# ストリームを削除
aws kinesis delete-stream --stream-name my-stream

# シャード数を更新
aws kinesis update-shard-count \
    --stream-name my-stream \
    --target-shard-count 4 \
    --scaling-type UNIFORM_SCALING

# レコードを送信
aws kinesis put-record \
    --stream-name my-stream \
    --data $(echo -n '{"key":"value"}' | base64) \
    --partition-key user-123

# バッチ送信
aws kinesis put-records \
    --stream-name my-stream \
    --records \
        Data=$(echo -n '{"key":"value1"}' | base64),PartitionKey=key1 \
        Data=$(echo -n '{"key":"value2"}' | base64),PartitionKey=key2

# シャードイテレーターを取得
aws kinesis get-shard-iterator \
    --stream-name my-stream \
    --shard-id shardId-000000000000 \
    --shard-iterator-type LATEST

# レコードを読み取る
aws kinesis get-records --shard-iterator <iterator-value>

# メトリクスを監視
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
# Firehose デリバリーストリームを S3 に作成
aws firehose create-delivery-stream \
    --delivery-stream-name logs-to-s3 \
    --delivery-stream-type DirectPut \
    --extended-s3-destination-configuration \
        RoleARN=arn:aws:iam::123456789:role/firehose-role,\
        BucketARN=arn:aws:s3:::data-lake-bucket,\
        Prefix=logs/,\
        CompressionFormat=GZIP,\
        BufferingHints={SizeInMBs=64,IntervalInSeconds=300}

# レコードを送信
aws firehose put-record \
    --delivery-stream-name logs-to-s3 \
    --record Data=$(echo -n '{"log":"message"}' | base64)

# デリバリーストリームの詳細を表示
aws firehose describe-delivery-stream \
    --delivery-stream-name logs-to-s3
```

---

## MSK (Kafka) コマンド

```bash
# MSK クラスターを作成
aws kafka create-cluster \
    --cluster-name my-kafka-cluster \
    --kafka-version 3.5.1 \
    --number-of-broker-nodes 3 \
    --broker-node-group-info \
        "ClientSubnets=['subnet-1','subnet-2','subnet-3'],\
         InstanceType=kafka.m5.large,\
         SecurityGroups=['sg-12345678']"

# クラスターを一覧表示
aws kafka list-clusters

# ブートストラップブローカーを取得
aws kafka get-bootstrap-brokers --cluster-arn <cluster-arn>

# Kafka コマンドラインツール
# Topic を作成
kafka-topics.sh --create \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --partitions 3 \
    --replication-factor 2

# Topics を一覧表示
kafka-topics.sh --list --bootstrap-server $BOOTSTRAP_SERVERS

# メッセージを送信
kafka-console-producer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders

# メッセージを消費
kafka-console-consumer.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --topic orders \
    --from-beginning

# コンシューマグループを表示
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --list

# コンシューマグループの詳細
kafka-consumer-groups.sh \
    --bootstrap-server $BOOTSTRAP_SERVERS \
    --describe \
    --group my-consumer-group
```

---

## ビデオサービスコマンド

### MediaConvert

```bash
# トランスコードジョブを作成
aws mediaconvert create-job \
    --role arn:aws:iam::123456789:role/MediaConvertRole \
    --settings file://job-settings.json

# ジョブを一覧表示
aws mediaconvert list-jobs

# ジョブをキャンセル
aws mediaconvert cancel-job --id <job-id>
```

### MediaLive

```bash
# チャンネルを作成
aws medialive create-channel \
    --name live-channel \
    --input-attachments '[{"InputId":"input-1"}]' \
    --destinations '[{"Id":"destination-1"}]'

# チャンネルを開始
aws medialive start-channel --channel-id <channel-id>

# チャンネルを停止
aws medialive stop-channel --channel-id <channel-id>

# チャンネルを削除
aws medialive delete-channel --channel-id <channel-id>
```

### IVS (Interactive Video Service)

```bash
# チャンネルを作成
aws ivs create-channel \
    --name my-live-channel \
    --type STANDARD

# ストリームキーを取得
aws ivs create-stream-key --channel-arn <channel-arn>

# チャンネル情報を取得
aws ivs get-channel --arn <channel-arn>

# チャンネルを一覧表示
aws ivs list-channels

# チャンネルを削除
aws ivs delete-channel --arn <channel-arn>

# Metadata を注入
aws ivs put-metadata \
    --channel-arn <channel-arn> \
    --metadata '{"type":"quiz","question":"What is AWS?"}'
```

---

## CLI リファレンス

### よく使用する AWS CLI 設定

```bash
# デフォルトリージョンを設定
export AWS_DEFAULT_REGION=us-east-1

# Kinesis 固有の設定
export AWS_KINESIS_ENDPOINT=https://kinesis.us-east-1.amazonaws.com

# ストリームメトリクスをクエリ
aws cloudwatch get-metric-statistics \
    --namespace AWS/Kinesis \
    --metric-name IncomingBytes \
    --dimensions Name=StreamName,Value=my-stream \
    --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%SZ) \
    --period 3600 \
    --statistics Sum

# ログを取得
aws logs filter-log-events \
    --log-group-name /aws/lambda/my-function \
    --start-time $(date -d '1 hour ago' +%s)000
```

---

## 価格リファレンス

### Kinesis Data Streams

| 請求項目 | 価格 |
|--------|------|
| シャード時間 | $0.015/シャード時間 |
| PUT ペイロードユニット (25KB) | $0.014/百万レコード |
| 拡張データ取得 | $0.013/GB |
| 長期保持 (デフォルト 24h) | 含まれる |
| 追加保持 (最大 365日) | $0.10/GB/月 |

### Kinesis Data Firehose

| 宛先 | 価格 |
|--------|------|
| S3 | $0.029/GB |
| Redshift | $0.029/GB + Redshift 費用 |
| OpenSearch | $0.029/GB + OpenSearch 費用 |
| データフォーマット変換 | $0.018/GB |
| 動的パーティション | $0.006/GB |

### MSK

| インスタンスタイプ | 価格/時間 |
|----------|-----------|
| kafka.t3.small | $0.072 |
| kafka.m5.large | $0.21 |
| kafka.m5.xlarge | $0.42 |
| kafka.m5.2xlarge | $0.84 |

### IVS

| 請求項目 | 価格 |
|--------|------|
| 入力時間 (Basic) | $0.60/時間 |
| 入力時間 (Standard) | $2.00/時間 |
| 出力トラフィック (最初の 100TB) | $0.15/GB |
| ストレージ | $0.05/GB/月 |

---

## トラブルシューティング

### Kinesis よくある問題

```bash
# シャードイテレーターが期限切れかどうかを確認
aws kinesis get-records --shard-iterator <iterator>
# ExpiredIteratorException が返された場合、再取得が必要です

# 書き込み制限を確認
aws cloudwatch get-metric-statistics \
    --metric-name WriteProvisionedThroughputExceeded \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Sum

# コンシューマ遅延を確認
aws cloudwatch get-metric-statistics \
    --metric-name GetRecords.IteratorAgeMilliseconds \
    --namespace AWS/Kinesis \
    --dimensions Name=StreamName,Value=my-stream \
    --statistics Average
```

---

## Rekognition ビデオ分析コマンド

```bash
# 顔コレクションを作成
aws rekognition create-collection --collection-id my-faces-collection

# 顔コレクションを一覧表示
aws rekognition list-collections

# 顔をインデックス
aws rekognition index-faces \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=photo.jpg}' \
    --external-image-id "person-name"

# 顔を検索
aws rekognition search-faces-by-image \
    --collection-id my-faces-collection \
    --image 'S3Object={Bucket=mybucket,Name=query.jpg}' \
    --face-match-threshold 90

# Kinesis Video Streams
# ビデオストリームを作成
aws kinesisvideo create-stream \
    --stream-name my-video-stream \
    --data-retention-in-hours 24

# ビデオストリームエンドポイントを取得
aws kinesisvideo get-data-endpoint \
    --stream-name my-video-stream \
    --api-name PUT_MEDIA

# Rekognition Stream Processor
# ストリームプロセッサーを作成
aws rekognition create-stream-processor \
    --input "KinesisVideoStream={Arn=arn:aws:kinesisvideo:...}" \
    --output "KinesisDataStream={Arn=arn:aws:kinesis:...}" \
    --name my-stream-processor \
    --settings "LabelDetection={MinConfidence=60}" \
    --role-arn arn:aws:iam::123456789:role/RekognitionRole

# ストリームプロセッサーを一覧表示
aws rekognition list-stream-processors

# ストリームプロセッサーを開始
aws rekognition start-stream-processor --name my-stream-processor

# ストリームプロセッサーを停止
aws rekognition stop-stream-processor --name my-stream-processor

# ストリームプロセッサーを削除
aws rekognition delete-stream-processor --name my-stream-processor
```

## 参考リンク

- [Kinesis ドキュメント](https://docs.aws.amazon.com/kinesis/)
- [MSK ドキュメント](https://docs.aws.amazon.com/msk/)
- [Elemental ドキュメント](https://docs.aws.amazon.com/elemental/)
- [IVS ドキュメント](https://docs.aws.amazon.com/ivs/)
- [Rekognition ドキュメント](https://docs.aws.amazon.com/rekognition/)
