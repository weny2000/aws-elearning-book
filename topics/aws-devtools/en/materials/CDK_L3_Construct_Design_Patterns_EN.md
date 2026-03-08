# AWS CDK L3 Construct Design Patterns

> Building Reusable, Shareable Enterprise-Level CDK Architecture Components

---

## Table of Contents

1. [Construct Level Overview](#1-construct-level-overview)
2. [L3 Construct Design Principles](#2-l3-construct-design-principles)
3. [API Design Best Practices](#3-api-design-best-practices)
4. [Implementation Patterns](#4-implementation-patterns)
5. [Testing Strategies](#5-testing-strategies)
6. [Publishing and Maintenance](#6-publishing-and-maintenance)
7. [Production Case Study: FargateSpotFailoverConstruct](#7-production-case-study-fargatespotfailoverconstruct)

---

## 1. Construct Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│ L3 (Patterns) - Complete Architecture Patterns                │
│  • WebServiceConstruct                                       │
│  • ServerlessApiConstruct                                    │
│  • FargateSpotFailoverConstruct                              │
├─────────────────────────────────────────────────────────────┤
│ L2 (AWS Constructs) - AWS Service Wrappers                    │
│  • s3.Bucket                                                 │
│  • lambda.Function                                           │
│  • ecs.FargateService                                        │
├─────────────────────────────────────────────────────────────┤
│ L1 (CloudFormation Resources) - Raw CFN                       │
│  • CfnBucket                                                 │
│  • CfnFunction                                               │
└─────────────────────────────────────────────────────────────┘
```

### When to Create an L3 Construct

| Scenario | Recommendation |
|----------|----------------|
| Same architecture pattern used in 3+ projects | Create L3 Construct |
| Team needs standardized deployment | Create L3 Construct |
| Need to hide complexity | Create L3 Construct |
| Simply wrapping a single resource | Use L2 |
| One-time deployment | Use L2 |

---

## 2. L3 Construct Design Principles

### 2.1 Single Responsibility Principle

```typescript
// ❌ Bad design: One Construct doing too much
class BadMonolithConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);
    // VPC + ECS + RDS + ElastiCache + ALB + CloudFront...
    // Too complex, difficult to reuse and test
  }
}

// ✅ Good design: Each Construct has a clear responsibility
class WebServiceConstruct extends Construct {
  // Only responsible for: ALB + ECS/Fargate
}

class DatabaseConstruct extends Construct {
  // Only responsible for: RDS + backups
}

class CacheConstruct extends Construct {
  // Only responsible for: ElastiCache
}

// Composed usage
class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);
    
    const db = new DatabaseConstruct(this, 'Database');
    const cache = new CacheConstruct(this, 'Cache');
    const web = new WebServiceConstruct(this, 'Web', {
      databaseEndpoint: db.endpoint,
      cacheEndpoint: cache.endpoint,
    });
  }
}
```

### 2.2 Sensible Defaults

```typescript
export interface WebServiceConstructProps {
  readonly vpc: ec2.IVpc;
  readonly containerImage: ecs.ContainerImage;
  readonly cpu?: number;           // Default: 256
  readonly memoryLimitMiB?: number; // Default: 512
  readonly desiredCount?: number;   // Default: 2
  readonly enableAutoScaling?: boolean; // Default: true
  readonly healthCheckPath?: string;    // Default: "/health"
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // Sensible defaults
    const cpu = props.cpu ?? 256;
    const memoryLimitMiB = props.memoryLimitMiB ?? 512;
    const desiredCount = props.desiredCount ?? 2;
    const enableAutoScaling = props.enableAutoScaling ?? true;
    const healthCheckPath = props.healthCheckPath ?? '/health';
    
    // Production-grade defaults
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64, // Graviton2 default
      },
    });
    
    // Auto-enable CloudWatch Logs
    // Auto-enable X-Ray (if configured)
    // Auto-configure security groups
  }
}
```

### 2.3 Escape Hatch Pattern

```typescript
export class SecureBucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly cfnBucket: s3.CfnBucket; // Expose L1 for escape hatch
  
  constructor(scope: Construct, id: string, props?: SecureBucketProps) {
    super(scope, id);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });
    
    // Save L1 reference
    this.cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
    
    // Set properties not supported by L2 via L1
    this.cfnBucket.addPropertyOverride('ObjectLockEnabled', true);
    this.cfnBucket.addPropertyOverride('ObjectLockConfiguration', {
      Rule: {
        DefaultRetention: {
          Mode: 'COMPLIANCE',
          Days: 365,
        },
      },
    });
  }
  
  // Allow users to customize L1 properties
  public addCfnPropertyOverride(propertyPath: string, value: any): void {
    this.cfnBucket.addPropertyOverride(propertyPath, value);
  }
}

