# Project 01: 智能问答机器人 (入门项目)

一个基于 Amazon Bedrock 的简单聊天机器人，支持多种模型切换和流式响应。

## 🎯 项目目标

- 掌握 Bedrock API 调用
- 理解模型选择策略
- 实现基础的对话接口

## 🏗️ 架构

### 系统架构图

```mermaid
flowchart TB
    subgraph Client["客户端"]
        Web[Web界面]
        Mobile[移动应用]
        CLI[命令行工具]
    end
    
    subgraph AWS["AWS云"]
        APIGW[API Gateway\nREST API]
        
        subgraph LambdaFunc["Lambda函数"]
            Handler[请求处理器]
            ModelRouter[模型路由器]
            StreamHandler[流式响应处理器]
        end
        
        Bedrock[Amazon Bedrock]
    end
    
    subgraph Models["基础模型"]
        Claude[Claude 3.5]
        Nova[Amazon Nova]
        Llama[Llama 3]
    end
    
    Client -->|HTTPS| APIGW
    APIGW --> LambdaFunc
    Handler --> ModelRouter
    ModelRouter --> Bedrock
    Bedrock --> Claude
    Bedrock --> Nova
    Bedrock --> Llama
    StreamHandler -->|SSE| Client
```

### 请求处理流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant APIGW as API Gateway
    participant Lambda as Lambda函数
    participant Bedrock as Amazon Bedrock
    participant LLM as 基础模型
    
    User->>APIGW: POST /chat<br/>{message, model}
    APIGW->>Lambda: 触发函数
    
    Lambda->>Lambda: 1. 解析请求参数
    Lambda->>Lambda: 2. 构建prompt
    
    alt 流式响应
        Lambda->>Bedrock: 3a. invoke_model_with_response_stream
        Bedrock->>LLM: 流式生成
        loop 流式返回
            LLM-->>Bedrock: token chunk
            Bedrock-->>Lambda: 流数据
            Lambda-->>APIGW: SSE推送
            APIGW-->>User: 实时显示
        end
    else 完整响应
        Lambda->>Bedrock: 3b. invoke_model
        Bedrock->>LLM: 生成完整响应
        LLM-->>Bedrock: 结果
        Bedrock-->>Lambda: 完整响应
        Lambda-->>APIGW: JSON响应
        APIGW-->>User: 显示结果
    end
```

### 模型选择策略

```mermaid
flowchart TD
    A[用户请求] --> B{选择模型?}
    B -->|默认| C[Nova Pro]
    B -->|复杂推理| D[Claude 3.5]
    B -->|成本敏感| E[Nova Lite]
    B -->|开源需求| F[Llama 3]
    
    C --> G{检查配额}
    D --> G
    E --> G
    F --> G
    
    G -->|可用| H[调用模型]
    G -->|限流| I[指数退避重试]
    G -->|失败| J[降级到Nova Lite]
    
    I --> H
    J --> H
    H --> K[返回响应]
```

## 📁 项目结构

```
01-chatbot-basic/
├── src/                    # 源代码
│   ├── lambda_function.py  # Lambda 处理函数
│   ├── models.py          # 模型配置
│   └── utils.py           # 工具函数
├── infra/                  # 基础设施
│   ├── main.tf            # Terraform 主配置
│   └── variables.tf       # 变量定义
├── deploy/                 # 部署脚本
│   ├── deploy.sh          # 一键部署
│   └── test.sh            # 测试脚本
├── docs/                   # 文档
│   └── API.md             # API 文档
└── README.md              # 项目说明
```

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
pip install -r requirements.txt

# 配置 AWS 凭证
aws configure
```

### 2. 本地测试

```bash
# 运行本地测试
python src/local_test.py
```

### 3. 部署到 AWS

```bash
# 一键部署
cd deploy
./deploy.sh
```

### 4. 测试 API

```bash
# 调用 API
curl -X POST https://your-api.execute-api.us-east-1.amazonaws.com/prod/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "你好", "model": "nova-pro"}'
```

## 📚 学习要点

1. **Bedrock Runtime API**: invoke_model vs invoke_model_with_response_stream
2. **模型选择**: 根据成本和延迟选择合适的模型
3. **错误处理**: ThrottlingException 的重试机制
4. **成本优化**: Token 计算和缓存策略

## 💰 成本估算

| 使用量 | 模型 | 月成本 |
|--------|------|--------|
| 1K 次/天 | Nova Lite | ~$2 |
| 1K 次/天 | Nova Pro | ~$25 |
| 1K 次/天 | Claude 3.5 | ~$90 |
