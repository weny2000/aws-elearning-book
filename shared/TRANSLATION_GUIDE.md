# AWS AI/ML 多语言翻译指南

> Translation Guide for AWS AI/ML Technical Resources

---

## 📋 术语对照表 (Terminology Glossary)

### 核心服务名称 (Core Service Names)

| 中文 (zh) | English (en) | 日本語 (ja) | 备注 |
|-----------|--------------|-------------|------|
| 基础模型 | Foundation Model | ファウンデーションモデル | 保持英文首字母大写 |
| 大语言模型 | Large Language Model (LLM) | 大規模言語モデル | 缩写 LLM 通用 |
| 生成式 AI | Generative AI | 生成 AI | - |
| 智能体 | Agent | エージェント | - |
| 知识库 | Knowledge Base | ナレッジベース | AWS 服务名保持英文 |

### Amazon Bedrock 相关

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| Bedrock | Bedrock | Bedrock | **保持英文，不翻译** |
| AgentCore | AgentCore | AgentCore | **保持英文，不翻译** |
| Guardrails | Guardrails | ガードレール | 日文可翻译 |
| 安全护栏 | Safety Guardrails | セーフティガードレール | - |
| 提示词 | Prompt | プロンプト | - |
| 提示工程 | Prompt Engineering | プロンプトエンジニアリング | - |
| 微调 | Fine-tuning | ファインチューニング | - |
| 持续预训练 | Continued Pre-training | 継続的事前学習 | - |
| 检索增强生成 | RAG (Retrieval-Augmented Generation) | 検索拡張生成 | 缩写 RAG 通用 |
| 嵌入模型 | Embedding Model | 埋め込みモデル | - |
| 向量存储 | Vector Store | ベクトルストア | - |

### AgentCore 组件

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| Runtime | Runtime | ランタイム | **保持英文** |
| Memory | Memory | メモリ | **保持英文** |
| Gateway | Gateway | ゲートウェイ | **保持英文** |
| Observability | Observability | オブザーバビリティ | **保持英文** |
| Identity | Identity | アイデンティティ | **保持英文** |
| 短期记忆 | Short-term Memory | 短期記憶 | - |
| 长期记忆 | Long-term Memory | 長期記憶 | - |
| 工具网关 | Tool Gateway | ツールゲートウェイ | - |
| 模型上下文协议 | MCP (Model Context Protocol) | モデルコンテキストプロトコル | - |

### 模型名称 (Model Names)

| 中文引用 | English | 日本語 | 备注 |
|---------|---------|--------|------|
| Claude | Claude | Claude | **保持英文** |
| Nova | Nova | Nova | **保持英文** |
| Llama | Llama | Llama | **保持英文** |
| Titan | Titan | Titan | **保持英文** |
| Sonnet | Sonnet | Sonnet | Claude 版本 |
| Opus | Opus | Opus | Claude 版本 |
| Haiku | Haiku | Haiku | Claude 版本 |

### Nova 多模态

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| Nova Canvas | Nova Canvas | Nova Canvas | **保持英文** |
| Nova Reel | Nova Reel | Nova Reel | **保持英文** |
| 图像生成 | Image Generation | 画像生成 | - |
| 视频生成 | Video Generation | 動画生成 | - |
| 文本转图像 | Text-to-Image | テキストto画像 | - |
| 文本转视频 | Text-to-Video | テキストto動画 | - |

### 技术术语

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| 推理 | Inference | 推論 | - |
| 嵌入 | Embedding | 埋め込み | - |
| 标记/词元 | Token | トークン | - |
| 温度 | Temperature | 温度 | LLM 参数 |
| 上下文窗口 | Context Window | コンテキストウィンドウ | - |
| 幻觉 | Hallucination | 幻覚 | - |
| 温度系数 | Temperature | Temperature | **保持英文** |
| 词嵌入 | Word Embedding | 単語埋め込み | - |
| 语义搜索 | Semantic Search | セマンティック検索 | - |

### 架构与安全

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| 零信任 | Zero Trust | ゼロトラスト | - |
| 最小权限 | Least Privilege | 最小権限 | - |
| 纵深防御 | Defense in Depth | 深層防御 | - |
|  personally identifiable information | PII | 個人識別情報 | 缩写 PII 通用 |
| 访问控制 | Access Control | アクセス制御 | - |
| 审计日志 | Audit Log | 監査ログ | - |

### MLOps/DevOps

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| 基础设施即代码 | IaC (Infrastructure as Code) | インフラストラクチャアズコード | - |
| 持续集成/持续部署 | CI/CD | CI/CD | **保持缩写** |
| 可观测性 | Observability | 可観測性 | - |
| 分布式追踪 | Distributed Tracing | 分散トレーシング | - |
| 金丝雀发布 | Canary Deployment | カナリアリリース | - |

### 云计算通用

