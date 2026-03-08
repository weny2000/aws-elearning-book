# AWS AI/ML 学习路线图 (Learning Roadmap)

> 从入门到精通，系统掌握 AWS AI 技术栈

---

## 🎯 学习路径总览

```
Level 1: 基础入门 (2周)
    ↓
Level 2: 进阶应用 (4周)
    ↓
Level 3: 生产部署 (4周)
    ↓
Level 4: 架构专家 (持续)
```

---

## Level 1: 基础入门 (2周)

### 目标
- 理解 AWS AI 服务全景
- 掌握 Bedrock 基础 API 调用
- 完成第一个 AI 应用

### Week 1: 概念与基础

**Day 1-2: AWS AI 服务概览**
- [ ] 阅读《AWS AI/ML 白皮书》第一部分
- [ ] 理解 Bedrock vs SageMaker vs AgentCore 定位
- [ ] 观看 AWS 官方入门视频 (30分钟)

**Day 3-4: Bedrock Foundation Models**
- [ ] 学习模型选择指南
- [ ] 实践：使用 CLI 调用 Nova Pro
- [ ] 实践：使用 Python SDK 调用 Claude 3
- [ ] 比较不同模型的输出质量

**Day 5-7: 第一个项目 - 智能问答机器人**
- [ ] 项目：构建简单的客服问答系统
- [ ] 使用 Bedrock API 实现对话
- [ ] 添加基础错误处理
- [ ] 部署为 Lambda 函数

**产出物**: 可运行的问答机器人 Demo

### Week 2: RAG 与知识增强

**Day 8-9: Knowledge Bases 基础**
- [ ] 学习 RAG 架构原理
- [ ] 创建第一个 Knowledge Base
- [ ] 上传文档并测试检索

**Day 10-11: Guardrails 安全**
- [ ] 理解内容安全策略
- [ ] 配置基础 Guardrails
- [ ] 测试 PII 检测与脱敏

**Day 12-14: 项目 - 企业知识库助手**
- [ ] 整合 Knowledge Base + Bedrock
- [ ] 添加 Guardrails 保护
- [ ] 优化提示词模板

**产出物**: 带知识库的企业助手

---

## Level 2: 进阶应用 (4周)

### 目标
- 掌握 Agents 和 AgentCore
- 实现工具调用与记忆管理
- 构建完整的 AI 应用

### Week 3-4: Bedrock Agents

**Week 3: Agents 基础**
- [ ] 学习 Agent 架构与工作原理
- [ ] 创建第一个 Bedrock Agent
- [ ] 配置 Action Groups
- [ ] 集成 Lambda 函数

**Week 4: Agents 进阶**
- [ ] 会话状态管理
- [ ] 多 Action Group 编排
- [ ] 与 Knowledge Base 集成
- [ ] 项目：智能订单助手

**产出物**: 带工具调用能力的智能 Agent

### Week 5-6: AgentCore 核心

**Week 5: Runtime 与 Memory**
- [ ] 理解 AgentCore 架构
- [ ] 部署 Runtime 端点
- [ ] 实现短期记忆 (Session)
- [ ] 实现长期记忆 (Persistent)

**Week 6: Gateway 与 Observability**
- [ ] 配置 MCP 工具网关
- [ ] 集成外部 API
- [ ] 配置监控告警
- [ ] 项目：多工具智能助手

**产出物**: 完整的 AgentCore 应用

### Week 7-8: Prompt Engineering & Fine-tuning

**Week 7: Prompt Management**
- [ ] 学习 Prompt 版本控制
- [ ] 实践 A/B 测试
- [ ] 使用 Prompt Flows
- [ ] 优化提示词质量

**Week 8: Fine-tuning 基础**
- [ ] 理解微调 vs 提示工程
- [ ] 准备训练数据
- [ ] 执行 Fine-tuning Job
- [ ] 评估与部署自定义模型

**产出物**: 优化后的提示词库或微调模型

---

## Level 3: 生产部署 (4周)

### 目标
- 掌握 MLOps 与 DevOps
- 实现高可用与安全防护
- 成本优化与性能调优

### Week 9-10: DevOps 与 IaC

**Week 9: Infrastructure as Code**
- [ ] 学习 Terraform 基础
- [ ] 编写 Bedrock 基础设施代码
- [ ] 配置 CI/CD 流水线
- [ ] 实现自动化部署

**Week 10: 监控与可观测性**
- [ ] 配置 CloudWatch 监控
- [ ] 设置告警与自动修复
- [ ] 实现分布式追踪
- [ ] 构建运维仪表板

**产出物**: 完整的 IaC 仓库 + 监控体系

### Week 11-12: 安全与成本优化

