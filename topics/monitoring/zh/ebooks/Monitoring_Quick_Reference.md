# AWS 监控与可观测性速查手册

> 快速查找命令、配置和最佳实践

---

## CloudWatch 命令

### 指标操作

```bash
# 列出命名空间中的指标
aws cloudwatch list-metrics --namespace AWS/EC2

# 获取指标统计
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-123456789 \
    --statistics Average \
    --start-time 2026-03-01T00:00:00Z \
    --end-time 2026-03-02T00:00:00Z \
    --period 3600

# 推送自定义指标
aws cloudwatch put-metric-data \
    --namespace MyApp/Business \
    --metric-data MetricName=OrderCount,Value=1,Unit=Count

# 创建告警
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

# 创建异常检测告警
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

### 日志操作

```bash
# 创建日志组
aws logs create-log-group --log-group-name /my/app/logs

# 设置保留期
aws logs put-retention-policy \
    --log-group-name /my/app/logs \
    --retention-in-days 30

# 查询日志 (CloudWatch Insights)
aws logs start-query \
    --log-group-names /my/app/logs \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'

# 导出日志到 S3
aws logs create-export-task \
    --task-name export-task \
    --log-group-name /my/app/logs \
    --from 1700000000000 \
    --to 1700003600000 \
    --destination s3-export-bucket \
    --destination-prefix logs/
```

### 仪表板操作

```bash
# 创建仪表板
aws cloudwatch put-dashboard \
    --dashboard-name MyDashboard \
    --dashboard-body file://dashboard.json

# 获取仪表板
aws cloudwatch get-dashboard --dashboard-name MyDashboard

# 列出仪表板
aws cloudwatch list-dashboards

# 删除仪表板
aws cloudwatch delete-dashboards --dashboard-names MyDashboard
```

---

## X-Ray 命令

```bash
# 获取服务地图
aws xray get-service-graph \
    --start-time 1700000000 \
    --end-time 1700003600

# 获取追踪汇总
aws xray get-trace-summaries \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --filter-expression 'service("MyService") { fault = true }'

# 批量获取追踪
aws xray batch-get-traces --trace-ids TraceId1 TraceId2

# 获取洞察
aws xray get-insight-summaries \
    --start-time 1700000000 \
    --end-time 1700003600

# 创建采样规则
aws xray create-sampling-rule \
    --sampling-rule file://sampling-rule.json
```

### X-Ray 采样规则示例

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

## CloudTrail 命令

```bash
# 查看事件历史
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=PutBucketPolicy \
    --max-items 10

# 创建跟踪
aws cloudtrail create-trail \
    --name my-trail \
    --s3-bucket-name my-cloudtrail-bucket \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --kms-key-id alias/my-key

# 启动跟踪日志记录
aws cloudtrail start-logging --name my-trail

# 创建事件数据存储
aws cloudtrail create-event-data-store \
    --name my-event-store \
    --multi-region-enabled \
    --retention-period 2555

# 启动洞察事件
aws cloudtrail put-insight-selectors \
    --trail-name my-trail \
    --insight-selectors '[{"InsightType": "ApiCallRateInsight"}]'
```

---

## Cost Explorer 命令

```bash
# 获取成本和使用情况
aws ce get-cost-and-usage \
    --time-period Start=2026-02-01,End=2026-03-01 \
    --granularity MONTHLY \
    --metrics UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE

# 获取成本预测
aws ce get-cost-forecast \
    --time-period Start=2026-03-01,End=2026-04-01 \
    --metric UNBLENDED_COST \
    --granularity MONTHLY

# 获取预留实例建议
aws ce get-reservation-purchase-recommendation \
    --service Amazon Elastic Compute Cloud - Compute \
    --lookback-period-in-days 30

# 获取 Rightsizing 建议
aws ce get-rightsizing-recommendation \
    --service AmazonEC2
```

---

## CloudWatch Logs Insights 查询

### 常见查询模式

```sql
-- 查找最近的错误
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- 按错误类型统计
fields @message
| parse @message "[*] *" as level, msg
| filter level = "ERROR"
| stats count() as error_count by msg
| sort error_count desc

-- 计算请求延迟统计
fields @timestamp, @duration
| filter @type = "REPORT"
| stats 
    count() as invocations,
    avg(@duration) as avg_duration,
    max(@duration) as max_duration,
    percentile(@duration, 99) as p99
    by bin(5m)

-- Lambda 冷启动分析
fields @timestamp, @message
| filter @message like /Init Duration/
| parse @message "Init Duration: * ms" as init_duration
| stats avg(init_duration), max(init_duration) by bin(1h)

-- API 错误率趋势
fields @timestamp, @statusCode
| filter @path like /api/
| stats 
    count() as total,
    count(@statusCode >= 500) as errors
    by bin(5m)
| fields (errors / total * 100) as error_rate

-- 用户行为分析
fields @timestamp, @message
| parse @message "userId: * action: *" as userId, action
| stats count() as actions by userId
| sort actions desc
| limit 10
```

---

## Terraform 监控配置

### CloudWatch 告警

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

### X-Ray 配置

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

## EMF (嵌入式指标格式) 示例

```python
# Python 使用 EMF
import json
import time

# 基本指标
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

# Lambda 上下文指标
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

## 告警严重性定义

| 严重性 | 响应时间 | 通知渠道 | 示例 |
|--------|----------|----------|------|
| P1 - Critical | < 5分钟 | PagerDuty + SMS + Slack | 服务完全不可用 |
| P2 - High | < 30分钟 | Slack + Email | 错误率 > 5%, 延迟 > 2s |
| P3 - Medium | < 4小时 | Email | 磁盘使用率 > 80% |
| P4 - Low | 下个工作日 | Email (digest) | 单节点故障 |

---

## 监控成本速算

| 服务 | 价格 | 月度估算示例 |
|------|------|--------------|
| CloudWatch Metrics | $0.30/指标 | 100指标 = $30 |
| CloudWatch Logs | $0.50/GB摄入 | 10GB/天 = $150 |
| CloudWatch Logs Insights | $0.005/GB扫描 | 100GB查询 = $0.50 |
| X-Ray Traces | $5/100万追踪 | 1000万 = $50 |
| CloudWatch Alarms | $0.10/告警 | 50告警 = $5 |
| CloudWatch Dashboard | $3/仪表板 | 10个 = $30 |

---

## 参考链接

- [CloudWatch 文档](https://docs.aws.amazon.com/cloudwatch/)
- [X-Ray 文档](https://docs.aws.amazon.com/xray/)
- [CloudTrail 文档](https://docs.aws.amazon.com/cloudtrail/)
- [Cost Explorer 文档](https://docs.aws.amazon.com/cost-management/)
- [OpenTelemetry AWS](https://aws-otel.github.io/)
