# AWS CDK 実践パターン集

> エンタープライズ実装のための CDK パターンカタログ

---

## 目次

1. [Construct 階層設計](#1-construct-階層設計)
2. [Aspect パターン](#2-aspect-パターン)
3. [CDK Pipelines](#3-cdk-pipelines)
4. [テスト戦略](#4-テスト戦略)
5. [運用パターン](#5-運用パターン)

---

## 1. Construct 階層設計

### 1.1 L1/L2/L3 の使い分け

```typescript
// L1: CloudFormation リソース (生の CFN)
// 使用シナリオ: L2 で未サポートの機能
const cfnBucket = new s3.CfnBucket(this, 'RawBucket', {
  bucketName: 'my-bucket',
  versioningConfiguration: {
    status: 'Enabled',
  },
  // L2 では未サポートの高度な設定
  objectLockEnabled: true,
});

// L2: AWS コンストラクトライブラリ
// 使用シナリオ: 標準的なユースケース
const bucket = new s3.Bucket(this, 'StandardBucket', {
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
  lifecycleRules: [
    {
      transitions: [
        {
          storageClass: s3.StorageClass.GLACIER,
          transitionAfter: cdk.Duration.days(90),
        },
      ],
    },
  ],
});

// L3: パターンライブラリ
// 使用シナリオ: 完全なアーキテクチャ
const staticSite = new s3deploy.BucketDeployment(this, 'Deploy', {
  sources: [s3deploy.Source.asset('./website')],
  destinationBucket: bucket,
  distribution,
  distributionPaths: ['/*'],
});
```

### 1.2 カスタム L3 Construct の設計

```typescript
// lib/constructs/web-service.ts
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface WebServiceProps {
  readonly vpc: ec2.IVpc;
  readonly image: ecs.ContainerImage;
  readonly port?: number;
  readonly desiredCount?: number;
  readonly cpu?: number;
  readonly memoryLimitMiB?: number;
  readonly healthCheckPath?: string;
  readonly enableAutoScaling?: boolean;
}

export class WebService extends Construct {
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly endpoint: string;

  constructor(scope: Construct, id: string, props: WebServiceProps) {
    super(scope, id);

    const {
      vpc,
      image,
      port = 8080,
      desiredCount = 2,
      cpu = 256,
      memoryLimitMiB = 512,
      healthCheckPath = '/health',
      enableAutoScaling = false,
    } = props;

    // ALB
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      vpc,
      internetFacing: true,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

    // Task Definition
    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu,
      memoryLimitMiB,
    });

    taskDef.addContainer('app', {
      image,
      portMappings: [{ containerPort: port }],
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'app' }),
    });

    // Fargate Service
    this.service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount,
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port,
      targets: [this.service],
      healthCheck: {
        path: healthCheckPath,
      },
    });

    // Listener
    this.loadBalancer.addListener('Listener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    this.endpoint = this.loadBalancer.loadBalancerDnsName;

    // Auto Scaling
    if (enableAutoScaling) {
      const scaling = this.service.autoScaleTaskCount({
        minCapacity: desiredCount,
        maxCapacity: desiredCount * 5,
      });

      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
      });
    }
  }
}

// 使用例
const webService = new WebService(this, 'MyWebService', {
  vpc,
  image: ecs.ContainerImage.fromRegistry('nginx:latest'),
  port: 80,
  desiredCount: 3,
  enableAutoScaling: true,
});

new cdk.CfnOutput(this, 'Endpoint', {
  value: webService.endpoint,
});
```

---

## 2. Aspect パターン

### 2.1 クロスカッティングコンサーンの実装

```typescript
// aspects/backup-aspect.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as rds from 'aws-cdk-lib/aws-rds';
import { IConstruct } from 'constructs';

export class BackupAspect implements cdk.IAspect {
  constructor(private readonly retentionDays: number = 30) {}

  public visit(node: IConstruct): void {
    // DynamoDB テーブルに自動バックアップを追加
    if (node instanceof dynamodb.Table) {
      // ポイントインタイムリカバリを有効化
      (node as dynamodb.Table).enablePitr();
    }

    // RDS インスタンスにバックアップ設定
    if (node instanceof rds.DatabaseInstance) {
      // CloudFormation プロパティをオーバーライド
      const cfnDb = node.node.defaultChild as rds.CfnDBInstance;
      cfnDb.addPropertyOverride('BackupRetentionPeriod', this.retentionDays);
    }
  }
}

// 適用
cdk.Aspects.of(app).add(new BackupAspect(35));
```

### 2.2 タグ付け Aspect

```typescript
// aspects/tagging-aspect.ts
import * as cdk from 'aws-cdk-lib';
import { IConstruct } from 'constructs';

export class TaggingAspect implements cdk.IAspect {
  constructor(
    private readonly tags: { [key: string]: string }
  ) {}

  public visit(node: IConstruct): void {
    if (cdk.TagManager.isTaggable(node)) {
      Object.entries(this.tags).forEach(([key, value]) => {
        cdk.Tags.of(node).add(key, value);
      });
    }
  }
}

// 適用
cdk.Aspects.of(app).add(new TaggingAspect({
  Project: 'MyProject',
  Environment: 'Production',
  Owner: 'PlatformTeam',
  CostCenter: '12345',
}));
```

### 2.3 セキュリティ Aspect

```typescript
// aspects/security-aspect.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { IConstruct } from 'constructs';

export class SecurityAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // S3 バケット暗号化の強制
    if (node instanceof s3.CfnBucket) {
      if (!node.bucketEncryption) {
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [
            {
              serverSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        };
      }
    }

    // SQS 暗号化の強制
    if (node instanceof sqs.CfnQueue) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sqs';
      }
    }

    // SNS 暗号化の強制
    if (node instanceof sns.CfnTopic) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sns';
      }
    }
  }
}

// 適用
cdk.Aspects.of(app).add(new SecurityAspect());
```

---

## 3. CDK Pipelines

### 3.1 自己変異型パイプライン

```typescript
// bin/pipeline.ts
import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { MyApplicationStage } from '../lib/my-application-stage';

class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ソースリポジトリ
    const repo = new codecommit.Repository(this, 'Repository', {
      repositoryName: 'MyApplication',
    });

    // パイプライン
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'MyApplicationPipeline',
      synth: new pipelines.CodeBuildStep('Synth', {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
        installCommands: ['npm install -g aws-cdk'],
        commands: [
          'npm ci',
          'npm run build',
          'npm run test',
          'cdk synth',
        ],
      }),
    });

    // 開発環境
    const devStage = new MyApplicationStage(this, 'Dev', {
      env: { account: '111111111111', region: 'ap-northeast-1' },
    });
    pipeline.addStage(devStage, {
      post: [
        new pipelines.ShellStep('Test', {
          commands: [
            'curl -Ssf $ENDPOINT_URL/health',
          ],
          envFromCfnOutputs: {
            ENDPOINT_URL: devStage.endpointUrl,
          },
        }),
      ],
    });

    // 本番環境（手動承認あり）
    const prodStage = new MyApplicationStage(this, 'Prod', {
      env: { account: '222222222222', region: 'ap-northeast-1' },
    });
    pipeline.addStage(prodStage, {
      pre: [
        new pipelines.ManualApprovalStep('Approval'),
      ],
    });
  }
}

const app = new cdk.App();
new PipelineStack(app, 'PipelineStack');
app.synth();
```

### 3.2 Wave による並列デプロイ

```typescript
// 複数リージョンへの並列デプロイ
const wave = pipeline.addWave('GlobalDeployment');

wave.addStage(new MyApplicationStage(this, 'Tokyo', {
  env: { region: 'ap-northeast-1' },
}));

wave.addStage(new MyApplicationStage(this, 'Singapore', {
  env: { region: 'ap-southeast-1' },
}));

wave.addStage(new MyApplicationStage(this, 'Sydney', {
  env: { region: 'ap-southeast-2' },
}));
```

---

## 4. テスト戦略

### 4.1 単体テスト

```typescript
// test/stack.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as MyStack from '../lib/my-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new MyStack.MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::S3::Bucket', {
    VersioningConfiguration: {
      Status: 'Enabled',
    },
  });
});

test('Lambda Function Properties', () => {
  const app = new cdk.App();
  const stack = new MyStack.MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x',
    MemorySize: 256,
    Environment: {
      Variables: Match.objectLike({
        NODE_ENV: 'production',
      }),
    },
  });
});
```

### 4.2 スナップショットテスト

```typescript
// test/__snapshots__/stack.test.ts.snap と比較
test('Stack Snapshot', () => {
  const app = new cdk.App();
  const stack = new MyStack.MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  expect(template.toJSON()).toMatchSnapshot();
});
```

### 4.3 統合テスト

```typescript
// test/integration.test.ts
import * as AWS from 'aws-sdk';

describe('Infrastructure Integration', () => {
  const cloudformation = new AWS.CloudFormation();

  beforeAll(async () => {
    // スタックが存在することを確認
    await cloudformation.describeStacks({
      StackName: 'MyStack',
    }).promise();
  });

  test('API Gateway is accessible', async () => {
    const apigateway = new AWS.APIGateway();
    const apis = await apigateway.getRestApis().promise();
    
    const api = apis.items?.find(a => a.name === 'MyApi');
    expect(api).toBeDefined();
  });

  test('Lambda functions are deployed', async () => {
    const lambda = new AWS.Lambda();
    const functions = await lambda.listFunctions().promise();
    
    const handler = functions.Functions?.find(
      f => f.FunctionName?.includes('MyHandler')
    );
    expect(handler).toBeDefined();
    expect(handler?.Runtime).toBe('nodejs18.x');
  });
});
```

---

## 5. 運用パターン

### 5.1 マルチ環境設定

```typescript
// config/environments.ts
export interface EnvironmentConfig {
  readonly account: string;
  readonly region: string;
  readonly environment: string;
  readonly vpcCidr: string;
  readonly instanceType: string;
  readonly minCapacity: number;
  readonly maxCapacity: number;
}

export const environments: Record<string, EnvironmentConfig> = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'ap-northeast-1',
    environment: 'development',
    vpcCidr: '10.0.0.0/16',
    instanceType: 't3.micro',
    minCapacity: 1,
    maxCapacity: 2,
  },
  staging: {
    account: process.env.CDK_DEFAULT_ACCOUNT!,
    region: 'ap-northeast-1',
    environment: 'staging',
    vpcCidr: '10.1.0.0/16',
    instanceType: 't3.small',
    minCapacity: 2,
    maxCapacity: 4,
  },
  prod: {
    account: '123456789012',
    region: 'ap-northeast-1',
    environment: 'production',
    vpcCidr: '10.2.0.0/16',
    instanceType: 't3.medium',
    minCapacity: 3,
    maxCapacity: 20,
  },
};

// 使用例
const envName = app.node.tryGetContext('env') || 'dev';
const config = environments[envName];
```

### 5.2 コンテキスト利用

```bash
# デプロイ時にコンテキストを指定
cdk deploy -c env=prod -c feature_flag_x=true
```

```typescript
// コンテキストの取得
const env = this.node.tryGetContext('env') || 'dev';
const featureFlag = this.node.tryGetContext('feature_flag_x') === 'true';

if (featureFlag) {
  // 新機能を有効化
}
```

### 5.3 デプロイスクリプト

```bash
#!/bin/bash
# deploy.sh

ENV=${1:-dev}
ACTION=${2:-deploy}

case $ACTION in
  synth)
    cdk synth -c env=$ENV
    ;;
  diff)
    cdk diff -c env=$ENV
    ;;
  deploy)
    if [ "$ENV" == "prod" ]; then
      echo "警告: 本番環境へのデプロイです"
      read -p "続行しますか？ (yes/no): " confirm
      [ "$confirm" != "yes" ] && exit 0
    fi
    cdk deploy -c env=$ENV --require-approval never
    ;;
  destroy)
    cdk destroy -c env=$ENV
    ;;
  *)
    echo "使用方法: $0 [dev|staging|prod] [synth|diff|deploy|destroy]"
    exit 1
    ;;
esac
```

---

## 6. パフォーマンス最適化

### 6.1 並列合成

```typescript
// cdk.json
{
  "app": "npx ts-node bin/app.ts",
  "context": {
    "@aws-cdk/core:newStyleStackSynthesis": true
  }
}
```

### 6.2 バンドル最適化

```typescript
// Lambda 関数のバンドル設定
const handler = new lambda.NodejsFunction(this, 'Handler', {
  entry: 'src/handler.ts',
  bundling: {
    minify: true,
    sourceMap: true,
    target: 'es2020',
    // 除外するモジュール
    externalModules: ['aws-sdk'],
  },
});
```

---

## 7. トラブルシューティング

### 7.1 よくあるエラー

| エラー | 原因 | 解決策 |
|--------|------|--------|
| `Asset is not found` | アセットパスが不正 | パスを確認 |
| `Context provider error` | VPC 検索失敗 | 正しい VPC ID を指定 |
| `Policy size exceeded` | IAM ポリシーが大きすぎる | ポリシーを分割 |
| `Circular dependency` | 循環依存 | 依存関係をリファクタリング |

### 7.2 デバッグテクニック

```typescript
// 合成テンプレートの確認
const app = new cdk.App();
const stack = new MyStack(app, 'Test');
console.log(JSON.stringify(app.synth().getStackByName('Test').template, null, 2));

// コンストラクトツリーの表示
console.log(stack.node.children);
```

---

*AWS DevTools Hero 学習パスの一部*
