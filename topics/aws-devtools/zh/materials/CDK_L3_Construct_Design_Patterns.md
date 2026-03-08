# AWS CDK L3 Construct 设计模式

> 构建可复用、可共享的企业级 CDK 架构组件

---

## 目录

1. [Construct 层级回顾](#1-construct-层级回顾)
2. [L3 Construct 设计原则](#2-l3-construct-设计原则)
3. [API 设计最佳实践](#3-api-设计最佳实践)
4. [实现模式](#4-实现模式)
5. [测试策略](#5-测试策略)
6. [发布与维护](#6-发布与维护)
7. [生产案例：FargateSpotFailoverConstruct](#7-生产案例fargatespotfailoverconstruct)

---

## 1. Construct 层级回顾

```
┌─────────────────────────────────────────────────────────────┐
│ L3 (Patterns) - 完整架构模式                                  │
│  • WebServiceConstruct                                       │
│  • ServerlessApiConstruct                                    │
│  • FargateSpotFailoverConstruct                              │
├─────────────────────────────────────────────────────────────┤
│ L2 (AWS Constructs) - AWS 服务封装                           │
│  • s3.Bucket                                                 │
│  • lambda.Function                                           │
│  • ecs.FargateService                                        │
├─────────────────────────────────────────────────────────────┤
│ L1 (CloudFormation Resources) - 原始 CFN                     │
│  • CfnBucket                                                 │
│  • CfnFunction                                               │
└─────────────────────────────────────────────────────────────┘
```

### 何时创建 L3 Construct

| 场景 | 建议 |
|------|------|
| 同一架构模式在3+项目使用 | 创建 L3 Construct |
| 团队需要标准化部署 | 创建 L3 Construct |
| 需要隐藏复杂性 | 创建 L3 Construct |
| 只是简单包装单个资源 | 使用 L2 |
| 一次性部署 | 使用 L2 |

---

## 2. L3 Construct 设计原则

### 2.1 单一职责原则

```typescript
// ❌ 不好的设计：一个 Construct 做太多事情
class BadMonolithConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);
    // VPC + ECS + RDS + ElastiCache + ALB + CloudFront...
    // 太复杂，难以复用和测试
  }
}

// ✅ 好的设计：每个 Construct 有明确职责
class WebServiceConstruct extends Construct {
  // 只负责：ALB + ECS/Fargate
}

class DatabaseConstruct extends Construct {
  // 只负责：RDS + 备份
}

class CacheConstruct extends Construct {
  // 只负责：ElastiCache
}

// 组合使用
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

### 2.2 合理的默认值

```typescript
export interface WebServiceConstructProps {
  readonly vpc: ec2.IVpc;
  readonly containerImage: ecs.ContainerImage;
  readonly cpu?: number;           // 默认: 256
  readonly memoryLimitMiB?: number; // 默认: 512
  readonly desiredCount?: number;   // 默认: 2
  readonly enableAutoScaling?: boolean; // 默认: true
  readonly healthCheckPath?: string;    // 默认: "/health"
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 合理的默认值
    const cpu = props.cpu ?? 256;
    const memoryLimitMiB = props.memoryLimitMiB ?? 512;
    const desiredCount = props.desiredCount ?? 2;
    const enableAutoScaling = props.enableAutoScaling ?? true;
    const healthCheckPath = props.healthCheckPath ?? '/health';
    
    // 生产级默认值
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64, // Graviton2 默认
      },
    });
    
    // 自动启用 CloudWatch Logs
    // 自动启用 X-Ray（如果配置）
    // 自动配置安全组
  }
}
```

### 2.3 Escape Hatch 模式

```typescript
export class SecureBucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly cfnBucket: s3.CfnBucket; // 暴露 L1 用于 escape hatch
  
  constructor(scope: Construct, id: string, props?: SecureBucketProps) {
    super(scope, id);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });
    
    // 保存 L1 引用
    this.cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
    
    // L2 不支持的属性，通过 L1 设置
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
  
  // 允许用户自定义 L1 属性
  public addCfnPropertyOverride(propertyPath: string, value: any): void {
    this.cfnBucket.addPropertyOverride(propertyPath, value);
  }
}

// 使用 escape hatch
const bucket = new SecureBucketConstruct(stack, 'SecureBucket');
bucket.addCfnPropertyOverride('LoggingConfiguration.DestinationBucketName', 'my-logs');
```

---

## 3. API 设计最佳实践

### 3.1 Props 接口设计

```typescript
// 分层 Props 设计
// 基础接口
interface BaseConstructProps {
  readonly vpc: ec2.IVpc;
  readonly environment: string;
  readonly tags?: { [key: string]: string };
}

// 计算资源配置
interface ComputeProps {
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  readonly desiredCount?: number;
  readonly enableAutoScaling?: boolean;
  readonly autoScalingTargetCpu?: number;
}

// 监控配置
interface MonitoringProps {
  readonly enableXRay?: boolean;
  readonly logRetentionDays?: number;
  readonly alarmEmail?: string;
}

// 组合接口
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

### 3.2 输出设计

```typescript
export class WebServiceConstruct extends Construct {
  // 公开可访问的属性
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly endpoint: string;
  public readonly cloudMapService?: cloudmap.Service;
  
  // 内部属性保持私有
  private readonly taskDefinition: ecs.FargateTaskDefinition;
  private readonly cluster: ecs.Cluster;
  
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    // ... 实现
  }
  
  // 提供便捷方法
  public addAutoScaling(maxCapacity: number, targetCpuUtilization?: number): void {
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: this.service.desiredCount,
      maxCapacity,
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: targetCpuUtilization ?? 70,
    });
  }
  
  // 允许外部连接
  public connections(): ec2.Connections {
    return this.service.connections;
  }
}
```

---

## 4. 实现模式

### 4.1 Aspect 集成

```typescript
// 自动标签 Aspect
import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export interface AutoTaggingAspectProps {
  readonly tags: { [key: string]: string };
  readonly excludeTypes?: string[];
}

export class AutoTaggingAspect implements cdk.IAspect {
  constructor(private readonly props: AutoTaggingAspectProps) {}
  
  public visit(node: IConstruct): void {
    // 排除特定类型
    if (this.props.excludeTypes?.some(type => node.constructor.name.includes(type))) {
      return;
    }
    
    // 只对可标签资源添加标签
    if (cdk.TagManager.isTaggable(node)) {
      Object.entries(this.props.tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value, {
          priority: 100, // 高优先级
        });
      });
    }
  }
}

// 在 L3 Construct 中使用
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 实现...
    
    // 应用 Aspect
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

### 4.2 验证模式

```typescript
// 构造时验证
export interface WebServiceConstructProps {
  readonly desiredCount: number;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 验证 CPU/Memory 组合
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
    
    // 验证 HTTPS 配置
    if (props.enableHttps && !props.certificateArn) {
      throw new Error('certificateArn is required when enableHttps is true');
    }
  }
}
```

---

## 5. 测试策略

### 5.1 单元测试

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
  
  // 验证资源创建
  template.hasResourceProperties('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
  
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Type: 'application',
  });
  
  // 验证标签
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
      memoryLimitMiB: 4096, // 256 vCPU 不支持 4GB
    });
  }).toThrow(/Invalid CPU\/Memory combination/);
});
```

