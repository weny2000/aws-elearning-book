# Kinesis 深度解析

> 从入门到精通的 Amazon Kinesis 完整指南

---

## 目录

1. [Kinesis 架构深入](#架构深入)
2. [生产者优化](#生产者优化)
3. [消费者模式](#消费者模式)
4. [KPL 和 KCL 详解](#kpl-和-kcl-详解)
5. [监控与告警](#监控与告警)

---

## 架构深入

### 分片策略设计

```python
import hashlib

def choose_shard_by_user_id(user_id, num_shards):
    """基于用户 ID 的一致性哈希分片"""
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return hash_value % num_shards

def choose_shard_by_timestamp(timestamp, num_shards):
    """基于时间的分片（适用于时序数据）"""
    # 按小时分片
    hour = timestamp.hour
    return hour % num_shards
```

---

## 生产者优化

### 批量发送策略

```python
import threading
import time
from queue import Queue

class KinesisBatchProducer:
    """Kinesis 批量生产者"""
    
    def __init__(self, stream_name, batch_size=500, max_bytes=5*1024*1024):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.batch_size = batch_size
        self.max_bytes = max_bytes
        self.buffer = []
        self.buffer_size = 0
        self.lock = threading.Lock()
        
    def put_record(self, data, partition_key):
        """添加记录到缓冲区"""
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
        """批量发送"""
        if not self.buffer:
            return
        
        try:
            response = self.kinesis.put_records(
                StreamName=self.stream_name,
                Records=self.buffer
            )
            
            # 处理失败记录
            failed = response.get('FailedRecordCount', 0)
            if failed > 0:
                self._handle_failures(response['Records'])
                
        except Exception as e:
            print(f"Flush error: {e}")
        
        self.buffer = []
        self.buffer_size = 0
```

---

## 消费者模式

### 并发消费者组

```python
from multiprocessing import Process
import boto3

class ShardConsumer:
    """单个分片消费者"""
    
    def __init__(self, stream_name, shard_id):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.shard_id = shard_id
        
    def run(self):
        """持续消费分片"""
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
                
                # 空记录时休眠
                if not records:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(5)
    
    def process_records(self, records):
        """处理记录（子类实现）"""
        pass

class ParallelConsumerGroup:
    """并行消费者组"""
    
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis')
        
    def start(self):
        """启动所有分片消费者"""
        # 获取所有分片
        response = self.kinesis.describe_stream(
            StreamName=self.stream_name
        )
        shards = response['StreamDescription']['Shards']
        
        # 为每个分片启动进程
        processes = []
        for shard in shards:
            shard_id = shard['ShardId']
            consumer = ShardConsumer(self.stream_name, shard_id)
            p = Process(target=consumer.run)
            p.start()
            processes.append(p)
        
        # 等待所有进程
        for p in processes:
            p.join()
```

---

## KPL 和 KCL 详解

### KPL 高级配置

```python
from amazon_kclpy import kcl
from amazon_kclpy.v3 import processor

class RecordProcessor(processor.RecordProcessorBase):
    """KCL 记录处理器"""
    
    def initialize(self, initialize_input):
        self.shard_id = initialize_input.shard_id
        print(f"Initialized shard: {self.shard_id}")
    
    def process_records(self, process_records_input):
        """处理一批记录"""
        records = process_records_input.records
        
        for record in records:
            try:
                data = record.binary_data.decode('utf-8')
                self.process_record(data)
            except Exception as e:
                print(f"Error processing record: {e}")
        
        # 处理完成后检查点
        if records:
            process_records_input.checkpointer.checkpoint()
    
    def process_record(self, data):
        """处理单条记录"""
        pass
    
    def shutdown(self, shutdown_input):
        """优雅关闭"""
        if shutdown_input.reason == 'TERMINATE':
            shutdown_input.checkpointer.checkpoint()
```

---

## 监控与告警

### CloudWatch 仪表盘

```python
def create_kinesis_dashboard(stream_name):
    """创建 Kinesis 监控仪表盘"""
    
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

## 总结

掌握 Kinesis 的关键点:

1. **分片设计**: 合理选择分区键，避免热点
2. **批量处理**: 使用 PutRecords 批量发送
3. **错误处理**: 实现重试和死信队列
4. **监控告警**: 关注 IteratorAge 和写入延迟
5. **成本优化**: 按需扩展分片，使用 Firehose

持续优化您的流数据处理架构！
