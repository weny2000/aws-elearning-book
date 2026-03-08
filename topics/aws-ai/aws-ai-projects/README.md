# AWS AI/ML 实践项目代码仓库

> 从入门到生产级的完整项目集合，配套《AWS AI/ML 全栈技术白皮书》

---

## 🎯 项目概览

本仓库包含 4 个渐进式实践项目，帮助您从 Bedrock 基础调用到生产级多模态平台。

```
项目难度梯度

Level 1: 01-chatbot-basic (入门)
    ↓ 理解基础 API 调用
Level 2: 02-rag-assistant (进阶)
    ↓ 掌握 RAG 架构
Level 3: 03-agentcore-assistant (高级)
    ↓ 理解 Agent 编排
Level 4: 04-multimodal-platform (专家)
    ↓ 构建企业级平台
```

---

## 📂 项目列表

### Project 01: 智能问答机器人 ⭐ 入门
**难度**: ⭐☆☆☆☆ | **预计时间**: 2-3 小时 | **成本**: <$5

基于 Bedrock 的简单聊天机器人，支持多模型切换。

**学习要点**:
- Bedrock Runtime API
- 模型选择策略
- Lambda + API Gateway 部署

**文件结构**:
```
01-chatbot-basic/
├── src/lambda_function.py    # Lambda 处理函数
├── infra/main.tf             # Terraform 配置
└── deploy/deploy.sh          # 一键部署脚本
```

**快速开始**:
```bash
cd 01-chatbot-basic/deploy
./deploy.sh
```

---

### Project 02: RAG 知识库助手 ⭐⭐ 进阶
**难度**: ⭐⭐☆☆☆ | **预计时间**: 1-2 天 | **成本**: ~$20

完整的 RAG 系统，包含 Knowledge Base、向量检索、提示工程。

**学习要点**:
- Knowledge Base 配置
- 向量检索优化
- Chunking 策略
- RAG 评估

**文件结构**:
```
02-rag-assistant/
├── src/lambda_function.py    # RAG 处理逻辑
├── infra/
│   ├── knowledge_base.tf     # KB 配置
│   └── opensearch.tf         # 向量数据库
└── notebooks/                # 评估笔记本
```

**快速开始**:
```bash
cd 02-rag-assistant
# 1. 上传文档到 S3
python data/upload_to_s3.py

# 2. 部署基础设施
terraform apply

# 3. 触发数据同步
aws bedrock-agent start-ingestion-job ...
```

---

### Project 03: AgentCore 智能助手 ⭐⭐⭐ 高级
**难度**: ⭐⭐⭐☆☆ | **预计时间**: 3-5 天 | **成本**: ~$50

完整的 AgentCore 应用，展示 Runtime、Memory、Gateway 集成。

**学习要点**:
- AgentCore 架构设计
- 短期/长期记忆实现
- MCP 工具调用
- 分布式追踪

**文件结构**:
```
03-agentcore-assistant/
├── backend/                  # Python 后端
│   ├── src/
│   │   ├── agent.py         # Agent 核心
│   │   ├── memory_store.py  # 记忆管理
│   │   └── tool_registry.py # 工具注册
├── frontend/                # React 前端
├── infra/                   # Terraform
└── docker-compose.yml
```

**快速开始**:
```bash
cd 03-agentcore-assistant
docker-compose up -d
```

---

### Project 04: 多模态 AI 平台 ⭐⭐⭐⭐ 专家
**难度**: ⭐⭐⭐⭐⭐ | **预计时间**: 1-2 周 | **成本**: ~$200

企业级多模态平台，集成 Canvas、Reel、Polly、Step Functions。

**学习要点**:
- 微服务架构设计
- 异步任务队列
- Step Functions 工作流
- 多租户与成本优化

**文件结构**:
```
04-multimodal-platform/
├── services/                # 微服务
│   ├── image-service/
│   ├── video-service/
│   └── audio-service/
├── infra/terraform/         # 完整基础设施
├── web/                     # 管理控制台
└── workers/                 # 后台任务
```

**快速开始**:
```bash
cd 04-multimodal-platform
make deploy-production
```

---

## 🛠️ 环境准备

### 必要条件

- AWS 账户 (推荐免费 tier)
- AWS CLI (v2+)
- Python 3.11+
- Terraform 1.5+
- Docker & Docker Compose

### 配置步骤

