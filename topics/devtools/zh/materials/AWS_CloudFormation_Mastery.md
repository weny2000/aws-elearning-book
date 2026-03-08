# AWS CloudFormation 精通指南

> 从基础到高级的 Infrastructure as Code 完整指南

---

## 目录

1. [CloudFormation 基础](#1-cloudformation-基础)
2. [模板设计模式](#2-模板设计模式)
3. [高级特性](#3-高级特性)
4. [与 CDK 协作](#4-与-cdk-协作)
5. [生产最佳实践](#5-生产最佳实践)

---

## 1. CloudFormation 基础

### 1.1 核心概念

```yaml
# CloudFormation 模板结构
AWSTemplateFormatVersion: '2010-09-09'  # 模板版本
Description: 'My Application Stack'      # 模板描述

# 参数 - 部署时可配置的值
Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - staging
      - production
    Description: Deployment environment

# 映射 - 条件值表
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-12345678
      InstanceType: t3.micro
    ap-northeast-1:
      AMI: ami-87654321
      InstanceType: t3.micro

# 条件 - 控制资源创建
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  HasCustomDomain: !Not [!Equals [!Ref DomainName, '']]

# 资源 - AWS 基础设施
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-bucket'
      VersioningConfiguration:
        Status: Enabled

# 输出 - 部署后信息
Outputs:
  BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt MyBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'
```

### 1.2 内置函数

```yaml
# Fn::Ref - 引用资源或参数
BucketName: !Ref MyBucket
Environment: !Ref Environment

# Fn::Sub - 字符串替换
BucketName: !Sub '${AWS::StackName}-data-${Environment}'

# Fn::Join - 连接字符串
Name: !Join ['-', ['app', !Ref Environment, 'v1']]

# Fn::Select - 选择列表元素
SubnetId: !Select [0, !Ref SubnetIds]

# Fn::Split - 分割字符串
SubnetIds: !Split [',', !Ref SubnetList]

# Fn::GetAtt - 获取资源属性
Endpoint: !GetAtt MyRDSInstance.Endpoint.Address

# Fn::GetAZs - 获取可用区列表
AvailabilityZones: !GetAZs ''

# Fn::FindInMap - 查询映射
AMIId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]

# Fn::If - 条件选择
InstanceType: !If [IsProduction, m5.large, t3.micro]

# Fn::And / Or / Not - 逻辑运算
CreateAlarm: !And [!Condition IsProduction, !Condition HasMonitoring]

# Fn::ImportValue - 导入其他堆栈的输出
VpcId: !ImportValue NetworkStack-VpcId

# Fn::Base64 - Base64 编码
UserData: !Base64 |
  #!/bin/bash
  echo "Hello World"

# Fn::Cidr - CIDR 块计算
Subnets: !Cidr [10.0.0.0/16, 3, 8]  # 生成3个子网，掩码/24
```

---

## 2. 模板设计模式

### 2.1 嵌套堆栈 (Nested Stacks)

```yaml
# 主模板 - main.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Main application stack using nested stacks

Resources:
  # 网络层嵌套堆栈
  NetworkStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/templates/network.yaml
      Parameters:
        VpcCidr: 10.0.0.0/16
        Environment: production
      Tags:
        - Key: Layer
          Value: Network

  # 数据库层嵌套堆栈
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/templates/database.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
      DependsOn: NetworkStack

  # 应用层嵌套堆栈
  ApplicationStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/templates/application.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PublicSubnetIds
        DBEndpoint: !GetAtt DatabaseStack.Outputs.Endpoint
      DependsOn: 
        - NetworkStack
        - DatabaseStack
```

### 2.2 堆栈集 (StackSets)

```yaml
# 堆栈集 - 多账户/多区域部署
AWSTemplateFormatVersion: '2010-09-09'
Description: StackSet for CloudWatch agent

Resources:
  CloudWatchAgentPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - cloudwatch:PutMetricData
              - ec2:DescribeVolumes
              - ec2:DescribeTags
            Resource: '*'
```

```bash
# 创建堆栈集
aws cloudformation create-stack-set \
  --stack-set-name CloudWatchAgentPolicy \
  --template-body file://stackset.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

# 部署到所有账户
aws cloudformation create-stack-instances \
  --stack-set-name CloudWatchAgentPolicy \
  --deployment-targets OrganizationalUnitIds=ou-123456 \
  --regions ap-northeast-1 us-east-1 eu-west-1 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=10
```

### 2.3 跨堆栈引用

```yaml
# 网络堆栈 - network.yaml (导出值)
Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VpcId'
      
  PublicSubnetIds:
    Description: Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnetIds'

# 应用堆栈 - application.yaml (导入值)
Parameters:
  NetworkStackName:
    Type: String
    Default: NetworkStack

Resources:
  ALB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets: !Split [
        ',', 
        !ImportValue !Sub '${NetworkStackName}-PublicSubnetIds'
      ]
```

---

## 3. 高级特性

### 3.1 变更集 (Change Sets)

```bash
# 创建变更集
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set \
  --template-body file://updated-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production

# 查看变更集
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set

# 执行变更集
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set
```

### 3.2 漂移检测 (Drift Detection)

```bash
# 检测堆栈漂移
aws cloudformation detect-stack-drift \
  --stack-name my-stack

# 查看漂移结果
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <detection-id>

# 查看具体资源漂移
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack
```

### 3.3 堆栈策略 (Stack Policies)

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Action": ["Update:Replace", "Update:Delete"],
      "Principal": "*",
      "Resource": "LogicalResourceId/ProductionDatabase"
    },
    {
      "Effect": "Allow",
      "Action": "Update:*",
      "Principal": "*",
      "Resource": "*"
    }
  ]
}
```

```bash
# 设置堆栈策略
aws cloudformation set-stack-policy \
  --stack-name my-stack \
  --stack-policy-body file://stack-policy.json
```

### 3.4 自定义资源 (Custom Resources)

```yaml
# Lambda-backed 自定义资源
Resources:
  CustomResource:
    Type: Custom::MyCustomResource
    Properties:
      ServiceToken: !GetAtt CustomResourceFunction.Arn
      Property1: value1
      Property2: value2

  CustomResourceFunction:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Runtime: python3.11
      Timeout: 30
      Code:
        ZipFile: |
          import json
          import cfnresponse
          
          def handler(event, context):
              try:
                  if event['RequestType'] == 'Create':
                      # 创建逻辑
                      result = create_resource(event['ResourceProperties'])
                      
                  elif event['RequestType'] == 'Update':
                      # 更新逻辑
                      result = update_resource(
                          event['PhysicalResourceId'],
                          event['ResourceProperties']
                      )
                      
                  elif event['RequestType'] == 'Delete':
                      # 删除逻辑
                      delete_resource(event['PhysicalResourceId'])
                      result = None
                  
                  cfnresponse.send(
                      event, context, cfnresponse.SUCCESS,
                      result or {},
                      physical_resource_id=result.get('id') if result else event.get('PhysicalResourceId')
                  )
              except Exception as e:
                  cfnresponse.send(
                      event, context, cfnresponse.FAILED,
                      {'Error': str(e)}
                  )
```

---

## 4. 与 CDK 协作

### 4.1 CDK 生成 CloudFormation

```bash
# 合成 CloudFormation 模板
cdk synth

# 保存到指定目录
cdk synth > template.yaml

# 部署
cdk deploy

# 查看差异
cdk diff
```

### 4.2 从 CloudFormation 迁移到 CDK

```typescript
// 导入现有 CloudFormation 资源
import * as cfn from 'aws-cdk-lib/core';

// 方法 1: 使用 CfnInclude
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';

const cfnTemplate = new CfnInclude(this, 'Template', {
  templateFile: 'existing-template.yaml',
});

// 获取现有资源
const bucket = cfnTemplate.getResource('MyBucket') as s3.CfnBucket;

// 添加新资源
new s3.Bucket(this, 'NewBucket', {
  versioned: true,
});

// 方法 2: 使用 fromLookup 导入
const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
  vpcId: 'vpc-123456789',
});

