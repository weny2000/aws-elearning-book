# 📚 E-Book 技术资源库 - 完整索引

> 多语言、模块化的技术学习资源平台

---

## 📂 目录结构

```
e-book/
│
├── 📄 核心文档
│   ├── README.md                    # 🌍 总入口
│   ├── INDEX.md                     # 📑 本文件
│   ├── STRUCTURE.md                 # 📂 结构说明
│   ├── MODULARIZATION_SUMMARY.md    # 📦 模块化重构报告
│   └── ARCHITECTURE_DIAGRAMS_SUMMARY.md  # 📊 架构图汇总
│
├── topics/                          # 🎯 主题目录
│   ├── aws-ai/                      #   AWS AI/ML 主题
│   │   ├── README.md
│   │   ├── zh/                      #     🇨🇳 中文
│   │   ├── en/                      #     🇺🇸 英文
│   │   ├── ja/                      #     🇯🇵 日文
│   │   └── aws-ai-projects/         #     💻 实践项目
│   │
│   └── serverless/                  #   Serverless 主题
│       ├── README.md
│       ├── zh/                      #     🇨🇳 中文
│       │   ├── ebooks/              #       电子书
│       │   ├── materials/           #       技术文档
│       │   └── projects/            #       实践项目
│       └── projects/                #     💻 实践项目
│
├── shared/                          # 🔧 共享资源
│   ├── TRANSLATION_GUIDE.md
│   ├── TRANSLATION_STATUS.md
│   └── templates/                   #   主题模板
│       └── new-topic-template/
│
└── docs/                            # 📖 文档
    └── how-to-add-topic.md
```

---

## 📂 主题索引

### 1. AWS AI/ML

**路径**: `topics/aws-ai/`

| 类型 | 数量 | 内容 |
|------|------|------|
| **电子书** | 12本 | 白皮书、速查手册、学习路线图 (中英日三语) |
| **技术文档** | 10篇 | Bedrock全系列、AgentCore、SageMaker、语音AI |
| **实践项目** | 4个 | 聊天机器人、RAG助手、AgentCore助手、多模态平台 |
| **总字数** | ~34万字 | 中英日三语 |

**核心内容**:
- Amazon Bedrock (Foundation Models, Knowledge Bases, Agents, Guardrails, Prompt Management, Fine-tuning, Multimodal)
- AgentCore (Runtime, Memory, Gateway, Observability, Identity)
- Amazon SageMaker ML平台
- Amazon Transcribe + Polly 语音AI

---

### 2. Serverless

**路径**: `topics/serverless/`

| 类型 | 数量 | 内容 |
|------|------|------|
| **电子书** | 3本 | 技术白皮书、速查手册、16周学习路线图 |
| **技术文档** | 3篇 | Lambda深度解析、Fargate深度解析、集成模式 |
| **实践项目** | 3个 | Serverless API、容器化微服务、混合数据处理 |
| **架构图** | 15+ | Mermaid架构图辅助说明 |

**核心内容**:
- AWS Lambda - 事件驱动函数计算
- AWS Fargate - 无服务器容器计算
- Lambda + Fargate 混合架构设计

---

## 🚀 快速开始

### 选择主题

```bash
# AWS AI/ML
cd topics/aws-ai/
cat README.md

# Serverless
cd topics/serverless/
cat README.md
```

### 选择语言

```bash
# 中文
cd topics/aws-ai/zh/ebooks/
# 或
cd topics/serverless/zh/ebooks/

# English
cd topics/aws-ai/en/ebooks/
```

---

## 📊 资源统计

### 按主题统计

| 主题 | 电子书 | 技术文档 | 项目 | 架构图 | 状态 |
|------|--------|----------|------|--------|------|
| AWS AI/ML | 12 | 10 | 4 | 55 | ✅ 完整 |
| Serverless | 3 | 3 | 3 | 15 | ✅ 可用 |
| **总计** | **15** | **13** | **7** | **70+** | - |

### 按语言统计

| 语言 | 主题数 | 电子书 | 规模 |
|------|--------|--------|------|
| 🇨🇳 中文 | 2 | 8+ | ~25万字 |
| 🇺🇸 English | 1 | 4 | ~6万词 |
| 🇯🇵 日本語 | 1 | 4 | ~8万字 |

---

## 🎯 推荐学习路径

### Serverless 新手

```
1. 阅读 Serverless 白皮书 (topics/serverless/zh/ebooks/)
2. 完成项目1: Serverless REST API
3. 学习 Lambda 深度解析文档
4. 完成项目2: 容器化微服务
5. 学习 Fargate 深度解析文档
6. 完成项目3: 混合数据处理
```

### AWS AI/ML 新手

```
1. 阅读学习路线图 (topics/aws-ai/zh/ebooks/)
2. 按路线图完成 Week 1-4
3. 阅读 Bedrock 技术文档
4. 完成项目1: 聊天机器人
5. 继续进阶学习...
```

---

## 🔗 重要链接

- [总入口 README](./README.md)
- [结构说明 STRUCTURE.md](./STRUCTURE.md)
- [架构图汇总 ARCHITECTURE_DIAGRAMS_SUMMARY.md](./ARCHITECTURE_DIAGRAMS_SUMMARY.md)
- [如何添加新主题](./docs/how-to-add-topic.md)

---

**🎉 所有资源已就绪，选择感兴趣的主题开始学习吧！**