```bash
# 1. 配置 AWS 凭证
aws configure

# 2. 安装 Python 依赖
pip install -r requirements.txt

# 3. 申请 Bedrock 模型访问
# 访问 AWS 控制台 → Bedrock → Model Access

# 4. 设置环境变量
export AWS_REGION=us-east-1
export AWS_DEFAULT_REGION=us-east-1
```

---

## 📊 项目对比

| 特性 | P01 基础 | P02 RAG | P03 AgentCore | P04 多模态 |
|------|---------|---------|---------------|-----------|
| **Bedrock API** | ✅ | ✅ | ✅ | ✅ |
| **Knowledge Base** | ❌ | ✅ | ✅ | ❌ |
| **Agent 编排** | ❌ | ❌ | ✅ | ✅ |
| **多模态** | ❌ | ❌ | ❌ | ✅ |
| **前端** | ❌ | ❌ | ✅ | ✅ |
| **Terraform** | ✅ | ✅ | ✅ | ✅ |
| **CI/CD** | ❌ | ❌ | ✅ | ✅ |
| **监控** | 基础 | 基础 | 完整 | 完整 |

---

## 🎯 学习路径建议

### 路径 A: 快速体验 (1 周)
```
Day 1-2: Project 01 (基础聊天)
Day 3-4: Project 02 (RAG 知识库)
Day 5-7: 阅读白皮书，理解架构
```

### 路径 B: 进阶开发 (1 个月)
```
Week 1: Project 01 + 02 (Bedrock 基础)
Week 2: Project 03 (AgentCore 深入)
Week 3: Project 04 前半部分 (多模态)
Week 4: Project 04 后半部分 (生产部署)
```

### 路径 C: 全面掌握 (2 个月)
```
Month 1: 完成所有项目
- 每个项目都动手实现
- 阅读配套白皮书章节
- 完成所有练习

Month 2: 扩展与优化
- 添加新功能
- 性能调优
- 生产环境部署
- 贡献开源
```

---

## 💡 使用建议

### 对于学习者
1. **按顺序完成项目**：每个项目都建立在前一个基础上
2. **先跑通再修改**：先成功运行示例，再进行自定义
3. **记录问题**：遇到困难时查阅《速查手册》
4. **扩展功能**：在基础上添加自己的创意

### 对于开发者
1. **代码即文档**：所有代码都有详细注释
2. **模块化设计**：可以抽取组件到自己的项目
3. **Terraform 复用**：基础设施代码可以直接使用
4. **最佳实践**：遵循 AWS Well-Architected 原则

### 对于培训师
1. **分阶段教学**：每个项目可作为一课
2. **配套演示**：使用项目代码进行现场演示
3. **作业设计**：基于项目扩展布置作业
4. **评估标准**：提供项目完成检查清单

---

## 🔧 常见问题

### Q: 项目运行需要多少 AWS 费用？
**A**: 
- P01: <$5 (按测试几次计算)
- P02: ~$20 (OpenSearch Serverless 较贵)
- P03: ~$50 (持续运行一天)
- P04: ~$200 (完整测试多模态功能)

建议：使用 AWS Free Tier，完成后及时清理资源

### Q: 可以只运行部分项目吗？
**A**: 可以！每个项目都是独立的，有完整的 README 指导

### Q: 如何在本地开发而不使用 AWS？
**A**: 目前必须使用 AWS 服务，但可以使用 LocalStack 模拟部分服务（实验性）

### Q: 项目代码可以用于生产吗？
**A**: P04 设计为生产级，其他项目需要额外加固：
- 添加完整的错误处理
- 配置安全组和 IAM
- 实现限流和防刷
- 添加审计日志

---

## 📚 配套资源

- 📕 [AWS AI/ML 白皮书](../AWS_AI_ML_Ebook.md) - 系统化学习指南
- 📘 [速查手册](../AWS_AI_Quick_Reference.md) - 日常开发参考
- 📗 [学习路线图](../AWS_AI_Learning_Roadmap.md) - 20周学习计划

---

## 🤝 贡献指南

欢迎提交 Issue 和 PR：
1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 📜 许可

MIT License - 详见 [LICENSE](LICENSE)

---

**开始构建你的 AI 应用吧！** 🚀

> 提示：遇到问题时，先查阅项目 README，再看速查手册，最后参考白皮书对应章节。