const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
  this,
  'SG',
  'sg-123456789'
);
```

### 4.3 CDK 中使用 L1 (低级别) 构造

```typescript
// 当 L2 构造不支持特定功能时使用 L1
import * as s3 from 'aws-cdk-lib/aws-s3';

// L2 构造
const bucket = new s3.Bucket(this, 'MyBucket');

// 访问底层 L1 构造 (CfnBucket)
const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;

// 添加 L2 不支持的属性
cfnBucket.addPropertyOverride('ObjectLockEnabled', true);
cfnBucket.addPropertyOverride('ObjectLockConfiguration', {
  ObjectLockEnabled: 'Enabled',
  Rule: {
    DefaultRetention: {
      Mode: 'COMPLIANCE',
      Days: 365,
    },
  },
});
```

---

## 5. 生产最佳实践

### 5.1 模板验证清单

```bash
#!/bin/bash
# validate-template.sh

template=$1

echo "Validating $template..."

# 1. 语法验证
aws cloudformation validate-template --template-body file://$template

# 2. cfn-lint 检查
if command -v cfn-lint &> /dev/null; then
    echo "Running cfn-lint..."
    cfn-lint $template
fi

# 3. cfn-nag 安全检查
if command -v cfn_nag &> /dev/null; then
    echo "Running cfn-nag..."
    cfn_nag_scan --input-path $template