// Using escape hatch
const bucket = new SecureBucketConstruct(stack, 'SecureBucket');
bucket.addCfnPropertyOverride('LoggingConfiguration.DestinationBucketName', 'my-logs');
```

---

## 3. API Design Best Practices

### 3.1 Props Interface Design

```typescript
// Layered Props design
// Base interface
interface BaseConstructProps {
  readonly vpc: ec2.IVpc;
  readonly environment: string;
  readonly tags?: { [key: string]: string };
}

// Compute resource configuration
interface ComputeProps {
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  readonly desiredCount?: number;
  readonly enableAutoScaling?: boolean;
  readonly autoScalingTargetCpu?: number;
}

// Monitoring configuration
interface MonitoringProps {
  readonly enableXRay?: boolean;
  readonly logRetentionDays?: number;
  readonly alarmEmail?: string;
}

// Composite interface
export interface WebServiceConstructProps extends 
  BaseConstructProps, 
  ComputeProps, 
  MonitoringProps {
  readonly containerImage: ecs.ContainerImage;
  readonly containerPort?: number;
  readonly healthCheckPath?: string;
  readonly enableHttps?: boolean;
  readonly certificateArn?: string;
}
```

### 3.2 Outputs Design

```typescript
export class WebServiceConstruct extends Construct {
  // Publicly accessible properties
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly endpoint: string;
  public readonly cloudMapService?: cloudmap.Service;
  
  // Internal properties remain private
  private readonly taskDefinition: ecs.FargateTaskDefinition;
  private readonly cluster: ecs.Cluster;
  
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    // ... implementation
  }
  
  // Provide convenience methods
  public addAutoScaling(maxCapacity: number, targetCpuUtilization?: number): void {
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: this.service.desiredCount,
      maxCapacity,
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: targetCpuUtilization ?? 70,
    });
  }
  
  // Allow external connections
  public connections(): ec2.Connections {
    return this.service.connections;
  }
}
```

---

## 4. Implementation Patterns

### 4.1 Aspect Integration

```typescript
// Auto-tagging Aspect
import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export interface AutoTaggingAspectProps {
  readonly tags: { [key: string]: string };
  readonly excludeTypes?: string[];
}

export class AutoTaggingAspect implements cdk.IAspect {
  constructor(private readonly props: AutoTaggingAspectProps) {}
  
  public visit(node: IConstruct): void {
    // Exclude specific types
    if (this.props.excludeTypes?.some(type => node.constructor.name.includes(type))) {
      return;
    }
    
    // Only add tags to taggable resources
    if (cdk.TagManager.isTaggable(node)) {
      Object.entries(this.props.tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value, {
          priority: 100, // High priority
        });
      });
    }
  }
}

// Usage in L3 Construct
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // Implementation...
    
    // Apply Aspect
    cdk.Aspects.of(this).add(new AutoTaggingAspect({
      tags: {
        ConstructType: 'WebService',
        ConstructId: id,
        Environment: props.environment,
      },
    }));
  }
}
```

### 4.2 Validation Patterns

```typescript
// Construction-time validation
export interface WebServiceConstructProps {
  readonly desiredCount: number;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // Validate CPU/Memory combination
    const validCombinations = [
      { cpu: 256, memory: [512, 1024, 2048] },
      { cpu: 512, memory: [1024, 2048, 3072, 4096] },
      { cpu: 1024, memory: [2048, 3072, 4096, 5120, 6144, 7168, 8192] },
    ];
    
