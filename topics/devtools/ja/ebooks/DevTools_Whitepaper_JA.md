# モダン開発ツール技術白書

> ソフトウェア開発ライフサイクルツールチェーンの包括的習得

---

## 目次

> **学習ガイド**: 本白書は「個人効率→チーム協働→本番環境デリバリー」という進化パスに従っています。前3章で個人の基礎を固め、中間6章でエンジニアリングプラクティスを習得し、後3章でプラットフォーム化の考え方を身につけます。

1. **[開発ツール概要](#1-開発ツール概要)**  
   *ツール思考の確立：モダン開発ツールチェーンの全体像、選定原則、学習パスを理解し、「ツールコレクター」の罠に陥らないようにします。*

2. **[コードエディタとIDE](#2-コードエディタとide)**  
   *コーディング効率の向上：VS Code/IntelliJ/Neovimの設定、ショートカット、プラグイン体系を深く理解し、パーソナライズされた効率的な開発環境を構築します。*

3. **[バージョン管理システム](#3-バージョン管理システム)**  
   *協働開発の基盤：Gitの高度な操作、ブランチ戦略、Code Reviewのフローを習得し、チームの効率的な協働を実現します。*

4. **[コンテナ化技術](#4-コンテナ化技術)** 🐳  
   *標準化されたデリバリー：Dockerのコアコンセプト、イメージ最適化、マルチステージビルドを学び、クラウドネイティブアプリケーションの基礎を築きます。*

5. **[CI/CDと自動化](#5-cicdと自動化)**  
   *デリバリーフローの加速：GitHub Actions、CodePipeline、CodeBuildを習得し、コードからデプロイまでの自動化パイプラインを構築します。*

6. **[Kubernetesとオーケストレーション](#6-kubernetesとオーケストレーション)**  
   *スケーラブルなコンテナ管理：EKSクラスタ管理、Helmパッケージ管理、サービスメッシュを学び、本番環境レベルのコンテナオーケストレーションの課題に対応します。*

7. **[監視とオブザーバビリティ](#7-監視とオブザーバビリティ)**  
   *システム運行の洞察：Prometheus、Grafana、CloudWatchを統合し、アプリケーションとインフラストラクチャのフルスタック監視体系を構築します。*

8. **[テスト自動化](#8-テスト自動化)**  
   *コード品質の保証：ユニットテスト、統合テスト、E2Eテスト戦略を学び、pytest、Jest、Seleniumなどのツールを習得します。*

9. **[コード品質とセキュリティ](#9-コード品質とセキュリティ)**  
   *セキュリティシフトレフトの実践：SonarQube、CodeGuru、SAST/DASTツールを統合し、開発の早期段階で問題を発見・修正します。*

10. **[GitOpsとInfrastructure as Code](#10-gitopsとinfrastructure-as-code)**  
    *宣言的な運用：Terraform、CDK、ArgoCDを学び、Gitワークフローでインフラストラクチャとアプリケーションのデプロイを管理します。*

11. **[開発環境管理](#11-開発環境管理)**  
    *環境の一貫性：Docker Compose、devcontainer、Nix、LocalStackを習得し、「私のマシンでは動いた」という問題を解決します。*

12. **[ツールチェーン統合と最適化](#12-ツールチェーン統合と最適化)**  
    *プラットフォーム能力の構築：前述のすべてのツールを統合し、効率的な開発者ポータル、内部プラットフォーム、メトリクス体系を設計し、チーム全体の生産性を向上させます。*

---

## 1. 開発ツール概要

### 1.1 モダン開発ツールエコシステム

```mermaid
flowchart TB
    subgraph Dev["開発フェーズ"]
        direction TB
        IDE[VS Code / JetBrains]
        VCS[Git / GitHub]
        AI[AI支援プログラミング]
        Doc[ドキュメントツール]
    end
    
    subgraph Build["ビルドフェーズ"]
        direction TB
        Docker[コンテナ化]
        CI[継続的インテグレーション]
        Test[自動化テスト]
        Scan[セキュリティスキャン]
    end
    
    subgraph Deploy["デプロイフェーズ"]
        direction TB
        CD[継続的デプロイメント]
        K8s[Kubernetes]
        GitOps[GitOps]
        FeatureFlag[フィーチャーフラグ]
    end
    
    subgraph Operate["運用フェーズ"]
        direction TB
        Monitor[監視アラート]
        Log[ログ分析]
        Trace[分散トレーシング]
        SRE[SREプラクティス]
    end
    
    Dev --> Build --> Deploy --> Operate
```

### 1.2 ツール選択意思決定マトリクス

| フェーズ | オープンソースソリューション | 商用ソリューション | クラウドネイティブソリューション |
|------|----------|----------|-----------|
| **コードホスティング** | GitLab CE | GitHub Enterprise | AWS CodeCommit |
| **CI/CD** | Jenkins, Drone | GitLab CI, CircleCI | GitHub Actions |
| **コンテナオーケストレーション** | Kubernetes | OpenShift | EKS, GKE, AKS |
| **監視** | Prometheus + Grafana | Datadog, New Relic | CloudWatch |
| **ログ** | ELK Stack | Splunk | CloudWatch Logs |
| **アーティファクトリポジトリ** | Nexus, Artifactory OSS | Artifactory Pro | ECR, ACR |

### 1.3 DevOps成熟度モデル

```mermaid
flowchart LR
    subgraph Level1["Level 1: 初期"]
        L1_Manual[手動デプロイ]
        L1_Silo[サイロ化されたチーム]
    end
    
    subgraph Level2["Level 2: 自動化"]
        L2_CI[継続的インテグレーション]
        L2_Automated[自動化テスト]
    end
    
    subgraph Level3["Level 3: 継続的デリバリー"]
        L3_CD[継続的デプロイメント]
        L3_IaC[Infrastructure as Code]
    end
    
    subgraph Level4["Level 4: 完全なDevOps"]
        L4_GitOps[GitOps]
        L4_Observability[包括的なオブザーバビリティ]
        L4_SRE[SREカルチャー]
    end
    
    Level1 --> Level2 --> Level3 --> Level4
```

---

## 2. コードエディタとIDE

### 2.1 VS Code 高度な設定

```json
// settings.json - フルスタック開発設定
{
  // エディタ基本設定
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
  
  // コード品質
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",
  
  // ファイル管理
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/.next": true
  },
  
  // ターミナル
  "terminal.integrated.shell.linux": "/bin/zsh",
  "terminal.integrated.fontFamily": "'JetBrains Mono', monospace",
  
  // Git
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,
  
  // 拡張機能の推奨
  "extensions.autoUpdate": true
}
```

**必須拡張機能リスト**:

| カテゴリ | 拡張機能 | 用途 |
|------|------|------|
| **コード品質** | ESLint, Prettier | コード規約 |
| **Git** | GitLens, Git Graph | バージョン管理強化 |
| **コンテナ** | Docker | コンテナ管理 |
| **Kubernetes** | Kubernetes | K8sリソース管理 |
| **AI支援** | GitHub Copilot | インテリジェントコード補完 |
| **REST API** | REST Client, Thunder Client | APIテスト |
| **データベース** | Database Client | データベース管理 |

### 2.2 JetBrainsシリーズ設定

```bash
# IntelliJ IDEA / PyCharm / WebStorm 最適化設定

# メモリ最適化 (idea.vmoptions)
-Xms2g
-Xmx8g
-XX:ReservedCodeCacheSize=512m
-XX:+UseG1GC
-XX:SoftRefLRUPolicyMSPerMB=50

# よく使うプラグイン
# - .env files support
# - .ignore
# - Rainbow Brackets
# - Key Promoter X
# - String Manipulation
# - PlantUML
```

### 2.3 AI支援プログラミングツール

```mermaid
flowchart TB
    subgraph AI["AIプログラミングアシスタント"]
        Copilot[GitHub Copilot]
        Cursor[Cursor]
        Codeium[Codeium]
        Tabnine[Tabnine]
        AmazonQ[Amazon Q]
    end
    
    subgraph Features["コア機能"]
        Completion[コード補完]
        Chat[対話型プログラミング]
        Explain[コード説明]
        Test[テスト生成]
        Refactor[リファクタリング提案]
    end
    
    AI --> Features
```

**AIツール比較**:

| ツール | 価格 | オフライン対応 | プライバシー保護 | 言語サポート |
|------|------|----------|----------|----------|
| GitHub Copilot | $10/月 | ❌ | エンタープライズ版 | 全言語 |
| Cursor | $20/月 | ❌ | ✅ | 全言語 |
| Codeium | 無料 | ❌ | ✅ | 全言語 |
| Tabnine | 無料/$12 | ✅ ローカル | ✅ | 全言語 |
| Amazon Q | AWS有料 | ❌ | エンタープライズ | 全言語 |

---

## 3. バージョン管理システム

### 3.1 Gitワークフロー戦略

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
# Git Flow自動化スクリプト

git_flow_init() {
    git checkout -b develop main
    
    # 保護ルールの設定
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
    
    # バージョン番号の更新
    echo "$version" > VERSION
    git add VERSION
    git commit -m "Bump version to $version"
}

git_flow_hotfix() {
    local version=$1
    git checkout -b "hotfix/$version" main
}
```

### 3.2 高度なGitテクニック

```bash
# インタラクティブRebase
git rebase -i HEAD~5

# コミットのチェリーピック
git cherry-pick abc1234

# ワークスペースの一時保存
git stash push -m "WIP: feature X"
git stash list
git stash pop stash@{0}

# 高度なログ
git log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit

# ローカルブランチのクリーンアップ
git branch --merged | grep -v "^\*" | grep -v main | xargs -n 1 git branch -d

# 大きなファイルの処理
git lfs track "*.psd"
git lfs track "*.zip"

# サブモジュール管理
git submodule add https://github.com/example/lib.git libs/lib
git submodule update --init --recursive
```

### 3.3 Monorepo管理

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

## 4. コンテナ化技術

### 4.1 Docker ベストプラクティス

```dockerfile
# Dockerfile - マルチステージビルドのベストプラクティス
# ステージ1: ビルド
FROM node:20-alpine AS builder
WORKDIR /app

# まず依存関係ファイルをコピー（キャッシュレイヤーを活用）
COPY package*.json ./
RUN npm ci --only=production

# ソースコードをコピーしてビルド
COPY . .
RUN npm run build

# ステージ2: 本番イメージ
FROM node:20-alpine AS production
WORKDIR /app

# セキュリティ: root以外のユーザー
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 必要なファイルのみコピー
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs

EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["node", "dist/main.js"]
```

```yaml
# docker-compose.yml - 開発環境
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

  # ローカルAWSサービスエミュレーション
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

### 4.2 Docker セキュリティスキャン

```bash
#!/bin/bash
# コンテナセキュリティスキャンスクリプト

IMAGE_NAME=$1

echo "🔍 スキャンイメージ: $IMAGE_NAME"

# Trivyスキャン
echo "Running Trivy scan..."
trivy image \
    --severity HIGH,CRITICAL \
    --exit-code 1 \
    --no-progress \
    $IMAGE_NAME

# Docker Scout
echo "Running Docker Scout..."
docker scout cves $IMAGE_NAME

# Snykスキャン (オプション)
# snyk container test $IMAGE_NAME

# イメージサイズチェック
SIZE=$(docker images --format "{{.Size}}" $IMAGE_NAME | head -1)
echo "イメージサイズ: $SIZE"

# 機密情報の漏洩チェック
echo "機密ファイルをチェック..."
docker run --rm $IMAGE_NAME sh -c "
    find / -name '*.pem' -o -name '*.key' -o -name '.env' 2>/dev/null | head -20
"
```

### 4.3 Docker マルチアーキテクチャビルド

複数のCPUアーキテクチャ（AMD64、ARM64）をサポートするイメージビルドは、ハイブリッドデプロイ環境に適しています。

```dockerfile
# マルチアーキテクチャ Dockerfile
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 本番イメージ
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
# Buildxを使用したマルチアーキテクチャイメージビルド
# Buildxビルダーの作成
docker buildx create --use --name multiarch

# マルチアーキテクチャイメージのビルドとプッシュ
docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  -t myapp:latest \
  -t myapp:v1.0.0 \
  --push .

# マルチアーキテクチャイメージの検証
docker buildx imagetools inspect myapp:latest
```

**マルチアーキテクチャビルドのメリット**:
- Apple Silicon (M1/M2) 開発者をサポート
- AWS Gravitonインスタンスをサポート
- エッジデバイス (ARM) をサポート
- 単一タグで、自動的に正しいアーキテクチャを選択

### 4.4 Docker ネットワークとストレージ

**ネットワークモードの詳細**:

```bash
# Bridgeモード (デフォルト)
docker run --network bridge myapp

# Hostモード (最高性能)
docker run --network host myapp

# Noneモード (分離)
docker run --network none myapp

# カスタムネットワーク
docker network create --driver bridge mynet
docker run --network mynet --name app1 myapp
docker run --network mynet --name app2 myapp

# コンテナ間通信テスト
docker exec app2 ping app1
```

**ストレージボリューム管理**:

```yaml
# docker-compose.volumes.yml
version: '3.8'

services:
  app:
    image: myapp
    volumes:
      # 名前付きボリューム
      - app_data:/app/data
      # バインドマウント
      - ./config:/app/config:ro
      # 一時ボリューム
      - type: tmpfs
        target: /app/tmp
        tmpfs:
          size: 100M
      # 共有ボリューム
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

### 4.5 AWSとDocker統合実践

#### AWS ECRイメージリポジトリ管理

```bash
#!/bin/bash
# ecr-lifecycle-policy.sh - ECRライフサイクルポリシー

REPOSITORY_NAME=$1

# ライフサイクルポリシーの作成
cat > lifecycle-policy.json << 'EOF'
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "直近30個のイメージを保持",
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
      "description": "30日以上前のタグなしイメージを削除",
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

echo "ECRライフサイクルポリシーが ${REPOSITORY_NAME} に適用されました"
```

**ECRクロスアカウントレプリケーション**:

```bash
# ECRのリージョン間/アカウント間レプリケーションの設定
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

#### DockerとAWS CodeBuild

```yaml
# buildspec.yml - AWS CodeBuild Dockerビルド
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

#### DockerとAWS Elastic Beanstalk

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
# SSM Session Managerを使用してコンテナにアクセス
# SSHポートを開放せず、IAMでアクセス制御

# SSM Agent付きコンテナの起動
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.micro \
  --iam-instance-profile Name=EC2SSMRole \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=docker-host}]'

# SSM経由でインスタンスに接続し、コンテナに入る
aws ssm start-session --target i-xxxxxxxxxxxxxxxxx

# インスタンス上でDockerコマンドを実行
docker ps
docker exec -it <container-id> /bin/sh
```

**DockerコンテナログをCloudWatchに送信**:

```bash
# Dockerデフォルトログドライバーをawslogsに設定
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

# Dockerの再起動
sudo systemctl restart docker

# コンテナを実行すると、ログが自動的にCloudWatchに送信される
docker run -d --name myapp myapp:latest
```

#### DockerとAWS X-Ray統合

```dockerfile
# X-Ray Sidecar付きDockerfile
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

## 5. CI/CDと自動化

### 5.1 GitHub Actionsワークフロー

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
  # コード品質チェック
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

  # セキュリティスキャン
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

  # ビルドとテスト
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

  # イメージのビルドとプッシュ
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

  # 開発環境へのデプロイ
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

  # 本番環境へのデプロイ（承認が必要）
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

### 5.2 GitLab CI設定

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

# キャッシュ設定
.npm_cache: &npm_cache
  cache:
    key: ${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

# ビルドステージ
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

# テストステージ
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

# セキュリティスキャン
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

# デプロイ
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

### 5.3 AWS CodePipelineエンタープライズ実践 ⭐ AWS-first

本番環境では、AWSネイティブCI/CDソリューション（CodePipeline + CodeBuild + CodeDeploy）が、より緊密なAWSサービス統合と優れたコンプライアンスサポートを提供します。

```yaml
# pipeline/template.yaml - AWS CodePipeline with SAM
AWSTemplateFormatVersion: '2010-09-09'
Description: Production CI/CD Pipeline

Parameters:
  GitHubConnectionArn:
    Type: String
    Description: CodeStar Connection ARN

Resources:
  # S3アーティファクトバケット
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

  # CodeBuildプロジェクト
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
        # ソースステージ
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

        # ビルドステージ
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

        # 開発環境へのデプロイ
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

        # 本番環境への承認
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

        # 本番環境へのデプロイ
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

### 5.4 CodeBuild最適化テクニック

```yaml
# buildspec-optimized.yml
version: 0.2

# 並列ビルド - 総ビルド時間を大幅に短縮
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
      # ローカルキャッシュを使用して高速化
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
  # テストレポート
  test-reports:
    files:
      - 'reports/junit.xml'
    file-format: JUNITXML
  
  # カバレッジレポート
  coverage:
    files:
      - 'coverage/clover.xml'
    file-format: CLOVERXML

cache:
  paths:
    # ローカルキャッシュの重要パス
    - 'node_modules/**/*'
    - '/root/.npm/**/*'
    # Dockerレイヤーキャッシュ（カスタムイメージが必要）
    - '/var/lib/docker/**/*'

# ビルドタイムアウト設定（デフォルト60分）
timeout: 30
```

### 5.5 CI/CDソリューション比較

| 特性 | GitHub Actions | GitLab CI | AWS CodePipeline |
|------|---------------|-----------|------------------|
| **価格モデル** | 分単位課金 | 分単位課金 | パイプライン実行ごと課金 |
| **AWS統合** | OIDC/AWS認証情報の設定が必要 | OIDC/AWS認証情報の設定が必要 | ネイティブIAM統合 |
| **Secrets管理** | GitHub Secrets | GitLab Variables | Secrets Manager |
| **Artifacts** | 90日保持 | デフォルト30日 | S3永続化 |
| **コンプライアンス** | 追加設定が必要 | 追加設定が必要 | SOC/PCI準拠 |
| **ベストシナリオ** | オープンソースプロジェクト | セルフホストGitLab | AWS本番環境 |

**推奨**: AWS本番環境では、最適なネイティブ統合とコンプライアンスサポートを得るため、CodePipeline + CodeBuildの組み合わせを優先的に使用してください。

---

## 6. Kubernetesとオーケストレーション

### 6.1 K8sアプリケーションデプロイメントマニフェスト

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

### 6.2 Kubectl常用コマンド

```bash
#!/bin/bash
# kubectl常用操作スクリプト

# クイック診断
alias k='kubectl'
alias kg='kubectl get'
alias kd='kubectl describe'
alias kl='kubectl logs'
alias ke='kubectl exec -it'

# リソース管理
k-get-all() {
    kubectl get all -n $1
}

# Pod診断
k-debug() {
    local pod=$1
    kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
}

# リソース使用状況の確認
k-top() {
    kubectl top nodes
    kubectl top pods --all-namespaces
}

# ポートフォワード
k-port-forward() {
    local service=$1
    local port=$2
    kubectl port-forward svc/$service $port:$port
}

# イベントの確認
k-events() {
    kubectl get events --sort-by='.lastTimestamp' | tail -20
}

# クリーンアップ
k-cleanup() {
    # 完了したPodを削除
    kubectl delete pods --field-selector=status.phase=Succeeded
    kubectl delete pods --field-selector=status.phase=Failed
    
    # 未使用のConfigMapを削除
    kubectl get configmap --all-namespaces | grep -v NAME | while read ns name rest; do
        if ! kubectl get pods -n $ns -o yaml | grep -q "name: $name"; then
            echo "Unused ConfigMap: $ns/$name"
        fi
    done
}
```

---

## 7. 監視とオブザーバビリティ

### 7.1 Prometheus + Grafana監視スタック

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
  # Prometheus自身の監視
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

  # Pod監視
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

# アラートルール
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

### 7.2 分散トレーシング

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
# アプリケーション統合例 (Node.js)
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

## 8. テスト自動化

### 8.1 テストピラミッド

```mermaid
flowchart TB
    subgraph E2E["E2Eテスト (10%)"]
        Playwright[Playwright]
        Cypress[Cypress]
        Selenium[Selenium]
    end
    
    subgraph Integration["統合テスト (30%)"]
        API[APIテスト]
        DB[データベーステスト]
        Contract[コントラクトテスト]
    end
    
    subgraph Unit["ユニットテスト (60%)"]
        Jest[Jest]
        Pytest[Pytest]
        JUnit[JUnit]
    end
    
    E2E --> Integration --> Unit
```

### 8.2 テストワークフロー

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

## 9. コード品質とセキュリティ

### 9.1 SonarQube統合

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

### 9.2 セキュリティスキャンパイプライン

```yaml
# セキュリティスキャンパイプライン
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4

    # SAST - 静的アプリケーションセキュリティテスト
    - name: Run Semgrep
      uses: returntocorp/semgrep-action@v1
      with:
        config: >-
          p/security-audit
          p/owasp-top-ten
          p/cwe-top-25

    # SCA - ソフトウェア構成分析
    - name: Run Snyk
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    # コンテナスキャン
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

    # Secret検出
    - name: Detect Secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD
```

---

## 10. GitOpsとInfrastructure as Code

### 10.1 ArgoCD設定

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

### 10.2 Terraformモジュール

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

### 10.3 AWS CDKエンタープライズ実践 ⭐ AWS-first

AWS CDKは、AWSネイティブのInfrastructure as Codeソリューションで、型安全性、IDEサポート、豊富なAWSサービス統合を提供します。

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
    
    // ベストプラクティスを適用したVPC
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
    
    // Application Load Balancer付きFargateサービス
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
        // 自動ロールバックのためのサーキットブレーカーを有効化
        circuitBreaker: { rollback: true },
      }
    );
    
    // 自動スケーリング
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
    
    // CloudWatchアラーム
    const highCpuAlarm = new cloudwatch.Alarm(this, 'HighCpu', {
      metric: fargateService.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      alarmDescription: `High CPU for ${props.environment}`,
    });
    
    // 出力
    this.serviceUrl = fargateService.loadBalancer.loadBalancerDnsName;
    this.clusterName = fargateService.cluster.clusterName;
    
    new cdk.CfnOutput(this, 'ServiceURL', {
      value: this.serviceUrl,
      description: 'Application Load Balancer URL',
    });
  }
}
```

#### CDK Aspects - 横断的関心事

```typescript
// aspects/security-aspect.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { IConstruct } from 'constructs';

export class SecurityAspect implements cdk.IAspect {
  public visit(node: IConstruct): void {
    // S3暗号化を強制
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
    
    // SQS暗号化を強制
    if (node instanceof sqs.CfnQueue) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sqs';
      }
    }
    
    // SNS暗号化を強制
    if (node instanceof sns.CfnTopic) {
      if (!node.kmsMasterKeyId) {
        node.kmsMasterKeyId = 'alias/aws/sns';
      }
    }
  }
}

// Aspectの適用
const app = new cdk.App();
const stack = new WebServiceStack(app, 'WebService');
cdk.Aspects.of(app).add(new SecurityAspect());
```

#### CDK Pipelines - 自己変異型CI/CD

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
      selfMutation: true, // 自己変異
      
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
    
    // Devステージ
    pipeline.addStage(new WebServiceStage(this, 'Dev', {
      environment: 'dev',
    }));
    
    // 手動承認付きProdステージ
    pipeline.addStage(new WebServiceStage(this, 'Prod', {
      environment: 'prod',
    }), {
      pre: [new pipelines.ManualApprovalStep('ApproveProd')],
    });
  }
}
```

#### IaCソリューション比較

| 特性 | Terraform | AWS CDK | CloudFormation |
|------|-----------|---------|----------------|
| **言語** | HCL | TypeScript/Python/Java | YAML/JSON |
| **AWS統合** | Providerが必要 | ネイティブ | ネイティブ |
| **IDEサポート** | 中程度 | 優秀 | 一般 |
| **型安全性** | なし | あり | なし |
| **チーム学習コスト** | 中程度 | 低い（言語に精通している場合） | 低い |
| **ベストシナリオ** | マルチクラウド環境 | AWS専用 | シンプルなリソース |

**推奨**: AWS専用プロジェクトでは、最適な開発体験と型安全性を得るため、CDKを優先的に使用してください。

---

## 11. 開発環境管理

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

### 11.2 環境設定即コード

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

## 12. ツールチェーン統合と最適化

### 12.1 プラットフォームエンジニアリングセルフサービス

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

### 12.2 DORAメトリクス追跡

```python
# dora_metrics.py
import requests
from datetime import datetime, timedelta

class DORAMetrics:
    """DORAコアメトリクス計算"""
    
    def __init__(self, github_token):
        self.token = github_token
        self.headers = {'Authorization': f'token {github_token}'}
    
    def deployment_frequency(self, repo, days=30):
        """デプロイメント頻度"""
        since = (datetime.now() - timedelta(days=days)).isoformat()
        url = f'https://api.github.com/repos/{repo}/deployments'
        params = {'since': since, 'per_page': 100}
        
        response = requests.get(url, headers=self.headers, params=params)
        deployments = response.json()
        
        return len(deployments) / days
    
    def lead_time_for_changes(self, repo):
        """変更リードタイム"""
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
        """変更失敗率"""
        # rollbackラベルまたは修正PRをチェックして計算
        pass
    
    def mttr(self, repo):
        """平均復旧時間"""
        # インシデント管理ツールAPIから取得
        pass
```

---

## まとめ

モダン開発ツールチェーンは、ソフトウェアエンジニアリングのコア競争力です。これらのツールを習得することで、以下を実現できます：

- **開発効率の向上**: AI支援プログラミング、自動化ワークフロー
- **コード品質の保証**: 自動化テスト、コードレビュー、セキュリティスキャン
- **デリバリー速度の加速**: CI/CD、GitOps、Infrastructure as Code
- **システムの安定性確保**: 包括的な監視、迅速な復旧

### ツールチェーン成熟度チェックリスト

```markdown
## Level 1: 基礎
- [ ] コードバージョン管理 (Git)
- [ ] コードエディタ/IDE設定
- [ ] 基本的なCI/CDパイプライン
- [ ] 自動化テスト

## Level 2: 自動化
- [ ] コード品質スキャン
- [ ] セキュリティスキャン統合
- [ ] コンテナ化デプロイメント
- [ ] 環境即コード

## Level 3: 高度
- [ ] Kubernetesオーケストレーション
- [ ] GitOpsワークフロー
- [ ] 包括的なオブザーバビリティ
- [ ] プラットフォームエンジニアリングセルフサービス

## Level 4: 最適化
- [ ] DORAメトリクス追跡
- [ ] AI支援開発
- [ ] カオスエンジニアリング
- [ ] 継続的な最適化
```

新しいツールを継続的に学び、開発ワークフローを最適化してください！

---

*バージョン: v1.0*  
*更新日: 2026-03-02*
