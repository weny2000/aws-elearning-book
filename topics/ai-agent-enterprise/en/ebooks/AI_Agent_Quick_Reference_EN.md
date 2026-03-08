# AWS AI Agent Enterprise Architecture Quick Reference

> Essential Commands, Configurations, and Best Practices for AI Agent Development

---

## Bedrock Agent CLI

```bash
# List available foundation models
aws bedrock list-foundation-models --region us-east-1

# Invoke a model
aws bedrock-runtime invoke-model \
    --model-id anthropic.claude-3-sonnet-20240229-v1:0 \
    --body '{"prompt": "Human: Hello\nAssistant:", "max_tokens_to_sample": 300}' \
    --cli-binary-format raw-in-base64-out \
    response.json

# Create an Agent
aws bedrock-agent create-agent \
    --agent-name my-enterprise-agent \
    --description "Enterprise AI Agent" \
    --foundation-model anthropic.claude-3-sonnet-20240229-v1:0 \
    --idle-session-ttl-in-seconds 1800 \
    --instruction "You are a helpful enterprise assistant..."

# Deploy Agent
aws bedrock-agent create-agent-alias \
    --agent-id <agent-id> \
    --agent-alias-name prod \
    --description "Production alias"

# Invoke Agent
aws bedrock-agent-runtime invoke-agent \
    --agent-id <agent-id> \
    --agent-alias-id <alias-id> \
    --session-id my-session-123 \
    --input-text "Analyze this data"
    --enable-trace
```

---

## Token Cost Calculation

| Model | Input ($/1K) | Output ($/1K) | Notes |
|-------|-------------|--------------|-------|
| Claude 3 Opus | $0.015 | $0.075 | Highest Quality |
| Claude 3 Sonnet | $0.003 | $0.015 | Balanced Choice |
| Claude 3 Haiku | $0.00025 | $0.00125 | Fast & Cost-Effective |
| Titan Express | $0.0008 | $0.0016 | AWS Proprietary Model |

```python
# Cost estimation function
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

## Security Configuration Checklist

### Prompt Injection Protection
```python
# Quick detection
INJECTION_PATTERNS = [
    r'ignore\s+previous',
    r'forget\s+instructions',
    r'system\s*:',
    r'you\s+are\s+now',
]
```

### IAM Least Privilege
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

## Docker Development Environment

```bash
# Build Agent image
docker build -t ai-agent:dev .

# Run development environment with LocalStack
docker-compose -f docker-compose.dev.yml up

# Execute tests
docker run --rm ai-agent:dev pytest tests/

# Local invocation test
curl -X POST http://localhost:8000/invoke \
  -H "Content-Type: application/json" \
  -d '{"input": "test", "session_id": "123"}'
```

---

## Monitoring Metrics

```python
# Key metrics
METRICS = {
    'Latency': 'P99 < 2s',
    'TokenUsage': 'Daily budget tracking',
    'SuccessRate': '> 99%',
    'CostPerRequest': '< $0.01',
    'HumanApprovalRate': '< 5%'
}
```

---

## Troubleshooting

| Symptom | Possible Cause | Solution |
|---------|---------------|----------|
| High Latency | Too many Tokens | Chunk processing |
| Cost Surge | Loop invocations | Limit iteration count |
| Inconsistent Output | Temperature too high | Set to 0.1-0.3 |
| Permission Error | IAM configuration | Check policy |

---

## Reference Links

- [Amazon Bedrock Docs](https://docs.aws.amazon.com/bedrock/)
- [AWS AI Service Security](https://docs.aws.amazon.com/security/)
- [Responsible AI Guide](https://aws.amazon.com/machine-learning/responsible-ai/)
