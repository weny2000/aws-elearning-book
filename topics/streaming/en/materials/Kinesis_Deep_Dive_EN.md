# Kinesis Deep Dive

> A Complete Guide to Amazon Kinesis from Beginner to Advanced

---

## Table of Contents

1. [Kinesis Architecture Deep Dive](#architecture-deep-dive)
2. [Producer Optimization](#producer-optimization)
3. [Consumer Patterns](#consumer-patterns)
4. [KPL and KCL in Detail](#kpl-and-kcl-in-detail)
5. [Monitoring and Alerting](#monitoring-and-alerting)

---

## Architecture Deep Dive

### Shard Strategy Design

```python
import hashlib

def choose_shard_by_user_id(user_id, num_shards):
    """Consistent hashing sharding based on user ID"""
    hash_value = int(hashlib.md5(user_id.encode()).hexdigest(), 16)
    return hash_value % num_shards

def choose_shard_by_timestamp(timestamp, num_shards):
    """Time-based sharding (suitable for time-series data)"""
    # Shard by hour
    hour = timestamp.hour
    return hour % num_shards
```

---

## Producer Optimization

### Batch Send Strategy

```python
import threading
import time
from queue import Queue

class KinesisBatchProducer:
    """Kinesis Batch Producer"""
    
    def __init__(self, stream_name, batch_size=500, max_bytes=5*1024*1024):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.batch_size = batch_size
        self.max_bytes = max_bytes
        self.buffer = []
        self.buffer_size = 0
        self.lock = threading.Lock()
        
    def put_record(self, data, partition_key):
        """Add record to buffer"""
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
        """Batch send"""
        if not self.buffer:
            return
        
        try:
            response = self.kinesis.put_records(
                StreamName=self.stream_name,
                Records=self.buffer
            )
            
            # Handle failed records
            failed = response.get('FailedRecordCount', 0)
            if failed > 0:
                self._handle_failures(response['Records'])
                
        except Exception as e:
            print(f"Flush error: {e}")
        
        self.buffer = []
        self.buffer_size = 0
```

---

## Consumer Patterns

### Concurrent Consumer Group

```python
from multiprocessing import Process
import boto3

class ShardConsumer:
    """Single shard consumer"""
    
    def __init__(self, stream_name, shard_id):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
        self.shard_id = shard_id
        
    def run(self):
        """Continuously consume shard"""
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
                
                # Sleep when no records
                if not records:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"Error: {e}")
                time.sleep(5)
    
    def process_records(self, records):
        """Process records (implemented by subclass)"""
        pass

class ParallelConsumerGroup:
    """Parallel consumer group"""
    
    def __init__(self, stream_name):
        self.stream_name = stream_name
        self.kinesis = boto3.client('kinesis')
        
    def start(self):
        """Start all shard consumers"""
        # Get all shards
        response = self.kinesis.describe_stream(
            StreamName=self.stream_name
        )
        shards = response['StreamDescription']['Shards']
        
        # Start process for each shard
        processes = []
        for shard in shards:
            shard_id = shard['ShardId']
            consumer = ShardConsumer(self.stream_name, shard_id)
            p = Process(target=consumer.run)
            p.start()
            processes.append(p)
        
        # Wait for all processes
        for p in processes:
            p.join()
```

---

## KPL and KCL in Detail

### KPL Advanced Configuration

```python
from amazon_kclpy import kcl
from amazon_kclpy.v3 import processor

class RecordProcessor(processor.RecordProcessorBase):
    """KCL record processor"""
    
    def initialize(self, initialize_input):
        self.shard_id = initialize_input.shard_id
        print(f"Initialized shard: {self.shard_id}")
    
    def process_records(self, process_records_input):
        """Process a batch of records"""
        records = process_records_input.records
        
        for record in records:
            try:
                data = record.binary_data.decode('utf-8')
                self.process_record(data)
            except Exception as e:
                print(f"Error processing record: {e}")
        
        # Checkpoint after processing
        if records:
            process_records_input.checkpointer.checkpoint()
    
    def process_record(self, data):
        """Process single record"""
        pass
    
    def shutdown(self, shutdown_input):
        """Graceful shutdown"""
        if shutdown_input.reason == 'TERMINATE':
            shutdown_input.checkpointer.checkpoint()
```

---

## Monitoring and Alerting

### CloudWatch Dashboard

```python
def create_kinesis_dashboard(stream_name):
    """Create Kinesis monitoring dashboard"""
    
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

## Summary

Key points for mastering Kinesis:

1. **Shard Design**: Choose partition keys wisely to avoid hotspots
2. **Batch Processing**: Use PutRecords for batch sending
3. **Error Handling**: Implement retry and dead letter queues
4. **Monitoring & Alerting**: Keep an eye on IteratorAge and write latency
5. **Cost Optimization**: Scale shards on demand, use Firehose

Keep optimizing your streaming data architecture!