### 5.2 集成测试

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
  // 可选：实际部署验证
  // stackUpdateWorkflow: true,
});

app.synth();
```

---

## 6. 发布与维护

### 6.1 npm 发布配置

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

### 6.2 版本策略

```typescript
// 语义化版本示例
// 1.0.0 - 初始发布
// 1.1.0 - 新功能：添加自动扩展支持（向后兼容）
// 1.1.1 - Bug 修复：修复健康检查路径问题
// 2.0.0 - 破坏性变更：重构 Props 接口

// 废弃警告
/**
 * @deprecated Use {@link WebServiceConstructProps.enableHttps} instead
 */
export interface HttpsConfig {
  readonly certificateArn: string;
}

// 迁移指南
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 向后兼容处理
    if ('httpsConfig' in (props as any)) {
      Annotations.of(this).addWarning(
        'httpsConfig is deprecated. Use enableHttps and certificateArn instead.'
      );
    }
  }
}
```

---

## 7. 生产案例：FargateSpotFailoverConstruct

### 7.1 设计目标

```typescript
/**
 * FargateSpotFailoverConstruct
 * 
 * 目标：在 Fargate Spot 实例被中断时，自动迁移到 On-Demand 实例
 * 场景：成本敏感的生产工作负载
 * 
 * 架构：
 *   Spot 任务 ──中断──> EventBridge ──> Lambda ──> ECS RunTask (On-Demand)
 */

export interface FargateSpotFailoverConstructProps {
  readonly cluster: ecs.ICluster;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly vpc: ec2.IVpc;
  readonly spotWeight?: number;        // 默认: 80
  readonly onDemandWeight?: number;    // 默认: 20
  readonly failoverToOnDemand?: boolean; // 默认: true
  readonly notificationTopic?: sns.ITopic;
}

export class FargateSpotFailoverConstruct extends Construct {
  public readonly spotService: ecs.FargateService;
  public readonly onDemandService: ecs.FargateService;
  public readonly failoverFunction: lambda.Function;
  
  constructor(scope: Construct, id: string, props: FargateSpotFailoverConstructProps) {
    super(scope, id);
    
    // 1. 创建容量提供商策略
    const cfnCluster = props.cluster.node.defaultChild as ecs.CfnCluster;
    
    // 2. Spot 服务
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
    
    // 3. 中断处理 Lambda
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
    
    // 4. EventBridge 规则
    const rule = new events.Rule(this, 'SpotInterruptionRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          stoppedReason: ['SIGTERM'],
          capacityProviderName: ['FARGATE_SPOT'], // 关键：只处理 Spot 中断
        },
      },
    });
    
    rule.addTarget(new targets.LambdaFunction(this.failoverFunction));
    
    // 5. 通知
    if (props.notificationTopic) {
      rule.addTarget(new targets.SnsTopic(props.notificationTopic, {
        message: events.RuleTargetInput.fromEventPath('$.detail'),
      }));
    }
  }
}
```

### 7.2 Lambda 处理函数

```typescript
// lambda/index.ts
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ecs = new ECSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any): Promise<void> => {
  const detail = event.detail;
  
  console.log('Spot interruption detected:', JSON.stringify(detail, null, 2));
  
  // 启动 On-Demand 替换任务
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
