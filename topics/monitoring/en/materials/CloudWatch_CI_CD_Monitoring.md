# CloudWatch for CI/CD Pipeline Monitoring

> Monitoring Deployment Health with DORA Metrics

---

## Overview

This guide covers monitoring CI/CD pipelines using CloudWatch, including DORA (DevOps Research and Assessment) metrics implementation.

---

## Architecture

```mermaid
flowchart LR
    Pipeline[CodePipeline] -->|Events| EventBridge
    EventBridge -->|Triggers| Lambda
    Lambda -->|Metrics| CloudWatch
    
    CodeBuild[CodeBuild] -->|Logs| CloudWatch Logs
    CodeBuild -->|Metrics| CloudWatch
    
    CloudWatch -->|Dashboard| Dashboard
    CloudWatch -->|Alarms| SNS
    SNS -->|Notifications| Email/Slack
```

---

## DORA Metrics Implementation

### 1. Deployment Frequency

```typescript
// Track deployments per day
const deploymentMetric = new cloudwatch.Metric({
  namespace: 'CI/CD/DORA',
  metricName: 'DeploymentFrequency',
  dimensionsMap: {
    PipelineName: 'MyPipeline',
    Environment: 'Production',
  },
  statistic: 'Sum',
  period: Duration.days(1),
});

// Lambda to record deployments
export const handler = async (event: any) => {
  if (event.detail.state === 'SUCCEEDED') {
    await cloudwatch.putMetricData({
      Namespace: 'CI/CD/DORA',
      MetricData: [{
        MetricName: 'DeploymentFrequency',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'PipelineName', Value: event.detail.pipeline },
          { Name: 'Environment', Value: getEnvironment(event.detail.pipeline) },
        ],
      }],
    }).promise();
  }
};
```

### 2. Lead Time for Changes

```typescript
// Calculate time from commit to production
type DeploymentRecord = {
  commitId: string;
  commitTime: Date;
  deployTime: Date;
  pipeline: string;
};

async function recordLeadTime(record: DeploymentRecord) {
  const leadTimeHours = 
    (record.deployTime.getTime() - record.commitTime.getTime()) / (1000 * 60 * 60);
  
  await cloudwatch.putMetricData({
    Namespace: 'CI/CD/DORA',
    MetricData: [{
      MetricName: 'LeadTimeForChanges',
      Value: leadTimeHours,
      Unit: 'Hours',
      Dimensions: [
        { Name: 'Pipeline', Value: record.pipeline },
      ],
    }],
  }).promise();
}
```

### 3. Change Failure Rate

```typescript
// Track failed deployments vs total
async function recordDeploymentResult(
  pipeline: string, 
  succeeded: boolean
) {
  await cloudwatch.putMetricData({
    Namespace: 'CI/CD/DORA',
    MetricData: [
      {
        MetricName: 'DeploymentResult',
        Value: succeeded ? 0 : 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Pipeline', Value: pipeline },
          { Name: 'Result', Value: succeeded ? 'Success' : 'Failure' },
        ],
      },
      {
        MetricName: 'TotalDeployments',
        Value: 1,
        Unit: 'Count',
        Dimensions: [
          { Name: 'Pipeline', Value: pipeline },
        ],
      },
    ],
  }).promise();
}

// Calculate failure rate
const failureRate = new cloudwatch.MathExpression({
  expression: '(m1 / m2) * 100',
  label: 'ChangeFailureRate',
  usingMetrics: {
    m1: new cloudwatch.Metric({
      namespace: 'CI/CD/DORA',
      metricName: 'DeploymentResult',
      dimensionsMap: { Result: 'Failure' },
      statistic: 'Sum',
    }),
    m2: new cloudwatch.Metric({
      namespace: 'CI/CD/DORA',
      metricName: 'TotalDeployments',
      statistic: 'Sum',
    }),
  },
});
```

### 4. Mean Time to Recovery (MTTR)

```typescript
// Track time from failure to recovery
type FailureRecord = {
  pipeline: string;
  failureTime: Date;
  recoveryTime?: Date;
};

async function recordRecoveryTime(record: FailureRecord) {
  if (!record.recoveryTime) return;
  
  const mttrMinutes = 
    (record.recoveryTime.getTime() - record.failureTime.getTime()) / (1000 * 60);
  
  await cloudwatch.putMetricData({
    Namespace: 'CI/CD/DORA',
    MetricData: [{
      MetricName: 'MTTR',
      Value: mttrMinutes,
      Unit: 'Minutes',
      Dimensions: [
        { Name: 'Pipeline', Value: record.pipeline },
      ],
    }],
  }).promise();
}
```

---

## CloudWatch Dashboard

```typescript
const dashboard = new cloudwatch.Dashboard(this, 'CIDashboard', {
  dashboardName: 'CI-CD-Health',
});

dashboard.addWidgets(
  // Deployment Frequency
  new cloudwatch.GraphWidget({
    title: 'Deployment Frequency (per day)',
    left: [deploymentMetric],
    width: 12,
  }),
  
  // Lead Time
  new cloudwatch.GraphWidget({
    title: 'Lead Time for Changes (hours)',
    left: [
      new cloudwatch.Metric({
        namespace: 'CI/CD/DORA',
        metricName: 'LeadTimeForChanges',
        statistic: 'Average',
      }),
    ],
    width: 12,
  }),
  
  // Failure Rate
  new cloudwatch.GraphWidget({
    title: 'Change Failure Rate (%)',
    left: [failureRate],
    width: 12,
  }),
  
  // Build Duration
  new cloudwatch.GraphWidget({
    title: 'Build Duration',
    left: [
      new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'Duration',
        statistic: 'Average',
      }),
    ],
    width: 12,
  }),
  
  // Build Success Rate
  new cloudwatch.GraphWidget({
    title: 'Build Success Rate',
    left: [
      new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'SucceededBuilds',
        statistic: 'Sum',
      }),
      new cloudwatch.Metric({
        namespace: 'AWS/CodeBuild',
        metricName: 'FailedBuilds',
        statistic: 'Sum',
        color: '#ff0000',
      }),
    ],
    width: 24,
  })
);
```

---

## Alarms

```typescript
// Alarm on high failure rate
new cloudwatch.Alarm(this, 'HighFailureRate', {
  metric: failureRate,
  threshold: 10, // 10% failure rate
  evaluationPeriods: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: 'Deployment failure rate is above 10%',
});

// Alarm on long build times
new cloudwatch.Alarm(this, 'LongBuildTime', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/CodeBuild',
    metricName: 'Duration',
    statistic: 'Average',
  }),
  threshold: 600, // 10 minutes
  evaluationPeriods: 3,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: 'Build time exceeding 10 minutes',
});
```

---

## Integration with CodePipeline

```typescript
// Add CloudWatch event rule for pipeline events
new events.Rule(this, 'PipelineEvents', {
  eventPattern: {
    source: ['aws.codepipeline'],
    detailType: ['CodePipeline Pipeline Execution State Change'],
    detail: {
      state: ['SUCCEEDED', 'FAILED'],
    },
  },
  targets: [
    new targets.LambdaFunction(doraMetricsFunction),
  ],
});
```

---

*Part of AWS DevTools Hero Learning Path*
