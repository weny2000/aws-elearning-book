# AWS CDK L3 Construct デザインパターン

> 再利用可能で共有可能なエンタープライズ級 CDK アーキテクチャコンポーネントの構築

---

## 目次

1. [Construct 階層の概要](#1-construct-階層の概要)
2. [L3 Construct 設計原則](#2-l3-construct-設計原則)
3. [API 設計のベストプラクティス](#3-api-設計のベストプラクティス)
4. [実装パターン](#4-実装パターン)
5. [テスト戦略](#5-テスト戦略)
6. [リリースとメンテナンス](#6-リリースとメンテナンス)
7. [実践事例：FargateSpotFailoverConstruct](#7-実践事例fargatespotfailoverconstruct)

---

## 1. Construct 階層の概要

```
┌─────────────────────────────────────────────────────────────┐
│ L3 (Patterns) - 完全なアーキテクチャパターン                     │
│  • WebServiceConstruct                                       │
│  • ServerlessApiConstruct                                    │
│  • FargateSpotFailoverConstruct                              │
├─────────────────────────────────────────────────────────────┤
│ L2 (AWS Constructs) - AWS サービスラッパー                      │
│  • s3.Bucket                                                 │
│  • lambda.Function                                           │
│  • ecs.FargateService                                        │
├─────────────────────────────────────────────────────────────┤
│ L1 (CloudFormation Resources) - 生の CFN                     │
│  • CfnBucket                                                 │
│  • CfnFunction                                               │
└─────────────────────────────────────────────────────────────┘
```

### L3 Construct を作成すべきタイミング

| シナリオ | 推奨事項 |
|----------|----------|
| 同一アーキテクチャパターンを3つ以上のプロジェクトで使用 | L3 Construct を作成 |
| チームが標準化されたデプロイを必要とする | L3 Construct を作成 |
| 複雑性を隠蔽する必要がある | L3 Construct を作成 |
| 単一リソースの単純なラッパーである | L2 を使用 |
| 一度きりのデプロイである | L2 を使用 |

---

## 2. L3 Construct 設計原則

### 2.1 単一責任の原則

```typescript
// ❌ 不適切な設計：1つの Construct で多すぎることを行う
class BadMonolithConstruct extends Construct {
  constructor(scope: Construct, id: string, props: any) {
    super(scope, id);
    // VPC + ECS + RDS + ElastiCache + ALB + CloudFront...
    // 複雑すぎて再利用やテストが困難
  }
}

// ✅ 適切な設計：各 Construct に明確な責務を持たせる
class WebServiceConstruct extends Construct {
  // ALB + ECS/Fargate のみを担当
}

class DatabaseConstruct extends Construct {
  // RDS + バックアップ のみを担当
}

class CacheConstruct extends Construct {
  // ElastiCache のみを担当
}

// 組み合わせて使用
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

### 2.2 適切なデフォルト値

```typescript
export interface WebServiceConstructProps {
  readonly vpc: ec2.IVpc;
  readonly containerImage: ecs.ContainerImage;
  readonly cpu?: number;           // デフォルト: 256
  readonly memoryLimitMiB?: number; // デフォルト: 512
  readonly desiredCount?: number;   // デフォルト: 2
  readonly enableAutoScaling?: boolean; // デフォルト: true
  readonly healthCheckPath?: string;    // デフォルト: "/health"
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 適切なデフォルト値
    const cpu = props.cpu ?? 256;
    const memoryLimitMiB = props.memoryLimitMiB ?? 512;
    const desiredCount = props.desiredCount ?? 2;
    const enableAutoScaling = props.enableAutoScaling ?? true;
    const healthCheckPath = props.healthCheckPath ?? '/health';
    
    // 本番環境向けのデフォルト値
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: ecs.CpuArchitecture.ARM64, // Graviton2 をデフォルトとする
      },
    });
    
    // CloudWatch Logs を自動的に有効化
    // X-Ray を自動的に有効化（設定されている場合）
    // セキュリティグループを自動的に設定
  }
}
```

### 2.3 Escape Hatch パターン

```typescript
export class SecureBucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly cfnBucket: s3.CfnBucket; // L1 を escape hatch 用に公開
  
  constructor(scope: Construct, id: string, props?: SecureBucketProps) {
    super(scope, id);
    
    this.bucket = new s3.Bucket(this, 'Bucket', {
      encryption: s3.BucketEncryption.KMS_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });
    
    // L1 参照を保持
    this.cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
    
    // L2 でサポートされていないプロパティは L1 で設定
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
  
  // ユーザーが L1 プロパティをカスタマイズできるようにする
  public addCfnPropertyOverride(propertyPath: string, value: any): void {
    this.cfnBucket.addPropertyOverride(propertyPath, value);
  }
}

// escape hatch の使用
const bucket = new SecureBucketConstruct(stack, 'SecureBucket');
bucket.addCfnPropertyOverride('LoggingConfiguration.DestinationBucketName', 'my-logs');
```

---

## 3. API 設計のベストプラクティス

### 3.1 Props インターフェース設計

```typescript
// 階層型 Props 設計
// 基本インターフェース
interface BaseConstructProps {
  readonly vpc: ec2.IVpc;
  readonly environment: string;
  readonly tags?: { [key: string]: string };
}

// コンピューティングリソース設定
interface ComputeProps {
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  readonly desiredCount?: number;
  readonly enableAutoScaling?: boolean;
  readonly autoScalingTargetCpu?: number;
}

// モニタリング設定
interface MonitoringProps {
  readonly enableXRay?: boolean;
  readonly logRetentionDays?: number;
  readonly alarmEmail?: string;
}

// 複合インターフェース
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

### 3.2 出力設計

```typescript
export class WebServiceConstruct extends Construct {
  // 公開アクセス可能なプロパティ
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly endpoint: string;
  public readonly cloudMapService?: cloudmap.Service;
  
  // 内部プロパティは private のまま保持
  private readonly taskDefinition: ecs.FargateTaskDefinition;
  private readonly cluster: ecs.Cluster;
  
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    // ... 実装
  }
  
  // 便利なメソッドを提供
  public addAutoScaling(maxCapacity: number, targetCpuUtilization?: number): void {
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: this.service.desiredCount,
      maxCapacity,
    });
    
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: targetCpuUtilization ?? 70,
    });
  }
  
  // 外部接続を許可
  public connections(): ec2.Connections {
    return this.service.connections;
  }
}
```

---

## 4. 実装パターン

### 4.1 Aspect 統合

```typescript
// 自動タグ付け Aspect
import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export interface AutoTaggingAspectProps {
  readonly tags: { [key: string]: string };
  readonly excludeTypes?: string[];
}

export class AutoTaggingAspect implements cdk.IAspect {
  constructor(private readonly props: AutoTaggingAspectProps) {}
  
  public visit(node: IConstruct): void {
    // 特定のタイプを除外
    if (this.props.excludeTypes?.some(type => node.constructor.name.includes(type))) {
      return;
    }
    
    // タグ付け可能なリソースのみにタグを追加
    if (cdk.TagManager.isTaggable(node)) {
      Object.entries(this.props.tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value, {
          priority: 100, // 高優先度
        });
      });
    }
  }
}

// L3 Construct での使用
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 実装...
    
    // Aspect の適用
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

### 4.2 検証パターン

```typescript
// 構築時の検証
export interface WebServiceConstructProps {
  readonly desiredCount: number;
  readonly cpu: number;
  readonly memoryLimitMiB: number;
}

export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // CPU/Memory の組み合わせを検証
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
    
    // HTTPS 設定を検証
    if (props.enableHttps && !props.certificateArn) {
      throw new Error('certificateArn is required when enableHttps is true');
    }
  }
}
```

---

## 5. テスト戦略

### 5.1 ユニットテスト

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
  
  // リソース作成の検証
  template.hasResourceProperties('AWS::ECS::Service', {
    LaunchType: 'FARGATE',
  });
  
  template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
    Type: 'application',
  });
  
  // タグの検証
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
      memoryLimitMiB: 4096, // 256 vCPU では 4GB をサポートしない
    });
  }).toThrow(/Invalid CPU\/Memory combination/);
});
```

### 5.2 インテグレーションテスト

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
  // オプション：実際のデプロイ検証
  // stackUpdateWorkflow: true,
});

