# AWS Code 系列精通指南

> CodeCommit、CodeBuild、CodePipeline、CodeDeploy 企业级实践

---

## 目录

1. [AWS CodeCommit 深度解析](#1-aws-codecommit-深度解析)
2. [AWS CodeBuild 高级特性](#2-aws-codebuild-高级特性)
3. [AWS CodePipeline 企业级模式](#3-aws-codepipeline-企业级模式)
4. [AWS CodeDeploy 部署策略](#4-aws-codedeploy-部署策略)
5. [完整 CI/CD 架构实战](#5-完整-cicd-架构实战)

---

## 1. AWS CodeCommit 深度解析

### 1.1 为什么选择 CodeCommit

```
GitHub Enterprise vs CodeCommit 决策矩阵：

| 维度 | GitHub Enterprise | CodeCommit |
|------|------------------|------------|
| 成本 | $21/用户/月 | $1/月（前5用户免费） |
| IAM 集成 | OAuth 配置 | 原生集成 |
| 合规 | 需要额外配置 | 符合 SOC/PCI/HIPAA |
| 私有 VPC | 需要 GitHub AE | 原生支持 |
```

### 1.2 安全最佳实践

```bash
# 1. 启用 IAM 条件键
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "codecommit:GitPull",
        "codecommit:GitPush"
      ],
      "Resource": "*",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": [
            "10.0.0.0/8",
            "172.16.0.0/12"
          ]
        }
      }
    }
  ]
}

# 2. 配置禁止推送到 main 分支
aws codecommit put-repository-triggers \
  --repository-name my-repo \
  --triggers file://triggers.json

# triggers.json
[
  {
    "name": "BlockDirectMainPush",
    "destinationArn": "arn:aws:lambda:...:function:block-push",
    "customData": "",
    "branches": ["main"],
    "events": ["updateReference"]
  }
]
```

### 1.3 与 CodeGuru Reviewer 集成

```yaml
# 自动代码审查配置
RepositoryAssociation:
  Type: AWS::CodeGuruReviewer::RepositoryAssociation
  Properties:
    Name: my-repo
    Type: CodeCommit
    ConnectionArn: !Ref CodeStarConnection

# 启用自动审查的触发器
RepositoryTrigger:
  Type: AWS::CodeCommit::Trigger
  Properties:
    RepositoryName: my-repo
    Triggers:
      - Name: CodeGuruReview
        DestinationArn: !GetAtt CodeGuruFunction.Arn
        Events: [pullRequestCreated, pullRequestSourceBranchUpdated]
```

---

## 2. AWS CodeBuild 高级特性

### 2.1 Buildspec 深度优化

```yaml
# buildspec-optimized.yml
version: 0.2

env:
  secrets-manager:
    DOCKERHUB_TOKEN: dockerhub/token
  variables:
    AWS_DEFAULT_REGION: ap-northeast-1

# 批处理构建（并行化）
batch:
  fast-fail: false
  
  # 并行构建矩阵
  build-matrix:
    - identifier: linux_small
      env:
        type: LINUX_CONTAINER
        compute-type: BUILD_GENERAL1_SMALL
    - identifier: linux_large
      env:
        type: LINUX_CONTAINER
        compute-type: BUILD_GENERAL1_LARGE
        
  # 按顺序的构建图
  build-graph:
    - identifier: build
      buildspec: buildspec-build.yml
    - identifier: test
      buildspec: buildspec-test.yml
      depend-on:
        - build
    - identifier: deploy
      buildspec: buildspec-deploy.yml
      depend-on:
        - test

phases:
  install:
    runtime-versions:
      nodejs: 18
      python: 3.11
      docker: 23
    commands:
      - echo "Installing global dependencies..."
      - pip install awscli --upgrade
      
  pre_build:
    commands:
      - echo "Pre-build started at $(date)"
      - npm ci --include=dev
      - npm run lint
      
  build:
    commands:
      - npm run build:prod
      - npm run test:ci -- --coverage
      
  post_build:
    commands:
      - echo "Build completed at $(date)"
      
reports:
  # 测试报告
  test-reports:
    files:
      - 'reports/junit.xml'
    file-format: JUNITXML
    
  # 覆盖率报告
  coverage-reports:
    files:
      - 'coverage/clover.xml'
    file-format: CLOVERXML
    
  # SARIF 安全扫描报告
  security-reports:
    files:
      - 'reports/security.sarif'
    file-format: SARIF

cache:
  paths:
    # Docker 层缓存（需要自定义镜像）
    - '/var/lib/docker/**/*'
    # 依赖缓存
    - 'node_modules/**/*'
    - '/root/.npm/**/*'

artifacts:
  files:
    - 'dist/**/*'
    - 'appspec.yml'
    - 'scripts/**/*'
  discard-paths: no
  secondary-artifacts:
    deploy-package:
      files:
        - 'dist/**/*'
      name: deploy-package-$(date +%Y%m%d-%H%M%S)
```

### 2.2 本地调试技巧

```bash
# 1. 使用 AWS CodeBuild 本地代理
# 安装
docker pull amazon/aws-codebuild-local:latest --disable-content-trust=false

# 2. 创建本地构建脚本
#!/bin/bash
# local-build.sh

docker run \
  -it \
  -v $(pwd):/src \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" \
  -e "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" \
  -e "AWS_DEFAULT_REGION=ap-northeast-1" \
  amazon/aws-codebuild-local:latest \
  -i aws/codebuild/standard:5.0 \
  -a output \
  -b buildspec.yml

# 3. 运行本地构建
chmod +x local-build.sh
./local-build.sh
```

### 2.3 构建缓存策略

```typescript
// CDK 构建项目配置缓存
const buildProject = new codebuild.Project(this, 'CachedBuild', {
  cache: codebuild.Cache.local(
    codebuild.LocalCacheMode.SOURCE,
    codebuild.LocalCacheMode.DOCKER_LAYER,
    codebuild.LocalCacheMode.CUSTOM
  ),
  // 或者 S3 缓存
  // cache: codebuild.Cache.bucket(cacheBucket),
  
  environment: {
    buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
    computeType: codebuild.ComputeType.LARGE,
  },
  
  buildSpec: codebuild.BuildSpec.fromObject({
    version: '0.2',
    phases: {
      install: {
        commands: [
          // 检查缓存
          'if [ -d node_modules ]; then echo "Cache hit"; else npm ci; fi',
        ],
      },
    },
  }),
});
```

---

## 3. AWS CodePipeline 企业级模式

### 3.1 多环境流水线架构

```mermaid
flowchart LR
    Source[Source] --> Build[Build]
    Build --> Dev[Dev部署]
    Dev -->|自动化测试| DevTest[Dev测试]
    DevTest -->|人工审批| Staging[Staging部署]
    Staging -->|Smoke测试| StagingTest[Staging测试]
    StagingTest -->|人工审批| Prod[Production部署]
    Prod -->|Canary| CanaryTest[Canary验证]
    CanaryTest --> FullProd[全流量]
```

```yaml
# CloudFormation 多环境流水线
AWSTemplateFormatVersion: '2010-09-09'
Resources:
  MultiEnvPipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: MultiEnvironmentPipeline
      RoleArn: !GetAtt PipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      
      Stages:
        # Source
        - Name: Source
          Actions:
            - Name: Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: 1
              Configuration:
                ConnectionArn: !Ref GitHubConnection
                FullRepositoryId: myorg/myapp
                BranchName: main
              OutputArtifacts:
                - Name: SourceCode
        
        # Build
        - Name: Build
          Actions:
            - Name: Build
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref BuildProject
              InputArtifacts:
                - Name: SourceCode
              OutputArtifacts:
                - Name: BuildArtifact
        
        # Deploy to Dev
        - Name: DeployToDev
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: 1
              Configuration:
                ClusterName: !Ref DevCluster
                ServiceName: !Ref DevService
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildArtifact
        
        # Dev Tests
        - Name: DevTests
          Actions:
            - Name: IntegrationTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref IntegrationTestProject
              InputArtifacts:
                - Name: SourceCode
        
        # Approval for Staging
        - Name: PromoteToStaging
          Actions:
            - Name: Approval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: "Approve deployment to Staging"
                ExternalEntityLink: !Sub "https://github.com/myorg/myapp/commit/#{Source.SourceRevision}"
        
        # Deploy to Staging
        - Name: DeployToStaging
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: ECS
                Version: 1
              Configuration:
                ClusterName: !Ref StagingCluster
                ServiceName: !Ref StagingService
                FileName: imagedefinitions.json
              InputArtifacts:
                - Name: BuildArtifact
            
            - Name: SmokeTests
              ActionTypeId:
                Category: Test
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              RunOrder: 2
              Configuration:
                ProjectName: !Ref SmokeTestProject
        
        # Approval for Production
        - Name: PromoteToProduction
          Actions:
            - Name: Approval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: "Approve deployment to Production"
        
        # Canary Deploy to Production
        - Name: DeployToProduction
          Actions:
            - Name: CanaryDeploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CodeDeploy
                Version: 1
              Configuration:
                ApplicationName: !Ref CodeDeployApplication
                DeploymentGroupName: !Ref ProdDeploymentGroup
              InputArtifacts:
                - Name: BuildArtifact
```

### 3.2 跨账户部署

```typescript
// CDK 跨账户部署配置
const pipeline = new codepipeline.Pipeline(this, 'CrossAccountPipeline', {
  crossAccountKeys: true, // 启用跨账户密钥
  stages: [
    // ... source and build stages
    {
      stageName: 'DeployToProd',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Deploy',
          templatePath: buildArtifact.atPath('template.yaml'),
          stackName: 'MyApp',
          adminPermissions: true,
          role: iam.Role.fromRoleArn(
            this,
            'CrossAccountRole',
            'arn:aws:iam::PROD_ACCOUNT:role/CrossAccountRole'
          ),
          deploymentRole: iam.Role.fromRoleArn(
            this,
            'DeploymentRole',
            'arn:aws:iam::PROD_ACCOUNT:role/CloudFormationRole'
          ),
        }),
      ],
    },
  ],
});
```

---

## 4. AWS CodeDeploy 部署策略

### 4.1 ECS Blue/Green 部署

```typescript
// CDK Blue/Green 部署配置
const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'BlueGreenDG', {
  service: ecsService,
  blueGreenDeploymentConfig: {
    blueTargetGroup,
    greenTargetGroup,
    listener,
    testListener, // 可选：用于测试流量
  },
  deploymentConfig: codedeploy.EcsDeploymentConfig.CANARY_10_PERCENT_5_MINUTES,
  autoRollback: {
    failedDeployment: true,
    stoppedDeployment: true,
    deploymentInAlarm: true, // 在告警时回滚
  },
});

// 创建告警
const highErrorRate = new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: lb.metrics.custom('HTTPCode_Target_5XX_Count'),
  threshold: 10,
  evaluationPeriods: 2,
});

deploymentGroup.addAlarm(highErrorRate);
```

```yaml
# appspec.yml for ECS Blue/Green
version: 0.0
Resources:
  - TargetService:
      Type: AWS::ECS::Service
      Properties:
        TaskDefinition: <TASK_DEFINITION>
        LoadBalancerInfo:
          ContainerName: app
          ContainerPort: 8080
        PlatformVersion: LATEST

Hooks:
  # 安装前钩子
  - BeforeInstall: "LambdaFunctionToRunBeforeInstall"
  
  # 流量转移后验证
  - AfterAllowTestTraffic: "LambdaFunctionToValidateTestTraffic"
  
  # 生产流量转移前
  - BeforeAllowTraffic: "LambdaFunctionToRunBeforeAllowTraffic"
  
  # 最终验证
  - AfterAllowTraffic: "LambdaFunctionToRunAfterAllowTraffic"
```

### 4.2 Lambda 线性部署

```typescript
// Lambda 金丝雀部署
const alias = new lambda.Alias(this, 'LambdaAlias', {
  aliasName: 'prod',
  version: lambdaFunction.currentVersion,
});

new codedeploy.LambdaDeploymentGroup(this, 'CanaryDeployment', {
  alias,
  deploymentConfig: codedeploy.LambdaDeploymentConfig.CANARY_10_PERCENT_30_MINUTES,
  autoRollback: {
    failedDeployment: true,
    stoppedDeployment: true,
  },
  hooks: {
    beforeAllowTraffic: new lambda.Function(this, 'BeforeAllow', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Pre-traffic check');
          // 执行健康检查
          return 'Succeeded';
        };
      `),
    }),
  },
});
```

---

## 5. 完整 CI/CD 架构实战

### 5.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Developer                            │
└───────────────────────┬─────────────────────────────────────┘
                        │ Git Push
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub (Source)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ Webhook
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                AWS CodePipeline                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Source  │─▶│  Build   │─▶│  Test    │─▶│  Deploy  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
            ┌───────────┼───────────┐
            ▼           ▼           ▼
       ┌────────┐ ┌──────────┐ ┌──────────┐
       │CodeBuild│ │CodeBuild │ │CodeDeploy│
       │ Build  │ │  Test    │ │  Deploy  │
       └────────┘ └──────────┘ └──────────┘
            │           │           │
            ▼           ▼           ▼
       ┌────────┐ ┌──────────┐ ┌──────────┐
       │  ECR   │ │ CloudWatch│ │   ECS    │
       │ Images │ │  Metrics  │ │ Service  │
       └────────┘ └──────────┘ └──────────┘
```

