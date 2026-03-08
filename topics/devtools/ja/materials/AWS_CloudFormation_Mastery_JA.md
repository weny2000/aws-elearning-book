# AWS CloudFormation マスターガイド

> 基礎から高度な技術まで Infrastructure as Code 完全ガイド

---

## 目次

1. [CloudFormation の基礎](#1-cloudformation-の基礎)
2. [テンプレート設計パターン](#2-テンプレート設計パターン)
3. [高度な機能](#3-高度な機能)
4. [CDK との連携](#4-cdk-との連携)
5. [プロダクション環境のベストプラクティス](#5-プロダクション環境のベストプラクティス)

---

## 1. CloudFormation の基礎

### 1.1 コアコンセプト

```yaml
# CloudFormation テンプレート構造
AWSTemplateFormatVersion: '2010-09-09'  # テンプレートバージョン
Description: 'My Application Stack'      # テンプレート説明

# パラメータ - デプロイ時に設定可能な値
Parameters:
  Environment:
    Type: String
    Default: development
    AllowedValues:
      - development
      - staging
      - production
    Description: Deployment environment

# マッピング - 条件値テーブル
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-12345678
      InstanceType: t3.micro
    ap-northeast-1:
      AMI: ami-87654321
      InstanceType: t3.micro

# 条件 - リソース作成を制御
Conditions:
  IsProduction: !Equals [!Ref Environment, production]
  HasCustomDomain: !Not [!Equals [!Ref DomainName, '']]

# リソース - AWS インフラストラクチャ
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-bucket'
      VersioningConfiguration:
        Status: Enabled

# 出力 - デプロイ後の情報
Outputs:
  BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt MyBucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-BucketArn'
```

### 1.2 組み込み関数

```yaml
# Fn::Ref - リソースまたはパラメータの参照
BucketName: !Ref MyBucket
Environment: !Ref Environment

# Fn::Sub - 文字列置換
BucketName: !Sub '${AWS::StackName}-data-${Environment}'

# Fn::Join - 文字列の連結
Name: !Join ['-', ['app', !Ref Environment, 'v1']]

# Fn::Select - リスト要素の選択
SubnetId: !Select [0, !Ref SubnetIds]

# Fn::Split - 文字列の分割
SubnetIds: !Split [',', !Ref SubnetList]

# Fn::GetAtt - リソース属性の取得
Endpoint: !GetAtt MyRDSInstance.Endpoint.Address

# Fn::GetAZs - 利用可能ゾーンリストの取得
AvailabilityZones: !GetAZs ''

# Fn::FindInMap - マッピングの検索
AMIId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]

# Fn::If - 条件選択
InstanceType: !If [IsProduction, m5.large, t3.micro]

# Fn::And / Or / Not - 論理演算
CreateAlarm: !And [!Condition IsProduction, !Condition HasMonitoring]

# Fn::ImportValue - 他のスタックからの出力インポート
VpcId: !ImportValue NetworkStack-VpcId

# Fn::Base64 - Base64 エンコーディング
UserData: !Base64 |
  #!/bin/bash
  echo "Hello World"

# Fn::Cidr - CIDR ブロック計算
Subnets: !Cidr [10.0.0.0/16, 3, 8]  # 3つのサブネットを生成、マスク/24
```

---

## 2. テンプレート設計パターン

### 2.1 ネストされたスタック (Nested Stacks)

```yaml
# メインテンプレート - main.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Main application stack using nested stacks

Resources:
  # ネットワーク層ネストされたスタック
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

  # データベース層ネストされたスタック
  DatabaseStack:
    Type: AWS::CloudFormation::Stack
    Properties:
      TemplateURL: https://s3.amazonaws.com/my-bucket/templates/database.yaml
      Parameters:
        VpcId: !GetAtt NetworkStack.Outputs.VpcId
        SubnetIds: !GetAtt NetworkStack.Outputs.PrivateSubnetIds
      DependsOn: NetworkStack

  # アプリケーション層ネストされたスタック
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

### 2.2 スタックセット (StackSets)

```yaml
# スタックセット - マルチアカウント/マルチリージョンのデプロイメント
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
# スタックセットの作成
aws cloudformation create-stack-set \
  --stack-set-name CloudWatchAgentPolicy \
  --template-body file://stackset.yaml \
  --permission-model SERVICE_MANAGED \
  --auto-deployment Enabled=true,RetainStacksOnAccountRemoval=false

# すべてのアカウントにデプロイ
aws cloudformation create-stack-instances \
  --stack-set-name CloudWatchAgentPolicy \
  --deployment-targets OrganizationalUnitIds=ou-123456 \
  --regions ap-northeast-1 us-east-1 eu-west-1 \
  --operation-preferences FailureToleranceCount=0,MaxConcurrentCount=10
```

### 2.3 クロススタック参照

```yaml
# ネットワークスタック - network.yaml (値のエクスポート)
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

# アプリケーションスタック - application.yaml (値のインポート)
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

## 3. 高度な機能

### 3.1 変更セット (Change Sets)

```bash
# 変更セットの作成
aws cloudformation create-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set \
  --template-body file://updated-template.yaml \
  --parameters ParameterKey=Environment,ParameterValue=production

# 変更セットの確認
aws cloudformation describe-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set

# 変更セットの実行
aws cloudformation execute-change-set \
  --stack-name my-stack \
  --change-set-name my-change-set
```

### 3.2 ドリフト検出 (Drift Detection)

```bash
# スタックドリフトの検出
aws cloudformation detect-stack-drift \
  --stack-name my-stack

# ドリフト結果の確認
aws cloudformation describe-stack-drift-detection-status \
  --stack-drift-detection-id <detection-id>

# 具体的なリソースドリフトの確認
aws cloudformation describe-stack-resource-drifts \
  --stack-name my-stack
```

### 3.3 スタックポリシー (Stack Policies)

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
# スタックポリシーの設定
aws cloudformation set-stack-policy \
  --stack-name my-stack \
  --stack-policy-body file://stack-policy.json
```

### 3.4 カスタムリソース (Custom Resources)

```yaml
# Lambda-backed カスタムリソース
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
                      # 作成ロジック
                      result = create_resource(event['ResourceProperties'])
                      
                  elif event['RequestType'] == 'Update':
                      # 更新ロジック
                      result = update_resource(
                          event['PhysicalResourceId'],
                          event['ResourceProperties']
                      )
                      
                  elif event['RequestType'] == 'Delete':
                      # 削除ロジック
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

## 4. CDK との連携

### 4.1 CDK から CloudFormation の生成

```bash
# CloudFormation テンプレートの合成
cdk synth

# 指定したディレクトリに保存
cdk synth > template.yaml

# デプロイ
cdk deploy

# 差分の確認
cdk diff
```

### 4.2 CloudFormation から CDK への移行

```typescript
// 既存の CloudFormation リソースをインポート
import * as cfn from 'aws-cdk-lib/core';

// 方法 1: CfnInclude を使用
import { CfnInclude } from 'aws-cdk-lib/cloudformation-include';

const cfnTemplate = new CfnInclude(this, 'Template', {
  templateFile: 'existing-template.yaml',
});

// 既存のリソースを取得
const bucket = cfnTemplate.getResource('MyBucket') as s3.CfnBucket;

// 新しいリソースを追加
new s3.Bucket(this, 'NewBucket', {
  versioned: true,
});

// 方法 2: fromLookup を使用してインポート
const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
  vpcId: 'vpc-123456789',
});

const securityGroup = ec2.SecurityGroup.fromSecurityGroupId(
  this,
  'SG',
  'sg-123456789'
);
```

### 4.3 CDK で L1 (低レベル) コンストラクタを使用

```typescript
// L2 コンストラクタが特定の機能をサポートしていない場合に L1 を使用
import * as s3 from 'aws-cdk-lib/aws-s3';

// L2 コンストラクタ
const bucket = new s3.Bucket(this, 'MyBucket');

// 基盤となる L1 コンストラクタ (CfnBucket) にアクセス
const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;

// L2 でサポートされていないプロパティを追加
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

## 5. プロダクション環境のベストプラクティス

### 5.1 テンプレート検証チェックリスト

```bash
#!/bin/bash
# validate-template.sh

template=$1

echo "Validating $template..."

# 1. 構文検証
aws cloudformation validate-template --template-body file://$template

# 2. cfn-lint チェック
if command -v cfn-lint &> /dev/null; then
    echo "Running cfn-lint..."
    cfn-lint $template
fi

# 3. cfn-nag セキュリティチェック
if command -v cfn_nag &> /dev/null; then
    echo "Running cfn-nag..."
    cfn_nag_scan --input-path $template
fi

echo "Validation complete!"
```

### 5.2 テンプレートディレクトリの構成

```
templates/
├── 00-foundations/           # 基盤コンポーネント
│   ├── vpc.yaml
│   ├── iam-roles.yaml
│   └── security-groups.yaml
├── 01-data/                  # データ層
│   ├── rds-postgres.yaml
│   ├── dynamodb-tables.yaml
│   └── elasticache-redis.yaml
├── 02-compute/               # コンピュート層
│   ├── ecs-cluster.yaml
│   ├── ecs-services.yaml
│   └── auto-scaling.yaml
├── 03-application/           # アプリケーション層
│   ├── load-balancers.yaml
│   └── cloudfront.yaml
├── 04-monitoring/            # モニタリング層
│   ├── cloudwatch-alarms.yaml
│   └── sns-topics.yaml
└── scripts/
    ├── deploy.sh
    ├── validate.sh
    └── cleanup.sh
```

### 5.3 CI/CD 統合

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

### 5.4 よくあるエラーと解決方法

| エラー | 原因 | 解決方法 |
|------|------|------|
| `Template format error` | YAML 構文エラー | YAML linter を使用 |
| `Circular dependency` | リソース間の循環依存 | リソース定義を再構築 |
| `No updates are to be performed` | 実際の変更なし | パラメータまたはテンプレートの変更を確認 |
| `Resource did not stabilize` | リソース作成タイムアウト | 依存サービスの状態を確認 |
| `Export cannot be deleted` | エクスポート値が他のスタックで使用中 | 依存スタックを先に削除またはインポートを更新 |

---

## 6. CloudFormation vs CDK 選択ガイド

| シナリオ | 推奨 | 理由 |
|------|------|------|
| シンプルなリソースデプロイ | CloudFormation | 直接的で依存関係なし |
| 複雑なロジック/条件 | CDK | プログラミング言語の表現力 |
| 既存のテンプレートライブラリ | CloudFormation | 既存アセットの再利用 |
| 開発者チーム | CDK | IDEサポート、型安全性 |
| マルチ環境デプロイ | CDK | ループ、条件の表現が容易 |
| 一時的/使い捨て | CloudFormation | 高速、シンプル |

---

*Part of AWS DevTools Hero Learning Path*