**Week 11: 安全加固**
- [ ] IAM 最小权限设计
- [ ] VPC 网络隔离
- [ ] 数据加密与审计
- [ ] 合规性检查

**Week 12: 成本优化**
- [ ] 智能路由策略
- [ ] 缓存机制实现
- [ ] Spot 实例与预留容量
- [ ] FinOps 实践

**产出物**: 生产级安全配置 + 成本优化报告

---

## Level 4: 架构专家 (持续学习)

### 专项领域 (选择 1-2 个深入)

#### 方向 A: 多模态 AI
- [ ] Nova Canvas 图像生成
- [ ] Nova Reel 视频生成
- [ ] Vision 模型应用
- [ ] 语音 AI (Transcribe + Polly)

#### 方向 B: 高级 MLOps
- [ ] SageMaker 深度应用
- [ ] 分布式训练
- [ ] 模型监控与漂移检测
- [ ] A/B 测试与金丝雀部署

#### 方向 C: 企业级架构
- [ ] 多租户设计
- [ ] 跨区域容灾
- [ ] 大规模并发处理
- [ ] 混合云架构

### 认证准备

**AWS Certified Machine Learning - Specialty**
- [ ] 完成官方课程
- [ ] 练习模拟考试
- [ ] 备考 2-3 个月

---

## 📅 每周学习计划模板

```
周一: 理论学习 (2小时)
├── 阅读文档/白皮书
└── 观看视频教程

周二-周三: 动手实践 (4小时)
├── 跟随教程操作
├── 编写代码
└── 遇到问题查资料

周四: 项目开发 (3小时)
├── 应用所学知识
├── 构建实际功能
└── 调试与优化

周五: 复习总结 (2小时)
├── 整理笔记
├── 写学习博客
└── 准备下周内容

周末: 拓展阅读 (可选)
├── 阅读技术博客
├── 参与社区讨论
└── 看源码学习
```

---

## 🛠️ 推荐开发环境

### 基础工具
- **AWS CLI**: 最新版本
- **Python**: 3.11+
- **IDE**: VS Code + AWS Toolkit
- **Git**: 版本控制

### Python 依赖
```bash
pip install boto3 awscli sagemaker
pip install anthropic langchain
pip install terraform-cdk
```

### AWS 账户配置
- [ ] 创建 AWS 账户
- [ ] 配置 IAM 用户 + MFA
- [ ] 设置预算告警
- [ ] 申请 Bedrock 模型访问权限

---

## 📝 学习检查清单

### Level 1 完成标准
- [ ] 成功调用 3+ 个不同模型
- [ ] 创建 Knowledge Base 并检索
- [ ] 部署 Lambda 函数运行 AI 应用
- [ ] 理解 Token 计费机制

### Level 2 完成标准
- [ ] 构建带工具调用的 Agent
- [ ] 实现会话记忆功能
- [ ] 完成 Prompt A/B 测试
- [ ] 训练或微调一个自定义模型

### Level 3 完成标准
- [ ] 使用 Terraform 部署完整基础设施
- [ ] 配置生产级监控告警
- [ ] 通过安全审计检查
- [ ] 实现 30%+ 成本节省

### Level 4 完成标准
- [ ] 发表技术博客或演讲
- [ ] 获得 AWS ML 认证
- [ ] 主导一个企业级 AI 项目
- [ ] 贡献开源项目

---

## 📚 推荐学习资源

### 必读文档
1. 《AWS AI/ML 全栈技术白皮书》(本电子书)
2. 《Bedrock Developer Guide》
3. 《AgentCore Developer Guide》
4. 《Well-Architected Machine Learning Lens》

### 视频课程
- [AWS Machine Learning University](https://aws.amazon.com/machine-learning/mlu/)
- [DeepLearning.AI AWS Specialization](https://www.deeplearning.ai/)
- [A Cloud Guru AWS ML](https://acloudguru.com/)

### 实践项目
- **初级**: 智能客服机器人
- **中级**: 多模态内容生成平台
- **高级**: 企业级 AI 中台

### 社区与活动
- AWS re:Invent (年度大会)
- AWS User Groups (本地社群)
- AWS Builders Online Series

---

## 🎯 学习里程碑

```
Week 2:  "Hello AI" - 第一次成功调用 API
    ⭐
    
Week 4:  "Agent Builder" - 构建第一个智能 Agent
    ⭐⭐
    
Week 8:  "AI Engineer" - 完成进阶课程
    ⭐⭐⭐
    
Week 12: "Production Ready" - 部署生产级应用
    ⭐⭐⭐⭐
    
Week 20+: "AI Architect" - 获得认证，主导项目
    ⭐⭐⭐⭐⭐
```

---

**开始你的 AI 学习之旅吧！** 🚀

> 记住：实践是最好的学习方式。每学一个概念，就要动手做一个小项目。
