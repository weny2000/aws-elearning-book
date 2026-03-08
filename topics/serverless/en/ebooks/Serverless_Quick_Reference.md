# AWS Serverless Quick Reference

> Essential commands, configurations, and best practices at your fingertips

---

## AWS CLI Commands

### Lambda

```bash
# List all Lambda functions
aws lambda list-functions

# Get function details
aws lambda get-function --function-name my-function

# Invoke function synchronously
aws lambda invoke \
    --function-name my-function \
    --payload '{"key": "value"}' \
    --cli-binary-format raw-in-base64-out \
    response.json

# Invoke asynchronously
aws lambda invoke \
    --function-name my-function \
    --invocation-type Event \
    --payload '{"key": "value"}' \
    --cli-binary-format raw-in-base64-out \
    /dev/null

# Update function code
aws lambda update-function-code \
    --function-name my-function \
    --zip-file fileb://function.zip

# Update function configuration
aws lambda update-function-configuration \
    --function-name my-function \
    --memory-size 512 \
    --timeout 30 \
    --environment Variables={KEY1=VAL1,KEY2=VAL2}

# Manage aliases
aws lambda create-alias \
    --function-name my-function \
    --name prod \
    --function-version 1

# Configure provisioned concurrency
aws lambda put-provisioned-concurrency-config \
    --function-name my-function \
    --qualifier prod \
    --provisioned-concurrent-executions 100

# View CloudWatch logs
aws logs tail /aws/lambda/my-function --follow
```

### API Gateway

```bash
# Create REST API
aws apigateway create-rest-api --name my-api

# Get API ID
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`my-api`].id' --output text)

# Create resource
aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text) \
    --path-part users

# Create method
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE

# Deploy API
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod
```

### SAM CLI

```bash
# Initialize new project
sam init --runtime python3.11 --name my-project

# Build application
sam build

# Local testing
sam local invoke MyFunction --event event.json
sam local start-api

# Deploy
sam deploy --guided
sam deploy --config-env prod

# Sync (for development)
sam sync --watch

# Logs
sam logs --name MyFunction --tail
```

---

## Lambda Limits

| Resource | Limit |
|----------|-------|
| Memory | 128 MB - 10,240 MB |
| Timeout | 900 seconds (15 minutes) |
| Deployment Package | 50 MB (zipped), 250 MB (unzipped) |
| /tmp Storage | 10,240 MB |
| Concurrent Executions | 1,000 (default, adjustable) |
| Environment Variables | 4 KB |
| Layers | 5 per function |

---

## Event Sources

| Service | Trigger Type | Common Use Case |
|---------|-------------|-----------------|
| API Gateway | Sync/Async | HTTP APIs |
| S3 | Async | File processing |
| SQS | Poll | Queue processing |
| SNS | Push | Notifications |
| EventBridge | Push | Scheduled/event-driven |
| DynamoDB Streams | Poll | Change data capture |
| Kinesis | Poll | Real-time streaming |

---

## Pricing Formula

**Lambda**: 
```
Total Cost = Request Cost + Duration Cost

Request Cost = $0.20 per 1M requests
Duration Cost = $0.0000166667 per GB-second

Example: 1M requests, 512MB, 200ms average
= $0.20 + (1M × 0.2s × 0.5GB × $0.0000166667)
= $0.20 + $1.67 = $1.87
```

---

## References

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [SAM CLI Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Serverless Land](https://serverlessland.com/)
