# AWS AI/ML Quick Reference

> Quick lookup for common commands and configurations

---

## 🚀 Bedrock API Reference

### Model Invocation

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Basic invocation
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 256,
        'anthropic_version': 'bedrock-2023-05-31'
    })
)

# Streaming response
response = bedrock.invoke_model_with_response_stream(
    modelId='amazon.nova-pro-v1:0',
    body=json.dumps({'inputText': 'Explain AI'})
)
```

### Model IDs

| Provider | Model | Model ID |
|----------|-------|----------|
| Anthropic | Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| Anthropic | Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` |
| Amazon | Nova Pro | `amazon.nova-pro-v1:0` |
| Amazon | Nova Lite | `amazon.nova-lite-v1:0` |
| Meta | Llama 3 70B | `meta.llama3-70b-instruct-v1:0` |
| Mistral | Mistral Large | `mistral.mistral-large-2402-v1:0` |

---

## 📝 Prompt Templates

### System Prompt

```python
SYSTEM_PROMPT = """You are a professional assistant.
Follow these principles:
- Provide concise and clear answers
- Explain technical terms in simple language
- Be honest when uncertain
- Respond in English"""
```

### Few-Shot Prompting

```python
few_shot_prompt = """
Below are examples of customer inquiries and appropriate responses:

Inquiry: I want to check my order status
Response: Please provide your order number so I can check the current status.

Inquiry: Can I return this item?
Response: Yes, returns are accepted within 30 days of purchase. Please let us know the reason for return.

Inquiry: {user_query}
Response:
"""
```

---

## 🔧 Knowledge Base Setup

### CLI Commands

```bash
# Create knowledge base
aws bedrock-agent create-knowledge-base \
    --name customer-support-kb \
    --description "Customer support knowledge base" \
    --role-arn arn:aws:iam::account:role/BedrockKnowledgeBaseRole \
    --knowledge-base-configuration '{"type":"VECTOR","vectorKnowledgeBaseConfiguration":{"embeddingModelArn":"arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"}}'

# Create data source
aws bedrock-agent create-data-source \
    --knowledge-base-id $KB_ID \
    --name s3-documents \
    --data-source-configuration '{"type":"S3","s3Configuration":{"bucketArn":"arn:aws:s3:::my-knowledge-base"}}'

# Start data sync
aws bedrock-agent start-ingestion-job \
    --knowledge-base-id $KB_ID \
    --data-source-id $DS_ID
```

---

## 🤖 Agents Setup

### Creating an Agent

```bash
# Create agent
aws bedrock-agent create-agent \
    --agent-name customer-support-agent \
    --description "Customer support agent" \
    --idle-session-ttl-in-seconds 1800 \
    --instruction "You are a helpful customer support assistant." \
    --foundation-model anthropic.claude-3-sonnet-20240229-v1:0

# Create action group
aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name order-management \
    --action-group-executor '{"lambda":"arn:aws:lambda:...:function:orderAPI"}' \
    --api-schema '{"payload":"s3://bucket/openapi.json"}'
```

---

## 🛡️ Guardrails Setup

### Creating Guardrails

```bash
aws bedrock create-guardrail \
    --name content-filter \
    --description "Content filtering guardrail" \
    --content-policy-config '{
        "filtersConfig": [
            {"type": "SEXUAL", "inputStrength": "HIGH", "outputStrength": "HIGH"},
            {"type": "VIOLENCE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
            {"type": "HATE", "inputStrength": "HIGH", "outputStrength": "HIGH"}
        ]
    }'
```

### Applying Guardrails

```python
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    guardrailIdentifier='my-guardrail',
    guardrailVersion='DRAFT',
    body={...}
)
```

---

## 💰 Pricing Calculation

### Bedrock Pricing Model

| Model | Input ($/1K tokens) | Output ($/1K tokens) |
|-------|---------------------|----------------------|
| Claude 3.5 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |
| Nova Pro | $0.0008 | $0.0032 |
| Nova Lite | $0.00006 | $0.00024 |

### Cost Estimation Example

```
Scenario: 10,000 requests/day, avg 500 input tokens, 800 output tokens

Claude 3 Haiku:
- Input cost: 10,000 × 500 × $0.00025 / 1,000 = $1.25/day
- Output cost: 10,000 × 800 × $0.00125 / 1,000 = $10.00/day
- Monthly: ($1.25 + $10.00) × 30 = $337.50
```

---

## 📊 CloudWatch Metrics

### Custom Dashboard

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# Create dashboard
cloudwatch.put_dashboard(
    DashboardName='Bedrock-Metrics',
    DashboardBody=json.dumps({
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "title": "Invocations",
                    "metrics": [["AWS/Bedrock", "Invocations", "ModelId", "anthropic.claude-3-sonnet"]],
                    "period": 300,
                    "stat": "Sum"
                }
            }
        ]
    })
)
```

---

## 🔐 IAM Policies

### Bedrock Minimum Permissions

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
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:Retrieve",
                "bedrock:RetrieveAndGenerate"
            ],
            "Resource": "arn:aws:bedrock:*:*:knowledge-base/*"
        }
    ]
}
```

---

## 🐛 Troubleshooting

### Common Errors

| Error | HTTP Status | Solution |
|-------|-------------|----------|
| ThrottlingException | 429 | Exponential backoff retry |
| ValidationException | 400 | Check request size |
| AccessDeniedException | 403 | Verify IAM permissions |
| ModelTimeoutException | 408 | Review timeout settings |

### Debug Logging

```python
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Enable boto3 logging
boto3.set_stream_logger('', logging.DEBUG)
```

---

## 🔗 Useful Links

- [Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Bedrock Quotas](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html)

---

*Last Updated: 2026-03-01*
