# 现代开发工具技术白皮书

> 全面掌握软件开发生命周期工具链

---

## 目录

> **学习指引**: 本白皮书遵循"个人效率→团队协作→生产交付"的演进路径。前3章夯实个人基础，中间6章掌握工程实践，后3章提升到平台化思维。

1. **[开发工具概述](#1-开发工具概述)**  
   *建立工具思维：理解现代开发工具链全景、选型原则和学习路径，避免陷入"工具 Collector"陷阱。*

2. **[代码编辑器与 IDE](#2-代码编辑器与-ide)**  
   *提升编码效率：深入 VS Code/IntelliJ/Neovim 配置、快捷键、插件体系，打造个性化高效开发环境。*

3. **[版本控制系统](#3-版本控制系统)**  
   *协作开发基石：掌握 Git 高级操作、分支策略、Code Review 流程，实现团队高效协作。*

4. **[容器化技术](#4-容器化技术)** 🐳  
   *标准化交付：学习 Docker 核心概念、镜像优化、多阶段构建，为云原生应用奠定基础。*

5. **[CI/CD 与自动化](#5-cicd-与自动化)**  
   *加速交付流程：掌握 GitHub Actions、CodePipeline、CodeBuild，构建从代码到部署的自动化流水线。*

6. **[Kubernetes 与编排](#6-kubernetes-与编排)**  
   *规模化容器管理：学习 EKS 集群管理、Helm 包管理、服务网格，应对生产级容器编排挑战。*

7. **[监控与可观测性](#7-监控与可观测性)**  
   *洞察系统运行：整合 Prometheus、Grafana、CloudWatch，构建应用和基础设施的全栈监控体系。*

8. **[测试自动化](#8-测试自动化)**  
   *保障代码质量：学习单元测试、集成测试、E2E 测试策略，掌握 pytest、Jest、Selenium 等工具。*

9. **[代码质量与安全](#9-代码质量与安全)**  
   *左移安全实践：整合 SonarQube、CodeGuru、SAST/DAST 工具，在开发早期发现和修复问题。*

10. **[GitOps 与基础设施即代码](#10-gitops-与基础设施即代码)**  
    *声明式运维：学习 Terraform、CDK、ArgoCD，用 Git 工作流管理基础设施和应用部署。*

11. **[开发环境管理](#11-开发环境管理)**  
    *环境一致性：掌握 Docker Compose、devcontainer、Nix、LocalStack，解决"在我机器上能跑"问题。*

12. **[工具链集成与优化](#12-工具链集成与优化)**  
    *构建平台能力：整合前述所有工具，设计高效的开发者门户、内部平台、度量体系，提升团队整体效能。*

---

## 1. 开发工具概述

### 1.1 现代开发工具生态

```mermaid
flowchart TB
    subgraph Dev["开发阶段"]
        direction TB
        IDE[VS Code / JetBrains]
        VCS[Git / GitHub]
        AI[AI 辅助编程]
        Doc[文档工具]
    end
    
    subgraph Build["构建阶段"]
        direction TB
        Docker[容器化]
        CI[持续集成]
        Test[自动化测试]
        Scan[安全扫描]
    end
    
    subgraph Deploy["部署阶段"]
        direction TB
        CD[持续部署]
        K8s[Kubernetes]
        GitOps[GitOps]
        FeatureFlag[特性开关]
    end
    
    subgraph Operate["运维阶段"]
        direction TB
        Monitor[监控告警]
        Log[日志分析]
        Trace[链路追踪]
        SRE[SRE 实践]
    end
    
    Dev --> Build --> Deploy --> Operate
```

### 1.2 工具选择决策矩阵

| 阶段 | 开源方案 | 商业方案 | 云原生方案 |
|------|----------|----------|-----------|
| **代码托管** | GitLab CE | GitHub Enterprise | AWS CodeCommit |
| **CI/CD** | Jenkins, Drone | GitLab CI, CircleCI | GitHub Actions |
| **容器编排** | Kubernetes | OpenShift | EKS, GKE, AKS |
| **监控** | Prometheus + Grafana | Datadog, New Relic | CloudWatch |
| **日志** | ELK Stack | Splunk | CloudWatch Logs |
| **制品库** | Nexus, Artifactory OSS | Artifactory Pro | ECR, ACR |

### 1.3 DevOps 成熟度模型

```mermaid
flowchart LR
    subgraph Level1["Level 1: 初始"]
        L1_Manual[手动部署]
        L1_Silo[团队孤岛]
    end
    
    subgraph Level2["Level 2: 自动化"]
        L2_CI[持续集成]
        L2_Automated[自动化测试]
    end
    
    subgraph Level3["Level 3: 持续交付"]
        L3_CD[持续部署]
        L3_IaC[基础设施即代码]
    end
    
    subgraph Level4["Level 4: 完整 DevOps"]
        L4_GitOps[GitOps]
        L4_Observability[全面可观测性]
        L4_SRE[SRE 文化]
    end
    
    Level1 --> Level2 --> Level3 --> Level4
```

---

## 2. 代码编辑器与 IDE

### 2.1 VS Code 深度配置

```json
// settings.json - 全栈开发配置
{
  // 编辑器基础
  "editor.fontSize": 14,
  "editor.fontFamily": "'Fira Code', 'JetBrains Mono', monospace",
  "editor.fontLigatures": true,
  "editor.formatOnSave": true,
  "editor.formatOnPaste": true,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.rulers": [80, 120],
  "editor.wordWrap": "wordWrapColumn",
  "editor.wordWrapColumn": 120,
  
  // 代码质量
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  
  // 文件管理
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/.next": true
  },
  
  // 终端
  "terminal.integrated.shell.linux": "/bin/zsh",
  "terminal.integrated.fontFamily": "'JetBrains Mono', monospace",
  
  // Git
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,
  
  // 扩展推荐
  "extensions.autoUpdate": true
}
```

**必备扩展清单**:

| 类别 | 扩展 | 用途 |
|------|------|------|
| **代码质量** | ESLint, Prettier | 代码规范 |
| **Git** | GitLens, Git Graph | 版本控制增强 |
| **容器** | Docker | 容器管理 |
| **Kubernetes** | Kubernetes | K8s 资源管理 |
| **AI 辅助** | GitHub Copilot | 智能代码补全 |
| **REST API** | REST Client, Thunder Client | API 测试 |
| **数据库** | Database Client | 数据库管理 |

### 2.2 JetBrains 系列配置

```bash
# IntelliJ IDEA / PyCharm / WebStorm 优化配置

# 内存优化 (idea.vmoptions)
-Xms2g
-Xmx8g
-XX:ReservedCodeCacheSize=512m
-XX:+UseG1GC
-XX:SoftRefLRUPolicyMSPerMB=50

# 常用插件
# - .env files support
# - .ignore
# - Rainbow Brackets
# - Key Promoter X
# - String Manipulation
# - PlantUML
```

### 2.3 AI 辅助编程工具

```mermaid
flowchart TB
    subgraph AI["AI 编程助手"]
        Copilot[GitHub Copilot]
        Cursor[Cursor]
        Codeium[Codeium]
        Tabnine[Tabnine]
        AmazonQ[Amazon Q]
    end
    
    subgraph Features["核心功能"]
        Completion[代码补全]
        Chat[对话式编程]
        Explain[代码解释]
        Test[测试生成]
        Refactor[重构建议]
    end
    
    AI --> Features
```

**AI 工具对比**:

| 工具 | 价格 | 离线支持 | 隐私保护 | 语言支持 |
|------|------|----------|----------|----------|
| GitHub Copilot | $10/月 | ❌ | 企业版 | 全语言 |
| Cursor | $20/月 | ❌ | ✅ | 全语言 |
| Codeium | 免费 | ❌ | ✅ | 全语言 |
| Tabnine | 免费/$12 | ✅ 本地 | ✅ | 全语言 |
| Amazon Q | AWS 付费 | ❌ | 企业级 | 全语言 |

---

## 3. 版本控制系统

### 3.1 Git 工作流策略

```mermaid
flowchart TB
    subgraph GitFlow["Git Flow"]
        Master[main/master]
        Develop[develop]
        Feature[feature/*]
        Release[release/*]
        Hotfix[hotfix/*]
        
        Master --> Develop
        Develop --> Feature
        Feature --> Develop
        Develop --> Release
        Release --> Master
        Release --> Develop
        Master --> Hotfix
        Hotfix --> Master
        Hotfix --> Develop
    end
```

```bash
#!/bin/bash
# Git Flow 自动化脚本

git_flow_init() {
    git checkout -b develop main
    
    # 设置保护规则
    gh api repos/:owner/:repo/branches/main/protection \
        --method PUT \
        --input - <<< '{
            "required_status_checks": null,
            "enforce_admins": true,
            "required_pull_request_reviews": {
                "required_approving_review_count": 2
            },
            "restrictions": null
        }'
}

git_flow_feature() {
    local name=$1
    git checkout -b "feature/$name" develop
}

git_flow_release() {
    local version=$1
    git checkout -b "release/$version" develop
    
    # 版本号更新
    echo "$version" > VERSION
    git add VERSION
    git commit -m "Bump version to $version"
}

git_flow_hotfix() {
    local version=$1
    git checkout -b "hotfix/$version" main
}
```

### 3.2 高级 Git 技巧

```bash
# 交互式 Rebase
git rebase -i HEAD~5

# 拣选提交
git cherry-pick abc1234

# 暂存工作区
git stash push -m "WIP: feature X"
git stash list
git stash pop stash@{0}

# 高级日志
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

# 清理本地分支
git branch --merged | grep -v "^\*" | grep -v main | xargs -n 1 git branch -d

# 大文件处理
git lfs track "*.psd"
git lfs track "*.zip"

# 子模块管理
git submodule add https://github.com/example/lib.git libs/lib
git submodule update --init --recursive
```

### 3.3 Monorepo 管理

```yaml
# .github/workflows/monorepo-ci.yml
name: Monorepo CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  changes:
    runs-on: ubuntu-latest
    outputs:
      frontend: ${{ steps.changes.outputs.frontend }}
      backend: ${{ steps.changes.outputs.backend }}
      docs: ${{ steps.changes.outputs.docs }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            frontend:
              - 'apps/frontend/**'
              - 'packages/ui/**'
            backend:
              - 'apps/backend/**'
              - 'packages/api/**'
            docs:
              - 'docs/**'

  frontend:
    needs: changes
    if: ${{ needs.changes.outputs.frontend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Frontend
        run: |
          cd apps/frontend
          npm ci
          npm run build
          npm run test

  backend:
    needs: changes
    if: ${{ needs.changes.outputs.backend == 'true' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Backend
        run: |
          cd apps/backend
          pip install -r requirements.txt
          pytest
```

---

## 4. 容器化技术

### 4.1 Docker 最佳实践

```dockerfile
# Dockerfile - 多阶段构建最佳实践
# 阶段1: 构建
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制依赖文件 (利用缓存层)
COPY package*.json ./
RUN npm ci --only=production

# 复制源码并构建
COPY . .
RUN npm run build

# 阶段2: 生产镜像
FROM node:20-alpine AS production
WORKDIR /app

# 安全: 非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 只复制必要文件
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml - 开发环境
version: '3.8'

services:
  app:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:password@db:5432/app
    depends_on:
      - db
      - redis
    command: npm run dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # 本地 AWS 服务模拟
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,sqs,sns,dynamodb
      - DEFAULT_REGION=us-east-1
    volumes:
      - localstack_data:/var/lib/localstack
      - /var/run/docker.sock:/var/run/docker.sock

volumes:
  postgres_data:
  redis_data:
  localstack_data:
```

### 4.2 Docker 安全扫描

```bash
#!/bin/bash
# 容器安全扫描脚本

IMAGE_NAME=$1

echo "🔍 扫描镜像: $IMAGE_NAME"

# Trivy 扫描
echo "Running Trivy scan..."
trivy image \
    --severity HIGH,CRITICAL \
    --exit-code 1 \
    --no-progress \
    $IMAGE_NAME

# Docker Scout
echo "Running Docker Scout..."
docker scout cves $IMAGE_NAME

# Snyk 扫描 (可选)
# snyk container test $IMAGE_NAME

# 镜像大小检查
SIZE=$(docker images --format "{{.Size}}" $IMAGE_NAME | head -1)
echo "镜像大小: $SIZE"

# 检查敏感信息泄露
echo "检查敏感文件..."
docker run --rm $IMAGE_NAME sh -c "
    find / -name '*.pem' -o -name '*.key' -o -name '.env' 2>/dev/null | head -20
"
```

### 4.3 Docker 多架构构建

支持多种 CPU 架构（AMD64、ARM64）的镜像构建，适用于混合部署环境。

```dockerfile
# 多架构 Dockerfile
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 生产镜像
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
# 使用 Buildx 构建多架构镜像
# 创建 Buildx 构建器
docker buildx create --use --name multiarch

# 构建并推送多架构镜像
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myapp:latest \
  -t myapp:v1.0.0 \
  --push .

# 验证多架构镜像
docker buildx imagetools inspect myapp:latest
```

**多架构构建的优势**:
- 支持 Apple Silicon (M1/M2) 开发者
- 支持 AWS Graviton 实例
- 支持边缘设备 (ARM)
- 单一标签，自动选择正确架构

### 4.4 Docker 网络与存储

**网络模式详解**:

```bash
# Bridge 模式 (默认)
docker run --network bridge myapp

# Host 模式 (性能最优)
docker run --network host myapp

# None 模式 (隔离)
docker run --network none myapp

# 自定义网络
docker network create --driver bridge mynet
docker run --network mynet --name app1 myapp
docker run --network mynet --name app2 myapp

# 容器间通信测试
docker exec app2 ping app1
```

**存储卷管理**:

```yaml
# docker-compose.volumes.yml
version: '3.8'

services:
  app:
    image: myapp
    volumes:
      # 命名卷
      - app_data:/app/data
      # 绑定挂载
      - ./config:/app/config:ro
      # 临时卷
      - type: tmpfs
        target: /app/tmp
        tmpfs:
          size: 100M
      # 共享卷
      - shared_logs:/app/logs

  logger:
    image: log-collector
    volumes:
      - shared_logs:/logs:ro

volumes:
  app_data:
    driver: local
  shared_logs:
    driver: local
```

### 4.5 AWS 与 Docker 集成实战

#### AWS ECR 镜像仓库管理

```bash
#!/bin/bash
# ecr-lifecycle-policy.sh - ECR 生命周期策略

REPOSITORY_NAME=$1

# 创建生命周期策略
cat > lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "保留最近 30 个镜像",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 30
      },
      "action": {
        "type": "expire"
      }
    },
    {
      "rulePriority": 2,
      "description": "删除 30 天前的未标记镜像",
      "selection": {
        "tagStatus": "untagged",
        "countType": "sinceImagePushed",
        "countUnit": "days",
        "countNumber": 30
      },
      "action": {
        "type": "expire"
      }
    }
  ]
}
EOF

aws ecr put-lifecycle-policy \
  --repository-name ${REPOSITORY_NAME} \
  --lifecycle-policy-text file://lifecycle-policy.json

echo "ECR 生命周期策略已应用到 ${REPOSITORY_NAME}"
```

**ECR 跨账户复制**:

```bash
# 配置 ECR 跨区域/跨账户复制
aws ecr put-replication-configuration \
  --replication-configuration file://replication-config.json

# replication-config.json
{
  "rules": [
    {
      "destinations": [
        {
          "region": "eu-west-1",
          "registryId": "123456789"
        },
        {
          "region": "ap-northeast-1",
          "registryId": "123456789"
        }
      ]
    }
  ]
}
```

#### Docker 与 AWS CodeBuild

```yaml
# buildspec.yml - AWS CodeBuild Docker 构建
version: 0.2

env:
  variables:
    AWS_DEFAULT_REGION: us-east-1
    IMAGE_REPO_NAME: myapp
    IMAGE_TAG: latest
  parameter-store:
    DOCKER_HUB_USERNAME: /docker/hub/username
    DOCKER_HUB_PASSWORD: /docker/hub/password

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - echo Logging in to Docker Hub...
      - echo $DOCKER_HUB_PASSWORD | docker login --username $DOCKER_HUB_USERNAME --password-stdin
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REPOSITORY_URI:$IMAGE_TAG
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $REPOSITORY_URI:$CODEBUILD_BUILD_NUMBER
      
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - docker push $REPOSITORY_URI:$CODEBUILD_BUILD_NUMBER
      - printf '[{"name":"myapp","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json
      
artifacts:
  files: imagedefinitions.json
```

#### Docker 与 AWS Elastic Beanstalk

```yaml
# Dockerrun.aws.json (v2)
{
  "AWSEBDockerrunVersion": 2,
  "volumes": [
    {
      "name": "web-app",
      "host": {
        "sourcePath": "/var/app/current/web"
      }
    }
  ],
  "containerDefinitions": [
    {
      "name": "web",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/myapp:latest",
      "essential": true,
      "memory": 512,
      "portMappings": [
        {
          "hostPort": 80,
          "containerPort": 8080
        }
      ],
      "environment": [
        {
          "name": "ENVIRONMENT",
          "value": "production"
        }
      ],
      "mountPoints": [
        {
          "sourceVolume": "web-app",
          "containerPath": "/app/data"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/elasticbeanstalk/myapp",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "web"
        }
      }
    },
    {
      "name": "nginx",
      "image": "nginx:alpine",
      "essential": true,
      "memory": 128,
      "portMappings": [
        {
          "hostPort": 443,
          "containerPort": 443
        }
      ],
      "links": [
        "web"
      ],
      "mountPoints": [
        {
          "sourceVolume": "awseb-logs-nginx",
          "containerPath": "/var/log/nginx"
        }
      ]
    }
  ]
}
```

#### AWS Systems Manager Session Manager + Docker

```bash
# 使用 SSM Session Manager 访问容器
# 无需开放 SSH 端口，通过 IAM 控制访问

# 启动带 SSM Agent 的容器
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.micro \
  --iam-instance-profile Name=EC2SSMRole \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=docker-host}]'

# 通过 SSM 连接到实例并进入容器
aws ssm start-session --target i-xxxxxxxxxxxxxxxxx

# 在实例上执行 Docker 命令
docker ps
docker exec -it <container-id> /bin/sh
```

**Docker 容器日志发送到 CloudWatch**:

```bash
# 配置 Docker 默认日志驱动为 awslogs
# /etc/docker/daemon.json
{
  "log-driver": "awslogs",
  "log-opts": {
    "awslogs-region": "us-east-1",
    "awslogs-group": "docker-containers",
    "awslogs-create-group": "true",
    "tag": "{{.Name}}"
  }
}

# 重启 Docker
sudo systemctl restart docker

# 运行容器，日志自动发送到 CloudWatch
docker run -d --name myapp myapp:latest
```

#### Docker 与 AWS X-Ray 集成

```dockerfile
# 带 X-Ray Sidecar 的 Dockerfile
FROM node:20-alpine AS app
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]

# X-Ray Daemon Sidecar
FROM amazon/aws-xray-daemon:latest AS xray
EXPOSE 2000/udp
```

```yaml
# docker-compose.xray.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: app
    environment:
      - AWS_XRAY_DAEMON_ADDRESS=xray:2000
      - AWS_XRAY_CONTEXT_MISSING=LOG_ERROR
    depends_on:
      - xray

  xray:
    build:
      context: .
      target: xray
    environment:
      - AWS_REGION=us-east-1
    volumes:
      - ~/.aws:/root/.aws:ro
    ports:
      - "2000:2000/udp"
```

---

## 5. CI/CD 与自动化

### 5.1 GitHub Actions 工作流

```yaml
# .github/workflows/production.yml
name: Production Pipeline

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 代码质量检查
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

      - name: Lint Code
        run: |
          npm ci
          npm run lint
          npm run format:check

  # 安全扫描
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'

  # 构建与测试
  build:
    runs-on: ubuntu-latest
    needs: [quality]
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: |
          npm run test:cov
          npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  # 构建并推送镜像
  containerize:
    runs-on: ubuntu-latest
    needs: [build, security]
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

  # 部署到开发环境
  deploy-dev:
    runs-on: ubuntu-latest
    needs: containerize
    if: github.ref == 'refs/heads/develop'
    environment:
      name: development
      url: https://dev.example.com
    steps:
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --name dev-cluster
          kubectl set image deployment/app app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:sha-${{ github.sha }} -n dev
          kubectl rollout status deployment/app -n dev

  # 部署到生产环境 (需要审批)
  deploy-prod:
    runs-on: ubuntu-latest
    needs: containerize
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://app.example.com
    steps:
      - name: Deploy to Production
        run: |
          aws eks update-kubeconfig --name prod-cluster
          kubectl set image deployment/app app=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.ref_name }} -n prod
          kubectl rollout status deployment/app -n prod
      
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 5.2 GitLab CI 配置

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - deploy

variables:
  DOCKER_REGISTRY: $CI_REGISTRY
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# 缓存配置
.npm_cache: &npm_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

# 构建阶段
build:
  stage: build
  image: node:20-alpine
  <<: *npm_cache
  script:
    - npm ci --cache .npm --prefer-offline
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

# 测试阶段
test:
  stage: test
  image: node:20-alpine
  <<: *npm_cache
  services:
    - postgres:16-alpine
    - redis:7-alpine
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: password
    REDIS_URL: redis://redis:6379
  script:
    - npm ci
    - npm run test:cov
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      junit: junit.xml

# 安全扫描
sast:
  stage: security
  image: returntocorp/semgrep
  script:
    - semgrep --config=auto --json --output=semgrep.json .
  artifacts:
    reports:
      sast: semgrep.json

container_scanning:
  stage: security
  image: docker:stable
  services:
    - docker:dind
  script:
    - docker build -t $DOCKER_IMAGE .
    - docker run --rm -v /var/run/docker.sock:/var/run/docker.sock 
      aquasec/trivy image --exit-code 0 --no-progress $DOCKER_IMAGE

# 部署
deploy_staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context staging
    - helm upgrade --install myapp ./helm-chart 
        --set image.tag=$CI_COMMIT_SHA 
        --namespace staging
  environment:
    name: staging
    url: https://staging.example.com
  only:
    - develop

deploy_production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config use-context production
    - helm upgrade --install myapp ./helm-chart 
        --set image.tag=$CI_COMMIT_SHA 
        --namespace production
  environment:
    name: production
    url: https://app.example.com
  when: manual
  only:
    - main
```

### 5.3 AWS CodePipeline 企业级实践 ⭐ AWS-first

在生产环境中，AWS 原生 CI/CD 方案（CodePipeline + CodeBuild + CodeDeploy）提供更紧密的 AWS 服务集成和更好的合规支持。

```yaml
# pipeline/template.yaml - AWS CodePipeline with SAM
AWSTemplateFormatVersion: '2010-09-09'
Description: Production CI/CD Pipeline

Parameters:
  GitHubConnectionArn:
    Type: String
    Description: CodeStar Connection ARN

Resources:
  # S3 Artifact Bucket
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldArtifacts
            Status: Enabled
            ExpirationInDays: 30

  # CodeBuild Project
  BuildProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub ${AWS::StackName}-build
      Source:
        Type: CODEPIPELINE
        BuildSpec: |
          version: 0.2
          phases:
            install:
              runtime-versions:
                nodejs: 18
              commands:
                - npm ci
            build:
              commands:
                - npm run lint
                - npm run test:coverage
                - sam build
            post_build:
              commands:
                - sam package --output-template-file packaged.yaml --s3-bucket $ARTIFACT_BUCKET
          artifacts:
            files:
              - packaged.yaml
              - template.yaml
      Artifacts:
        Type: CODEPIPELINE
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
        PrivilegedMode: true
        EnvironmentVariables:
          - Name: ARTIFACT_BUCKET
            Value: !Ref ArtifactBucket

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub ${AWS::StackName}-pipeline
      RoleArn: !GetAtt PipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        # Source Stage
        - Name: Source
          Actions:
            - Name: GitHub_Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: 1
              Configuration:
                ConnectionArn: !Ref GitHubConnectionArn
                FullRepositoryId: myorg/myapp
                BranchName: main
              OutputArtifacts:
                - Name: SourceCode

        # Build Stage
        - Name: Build
          Actions:
            - Name: Build_and_Test
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
        - Name: Deploy_Dev
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub ${AWS::StackName}-dev
                TemplatePath: BuildArtifact::packaged.yaml
                Capabilities: CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
              InputArtifacts:
                - Name: BuildArtifact

        # Approval for Production
        - Name: Approval
          Actions:
            - Name: Manual_Approval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: Approve deployment to production?

        # Deploy to Production
        - Name: Deploy_Prod
          Actions:
            - Name: Deploy
              ActionTypeId:
                Category: Deploy
                Owner: AWS
                Provider: CloudFormation
                Version: 1
              Configuration:
                ActionMode: CREATE_UPDATE
                StackName: !Sub ${AWS::StackName}-prod
                TemplatePath: BuildArtifact::packaged.yaml
                Capabilities: CAPABILITY_IAM CAPABILITY_AUTO_EXPAND
              InputArtifacts:
                - Name: BuildArtifact
```

### 5.4 CodeBuild 优化技巧

```yaml
# buildspec-optimized.yml
version: 0.2

# 并行构建 - 大幅减少总构建时间
batch:
  fast-fail: false
  build-matrix:
    - identifier: unit_tests
      env:
        compute-type: BUILD_GENERAL1_SMALL
    - identifier: integration_tests
      env:
        compute-type: BUILD_GENERAL1_MEDIUM
    - identifier: security_scan
      env:
        compute-type: BUILD_GENERAL1_SMALL

env:
  variables:
    AWS_DEFAULT_REGION: ap-northeast-1
  secrets-manager:
    SONAR_TOKEN: prod/sonar:token
    GITHUB_TOKEN: prod/github:token

phases:
  install:
    runtime-versions:
      nodejs: 18
      python: 3.11
    commands:
      # 使用本地缓存加速
      - if [ -d node_modules ]; then echo "Cache hit"; else npm ci; fi

  pre_build:
    commands:
      - npm run lint
      - npm run type-check

  build:
    commands:
      - npm run test:ci
      - npm run build:production

  post_build:
    commands:
      - npm run security:scan
      - echo Build completed

reports:
  # 测试报告
  test-reports:
    files:
      - 'reports/junit.xml'
    file-format: JUNITXML
  
  # 覆盖率报告
  coverage:
    files:
      - 'coverage/clover.xml'
    file-format: CLOVERXML

cache:
  paths:
    # 本地缓存关键路径
    - 'node_modules/**/*'
    - '/root/.npm/**/*'
    # Docker 层缓存（需要自定义镜像）
    - '/var/lib/docker/**/*'

# 构建超时设置（默认60分钟）
timeout: 30
```

### 5.5 CI/CD 方案对比

| 特性 | GitHub Actions | GitLab CI | AWS CodePipeline |
|------|---------------|-----------|------------------|
| **定价模式** | 按分钟计费 | 按分钟计费 | 按流水线执行计费 |
| **AWS 集成** | 需配置 OIDC/AWS 凭证 | 需配置 OIDC/AWS 凭证 | 原生 IAM 集成 |
| **Secrets 管理** | GitHub Secrets | GitLab Variables | Secrets Manager |
| **Artifacts** | 90天保留 | 默认30天 | S3 持久化 |
| **合规性** | 需额外配置 | 需额外配置 | SOC/PCI 合规 |
| **最佳场景** | 开源项目 | 自托管 GitLab | AWS 生产环境 |

**建议**：在 AWS 生产环境中，优先使用 CodePipeline + CodeBuild 组合，获得最佳的原生集成体验和合规支持。

---

## 6. Kubernetes 与编排

### 6.1 K8s 应用部署清单

```yaml
# k8s/base/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app: myapp
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
    spec:
      serviceAccountName: app
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      
      containers:
      - name: app
        image: myapp:latest
        imagePullPolicy: Always
        
        ports:
        - name: http
          containerPort: 3000
          protocol: TCP
        - name: metrics
          containerPort: 9090
        
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        
        livenessProbe:
          httpGet:
            path: /health/live
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        
        readinessProbe:
          httpGet:
            path: /health/ready
            port: http
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        
        securityContext:
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
          capabilities:
            drop:
            - ALL
        
        volumeMounts:
        - name: tmp
          mountPath: /tmp
      
      volumes:
      - name: tmp
        emptyDir: {}
      
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - myapp
              topologyKey: kubernetes.io/hostname

---
apiVersion: v1
kind: Service
metadata:
  name: app
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: http
    protocol: TCP
    name: http
  selector:
    app: myapp

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - app.example.com
    secretName: app-tls
  rules:
  - host: app.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app
            port:
              number: 80

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
      - type: Pods
        value: 4
        periodSeconds: 15
      selectPolicy: Max
```

### 6.2 Kubectl 常用命令

```bash
#!/bin/bash
# kubectl 常用操作脚本

# 快速诊断
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'

# 资源管理
k-get-all() {
    kubectl get all -n $1
}

# Pod 诊断
k-debug() {
    local pod=$1
    kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
}

# 查看资源使用
k-top() {
    kubectl top nodes
    kubectl top pods --all-namespaces
}

# 端口转发
k-port-forward() {
    local service=$1
    local port=$2
    kubectl port-forward svc/$service $port:$port
}

# 查看事件
k-events() {
    kubectl get events --sort-by='.lastTimestamp' | tail -20
}

# 清理
k-cleanup() {
    # 删除已完成的 Pod
    kubectl delete pods --field-selector=status.phase=Succeeded
    kubectl delete pods --field-selector=status.phase=Failed
    
    # 删除未使用的 ConfigMap
    kubectl get configmap --all-namespaces | grep -v NAME | while read ns name rest; do
        if ! kubectl get pods -n $ns -o yaml | grep -q "name: $name"; then
            echo "Unused ConfigMap: $ns/$name"
        fi
    done
}
```

---

## 7. 监控与可观测性

### 7.1 Prometheus + Grafana 监控栈

```yaml
# prometheus-config.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  # Prometheus 自身监控
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Kubernetes API Server
  - job_name: 'kubernetes-apiservers'
    kubernetes_sd_configs:
      - role: endpoints
    scheme: https
    tls_config:
      ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
    bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
    relabel_configs:
      - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
        action: keep
        regex: default;kubernetes;https

  # Pod 监控
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: ([^:]+)(?::\d+)?;(\d+)
        replacement: $1:$2
        target_label: __address__

# 告警规则
groups:
  - name: app-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"
      
      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency detected"
```

### 7.2 分布式链路追踪

```yaml
# jaeger-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jaeger
spec:
  replicas: 1
  selector:
    matchLabels:
      app: jaeger
  template:
    metadata:
      labels:
        app: jaeger
    spec:
      containers:
      - name: jaeger
        image: jaegertracing/all-in-one:1.45
        ports:
        - containerPort: 16686  # UI
        - containerPort: 14268  # Collector
        env:
        - name: COLLECTOR_OTLP_ENABLED
          value: "true"

---
# 应用集成示例 (Node.js)
"""
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://jaeger:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
"""
```

---

## 8. 测试自动化

### 8.1 测试金字塔

```mermaid
flowchart TB
    subgraph E2E["E2E 测试 (10%)"]
        Playwright[Playwright]
        Cypress[Cypress]
        Selenium[Selenium]
    end
    
    subgraph Integration["集成测试 (30%)"]
        API[API 测试]
        DB[数据库测试]
        Contract[契约测试]
    end
    
    subgraph Unit["单元测试 (60%)"]
        Jest[Jest]
        Pytest[Pytest]
        JUnit[JUnit]
    end
    
    E2E --> Integration --> Unit
```

### 8.2 测试工作流

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Unit Tests
        run: |
          npm ci
          npm run test:unit -- --coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Integration Tests
        run: |
          npm ci
          npm run test:integration
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Playwright
        run: |
          npm ci
          npx playwright install
      
      - name: Run E2E Tests
        run: npx playwright test
      
      - name: Upload Test Results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run K6 Load Tests
        uses: grafana/k6-action@v0.3.1
        with:
          filename: load-test.js
```

---

## 9. 代码质量与安全

### 9.1 SonarQube 集成

```yaml
# .github/workflows/sonar.yml
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
        with:
          args: >
            -Dsonar.projectKey=myapp
            -Dsonar.organization=myorg
            -Dsonar.sources=src
            -Dsonar.tests=tests
            -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
            -Dsonar.coverage.exclusions=**/*.test.js,**/node_modules/**,**/dist/**
```

### 9.2 安全扫描流水线

```yaml
# 安全扫描流水线
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    # SAST - 静态应用安全测试
    - name: Run Semgrep
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/owasp-top-ten
          p/cwe-top-25

    # SCA - 软件成分分析
    - name: Run Snyk
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    # 容器扫描
    - name: Build Image
      run: docker build -t myapp:test .
    
    - name: Scan Image
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: myapp:test
        format: sarif
        output: trivy-results.sarif
    
    - name: Upload Scan Results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: trivy-results.sarif

    # Secret 检测
    - name: Detect Secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
```

---

## 10. GitOps 与基础设施即代码

### 10.1 ArgoCD 配置

```yaml
# argocd-application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: myapp
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/myorg/myapp.git
    targetRevision: HEAD
    path: k8s/overlays/production
    helm:
      valueFiles:
        - values-production.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 10.2 Terraform 模块

```hcl
# modules/eks-cluster/main.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.28"

  vpc_id     = var.vpc_id
  subnet_ids = var.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["m6i.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        workload = "general"
      }

      update_config = {
        max_unavailable_percentage = 25
      }
    }

    spot = {
      desired_size = 2
      min_size     = 0
      max_size     = 10

      instance_types = ["m6i.large", "m5.large", "m5a.large"]
      capacity_type  = "SPOT"

      labels = {
        workload = "batch"
      }

      taints = [{
        key    = "spot"
        value  = "true"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
}
```

### 10.3 AWS CDK 企业级实践 ⭐ AWS-first

AWS CDK 是 AWS 原生的基础设施即代码解决方案，提供类型安全、IDE 支持和丰富的 AWS 服务集成。

```typescript
// lib/web-service-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

export interface WebServiceStackProps extends cdk.StackProps {
  readonly environment: string;
  readonly containerImage: string;
  readonly desiredCount?: number;
}

export class WebServiceStack extends cdk.Stack {
  public readonly serviceUrl: string;
  public readonly clusterName: string;
  
  constructor(scope: Construct, id: string, props: WebServiceStackProps) {
    super(scope, id, props);
    
    // VPC with best practices
    const vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      natGateways: props.environment === 'prod' ? 2 : 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });
    
    // Fargate service with Application Load Balancer
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this, 'Service', {
        vpc,
        taskImageOptions: {
          image: ecs.ContainerImage.fromRegistry(props.containerImage),
          containerPort: 8080,
          enableLogging: true,
        },
        desiredCount: props.desiredCount ?? 2,
        cpu: 512,
        memoryLimitMiB: 1024,
        platformVersion: ecs.FargatePlatformVersion.LATEST,
        // Enable Circuit Breaker for automatic rollback
        circuitBreaker: { rollback: true },
      }
    );
    
    // Auto scaling
    if (props.environment === 'prod') {
      const scaling = fargateService.service.autoScaleTaskCount({
        minCapacity: 2,
        maxCapacity: 20,
      });
      
      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
        scaleInCooldown: cdk.Duration.seconds(60),
        scaleOutCooldown: cdk.Duration.seconds(60),
      });
    }
    
    // CloudWatch Alarms
    const highCpuAlarm = new cloudwatch.Alarm(this, 'HighCpu', {
      metric: fargateService.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      alarmDescription: `High CPU for ${props.environment}`,
    });
    
    // Outputs
    this.serviceUrl = fargateService.loadBalancer.loadBalancerDnsName;
    this.clusterName = fargateService.cluster.clusterName;
    
    new cdk.CfnOutput(this, 'ServiceURL', {
      value: this.serviceUrl,
      description: 'Application Load Balancer URL',
    });
  }
}
```

#### CDK Aspects - 横切关注点

```typescript
// aspects/security-aspect.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { IConstruct } from 'constructs';

export class SecurityAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // 强制 S3 加密
    if (node instanceof s3.CfnBucket) {
      if (!node.bucketEncryption) {
        node.bucketEncryption = {
          serverSideEncryptionConfiguration: [{
            serverSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          }],
        };
      }
    }
    
    // 强制 SQS 加密
    if (node instanceof sqs.CfnQueue) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sqs';
      }
    }
    
    // 强制 SNS 加密
    if (node instanceof sns.CfnTopic) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sns';
      }
    }
  }
}

// 应用 Aspect
const app = new cdk.App();
const stack = new WebServiceStack(app, 'WebService');
cdk.Aspects.of(app).add(new SecurityAspect());
```

#### CDK Pipelines - 自我变异的 CI/CD

```typescript
// lib/pipeline-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as pipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'WebServicePipeline',
      selfMutation: true, // 自我变异
      
      synth: new pipelines.CodeBuildStep('Synth', {
        input: pipelines.CodePipelineSource.gitHub('myorg/myapp', 'main'),
        commands: [
          'npm ci',
          'npm run build',
          'npm run test',
          'npx cdk synth',
        ],
      }),
    });
    
    // Dev stage
    pipeline.addStage(new WebServiceStage(this, 'Dev', {
      environment: 'dev',
    }));
    
    // Prod stage with manual approval
    pipeline.addStage(new WebServiceStage(this, 'Prod', {
      environment: 'prod',
    }), {
      pre: [new pipelines.ManualApprovalStep('ApproveProd')],
    });
  }
}
```

#### IaC 方案对比

| 特性 | Terraform | AWS CDK | CloudFormation |
|------|-----------|---------|----------------|
| **语言** | HCL | TypeScript/Python/Java | YAML/JSON |
| **AWS 集成** | 需 provider | 原生 | 原生 |
| **IDE 支持** | 中等 | 优秀 | 一般 |
| **类型安全** | 否 | 是 | 否 |
| **团队学习成本** | 中等 | 低（熟悉语言） | 低 |
| **最佳场景** | 多云环境 | AWS 专用 | 简单资源 |

**建议**：AWS 专用项目优先使用 CDK，获得最佳开发体验和类型安全。

---

## 11. 开发环境管理

### 11.1 Dev Containers

```json
// .devcontainer/devcontainer.json
{
  "name": "Full Stack Development",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",
  
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11"
    },
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python",
        "ms-azuretools.vscode-docker",
        "ms-kubernetes-tools.vscode-kubernetes-tools"
      ],
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
      }
    }
  },
  
  "postCreateCommand": "npm install",
  "postStartCommand": "git config --global --add safe.directory /workspace",
  
  "remoteUser": "node"
}
```

### 11.2 环境配置即代码

```yaml
# .tool-versions (asdf)
nodejs 20.10.0
python 3.11.6
docker-compose 2.23.0
kubectl 1.28.4
helm 3.13.0
terraform 1.6.4

---
# Brewfile (macOS)
brew "git"
brew "gh"
brew "node"
brew "python"
brew "docker"
brew "kubectl"
brew "helm"
brew "terraform"
brew "awscli"
brew "jq"
brew "yq"
brew "tree"
brew "htop"
brew "ripgrep"
brew "fd"

cask "visual-studio-code"
cask "docker"
cask "jetbrains-toolbox"
```

---

## 12. 工具链集成与优化

### 12.1 平台工程自助服务

```yaml
# backstage-catalog.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  description: My microservice
  annotations:
    github.com/project-slug: myorg/my-service
    argocd/app-name: my-service
    grafana/dashboard-selector: "tags @> 'my-service'"
    snyk.io/org-name: myorg
spec:
  type: service
  lifecycle: production
  owner: team-platform
  system: ecommerce
  dependsOn:
    - component:database
    - component:redis
  providesApis:
    - api:rest-api
```

### 12.2 DORA 指标跟踪

```python
# dora_metrics.py
import requests
from datetime import datetime, timedelta

class DORAMetrics:
    """DORA 核心指标计算"""
    
    def __init__(self, github_token):
        self.token = github_token
        self.headers = {'Authorization': f'token {github_token}'}
    
    def deployment_frequency(self, repo, days=30):
        """部署频率"""
        since = (datetime.now() - timedelta(days=days)).isoformat()
        url = f'https://api.github.com/repos/{repo}/deployments'
        params = {'since': since, 'per_page': 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        deployments = response.json()
        
        return len(deployments) / days
    
    def lead_time_for_changes(self, repo):
        """变更前置时间"""
        url = f'https://api.github.com/repos/{repo}/pulls'
        params = {'state': 'closed', 'per_page': 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        prs = response.json()
        
        lead_times = []
        for pr in prs:
            if pr.get('merged_at'):
                created = datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00'))
                merged = datetime.fromisoformat(pr['merged_at'].replace('Z', '+00:00'))
                lead_times.append((merged - created).total_seconds() / 3600)
        
        return sum(lead_times) / len(lead_times) if lead_times else 0
    
    def change_failure_rate(self, repo, days=30):
        """变更失败率"""
        # 通过检查 rollback 标签或修复 PR 计算
        pass
    
    def mttr(self, repo):
        """恢复时间"""
        # 通过 Incident 管理工具 API 获取
        pass
```

---

## 总结

现代开发工具链是软件工程的核心竞争力。掌握这些工具，您可以：

- **提升开发效率**: AI 辅助编程、自动化工作流
- **保证代码质量**: 自动化测试、代码审查、安全扫描
- **加速交付速度**: CI/CD、GitOps、基础设施即代码
- **确保系统稳定**: 全面监控、快速恢复

### 工具链成熟度检查清单

```markdown
## Level 1: 基础
- [ ] 代码版本控制 (Git)
- [ ] 代码编辑器/IDE 配置
- [ ] 基础 CI/CD 流水线
- [ ] 自动化测试

## Level 2: 自动化
- [ ] 代码质量扫描
- [ ] 安全扫描集成
- [ ] 容器化部署
- [ ] 环境即代码

## Level 3: 高级
- [ ] Kubernetes 编排
- [ ] GitOps 工作流
- [ ] 完整可观测性
- [ ] 平台工程自助服务

## Level 4: 优化
- [ ] DORA 指标跟踪
- [ ] AI 辅助开发
- [ ] 混沌工程
- [ ] 持续优化
```

持续学习新工具，优化你的开发工作流！

---

*版本: v1.0*  
*更新日期: 2026-03-02*