    const validMemory = validCombinations
      .find(c => c.cpu === props.cpu)?.memory || [];
    
    if (!validMemory.includes(props.memoryLimitMiB)) {
      throw new Error(
        `Invalid CPU/Memory combination: ${props.cpu} vCPU / ${props.memoryLimitMiB} MiB. ` +
        `Valid memory for ${props.cpu} vCPU: ${validMemory.join(', ')}`
      );
    }
    
    // Validate HTTPS configuration
    if (props.enableHttps && !props.certificateArn) {
      throw new Error('certificateArn is required when enableHttps is true');
    }
  }
}
```

---

## 5. Testing Strategies

### 5.1 Unit Testing

```typescript
// test/web-service-construct.test.ts
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { WebServiceConstruct } from '../src';

test('WebService creates required resources', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
  
  new WebServiceConstruct(stack, 'WebService', {
    vpc,
    containerImage: ecs.ContainerImage.fromRegistry('nginx:latest'),
    environment: 'test',
  });
  
  const template = Template.fromStack(stack);
  
  // Verify resource creation
  template.hasResourceProperties('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
  
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Type: 'application',
  });
  
  // Verify tags
  template.hasResource('AWS::ECS::Service', {
    Tags: [
      { Key: 'ConstructType', Value: 'WebService' },
      { Key: 'Environment', Value: 'test' },
    ],
  });
});

test('WebService validates CPU/Memory combination', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });
  
  expect(() => {
    new WebServiceConstruct(stack, 'WebService', {
      vpc,
      containerImage: ecs.ContainerImage.fromRegistry('nginx'),
      environment: 'test',
      cpu: 256,
      memoryLimitMiB: 4096, // 256 vCPU does not support 4GB
    });
  }).toThrow(/Invalid CPU\/Memory combination/);
});
```

### 5.2 Integration Testing

```typescript
// test/integ.web-service.ts
import { App } from 'aws-cdk-lib';
import { IntegTest } from '@aws-cdk/integ-tests-alpha';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { WebServiceConstruct } from '../src';

const app = new App();
const stack = new Stack(app, 'IntegStack');
const vpc = new ec2.Vpc(stack, 'Vpc', { maxAzs: 2 });

new WebServiceConstruct(stack, 'WebService', {
  vpc,
  containerImage: ecs.ContainerImage.fromRegistry('nginx:latest'),
  environment: 'integration-test',
  enableAutoScaling: true,
});

new IntegTest(app, 'WebServiceInteg', {
  testCases: [stack],
  // Optional: actual deployment validation
  // stackUpdateWorkflow: true,
});

app.synth();
```

---

## 6. Publishing and Maintenance

### 6.1 npm Publishing Configuration

```json
// package.json
{
  "name": "@your-org/cdk-constructs",
  "version": "1.0.0",
  "description": "Enterprise CDK Constructs",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": [
    "lib/",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "jsii",
    "watch": "jsii -w",
    "test": "jest",
    "package": "jsii-pacmak",
    "release": "jsii-release"
  },
  "jsii": {
    "outdir": "dist",
    "targets": {
      "python": {
        "distName": "your-org.cdk-constructs",
        "module": "your_org_cdk_constructs"
      },
      "java": {
        "package": "com.yourorg.cdk",
        "maven": {
          "groupId": "com.yourorg",
          "artifactId": "cdk-constructs"
        }
      }
    }
  },
  "peerDependencies": {
    "aws-cdk-lib": "^2.0.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "jsii": "^5.0.0",
    "jsii-pacmak": "^1.0.0",
    "jsii-release": "^0.2.0",
    "@aws-cdk/integ-tests-alpha": "^2.0.0-alpha.0"
  }
}
```

### 6.2 Versioning Strategy

```typescript
// Semantic versioning examples
// 1.0.0 - Initial release
// 1.1.0 - New feature: added auto-scaling support (backward compatible)
// 1.1.1 - Bug fix: fixed health check path issue
// 2.0.0 - Breaking change: refactored Props interface

// Deprecation warning
/**
 * @deprecated Use {@link WebServiceConstructProps.enableHttps} instead
 */
