# AWS AI/ML 快速参考手册 (Quick Reference)

> 一页纸速查，快速解决实际问题

---

## 🚀 5分钟快速启动

### 场景 1: 立即开始用 Bedrock 调用模型

```python
import boto3
import json

# 1. 初始化客户端
bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# 2. 调用模型
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        'anthropic_version': 'bedrock-2023-05-31',
        'max_tokens': 256,
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    })
)

# 3. 解析结果
result = json.loads(response['body'].read())
print(result['content'][0]['text'])
```

### 场景 2: 立即部署一个 AgentCore Runtime

```bash
# 1. 创建 Runtime
aws bedrock-agentcore create-agent-runtime \
    --agent-name "my-first-agent" \
    --execution-role-arn "arn:aws:iam::123456789012:role/AgentCoreRole"

# 2. 部署端点
aws bedrock-agentcore create-agent-runtime-endpoint \
    --agent-runtime-id "<runtime-arn>" \
    --endpoint-alias "prod"

# 3. 调用
aws bedrock-agentcore invoke-agent-runtime \
    --endpoint-id "<endpoint-arn>" \
    --payload '{"prompt": "Hello!"}'
```

### 场景 3: 立即转录音频文件

```bash
# 1. 启动转录任务
aws transcribe start-transcription-job \
    --transcription-job-name "quick-job" \
    --language-code "zh-CN" \
    --media "MediaFileUri=s3://bucket/audio.mp3" \
    --output-bucket-name "bucket"

# 2. 检查结果
aws transcribe get-transcription-job \
    --transcription-job-name "quick-job"
```

---

## 📋 模型选择速查表

### 按使用场景

| 场景 | 推荐模型 | 模型ID | 成本/1K tokens | 延迟 |
|------|---------|--------|---------------|------|
| **快速原型** | Nova Lite | `amazon.nova-lite-v1:0` | $0.06 | 极低 |
| **生产通用** | Nova Pro | `amazon.nova-pro-v1:0` | $0.80 | 低 |
| **复杂推理** | Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20241022-v2:0` | $3.00 | 中 |
| **代码生成** | Claude 3.5 Sonnet | 同上 | $3.00 | 中 |
| **长文档(200K)** | Claude 3 | `anthropic.claude-3-sonnet-20240229-v1:0` | $3.00 | 中 |
| **开源微调** | Llama 3.3 70B | `meta.llama3-3-70b-instruct-v1:0` | $0.72 | 中 |

### 按成本敏感度

```
成本敏感 (节省 90%+) → Nova Lite/Micro
    ↓
平衡性价比 (节省 75%) → Nova Pro
    ↓
质量优先 → Claude 3.5 Sonnet
```

---

## 🔧 常用 CLI 命令大全

### Bedrock 基础

```bash
# 列出可用模型
aws bedrock list-foundation-models

# 调用模型 (流式)
aws bedrock-runtime invoke-model-with-response-stream \
    --model-id amazon.nova-pro-v1:0 \
    --body '{"inputText": "Hello"}'

# 检查配额
aws bedrock get-service-quota \
    --service-code bedrock \
    --quota-code L-...
```

### Knowledge Bases

```bash
# 创建 Knowledge Base
aws bedrock-agent create-knowledge-base \
    --name "my-kb" \
    --role-arn "arn:aws:iam::123456789012:role/BedrockRole"

# 检索内容
aws bedrock-agent-runtime retrieve \
    --knowledge-base-id "<kb-id>" \
    --retrieval-query '{"text": "查询内容"}'
```

### Guardrails

```bash
# 创建 Guardrail
aws bedrock create-guardrail \
    --name "safety-guardrail" \
    --content-policy-config '{...}'

# 应用 Guardrail
aws bedrock-runtime apply-guardrail \
    --guardrail-identifier "<id>" \
    --content '[{"text": {"text": "检查内容"}}]'
```

### Agents

```bash
# 创建 Agent
aws bedrock-agent create-agent \
    --agent-name "support-agent" \
    --foundation-model "anthropic.claude-3-sonnet-20240229-v1:0"

# 调用 Agent
aws bedrock-agent-runtime invoke-agent \
    --agent-id "<agent-id>" \
    --agent-alias-id "<alias-id>" \
    --session-id "session-001" \
    --input-text "用户输入"
```

### AgentCore

```bash
# Runtime 操作
aws bedrock-agentcore create-agent-runtime --agent-name "..."
aws bedrock-agentcore list-agent-runtimes
aws bedrock-agentcore delete-agent-runtime --agent-runtime-id "..."

