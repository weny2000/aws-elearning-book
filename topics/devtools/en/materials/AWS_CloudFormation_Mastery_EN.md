# AWS CloudFormation Mastery Guide

> The Complete Infrastructure as Code Guide from Basics to Advanced

---

## Table of Contents

1. [CloudFormation Fundamentals](#1-cloudformation-fundamentals)
2. [Template Design Patterns](#2-template-design-patterns)
3. [Advanced Features](#3-advanced-features)
4. [Working with CDK](#4-working-with-cdk)
5. [Production Best Practices](#5-production-best-practices)

---

## 1. CloudFormation Fundamentals

### 1.1 Core Concepts

```yaml
# CloudFormation Template Structure
AWSTemplateFormatVersion: '2010-09-09'  # Template version
Description: 'My Application Stack'      # Template description

# Parameters - Configurable values at deployment
Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - staging
      - production
    Description: Deployment environment

# Mappings - Conditional value tables
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-12345678
      InstanceType: t3.micro
    ap-northeast-1:
      AMI: ami-87654321
      InstanceType: t3.micro

# Conditions - Control resource creation
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  HasCustomDomain: !Not [!Equals [!Ref DomainName, '']]

# Resources - AWS Infrastructure
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-bucket'
      VersioningConfiguration:
        Status: Enabled

# Outputs - Post-deployment information
Outputs:
  BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt MyBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'
```

### 1.2 Intrinsic Functions

```yaml
# Fn::Ref - Reference resources or parameters
BucketName: !Ref MyBucket
Environment: !Ref Environment

# Fn::Sub - String substitution
BucketName: !Sub '${AWS::StackName}-data-${Environment}'

# Fn::Join - Join strings
Name: !Join ['-', ['app', !Ref Environment, 'v1']]

# Fn::Select - Select list elements
SubnetId: !Select [0, !Ref SubnetIds]

# Fn::Split - Split strings
SubnetIds: !Split [',', !Ref SubnetList]

# Fn::GetAtt - Get resource attributes
Endpoint: !GetAtt MyRDSInstance.Endpoint.Address

# Fn::GetAZs - Get availability zones list
AvailabilityZones: !GetAZs ''

# Fn::FindInMap - Query mappings
AMIId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]

# Fn::If - Conditional selection
InstanceType: !If [IsProduction, m5.large, t3.micro]

# Fn::And / Or / Not - Logical operations
CreateAlarm: !And [!Condition IsProduction, !Condition HasMonitoring]

# Fn::ImportValue - Import outputs from other stacks
VpcId: !ImportValue NetworkStack-VpcId

# Fn::Base64 - Base64 encoding
UserData: !Base64 |
  #!/bin/bash
  echo "Hello World"

# Fn::Cidr - CIDR block calculation
Subnets: !Cidr [10.0.0.0/16, 3, 8]  # Generate 3 subnets with /24 mask
```

---

## 2. Template Design Patterns

### 2.1 Nested Stacks

```yaml
# Main Template - main.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Main application stack using nested stacks

Resources:
  # Network Layer Nested Stack
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

  # Database Layer Nested Stack
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/templates/database.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
      DependsOn: NetworkStack

  # Application Layer Nested Stack
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

### 2.2 StackSets

```yaml
# StackSet - Multi-account/Multi-region deployment
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
# Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name CloudWatchAgentPolicy \
  --template-body file://stackset.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

# Deploy to all accounts
aws cloudformation create-stack-instances \
  --stack-set-name CloudWatchAgentPolicy \
  --deployment-targets OrganizationalUnitIds=ou-123456 \
  --regions ap-northeast-1 us-east-1 eu-west-1 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=10
```

### 2.3 Cross-Stack References

```yaml
# Network Stack - network.yaml (Exporting values)
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

# Application Stack - application.yaml (Importing values)
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

## 3. Advanced Features

### 3.1 Change Sets

```bash
# Create change set
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set \
  --template-body file://updated-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production

# Describe change set
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set

# Execute change set
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set
```

### 3.2 Drift Detection

```bash
# Detect stack drift
aws cloudformation detect-stack-drift \
  --stack-name my-stack

# View drift detection status
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <detection-id>

# View specific resource drifts
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack
```

### 3.3 Stack Policies

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
# Set stack policy
aws cloudformation set-stack-policy \
  --stack-name my-stack \
  --stack-policy-body file://stack-policy.json
```

### 3.4 Custom Resources

```yaml
# Lambda-backed Custom Resource
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
                      # Create logic
                      result = create_resource(event['ResourceProperties'])
                      
                  elif event['RequestType'] == 'Update':
                      # Update logic
                      result = update_resource(
                          event['PhysicalResourceId'],
                          event['ResourceProperties']
                      )
                      
                  elif event['RequestType'] == 'Delete':
                      # Delete logic
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

## 4. Working with CDK

### 4.1 Generating CloudFormation from CDK

```bash
# Synthesize CloudFormation template
cdk synth

# Save to specific directory
cdk synth > template.yaml

# Deploy
cdk deploy

# View differences
cdk diff
```

### 4.2 Migrating from CloudFormation to CDK

```typescript
// Import existing CloudFormation resources
import * as cfn from 'aws-cdk-lib/core';

// Method 1: Using CfnInclude
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';

const cfnTemplate = new CfnInclude(this, 'Template', {
  templateFile: 'existing-template.yaml',
});

// Get existing resources
const bucket = cfnTemplate.getResource('MyBucket') as s3.CfnBucket;

// Add new resources
new s3.Bucket(this, 'NewBucket', {
  versioned: true,
});

// Method 2: Using fromLookup to import
const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
  vpcId: 'vpc-123456789',
});

const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
  this,
  'SG',
  'sg-123456789'
);
```

### 4.3 Using L1 (Low-Level) Constructs in CDK

```typescript
// Use L1 when L2 constructs don't support specific features
import * as s3 from 'aws-cdk-lib/aws-s3';

// L2 Construct
const bucket = new s3.Bucket(this, 'MyBucket');

// Access underlying L1 construct (CfnBucket)
const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;

// Add properties not supported by L2
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

## 5. Production Best Practices

### 5.1 Template Validation Checklist

```bash
#!/bin/bash
# validate-template.sh

template=$1

echo "Validating $template..."

# 1. Syntax validation
aws cloudformation validate-template --template-body file://$template

# 2. cfn-lint check
if command -v cfn-lint &> /dev/null; then
    echo "Running cfn-lint..."
    cfn-lint $template
fi

# 3. cfn-nag security check
if command -v cfn_nag &> /dev/null; then
    echo "Running cfn-nag..."
    cfn_nag_scan --input-path $template
fi

echo "Validation complete!"
```

### 5.2 Organizing Template Directory

```
templates/
├── 00-foundations/           # Foundation components
│   ├── vpc.yaml
│   ├── iam-roles.yaml
│   └── security-groups.yaml
├── 01-data/                  # Data layer
│   ├── rds-postgres.yaml
│   ├── dynamodb-tables.yaml
│   └── elasticache-redis.yaml
├── 02-compute/               # Compute layer
│   ├── ecs-cluster.yaml
│   ├── ecs-services.yaml
│   └── auto-scaling.yaml
├── 03-application/           # Application layer
│   ├── load-balancers.yaml
│   └── cloudfront.yaml
├── 04-monitoring/            # Monitoring layer
│   ├── cloudwatch-alarms.yaml
│   └── sns-topics.yaml
└── scripts/
    ├── deploy.sh
    ├── validate.sh
    └── cleanup.sh
```

### 5.3 CI/CD Integration

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

### 5.4 Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Template format error` | YAML syntax error | Use YAML linter |
| `Circular dependency` | Circular dependency between resources | Refactor resource definitions |
| `No updates are to be performed` | No actual changes | Check parameters or template changes |
| `Resource did not stabilize` | Resource creation timeout | Check dependent service status |
| `Export cannot be deleted` | Export value in use by other stacks | Delete dependent stacks first or update imports |

---

## 6. CloudFormation vs CDK Selection Guide

| Scenario | Recommendation | Reason |
|----------|----------------|--------|
| Simple resource deployment | CloudFormation | Direct, no dependencies |
| Complex logic/conditions | CDK | Programming language expressiveness |
| Existing template library | CloudFormation | Reuse existing assets |
| Developer teams | CDK | IDE support, type safety |
| Multi-environment deployment | CDK | Loops and conditions easier to express |
| Temporary/one-time | CloudFormation | Quick and simple |

---

*Part of AWS DevTools Hero Learning Path*