app.synth();
```

---

## 6. リリースとメンテナンス

### 6.1 npm 公開設定

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

### 6.2 バージョニング戦略

```typescript
// セマンティックバージョニングの例
// 1.0.0 - 初期リリース
// 1.1.0 - 新機能：自動スケーリング対応を追加（後方互換性あり）
// 1.1.1 - バグ修正：ヘルスチェックパス問題を修正
// 2.0.0 - 破壊的変更：Props インターフェースの再設計

// 非推奨警告
/**
 * @deprecated {@link WebServiceConstructProps.enableHttps} を使用してください
 */
export interface HttpsConfig {
  readonly certificateArn: string;
}

// 移行ガイド
export class WebServiceConstruct extends Construct {
  constructor(scope: Construct, id: string, props: WebServiceConstructProps) {
    super(scope, id);
    
    // 後方互換性の処理
    if ('httpsConfig' in (props as any)) {
      Annotations.of(this).addWarning(
        'httpsConfig is deprecated. Use enableHttps and certificateArn instead.'
      );
    }
  }
}
```

---

## 7. 実践事例：FargateSpotFailoverConstruct

### 7.1 設計目標

```typescript
/**
 * FargateSpotFailoverConstruct
 * 
 * 目標：Fargate Spot インスタンスが中断された際に、自動的に On-Demand インスタンスに移行する
 * シナリオ：コスト重視の本番ワークロード
 * 
 * アーキテクチャ：
 *   Spot タスク ──中断──> EventBridge ──> Lambda ──> ECS RunTask (On-Demand)
 */

