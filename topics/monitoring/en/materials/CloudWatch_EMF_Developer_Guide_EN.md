# CloudWatch Embedded Metric Format (EMF) Developer Guide

> High-performance, cost-effective CloudWatch metrics collection for developers

---

## Table of Contents

1. [EMF Overview](#1-emf-overview)
2. [EMF Format Specification](#2-emf-format-specification)
3. [Language Implementations](#3-language-implementations)
4. [Lambda Integration](#4-lambda-integration)
5. [Container Integration](#5-container-integration)
6. [Advanced Patterns](#6-advanced-patterns)
7. [Cost Optimization](#7-cost-optimization)

---

## 1. EMF Overview

### 1.1 What is EMF

Embedded Metric Format (EMF) is a JSON specification that allows CloudWatch metrics to be embedded within structured log events. CloudWatch Logs automatically extracts these metrics without requiring PutMetric API calls.

```
Traditional: Application → CloudWatch API (PutMetric) → CloudWatch Metrics
EMF:         Application → CloudWatch Logs → Auto Extraction → CloudWatch Metrics

Benefits:
- High throughput: No API throttling
- Low cost: Charged by log volume, typically cheaper than API calls
- Low latency: Asynchronous processing, non-blocking
- Rich context: Metrics correlated with logs
```

### 1.2 EMF vs Traditional Comparison

| Feature | PutMetric API | EMF |
|---------|--------------|-----|
| Latency | Synchronous | Asynchronous |
| Cost | $0.01/1000 metrics | Log storage fees |
| Limits | 150 TPS/region | No limits |
| Dimensions | 10 | 9 |
| Context | None | Full logs |
| Complexity | Requires SDK | Just JSON |

---

## 2. EMF Format Specification

### 2.1 Basic Format

```json
{
  "_aws": {
    "Timestamp": 1574109732004,
    "CloudWatchMetrics": [
      {
        "Namespace": "MyApplication",
        "Dimensions": [["ServiceName", "Operation"]],
        "Metrics": [
          {
            "Name": "ProcessingLatency",
            "Unit": "Milliseconds"
          }
        ]
      }
    ]
  },
  "ServiceName": "UserService",
  "Operation": "CreateUser",
  "ProcessingLatency": 100
}
```

---

## 3. Language Implementations

### 3.1 Python (AWS Lambda Powertools)

```python
# pip install aws-lambda-powertools
from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.metrics import MetricUnit

metrics = Metrics(namespace="MyApplication")
logger = Logger()

@logger.inject_lambda_context
@metrics.log_metrics(capture_cold_start_metric=True)
def lambda_handler(event, context):
    metrics.add_dimension(name="ServiceName", value="UserService")
    metrics.add_metric(name="SuccessfulRequests", unit=MetricUnit.Count, value=1)
    metrics.add_metric(name="ProcessingLatency", unit=MetricUnit.Milliseconds, value=100)
    
    return {"statusCode": 200}
```

### 3.2 Node.js

```javascript
// npm install aws-embedded-metrics
const { metricScope, Unit } = require('aws-embedded-metrics');

exports.handler = metricScope(metrics => async (event, context) => {
    metrics.setNamespace('MyApplication');
    metrics.putDimensions({ ServiceName: 'OrderService' });
    
    metrics.putMetric('ProcessingTime', 100, Unit.Milliseconds);
    metrics.putMetric('SuccessCount', 1, Unit.Count);
    
    return { statusCode: 200 };
});
```

### 3.3 Java

```java
import software.amazon.cloudwatchlogs.emf.logger.MetricsLogger;
import software.amazon.cloudwatchlogs.emf.model.Unit;
import software.amazon.cloudwatchlogs.emf.model.DimensionSet;

public class Handler {
    public String handleRequest(Map<String, Object> event, Context context) {
        MetricsLogger metrics = new MetricsLogger();
        
        metrics.setNamespace("MyApplication");
        metrics.putDimensions(DimensionSet.of(
            "ServiceName", "OrderService"
        ));
        metrics.putMetric("ProcessingLatency", 100, Unit.MILLISECONDS);
        
        metrics.flush();
        return "Success";
    }
}
```

---

## 4. Lambda Integration

### 4.1 Lambda Powertools Best Practices

```python
from aws_lambda_powertools import Logger, Metrics, Tracer
from aws_lambda_powertools.metrics import MetricUnit
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()
metrics = Metrics()

@tracer.capture_lambda_handler
@logger.inject_lambda_context(log_event=True)
@metrics.log_metrics(
    capture_cold_start_metric=True,
    default_dimensions={"Service": "UserService"}
)
def handler(event: dict, context: LambdaContext):
    try:
        metrics.add_dimension(name="Operation", value=event.get('operation'))
        
        with tracer.provider.in_subsegment('## business_logic'):
            result = process_request(event)
        
        metrics.add_metric(name="SuccessCount", unit=MetricUnit.Count, value=1)
        
        return {'statusCode': 200}
    except Exception as e:
        metrics.add_metric(name="ErrorCount", unit=MetricUnit.Count, value=1)
        logger.exception("Request failed")
        return {'statusCode': 500}
```

### 4.2 Lambda Layer Configuration

```yaml
Globals:
  Function:
    Layers:
      - !Sub 'arn:aws:lambda:${AWS::Region}:017000801446:layer:AWSLambdaPowertoolsPythonV2:40'
    Environment:
      Variables:
        POWERTOOLS_SERVICE_NAME: my-service
        POWERTOOLS_LOG_FORMAT: JSON
        POWERTOOLS_METRICS_NAMESPACE: MyApplication
```

---

## 5. Container Integration

### 5.1 ECS/Fargate EMF Agent

```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y wget && \
    wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb && \
    dpkg -i amazon-cloudwatch-agent.deb

COPY app.py /app/
COPY cwagent-config.json /opt/aws/amazon-cloudwatch-agent/etc/
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
```

---

## 6. Advanced Patterns

### 6.1 Custom Metric Aggregation

```python
import json
from collections import defaultdict
import time

class EMFBatchCollector:
    def __init__(self, namespace, flush_interval=60):
        self.namespace = namespace
        self.flush_interval = flush_interval
        self.metrics_buffer = defaultdict(lambda: {'values': [], 'unit': 'Count'})
        self.dimensions = {}
        self.last_flush = time.time()
    
    def add_metric(self, name, value, unit='Count'):
        self.metrics_buffer[name]['values'].append(value)
        self.metrics_buffer[name]['unit'] = unit
        
        if time.time() - self.last_flush > self.flush_interval:
            self.flush()
    
    def flush(self):
        if not self.metrics_buffer:
            return
        
        emf_values = {}
        emf_metrics = []
        
        for name, data in self.metrics_buffer.items():
            values = data['values']
            emf_values[f"{name}_count"] = len(values)
            emf_values[f"{name}_sum"] = sum(values)
            emf_values[f"{name}_min"] = min(values)
            emf_values[f"{name}_max"] = max(values)
            
            emf_metrics.extend([
                {"Name": f"{name}_count", "Unit": "Count"},
                {"Name": f"{name}_sum", "Unit": data['unit']},
            ])
        
        emf = {
            "_aws": {
                "Timestamp": int(time.time() * 1000),
                "CloudWatchMetrics": [{
                    "Namespace": self.namespace,
                    "Dimensions": [list(self.dimensions.keys())],
                    "Metrics": emf_metrics
                }]
            },
            **self.dimensions,
            **emf_values
        }
        
        print(json.dumps(emf))
        self.metrics_buffer.clear()
        self.last_flush = time.time()
```

---

## 7. Cost Optimization

### 7.1 Sampling Strategy

```python
import random

class SampledMetrics:
    def __init__(self, sample_rate=0.1):
        self.sample_rate = sample_rate
    
    def add_metric(self, name, value, unit='Count'):
        if random.random() < self.sample_rate:
            log_emf(name, value * (1/self.sample_rate), unit)

metrics = SampledMetrics(sample_rate=0.1)
```

### 7.2 Cost Comparison Calculator

```python
def calculate_cost_comparison(metrics_per_day: int, avg_metric_size_bytes: int = 200):
    """
    Calculate PutMetric vs EMF cost comparison
    """
    # PutMetric API cost
    putmetric_monthly = (metrics_per_day * 30 / 1000) * 0.01
    
    # EMF cost (estimated)
    daily_data_gb = (metrics_per_day * avg_metric_size_bytes) / (1024**3)
    monthly_data_gb = daily_data_gb * 30 * 0.7
    emf_ingestion_monthly = monthly_data_gb * 0.50
    emf_storage_monthly = monthly_data_gb * 0.03
    emf_total = emf_ingestion_monthly + emf_storage_monthly
    
    print(f"Daily metrics: {metrics_per_day:,}")
    print(f"PutMetric monthly: ${putmetric_monthly:.2f}")
    print(f"EMF monthly: ${emf_total:.2f}")
    print(f"Savings: ${putmetric_monthly - emf_total:.2f}")
```

---

*Part of AWS DevTools Hero Learning Path*
