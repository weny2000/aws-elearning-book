# Kinesis 詳細解説

> Amazon Kinesis 入門から上級までの完全ガイド

---

## 目次

1. [Kinesis アーキテクチャ詳細](#アーキテクチャ詳細)
2. [プロデューサー最適化](#プロデューサー最適化)
3. [コンシューマーパターン](#コンシューマーパターン)
4. [KPL と KCL 詳細解説](#kpl-と-kcl-詳細解説)
5. [モニタリングとアラート](#モニタリングとアラート)

---

## アーキテクチャ詳細

### シャード戦略設計

```python
import hashlib

def choose_shard_by_user_id(user_id, num_shards):
    """ユーザIDベースの一貫性ハッシュシャード"""
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return hash_value % num_shards

def choose_shard_by_timestamp(timestamp, num_shards):
    """タイムスタンプベースのシャード（時系列データ向け）"""
    # 時間単位でシャード分け
    hour = timestamp.hour
    return hour % num_shards
```

---

## プロデューサー最適化

### バッチ送信戦略

```python
import threading
import time
from queue import Queue

class KinesisBatchProducer:
    """Kinesis バッチプロデューサー"""
    
    def __init__(self, stream_name, batch_size=500, max_bytes=5*1024*1024):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.batch_size = batch_size
        self.max_bytes = max_bytes
        self.buffer = []
        self.buffer_size = 0
        self.lock = threading.Lock()
        
    def put_record(self, data, partition_key):
        """レコードをバッファに追加"""
        record_size = len(data) + len(partition_key)
        
        with self.lock:
            if len(self.buffer) >= self.batch_size or \
               self.buffer_size + record_size > self.max_bytes:
                self._flush()
            
            self.buffer.append({
                'Data': data,
                'PartitionKey': partition_key
            })
            self.buffer_size += record_size
    
    def _flush(self):
        """バッチ送信"""
        if not self.buffer:
            return
        
        try:
            response = self.kinesis.put_records(
                StreamName=self.stream_name,
                Records=self.buffer
            )
            
            # 失敗レコードの処理
            failed = response.get('FailedRecordCount', 0)
            if failed > 0:
                self._handle_failures(response['Records'])
                
        except Exception as e:
            print(f"Flush error: {e}")
        
        self.buffer = []
        self.buffer_size = 0
```

---

## コンシューマーパターン

### 並列コンシューマーグループ

```python
from multiprocessing import Process
import boto3

class ShardConsumer:
    """単一シャードコンシューマー"""
    
    def __init__(self, stream_name, shard_id):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.shard_id = shard_id
        
    def run(self):
        """シャードを継続的に消費"""
        response = self.kinesis.get_shard_iterator(
            StreamName=self.stream_name,
            ShardId=self.shard_id,
            ShardIteratorType='LATEST'
        )
        iterator = response['ShardIterator']
        
        while True:
            try:
                response = self.kinesis.get_records(
                    ShardIterator=iterator,
                    Limit=1000
                )
                
                records = response['Records']
                if records:
                    self.process_records(records)
                
                iterator = response['NextShardIterator']
                
                # レコードが空の場合はスリープ
                if not records:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(5)
    
    def process_records(self, records):
        """レコード処理（サブクラスで実装）"""
        pass

class ParallelConsumerGroup:
    """並列コンシューマーグループ"""
    
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis')
        
    def start(self):
        """全シャードコンシューマーを起動"""
        # 全シャードを取得
        response = self.kinesis.describe_stream(
            StreamName=self.stream_name
        )
        shards = response['StreamDescription']['Shards']
        
        # 各シャードに対してプロセスを起動
        processes = []
        for shard in shards:
            shard_id = shard['ShardId']
            consumer = ShardConsumer(self.stream_name, shard_id)
            p = Process(target=consumer.run)
            p.start()
            processes.append(p)
        
        # 全プロセスを待機
        for p in processes:
            p.join()
```

---

## KPL と KCL 詳細解説

### KPL 詳細設定

```python
from amazon_kclpy import kcl
from amazon_kclpy.v3 import processor

class RecordProcessor(processor.RecordProcessorBase):
    """KCL レコードプロセッサー"""
    
    def initialize(self, initialize_input):
        self.shard_id = initialize_input.shard_id
        print(f"Initialized shard: {self.shard_id}")
    
    def process_records(self, process_records_input):
        """レコードバッチを処理"""
        records = process_records_input.records
        
        for record in records:
            try:
                data = record.binary_data.decode('utf-8')
                self.process_record(data)
            except Exception as e:
                print(f"Error processing record: {e}")
        
        # 処理完了後にチェックポイント
        if records:
            process_records_input.checkpointer.checkpoint()
    
    def process_record(self, data):
        """単一レコードを処理"""
        pass
    
    def shutdown(self, shutdown_input):
        """グレースフルシャットダウン"""
        if shutdown_input.reason == 'TERMINATE':
            shutdown_input.checkpointer.checkpoint()
```

---

## モニタリングとアラート

### CloudWatch ダッシュボード

```python
def create_kinesis_dashboard(stream_name):
    """Kinesis モニタリングダッシュボードを作成"""
    
    cloudwatch = boto3.client('cloudwatch')
    
    dashboard = {
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "title": "Incoming Records",
                    "metrics": [
                        ["AWS/Kinesis", "IncomingRecords", "StreamName", stream_name]
                    ],
                    "period": 60,
                    "stat": "Sum"
                }
            },
            {
                "type": "metric",
                "properties": {
                    "title": "Iterator Age",
                    "metrics": [
                        ["AWS/Kinesis", "GetRecords.IteratorAgeMilliseconds", "StreamName", stream_name]
                    ],
                    "period": 60,
                    "stat": "Average"
                }
            }
        ]
    }
    
    cloudwatch.put_dashboard(
        DashboardName=f'Kinesis-{stream_name}',
        DashboardBody=json.dumps(dashboard)
    )
```

---

## まとめ

Kinesis を習得するためのポイント:

1. **シャード設計**: 適切なパーティションキーを選択し、ホットスポットを回避します
2. **バッチ処理**: PutRecords を使用してバッチ送信します
3. **エラー処理**: リトライとデッドレターキューを実装します
4. **モニタリングアラート**: IteratorAge と書き込み遅延に注目します
5. **コスト最適化**: 必要に応じてシャードをスケールし、Firehose を使用します

ストリームデータ処理アーキテクチャを継続的に最適化してください！
