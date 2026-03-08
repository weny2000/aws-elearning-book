# E-Book 目录结构说明

```
e-book/                                    # 📚 技术资源库根目录
│
├── README.md                              # 🌍 总入口 - 多语言导航
├── INDEX.md                               # 📑 目录索引
├── STRUCTURE.md                           # 📂 本文件 - 结构说明
│
├── topics/                                # 🎯 主题目录
│   └── aws-ai/                            #   AWS AI/ML 主题
│       ├── README.md                      #     主题介绍
│       │
│       ├── zh/                            #     🇨🇳 中文资源
│       │   ├── ebooks/                    #       电子书
│       │   │   ├── README_Ebook.md
│       │   │   ├── AWS_AI_ML_Ebook.md
│       │   │   ├── AWS_AI_Quick_Reference.md
│       │   │   ├── AWS_AI_Learning_Roadmap.md
│       │   │   └── DELIVERY_SUMMARY.md
│       │   ├── materials/                 #       技术文档 (10篇)
│       │   └── projects/                  #       实践项目 (4个)
│       │
│       ├── en/                            #     🇺🇸 英文资源
│       │   └── ebooks/
│       │       ├── README.md
│       │       ├── AWS_AI_ML_Ebook.md
│       │       ├── Quick_Reference.md
│       │       └── Learning_Roadmap.md
│       │
│       ├── ja/                            #     🇯🇵 日文资源
│       │   └── ebooks/
│       │       ├── README.md
│       │       ├── AWS_AI_ML_Ebook.md
│       │       ├── Quick_Reference.md
│       │       └── Learning_Roadmap.md
│       │
│       └── aws-ai-projects/               #     💻 实践项目代码
│           ├── 01-chatbot-basic/
│           ├── 02-rag-assistant/
│           ├── 03-agentcore-assistant/
│           └── 04-multimodal-platform/
│
├── shared/                                # 🔧 共享资源
│   ├── TRANSLATION_GUIDE.md               #   翻译指南 & 术语表
│   ├── TRANSLATION_STATUS.md              #   翻译状态
│   ├── MULTILINGUAL_DELIVERY_SUMMARY.md   #   多语言交付总结
│   ├── FINAL_DELIVERY_SUMMARY.md          #   最终交付总结
│   │
│   └── templates/                         #   模板
│       └── new-topic-template/            #     新主题模板
│           ├── README.md
│           ├── zh/ebooks/README.md
│           ├── en/ebooks/README.md
│           ├── ja/ebooks/README.md
│           └── projects/01-starter/README.md
│
└── docs/                                  # 📖 文档
    └── how-to-add-topic.md                #   如何添加新主题
```

---

## 📊 统计信息

| 目录 | 数量 | 说明 |
|------|------|------|
| **topics/** | 1 | 现有主题数 |
| **shared/** | 4 | 共享资源文件 |
| **docs/** | 1 | 说明文档 |
| **总 Markdown** | 40+ | Markdown 文件总数 |

---

## 🆕 添加新主题

参考 `docs/how-to-add-topic.md` 和 `shared/templates/new-topic-template/`

示例：
```bash
cd topics/
cp -r ../shared/templates/new-topic-template/ azure-ai/
# 然后填充内容
```
