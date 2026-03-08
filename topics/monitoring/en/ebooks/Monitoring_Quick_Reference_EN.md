# AWS Monitoring and Observability Quick Reference

> Quick lookup for commands, configurations, and best practices

---

## CloudWatch Commands

### Metrics Operations

```bash
# List metrics in a namespace
aws cloudwatch list-metrics --namespace AWS/EC2

# Get metric statistics
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-123456789 \
    --statistics Average \
    --start-time 2026-03-01T00:00:00Z \
    --end-time 2026-03-02T00:00:00Z \
    --period 3600

# Push custom metrics
aws cloudwatch put-metric-data \
    --namespace MyApp/Business \
    --metric-data MetricName=OrderCount,Value=1,Unit=Count

# Create alarm
aws cloudwatch put-metric-alarm \
    --alarm-name high-cpu \
    --alarm-description "CPU > 80%" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:123456789:alerts

# Create anomaly detection alarm
aws cloudwatch put-anomaly-detector \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --stat Average

aws cloudwatch put-metric-alarm \
    --alarm-name cpu-anomaly \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --threshold 2.0 \
    --comparison-operator GreaterThanUpperThreshold \
    --treat-missing-data notBreaching
```

### Logs Operations

```bash
# Create log group
aws logs create-log-group --log-group-name /my/app/logs

# Set retention period
aws logs put-retention-policy \
    --log-group-name /my/app/logs \
    --retention-in-days 30

# Query logs (CloudWatch Insights)
aws logs start-query \
    --log-group-names /my/app/logs \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'

# Export logs to S3
aws logs create-export-task \
    --task-name export-task \
    --log-group-name /my/app/logs \
    --from 1700000000000 \
    --to 1700003600000 \
    --destination s3-export-bucket \
    --destination-prefix logs/
```

### Dashboard Operations

```bash
# Create dashboard
aws cloudwatch put-dashboard \
    --dashboard-name MyDashboard \
    --dashboard-body file://dashboard.json

# Get dashboard
aws cloudwatch get-dashboard --dashboard-name MyDashboard

# List dashboards
aws cloudwatch list-dashboards

# Delete dashboard
aws cloudwatch delete-dashboards --dashboard-names MyDashboard
```

---

## X-Ray Commands

```bash
# Get service graph
aws xray get-service-graph \
    --start-time 1700000000 \
    --end-time 1700003600

# Get trace summaries
aws xray get-trace-summaries \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --filter-expression 'service("MyService") { fault = true }'

# Batch get traces
aws xray batch-get-traces --trace-ids TraceId1 TraceId2

# Get insights
aws xray get-insight-summaries \
    --start-time 1700000000 \
    --end-time 1700003600

# Create sampling rule
aws xray create-sampling-rule \
    --sampling-rule file://sampling-rule.json
```

### X-Ray Sampling Rule Example

```json
{
  "SamplingRule": {
    "RuleName": "high-priority-api",
    "Priority": 1,
    "Version": 1,
    "ReservoirSize": 100,
    "FixedRate": 0.5,
    "URLPath": "/api/v1/payments/*",
    "ServiceName": "*",
    "ServiceType": "*",
    "Host": "*",
    "HTTPMethod": "POST",
    "ResourceARN": "*"
  }
}
```

---

## CloudTrail Commands

```bash
# View event history
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=PutBucketPolicy \
    --max-items 10

# Create trail
aws cloudtrail create-trail \
    --name my-trail \
    --s3-bucket-name my-cloudtrail-bucket \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --kms-key-id alias/my-key

# Start trail logging
aws cloudtrail start-logging --name my-trail

# Create event data store
aws cloudtrail create-event-data-store \
    --name my-event-store \
    --multi-region-enabled \
    --retention-period 2555

# Enable insight events
aws cloudtrail put-insight-selectors \
    --trail-name my-trail \
    --insight-selectors '[{"InsightType": "ApiCallRateInsight"}]'
```

---

## Cost Explorer Commands

```bash
# Get cost and usage
aws ce get-cost-and-usage \
    --time-period Start=2026-02-01,End=2026-03-01 \
    --granularity MONTHLY \
    --metrics UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE

# Get cost forecast
aws ce get-cost-forecast \
    --time-period Start=2026-03-01,End=2026-04-01 \
    --metric UNBLENDED_COST \
    --granularity MONTHLY

# Get Reserved Instance recommendations
aws ce get-reservation-purchase-recommendation \
    --service "Amazon Elastic Compute Cloud - Compute" \
    --lookback-period-in-days 30

# Get Rightsizing recommendations
aws ce get-rightsizing-recommendation \
    --service AmazonEC2
```

---

## CloudWatch Logs Insights Queries

### Common Query Patterns

