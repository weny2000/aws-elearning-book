# Project 01: Bedrock Agent CI/CD Pipeline

## 项目概述

一个完整的 Bedrock Agent CI/CD 流水线项目，演示如何将 AI Agent 开发纳入标准的 DevOps 流程。

## 架构

```
GitHub → CodePipeline → CodeBuild → Bedrock Agent
                ↓
        Prompt Versioning (S3 + DynamoDB)
                ↓
        Automated Testing → Evaluation
                ↓
        Production Deployment
```

## 项目结构

```
01-bedrock-agent-pipeline/
├── README.md
├── pipeline/
│   └── template.yaml          # CodePipeline CloudFormation
├── agent/
│   ├── prompts/               # Prompt 模板
│   │   ├── v1.0.0/
│   │   └── v1.1.0/
│   ├── action_groups/         # Lambda 动作组
│   │   ├── order_service/
│   │   └── customer_service/
│   └── agent_config.yaml      # Agent 配置
├── tests/
│   ├── unit/
│   ├── integration/
│   └── redteam/
├── src/
│   ├── prompt_manager.py      # Prompt 版本管理
│   └── ab_tester.py           # A/B 测试
└── buildspec.yml              # CodeBuild 配置
```

## 快速开始

### 1. 部署流水线

```bash
aws cloudformation deploy \
  --template-file pipeline/template.yaml \
  --stack-name bedrock-agent-pipeline \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides \
    GitHubConnectionArn=arn:aws:codestar-connections:...
```

### 2. 推送代码触发部署

```bash
git add .
git commit -m "Update prompt v1.1.0"
git push origin main
```

### 3. 查看部署状态

```bash
aws codeformation get-pipeline-state \
  --name bedrock-agent-pipeline
```

## 关键特性

- ✅ Prompt 版本管理（S3 + DynamoDB）
- ✅ 自动化测试（单元/集成/红队）
- ✅ A/B 测试框架
- ✅ 自动回滚机制
- ✅ Token 成本监控

## 技术栈

- Amazon Bedrock Agents
- AWS CodePipeline
- AWS CodeBuild
- Amazon DynamoDB
- Amazon S3
- AWS CloudWatch

---

**Part of AI Agent DevTools Topic**
**Part of AWS DevTools Hero Learning Path**
