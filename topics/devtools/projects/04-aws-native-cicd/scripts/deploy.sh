#!/bin/bash
set -e

# =============================================================================
# AWS Native CI/CD - 部署脚本
# =============================================================================

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 帮助信息
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --env ENV         部署环境 (dev|staging|prod) [必需]"
    echo "  -r, --region REGION   AWS 区域 [默认: ap-northeast-1]"
    echo "  -a, --action ACTION   操作 (deploy|destroy|diff|synth) [默认: deploy]"
    echo "  -h, --help            显示帮助"
    echo ""
    echo "示例:"
    echo "  $0 --env dev"
    echo "  $0 --env staging --region us-east-1"
    echo "  $0 --env prod --action diff"
    exit 1
}

# 解析参数
ENV=""
REGION="ap-northeast-1"
ACTION="deploy"

while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -a|--action)
            ACTION="$2"
            shift 2
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}错误: 未知参数 $1${NC}"
            usage
            ;;
    esac
done

# 验证必需参数
if [[ -z "$ENV" ]]; then
    echo -e "${RED}错误: 必须指定环境 (-e|--env)${NC}"
    usage
fi

if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo -e "${RED}错误: 环境必须是 dev, staging, 或 prod${NC}"
    exit 1
fi

# 设置变量
STACK_NAME="AwsNativeCicd${ENV^}"
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}AWS Native CI/CD 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "配置信息:"
echo "  环境: $ENV"
echo "  区域: $REGION"
echo "  账户: $AWS_ACCOUNT"
echo "  操作: $ACTION"
echo "  堆栈: $STACK_NAME"
echo ""

# 检查 AWS CLI
echo -e "${YELLOW}检查 AWS CLI...${NC}"
if ! command -v aws &> /dev/null; then
    echo -e "${RED}错误: AWS CLI 未安装${NC}"
    exit 1
fi

# 检查 AWS 凭证
echo -e "${YELLOW}验证 AWS 凭证...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}错误: AWS 凭证无效或未配置${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS 凭证有效${NC}"
echo ""

# 检查 CDK
echo -e "${YELLOW}检查 AWS CDK...${NC}"
if ! command -v cdk &> /dev/null; then
    echo -e "${YELLOW}安装 AWS CDK...${NC}"
    npm install -g aws-cdk
fi
echo -e "${GREEN}✓ CDK 版本: $(cdk --version)${NC}"
echo ""

# 进入 CDK 目录
cd "$(dirname "$0")/../cdk"

# 安装依赖
echo -e "${YELLOW}安装 CDK 依赖...${NC}"
npm ci
echo -e "${GREEN}✓ 依赖安装完成${NC}"
echo ""

# 引导 (仅首次)
echo -e "${YELLOW}检查 CDK 引导状态...${NC}"
cdk bootstrap aws://$AWS_ACCOUNT/$REGION || true
echo ""

# 执行操作
case $ACTION in
    synth)
        echo -e "${YELLOW}合成 CloudFormation 模板...${NC}"
        cdk synth $STACK_NAME
        ;;
        
    diff)
        echo -e "${YELLOW}比较差异...${NC}"
        cdk diff $STACK_NAME
        ;;
        
    deploy)
        echo -e "${YELLOW}部署堆栈...${NC}"
        
        # 生产环境确认
        if [[ "$ENV" == "prod" ]]; then
            echo ""
            echo -e "${RED}警告: 您正在部署到生产环境!${NC}"
            read -p "确认继续? (yes/no): " confirm
            if [[ "$confirm" != "yes" ]]; then
                echo "部署已取消"
                exit 0
            fi
        fi
        
        cdk deploy $STACK_NAME \
            --require-approval never \
            --outputs-file ./cdk-outputs-$ENV.json
        
        echo ""
        echo -e "${GREEN}========================================${NC}"
        echo -e "${GREEN}部署成功!${NC}"
        echo -e "${GREEN}========================================${NC}"
        echo ""
        
        # 显示输出
        if [[ -f ./cdk-outputs-$ENV.json ]]; then
            echo "部署输出:"
            cat ./cdk-outputs-$ENV.json | jq .
        fi
        ;;
        
    destroy)
        echo -e "${YELLOW}销毁堆栈...${NC}"
        
        # 生产环境确认
        if [[ "$ENV" == "prod" ]]; then
            echo ""
            echo -e "${RED}警告: 您正在销毁生产环境!${NC}"
            read -p "确认继续? (输入 'destroy' 确认): " confirm
            if [[ "$confirm" != "destroy" ]]; then
                echo "销毁已取消"
                exit 0
            fi
        fi
        
        cdk destroy $STACK_NAME --force
        ;;
        
    *)
        echo -e "${RED}错误: 未知操作 $ACTION${NC}"
        usage
        ;;
esac

echo ""
echo -e "${GREEN}脚本执行完成${NC}"