```sql
-- Find recent errors
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- Count by error type
fields @message
| parse @message "[*] *" as level, msg
| filter level = "ERROR"
| stats count() as error_count by msg
| sort error_count desc

-- Calculate request latency statistics
fields @timestamp, @duration
| filter @type = "REPORT"
| stats 
    count() as invocations,
    avg(@duration) as avg_duration,
    max(@duration) as max_duration,
    percentile(@duration, 99) as p99
    by bin(5m)

-- Lambda cold start analysis
fields @timestamp, @message
| filter @message like /Init Duration/
| parse @message "Init Duration: * ms" as init_duration
| stats avg(init_duration), max(init_duration) by bin(1h)

-- API error rate trends
fields @timestamp, @statusCode
| filter @path like /api/
| stats 
    count() as total,
    count(@statusCode >= 500) as errors
    by bin(5m)
| fields (errors / total * 100) as error_rate

-- User behavior analysis
fields @timestamp, @message
| parse @message "userId: * action: *" as userId, action
| stats count() as actions by userId
| sort actions desc
| limit 10
```

---

## Terraform Monitoring Configuration

### CloudWatch Alarm

```hcl
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.app_name}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization exceeds 80%"
  
  dimensions = {
    InstanceId = aws_instance.main.id
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
  
  tags = {
    Environment = var.environment
    Severity    = "P2"
  }
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.app_name}-${var.environment}"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Request Count"
          region = var.region
          metrics = [
            ["MyApp/API", "RequestCount", "Environment", var.environment]
          ]
          period = 60
          stat   = "Sum"
        }
      },
      {
        type   = "log"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Recent Errors"
          region = var.region
          query  = <<-EOT
            SOURCE '/aws/lambda/${var.app_name}'
            | fields @timestamp, @message
            | filter @message like /ERROR/
            | sort @timestamp desc
            | limit 20
          EOT
        }
      }
    ]
  })
}
```

### X-Ray Configuration

```hcl
resource "aws_xray_sampling_rule" "high_priority" {
  rule_name      = "high-priority"
  priority       = 1
  version        = 1
  reservoir_size = 100
  fixed_rate     = 0.5
  url_path       = "/api/v1/payments/*"
  service_name   = "*"
  service_type   = "*"
  host           = "*"
  http_method    = "POST"
  resource_arn   = "*"
}
```

---

## EMF (Embedded Metric Format) Examples

```python
# Python using EMF
import json
import time

# Basic metric
emf_payload = {
    "_aws": {
        "Timestamp": int(time.time() * 1000),
        "CloudWatchMetrics": [
            {
                "Namespace": "MyApp/Metrics",
                "Dimensions": [["ServiceName", "Operation"]],
                "Metrics": [
                    {"Name": "RequestCount", "Unit": "Count"},
                    {"Name": "Latency", "Unit": "Milliseconds"}
                ]
            }
        ]
    },
    "ServiceName": "PaymentService",
    "Operation": "ProcessPayment",
    "RequestCount": 1,
    "Latency": 150,
    "RequestId": "req-12345"
}

print(json.dumps(emf_payload))

# Lambda context metric
emf_lambda = {
    "_aws": {
        "Timestamp": int(time.time() * 1000),
        "CloudWatchMetrics": [
            {
                "Namespace": "Lambda/Custom",
                "Dimensions": [["FunctionName"]],
                "Metrics": [
                    {"Name": "BusinessValue", "Unit": "None"},
                    {"Name": "CustomerTier", "Unit": "Count"}
                ]
            }
        ]
    },
    "FunctionName": "ProcessOrderFunction",
    "BusinessValue": 99.99,
    "CustomerTier": "premium",
    "OrderId": "ord-789"
}
```

---

## Alert Severity Definitions

| Severity | Response Time | Notification Channel | Example |
|----------|--------------|---------------------|---------|
| P1 - Critical | < 5 minutes | PagerDuty + SMS + Slack | Service completely unavailable |
| P2 - High | < 30 minutes | Slack + Email | Error rate > 5%, latency > 2s |
| P3 - Medium | < 4 hours | Email | Disk usage > 80% |
| P4 - Low | Next business day | Email (digest) | Single node failure |

---

## Monitoring Cost Quick Calculator

| Service | Price | Monthly Estimate Example |
|---------|-------|--------------------------|
| CloudWatch Metrics | $0.30/metric | 100 metrics = $30 |
| CloudWatch Logs | $0.50/GB ingested | 10GB/day = $150 |
| CloudWatch Logs Insights | $0.005/GB scanned | 100GB query = $0.50 |
| X-Ray Traces | $5/1M traces | 10M = $50 |
| CloudWatch Alarms | $0.10/alarm | 50 alarms = $5 |
| CloudWatch Dashboard | $3/dashboard | 10 = $30 |

---

## Reference Links

- [CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [X-Ray Documentation](https://docs.aws.amazon.com/xray/)
- [CloudTrail Documentation](https://docs.aws.amazon.com/cloudtrail/)
- [Cost Explorer Documentation](https://docs.aws.amazon.com/cost-management/)
- [OpenTelemetry AWS](https://aws-otel.github.io/)
