# Project 04: 多模态 AI 内容平台 (生产级项目)

企业级多模态内容生成平台，集成 Nova Canvas、Nova Reel、Transcribe、Polly。

## 🎯 项目目标

- 构建完整的多模态 AI 平台
- 实现内容生成工作流编排
- 支持批量处理和队列管理

## 🏗️ 架构

### 多模态平台整体架构

```mermaid
flowchart TB
    subgraph Client["客户端"]
        Web[Web控制台]
        Mobile[移动应用]
        API[API集成]
    end
    
    subgraph Entry["接入层"]
        CloudFront[CloudFront CDN]
        APIGW[API Gateway]
        Cognito[用户认证]
    end
    
    subgraph Orchestration["编排层"]
        StepFunctions[Step Functions<br/>工作流编排]
        EventBridge[EventBridge<br/>事件总线]
    end
    
    subgraph Services["服务层"]
        ImageService[图像服务<br/>Nova Canvas]
        VideoService[视频服务<br/>Nova Reel]
        AudioService[语音服务<br/>Polly]
        TextService[文本服务<br/>Bedrock]
    end
    
    subgraph Queue["队列层"]
        SQS[任务队列]
        DLQ[死信队列]
    end
    
    subgraph Storage["存储层"]
        S3[(S3对象存储)]
        DynamoDB[(DynamoDB<br/>任务状态)]
        CloudFront2[CDN分发]
    end
    
    Client --> Entry
    Entry --> Orchestration
    Orchestration --> Services
    Services --> Queue
    Queue --> Services
    Services --> Storage
    Storage --> CloudFront2
    CloudFront2 --> Client
```

### 内容生成工作流

```mermaid
sequenceDiagram
    participant User as 用户
    participant API as API Gateway
    participant StepFn as Step Functions
    participant Service as 生成服务
    participant Queue as SQS队列
    participant Worker as Lambda Worker
    participant Bedrock as Bedrock/Canvas
    participant S3 as S3存储
    
    User->>API: 提交生成请求<br/>{type: image, prompt: "..."}
    API->>StepFn: 启动工作流
    
    StepFn->>DynamoDB: 创建任务记录
    StepFn->>Queue: 发送任务消息
    
    Queue->>Worker: 触发处理
    Worker->>Bedrock: 调用生成API
    
    alt 图像生成
        Bedrock->>Bedrock: Nova Canvas生成
    else 视频生成
        Bedrock->>Bedrock: Nova Reel生成
    else 语音合成
        Bedrock->>Bedrock: Polly合成
    end
    
    Bedrock-->>Worker: 返回结果
    Worker->>S3: 上传生成内容
    Worker->>DynamoDB: 更新任务状态
    
    StepFn-->>API: 工作流完成
    API-->>User: 返回内容URL
```

### 异步批处理架构

```mermaid
flowchart TB
    subgraph BatchInput["批处理输入"]
        BatchAPI[批处理API]
        CSV[CSV任务清单]
        JSONL[JSONL配置]
    end
    
    subgraph Dispatcher["任务分发"]
        Parser[任务解析器]
        Scheduler[任务调度器]
        Priority[优先级队列]
    end
    
    subgraph Workers["处理集群"]
        W1[Worker 1]
        W2[Worker 2]
        W3[Worker N]
    end
    
    subgraph Results["结果处理"]
        Aggregator[结果聚合器]
        Notify[通知服务]
        Archive[归档存储]
    end
    
    BatchInput --> Dispatcher
    Dispatcher --> W1
    Dispatcher --> W2
    Dispatcher --> W3
    W1 --> Results
    W2 --> Results
    W3 --> Results
```

### 错误处理与重试机制

```mermaid
flowchart TD
    A[任务提交] --> B{验证}
    B -->|失败| C[立即拒绝]
    B -->|通过| D[加入队列]
    
    D --> E[Worker处理]
    E --> F{执行结果}
    
    F -->|成功| G[保存结果]
    F -->|限流| H[延迟重试<br/>指数退避]
    F -->|失败| I[错误分类]
    
    I -->|可重试| J[重试队列<br/>最多3次]
    I -->|不可重试| K[死信队列]
    
    H --> E
    J --> E
    
    K --> L[人工介入]
    G --> M[通知用户]
    
    C --> M
```

## 📁 项目结构

```
04-multimodal-platform/
├── services/                   # 微服务
│   ├── image-service/         # 图像生成服务
│   ├── video-service/         # 视频生成服务
│   ├── audio-service/         # 语音合成服务
│   └── workflow-service/      # 工作流编排服务
├── infra/                      # 基础设施
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── vpc.tf
│   │   ├── ecs.tf
│   │   └── step_functions.tf
│   └── cloudformation/
├── web/                        # Web 控制台
│   ├── src/
│   └── package.json
├── workers/                    # 后台任务
│   ├── image_worker.py
│   ├── video_worker.py
│   └── audio_worker.py
├── shared/                     # 共享库
│   ├── models/
│   ├── utils/
│   └── constants.py
└── docs/                       # 文档
    ├── API.md
    ├── DEPLOYMENT.md
    └── ARCHITECTURE.md
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 克隆仓库
git clone https://github.com/your-org/multimodal-platform.git
cd multimodal-platform

# 安装依赖
make install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填写 AWS 凭证和配置
```

### 2. 本地运行

```bash
# 启动所有服务
make dev

# 或使用 Docker Compose
docker-compose up -d
```

### 3. 生产部署

```bash
# 部署基础设施
cd infra/terraform
terraform init
terraform apply

# 部署应用
make deploy-production
```

## 📚 API 示例

### 图像生成

```bash
curl -X POST https://api.example.com/v1/images \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "未来城市，赛博朋克风格",
    "width": 1280,
    "height": 720,
    "style": "cyberpunk"
  }'
```

### 视频生成

```bash
curl -X POST https://api.example.com/v1/videos \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "prompt": "海浪拍打沙滩，日出时分",
    "duration": 6,
    "camera_move": "pan_right"
  }'
```

### 批量任务

```bash
curl -X POST https://api.example.com/v1/batch \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "image_variations",
    "base_prompt": "产品照片，白色背景",
    "variations": [
      {"style": "modern", "lighting": "soft"},
      {"style": "vintage", "lighting": "warm"}
    ]
  }'
```

## 💰 成本优化

| 策略 | 节省 | 实现方式 |
|------|------|----------|
| 智能缓存 | 40% | Redis 缓存相似请求 |
| 批量处理 | 30% | SQS 队列合并任务 |
| Spot 实例 | 60% | 非紧急任务使用 Spot |
| CDN 加速 | 20% | CloudFront 全球分发 |

## 🔒 企业级特性

- **多租户**: 数据隔离与配额管理
- **审计日志**: 完整操作记录
- **内容审核**: Guardrails 自动检测
- **数字水印**: C2PA 标记 AI 生成内容

## 📊 监控指标

- 生成成功率
- 平均等待时间
- Token/字符消耗
- 成本 per 请求
