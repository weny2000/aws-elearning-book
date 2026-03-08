# Project 04: AWS Native CI/CD Pipeline

## 项目概述

这是一个完整的 AWS-native CI/CD 解决方案，演示如何使用 AWS CodePipeline、CodeBuild、ECS Fargate 和 CDK 构建企业级持续集成/持续部署流水线。

## 架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub                                  │
│                    (Source Repository)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Webhook Trigger
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS CodePipeline                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐   ┌──────────┐  │
│  │  Source  │───▶│  Build   │───▶│  Approve │──▶│  Deploy  │  │
│  │ (GitHub) │    │(CodeBuild│    │ (Manual) │   │  (ECS)   │  │
│  └──────────┘    └────┬─────┘    └──────────┘   └────┬─────┘  │
└───────────────────────┼───────────────────────────────────────┘
                        │                              │
                        ▼                              ▼
               ┌──────────────┐              ┌────────────────┐
               │ Amazon ECR   │              │  ECS Fargate   │
               │ (Image Repo) │              │   (Runtime)    │
               └──────────────┘              └────────────────┘
                                                    │
                                                    ▼
                                           ┌────────────────┐
                                           │ Application    │
                                           │ Load Balancer  │
                                           └────────────────┘
```

## 技术栈

- **IaC**: AWS CDK (TypeScript)
- **CI/CD**: AWS CodePipeline + CodeBuild
- **容器**: Amazon ECR + ECS Fargate
- **网络**: Amazon VPC + ALB
- **监控**: Amazon CloudWatch + SNS

## 项目结构

```
04-aws-native-cicd/
├── README.md                 # 本文件
├── buildspec.yml            # CodeBuild 配置
├── scripts/
│   └── deploy.sh            # 部署脚本
├── app/                     # 示例应用程序
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   └── index.js         # Express.js 应用
│   └── tests/
│       └── health.test.js   # 单元测试
└── cdk/                     # CDK 基础设施代码
    ├── bin/
    │   └── app.ts           # CDK 应用入口
    ├── lib/
    │   └── cicd-stack.ts    # CI/CD 堆栈定义
    ├── package.json
    ├── tsconfig.json
    └── cdk.json
```

## 快速开始

### 前置要求

- AWS CLI 已配置 (`aws configure`)
- Node.js 18+ 和 npm
- AWS CDK 已安装 (`npm install -g aws-cdk`)
- Docker (用于本地测试)

### 1. 克隆仓库并安装依赖

```bash
cd e-book/topics/devtools/projects/04-aws-native-cicd

# 安装 CDK 依赖
cd cdk && npm ci
cd ../app && npm ci
cd ..
```

### 2. 配置 AWS CodeStar Connections

1. 访问 AWS 控制台 → Developer Tools → CodePipeline → Settings → Connections
2. 创建连接到 GitHub 的 connection
3. 复制 connection ARN 并更新 `cdk/lib/cicd-stack.ts`

```typescript
connectionArn: 'arn:aws:codestar-connections:region:account:connection/YOUR_CONNECTION_ID',
```

### 3. 部署基础设施

```bash
# 部署开发环境
./scripts/deploy.sh --env dev

# 部署预发布环境
./scripts/deploy.sh --env staging

# 部署生产环境
./scripts/deploy.sh --env prod
```

### 4. 验证部署

```bash
# 获取负载均衡器地址
aws cloudformation describe-stacks \
  --stack-name AwsNativeCicdDev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text

# 测试健康检查端点
curl http://<LOAD_BALANCER_DNS>/health
```

## 关键特性

### 🚀 CI/CD 流水线

- **Source Stage**: 从 GitHub 拉取代码
- **Build Stage**: CodeBuild 编译、测试、构建镜像
- **Approval Stage**: 生产环境人工审批
- **Deploy Stage**: ECS Fargate 部署

### 🔒 安全最佳实践

- ECR 镜像扫描
- 最小权限 IAM 角色
- VPC 隔离
- 非 root 容器运行

### 📊 可观测性

- CloudWatch 日志
- 应用性能监控
- Pipeline 执行告警
- ECS 服务告警

### 💰 成本优化

- Fargate Spot (非生产环境)
- 按需构建
- 镜像生命周期管理

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `ENVIRONMENT` | 部署环境 | dev |
| `AWS_REGION` | AWS 区域 | ap-northeast-1 |
| `IMAGE_REPO_NAME` | ECR 仓库名 | aws-native-cicd-{env} |

### 构建配置 (buildspec.yml)

```yaml
# 关键配置项
phases:
  pre_build:
    - 登录 ECR
    - 代码质量检查 (ESLint)
  build:
    - 运行单元测试
    - 构建 Docker 镜像
    - 镜像安全扫描
  post_build:
    - 推送镜像到 ECR
    - 生成部署定义文件
```

## 常用命令

```bash
# 本地构建和测试 Docker 镜像
cd app
docker build -t aws-native-cicd:latest .
docker run -p 8080:8080 aws-native-cicd:latest

# 本地测试应用
npm test

# CDK 操作
cdk synth          # 合成模板
cdk diff           # 查看差异
cdk deploy         # 部署
cdk destroy        # 销毁

# 查看 Pipeline 状态
aws codepipeline get-pipeline-state --name aws-native-cicd-dev

# 查看 CloudWatch 日志
aws logs tail /ecs/app-service-dev --follow
```

## 故障排除

### Pipeline 失败

```bash
# 查看详细日志
aws codebuild batch-get-builds \
  --ids $(aws codebuild list-builds-for-project \
    --project-name aws-native-cicd-build-dev \
    --query 'ids[0]' --output text) \
  --query 'builds[0].logs.deepLink'
```

### ECS 服务无法启动

```bash
# 检查服务事件
aws ecs describe-services \
  --cluster aws-native-cicd-dev \
  --services app-service-dev \
  --query 'services[0].events[:5]'

# 查看任务停止原因
aws ecs describe-tasks \
  --cluster aws-native-cicd-dev \
  --tasks $(aws ecs list-tasks \
    --cluster aws-native-cicd-dev \
    --query 'taskArns[0]' --output text) \
  --query 'tasks[0].stoppedReason'
```

## 扩展建议

1. **多区域部署**: 使用 CodePipeline cross-region 支持
2. **金丝雀部署**: 集成 CodeDeploy Blue/Green
3. **安全扫描**: 集成 Amazon Inspector 或 Trivy
4. **审批流程**: 使用 SNS + Lambda 实现更复杂的审批逻辑
5. **回滚**: 配置自动回滚策略

## 清理资源

```bash
# 销毁所有环境
./scripts/deploy.sh --env dev --action destroy
./scripts/deploy.sh --env staging --action destroy
./scripts/deploy.sh --env prod --action destroy
```

## 参考资源

- [AWS CodePipeline 文档](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild 用户指南](https://docs.aws.amazon.com/codebuild/)
- [ECS Fargate 最佳实践](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [CDK 示例](https://github.com/aws-samples/aws-cdk-examples)

---

**Part of AWS DevTools Hero Learning Path**
