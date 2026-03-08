# Modern Development Tools Technical Whitepaper

> Mastering the Software Development Lifecycle Toolchain

---

## Table of Contents

> **Learning Guide**: This whitepaper follows an evolutionary path from "Individual Efficiency → Team Collaboration → Production Delivery". The first 3 chapters establish personal foundations, the middle 6 chapters cover engineering practices, and the last 3 chapters elevate to platform thinking.

1. **[Development Tools Overview](#1-development-tools-overview)**  
   *Establish tool thinking: Understand the modern development toolchain landscape, selection principles, and learning paths to avoid falling into the "Tool Collector" trap.*

2. **[Code Editors & IDEs](#2-code-editors--ides)**  
   *Enhance coding efficiency: Deep dive into VS Code/IntelliJ/Neovim configuration, shortcuts, and plugin ecosystems to build a personalized, efficient development environment.*

3. **[Version Control Systems](#3-version-control-systems)**  
   *The cornerstone of collaborative development: Master Git advanced operations, branching strategies, and Code Review workflows to achieve efficient team collaboration.*

4. **[Containerization Technology](#4-containerization-technology)** 🐳  
   *Standardized delivery: Learn Docker core concepts, image optimization, and multi-stage builds to lay the foundation for cloud-native applications.*

5. **[CI/CD & Automation](#5-cicd--automation)**  
   *Accelerate delivery pipelines: Master GitHub Actions, CodePipeline, and CodeBuild to build automated pipelines from code to deployment.*

6. **[Kubernetes & Orchestration](#6-kubernetes--orchestration)**  
   *Large-scale container management: Learn EKS cluster management, Helm package management, and service mesh to address production-grade container orchestration challenges.*

7. **[Monitoring & Observability](#7-monitoring--observability)**  
   *Gain system insights: Integrate Prometheus, Grafana, and CloudWatch to build full-stack monitoring for applications and infrastructure.*

8. **[Test Automation](#8-test-automation)**  
   *Ensure code quality: Learn unit testing, integration testing, and E2E testing strategies, mastering tools like pytest, Jest, and Selenium.*

9. **[Code Quality & Security](#9-code-quality--security)**  
   *Shift-left security practices: Integrate SonarQube, CodeGuru, and SAST/DAST tools to detect and fix issues early in development.*

10. **[GitOps & Infrastructure as Code](#10-gitops--infrastructure-as-code)**  
    *Declarative operations: Learn Terraform, CDK, and ArgoCD to manage infrastructure and application deployments using Git workflows.*

11. **[Development Environment Management](#11-development-environment-management)**  
    *Environment consistency: Master Docker Compose, devcontainer, Nix, and LocalStack to solve the "It works on my machine" problem.*

12. **[Toolchain Integration & Optimization](#12-toolchain-integration--optimization)**  
    *Build platform capabilities: Integrate all the aforementioned tools to design efficient developer portals, internal platforms, and measurement systems to improve overall team effectiveness.*

---

## 1. Development Tools Overview

### 1.1 Modern Development Tool Ecosystem

```mermaid
flowchart TB
    subgraph Dev["Development Phase"]
        direction TB
        IDE[VS Code / JetBrains]
        VCS[Git / GitHub]
        AI[AI-Assisted Programming]
        Doc[Documentation Tools]
    end
    
    subgraph Build["Build Phase"]
        direction TB
        Docker[Containerization]
        CI[Continuous Integration]
        Test[Automated Testing]
        Scan[Security Scanning]
    end
    
    subgraph Deploy["Deployment Phase"]
        direction TB
        CD[Continuous Deployment]
        K8s[Kubernetes]
        GitOps[GitOps]
        FeatureFlag[Feature Flags]
    end
    
    subgraph Operate["Operations Phase"]
        direction TB
        Monitor[Monitoring & Alerting]
        Log[Log Analysis]
        Trace[Distributed Tracing]
        SRE[SRE Practices]
    end
    
    Dev --> Build --> Deploy --> Operate
```

### 1.2 Tool Selection Decision Matrix

| Phase | Open Source | Commercial | Cloud-Native |
|-------|-------------|------------|--------------|
| **Code Hosting** | GitLab CE | GitHub Enterprise | AWS CodeCommit |
| **CI/CD** | Jenkins, Drone | GitLab CI, CircleCI | GitHub Actions |
| **Container Orchestration** | Kubernetes | OpenShift | EKS, GKE, AKS |
| **Monitoring** | Prometheus + Grafana | Datadog, New Relic | CloudWatch |
| **Logging** | ELK Stack | Splunk | CloudWatch Logs |
| **Artifact Repository** | Nexus, Artifactory OSS | Artifactory Pro | ECR, ACR |

### 1.3 DevOps Maturity Model

```mermaid
flowchart LR
    subgraph Level1["Level 1: Initial"]
        L1_Manual[Manual Deployment]
        L1_Silo[Team Silos]
    end
    
    subgraph Level2["Level 2: Automated"]
        L2_CI[Continuous Integration]
        L2_Automated[Automated Testing]
    end
    
    subgraph Level3["Level 3: Continuous Delivery"]
        L3_CD[Continuous Deployment]
        L3_IaC[Infrastructure as Code]
    end
    
    subgraph Level4["Level 4: Full DevOps"]
        L4_GitOps[GitOps]
        L4_Observability[Full Observability]
        L4_SRE[SRE Culture]
    end
    
    Level1 --> Level2 --> Level3 --> Level4
```

---

## 2. Code Editors & IDEs

### 2.1 VS Code Deep Configuration

```json
// settings.json - Full-Stack Development Configuration
{
  // Editor Basics
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
  
  // Code Quality
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  
  // File Management
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/.next": true
  },
  
  // Terminal
  "terminal.integrated.shell.linux": "/bin/zsh",
  "terminal.integrated.fontFamily": "'JetBrains Mono', monospace",
  
  // Git
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,
  
  // Extensions
  "extensions.autoUpdate": true
}
```

**Essential Extensions List**:

| Category | Extension | Purpose |
|----------|-----------|---------|
| **Code Quality** | ESLint, Prettier | Code Standards |
| **Git** | GitLens, Git Graph | Version Control Enhancement |
| **Containers** | Docker | Container Management |
| **Kubernetes** | Kubernetes | K8s Resource Management |
| **AI Assistance** | GitHub Copilot | Intelligent Code Completion |
| **REST API** | REST Client, Thunder Client | API Testing |
| **Database** | Database Client | Database Management |

### 2.2 JetBrains Series Configuration

```bash
# IntelliJ IDEA / PyCharm / WebStorm Optimization

# Memory Optimization (idea.vmoptions)
-Xms2g
-Xmx8g
-XX:ReservedCodeCacheSize=512m
-XX:+UseG1GC
-XX:SoftRefLRUPolicyMSPerMB=50

# Common Plugins
# - .env files support
# - .ignore
# - Rainbow Brackets
# - Key Promoter X
# - String Manipulation
# - PlantUML
```

### 2.3 AI-Assisted Programming Tools

```mermaid
flowchart TB
    subgraph AI["AI Programming Assistants"]
        Copilot[GitHub Copilot]
        Cursor[Cursor]
        Codeium[Codeium]
        Tabnine[Tabnine]
        AmazonQ[Amazon Q]
    end
    
    subgraph Features["Core Features"]
        Completion[Code Completion]
        Chat[Conversational Programming]
        Explain[Code Explanation]
        Test[Test Generation]
        Refactor[Refactoring Suggestions]
    end
    
    AI --> Features
```

**AI Tools Comparison**:

| Tool | Price | Offline Support | Privacy Protection | Language Support |
|------|-------|-----------------|-------------------|------------------|
| GitHub Copilot | $10/month | ❌ | Enterprise | All Languages |
| Cursor | $20/month | ❌ | ✅ | All Languages |
| Codeium | Free | ❌ | ✅ | All Languages |
| Tabnine | Free/$12 | ✅ Local | ✅ | All Languages |
| Amazon Q | AWS Pay | ❌ | Enterprise | All Languages |

---

## 3. Version Control Systems

### 3.1 Git Workflow Strategies

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
# Git Flow Automation Script

git_flow_init() {
    git checkout -b develop main
    
    # Set protection rules
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
    
    # Update version number
    echo "$version" > VERSION
    git add VERSION
    git commit -m "Bump version to $version"
}

git_flow_hotfix() {
    local version=$1
    git checkout -b "hotfix/$version" main
}
```

### 3.2 Advanced Git Techniques

```bash
# Interactive Rebase
git rebase -i HEAD~5

# Cherry-pick Commits
git cherry-pick abc1234

# Stash Workspace
git stash push -m "WIP: feature X"
git stash list
git stash pop stash@{0}

# Advanced Logging
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

# Clean Local Branches
git branch --merged | grep -v "^\*" | grep -v main | xargs -n 1 git branch -d

# Large File Handling
git lfs track "*.psd"
git lfs track "*.zip"

# Submodule Management
git submodule add https://github.com/example/lib.git libs/lib
git submodule update --init --recursive
```

### 3.3 Monorepo Management

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

## 4. Containerization Technology

### 4.1 Docker Best Practices

```dockerfile
# Dockerfile - Multi-Stage Build Best Practices
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files first (leverage cache layer)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production Image
FROM node:20-alpine AS production
WORKDIR /app

# Security: Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy only necessary files
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# Health Check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml - Development Environment
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

  # Local AWS Service Mocking
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

### 4.2 Docker Security Scanning

```bash
#!/bin/bash
# Container Security Scanning Script

IMAGE_NAME=$1

echo "🔍 Scanning image: $IMAGE_NAME"

# Trivy Scan
echo "Running Trivy scan..."
trivy image \
    --severity HIGH,CRITICAL \
    --exit-code 1 \
    --no-progress \
    $IMAGE_NAME

# Docker Scout
echo "Running Docker Scout..."
docker scout cves $IMAGE_NAME

# Snyk Scan (Optional)
# snyk container test $IMAGE_NAME

# Image Size Check
SIZE=$(docker images --format "{{.Size}}" $IMAGE_NAME | head -1)
echo "Image size: $SIZE"

# Check for sensitive information leaks
echo "Checking for sensitive files..."
docker run --rm $IMAGE_NAME sh -c "
    find / -name '*.pem' -o -name '*.key' -o -name '.env' 2>/dev/null | head -20
"
```

### 4.3 Docker Multi-Architecture Builds

Supporting multiple CPU architectures (AMD64, ARM64) for mixed deployment environments.

```dockerfile
# Multi-Architecture Dockerfile
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production Image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
# Build Multi-Architecture Images with Buildx
# Create Buildx builder
docker buildx create --use --name multiarch

# Build and push multi-architecture image
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myapp:latest \
  -t myapp:v1.0.0 \
  --push .

# Verify multi-architecture image
docker buildx imagetools inspect myapp:latest
```

**Benefits of Multi-Architecture Builds**:
- Support Apple Silicon (M1/M2) developers
- Support AWS Graviton instances
- Support edge devices (ARM)
- Single tag, automatic architecture selection

### 4.4 Docker Networking & Storage

**Network Modes Explained**:

```bash
# Bridge Mode (Default)
docker run --network bridge myapp

# Host Mode (Best Performance)
docker run --network host myapp

# None Mode (Isolated)
docker run --network none myapp

# Custom Network
docker network create --driver bridge mynet
docker run --network mynet --name app1 myapp
docker run --network mynet --name app2 myapp

# Inter-Container Communication Test
docker exec app2 ping app1
```

**Volume Management**:

```yaml
# docker-compose.volumes.yml
version: '3.8'

services:
  app:
    image: myapp
    volumes:
      # Named Volume
      - app_data:/app/data
      # Bind Mount
      - ./config:/app/config:ro
      # Temporary Volume
      - type: tmpfs
        target: /app/tmp
        tmpfs:
          size: 100M
      # Shared Volume
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

### 4.5 AWS & Docker Integration in Practice

#### AWS ECR Repository Management

```bash
#!/bin/bash
# ecr-lifecycle-policy.sh - ECR Lifecycle Policy

REPOSITORY_NAME=$1

# Create lifecycle policy
cat > lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 30 images",
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
      "description": "Delete untagged images older than 30 days",
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

echo "ECR lifecycle policy applied to ${REPOSITORY_NAME}"
```

**ECR Cross-Account Replication**:

```bash
# Configure ECR Cross-Region/Cross-Account Replication
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

#### Docker with AWS CodeBuild

```yaml
# buildspec.yml - AWS CodeBuild Docker Build
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

#### Docker with AWS Elastic Beanstalk

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
# Access containers using SSM Session Manager
# No need to open SSH ports, access controlled via IAM

# Launch container with SSM Agent
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.micro \
  --iam-instance-profile Name=EC2SSMRole \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=docker-host}]'

# Connect to instance via SSM and enter container
aws ssm start-session --target i-xxxxxxxxxxxxxxxxx

# Execute Docker commands on the instance
docker ps
docker exec -it <container-id> /bin/sh
```

**Send Docker Container Logs to CloudWatch**:

```bash
# Configure Docker default log driver to awslogs
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

# Restart Docker
sudo systemctl restart docker

# Run container, logs automatically sent to CloudWatch
docker run -d --name myapp myapp:latest
```

#### Docker with AWS X-Ray Integration

```dockerfile
# Dockerfile with X-Ray Sidecar
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

## 5. CI/CD & Automation

### 5.1 GitHub Actions Workflows

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
  # Code Quality Checks
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

  # Security Scanning
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

  # Build & Test
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

  # Build & Push Image
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

  # Deploy to Dev Environment
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

  # Deploy to Production (Requires Approval)
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


### 5.2 GitLab CI Configuration

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

# Cache Configuration
.npm_cache: &npm_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

# Build Stage
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

# Test Stage
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

# Security Scanning
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

# Deployment
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

### 5.3 AWS CodePipeline Enterprise Practices ⭐ AWS-first

In production environments, AWS native CI/CD solutions (CodePipeline + CodeBuild + CodeDeploy) provide tighter AWS service integration and better compliance support.

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

### 5.4 CodeBuild Optimization Tips

```yaml
# buildspec-optimized.yml
version: 0.2

# Parallel Builds - Significantly reduce total build time
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
      # Use local cache for acceleration
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
  # Test Reports
  test-reports:
    files:
      - 'reports/junit.xml'
    file-format: JUNITXML
  
  # Coverage Reports
  coverage:
    files:
      - 'coverage/clover.xml'
    file-format: CLOVERXML

cache:
  paths:
    # Cache critical paths locally
    - 'node_modules/**/*'
    - '/root/.npm/**/*'
    # Docker layer cache (requires custom image)
    - '/var/lib/docker/**/*'

# Build timeout (default 60 minutes)
timeout: 30
```

### 5.5 CI/CD Solution Comparison

| Feature | GitHub Actions | GitLab CI | AWS CodePipeline |
|---------|---------------|-----------|------------------|
| **Pricing Model** | Per-minute billing | Per-minute billing | Per-pipeline execution |
| **AWS Integration** | Requires OIDC/AWS credentials | Requires OIDC/AWS credentials | Native IAM integration |
| **Secrets Management** | GitHub Secrets | GitLab Variables | Secrets Manager |
| **Artifacts** | 90-day retention | Default 30 days | S3 persistent storage |
| **Compliance** | Requires additional config | Requires additional config | SOC/PCI compliant |
| **Best For** | Open source projects | Self-hosted GitLab | AWS production environments |

**Recommendation**: In AWS production environments, prioritize CodePipeline + CodeBuild for the best native integration experience and compliance support.

---

## 6. Kubernetes & Orchestration

### 6.1 K8s Application Deployment Manifests

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

### 6.2 Kubectl Common Commands

```bash
#!/bin/bash
# Kubectl Common Operations Script

# Quick Diagnostics
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'

# Resource Management
k-get-all() {
    kubectl get all -n $1
}

# Pod Diagnostics
k-debug() {
    local pod=$1
    kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
}

# View Resource Usage
k-top() {
    kubectl top nodes
    kubectl top pods --all-namespaces
}

# Port Forwarding
k-port-forward() {
    local service=$1
    local port=$2
    kubectl port-forward svc/$service $port:$port
}

# View Events
k-events() {
    kubectl get events --sort-by='.lastTimestamp' | tail -20
}

# Cleanup
k-cleanup() {
    # Delete completed pods
    kubectl delete pods --field-selector=status.phase=Succeeded
    kubectl delete pods --field-selector=status.phase=Failed
    
    # Delete unused ConfigMaps
    kubectl get configmap --all-namespaces | grep -v NAME | while read ns name rest; do
        if ! kubectl get pods -n $ns -o yaml | grep -q "name: $name"; then
            echo "Unused ConfigMap: $ns/$name"
        fi
    done
}
```

---

## 7. Monitoring & Observability

### 7.1 Prometheus + Grafana Monitoring Stack

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
  # Prometheus Self-Monitoring
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

  # Pod Monitoring
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

# Alert Rules
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

### 7.2 Distributed Tracing

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
# Application Integration Example (Node.js)
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

## 8. Test Automation

### 8.1 Test Pyramid

```mermaid
flowchart TB
    subgraph E2E["E2E Tests (10%)"]
        Playwright[Playwright]
        Cypress[Cypress]
        Selenium[Selenium]
    end
    
    subgraph Integration["Integration Tests (30%)"]
        API[API Testing]
        DB[Database Testing]
        Contract[Contract Testing]
    end
    
    subgraph Unit["Unit Tests (60%)"]
        Jest[Jest]
        Pytest[Pytest]
        JUnit[JUnit]
    end
    
    E2E --> Integration --> Unit
```

### 8.2 Test Workflow

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

## 9. Code Quality & Security

### 9.1 SonarQube Integration

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

### 9.2 Security Scanning Pipeline

```yaml
# Security Scanning Pipeline
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    # SAST - Static Application Security Testing
    - name: Run Semgrep
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/owasp-top-ten
          p/cwe-top-25

    # SCA - Software Composition Analysis
    - name: Run Snyk
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    # Container Scanning
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

    # Secret Detection
    - name: Detect Secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
```

---

## 10. GitOps & Infrastructure as Code

### 10.1 ArgoCD Configuration

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

### 10.2 Terraform Modules

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

### 10.3 AWS CDK Enterprise Practices ⭐ AWS-first

AWS CDK is AWS's native Infrastructure as Code solution, providing type safety, IDE support, and rich AWS service integration.

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

#### CDK Aspects - Cross-Cutting Concerns

```typescript
// aspects/security-aspect.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { IConstruct } from 'constructs';

export class SecurityAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // Enforce S3 Encryption
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
    
    // Enforce SQS Encryption
    if (node instanceof sqs.CfnQueue) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sqs';
      }
    }
    
    // Enforce SNS Encryption
    if (node instanceof sns.CfnTopic) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sns';
      }
    }
  }
}

// Apply Aspect
const app = new cdk.App();
const stack = new WebServiceStack(app, 'WebService');
cdk.Aspects.of(app).add(new SecurityAspect());
```

#### CDK Pipelines - Self-Mutating CI/CD

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
      selfMutation: true, // Self-mutating
      
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

#### IaC Solution Comparison

| Feature | Terraform | AWS CDK | CloudFormation |
|---------|-----------|---------|----------------|
| **Language** | HCL | TypeScript/Python/Java | YAML/JSON |
| **AWS Integration** | Requires provider | Native | Native |
| **IDE Support** | Medium | Excellent | Basic |
| **Type Safety** | No | Yes | No |
| **Team Learning Curve** | Medium | Low (familiar language) | Low |
| **Best For** | Multi-cloud | AWS-specific | Simple resources |

**Recommendation**: For AWS-specific projects, prioritize CDK for the best development experience and type safety.

---

## 11. Development Environment Management

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

### 11.2 Environment Configuration as Code

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

## 12. Toolchain Integration & Optimization

### 12.1 Platform Engineering Self-Service

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

### 12.2 DORA Metrics Tracking

```python
# dora_metrics.py
import requests
from datetime import datetime, timedelta

class DORAMetrics:
    """DORA Core Metrics Calculation"""
    
    def __init__(self, github_token):
        self.token = github_token
        self.headers = {'Authorization': f'token {github_token}'}
    
    def deployment_frequency(self, repo, days=30):
        """Deployment Frequency"""
        since = (datetime.now() - timedelta(days=days)).isoformat()
        url = f'https://api.github.com/repos/{repo}/deployments'
        params = {'since': since, 'per_page': 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        deployments = response.json()
        
        return len(deployments) / days
    
    def lead_time_for_changes(self, repo):
        """Lead Time for Changes"""
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
        """Change Failure Rate"""
        # Calculate by checking rollback labels or fix PRs
        pass
    
    def mttr(self, repo):
        """Mean Time To Recovery"""
        # Retrieve via Incident management tool API
        pass
```

---

## Summary

The modern development toolchain is the core competency of software engineering. Mastering these tools enables you to:

- **Improve Development Efficiency**: AI-assisted programming, automated workflows
- **Ensure Code Quality**: Automated testing, code review, security scanning
- **Accelerate Delivery Speed**: CI/CD, GitOps, Infrastructure as Code
- **Ensure System Stability**: Comprehensive monitoring, rapid recovery

### Toolchain Maturity Checklist

```markdown
## Level 1: Foundation
- [ ] Code Version Control (Git)
- [ ] Code Editor/IDE Configuration
- [ ] Basic CI/CD Pipeline
- [ ] Automated Testing

## Level 2: Automation
- [ ] Code Quality Scanning
- [ ] Security Scanning Integration
- [ ] Containerized Deployment
- [ ] Environment as Code

## Level 3: Advanced
- [ ] Kubernetes Orchestration
- [ ] GitOps Workflow
- [ ] Full Observability
- [ ] Platform Engineering Self-Service

## Level 4: Optimization
- [ ] DORA Metrics Tracking
- [ ] AI-Assisted Development
- [ ] Chaos Engineering
- [ ] Continuous Optimization
```

Keep learning new tools and optimizing your development workflow!

---

*Version: v1.0*  
*Updated: 2026-03-02*