### 5.2 完整 CDK 代码

```typescript
// bin/cicd-complete.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CompleteCiCdStack } from '../lib/complete-cicd-stack';

const app = new cdk.App();

new CompleteCiCdStack(app, 'CompleteCiCdStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
  tags: {
    Project: 'CiCdDemo',
    Environment: 'Production',
  },
});
```

```typescript
// lib/complete-cicd-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export class CompleteCiCdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. 创建 CodeCommit 仓库
    const repo = new codecommit.Repository(this, 'AppRepo', {
      repositoryName: 'my-application',
      description: 'Application source code',
    });

    // 2. 创建 ECR 仓库
    const ecrRepo = new ecr.Repository(this, 'AppEcr', {
      repositoryName: 'my-app',
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 3. 创建 ECS 集群和服务
    const vpc = new ec2.Vpc(this, 'AppVpc', { maxAzs: 2 });
    
    const cluster = new ecs.Cluster(this, 'AppCluster', {
      vpc,
      containerInsights: true,
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    const container = taskDef.addContainer('app', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepo),
      portMappings: [{ containerPort: 8080 }],
    });

    const service = new ecs.FargateService(this, 'AppService', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 2,
    });

    // 4. 创建 CodeBuild 项目
    const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        computeType: codebuild.ComputeType.MEDIUM,
      },
      environmentVariables: {
        AWS_DEFAULT_REGION: { value: this.region },
        AWS_ACCOUNT_ID: { value: this.account },
        IMAGE_REPO_NAME: { value: ecrRepo.repositoryName },
      },
    });

    ecrRepo.grantPullPush(buildProject);

    // 5. 创建通知 SNS Topic
    const pipelineNotifications = new sns.Topic(this, 'PipelineNotifications');
    pipelineNotifications.addSubscription(
      new sns_subscriptions.EmailSubscription('team@example.com')
    );

    // 6. 创建 CodePipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    const pipeline = new codepipeline.Pipeline(this, 'AppPipeline', {
      pipelineName: 'MyApplicationPipeline',
      restartExecutionOnUpdate: true,
      stages: [
        // Source 阶段
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'CodeCommit_Source',
              repository: repo,
              branch: 'main',
              output: sourceOutput,
            }),
          ],
        },
        
        // Build 阶段
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build_and_Push',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        
        // Deploy 阶段
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'Deploy_to_ECS',
              service,
              imageFile: new codepipeline.ArtifactPath(
                buildOutput,
                'imagedefinitions.json'
              ),
            }),
          ],
        },
      ],
    });

    // 7. 添加 CloudWatch 告警
    new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      alarmDescription: 'High CPU usage in ECS service',
    });

    // 8. 输出
    new cdk.CfnOutput(this, 'RepositoryCloneUrl', {
      value: repo.repositoryCloneUrlHttp,
      description: 'Clone URL for the CodeCommit repository',
    });

    new cdk.CfnOutput(this, 'PipelineUrl', {
      value: `https://${this.region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view`,
      description: 'CodePipeline console URL',
    });
  }
}
```

---

## 6. 总结与最佳实践

### 6.1 AWS Code 系列选型指南

| 场景 | 推荐服务 | 原因 |
|------|----------|------|
| 私有仓库 + IAM 集成 | CodeCommit | 原生 IAM、合规友好 |
| Serverless 构建 | CodeBuild | 按需付费、无需维护 |
| 多环境部署 | CodePipeline | 可视化、内置审批 |
| ECS/EC2 部署 | CodeDeploy | 蓝绿、金丝雀支持 |
| Lambda 部署 | CodeDeploy | 线性、金丝雀支持 |

### 6.2 常见陷阱

```
❌ 陷阱 1: 在 buildspec 中硬编码密钥
✅ 解决: 使用 Secrets Manager 或 Parameter Store

❌ 陷阱 2: 没有缓存导致构建缓慢
✅ 解决: 启用 localCache 或 S3 缓存

❌ 陷阱 3: Pipeline 权限过大
✅ 解决: 使用最小权限原则，必要时使用角色切换

❌ 陷阱 4: 没有通知机制
✅ 解决: 配置 SNS 通知 CloudWatch Events

❌ 陷阱 5: 构建环境不一致
✅ 解决: 使用 Docker 镜像标准化环境
```

---

*Part of AWS DevTools Hero Learning Path*
