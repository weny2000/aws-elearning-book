# AWS モニタリングとオブザーバビリティクイックリファレンス

> コマンド、設定、ベストプラクティスを素早く検索

---

## CloudWatch コマンド

### メトリクス操作

```bash
# 名前空間内のメトリクスを一覧表示
aws cloudwatch list-metrics --namespace AWS/EC2

# メトリクス統計を取得
aws cloudwatch get-metric-statistics \
    --namespace AWS/EC2 \
    --metric-name CPUUtilization \
    --dimensions Name=InstanceId,Value=i-123456789 \
    --statistics Average \
    --start-time 2026-03-01T00:00:00Z \
    --end-time 2026-03-02T00:00:00Z \
    --period 3600

# カスタムメトリクスをプッシュ
aws cloudwatch put-metric-data \
    --namespace MyApp/Business \
    --metric-data MetricName=OrderCount,Value=1,Unit=Count

# アラームを作成
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

# 異常検出アラームを作成
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

### ログ操作

```bash
# ロググループを作成
aws logs create-log-group --log-group-name /my/app/logs

# 保持期間を設定
aws logs put-retention-policy \
    --log-group-name /my/app/logs \
    --retention-in-days 30

# ログをクエリ（CloudWatch Insights）
aws logs start-query \
    --log-group-names /my/app/logs \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | limit 20'

# ログを S3 にエクスポート
aws logs create-export-task \
    --task-name export-task \
    --log-group-name /my/app/logs \
    --from 1700000000000 \
    --to 1700003600000 \
    --destination s3-export-bucket \
    --destination-prefix logs/
```

### ダッシュボード操作

```bash
# ダッシュボードを作成
aws cloudwatch put-dashboard \
    --dashboard-name MyDashboard \
    --dashboard-body file://dashboard.json

# ダッシュボードを取得
aws cloudwatch get-dashboard --dashboard-name MyDashboard

# ダッシュボードを一覧表示
aws cloudwatch list-dashboards

# ダッシュボードを削除
aws cloudwatch delete-dashboards --dashboard-names MyDashboard
```

---

## X-Ray コマンド

```bash
# サービスマップを取得
aws xray get-service-graph \
    --start-time 1700000000 \
    --end-time 1700003600

# トレースサマリーを取得
aws xray get-trace-summaries \
    --start-time 1700000000 \
    --end-time 1700003600 \
    --filter-expression 'service("MyService") { fault = true }'

# トレースをバッチ取得
aws xray batch-get-traces --trace-ids TraceId1 TraceId2

# インサイトを取得
aws xray get-insight-summaries \
    --start-time 1700000000 \
    --end-time 1700003600

# サンプリングルールを作成
aws xray create-sampling-rule \
    --sampling-rule file://sampling-rule.json
```

### X-Ray サンプリングルール例

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

## CloudTrail コマンド

```bash
# イベント履歴を閲覧
aws cloudtrail lookup-events \
    --lookup-attributes AttributeKey=EventName,AttributeValue=PutBucketPolicy \
    --max-items 10

# トレールを作成
aws cloudtrail create-trail \
    --name my-trail \
    --s3-bucket-name my-cloudtrail-bucket \
    --is-multi-region-trail \
    --enable-log-file-validation \
    --kms-key-id alias/my-key

# トレールログ記録を開始
aws cloudtrail start-logging --name my-trail

# イベントデータストアを作成
aws cloudtrail create-event-data-store \
    --name my-event-store \
    --multi-region-enabled \
    --retention-period 2555

# インサイトイベントを開始
aws cloudtrail put-insight-selectors \
    --trail-name my-trail \
    --insight-selectors '[{"InsightType": "ApiCallRateInsight"}]'
```

---

## Cost Explorer コマンド

```bash
# コストと使用量を取得
aws ce get-cost-and-usage \
    --time-period Start=2026-02-01,End=2026-03-01 \
    --granularity MONTHLY \
    --metrics UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE

# コスト予測を取得
aws ce get-cost-forecast \
    --time-period Start=2026-03-01,End=2026-04-01 \
    --metric UNBLENDED_COST \
    --granularity MONTHLY

# リザーブドインスタンス推奨を取得
aws ce get-reservation-purchase-recommendation \
    --service Amazon Elastic Compute Cloud - Compute \
    --lookback-period-in-days 30

# Rightsizing 推奨を取得
aws ce get-rightsizing-recommendation \
    --service AmazonEC2
```

---

## CloudWatch Logs Insights クエリ

### 一般的なクエリパターン

```sql
-- 最近のエラーを検索
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- エラータイプ別に統計
fields @message
| parse @message "[*] *" as level, msg
| filter level = "ERROR"
| stats count() as error_count by msg
| sort error_count desc

-- リクエストレイテンシー統計を計算
fields @timestamp, @duration
| filter @type = "REPORT"
| stats 
    count() as invocations,
    avg(@duration) as avg_duration,
    max(@duration) as max_duration,
    percentile(@duration, 99) as p99
    by bin(5m)

-- Lambda コールドスタート分析
fields @timestamp, @message
| filter @message like /Init Duration/
| parse @message "Init Duration: * ms" as init_duration
| stats avg(init_duration), max(init_duration) by bin(1h)

-- API エラー率トレンド
fields @timestamp, @statusCode
| filter @path like /api/
| stats 
    count() as total,
    count(@statusCode >= 500) as errors
    by bin(5m)
| fields (errors / total * 100) as error_rate

-- ユーザービヘイビア分析
fields @timestamp, @message
| parse @message "userId: * action: *" as userId, action
| stats count() as actions by userId
| sort actions desc
| limit 10
```

---

## Terraform モニタリング設定

### CloudWatch アラーム

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

### X-Ray 設定

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

## EMF（組み込みメトリクスフォーマット）例

```python
# Python で EMF を使用
import json
import time

# 基本メトリクス
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

# Lambda コンテキストメトリクス
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

## アラーム重要度定義

| 重要度 | 対応時間 | 通知チャネル | 例 |
|--------|----------|----------|------|
| P1 - Critical | < 5分 | PagerDuty + SMS + Slack | サービス完全利用不可 |
| P2 - High | < 30分 | Slack + Email | エラー率 > 5%、レイテンシー > 2s |
| P3 - Medium | < 4時間 | Email | ディスク使用率 > 80% |
| P4 - Low | 翌営業日 | Email (ダイジェスト) | 単一ノード障害 |

---

## モニタリングコストクイック計算

| サービス | 価格 | 月間推定例 |
|------|------|--------------|
| CloudWatch Metrics | $0.30/メトリクス | 100メトリクス = $30 |
| CloudWatch Logs | $0.50/GB取り込み | 10GB/日 = $150 |
| CloudWatch Logs Insights | $0.005/GBスキャン | 100GBクエリ = $0.50 |
| X-Ray Traces | $5/100万トレース | 1000万 = $50 |
| CloudWatch Alarms | $0.10/アラーム | 50アラーム = $5 |
| CloudWatch Dashboard | $3/ダッシュボード | 10個 = $30 |

---

## 参考リンク

- [CloudWatch ドキュメント](https://docs.aws.amazon.com/cloudwatch/)
- [X-Ray ドキュメント](https://docs.aws.amazon.com/xray/)
- [CloudTrail ドキュメント](https://docs.aws.amazon.com/cloudtrail/)
- [Cost Explorer ドキュメント](https://docs.aws.amazon.com/cost-management/)
- [OpenTelemetry AWS](https://aws-otel.github.io/)
