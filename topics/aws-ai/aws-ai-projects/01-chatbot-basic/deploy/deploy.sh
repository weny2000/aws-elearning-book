#!/bin/bash
set -e

echo "🚀 Deploying Bedrock Chatbot..."

# 配置
PROJECT_NAME="bedrock-chatbot"
AWS_REGION="${AWS_REGION:-us-east-1}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
pip install -r ../src/requirements.txt -q 2>/dev/null || true

echo -e "${YELLOW}Step 2: Validating Terraform...${NC}"
cd ../infra
terraform init
terraform validate

echo -e "${YELLOW}Step 3: Planning deployment...${NC}"
terraform plan -out=tfplan

echo -e "${YELLOW}Step 4: Applying changes...${NC}"
terraform apply tfplan

echo -e "${GREEN}✅ Deployment complete!${NC}"

# 获取输出
API_ENDPOINT=$(terraform output -raw api_endpoint)
LAMBDA_NAME=$(terraform output -raw lambda_function_name)

echo ""
echo "📊 Deployment Info:"
echo "  API Endpoint: $API_ENDPOINT"
echo "  Lambda Function: $LAMBDA_NAME"
echo ""
echo "🧪 Testing the API:"
echo "  curl -X POST $API_ENDPOINT \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"message\": \"Hello\", \"model\": \"nova-lite\"}'"
echo ""