export interface FargateSpotFailoverConstructProps {
  readonly cluster: ecs.ICluster;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly vpc: ec2.IVpc;
  readonly spotWeight?: number;        // デフォルト: 80
  readonly onDemandWeight?: number;    // デフォルト: 20
  readonly failoverToOnDemand?: boolean; // デフォルト: true
  readonly notificationTopic?: sns.ITopic;
}

export class FargateSpotFailoverConstruct extends Construct {
  public readonly spotService: ecs.FargateService;
  public readonly onDemandService: ecs.FargateService;
  public readonly failoverFunction: lambda.Function;
  
  constructor(scope: Construct, id: string, props: FargateSpotFailoverConstructProps) {
    super(scope, id);
    
    // 1. キャパシティプロバイダー戦略を作成
    const cfnCluster = props.cluster.node.defaultChild as ecs.CfnCluster;
    
    // 2. Spot サービス
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
    
    // 3. 中断処理 Lambda
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
    
    // 4. EventBridge ルール
    const rule = new events.Rule(this, 'SpotInterruptionRule', {
      eventPattern: {
        source: ['aws.ecs'],
        detailType: ['ECS Task State Change'],
        detail: {
          stoppedReason: ['SIGTERM'],
          capacityProviderName: ['FARGATE_SPOT'], // 重要：Spot 中断のみを処理
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

### 7.2 Lambda ハンドラ関数

```typescript
// lambda/index.ts
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';

const ecs = new ECSClient({ region: process.env.AWS_REGION });

export const handler = async (event: any): Promise<void> => {
  const detail = event.detail;
  
  console.log('Spot interruption detected:', JSON.stringify(detail, null, 2));
  
  // On-Demand 代替タスクを開始
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

*AWS DevTools Hero Learning Path の一部*