export interface HttpsConfig {
  readonly certificateArn: string;
}

// Migration guide
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // Backward compatibility handling
    if ('httpsConfig' in (props as any)) {
      Annotations.of(this).addWarning(
        'httpsConfig is deprecated. Use enableHttps and certificateArn instead.'
      );
    }
  }
}
```

---

## 7. Production Case Study: FargateSpotFailoverConstruct

### 7.1 Design Goals

```typescript
/**
 * FargateSpotFailoverConstruct
 * 
 * Goal: Automatically migrate to On-Demand instances when Fargate Spot instances are interrupted
 * Scenario: Cost-sensitive production workloads
 * 
 * Architecture:
 *   Spot task ──interruption──> EventBridge ──> Lambda ──> ECS RunTask (On-Demand)
 */

export interface FargateSpotFailoverConstructProps {
  readonly cluster: ecs.ICluster;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly vpc: ec2.IVpc;
  readonly spotWeight?: number;        // Default: 80
  readonly onDemandWeight?: number;    // Default: 20
  readonly failoverToOnDemand?: boolean; // Default: true
  readonly notificationTopic?: sns.ITopic;
}

export class FargateSpotFailoverConstruct extends Construct {
  public readonly spotService: ecs.FargateService;
  public readonly onDemandService: ecs.FargateService;
  public readonly failoverFunction: lambda.Function;
  
  constructor(scope: Construct, id: string, props: FargateSpotFailoverConstructProps) {
    super(scope, id);
    
    // 1. Create capacity provider strategy
    const cfnCluster = props.cluster.node.defaultChild as ecs.CfnCluster;
    
    // 2. Spot service
    this.spotService = new ecs.FargateService(this, 'SpotService', {
      cluster: props.cluster,
      taskDefinition: props.taskDefinition,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: props.spotWeight ?? 80,
          base: 1,
        },
        {
          capacityProvider: 'FARGATE',
          weight: props.onDemandWeight ?? 20,
          base: 0,
        },
      ],
    });
    
    // 3. Interruption handling Lambda
    this.failoverFunction = new lambda.Function(this, 'FailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        CLUSTER_NAME: props.cluster.clusterName,
        TASK_DEFINITION_ARN: props.taskDefinition.taskDefinitionArn,
        SUBNETS: JSON.stringify(props.vpc.privateSubnets.map(s => s.subnetId)),
        SECURITY_GROUPS: JSON.stringify([this.spotService.connections.securityGroups[0].securityGroupId]),
      },
    });
    
    // 4. EventBridge rule
    const rule = new events.Rule(this, 'SpotInterruptionRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          stoppedReason: ['SIGTERM'],
          capacityProviderName: ['FARGATE_SPOT'], // Key: only handle Spot interruptions
        },
      },
    });
    
    rule.addTarget(new targets.LambdaFunction(this.failoverFunction));
    
    // 5. Notifications
    if (props.notificationTopic) {
      rule.addTarget(new targets.SnsTopic(props.notificationTopic, {
        message: events.RuleTargetInput.fromEventPath('$.detail'),
      }));
    }
  }
}
```

### 7.2 Lambda Handler Function

```typescript
// lambda/index.ts
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ecs = new ECSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any): Promise<void> => {
  const detail = event.detail;
  
  console.log('Spot interruption detected:', JSON.stringify(detail, null, 2));
  
  // Launch On-Demand replacement task
  const command = new RunTaskCommand({
    cluster: process.env.CLUSTER_NAME,
    taskDefinition: process.env.TASK_DEFINITION_ARN,
    launchType: 'FARGATE',
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: JSON.parse(process.env.SUBNETS!),
        securityGroups: JSON.parse(process.env.SECURITY_GROUPS!),
        assignPublicIp: 'DISABLED',
      },
    },
    overrides: {
      containerOverrides: [{
        name: 'app',
        environment: [{
          name: 'FAILOVER_FROM_SPOT',
          value: 'true',
        }],
      }],
    },
  });
  
  const result = await ecs.send(command);
  console.log('Failover task started:', result.tasks?.[0].taskArn);
};
```

---

*Part of AWS DevTools Hero Learning Path*
