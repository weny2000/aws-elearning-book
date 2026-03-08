# 📚 E-Book 技术资源库

> 多语言、模块化的技术学习资源平台

---

## 📊 架构图支持

所有核心技术文档和实践项目都包含 **Mermaid 架构图**，帮助理解：
- 系统架构和组件关系
- 数据流和交互流程
- 状态转换和生命周期

架构图可在 GitHub、GitLab、Notion 等平台直接渲染。

---

## 📂 文档导航

| 文档 | 说明 |
|------|------|
| [INDEX.md](./INDEX.md) | 完整目录索引 |
| [STRUCTURE.md](./STRUCTURE.md) | 目录结构说明 |
| [MODULARIZATION_SUMMARY.md](./MODULARIZATION_SUMMARY.md) | 重构完成报告 |

---

## 📁 目录结构

```
e-book/
├── README.md                      # 📖 本文件 - 总入口
├── INDEX.md                       # 📑 目录索引
├── topics/                        # 🎯 主题目录
│   ├── aws-ai/                    #   AWS AI/ML 主题
│   │   ├── README.md              #   主题介绍
│   │   ├── zh/                    #   中文资源
│   │   ├── en/                    #   英文资源
│   │   ├── ja/                    #   日文资源
│   │   └── aws-ai-projects/       #   实践项目
│   │
│   └── serverless/                #   Serverless 主题
│       ├── README.md              #   主题介绍
│       ├── zh/                    #   中文资源
│       └── projects/              #   实践项目
│
├── shared/                        # 🔧 共享资源
│   ├── TRANSLATION_GUIDE.md       #   翻译指南
│   ├── TRANSLATION_STATUS.md      #   翻译状态
│   └── templates/                 #   主题模板
│       └── new-topic-template/    #   新主题模板
│
└── docs/                          # 📖 文档
    └── how-to-add-topic.md        #   如何添加新主题
```

---

## 🎯 现有主题

| 主题 | 路径 | 语言 | 状态 | 规模 |
|------|------|------|------|------|
| **AWS AI/ML** | [topics/aws-ai/](./topics/aws-ai/) | 中/英/日 | ✅ 可用 | 34万字+ |
| **Serverless** | [topics/serverless/](./topics/serverless/) | 中文 | ✅ 可用 | Lambda + Fargate |

---

## 🚀 快速开始

### 选择主题
```bash
cd topics/aws-ai/
cat README.md
```

### 选择语言
```bash
# 中文
cd topics/aws-ai/zh/ebooks/

# English
cd topics/aws-ai/en/ebooks/

# 日本語
cd topics/aws-ai/ja/ebooks/
```

---

## 📖 使用指南

### 对于学习者
1. 选择感兴趣的主题 (`topics/`)
2. 选择熟悉的语言 (`zh/`, `en/`, `ja/`)
3. 按照学习路线图开始学习
4. 动手完成实践项目

### 对于贡献者
1. 查看 [如何添加新主题](./docs/how-to-add-topic.md)
2. 使用 [主题模板](./shared/templates/new-topic-template/)
3. 遵循 [翻译指南](./shared/TRANSLATION_GUIDE.md)
4. 提交 Pull Request

---

## 🆕 添加新主题

想要添加新的学习主题（如 Azure AI、GCP AI、OpenAI 等）？

请参考：[如何添加新主题](./docs/how-to-add-topic.md)

### 计划中的主题
- [ ] Azure Serverless (Azure Functions + Container Apps)
- [ ] GCP Serverless (Cloud Functions + Cloud Run)
- [ ] Kubernetes (EKS + Fargate)
- [ ] Microservices Architecture

---

## 🤝 贡献指南

欢迎贡献新的主题、翻译或改进！

### 贡献方式
1. **添加新主题**: 使用模板创建新的技术主题
2. **翻译**: 将现有主题翻译成新的语言
3. **内容改进**: 修正错误、更新内容、添加示例
4. **项目贡献**: 添加新的实践项目

### 质量标准
- 技术准确性：内容需经过验证
- 语言质量：母语级别表达
- 格式规范：遵循 Markdown 规范
- 代码可运行：所有代码示例需测试通过

---

## 📊 资源统计

| 指标 | 数量 |
|------|------|
| **主题数** | 2 (AWS AI/ML, Serverless) |
| **语言数** | 3 (中/英/日) |
| **总字数** | ~35万字+ |
| **电子书** | 15本 |
| **技术文档** | 13篇 |
| **实践项目** | 7个 |
| **架构图** | 70+ |
| **代码示例** | 250+ |

---

## 📜 许可

MIT License - 详见 [LICENSE](../LICENSE)

---

**🚀 选择主题，开始学习之旅！**