fi

echo "Validation complete!"
```

### 5.2 组织模板目录

```
templates/
├── 00-foundations/           # 基础组件
│   ├── vpc.yaml
│   ├── iam-roles.yaml
│   └── security-groups.yaml
├── 01-data/                  # 数据层
│   ├── rds-postgres.yaml
│   ├── dynamodb-tables.yaml
│   └── elasticache-redis.yaml
├── 02-compute/               # 计算层
│   ├── ecs-cluster.yaml
│   ├── ecs-services.yaml
│   └── auto-scaling.yaml
├── 03-application/           # 应用层
│   ├── load-balancers.yaml
│   └── cloudfront.yaml
├── 04-monitoring/            # 监控层
│   ├── cloudwatch-alarms.yaml
│   └── sns-topics.yaml
└── scripts/
    ├── deploy.sh
    ├── validate.sh
    └── cleanup.sh
```

### 5.3 CI/CD 集成

```yaml
# buildspec-cfn.yml
version: 0.2

phases:
  install:
    commands:
      - pip install cfn-lint cfn-nag
      
  pre_build:
    commands:
      - echo "Validating templates..."
      - |
        for template in templates/**/*.yaml; do
          echo "Validating $template"
          aws cloudformation validate-template \
            --template-body file://$template
          cfn-lint $template
        done
        
  build:
    commands:
      - echo "Deploying templates..."
      - ./scripts/deploy.sh $ENVIRONMENT
      
  post_build:
    commands:
      - echo "Running smoke tests..."
      - ./scripts/smoke-tests.sh
```

### 5.4 常见错误与解决

| 错误 | 原因 | 解决 |
|------|------|------|
| `Template format error` | YAML 语法错误 | 使用 YAML linter |
| `Circular dependency` | 资源间循环依赖 | 重构资源定义 |
| `No updates are to be performed` | 无实际变更 | 检查参数或模板变化 |
| `Resource did not stabilize` | 资源创建超时 | 检查依赖服务状态 |
| `Export cannot be deleted` | 导出值被其他堆栈使用 | 先删除依赖堆栈或更新导入 |

---

## 6. CloudFormation vs CDK 选择指南

| 场景 | 推荐 | 原因 |
|------|------|------|
| 简单资源部署 | CloudFormation | 直接、无依赖 |
| 复杂逻辑/条件 | CDK | 编程语言表达能力 |
| 已有模板库 | CloudFormation | 复用现有资产 |
| 团队开发者 | CDK | IDE支持、类型安全 |
| 多环境部署 | CDK | 循环、条件更易表达 |
| 临时/一次性 | CloudFormation | 快速、简单 |

---

*Part of AWS DevTools Hero Learning Path*
