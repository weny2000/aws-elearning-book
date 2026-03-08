# AWS AI Agent 企业级架构速查手册

> AI Agent 开发必备命令、配置和最佳实践

---

## Bedrock Agent CLI

```bash
# 列出可用的基础模型
aws bedrock list-foundation-models --region us-east-1

# 调用模型
aws bedrock-runtime invoke-model \
    --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
    --body '{"prompt": "Human: Hello\nAssistant:", "max_tokens_to_sample": 300}' \
    --cli-binary-format raw-in-base64-out \
    response.json

# 创建 Agent
aws bedrock-agent create-agent \
    --agent-name my-enterprise-agent \
    --description "Enterprise AI Agent" \
    --foundation-model anthropic.claude-3-sonnet-20240229-v1:0 \
    --idle-session-ttl-in-seconds 1800 \
    --instruction "You are a helpful enterprise assistant..."

# 部署 Agent
aws bedrock-agent create-agent-alias \
    --agent-id <agent-id> \
    --agent-alias-name prod \
    --description "Production alias"

# 调用 Agent
aws bedrock-agent-runtime invoke-agent \
    --agent-id <agent-id> \
    --agent-alias-id <alias-id> \
    --session-id my-session-123 \
    --input-text "Analyze this data"
    --enable-trace
```

---

## Token 成本计算

| 模型 | Input ($/1K) | Output ($/1K) | 备注 |
|------|-------------|--------------|------|
| Claude 3 Opus | $0.015 | $0.075 | 最高质量 |
| Claude 3 Sonnet | $0.003 | $0.015 | 平衡选择 |
| Claude 3 Haiku | $0.00025 | $0.00125 | 快速经济 |
| Titan Express | $0.0008 | $0.0016 | AWS 自有模型 |

```python
# 成本估算函数
def estimate_cost(input_tokens, output_tokens, model='claude-3-sonnet'):
    pricing = {
        'claude-3-opus': {'input': 0.015, 'output': 0.075},
        'claude-3-sonnet': {'input': 0.003, 'output': 0.015},
        'claude-3-haiku': {'input': 0.00025, 'output': 0.00125}
    }
    
    p = pricing[model]
    input_cost = (input_tokens / 1000) * p['input']
    output_cost = (output_tokens / 1000) * p['output']
    
    return input_cost + output_cost
```

---

## 安全配置检查清单

### 提示词注入防护
```python
# 快速检测
INJECTION_PATTERNS = [
    r'ignore\s+previous',
    r'forget\s+instructions',
    r'system\s*:',
    r'you\s+are\s+now',
]
```

### IAM 最小权限
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeAgent"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "us-east-1"
        }
      }
    }
  ]
}
```

---

## Docker 开发环境

```bash
# 构建 Agent 镜像
docker build -t ai-agent:dev .

# 运行带 LocalStack 的开发环境
docker-compose -f docker-compose.dev.yml up

# 执行测试
docker run --rm ai-agent:dev pytest tests/

# 本地调用测试
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": "test", "session_id": "123"}'
```

---

## 监控指标

```python
# 关键指标
METRICS = {
    'Latency': 'P99 < 2s',
    'TokenUsage': 'Daily budget tracking',
    'SuccessRate': '> 99%',
    'CostPerRequest': '< $0.01',
    'HumanApprovalRate': '< 5%'
}
```

---

## 故障排查

| 症状 | 可能原因 | 解决方案 |
|------|---------|----------|
| 高延迟 | Token 过多 | 分块处理 |
| 成本飙升 | 循环调用 | 限制迭代次数 |
| 输出不一致 | Temperature 过高 | 设置为 0.1-0.3 |
| 权限错误 | IAM 配置 | 检查策略 |

---

## 参考链接

- [Amazon Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS AI Service Security](https://docs.aws.amazon.com/security/)
- [Responsible AI Guide](https://aws.amazon.com/machine-learning/responsible-ai/)