# 调用
aws bedrock-agentcore invoke-agent-runtime \
    --endpoint-id "<endpoint>" \
    --payload '{"prompt": "..."}'
```

### 语音服务

```bash
# Transcribe
aws transcribe start-transcription-job \
    --transcription-job-name "..." \
    --language-code "zh-CN" \
    --media "MediaFileUri=s3://..."

# Polly
aws polly synthesize-speech \
    --output-format mp3 \
    --voice-id Zhiyu \
    --text "你好" \
    --output-file hello.mp3
```

---

## 💰 成本计算器

### Bedrock 调用成本估算

```python
def estimate_cost(model_id, input_tokens, output_tokens):
    """估算单次调用成本"""
    
    PRICING = {
        'anthropic.claude-3-5-sonnet': {'input': 0.003, 'output': 0.015},
        'amazon.nova-pro': {'input': 0.0008, 'output': 0.0032},
        'amazon.nova-lite': {'input': 0.00006, 'output': 0.00024},
    }
    
    prices = PRICING.get(model_id, PRICING['amazon.nova-pro'])
    
    input_cost = (input_tokens / 1000) * prices['input']
    output_cost = (output_tokens / 1000) * prices['output']
    
    return input_cost + output_cost

# 示例: Claude 3.5 调用，1K 输入 + 500 输出
# 成本 = $0.003 + $0.0075 = $0.0105 ≈ 1美分
```

### 月度成本估算模板

| 项目 | 数量 | 单价 | 月成本 |
|------|------|------|--------|
| Nova Pro 调用 | 100K | $0.8/1K | $80 |
| Claude 3.5 调用 | 10K | $3/1K | $30 |
| 存储 (S3) | 100GB | $0.023/GB | $2.3 |
| **总计** | - | - | **~$113** |

---

## 🐛 错误码速查

### Bedrock 常见错误

| 错误码 | HTTP | 原因 | 快速修复 |
|--------|------|------|----------|
| ThrottlingException | 429 | 超配额 | 指数退避重试 |
| ValidationException | 400 | 参数错误 | 检查 JSON 格式 |
| AccessDeniedException | 403 | 无权限 | 检查 IAM 角色 |
| ServiceUnavailable | 503 | 服务不可用 | 切换区域重试 |

### AgentCore 常见错误

| 错误码 | 原因 | 快速修复 |
|--------|------|----------|
| ResourceLimitExceeded | 会话数超限 | 清理空闲会话 |
| RuntimeTimeout | 执行超时 | 拆分任务或增加超时 |
| SessionNotFound | 会话过期 | 重新初始化会话 |

### 通用调试命令

```bash
# 检查 IAM 权限
aws iam simulate-principal-policy \
    --policy-source-arn "arn:aws:iam::123456789012:role/MyRole" \
    --action-names "bedrock:InvokeModel"

# 查看 CloudWatch 日志
aws logs tail /aws/bedrock/ --follow

# 检查服务状态
aws health describe-events \
    --filter "services=bedrock"
```

---

## 📊 性能基准参考

### 模型延迟 (P50)

| 模型 | 首 token 延迟 | 吞吐量 |
|------|--------------|--------|
| Nova Micro | 50ms | 极高 |
| Nova Lite | 100ms | 极高 |
| Nova Pro | 200ms | 高 |
| Claude 3.5 | 300ms | 中 |

### AgentCore Runtime

| 指标 | 基准值 | 优化后 |
|------|--------|--------|
| 冷启动时间 | 2s | <500ms (预置) |
| 会话创建 | 200ms | <100ms |
| 工具调用 | 500ms | <300ms (缓存) |

---

## 🔒 安全配置清单

### 最小 IAM 权限

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*",
                "arn:aws:bedrock:*::foundation-model/amazon.nova-*"
            ]
        }
    ]
}
```

### Guardrails 检查清单

- [ ] 内容过滤器 (仇恨/侮辱/性/暴力)
- [ ] PII 检测与脱敏
- [ ] 拒绝主题配置
- [ ] 上下文基础检查 (防止幻觉)
- [ ] 输入/输出拦截消息自定义

---

## 📚 学习资源链接

### 官方文档
- [Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AgentCore Docs](https://docs.aws.amazon.com/bedrock-agentcore/)
- [SageMaker Docs](https://docs.aws.amazon.com/sagemaker/)

### 代码示例
- [Bedrock Samples](https://github.com/aws-samples/amazon-bedrock-samples)
- [AgentCore Samples](https://github.com/awslabs/amazon-bedrock-agentcore-samples)

### 定价计算器
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [AWS Calculator](https://calculator.aws/)

---

**速查手册完成** - 建议打印或保存为书签，随时查阅！