| 中文 | English | 日本語 | 备注 |
|------|---------|--------|------|
| 无服务器 | Serverless | サーバーレス | - |
| 托管服务 | Managed Service | マネージドサービス | - |
| 冷启动 | Cold Start | コールドスタート | - |
| 自动扩缩容 | Auto Scaling | オートスケーリング | - |
| 高可用 | High Availability | 高可用性 | - |

---

## 📝 翻译原则

### 1. 保持不翻译的项

以下类型**保持英文，不翻译**：

- **AWS 服务名称**: Amazon Bedrock, SageMaker, Lambda, S3, etc.
- **模型名称**: Claude, Nova, Llama, Titan
- **AgentCore 组件**: Runtime, Memory, Gateway, Observability, Identity
- **技术缩写**: API, SDK, CLI, CI/CD, HTTP, JSON, IAM, ARN
- **代码中的变量名、函数名**: `invoke_model`, `lambda_handler`

### 2. 可以翻译的项

- 普通技术名词: "智能体" → "Agent" → "エージェント"
- 描述性语句
- 类比和解释
- 章节标题

### 3. 代码处理

```python
# 代码注释需要翻译
# 调用 Bedrock API (中文)
# Invoke Bedrock API (English)
# Bedrock API を呼び出す (日本語)

# 代码本身保持英文
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet',  # 保持英文
    body=payload
)
```

### 4. 格式保持

- Markdown 格式标记保持原样: `#`, `##`, `-`, `*`, ````
- 表格格式保持对齐
- 代码块语言标记不变: ```python, ```bash
- Front matter (YAML) 结构保持

---

## 🔄 翻译流程建议

### 阶段 1: 机器翻译 + 人工校对

1. 使用 DeepL / Google Translate 进行初译
2. 技术专家校对术语准确性
3. 母语者校对语言自然度

### 阶段 2: 一致性检查

1. 使用术语表统一翻译
2. 检查代码示例可运行性
3. 验证链接和引用

### 阶段 3: 本地化优化

1. 调整文化相关的类比
2. 适配本地使用习惯
3. 添加地区特定的注意事项

---

## 📁 文件命名规范

### 中文 (zh)
```
zh/
├── ebooks/
│   ├── README.md                           # 导航索引
│   ├── AWS_AI_ML_Ebook.md                  # 主白皮书
│   ├── AWS_AI_Quick_Reference.md           # 速查手册
│   └── AWS_AI_Learning_Roadmap.md          # 学习路线图
└── materials/
    ├── aws_bedrock_foundation_models.md    # Bedrock 基础模型
    ├── aws_bedrock_guardrails.md           # Guardrails 安全
    └── ...
```

### 英文 (en)
```
en/
├── ebooks/
│   ├── README.md                           # Navigation
│   ├── AWS_AI_ML_Ebook.md                  # Main Whitepaper
│   ├── Quick_Reference.md                  # Quick Ref
│   └── Learning_Roadmap.md                 # Learning Path
└── materials/
    ├── bedrock/
    │   ├── Foundation_Models.md
    │   ├── Guardrails.md
    │   └── ...
    ├── agentcore/
    │   └── Complete_Guide.md
    └── aws-services/
        ├── SageMaker.md
        └── Speech_AI.md
```

### 日文 (ja)
```
ja/
├── ebooks/
│   ├── README.md                           # ナビゲーション
│   ├── AWS_AI_ML_Ebook.md                  # メインホワイトペーパー
│   ├── Quick_Reference.md                  # クイックリファレンス
│   └── Learning_Roadmap.md                 # 学習ロードマップ
└── materials/
    ├── bedrock/
    │   ├── Foundation_Models.md            # ファウンデーションモデル
    │   ├── Guardrails.md                   # ガードレール
    │   └── ...
    ├── agentcore/
    │   └── Complete_Guide.md               # 完全ガイド
    └── aws-services/
        ├── SageMaker.md
        └── Speech_AI.md                    # スピーチAI
```

---

## ✅ 翻译检查清单

### 翻译前
- [ ] 理解原文技术含义
- [ ] 准备术语表
- [ ] 确定目标读者水平

### 翻译中
- [ ] 保持代码可运行
- [ ] 统一术语翻译
- [ ] 保留 AWS 服务名不翻译
- [ ] 保持 Markdown 格式

### 翻译后
- [ ] 技术准确性检查
- [ ] 语言自然度检查
- [ ] 代码验证（可运行）
- [ ] 链接有效性检查
- [ ] 母语者最终审校

---

## 📞 翻译支持

如遇以下情况，建议咨询 AWS 官方文档：
- 新服务或功能翻译不确定
- 官方日文/英文术语对照
- 特定地区用法

**AWS 官方文档参考**:
- AWS Docs (English): https://docs.aws.amazon.com/
- AWS Docs (日本語): https://docs.aws.amazon.com/ja_jp/
- AWS 文档 (中文): https://docs.amazonaws.cn/

---

**翻译质量是技术文档的生命线，请严格遵循本指南！**
