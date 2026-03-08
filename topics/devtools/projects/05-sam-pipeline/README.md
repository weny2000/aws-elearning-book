# Project 05: SAM CI/CD Pipeline

## Overview

A complete Serverless CI/CD pipeline using AWS SAM, CodePipeline, and CodeBuild. This project demonstrates best practices for deploying Lambda applications through automated pipelines.

## Architecture

```
GitHub → CodePipeline → CodeBuild (SAM) → CloudFormation → Lambda + API Gateway
```

## Project Structure

```
05-sam-pipeline/
├── README.md
├── template.yaml              # SAM template
├── samconfig.toml            # SAM configuration
├── buildspec.yml             # CodeBuild specification
├── pipeline/
│   └── template.yaml         # Pipeline CloudFormation
├── src/
│   ├── app.py               # Lambda handler
│   └── requirements.txt
└── tests/
    ├── unit/
    └── integration/
```

## Quick Start

### Prerequisites

- AWS CLI configured
- SAM CLI installed
- Docker (for local testing)
- GitHub account with CodeStar Connection

### 1. Local Development

```bash
cd e-book/topics/devtools/projects/05-sam-pipeline

# Build
sam build

# Local testing
sam local invoke ApiFunction -e events/api-gateway-event.json

# Start local API
sam local start-api
```

### 2. Deploy Pipeline

```bash
aws cloudformation deploy \
  --template-file pipeline/template.yaml \
  --stack-name sam-pipeline \
  --capabilities CAPABILITY_IAM
```

### 3. Deploy Application

```bash
# Deploy to dev
sam deploy --config-env dev

# Deploy to production
sam deploy --config-env prod
```

## Technologies

- AWS SAM
- AWS CodePipeline
- AWS CodeBuild
- AWS Lambda
- Amazon API Gateway
- Amazon DynamoDB

---

**Part of AWS DevTools Hero Learning Path**
