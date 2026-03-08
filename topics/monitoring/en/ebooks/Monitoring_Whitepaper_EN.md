# AWS Monitoring and Observability Technical Whitepaper

> From Infrastructure to Business Value: Building Cost-Effective Observability Systems

---

## Table of Contents

> **Learning Guide**: This whitepaper follows an "Three Pillars → Business Value → Economic Efficiency" progression. The first 4 chapters cover core observability technologies, the middle 4 extend to business and efficiency, and the final 5 focus on enterprise practices and cost optimization.

1. **[Observability Overview and Strategy](#1-observability-overview-and-strategy)**  
   *Establish a holistic view: Understand the Three Pillars of Observability (Metrics/Logs/Traces), maturity models, and monitoring ROI calculation—the foundational framework for all subsequent chapters.*

2. **[CloudWatch Deep Dive](#2-cloudwatch-deep-dive)**  
   *Master core monitoring services: Deep dive into metrics, logs, alarms, dashboards, and EMF embedded metric format—the cornerstone of AWS monitoring systems.*

3. **[CloudTrail Audit and Compliance Tracking](#3-cloudtrail-audit-and-compliance-tracking)**  
   *Track operational behavior: Learn CloudTrail event analysis, anomaly detection, and security alarms for complete API call audit trails.*

4. **[X-Ray Distributed Tracing](#4-x-ray-distributed-tracing)**  
   *Understand full request paths: Master service maps, trace analysis, and subsegment tracing—connecting technical traces with business context.*

5. **[Business Metrics Monitoring and Custom Metrics](#5-business-metrics-monitoring-and-custom-metrics)**  
   *From technical metrics to business value: Learn SLO/SLI design, business metrics collection, and user journey tracking to drive business decisions with monitoring.*

6. **[Log Management and Analysis](#6-log-management-and-analysis)**  
   *Structured logging best practices: Master CloudWatch Logs, Insights queries, correlation tracing, and cost optimization to extract value from logs.*

7. **[Alerting Strategy and Incident Response](#7-alerting-strategy-and-incident-response)**  
   *Intelligent alerting and automation: Learn tiered alerting, alert suppression, auto-remediation, and incident response workflows to reduce MTTR.*

8. **[APM Application Performance Monitoring](#8-apm-application-performance-monitoring)**  
   *Full-stack performance management: Integrate OpenTelemetry, X-Ray, and CloudWatch to build application performance monitoring and optimization systems.*

9. **[Architecture Economic Analysis Framework](#9-architecture-economic-analysis-framework)**  
   *Monitoring cost and value balance: Learn monitoring cost attribution, ROI models, and unit economic metrics to achieve optimal monitoring investment.*

10. **[Cost Monitoring and Optimization Practices](#10-cost-monitoring-and-optimization-practices)**  
    *AWS cost observability: Master CUR analysis, cost anomaly detection, budget management, and predictive alerting to make cloud costs visible and controllable.*

11. **[Multi-Environment Monitoring Strategy](#11-multi-environment-monitoring-strategy)**  
    *Cross-environment unified view: Learn monitoring strategies for dev/test/prod environments, deployment impact analysis, and cross-account aggregation.*

12. **[Security Monitoring and Threat Detection](#12-security-monitoring-and-threat-detection)**  
    *Security observability: Integrate GuardDuty, Security Hub, and automated response to build security event monitoring and response systems.*

13. **[Production Environment Best Practices](#13-production-environment-best-practices)**  
    *Enterprise-grade monitoring platform: Synthesize all preceding knowledge to learn Monitoring as Code, health checks, and continuous optimization to build production-grade observability platforms.*

---

## 1. Observability Overview and Strategy

### 1.1 The Three Pillars of Observability

```mermaid
flowchart TB
    subgraph ThreePillars["Three Pillars of Observability"]
        direction TB
        Metrics[Metrics<br/>What?]
        Logs[Logs<br/>Why?]
        Traces[Traces<br/>Where?]
    end
    
    subgraph BusinessValue["Business Value Layer"]
        SLO[SLO/SLA Management]
        Cost[Cost Efficiency]
        UX[User Experience]
        Revenue[Revenue Impact]
    end
    
    subgraph EconomicEfficiency["Architecture Economics"]
        MTTR[MTTR Optimization]
        Waste[Waste Elimination]
        RightSize[Right-Sizing]
    end
    
    Metrics --> SLO
    Logs --> MTTR
    Traces --> UX
    
    ThreePillars --> BusinessValue
    ThreePillars --> EconomicEfficiency
```

### 1.2 Monitoring Maturity Model

| Level | Name | Characteristics | Cost-Effectiveness |
|-------|------|-----------------|-------------------|
| L1 | Basic Monitoring | Infrastructure metrics, basic alerts | Low investment, basic visibility |
| L2 | Application Monitoring | APM, custom business metrics | Medium investment, fault localization |
| L3 | Intelligent Observability | Correlation analysis, anomaly detection | High investment, predictive insights |
| L4 | Business-Driven | SLO management, cost attribution | Strategic investment, value maximization |

### 1.3 AWS Monitoring Service Matrix

```mermaid
flowchart TB
    subgraph Infrastructure["Infrastructure Layer"]
        CWMetrics[CloudWatch Metrics]
        CWLogs[CloudWatch Logs]
        CWAlarms[CloudWatch Alarms]
    end
    
    subgraph Application["Application Layer"]
        XRay[X-Ray]
        CWInsights[CloudWatch Insights]
        Contrib[CloudWatch Contributor]
    end
    
    subgraph Business["Business Layer"]
        CustomMetrics[Custom Metrics]
        Evidently[CloudWatch Evidently]
        RUM[CloudWatch RUM]
    end
    
    subgraph Governance["Governance Layer"]
        CloudTrail[CloudTrail]
        Config[Config]
        SecurityHub[Security Hub]
    end
    
    subgraph Cost["Cost Layer"]
        CostExplorer[Cost Explorer]
        Budgets[Budgets]
        CUR[CUR Analysis]
    end
    
    Infrastructure --> Application --> Business
    Governance -.-> Infrastructure
    Cost -.-> All[All Layers]
```

### 1.4 Monitoring Return on Investment (ROI) Model

```python
"""
Monitoring Return on Investment Calculation Model

Monitoring ROI = (Loss Prevention + Efficiency Gains) / Total Monitoring Cost
"""

class MonitoringROI:
    def __init__(self):
        self.costs = {
            'cloudwatch_metrics': 0,
            'cloudwatch_logs': 0,
            'xray': 0,
            'dashboards': 0,
            'personnel': 0
        }
        self.benefits = {
            'downtime_prevention': 0,  # Prevented downtime losses
            'mttr_reduction': 0,       # Cost savings from MTTR reduction
            'resource_optimization': 0, # Resource optimization savings
            'auto_remediation': 0      # Labor savings from auto-remediation
        }
    
    def calculate_monthly_cost(self):
        """Calculate monthly monitoring costs"""
        # CloudWatch Metrics: $0.30 per metric/month
        # Custom metrics: 100 metrics
        metrics_cost = 100 * 0.30
        
        # CloudWatch Logs: $0.50 per GB ingested
        # 10GB logs per day
        logs_cost = 10 * 30 * 0.50
        
        # X-Ray: $5 per million traces
        # 10 million traces per month
        xray_cost = 10 * 5
        
        # Dashboards: $3 per dashboard/month
        dashboard_cost = 20 * 3
        
        total = metrics_cost + logs_cost + xray_cost + dashboard_cost
        
        return {
            'metrics': metrics_cost,
            'logs': logs_cost,
            'xray': xray_cost,
            'dashboards': dashboard_cost,
            'total': total
        }
    
    def calculate_benefits(self):
        """Calculate benefits from monitoring"""
        # Assumption: One P1 incident per month, $50,000 loss each
        # Monitoring detects and prevents 80%
        downtime_prevention = 50000 * 0.8 / 12
        
        # MTTR reduced from 2 hours to 15 minutes
        # Saves 1.75 hours, engineer cost $150/hour, 4 incidents per month
        mttr_savings = 1.75 * 150 * 4
        
        # Resource optimization: Auto-scaling saves 20% compute costs
        # Assuming monthly compute cost $50,000
        resource_savings = 50000 * 0.20
        
        # Auto-remediation labor savings
        auto_remediation = 2000  # Saves 20 hours per month
        
        return {
            'downtime_prevention': downtime_prevention,
            'mttr_reduction': mttr_savings,
            'resource_optimization': resource_savings,
            'auto_remediation': auto_remediation,
            'total': downtime_prevention + mttr_savings + resource_savings + auto_remediation
        }
    
    def calculate_roi(self):
        """Calculate ROI"""
        costs = self.calculate_monthly_cost()
        benefits = self.calculate_benefits()
        
        roi = (benefits['total'] - costs['total']) / costs['total'] * 100
        
        return {
            'monthly_cost': costs['total'],
            'monthly_benefit': benefits['total'],
            'net_benefit': benefits['total'] - costs['total'],
            'roi_percentage': roi,
            'payback_months': costs['total'] / (benefits['total'] / 12) if benefits['total'] > 0 else float('inf')
        }

# Usage example
roi_calculator = MonitoringROI()
result = roi_calculator.calculate_roi()
print(f"Monthly Monitoring Cost: ${result['monthly_cost']:.2f}")
print(f"Monthly Benefit: ${result['monthly_benefit']:.2f}")
print(f"Net Benefit: ${result['net_benefit']:.2f}")
print(f"ROI: {result['roi_percentage']:.1f}%")
```

---

## 2. CloudWatch Deep Dive

### 2.1 CloudWatch Architecture and Data Flow

```mermaid
flowchart TB
    subgraph DataSources["Data Sources"]
        EC2[EC2 Instances]
        Lambda[Lambda Functions]
        RDS[RDS Databases]
        ALB[Application Load Balancers]
        Custom[Custom Applications]
        Kinesis[Kinesis Streams]
    end
    
    subgraph CloudWatch["CloudWatch Service"]
        Metrics[Metrics Storage]
        Logs[Logs Storage]
        Insights[Logs Insights]
        Contributor[Contributor Insights]
        Anomaly[Anomaly Detection]
    end
    
    subgraph Consumers["Consumers"]
        Alarms[Alarms]
        Dashboards[Dashboards]
        Events[EventBridge]
        S3[S3 Archive]
        OpenSearch[OpenSearch]
    end
    
    EC2 -->|Basic Monitoring 5min| Metrics
    EC2 -->|Detailed Monitoring 1min| Metrics
    Lambda -->|Auto-delivery| Logs
    Lambda -->|Built-in Metrics| Metrics
    RDS -->|Enhanced Monitoring| Metrics
    ALB -->|Access Logs| Logs
    Custom -->|PutMetricData| Metrics
    Kinesis -->|Streaming Logs| Logs
    
    Metrics --> Alarms
    Metrics --> Dashboards
    Metrics --> Anomaly
    Logs --> Insights
    Logs --> Contributor
    Logs --> S3
```

### 2.2 Custom Business Metrics Best Practices

```python
import boto3
from datetime import datetime, timedelta
import json

cloudwatch = boto3.client('cloudwatch')

class BusinessMetrics:
    """Business Metrics Monitoring - From Technical Metrics to Business Value"""
    
    def __init__(self, namespace='MyApplication/Business'):
        self.namespace = namespace
        self.cloudwatch = boto3.client('cloudwatch')
    
    def record_order_completed(self, order_value, customer_tier, region):
        """Record order completion metrics"""
        
        # Core business metrics
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=[
                {
                    'MetricName': 'OrdersCompleted',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'CustomerTier', 'Value': customer_tier},
                        {'Name': 'Region', 'Value': region}
                    ],
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'OrderValue',
                    'Value': order_value,
                    'Unit': 'None',  # Custom unit
                    'Dimensions': [
                        {'Name': 'CustomerTier', 'Value': customer_tier}
                    ],
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    
    def record_user_journey(self, step_name, duration_ms, success):
        """Record user journey funnel"""
        
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=[
                {
                    'MetricName': 'UserJourneyStep',
                    'Value': 1,
                    'Unit': 'Count',
                    'Dimensions': [
                        {'Name': 'StepName', 'Value': step_name},
                        {'Name': 'Outcome', 'Value': 'Success' if success else 'Failure'}
                    ],
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'UserJourneyDuration',
                    'Value': duration_ms,
                    'Unit': 'Milliseconds',
                    'Dimensions': [
                        {'Name': 'StepName', 'Value': step_name}
                    ],
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
    
    def record_feature_usage(self, feature_name, user_id, context=None):
        """Record feature usage - for feature deprecation decisions"""
        
        dimensions = [
            {'Name': 'FeatureName', 'Value': feature_name}
        ]
        
        if context:
            for key, value in context.items():
                dimensions.append({'Name': key, 'Value': str(value)})
        
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=[{
                'MetricName': 'FeatureUsage',
                'Value': 1,
                'Unit': 'Count',
                'Dimensions': dimensions,
                'Timestamp': datetime.utcnow()
            }]
        )
    
    def record_api_business_impact(self, api_name, latency_ms, revenue_impact):
        """Record API latency impact on business"""
        
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=[
                {
                    'MetricName': 'APIRevenueImpact',
                    'Value': revenue_impact,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'APIName', 'Value': api_name},
                        {'Name': 'LatencyBucket', 'Value': self._get_latency_bucket(latency_ms)}
                    ]
                }
            ]
        )
    
    def _get_latency_bucket(self, latency_ms):
        """Group latency for analysis"""
        if latency_ms < 100:
            return '<100ms'
        elif latency_ms < 500:
            return '100-500ms'
        elif latency_ms < 1000:
            return '500ms-1s'
        else:
            return '>1s'
    
    def get_conversion_funnel(self, start_time, end_time):
        """Get conversion funnel data"""
        
        steps = ['HomePage', 'ProductPage', 'AddToCart', 'Checkout', 'Purchase']
        funnel_data = {}
        
        for step in steps:
            response = self.cloudwatch.get_metric_statistics(
                Namespace=self.namespace,
                MetricName='UserJourneyStep',
                Dimensions=[
                    {'Name': 'StepName', 'Value': step},
                    {'Name': 'Outcome', 'Value': 'Success'}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Sum']
            )
            
            total = sum(dp['Sum'] for dp in response['Datapoints'])
            funnel_data[step] = total
        
        # Calculate conversion rates
        conversion_rates = {}
        for i in range(1, len(steps)):
            current = funnel_data[steps[i]]
            previous = funnel_data[steps[i-1]]
            rate = (current / previous * 100) if previous > 0 else 0
            conversion_rates[f"{steps[i-1]}->{steps[i]}"] = rate
        
        return {
            'funnel': funnel_data,
            'conversion_rates': conversion_rates
        }

# Lambda handler usage
def lambda_handler(event, context):
    metrics = BusinessMetrics()
    
    # Record order
    metrics.record_order_completed(
        order_value=event['order_value'],
        customer_tier=event['customer_tier'],
        region=context.invoked_function_arn.split(':')[3]
    )
    
    return {'status': 'success'}
```

### 2.3 Embedded Metric Format (EMF) - High Performance, Low Cost

```python
import json
import time

class EMFLogger:
    """
    CloudWatch Embedded Metric Format (EMF)
    Advantages:
    - Asynchronous write, non-blocking requests
    - Automatic aggregation, reduced API calls
    - Supports high-cardinality dimensions
    - Cost reduction 90%+
    """
    
    def __init__(self, service_name='MyService', log_group='/aws/metrics'):
        self.service_name = service_name
        self.log_group = log_group
    
    def log_metric(self, metric_name, value, unit='Count', dimensions=None, metadata=None):
        """Output EMF format logs"""
        
        emf_payload = {
            "_aws": {
                "Timestamp": int(time.time() * 1000),
                "CloudWatchMetrics": [
                    {
                        "Namespace": f"{self.service_name}/Metrics",
                        "Dimensions": [list(dimensions.keys())] if dimensions else [[]],
                        "Metrics": [
                            {
                                "Name": metric_name,
                                "Unit": unit
                            }
                        ]
                    }
                ]
            },
            metric_name: value
        }
        
        # Add dimension values
        if dimensions:
            emf_payload.update(dimensions)
        
        # Add metadata (not extracted as metrics, but available for log queries)
        if metadata:
            emf_payload['metadata'] = metadata
        
        # Output to stdout, Lambda automatically sends to CloudWatch Logs
        print(json.dumps(emf_payload))
    
    def log_api_request(self, api_name, latency_ms, status_code, user_tier):
        """Record API request metrics"""
        
        self.log_metric(
            metric_name='APILatency',
            value=latency_ms,
            unit='Milliseconds',
            dimensions={
                'ServiceName': self.service_name,
                'APIName': api_name,
                'StatusCode': str(status_code),
                'UserTier': user_tier
            },
            metadata={
                'timestamp': time.time(),
                'version': 'v1'
            }
        )
    
    def log_business_event(self, event_type, revenue_value, customer_segment):
        """Record business events"""
        
        self.log_metric(
            metric_name='BusinessRevenue',
            value=revenue_value,
            unit='None',
            dimensions={
                'EventType': event_type,
                'CustomerSegment': customer_segment
            }
        )

# Using EMF in Lambda
emf = EMFLogger(service_name='PaymentService')

def handler(event, context):
    start_time = time.time()
    
    # Process business logic
    result = process_payment(event)
    
    latency = (time.time() - start_time) * 1000
    
    # Output EMF metric - zero latency overhead
    emf.log_api_request(
        api_name='ProcessPayment',
        latency_ms=latency,
        status_code=200 if result['success'] else 500,
        user_tier=event.get('user_tier', 'standard')
    )
    
    if result['success']:
        emf.log_business_event(
            event_type='PaymentSuccess',
            revenue_value=event['amount'],
            customer_segment=event.get('segment', 'unknown')
        )
    
    return result
```

### 2.4 CloudWatch Insights Advanced Queries

```sql
-- Business metrics analysis: Calculate conversion rate
-- Analyze user conversion funnel from browsing to purchase

fields @timestamp, @message
| parse @message "UserId: * Action: * ProductId: *" as userId, action, productId
| filter action in ['view', 'add_to_cart', 'purchase']
| stats 
    count(action = 'view') as views,
    count(action = 'add_to_cart') as carts,
    count(action = 'purchase') as purchases
    by bin(1h)
| fields 
    views,
    carts,
    purchases,
    (carts / views * 100) as view_to_cart_rate,
    (purchases / carts * 100) as cart_to_purchase_rate,
    (purchases / views * 100) as overall_conversion_rate
```

```sql
-- Cost attribution analysis: Identify high-cost calls by API and client

fields @timestamp, @message
| parse @message '"requestId": "*"' as requestId
| parse @message '"apiName": "*"' as apiName
| parse @message '"clientId": "*"' as clientId
| parse @message '"duration": *,' as duration
| parse @message '"memorySize": *,"' as memorySize
| parse @message '"billedDuration": *,' as billedDuration
| filter @message like /REPORT/
| stats 
    count() as invocation_count,
    avg(billedDuration) as avg_duration,
    max(billedDuration) as max_duration,
    (avg(billedDuration) * memorySize / 1024 / 1024 * 0.0000166667 * count()) as estimated_cost
    by apiName, clientId
| sort estimated_cost desc
| limit 20
```

```sql
-- Anomaly detection: Identify API calls deviating from normal patterns

fields @timestamp, @message
| parse @message '"latency": *,' as latency
| parse @message '"apiName": "*"' as apiName
| filter apiName = 'CheckoutAPI'
| stats 
    avg(latency) as avg_latency,
    stdev(latency) as std_latency,
    percentile(latency, 99) as p99_latency,
    count() as request_count
    by bin(5m)
| fields 
    avg_latency,
    std_latency,
    p99_latency,
    request_count,
    (p99_latency > avg_latency + 3 * std_latency) as is_anomaly
| filter is_anomaly = 1
```

---

## 3. CloudTrail Audit and Compliance Tracking

### 3.1 CloudTrail Architecture and Event Flow

```mermaid
flowchart LR
    subgraph AWS["AWS Services"]
        IAM[IAM]
        S3[S3]
        EC2[EC2]
        Lambda[Lambda]
        API[API Calls]
    end
    
    subgraph CloudTrail["CloudTrail"]
        Events[Event Records]
        Insights[Insights Events]
        Lake[CloudTrail Lake]
    end
    
    subgraph Analysis["Analysis Processing"]
        Athena[Athena Queries]
        SNS[SNS Alerts]
        LambdaProc[Lambda Processing]
        SIEM[SIEM Integration]
    end
    
    AWS -->|Record all API calls| Events
    Events -->|Anomaly detection| Insights
    Events -->|Long-term storage| Lake
    Events -->|Real-time notifications| SNS
    Lake --> Athena
    Events --> LambdaProc
    LambdaProc --> SIEM
```

### 3.2 Security Event Monitoring and Response

```python
import boto3
import json
from datetime import datetime, timedelta

cloudtrail = boto3.client('cloudtrail')
sns = boto3.client('sns')
securityhub = boto3.client('securityhub')

class SecurityMonitor:
    """Security Event Monitoring - From CloudTrail to Automated Response"""
    
    def __init__(self):
        self.cloudtrail = boto3.client('cloudtrail')
        self.sns = boto3.client('sns')
        self.high_risk_actions = [
            'PutBucketPolicy', 'PutBucketAcl',              # S3 permission changes
            'CreateAccessKey', 'DeleteAccessKey',            # IAM key changes
            'AttachUserPolicy', 'AttachRolePolicy',          # Privilege escalation
            'PutRolePolicy', 'PutUserPolicy',                # Inline policies
            'CreateUser', 'CreateRole',                      # Identity creation
            'AuthorizeSecurityGroupIngress',                 # Security group open
            'PutBucketPublicAccessBlock',                    # Public access
            'DeleteTrail', 'StopLogging'                     # Audit bypass
        ]
    
    def analyze_events(self, start_time, end_time):
        """Analyze CloudTrail events"""
        
        events = []
        paginator = self.cloudtrail.get_paginator('lookup_events')
        
        for page in paginator.paginate(
            StartTime=start_time,
            EndTime=end_time
        ):
            for event in page['Events']:
                event_data = json.loads(event['CloudTrailEvent'])
                
                # Check high-risk operations
                if event_data['eventName'] in self.high_risk_actions:
                    events.append({
                        'event_time': event['EventTime'],
                        'event_name': event['eventName'],
                        'user': event_data['userIdentity']['arn'],
                        'source_ip': event_data.get('sourceIPAddress', 'unknown'),
                        'risk_level': 'HIGH',
                        'details': event_data
                    })
        
        return events
    
    def detect_privilege_escalation(self, username, hours=24):
        """Detect privilege escalation attempts"""
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        events = self.analyze_events(start_time, end_time)
        
        # Check for large number of permission changes by same user
        user_events = [e for e in events if username in e['user']]
        
        if len(user_events) > 5:
            return {
                'alert': True,
                'type': 'PRIVILEGE_ESCALATION',
                'reason': f'{username} performed {len(user_events)} high-risk operations in {hours} hours',
                'events': user_events
            }
        
        return {'alert': False}
    
    def detect_after_hours_access(self, allowed_hours=(8, 18)):
        """Detect after-hours access"""
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)
        
        events = self.analyze_events(start_time, end_time)
        suspicious = []
        
        for event in events:
            event_hour = event['event_time'].hour
            if event_hour < allowed_hours[0] or event_hour > allowed_hours[1]:
                suspicious.append(event)
        
        return suspicious
    
    def send_security_alert(self, finding):
        """Send security alert"""
        
        message = {
            'default': json.dumps(finding),
            'email': f"""
            Security Alert: {finding.get('type', 'UNKNOWN')}
            
            Time: {datetime.utcnow().isoformat()}
            Details: {json.dumps(finding, indent=2)}
            
            Please investigate immediately.
            """
        }
        
        self.sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789:security-alerts',
            Message=json.dumps(message),
            MessageStructure='json',
            Subject=f"Security Alert: {finding.get('type', 'Unknown')}"
        )
    
    def export_to_security_hub(self, finding):
        """Export to Security Hub"""
        
        security_finding = {
            'SchemaVersion': '2018-10-08',
            'Id': finding['id'],
            'ProductArn': 'arn:aws:securityhub:us-east-1::product/aws/securityhub',
            'GeneratorId': 'custom-security-monitor',
            'AwsAccountId': '123456789',
            'Types': ['Software and Configuration Checks/Policy Compliance'],
            'CreatedAt': datetime.utcnow().isoformat(),
            'UpdatedAt': datetime.utcnow().isoformat(),
            'Severity': {'Label': finding.get('severity', 'MEDIUM')},
            'Title': finding.get('title', 'Security Finding'),
            'Description': finding.get('description', ''),
            'Resources': [{
                'Type': 'AwsIamUser',
                'Id': finding.get('user', 'unknown')
            }],
            'RecordState': 'ACTIVE'
        }
        
        self.securityhub.batch_import_findings(
            Findings=[security_finding]
        )

# Lambda handler
def lambda_handler(event, context):
    monitor = SecurityMonitor()
    
    # Check events from past hour
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=1)
    
    # Analyze events
    events = monitor.analyze_events(start_time, end_time)
    
    alerts = []
    for event in events:
        # Detect privilege escalation
        if event['event_name'] in ['AttachUserPolicy', 'AttachRolePolicy']:
            escalation = monitor.detect_privilege_escalation(
                event['user'].split('/')[-1]
            )
            if escalation['alert']:
                alerts.append(escalation)
                monitor.send_security_alert(escalation)
    
    return {
        'processed_events': len(events),
        'alerts_generated': len(alerts)
    }
```

---

## 4. X-Ray Distributed Tracing

### 4.1 X-Ray Architecture and Tracing Flow

```mermaid
flowchart TB
    subgraph Application["Application Services"]
        APIGW[API Gateway]
        Lambda1[Lambda A]
        Lambda2[Lambda B]
        SQS[SQS Queue]
        DynamoDB[DynamoDB]
        S3[S3]
    end
    
    subgraph XRay["X-Ray"]
        Daemon[X-Ray Daemon]
        ServiceMap[Service Map]
        Traces[Trace Details]
        Analytics[Analytics]
    end
    
    subgraph Insights["Insights"]
        Latency[Latency Analysis]
        Errors[Error Analysis]
        Throttle[Throttle Analysis]
    end
    
    APIGW --> Lambda1 --> SQS --> Lambda2 --> DynamoDB
    Lambda1 --> S3
    
    APIGW -->|Generate Trace| Daemon
    Lambda1 -->|Segment| Daemon
    Lambda2 -->|Segment| Daemon
    
    Daemon --> ServiceMap
    Daemon --> Traces
    Traces --> Analytics --> Insights
```

### 4.2 X-Ray Advanced Tracing Implementation

```python
from aws_xray_sdk.core import xray_recorder, patch_all
from aws_xray_sdk.core.models import subsegment
import boto3
import time

# Auto-patch AWS SDK
patch_all()

class TracedService:
    """
    X-Ray Tracing Service - Business Dimension Tracing
    Connect technical traces with business context
    """
    
    def __init__(self, service_name='PaymentService'):
        xray_recorder.configure(
            service=service_name,
            context_missing='LOG_ERROR',
            plugins=['EC2Plugin', 'ECSPlugin', 'ElasticBeanstalkPlugin']
        )
        self.dynamodb = boto3.resource('dynamodb')
    
    @xray_recorder.capture('process_order')
    def process_order(self, order_data):
        """Process order - Complete business tracing"""
        
        # Add business annotations
        xray_recorder.put_annotation('order_id', order_data['order_id'])
        xray_recorder.put_annotation('customer_tier', order_data.get('tier', 'standard'))
        xray_recorder.put_annotation('order_value', order_data['amount'])
        
        # Add metadata (not indexed, but queryable)
        xray_recorder.put_metadata('order_details', {
            'items': order_data.get('items', []),
            'promo_code': order_data.get('promo_code'),
            'user_agent': order_data.get('user_agent')
        })
        
        try:
            # Validate inventory
            with xray_recorder.capture_subsegment('check_inventory') as subsegment:
                subsegment.put_annotation('product_id', order_data['product_id'])
                inventory_result = self.check_inventory(
                    order_data['product_id'],
                    order_data['quantity']
                )
                subsegment.put_metadata('inventory_result', inventory_result)
            
            # Process payment
            with xray_recorder.capture_subsegment('process_payment') as subsegment:
                subsegment.put_annotation('payment_method', order_data['payment_method'])
                payment_result = self.process_payment(order_data)
                subsegment.put_annotation('payment_status', payment_result['status'])
            
            # Update order status
            with xray_recorder.capture_subsegment('update_order') as subsegment:
                self.update_order_status(order_data['order_id'], 'completed')
            
            return {'success': True, 'order_id': order_data['order_id']}
            
        except Exception as e:
            # Record error trace
            xray_recorder.put_annotation('error_type', type(e).__name__)
            xray_recorder.put_annotation('error_message', str(e))
            raise
    
    @xray_recorder.capture('check_inventory')
    def check_inventory(self, product_id, quantity):
        """Check inventory - Subsegment tracing"""
        table = self.dynamodb.Table('inventory')
        
        response = table.get_item(Key={'product_id': product_id})
        item = response.get('Item', {})
        
        available = item.get('quantity', 0)
        
        # Add tracing information
        xray_recorder.put_annotation('available_stock', available)
        xray_recorder.put_annotation('requested_quantity', quantity)
        
        if available < quantity:
            raise Exception(f'Insufficient inventory: {available} < {quantity}')
        
        return {'available': available, 'sufficient': True}
    
    @xray_recorder.capture('process_payment')
    def process_payment(self, order_data):
        """Process payment - External service tracing"""
        
        # Simulate payment gateway call
        start_time = time.time()
        
        # Actual payment gateway call
        # response = requests.post(payment_gateway_url, ...)
        
        latency = (time.time() - start_time) * 1000
        
        # Record payment gateway performance
        xray_recorder.put_metadata('payment_latency_ms', latency)
        
        return {'status': 'success', 'transaction_id': 'txn_12345'}
    
    def get_service_map_insights(self):
        """Get service map insights from X-Ray"""
        xray = boto3.client('xray')
        
        # Get service statistics
        response = xray.get_service_graph(
            StartTime=datetime.utcnow() - timedelta(hours=1),
            EndTime=datetime.utcnow()
        )
        
        insights = []
        for service in response['Services']:
            if service['SummaryStatistics']['ErrorStatistics']['TotalCount'] > 0:
                insights.append({
                    'service_name': service['Name'],
                    'error_count': service['SummaryStatistics']['ErrorStatistics']['TotalCount'],
                    'fault_count': service['SummaryStatistics']['FaultStatistics']['TotalCount'],
                    'avg_latency': service['SummaryStatistics']['TotalResponseTime'] / 
                                  service['SummaryStatistics']['TotalCount']
                })
        
        return insights

# Lambda handler
@xray_recorder.capture('lambda_handler')
def lambda_handler(event, context):
    service = TracedService()
    
    # Add Lambda context annotations
    xray_recorder.put_annotation('lambda_request_id', context.aws_request_id)
    xray_recorder.put_annotation('lambda_memory', context.memory_limit_in_mb)
    
    result = service.process_order(event)
    
    return result
```

### 4.3 Business Dimension Trace Analysis

```python
# X-Ray Query Analysis - Aggregation by Business Dimension
import boto3
from datetime import datetime, timedelta

xray = boto3.client('xray')

def analyze_traces_by_business_dimension():
    """
    Analyze trace data by business dimension
    - Analyze latency by customer tier
    - Analyze error rate by order value
    """
    
    # Get traces
    response = xray.get_trace_summaries(
        StartTime=datetime.utcnow() - timedelta(hours=24),
        EndTime=datetime.utcnow(),
        FilterExpression='annotation.customer_tier = "premium"'
    )
    
    traces = response['TraceSummaries']
    
    analysis = {
        'premium_customers': {
            'count': len(traces),
            'avg_latency': sum(t['Duration'] for t in traces) / len(traces) if traces else 0,
            'error_rate': sum(1 for t in traces if t['ErrorRootCauses']) / len(traces) * 100 if traces else 0
        }
    }
    
    return analysis

def identify_latency_bottlenecks():
    """Identify latency bottlenecks"""
    
    # Query high-latency traces
    response = xray.get_trace_summaries(
        StartTime=datetime.utcnow() - timedelta(hours=1),
        EndTime=datetime.utcnow(),
        FilterExpression='duration > 2'
    )
    
    bottlenecks = {}
    for trace in response['TraceSummaries']:
        for cause in trace.get('ResponseTimeRootCauses', []):
            service = cause['Services'][0]['Name']
            bottlenecks[service] = bottlenecks.get(service, 0) + 1
    
    return sorted(bottlenecks.items(), key=lambda x: x[1], reverse=True)
```

---

(Continuing with remaining chapters... Due to content length, I will continue completing the remaining core chapters)

## 5. Business Metrics Monitoring and Custom Metrics

### 5.1 Business Metrics Design Framework

```mermaid
flowchart TB
    subgraph BusinessLayer["Business Layer Metrics"]
        Revenue[Revenue Metrics]
        Conversion[Conversion Rate]
        Churn[Churn Rate]
        LTV[Customer Lifetime Value]
    end
    
    subgraph ProductLayer["Product Layer Metrics"]
        FeatureUsage[Feature Usage]
        UserEngagement[User Engagement]
        AARRR[AARRR Funnel]
    end
    
    subgraph TechnicalLayer["Technical Layer Metrics"]
        Availability[Availability]
        Latency[Latency]
        ErrorRate[Error Rate]
        Saturation[Saturation]
    end
    
    subgraph EconomicLayer["Economic Metrics"]
        CostPerRequest[Cost Per Request]
        CostPerUser[Cost Per User]
        ROI[ROI]
    end
    
    TechnicalLayer --> ProductLayer --> BusinessLayer
    EconomicLayer -.-> BusinessLayer
```

### 5.2 Multi-Dimensional Business Metrics Implementation

```python
import boto3
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

class CustomerTier(Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

class BusinessEvent(Enum):
    SIGNUP = "user_signup"
    UPGRADE = "subscription_upgrade"
    PURCHASE = "purchase_completed"
    REFUND = "refund_processed"
    FEATURE_USED = "feature_used"
    SUPPORT_TICKET = "support_ticket_created"

@dataclass
class BusinessContext:
    """Business context data"""
    customer_tier: CustomerTier
    region: str
    acquisition_channel: str
    feature_name: Optional[str] = None
    revenue_value: Optional[float] = None
    
class BusinessMetricsCollector:
    """
    Business Metrics Collector
    Implements multi-dimensional tracking of business metrics
    """
    
    def __init__(self, namespace='Business/Application'):
        self.cloudwatch = boto3.client('cloudwatch')
        self.namespace = namespace
        
    def record_business_event(
        self,
        event: BusinessEvent,
        context: BusinessContext,
        metadata: Optional[Dict] = None
    ):
        """Record business events"""
        
        dimensions = [
            {'Name': 'EventType', 'Value': event.value},
            {'Name': 'CustomerTier', 'Value': context.customer_tier.value},
            {'Name': 'Region', 'Value': context.region},
            {'Name': 'Channel', 'Value': context.acquisition_channel}
        ]
        
        metric_data = [{
            'MetricName': 'BusinessEventCount',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': dimensions,
            'Timestamp': datetime.utcnow()
        }]
        
        # Record revenue metric if included
        if context.revenue_value:
            metric_data.append({
                'MetricName': 'Revenue',
                'Value': context.revenue_value,
                'Unit': 'None',
                'Dimensions': [
                    {'Name': 'EventType', 'Value': event.value},
                    {'Name': 'CustomerTier', 'Value': context.customer_tier.value}
                ],
                'Timestamp': datetime.utcnow()
            })
        
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=metric_data
        )
    
    def record_feature_usage(
        self,
        feature_name: str,
        user_id: str,
        context: BusinessContext,
        usage_duration_ms: Optional[int] = None
    ):
        """Record feature usage"""
        
        dimensions = [
            {'Name': 'FeatureName', 'Value': feature_name},
            {'Name': 'CustomerTier', 'Value': context.customer_tier.value}
        ]
        
        metric_data = [{
            'MetricName': 'FeatureUsage',
            'Value': 1,
            'Unit': 'Count',
            'Dimensions': dimensions
        }]
        
        if usage_duration_ms:
            metric_data.append({
                'MetricName': 'FeatureUsageDuration',
                'Value': usage_duration_ms,
                'Unit': 'Milliseconds',
                'Dimensions': dimensions
            })
        
        self.cloudwatch.put_metric_data(
            Namespace=self.namespace,
            MetricData=metric_data
        )
    
    def calculate_unit_economics(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """
        Calculate unit economics metrics
        - CAC (Customer Acquisition Cost)
        - ARPU (Average Revenue Per User)
        - LTV/CAC Ratio
        """
        
        # Get active users
        active_users = self.cloudwatch.get_metric_statistics(
            Namespace=self.namespace,
            MetricName='ActiveUsers',
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Sum']
        )
        
        # Get total revenue
        revenue = self.cloudwatch.get_metric_statistics(
            Namespace=self.namespace,
            MetricName='Revenue',
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Sum']
        )
        
        total_users = sum(dp['Sum'] for dp in active_users['Datapoints'])
        total_revenue = sum(dp['Sum'] for dp in revenue['Datapoints'])
        
        arpu = total_revenue / total_users if total_users > 0 else 0
        
        # Get infrastructure cost (from Cost Explorer API)
        # Simplified here
        infrastructure_cost = self._get_infrastructure_cost(start_time, end_time)
        cost_per_user = infrastructure_cost / total_users if total_users > 0 else 0
        
        return {
            'arpu': arpu,
            'cost_per_user': cost_per_user,
            'unit_margin': arpu - cost_per_user,
            'total_users': total_users,
            'total_revenue': total_revenue,
            'infrastructure_cost': infrastructure_cost
        }
    
    def _get_infrastructure_cost(self, start_time: datetime, end_time: datetime) -> float:
        """Get infrastructure cost (simplified implementation)"""
        # Actual implementation should call Cost Explorer API
        return 10000.0  # Example value

# Usage example
def process_payment_event(payment_data: dict):
    """Process payment event and record business metrics"""
    
    collector = BusinessMetricsCollector()
    
    context = BusinessContext(
        customer_tier=CustomerTier(payment_data.get('tier', 'basic')),
        region=payment_data['region'],
        acquisition_channel=payment_data.get('channel', 'organic'),
        revenue_value=payment_data['amount']
    )
    
    collector.record_business_event(
        event=BusinessEvent.PURCHASE,
        context=context,
        metadata={
            'payment_method': payment_data['payment_method'],
            'promo_code': payment_data.get('promo_code'),
            'device_type': payment_data.get('device_type')
        }
    )
```

### 5.3 SLO/SLI Monitoring Implementation

```python
from dataclasses import dataclass
from typing import List, Tuple
import boto3

@dataclass
class SLODefinition:
    """SLO Definition"""
    name: str
    target: float  # Target percentage, e.g., 99.9
    window_days: int  # Evaluation window (days)
    burn_rate_alerts: List[Tuple[float, float]]  # [(multiplier, window_hours)]

class SLOMonitor:
    """
    SLO Monitoring and Error Budget Management
    """
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
    
    def calculate_error_budget(
        self,
        slo: SLODefinition,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """Calculate error budget status"""
        
        # Get total requests
        total_requests = self.cloudwatch.get_metric_statistics(
            Namespace='Application/SLI',
            MetricName='TotalRequests',
            Dimensions=[{'Name': 'SLO', 'Value': slo.name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        # Get error requests
        error_requests = self.cloudwatch.get_metric_statistics(
            Namespace='Application/SLI',
            MetricName='ErrorRequests',
            Dimensions=[{'Name': 'SLO', 'Value': slo.name}],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        total = sum(dp['Sum'] for dp in total_requests['Datapoints'])
        errors = sum(dp['Sum'] for dp in error_requests['Datapoints'])
        
        # Calculate error budget
        error_budget_total = total * (100 - slo.target) / 100
        error_budget_remaining = error_budget_total - errors
        error_budget_percentage = (error_budget_remaining / error_budget_total * 100) if error_budget_total > 0 else 0
        
        return {
            'slo_name': slo.name,
            'target': slo.target,
            'total_requests': total,
            'error_requests': errors,
            'current_availability': ((total - errors) / total * 100) if total > 0 else 100,
            'error_budget_total': error_budget_total,
            'error_budget_remaining': error_budget_remaining,
            'error_budget_percentage': error_budget_percentage,
            'status': 'HEALTHY' if error_budget_percentage > 25 else 'WARNING' if error_budget_percentage > 0 else 'EXHAUSTED'
        }
    
    def check_burn_rate(self, slo: SLODefinition, error_budget_status: Dict) -> List[Dict]:
        """Check error budget burn rate"""
        
        alerts = []
        
        for multiplier, window_hours in slo.burn_rate_alerts:
            # Calculate consumption within window
            window_start = datetime.utcnow() - timedelta(hours=window_hours)
            
            window_status = self.calculate_error_budget(
                slo,
                window_start,
                datetime.utcnow()
            )
            
            # Calculate burn rate
            expected_consumption = (window_hours / (slo.window_days * 24)) * 100
            actual_consumption = 100 - window_status['error_budget_percentage']
            
            burn_rate = actual_consumption / expected_consumption if expected_consumption > 0 else 0
            
            if burn_rate > multiplier:
                alerts.append({
                    'severity': 'CRITICAL' if multiplier >= 14.4 else 'WARNING',
                    'burn_rate': burn_rate,
                    'multiplier': multiplier,
                    'window_hours': window_hours,
                    'message': f'Error budget burn rate {burn_rate:.1f}x exceeds {multiplier}x threshold'
                })
        
        return alerts

# SLO definition example
api_availability_slo = SLODefinition(
    name='api_availability',
    target=99.9,  # 99.9% availability
    window_days=30,
    burn_rate_alerts=[
        (14.4, 1),   # 14.4x+ in 1 hour - Critical
        (6, 6),      # 6x+ in 6 hours - Warning
        (2, 72)      # 2x+ in 3 days - Attention
    ]
)
```

---

## 6. Log Management and Analysis

### 6.1 Log Architecture Design

```mermaid
flowchart TB
    subgraph Sources["Log Sources"]
        App[Applications]
        VPC[VPC Flow Logs]
        ALB[ALB Access Logs]
        RDS[RDS Logs]
        Lambda[Lambda Logs]
    end
    
    subgraph Ingestion["Ingestion Layer"]
        CWLogs[CloudWatch Logs]
        Kinesis[Kinesis Firehose]
        S3Raw[S3 Raw Storage]
    end
    
    subgraph Processing["Processing Layer"]
        LambdaProc[Lambda Transformation]
        Glue[Glue ETL]
        OpenSearch[OpenSearch]
    end
    
    subgraph Analysis["Analysis Layer"]
        Insights[CloudWatch Insights]
        Athena[Athena Queries]
        Dashboard[Grafana]
    end
    
    subgraph Archive["Archive Layer"]
        S3Archive[S3 Archive]
        Glacier[S3 Glacier]
    end
    
    App --> CWLogs
    VPC --> CWLogs
    ALB --> S3Raw
    RDS --> CWLogs
    Lambda --> CWLogs
    
    CWLogs --> Kinesis
    Kinesis --> LambdaProc
    LambdaProc --> OpenSearch
    LambdaProc --> S3Archive
    
    S3Raw --> Glue
    Glue --> Athena
    
    OpenSearch --> Dashboard
    CWLogs --> Insights
```

### 6.2 Structured Logging and Correlation Tracing

```python
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from contextvars import ContextVar

# Request context
request_context: ContextVar[Dict[str, Any]] = ContextVar('request_context', default={})

class StructuredLogger:
    """
    Structured Logger
    - Automatically injects trace context
    - Supports dynamic log level adjustment
    - Correlates with business metrics
    """
    
    def __init__(self, service_name: str, log_level: int = logging.INFO):
        self.service_name = service_name
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(log_level)
        
        # Configure JSON format handler
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)
    
    def _build_log_record(
        self,
        level: str,
        message: str,
        extra: Optional[Dict] = None
    ) -> Dict:
        """Build structured log record"""
        
        context = request_context.get()
        
        record = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': level,
            'service': self.service_name,
            'message': message,
            'trace_id': context.get('trace_id', str(uuid.uuid4())),
            'span_id': context.get('span_id'),
            'user_id': context.get('user_id'),
            'request_path': context.get('request_path'),
            'environment': context.get('environment', 'production')
        }
        
        if extra:
            record['extra'] = extra
        
        return record
    
    def info(self, message: str, extra: Optional[Dict] = None):
        self.logger.info(self._build_log_record('INFO', message, extra))
    
    def warning(self, message: str, extra: Optional[Dict] = None):
        self.logger.warning(self._build_log_record('WARNING', message, extra))
    
    def error(self, message: str, extra: Optional[Dict] = None):
        self.logger.error(self._build_log_record('ERROR', message, extra))
    
    def debug(self, message: str, extra: Optional[Dict] = None):
        self.logger.debug(self._build_log_record('DEBUG', message, extra))
    
    def metric(self, metric_name: str, value: float, unit: str = 'Count', dimensions: Optional[Dict] = None):
        """Record metric log (EMF format)"""
        
        emf_record = {
            '_aws': {
                'Timestamp': int(datetime.utcnow().timestamp() * 1000),
                'CloudWatchMetrics': [
                    {
                        'Namespace': f'{self.service_name}/Metrics',
                        'Dimensions': [list(dimensions.keys())] if dimensions else [[]],
                        'Metrics': [{'Name': metric_name, 'Unit': unit}]
                    }
                ]
            },
            metric_name: value
        }
        
        if dimensions:
            emf_record.update(dimensions)
        
        self.logger.info(emf_record)

class JsonFormatter(logging.Formatter):
    """JSON Log Formatter"""
    
    def format(self, record):
        if isinstance(record.msg, dict):
            return json.dumps(record.msg, ensure_ascii=False)
        return super().format(record)

# Context manager
class RequestContext:
    """Request Context Manager"""
    
    def __init__(self, trace_id: Optional[str] = None, user_id: Optional[str] = None):
        self.context = {
            'trace_id': trace_id or str(uuid.uuid4()),
            'span_id': str(uuid.uuid4())[:8],
            'user_id': user_id,
            'start_time': datetime.utcnow()
        }
        self.token = None
    
    def __enter__(self):
        self.token = request_context.set(self.context)
        return self.context
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        request_context.reset(self.token)

# Usage example
logger = StructuredLogger('PaymentService')

def process_payment(request_data: dict):
    with RequestContext(user_id=request_data.get('user_id')):
        logger.info('Payment processing started', extra={
            'order_id': request_data['order_id'],
            'amount': request_data['amount']
        })
        
        try:
            # Process payment logic
            result = charge_customer(request_data)
            
            logger.metric(
                metric_name='PaymentSuccess',
                value=1,
                dimensions={
                    'payment_method': request_data['payment_method'],
                    'customer_tier': request_data.get('tier', 'standard')
                }
            )
            
            return result
            
        except Exception as e:
            logger.error('Payment failed', extra={
                'order_id': request_data['order_id'],
                'error': str(e),
                'error_type': type(e).__name__
            })
            raise
```

---

(Continuing with Chapters 7-13...)


## 7. Alerting Strategy and Incident Response

### 7.1 Intelligent Alerting Architecture

```mermaid
flowchart TB
    subgraph Detection["Detection Layer"]
        CWAlarms[CloudWatch Alarms]
        Anomaly[Anomaly Detection]
        Insights[CloudWatch Insights]
        XRay[X-Ray Insights]
    end
    
    subgraph Routing["Routing Layer"]
        SNS[SNS]
        EventBridge[EventBridge]
        PagerDuty[PagerDuty]
    end
    
    subgraph Processing["Processing Layer"]
        LambdaProc[Lambda Processing]
        StepFunc[Step Functions]
        AutoRemediation[Auto Remediation]
    end
    
    subgraph Notification["Notification Layer"]
        Slack[Slack]
        Email[Email]
        SMS[SMS]
        Phone[Phone]
    end
    
    Detection --> SNS
    Detection --> EventBridge
    SNS --> LambdaProc
    EventBridge --> StepFunc
    StepFunc --> AutoRemediation
    SNS --> PagerDuty
    PagerDuty --> Notification
```

### 7.2 Alerting Strategy Design

```python
import boto3
from dataclasses import dataclass
from typing import List, Dict, Optional
from enum import Enum

class AlertSeverity(Enum):
    P1 = "critical"      # Immediate response (< 5 minutes)
    P2 = "high"          # Fast response (< 30 minutes)
    P3 = "medium"        # Business hours response (< 4 hours)
    P4 = "low"           # Next business day response

class AlertChannel(Enum):
    PAGERDUTY = "pagerduty"
    SLACK = "slack"
    EMAIL = "email"
    SMS = "sms"

@dataclass
class AlertRule:
    """Alert rule definition"""
    name: str
    metric_name: str
    namespace: str
    threshold: float
    comparison_operator: str  # GreaterThanThreshold, LessThanThreshold, etc.
    evaluation_periods: int
    period: int  # seconds
    severity: AlertSeverity
    channels: List[AlertChannel]
    auto_remediate: bool = False
    runbook_url: Optional[str] = None

class AlertManager:
    """
    Alert Manager
    - Severity-based routing
    - Alert suppression and aggregation
    - Auto-remediation integration
    """
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
    
    def create_alarm(self, rule: AlertRule, dimensions: List[Dict]):
        """Create CloudWatch alarm"""
        
        alarm_name = f"{rule.severity.value}-{rule.name}"
        
        # Select SNS topic based on severity
        topic_arn = self._get_topic_for_severity(rule.severity)
        
        alarm_actions = [topic_arn]
        
        # Auto-remediation
        if rule.auto_remediate:
            remediation_lambda = self._get_remediation_lambda(rule.name)
            alarm_actions.append(remediation_lambda)
        
        self.cloudwatch.put_metric_alarm(
            AlarmName=alarm_name,
            AlarmDescription=self._build_description(rule),
            MetricName=rule.metric_name,
            Namespace=rule.namespace,
            Dimensions=dimensions,
            Statistic='Average',
            Period=rule.period,
            EvaluationPeriods=rule.evaluation_periods,
            Threshold=rule.threshold,
            ComparisonOperator=rule.comparison_operator,
            AlarmActions=alarm_actions,
            OKActions=[topic_arn],
            Tags=[
                {'Key': 'Severity', 'Value': rule.severity.value},
                {'Key': 'Runbook', 'Value': rule.runbook_url or ''},
                {'Key': 'AutoRemediate', 'Value': str(rule.auto_remediate)}
            ]
        )
        
        return alarm_name
    
    def _get_topic_for_severity(self, severity: AlertSeverity) -> str:
        """Get SNS topic for severity level"""
        topics = {
            AlertSeverity.P1: 'arn:aws:sns:us-east-1:123456789:alerts-p1',
            AlertSeverity.P2: 'arn:aws:sns:us-east-1:123456789:alerts-p2',
            AlertSeverity.P3: 'arn:aws:sns:us-east-1:123456789:alerts-p3',
            AlertSeverity.P4: 'arn:aws:sns:us-east-1:123456789:alerts-p4'
        }
        return topics[severity]
    
    def _build_description(self, rule: AlertRule) -> str:
        """Build alert description"""
        return json.dumps({
            'rule_name': rule.name,
            'severity': rule.severity.value,
            'runbook': rule.runbook_url,
            'channels': [c.value for c in rule.channels],
            'auto_remediate': rule.auto_remediate
        })
    
    def create_composite_alarm(self, name: str, rules: List[AlertRule]):
        """Create composite alarm (multi-condition trigger)"""
        
        # Example: High CPU + High Memory = Capacity alert
        expression = 'ALARM(cpu-high) AND ALARM(memory-high)'
        
        self.cloudwatch.put_composite_alarm(
            AlarmName=name,
            AlarmRule=expression,
            AlarmActions=[self._get_topic_for_severity(AlertSeverity.P2)],
            AlarmDescription='Composite alarm: Insufficient capacity'
        )
    
    def create_anomaly_detection_alarm(
        self,
        metric_name: str,
        namespace: str,
        dimensions: List[Dict],
        threshold: float = 2.0  # Standard deviation multiplier
    ):
        """Create anomaly detection alarm"""
        
        # Create anomaly detection model
        anomaly_detector = self.cloudwatch.put_anomaly_detector(
            Namespace=namespace,
            MetricName=metric_name,
            Dimensions=dimensions,
            Stat='Average'
        )
        
        # Alarm based on anomaly detection
        self.cloudwatch.put_metric_alarm(
            AlarmName=f'anomaly-{metric_name}',
            MetricName=metric_name,
            Namespace=namespace,
            Dimensions=dimensions,
            Statistic='Average',
            Period=300,
            EvaluationPeriods=2,
            Threshold=threshold,
            ComparisonOperator='GreaterThanUpperThreshold',
            TreatMissingData='notBreaching'
        )

# Alert rule definition examples
ALERT_RULES = [
    AlertRule(
        name='api-error-rate',
        metric_name='ErrorRate',
        namespace='Application/API',
        threshold=1.0,  # 1% error rate
        comparison_operator='GreaterThanThreshold',
        evaluation_periods=2,
        period=60,
        severity=AlertSeverity.P1,
        channels=[AlertChannel.PAGERDUTY, AlertChannel.SLACK],
        auto_remediate=True,
        runbook_url='https://wiki.internal/runbooks/api-error-rate'
    ),
    AlertRule(
        name='api-latency-p99',
        metric_name='Latency',
        namespace='Application/API',
        threshold=1000,  # 1000ms
        comparison_operator='GreaterThanThreshold',
        evaluation_periods=3,
        period=60,
        severity=AlertSeverity.P2,
        channels=[AlertChannel.SLACK],
        auto_remediate=False
    ),
    AlertRule(
        name='cost-anomaly',
        metric_name='EstimatedCharges',
        namespace='AWS/Billing',
        threshold=2.0,  # 2x standard deviation
        comparison_operator='GreaterThanThreshold',
        evaluation_periods=1,
        period=86400,
        severity=AlertSeverity.P3,
        channels=[AlertChannel.EMAIL],
        auto_remediate=False
    )
]
```

### 7.3 Auto-Remediation Implementation

```python
import boto3
import json
from typing import Dict, List

class AutoRemediation:
    """
    Auto-Remediation System
    - Automated handling of common issues
    - Remediation operation audit
    - Human escalation mechanism
    """
    
    def __init__(self):
        self.ec2 = boto3.client('ec2')
        self.rds = boto3.client('rds')
        self.lambda_client = boto3.client('lambda')
        self.sns = boto3.client('sns')
    
    def handle_high_cpu(self, instance_id: str, context: Dict) -> Dict:
        """Handle high CPU alert"""
        
        actions_taken = []
        
        # 1. Check if expected load
        if self._is_expected_load(instance_id):
            return {
                'status': 'skipped',
                'reason': 'Expected load pattern',
                'actions': actions_taken
            }
        
        # 2. Try restarting application service (if applicable)
        try:
            self._restart_application(instance_id)
            actions_taken.append('restart_application')
        except Exception as e:
            actions_taken.append(f'restart_failed: {str(e)}')
        
        # 3. If still high CPU, try scaling up
        if self._check_cpu_still_high(instance_id):
            try:
                self._scale_up_instance(instance_id)
                actions_taken.append('scale_up_instance')
            except Exception as e:
                actions_taken.append(f'scale_up_failed: {str(e)}')
                # Notify human intervention
                self._escalate_to_human(instance_id, context)
        
        return {
            'status': 'completed',
            'actions': actions_taken,
            'instance_id': instance_id
        }
    
    def handle_disk_full(self, instance_id: str, context: Dict) -> Dict:
        """Handle disk full alert"""
        
        actions_taken = []
        
        # 1. Clean log files
        try:
            self._clean_log_files(instance_id)
            actions_taken.append('clean_logs')
        except Exception as e:
            actions_taken.append(f'clean_logs_failed: {str(e)}')
        
        # 2. Clean temp files
        try:
            self._clean_temp_files(instance_id)
            actions_taken.append('clean_temp')
        except Exception as e:
            actions_taken.append(f'clean_temp_failed: {str(e)}')
        
        # 3. If still full, extend disk
        if self._check_disk_still_full(instance_id):
            try:
                self._extend_volume(instance_id)
                actions_taken.append('extend_volume')
            except Exception as e:
                actions_taken.append(f'extend_failed: {str(e)}')
                self._escalate_to_human(instance_id, context)
        
        return {
            'status': 'completed',
            'actions': actions_taken
        }
    
    def handle_lambda_errors(self, function_name: str, context: Dict) -> Dict:
        """Handle Lambda errors"""
        
        actions_taken = []
        
        # 1. Check if code error (requires human fix)
        error_pattern = self._analyze_error_pattern(function_name)
        
        if error_pattern['type'] == 'code_error':
            self._escalate_to_human(function_name, context, priority='HIGH')
            return {
                'status': 'escalated',
                'reason': 'Code error detected',
                'error_pattern': error_pattern
            }
        
        # 2. If resource limit, increase memory/timeout
        if error_pattern['type'] == 'timeout':
            self._increase_lambda_timeout(function_name)
            actions_taken.append('increased_timeout')
        
        if error_pattern['type'] == 'memory_exceeded':
            self._increase_lambda_memory(function_name)
            actions_taken.append('increased_memory')
        
        # 3. If downstream service issue, notify relevant team
        if error_pattern['type'] == 'dependency_error':
            self._notify_dependency_team(error_pattern['dependency'])
            actions_taken.append('notified_dependency_team')
        
        return {
            'status': 'completed',
            'actions': actions_taken
        }
    
    def _is_expected_load(self, instance_id: str) -> bool:
        """Check if expected load"""
        # Implementation: Check if current time is within expected peak window
        return False
    
    def _escalate_to_human(self, resource_id: str, context: Dict, priority: str = 'MEDIUM'):
        """Escalate to human"""
        message = {
            'default': json.dumps({
                'resource_id': resource_id,
                'alarm_context': context,
                'auto_remediation_status': 'escalated',
                'priority': priority
            }),
            'email': f"""
            Auto-Remediation Escalation Notice
            
            Resource: {resource_id}
            Alarm: {context.get('AlarmName', 'Unknown')}
            Auto-remediation could not handle this issue, human intervention required.
            
            Please check CloudWatch console for details.
            """
        }
        
        self.sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789:escalation',
            Message=json.dumps(message),
            MessageStructure='json'
        )
    
    # Other helper methods...
    def _restart_application(self, instance_id: str):
        pass
    
    def _scale_up_instance(self, instance_id: str):
        pass
    
    def _check_cpu_still_high(self, instance_id: str) -> bool:
        return False
    
    def _clean_log_files(self, instance_id: str):
        pass
    
    def _clean_temp_files(self, instance_id: str):
        pass
    
    def _check_disk_still_full(self, instance_id: str) -> bool:
        return False
    
    def _extend_volume(self, instance_id: str):
        pass
    
    def _analyze_error_pattern(self, function_name: str) -> Dict:
        return {'type': 'unknown'}
    
    def _increase_lambda_timeout(self, function_name: str):
        pass
    
    def _increase_lambda_memory(self, function_name: str):
        pass
    
    def _notify_dependency_team(self, dependency: str):
        pass

# Lambda handler
def lambda_handler(event, context):
    """Handle alert events"""
    
    remediation = AutoRemediation()
    
    alarm_name = event['alarmName']
    alarm_description = json.loads(event['alarmDescription'])
    resource_id = event['trigger']['dimensions'][0]['value']
    
    # Route by alert type
    if 'high-cpu' in alarm_name:
        result = remediation.handle_high_cpu(resource_id, event)
    elif 'disk-full' in alarm_name:
        result = remediation.handle_disk_full(resource_id, event)
    elif 'lambda-error' in alarm_name:
        result = remediation.handle_lambda_errors(resource_id, event)
    else:
        result = {'status': 'unknown_alarm_type'}
    
    return result
```

---

## 8. APM Application Performance Monitoring

### 8.1 APM Architecture Design

```mermaid
flowchart TB
    subgraph Instrumentation["Instrumentation Layer"]
        OpenTelemetry[OpenTelemetry SDK]
        XRaySDK[X-Ray SDK]
        CWAgent[CloudWatch Agent]
    end
    
    subgraph Collection["Collection Layer"]
        OTelCollector[OpenTelemetry Collector]
        XRayDaemon[X-Ray Daemon]
        CWLogsAgent[CloudWatch Logs Agent]
    end
    
    subgraph Storage["Storage Layer"]
        XRayService[X-Ray Service]
        CloudWatch[CloudWatch]
        AMP[Amazon Managed Prometheus]
    end
    
    subgraph Visualization["Visualization Layer"]
        CloudWatchInsights[CloudWatch Insights]
        Grafana[Grafana]
        XRayConsole[X-Ray Console]
    end
    
    Instrumentation --> Collection --> Storage --> Visualization
```

### 8.2 OpenTelemetry Integration

```python
from opentelemetry import trace, metrics
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.instrumentation.boto3 import Boto3Instrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
import time

# Resource configuration
resource = Resource.create({
    SERVICE_NAME: "payment-service",
    SERVICE_VERSION: "1.0.0",
    "deployment.environment": "production",
    "host.name": "payment-pod-123",
    "service.namespace": "ecommerce"
})

# Configure Tracer Provider
trace.set_tracer_provider(TracerProvider(resource=resource))

tracer = trace.get_tracer(__name__)

# Configure OTLP Exporter (send to ADOT Collector)
otlp_exporter = OTLPSpanExporter(
    endpoint="otel-collector.monitoring.svc.cluster.local:4317",
    insecure=True
)

span_processor = BatchSpanProcessor(
    otlp_exporter,
    max_queue_size=2048,
    max_export_batch_size=512,
    schedule_delay_millis=5000
)

trace.get_tracer_provider().add_span_processor(span_processor)

class PaymentService:
    """
    Payment Service with OpenTelemetry Instrumentation
    """
    
    def __init__(self):
        self.tracer = trace.get_tracer(__name__)
    
    @tracer.start_as_current_span("process_payment")
    def process_payment(self, payment_request: dict) -> dict:
        """Process payment request"""
        
        span = trace.get_current_span()
        
        # Add business attributes
        span.set_attribute("payment.order_id", payment_request["order_id"])
        span.set_attribute("payment.amount", payment_request["amount"])
        span.set_attribute("payment.currency", payment_request["currency"])
        span.set_attribute("payment.method", payment_request["method"])
        span.set_attribute("customer.tier", payment_request.get("customer_tier", "standard"))
        
        try:
            # Validate payment
            with self.tracer.start_as_current_span("validate_payment") as validation_span:
                validation_span.set_attribute("validation.type", "fraud_check")
                is_valid = self._validate_payment(payment_request)
                validation_span.set_attribute("validation.result", is_valid)
            
            if not is_valid:
                span.set_attribute("payment.status", "rejected")
                span.set_status(trace.Status(trace.StatusCode.ERROR, "Payment validation failed"))
                return {"status": "rejected", "reason": "validation_failed"}
            
            # Call payment gateway
            with self.tracer.start_as_current_span("call_payment_gateway") as gateway_span:
                gateway_span.set_attribute("gateway.provider", "stripe")
                start_time = time.time()
                
                result = self._call_payment_gateway(payment_request)
                
                latency = (time.time() - start_time) * 1000
                gateway_span.set_attribute("gateway.latency_ms", latency)
                gateway_span.set_attribute("gateway.success", result["success"])
            
            # Record order
            with self.tracer.start_as_current_span("record_order"):
                self._save_order(payment_request, result)
            
            span.set_attribute("payment.status", "completed")
            span.set_attribute("payment.transaction_id", result["transaction_id"])
            
            return {"status": "success", "transaction_id": result["transaction_id"]}
            
        except Exception as e:
            span.set_attribute("payment.status", "failed")
            span.set_attribute("error.type", type(e).__name__)
            span.set_attribute("error.message", str(e))
            span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
            raise
    
    def _validate_payment(self, request: dict) -> bool:
        """Validate payment"""
        time.sleep(0.01)  # Simulate processing
        return True
    
    def _call_payment_gateway(self, request: dict) -> dict:
        """Call payment gateway"""
        time.sleep(0.1)  # Simulate external call
        return {"success": True, "transaction_id": "txn_12345"}
    
    def _save_order(self, request: dict, result: dict):
        """Save order"""
        time.sleep(0.005)

# Flask application integration
from flask import Flask, request

app = Flask(__name__)

# Auto-instrumentation
FlaskInstrumentor().instrument_app(app)
Boto3Instrumentor().instrument()
RequestsInstrumentor().instrument()

payment_service = PaymentService()

@app.route('/api/payment', methods=['POST'])
def handle_payment():
    data = request.json
    
    # Current span automatically includes HTTP attributes
    current_span = trace.get_current_span()
    current_span.set_attribute("http.request.body_size", len(request.data))
    
    result = payment_service.process_payment(data)
    
    return result
```

---

## 9. Architecture Economic Analysis Framework

### 9.1 Monitoring Cost Attribution Model

```python
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime, timedelta
import boto3

@dataclass
class CostAttribution:
    """Cost attribution data"""
    service_name: str
    component: str
    environment: str
    team: str
    metric_cost: float
    log_cost: float
    trace_cost: float
    dashboard_cost: float
    total_cost: float

class MonitoringCostAnalyzer:
    """
    Monitoring Cost Analyzer
    - Attribute costs by service/team/environment
    - Identify cost optimization opportunities
    - Generate cost reports
    """
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.logs = boto3.client('logs')
        self.xray = boto3.client('xray')
        self.cost_explorer = boto3.client('ce')
    
    def analyze_cloudwatch_costs(self, start_date: datetime, end_date: datetime) -> Dict:
        """Analyze CloudWatch costs"""
        
        # Get CUR (Cost and Usage Report) data
        response = self.cost_explorer.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='MONTHLY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                {'Type': 'TAG', 'Key': 'Environment'}
            ],
            Filter={
                'Dimensions': {
                    'Key': 'SERVICE',
                    'Values': ['AmazonCloudWatch']
                }
            }
        )
        
        results = []
        for result in response['ResultsByTime']:
            for group in result['Groups']:
                keys = group['Keys']
                cost = float(group['Metrics']['UnblendedCost']['Amount'])
                
                results.append({
                    'service': keys[0],
                    'environment': keys[1] if len(keys) > 1 else 'untagged',
                    'cost': cost
                })
        
        return results
    
    def calculate_metric_cost(self, namespace: str, days: int = 30) -> Dict:
        """
        Calculate metric costs
        CloudWatch Metrics: $0.30 per metric per month
        Custom metrics: $0.30 per metric per month
        API calls: $0.01 per 1,000 requests
        """
        
        # Get number of metrics in namespace
        paginator = self.cloudwatch.get_paginator('list_metrics')
        metric_count = 0
        
        for page in paginator.paginate(Namespace=namespace):
            metric_count += len(page['Metrics'])
        
        # Estimate monthly cost
        monthly_cost = metric_count * 0.30
        
        # Estimate PutMetricData API cost
        # Assume each metric pushes once per minute
        api_calls_per_month = metric_count * 60 * 24 * 30  # minutes/month
        api_cost = (api_calls_per_month / 1000) * 0.01
        
        return {
            'namespace': namespace,
            'metric_count': metric_count,
            'metric_cost': monthly_cost,
            'api_cost': api_cost,
            'total_cost': monthly_cost + api_cost
        }
    
    def calculate_log_cost(self, log_group: str, days: int = 30) -> Dict:
        """
        Calculate log costs
        Ingestion: $0.50 per GB
        Storage: $0.03 per GB
        Insights analysis: $0.005 per GB scanned
        """
        
        # Get log group statistics
        response = self.logs.describe_log_groups(
            logGroupNamePrefix=log_group
        )
        
        total_stored_bytes = 0
        for group in response['logGroups']:
            total_stored_bytes += group.get('storedBytes', 0)
        
        # Get recent ingestion data
        start_time = datetime.utcnow() - timedelta(days=days)
        
        # Estimate ingestion via Insights query
        query = f"""
        fields @ingestionTime
        | stats count() as events
        | limit 1
        """
        
        # Simplified estimation: Assume 1KB per log entry
        estimated_daily_logs = 1000000  # Requires actual query
        daily_ingestion_gb = (estimated_daily_logs * 1024) / (1024**3)
        
        monthly_ingestion_cost = daily_ingestion_gb * 30 * 0.50
        monthly_storage_cost = (total_stored_bytes / (1024**3)) * 0.03
        
        return {
            'log_group': log_group,
            'stored_gb': total_stored_bytes / (1024**3),
            'estimated_daily_ingestion_gb': daily_ingestion_gb,
            'ingestion_cost': monthly_ingestion_cost,
            'storage_cost': monthly_storage_cost,
            'total_cost': monthly_ingestion_cost + monthly_storage_cost
        }
    
    def identify_cost_optimization_opportunities(self) -> List[Dict]:
        """Identify cost optimization opportunities"""
        
        opportunities = []
        
        # 1. Check for unused metrics
        unused_metrics = self._find_unused_metrics()
        if unused_metrics:
            savings = len(unused_metrics) * 0.30
            opportunities.append({
                'type': 'unused_metrics',
                'description': f'Found {len(unused_metrics)} unused custom metrics',
                'potential_savings': savings,
                'action': 'Delete unused metrics or stop pushing'
            })
        
        # 2. Check for high-volume logs
        high_volume_logs = self._find_high_volume_log_groups()
        for log_group in high_volume_logs:
            if log_group['daily_gb'] > 100:  # Over 100GB per day
                opportunities.append({
                    'type': 'high_volume_logs',
                    'log_group': log_group['name'],
                    'description': f'Log group {log_group["name"]} generates {log_group["daily_gb"]:.1f} GB logs per day',
                    'potential_savings': log_group['daily_gb'] * 30 * 0.50 * 0.5,  # Assume 50% reduction
                    'action': 'Adjust log levels, add filter rules, or reduce retention'
                })
        
        # 3. Check detailed X-Ray sampling
        xray_cost = self._analyze_xray_cost()
        if xray_cost['monthly_cost'] > 1000:
            opportunities.append({
                'type': 'xray_sampling',
                'description': f'X-Ray monthly cost ${xray_cost["monthly_cost"]:.2f}',
                'potential_savings': xray_cost['monthly_cost'] * 0.5,
                'action': 'Adjust sampling rate or enable tracing only for critical paths'
            })
        
        return opportunities
    
    def generate_cost_report(self, start_date: datetime, end_date: datetime) -> Dict:
        """Generate monitoring cost report"""
        
        # Analyze costs
        cloudwatch_costs = self.analyze_cloudwatch_costs(start_date, end_date)
        optimization_opportunities = self.identify_cost_optimization_opportunities()
        
        total_cost = sum(item['cost'] for item in cloudwatch_costs)
        potential_savings = sum(opp['potential_savings'] for opp in optimization_opportunities)
        
        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'total_monitoring_cost': total_cost,
            'cost_breakdown': cloudwatch_costs,
            'optimization_opportunities': optimization_opportunities,
            'potential_savings': potential_savings,
            'optimization_percentage': (potential_savings / total_cost * 100) if total_cost > 0 else 0
        }
    
    def _find_unused_metrics(self) -> List[str]:
        """Find unused metrics"""
        # Implementation: Query metrics with no data points in past 7 days
        return []
    
    def _find_high_volume_log_groups(self) -> List[Dict]:
        """Find high-volume log groups"""
        return []
    
    def _analyze_xray_cost(self) -> Dict:
        """Analyze X-Ray costs"""
        return {'monthly_cost': 0}

# Cost efficiency metrics calculator
class CostEfficiencyMetrics:
    """
    Monitoring Cost Efficiency Metrics
    """
    
    def calculate_cost_per_request(
        self,
        total_monitoring_cost: float,
        total_requests: int
    ) -> float:
        """Calculate cost per request"""
        return total_monitoring_cost / total_requests if total_requests > 0 else 0
    
    def calculate_cost_per_user(
        self,
        total_monitoring_cost: float,
        active_users: int
    ) -> float:
        """Calculate cost per user"""
        return total_monitoring_cost / active_users if active_users > 0 else 0
    
    def calculate_mttr_cost_savings(
        self,
        mttr_before: float,  # minutes
        mttr_after: float,
        incident_cost_per_minute: float,
        incidents_per_month: int
    ) -> float:
        """
        Calculate cost savings from MTTR improvement
        """
        mttr_improvement = mttr_before - mttr_after
        monthly_savings = mttr_improvement * incident_cost_per_minute * incidents_per_month
        return monthly_savings
    
    def calculate_downtime_prevention_value(
        self,
        availability_before: float,  # percentage, e.g., 99.9
        availability_after: float,
        revenue_per_minute: float
    ) -> float:
        """
        Calculate value from availability improvement
        """
        downtime_before = (100 - availability_before) / 100 * 43200  # Monthly minutes
        downtime_after = (100 - availability_after) / 100 * 43200
        
        downtime_prevented = downtime_before - downtime_after
        value = downtime_prevented * revenue_per_minute
        
        return value
```

### 9.2 Cost-Effective Observability Strategy

```mermaid
flowchart TB
    subgraph TieringStrategy["Tiering Strategy"]
        Critical[Critical Services<br/>100% Observability]
        Standard[Standard Services<br/>Basic Observability]
        LowPriority[Low Priority<br/>Minimal Observability]
    end
    
    subgraph CostControls["Cost Controls"]
        Sampling[Sampling Strategy]
        Retention[Retention Policy]
        Aggregation[Pre-aggregation]
    end
    
    subgraph Optimization["Optimization Measures"]
        EMF[EMF Format]
        Filter[Log Filtering]
        Aligned[Aligned Alerts]
    end
    
    TieringStrategy --> CostControls --> Optimization
```

---

(Continuing with Chapters 10-13...)

## 10. Cost Monitoring and Optimization Practices

### 10.1 AWS Cost Anomaly Detection Integration

```python
import boto3
from datetime import datetime, timedelta

class CostMonitoring:
    """
    AWS Cost Monitoring and Anomaly Detection
    """
    
    def __init__(self):
        self.ce = boto3.client('ce')
        self.budgets = boto3.client('budgets')
        self.anomaly = boto3.client('ce', region_name='us-east-1')
    
    def create_anomaly_detector(self, monitor_type='DIMENSIONAL'):
        """Create cost anomaly detector"""
        
        response = self.ce.create_anomaly_monitor(
            AnomalyMonitor={
                'MonitorType': monitor_type,
                'MonitorName': 'DailyCostMonitor',
                'MonitorSpecification': {
                    'MatchOptions': ['EQUALS'],
                    'Values': ['USAGE']
                }
            }
        )
        
        monitor_arn = response['MonitorArn']
        
        # Create anomaly subscription
        self.ce.create_anomaly_subscription(
            AnomalySubscription={
                'SubscriptionName': 'CostAlertSubscription',
                'Threshold': 100,  # $100
                'Frequency': 'IMMEDIATE',
                'MonitorArnList': [monitor_arn],
                'Subscribers': [
                    {
                        'Type': 'SNS',
                        'Address': 'arn:aws:sns:us-east-1:123456789:cost-alerts'
                    }
                ]
            }
        )
        
        return monitor_arn
    
    def create_budget_with_alert(self, budget_amount: float, email: str):
        """Create budget alert"""
        
        budget = {
            'BudgetName': 'MonthlyBudget',
            'BudgetLimit': {
                'Amount': str(budget_amount),
                'Unit': 'USD'
            },
            'TimeUnit': 'MONTHLY',
            'BudgetType': 'COST',
            'CostFilters': {}
        }
        
        notifications = [
            {
                'Notification': {
                    'NotificationType': 'ACTUAL',
                    'ComparisonOperator': 'GREATER_THAN',
                    'Threshold': 80  # 80% actual
                },
                'Subscribers': [{'SubscriptionType': 'EMAIL', 'Address': email}]
            },
            {
                'Notification': {
                    'NotificationType': 'FORECASTED',
                    'ComparisonOperator': 'GREATER_THAN',
                    'Threshold': 100  # 100% forecasted
                },
                'Subscribers': [{'SubscriptionType': 'EMAIL', 'Address': email}]
            }
        ]
        
        self.budgets.create_budget(
            AccountId='123456789',
            Budget=budget,
            NotificationsWithSubscribers=notifications
        )
    
    def analyze_cost_by_tag(self, tag_key: str, days: int = 30):
        """Analyze costs by tag"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        response = self.ce.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost', 'UsageQuantity'],
            GroupBy=[
                {'Type': 'TAG', 'Key': tag_key}
            ]
        )
        
        results = {}
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                tag_value = group['Keys'][0].split('$')[1] if '$' in group['Keys'][0] else 'untagged'
                cost = float(group['Metrics']['UnblendedCost']['Amount'])
                
                if tag_value not in results:
                    results[tag_value] = {'total_cost': 0, 'daily_costs': []}
                
                results[tag_value]['total_cost'] += cost
                results[tag_value]['daily_costs'].append({'date': date, 'cost': cost})
        
        return results
    
    def identify_cost_spikes(self, threshold_percentage: float = 20.0):
        """Identify cost spikes"""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=7)
        
        response = self.ce.get_cost_and_usage(
            TimePeriod={
                'Start': start_date.strftime('%Y-%m-%d'),
                'End': end_date.strftime('%Y-%m-%d')
            },
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
        )
        
        spikes = []
        
        # Analyze daily costs by service
        service_costs = {}
        for result in response['ResultsByTime']:
            date = result['TimePeriod']['Start']
            for group in result['Groups']:
                service = group['Keys'][0]
                cost = float(group['Metrics']['UnblendedCost']['Amount'])
                
                if service not in service_costs:
                    service_costs[service] = []
                service_costs[service].append(cost)
        
        # Detect spikes
        for service, costs in service_costs.items():
            if len(costs) >= 2:
                avg_cost = sum(costs[:-1]) / len(costs[:-1])
                latest_cost = costs[-1]
                
                if avg_cost > 0:
                    increase_percentage = ((latest_cost - avg_cost) / avg_cost) * 100
                    if increase_percentage > threshold_percentage:
                        spikes.append({
                            'service': service,
                            'previous_avg': avg_cost,
                            'current': latest_cost,
                            'increase_percentage': increase_percentage,
                            'additional_cost': latest_cost - avg_cost
                        })
        
        return sorted(spikes, key=lambda x: x['increase_percentage'], reverse=True)

# Lambda cost monitoring function
def lambda_handler(event, context):
    """Monitor Lambda function cost efficiency"""
    
    monitoring = CostMonitoring()
    
    # Analyze costs by function name
    cost_by_function = monitoring.analyze_cost_by_tag('lambda:FunctionName', days=7)
    
    # Identify abnormally high costs
    alerts = []
    for function_name, data in cost_by_function.items():
        daily_avg = data['total_cost'] / 7
        if daily_avg > 100:  # Over $100 per day
            alerts.append({
                'function': function_name,
                'daily_avg_cost': daily_avg,
                'weekly_total': data['total_cost'],
                'recommendation': 'Review function configuration and invocation patterns'
            })
    
    return {
        'functions_analyzed': len(cost_by_function),
        'alerts': alerts
    }
```

---

## 11. Multi-Environment Monitoring Strategy

### 11.1 Environment Isolation and Unified View

```mermaid
flowchart TB
    subgraph Environments["Multi-Environment"]
        Dev[Development]
        Staging[Staging]
        Prod[Production]
    end
    
    subgraph Aggregation["Aggregation Layer"]
        CrossAccount[Cross-Account Aggregation]
        CentralDashboard[Central Dashboard]
    end
    
    subgraph Governance["Governance"]
        Tagging[Tagging Strategy]
        Retention[Retention Policy]
        AccessControl[Access Control]
    end
    
    Dev -->|Data Flow| CrossAccount
    Staging -->|Data Flow| CrossAccount
    Prod -->|Data Flow| CrossAccount
    
    CrossAccount --> CentralDashboard
    Governance -.-> Environments
```

### 11.2 Cross-Environment Metrics Comparison

```python
import boto3
from dataclasses import dataclass
from typing import Dict, List
from datetime import datetime

@dataclass
class EnvironmentMetrics:
    """Environment metrics data"""
    environment: str
    availability: float
    latency_p99: float
    error_rate: float
    cost_per_request: float

class MultiEnvironmentMonitor:
    """
    Multi-Environment Monitor
    - Cross-environment metrics comparison
    - Anomaly detection
    - Deployment impact analysis
    """
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.environments = {
            'dev': {'account': '123456789', 'region': 'us-east-1'},
            'staging': {'account': '987654321', 'region': 'us-east-1'},
            'prod': {'account': '555555555', 'region': 'us-east-1'}
        }
    
    def compare_latency_across_environments(
        self,
        service_name: str,
        start_time: datetime,
        end_time: datetime
    ) -> Dict:
        """Compare latency across environments"""
        
        comparison = {}
        
        for env, config in self.environments.items():
            # Assume cross-account role access
            session = boto3.Session(
                profile_name=f"monitoring-{env}"
            )
            cw = session.client('cloudwatch', region_name=config['region'])
            
            response = cw.get_metric_statistics(
                Namespace='Application/API',
                MetricName='Latency',
                Dimensions=[
                    {'Name': 'Service', 'Value': service_name},
                    {'Name': 'Environment', 'Value': env}
                ],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['p99', 'Average']
            )
            
            if response['Datapoints']:
                p99_latencies = [dp['ExtendedStatistics']['p99'] for dp in response['Datapoints']]
                comparison[env] = {
                    'p99_avg': sum(p99_latencies) / len(p99_latencies),
                    'datapoints': len(response['Datapoints'])
                }
        
        # Detect differences between production and staging
        if 'prod' in comparison and 'staging' in comparison:
            prod_p99 = comparison['prod']['p99_avg']
            staging_p99 = comparison['staging']['p99_avg']
            
            if staging_p99 > 0:
                deviation = ((prod_p99 - staging_p99) / staging_p99) * 100
                comparison['deviation_analysis'] = {
                    'staging_to_prod_p99_diff_percent': deviation,
                    'alert': abs(deviation) > 20  # Alert on 20% difference
                }
        
        return comparison
    
    def analyze_deployment_impact(
        self,
        service_name: str,
        deployment_time: datetime,
        window_minutes: int = 30
    ) -> Dict:
        """
        Analyze deployment impact on metrics
        """
        
        before_start = deployment_time - timedelta(minutes=window_minutes)
        after_end = deployment_time + timedelta(minutes=window_minutes)
        
        # Pre-deployment metrics
        before_metrics = self._get_metrics_for_window(
            service_name, before_start, deployment_time
        )
        
        # Post-deployment metrics
        after_metrics = self._get_metrics_for_window(
            service_name, deployment_time, after_end
        )
        
        # Calculate changes
        impact = {
            'error_rate_change': self._calculate_change(
                before_metrics.get('error_rate', 0),
                after_metrics.get('error_rate', 0)
            ),
            'latency_change': self._calculate_change(
                before_metrics.get('latency_p99', 0),
                after_metrics.get('latency_p99', 0)
            ),
            'deployment_time': deployment_time.isoformat()
        }
        
        # Determine if negative impact
        impact['negative_impact'] = (
            impact['error_rate_change'] > 50 or  # 50% error rate increase
            impact['latency_change'] > 20         # 20% latency increase
        )
        
        return impact
    
    def _get_metrics_for_window(
        self,
        service_name: str,
        start: datetime,
        end: datetime
    ) -> Dict:
        """Get metrics within time window"""
        
        response = self.cloudwatch.get_metric_statistics(
            Namespace='Application/API',
            MetricName='ErrorRate',
            Dimensions=[{'Name': 'Service', 'Value': service_name}],
            StartTime=start,
            EndTime=end,
            Period=60,
            Statistics=['Average']
        )
        
        if response['Datapoints']:
            avg_error_rate = sum(dp['Average'] for dp in response['Datapoints']) / len(response['Datapoints'])
        else:
            avg_error_rate = 0
        
        return {'error_rate': avg_error_rate}
    
    def _calculate_change(self, before: float, after: float) -> float:
        """Calculate change percentage"""
        if before == 0:
            return float('inf') if after > 0 else 0
        return ((after - before) / before) * 100
    
    def generate_environment_health_report(self) -> Dict:
        """Generate environment health report"""
        
        report = {
            'generated_at': datetime.utcnow().isoformat(),
            'environments': {}
        }
        
        for env in self.environments.keys():
            report['environments'][env] = {
                'status': self._get_environment_status(env),
                'key_metrics': self._get_key_metrics(env),
                'alerts': self._get_active_alerts(env)
            }
        
        return report
    
    def _get_environment_status(self, env: str) -> str:
        return 'healthy'
    
    def _get_key_metrics(self, env: str) -> Dict:
        return {}
    
    def _get_active_alerts(self, env: str) -> List:
        return []
```

---

## 12. Security Monitoring and Threat Detection

### 12.1 GuardDuty Integration

```python
import boto3
import json

class SecurityMonitoring:
    """
    Security Monitoring and Threat Detection
    - GuardDuty finding processing
    - Security Hub integration
    - Automated response
    """
    
    def __init__(self):
        self.guardduty = boto3.client('guardduty')
        self.securityhub = boto3.client('securityhub')
        self.sns = boto3.client('sns')
    
    def process_guardduty_finding(self, finding: dict) -> dict:
        """Process GuardDuty finding"""
        
        finding_id = finding['id']
        severity = finding['severity']
        finding_type = finding['type']
        
        response_actions = []
        
        # Handle by severity
        if severity >= 7.0:  # High
            response_actions.extend(self._handle_high_severity(finding))
        elif severity >= 4.0:  # Medium
            response_actions.extend(self._handle_medium_severity(finding))
        else:  # Low
            response_actions.extend(self._handle_low_severity(finding))
        
        # Export to Security Hub
        self._export_to_security_hub(finding)
        
        return {
            'finding_id': finding_id,
            'actions_taken': response_actions,
            'severity': severity
        }
    
    def _handle_high_severity(self, finding: dict) -> list:
        """Handle high severity finding"""
        actions = []
        
        finding_type = finding['type']
        
        if 'UnauthorizedAccess' in finding_type:
            # Block suspicious IP
            actions.append(self._block_ip(finding['resource']['instanceDetails']['networkInterfaces'][0]['publicIp']))
        
        if 'CryptoCurrency' in finding_type:
            # Isolate instance
            actions.append(self._isolate_instance(finding['resource']['instanceDetails']['instanceId']))
        
        # Immediately notify security team
        self._send_immediate_alert(finding)
        
        return actions
    
    def _handle_medium_severity(self, finding: dict) -> list:
        """Handle medium severity finding"""
        actions = []
        
        # Log and schedule review
        actions.append('scheduled_for_review')
        
        # Send Slack notification
        self._send_slack_notification(finding)
        
        return actions
    
    def _handle_low_severity(self, finding: dict) -> list:
        """Handle low severity finding"""
        # Only log, batch process
        return ['logged_for_batch_review']
    
    def _block_ip(self, ip_address: str) -> str:
        """Block suspicious IP"""
        # Update NACL or security group
        return f'blocked_ip:{ip_address}'
    
    def _isolate_instance(self, instance_id: str) -> str:
        """Isolate instance"""
        ec2 = boto3.client('ec2')
        
        # Create isolation security group
        try:
            response = ec2.create_security_group(
                GroupName=f'isolate-{instance_id}',
                Description='Isolation security group'
            )
            sg_id = response['GroupId']
            
            # Remove all inbound rules from this security group
            ec2.revoke_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[]
            )
            
            # Attach instance to isolation security group
            ec2.modify_instance_attribute(
                InstanceId=instance_id,
                Groups=[sg_id]
            )
            
            return f'isolated_instance:{instance_id}'
        except Exception as e:
            return f'isolation_failed:{str(e)}'
    
    def _send_immediate_alert(self, finding: dict):
        """Send immediate alert"""
        message = {
            'default': json.dumps({
                'alert_type': 'security_incident',
                'severity': 'CRITICAL',
                'finding': finding
            }),
            'email': f"""
            SECURITY ALERT - CRITICAL
            
            Finding Type: {finding['type']}
            Severity: {finding['severity']}
            Account: {finding['accountId']}
            Region: {finding['region']}
            
            Description: {finding['description']}
            
            Immediate action required!
            """
        }
        
        self.sns.publish(
            TopicArn='arn:aws:sns:us-east-1:123456789:security-critical',
            Message=json.dumps(message),
            MessageStructure='json'
        )
    
    def _send_slack_notification(self, finding: dict):
        """Send Slack notification"""
        pass
    
    def _export_to_security_hub(self, finding: dict):
        """Export to Security Hub"""
        
        security_finding = {
            'SchemaVersion': '2018-10-08',
            'Id': finding['id'],
            'ProductArn': f"arn:aws:securityhub:{finding['region']}::product/aws/guardduty",
            'GeneratorId': finding['type'],
            'AwsAccountId': finding['accountId'],
            'Types': ['TTPs/UnauthorizedAccess'],
            'CreatedAt': finding['createdAt'],
            'UpdatedAt': finding['updatedAt'],
            'Severity': {
                'Product': finding['severity'],
                'Normalized': int(finding['severity'] * 10)
            },
            'Title': finding['title'],
            'Description': finding['description'],
            'Resources': [{
                'Type': 'AwsEc2Instance',
                'Id': finding['resource']['instanceDetails']['instanceId']
            }],
            'RecordState': 'ACTIVE'
        }
        
        self.securityhub.batch_import_findings(Findings=[security_finding])
```

---

## 13. Production Environment Best Practices

### 13.1 Monitoring as Code

```yaml
# monitoring-stack.yaml
# CloudFormation/SAM template for monitoring resources

AWSTemplateFormatVersion: '2010-09-09'
Description: 'Monitoring as Code - Application Monitoring Stack'

Parameters:
  ApplicationName:
    Type: String
    Default: MyApplication
  Environment:
    Type: String
    AllowedValues: [dev, staging, prod]
  AlarmSNSTopic:
    Type: String

Resources:
  # CloudWatch Log Group
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/applications/${ApplicationName}'
      RetentionInDays: !If [IsProduction, 90, 7]
      Tags:
        - Key: Application
          Value: !Ref ApplicationName
        - Key: Environment
          Value: !Ref Environment

  # Error Rate Alarm
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-HighErrorRate'
      AlarmDescription: 'API error rate exceeds 1%'
      MetricName: ErrorRate
      Namespace: !Sub '${ApplicationName}/API'
      Statistic: Average
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1.0
      ComparisonOperator: GreaterThanThreshold
      TreatMissingData: notBreaching
      AlarmActions:
        - !Ref AlarmSNSTopic
      OKActions:
        - !Ref AlarmSNSTopic
      Tags:
        - Key: Severity
          Value: P1

  # Latency Alarm
  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ApplicationName}-HighLatency'
      AlarmDescription: 'P99 latency exceeds 1 second'
      ExtendedStatistic: p99
      MetricName: Latency
      Namespace: !Sub '${ApplicationName}/API'
      Period: 60
      EvaluationPeriods: 3
      Threshold: 1000
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlarmSNSTopic

  # Custom Metrics Dashboard
  ApplicationDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub '${ApplicationName}-${Environment}'
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "title": "Request Count",
                "metrics": [
                  ["${ApplicationName}/API", "RequestCount", "Environment", "${Environment}"]
                ],
                "period": 60,
                "stat": "Sum"
              }
            },
            {
              "type": "metric",
              "properties": {
                "title": "Error Rate",
                "metrics": [
                  ["${ApplicationName}/API", "ErrorRate", "Environment", "${Environment}", { "color": "#d62728" }]
                ],
                "annotations": {
                  "horizontal": [
                    { "value": 1, "label": "Threshold", "color": "#ff0000" }
                  ]
                }
              }
            },
            {
              "type": "log",
              "properties": {
                "title": "Error Logs",
                "query": "SOURCE '${ApplicationLogGroup}' | fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 20",
                "region": "${AWS::Region}"
              }
            }
          ]
        }

Conditions:
  IsProduction: !Equals [!Ref Environment, 'prod']

Outputs:
  LogGroupName:
    Description: Application Log Group
    Value: !Ref ApplicationLogGroup
  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub 'https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ApplicationName}-${Environment}'
```

### 13.2 Monitoring Health Checks

```python
class MonitoringHealthCheck:
    """
    Monitoring System Health Checks
    - Verify alert configuration
    - Check log ingestion
    - Validate dashboards
    """
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.logs = boto3.client('logs')
        self.sns = boto3.client('sns')
    
    def validate_alarm_configuration(self, alarm_name: str) -> dict:
        """Validate alarm configuration"""
        
        try:
            response = self.cloudwatch.describe_alarms(
                AlarmNames=[alarm_name]
            )
            
            if not response['MetricAlarms']:
                return {'status': 'ERROR', 'message': 'Alarm not found'}
            
            alarm = response['MetricAlarms'][0]
            issues = []
            
            # Check if actions configured
            if not alarm.get('AlarmActions'):
                issues.append('No alarm actions configured')
            
            # Check evaluation periods
            if alarm['EvaluationPeriods'] < 2:
                issues.append('Evaluation periods too low (risk of flapping)')
            
            # Check missing data handling
            if alarm.get('TreatMissingData') == 'breaching':
                issues.append('Missing data treated as breaching (may cause false alarms)')
            
            return {
                'status': 'WARNING' if issues else 'OK',
                'alarm_name': alarm_name,
                'issues': issues,
                'configuration': {
                    'threshold': alarm['Threshold'],
                    'evaluation_periods': alarm['EvaluationPeriods'],
                    'period': alarm['Period']
                }
            }
            
        except Exception as e:
            return {'status': 'ERROR', 'message': str(e)}
    
    def check_log_group_health(self, log_group: str) -> dict:
        """Check log group health"""
        
        try:
            # Check recent log ingestion
            response = self.logs.describe_log_streams(
                logGroupName=log_group,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )
            
            if not response['logStreams']:
                return {
                    'status': 'WARNING',
                    'log_group': log_group,
                    'message': 'No log streams found'
                }
            
            last_event = response['logStreams'][0].get('lastEventTimestamp', 0)
            last_event_time = datetime.fromtimestamp(last_event / 1000)
            time_since_last_event = datetime.utcnow() - last_event_time
            
            if time_since_last_event > timedelta(hours=1):
                return {
                    'status': 'WARNING',
                    'log_group': log_group,
                    'message': f'No logs in last {time_since_last_event.total_seconds() / 60:.0f} minutes',
                    'last_event': last_event_time.isoformat()
                }
            
            return {
                'status': 'OK',
                'log_group': log_group,
                'last_event': last_event_time.isoformat(),
                'time_since_last_event_minutes': time_since_last_event.total_seconds() / 60
            }
            
        except Exception as e:
            return {'status': 'ERROR', 'message': str(e)}
    
    def run_full_health_check(self) -> dict:
        """Run full health check"""
        
        checks = {
            'alarms': [],
            'log_groups': [],
            'dashboards': []
        }
        
        # Check all alarms
        paginator = self.cloudwatch.get_paginator('describe_alarms')
        for page in paginator.paginate(StateValue='ENABLED'):
            for alarm in page['MetricAlarms']:
                result = self.validate_alarm_configuration(alarm['AlarmName'])
                checks['alarms'].append(result)
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'summary': {
                'total_alarms': len(checks['alarms']),
                'ok': sum(1 for a in checks['alarms'] if a['status'] == 'OK'),
                'warnings': sum(1 for a in checks['alarms'] if a['status'] == 'WARNING'),
                'errors': sum(1 for a in checks['alarms'] if a['status'] == 'ERROR')
            },
            'details': checks
        }

---

*Version: v1.0*  
*Updated: 2026-03-02*
