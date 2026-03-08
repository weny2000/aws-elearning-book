# Bedrock Agent CI/CD 完全指南

> 构建 AI Agent 的自动化交付流水线

---

## 目录

1. [Agent 开发工作流](#1-agent-开发工作流)
2. [Prompt 版本管理](#2-prompt-版本管理)
3. [CI/CD 流水线设计](#3-cicd-流水线设计)
4. [自动化测试策略](#4-自动化测试策略)
5. [生产部署最佳实践](#5-生产部署最佳实践)

---

## 1. Agent 开发工作流

### 1.1 Agent 组件版本控制

```
agent-repo/
├── prompts/                    # Prompt 模板
│   ├── v1/
│   │   ├── system_prompt.txt
│   │   └── action_prompts/
│   └── v2/
│       ├── system_prompt.txt
│       └── action_prompts/
├── knowledge_bases/            # 知识库配置
│   ├── data_source_sync.yaml
│   └── ingestion_jobs/
├── action_groups/              # Lambda 动作组
│   ├── order_service/
│   │   ├── lambda_function.py
│   │   └── api_schema.json
│   └── inventory_service/
├── agent_config.yaml           # Agent 主配置
└── tests/
    ├── unit/
    ├── integration/
    └── evaluation/
```

### 1.2 Bedrock Agent 配置即代码

```yaml
# agent_config.yaml
agent:
  name: CustomerServiceAgent
  description: "Customer service AI agent with order management capabilities"
  foundation_model: anthropic.claude-3-sonnet-20240229-v1:0
  
  # 指令模板
  instruction: |
    {{ template "system_prompt_v2.txt" . }}
  
  # 空闲会话超时
  idle_session_ttl: 1800
  
  # 记忆配置
  memory:
    enabled: true
    ttl_days: 30
  
  # 代码解释器
  code_interpreter:
    enabled: false
  
  # 护栏配置
  guardrails:
    - id: ${GUARDRAIL_ID}
      version: ${GUARDRAIL_VERSION}

# 动作组配置
action_groups:
  - name: OrderManagement
    description: "Manage customer orders"
    api_schema: "action_groups/order_service/api_schema.json"
    lambda_function: ${ORDER_SERVICE_LAMBDA_ARN}
    
  - name: InventoryQuery
    description: "Query product inventory"
    api_schema: "action_groups/inventory_service/api_schema.json"
    lambda_function: ${INVENTORY_SERVICE_LAMBDA_ARN}

# 知识库配置
knowledge_bases:
  - id: ${KNOWLEDGE_BASE_ID}
    description: "Product documentation and FAQs"
```

---

## 2. Prompt 版本管理

### 2.1 Prompt 模板引擎

```python
# src/prompt_manager.py
import yaml
import hashlib
from dataclasses import dataclass
from typing import Optional, Dict, Any
import boto3

@dataclass
class PromptVersion:
    version: str
    content: str
    hash: str
    metadata: Dict[str, Any]
    
class PromptManager:
    """Prompt 版本管理器"""
    
    def __init__(self, s3_bucket: str):
        self.s3 = boto3.client('s3')
        self.bucket = s3_bucket
        self._cache = {}
    
    def load_prompt(self, name: str, version: Optional[str] = None) -> PromptVersion:
        """加载指定版本的 Prompt"""
        
        # 从 S3 加载
        key = f"prompts/{name}/{version or 'latest'}.txt"
        
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=key)
            content = response['Body'].read().decode('utf-8')
            
            # 计算哈希
            content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
            
            # 加载元数据
            metadata_key = f"prompts/{name}/{version or 'latest'}.yaml"
            try:
                meta_response = self.s3.get_object(Bucket=self.bucket, Key=metadata_key)
                metadata = yaml.safe_load(meta_response['Body'])
            except:
                metadata = {}
            
            return PromptVersion(
                version=version or metadata.get('version', 'unknown'),
                content=content,
                hash=content_hash,
                metadata=metadata
            )
            
        except self.s3.exceptions.NoSuchKey:
            raise ValueError(f"Prompt not found: {name}@{version}")
    
    def save_prompt(self, name: str, content: str, 
                    version: str, metadata: Dict[str, Any]) -> str:
        """保存新版本的 Prompt"""
        
        # 计算哈希
        content_hash = hashlib.sha256(content.encode()).hexdigest()[:16]
        
        # 检查重复
        existing = self._get_existing_hash(name, content_hash)
        if existing:
            raise ValueError(f"Identical content already exists as {existing}")
        
        # 保存到 S3
        key = f"prompts/{name}/{version}.txt"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=content.encode('utf-8'),
            Metadata={
                'version': version,
                'hash': content_hash,
                'author': metadata.get('author', 'unknown'),
                'description': metadata.get('description', '')
            }
        )
        
        # 保存元数据
        meta_key = f"prompts/{name}/{version}.yaml"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=meta_key,
            Body=yaml.dump({
                'version': version,
                'hash': content_hash,
                **metadata
            }).encode('utf-8')
        )
        
        # 更新 latest 指针
        self.s3.copy_object(
            Bucket=self.bucket,
            CopySource={'Bucket': self.bucket, 'Key': key},
            Key=f"prompts/{name}/latest.txt"
        )
        
        return content_hash
    
    def list_versions(self, name: str) -> list:
        """列出所有版本"""
        response = self.s3.list_objects_v2(
            Bucket=self.bucket,
            Prefix=f"prompts/{name}/"
        )
        
        versions = []
        for obj in response.get('Contents', []):
            key = obj['Key']
            if key.endswith('.txt') and not key.endswith('latest.txt'):
                version = key.split('/')[-1].replace('.txt', '')
                versions.append({
                    'version': version,
                    'last_modified': obj['LastModified'],
                    'size': obj['Size']
                })
        
        return sorted(versions, key=lambda x: x['last_modified'], reverse=True)
    
    def compare_versions(self, name: str, v1: str, v2: str) -> Dict:
        """比较两个版本的差异"""
        prompt1 = self.load_prompt(name, v1)
        prompt2 = self.load_prompt(name, v2)
        
        return {
            'version_1': v1,
            'version_2': v2,
            'hash_1': prompt1.hash,
            'hash_2': prompt2.hash,
            'identical': prompt1.hash == prompt2.hash,
            'metadata_diff': self._diff_dict(
                prompt1.metadata, 
                prompt2.metadata
            )
        }
```

### 2.2 Prompt 变更检测

```python
# src/prompt_change_detector.py
import difflib
from typing import List, Tuple

class PromptChangeDetector:
    """检测 Prompt 变更的影响范围"""
    
    RISK_KEYWORDS = [
        'password', 'secret', 'key', 'credential',
        'ignore', 'bypass', 'disable', 'skip'
    ]
    
    def analyze_change(self, old_prompt: str, new_prompt: str) -> dict:
        """分析 Prompt 变更"""
        
        # 生成差异
        diff = list(difflib.unified_diff(
            old_prompt.splitlines(),
            new_prompt.splitlines(),
            lineterm=''
        ))
        
        # 安全检查
        security_risks = self._check_security_risks(new_prompt)
        
        # 长度变化
        length_change = len(new_prompt) - len(old_prompt)
        
        # Token 估算 (粗略)
        old_tokens = len(old_prompt) // 4
        new_tokens = len(new_prompt) // 4
        
        return {
            'diff_lines': diff,
            'security_risks': security_risks,
            'length_change': length_change,
            'token_estimate_change': new_tokens - old_tokens,
            'risk_level': 'HIGH' if security_risks else (
                'MEDIUM' if abs(length_change) > 500 else 'LOW'
            )
        }
    
    def _check_security_risks(self, prompt: str) -> List[str]:
        """检查安全风险"""
        risks = []
        prompt_lower = prompt.lower()
        
        for keyword in self.RISK_KEYWORDS:
            if keyword in prompt_lower:
                risks.append(f"Detected risky keyword: '{keyword}'")
        
        return risks
```

---

## 3. CI/CD 流水线设计

### 3.1 Bedrock Agent Pipeline (CodePipeline)

```yaml
# pipeline/template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Bedrock Agent CI/CD Pipeline

Parameters:
  GitHubConnectionArn:
    Type: String
  RepositoryName:
    Type: String
    Default: myorg/bedrock-agent

Resources:
  # S3 存储桶
  ArtifactBucket:
    Type: AWS::S3::Bucket
    Properties:
      LifecycleConfiguration:
        Rules:
          - ExpirationInDays: 30
            Status: Enabled

  # Prompt 存储桶
  PromptBucket:
    Type: AWS::S3::Bucket
    Properties:
      VersioningConfiguration:
        Status: Enabled

  # CodeBuild 项目 - Prompt 验证
  PromptValidationProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub ${AWS::StackName}-prompt-validation
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-prompt-validation.yml
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_SMALL
        Image: aws/codebuild/standard:5.0
      ServiceRole: !GetAtt BuildRole.Arn

  # CodeBuild 项目 - Agent 测试
  AgentTestProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub ${AWS::StackName}-agent-test
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-agent-test.yml
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_MEDIUM
        Image: aws/codebuild/standard:5.0
        EnvironmentVariables:
          - Name: BEDROCK_AGENT_ID
            Value: !Ref BedrockAgentDev
          - Name: TEST_DATA_BUCKET
            Value: !Ref TestDataBucket
      ServiceRole: !GetAtt BuildRole.Arn

  # CodeBuild 项目 - 评估
  EvaluationProject:
    Type: AWS::CodeBuild::Project
    Properties:
      Name: !Sub ${AWS::StackName}-evaluation
      Source:
        Type: CODEPIPELINE
        BuildSpec: buildspec-evaluation.yml
      Environment:
        Type: LINUX_CONTAINER
        ComputeType: BUILD_GENERAL1_LARGE
        Image: aws/codebuild/standard:5.0
      ServiceRole: !GetAtt BuildRole.Arn

  # Bedrock Agent - 开发环境
  BedrockAgentDev:
    Type: AWS::Bedrock::Agent
    Properties:
      AgentName: !Sub ${AWS::StackName}-dev
      Description: Development version of customer service agent
      FoundationModel: anthropic.claude-3-sonnet-20240229-v1:0
      Instruction: !Sub |
        You are a helpful customer service agent.
        Version: ${CodeBuildResolvedSourceVersion}
      IdleSessionTTLInSeconds: 1800

  # Bedrock Agent - 生产环境
  BedrockAgentProd:
    Type: AWS::Bedrock::Agent
    Properties:
      AgentName: !Sub ${AWS::StackName}-prod
      Description: Production customer service agent
      FoundationModel: anthropic.claude-3-sonnet-20240229-v1:0
      Instruction: Placeholder
      IdleSessionTTLInSeconds: 1800

  # CodePipeline
  Pipeline:
    Type: AWS::CodePipeline::Pipeline
    Properties:
      Name: !Sub ${AWS::StackName}-pipeline
      RoleArn: !GetAtt PipelineRole.Arn
      ArtifactStore:
        Type: S3
        Location: !Ref ArtifactBucket
      Stages:
        # Source 阶段
        - Name: Source
          Actions:
            - Name: GitHub_Source
              ActionTypeId:
                Category: Source
                Owner: AWS
                Provider: CodeStarSourceConnection
                Version: 1
              Configuration:
                ConnectionArn: !Ref GitHubConnectionArn
                FullRepositoryId: !Ref RepositoryName
                BranchName: main
              OutputArtifacts:
                - Name: SourceCode

        # Prompt 验证阶段
        - Name: PromptValidation
          Actions:
            - Name: ValidatePrompts
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref PromptValidationProject
              InputArtifacts:
                - Name: SourceCode
              OutputArtifacts:
                - Name: ValidationResults

        # 单元测试阶段
        - Name: UnitTest
          Actions:
            - Name: RunUnitTests
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref AgentTestProject
              InputArtifacts:
                - Name: SourceCode
              OutputArtifacts:
                - Name: TestResults

        # 部署到开发环境
        - Name: DeployDev
          Actions:
            - Name: UpdateDevAgent
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref AgentDeploymentProject
                EnvironmentVariables: |
                  {
                    "AGENT_ID": "!Ref BedrockAgentDev",
                    "ENVIRONMENT": "dev"
                  }
              InputArtifacts:
                - Name: SourceCode

        # 评估阶段
        - Name: Evaluation
          Actions:
            - Name: RunEvaluation
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref EvaluationProject
              InputArtifacts:
                - Name: SourceCode

        # 人工审批
        - Name: Approval
          Actions:
            - Name: ProductionApproval
              ActionTypeId:
                Category: Approval
                Owner: AWS
                Provider: Manual
                Version: 1
              Configuration:
                CustomData: Review evaluation results before production deployment

        # 部署到生产环境
        - Name: DeployProd
          Actions:
            - Name: UpdateProdAgent
              ActionTypeId:
                Category: Build
                Owner: AWS
                Provider: CodeBuild
                Version: 1
              Configuration:
                ProjectName: !Ref AgentDeploymentProject
                EnvironmentVariables: |
                  {
                    "AGENT_ID": "!Ref BedrockAgentProd",
                    "ENVIRONMENT": "prod"
                  }
              InputArtifacts:
                - Name: SourceCode
```

### 3.2 Buildspec - Prompt 验证

```yaml
# buildspec-prompt-validation.yml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install pyyaml jsonschema jinja2

  pre_build:
    commands:
      - echo "Validating prompt configurations..."

  build:
    commands:
      # 1. 验证 YAML 语法
      - python -c "import yaml; yaml.safe_load(open('agent_config.yaml'))"
      
      # 2. 验证 Prompt 模板语法
      - python scripts/validate_prompt_templates.py --prompts-dir prompts/
      
      # 3. 检测 Prompt 变更
      - python scripts/detect_prompt_changes.py 
          --bucket $PROMPT_BUCKET 
          --current prompts/
          --output prompt_changes.json
      
      # 4. 安全检查
      - python scripts/security_scan_prompts.py --prompts-dir prompts/

  post_build:
    commands:
      # 上传 Prompt 到 S3 (临时存储)
      - aws s3 sync prompts/ s3://$PROMPT_BUCKET/temp/$CODEBUILD_BUILD_ID/

artifacts:
  files:
    - prompt_changes.json
    - validation_report.json
```

### 3.3 Buildspec - Agent 测试

```yaml
# buildspec-agent-test.yml
version: 0.2

env:
  variables:
    BEDROCK_REGION: us-east-1
  secrets-manager:
    BEDROCK_API_KEY: bedrock/api-key

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install pytest pytest-asyncio boto3 requests

  build:
    commands:
      # 1. 单元测试 - Action Groups
      - pytest tests/unit/action_groups/ -v
      
      # 2. 集成测试 - Agent API
      - pytest tests/integration/test_agent_api.py -v 
          --agent-id $BEDROCK_AGENT_ID
      
      # 3. 测试知识库检索
      - pytest tests/integration/test_knowledge_base.py -v

  post_build:
    commands:
      - echo "Tests completed"

reports:
  pytest-reports:
    files:
      - test_report.xml
    file-format: JUNITXML
```

---

## 4. 自动化测试策略

### 4.1 Agent 测试金字塔

```
         /\
        /  \     E2E 测试 (真实对话)
       /____\    
      /      \   集成测试 (Agent API + Knowledge Base)
     /________\  
    /          \ 单元测试 (Action Groups, Prompts)
   /____________\
```

### 4.2 Prompt 单元测试

```python
# tests/unit/test_prompts.py
import pytest
from src.prompt_manager import PromptManager

class TestPrompts:
    """Prompt 单元测试"""
    
    @pytest.fixture
    def prompt_manager(self):
        return PromptManager(s3_bucket="test-prompts")
    
    def test_system_prompt_has_required_sections(self, prompt_manager):
        """验证系统 Prompt 包含必要章节"""
        prompt = prompt_manager.load_prompt("system", "v1")
        
        required_sections = [
            "Role",
            "Instructions",
            "Constraints",
            "Output Format"
        ]
        
        for section in required_sections:
            assert section in prompt.content, f"Missing section: {section}"
    
    def test_prompt_no_sensitive_data(self, prompt_manager):
        """验证 Prompt 不包含敏感数据"""
        prompt = prompt_manager.load_prompt("system", "v1")
        
        sensitive_patterns = [
            r'[A-Z0-9]{20}',  # API Keys
            r'password[:\s]+\S+',
            r'secret[:\s]+\S+',
        ]
        
        import re
        for pattern in sensitive_patterns:
            assert not re.search(pattern, prompt.content, re.IGNORECASE), \
                f"Potential sensitive data found: {pattern}"
    
    def test_prompt_token_limit(self, prompt_manager):
        """验证 Prompt 不超过 Token 限制"""
        prompt = prompt_manager.load_prompt("system", "v1")
        
        # 粗略估算: 1 token ≈ 4 characters
        estimated_tokens = len(prompt.content) // 4
        
        assert estimated_tokens < 4000, \
            f"Prompt too long: ~{estimated_tokens} tokens"
```

### 4.3 Agent 集成测试

```python
# tests/integration/test_agent_api.py
import pytest
import boto3
import json
from typing import Dict, Any

class TestBedrockAgentAPI:
    """Bedrock Agent API 集成测试"""
    
    @pytest.fixture
    def agent_client(self):
        return boto3.client('bedrock-agent-runtime')
    
    @pytest.fixture
    def agent_id(self, pytestconfig):
        return pytestconfig.getoption("--agent-id")
    
    def test_simple_query(self, agent_client, agent_id):
        """测试简单查询"""
        response = agent_client.invoke_agent(
            agentId=agent_id,
            agentAliasId='TSTALIASID',
            sessionId='test-session-001',
            inputText='What are your store hours?'
        )
        
        # 收集流式响应
        completion = ''
        for event in response['completion']:
            chunk = event['chunk']
            completion += chunk['bytes'].decode('utf-8')
        
        # 验证响应
        assert len(completion) > 0
        assert 'hour' in completion.lower() or 'open' in completion.lower()
    
    def test_action_group_invocation(self, agent_client, agent_id):
        """测试 Action Group 调用"""
        response = agent_client.invoke_agent(
            agentId=agent_id,
            agentAliasId='TSTALIASID',
            sessionId='test-session-002',
            inputText='Check order status for ORD-12345'
        )
        
        completion = ''
        trace = []
        
        for event in response['completion']:
            if 'chunk' in event:
                completion += event['chunk']['bytes'].decode('utf-8')
            if 'trace' in event:
                trace.append(event['trace'])
        
        # 验证调用了订单查询动作
        action_invocations = [
            t for t in trace 
            if t.get('trace', {}).get('orchestrationTrace', {}).get('actionGroupInvocation')
        ]
        
        assert len(action_invocations) > 0, "Action group was not invoked"
    
    def test_knowledge_base_retrieval(self, agent_client, agent_id):
        """测试知识库检索"""
        response = agent_client.invoke_agent(
            agentId=agent_id,
            agentAliasId='TSTALIASID',
            sessionId='test-session-003',
            inputText='What is your return policy?'
        )
        
        completion = ''
        for event in response['completion']:
            if 'chunk' in event:
                completion += event['chunk']['bytes'].decode('utf-8')
        
        # 验证返回了政策相关信息
        policy_keywords = ['return', 'refund', 'days', 'exchange']
        assert any(keyword in completion.lower() for keyword in policy_keywords)
```

### 4.4 LLM-as-a-Judge 评估

```python
# tests/evaluation/test_llm_judge.py
import boto3
import json
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class EvaluationCase:
    query: str
    expected_topics: List[str]
    forbidden_topics: List[str]
    expected_tone: str

class LLMJudge:
    """使用 LLM 评估 Agent 响应"""
    
    def __init__(self, model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"):
        self.bedrock = boto3.client('bedrock-runtime')
        self.model_id = model_id
    
    def evaluate_response(self, query: str, response: str, 
                         test_case: EvaluationCase) -> Dict:
        """评估单个响应"""
        
        evaluation_prompt = f"""You are an expert evaluator of AI assistant responses.

Query: {query}
Response: {response}

Evaluate the response on the following criteria (score 1-5):

1. **Relevance**: Does the response directly address the query?
2. **Accuracy**: Is the information factually correct?
3. **Completeness**: Does it cover all necessary aspects?
4. **Tone**: Is the tone {test_case.expected_tone}?

Expected topics to cover: {', '.join(test_case.expected_topics)}
Forbidden topics to avoid: {', '.join(test_case.forbidden_topics)}

Check if response covers expected topics and avoids forbidden ones.

Output your evaluation as JSON:
{{
    "relevance_score": <1-5>,
    "accuracy_score": <1-5>,
    "completeness_score": <1-5>,
    "tone_score": <1-5>,
    "expected_topics_covered": [<list>],
    "forbidden_topics_found": [<list>],
    "overall_score": <average>,
    "reasoning": "<detailed explanation>"
}}
"""
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 1000,
                "messages": [
                    {"role": "user", "content": evaluation_prompt}
                ]
            })
        )
        
        result = json.loads(response['body'].read())
        evaluation_text = result['content'][0]['text']
        
        # 提取 JSON
        import re
        json_match = re.search(r'\{.*\}', evaluation_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        return {"error": "Failed to parse evaluation", "raw": evaluation_text}
    
    def evaluate_batch(self, test_cases: List[EvaluationCase], 
                      agent_client, agent_id: str) -> Dict:
        """批量评估"""
        
        results = []
        
        for case in test_cases:
            # 调用 Agent
            response = agent_client.invoke_agent(
                agentId=agent_id,
                agentAliasId='TSTALIASID',
                sessionId=f'eval-{hash(case.query)}',
                inputText=case.query
            )
            
            completion = ''
            for event in response['completion']:
                if 'chunk' in event:
                    completion += event['chunk']['bytes'].decode('utf-8')
            
            # 评估
            evaluation = self.evaluate_response(case.query, completion, case)
            evaluation['query'] = case.query
            evaluation['response'] = completion
            
            results.append(evaluation)
        
        # 汇总
        avg_score = sum(r.get('overall_score', 0) for r in results) / len(results)
        
        return {
            'average_score': avg_score,
            'total_evaluated': len(results),
            'passed': sum(1 for r in results if r.get('overall_score', 0) >= 4),
            'details': results
        }
```

---

## 5. 生产部署最佳实践

### 5.1 A/B 测试框架

```typescript
// lib/agent-ab-test.ts
import * as cdk from 'aws-cdk-lib';
import * as bedrock from 'aws-cdk-lib/aws-bedrock';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface AgentABTestProps {
  readonly agentA: bedrock.CfnAgent;
  readonly agentB: bedrock.CfnAgent;
  readonly trafficPercentageA: number; // 0-100
  readonly evaluationMetric: string;
  readonly durationDays: number;
}

export class AgentABTest extends Construct {
  constructor(scope: Construct, id: string, props: AgentABTestProps) {
    super(scope, id);
    
    // Lambda 路由器
    const routerFunction = new lambda.Function(this, 'Router', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        
        exports.handler = async (event) => {
          const percentageA = ${props.trafficPercentageA};
          const random = Math.random() * 100;
          
          // 选择 Agent
          const useAgentA = random < percentageA;
          const agentId = useAgentA ? '${props.agentA.attrAgentId}' : '${props.agentB.attrAgentId}';
          const agentAlias = useAgentA ? 'ALIAS_A' : 'ALIAS_B';
          
          // 调用 Agent
          const bedrock = new AWS.BedrockAgentRuntime();
          const response = await bedrock.invokeAgent({
            agentId,
            agentAliasId: agentAlias,
            sessionId: event.sessionId,
            inputText: event.inputText,
          }).promise();
          
          return {
            agentVersion: useAgentA ? 'A' : 'B',
            response
          };
        };
      `),
    });
    
    // CloudWatch 仪表板
    new cloudwatch.Dashboard(this, 'ABTestDashboard', {
      dashboardName: `AgentABTest-${id}`,
      widgets: [
        new cloudwatch.GraphWidget({
          title: 'Response Time Comparison',
          left: [
            new cloudwatch.Metric({
              namespace: 'Custom/AgentABTest',
              metricName: 'ResponseTime',
              dimensionsMap: { Version: 'A' },
              label: 'Agent A',
            }),
            new cloudwatch.Metric({
              namespace: 'Custom/AgentABTest',
              metricName: 'ResponseTime',
              dimensionsMap: { Version: 'B' },
              label: 'Agent B',
            }),
          ],
        }),
      ],
    });
  }
}
```

### 5.2 自动回滚机制

```python
# src/auto_rollback.py
import boto3
import json
from typing import Dict, Any

class AgentAutoRollback:
    """基于指标的自动回滚"""
    
    def __init__(self, agent_id: str):
        self.bedrock = boto3.client('bedrock-agent')
        self.cloudwatch = boto3.client('cloudwatch')
        self.agent_id = agent_id
    
    def check_health(self, window_minutes: int = 10) -> Dict[str, Any]:
        """检查 Agent 健康度"""
        
        # 获取错误率
        error_rate = self._get_metric(
            'ErrorRate',
            window_minutes
        )
        
        # 获取延迟
        latency = self._get_metric(
            'ResponseLatency',
            window_minutes
        )
        
        # 获取 Token 使用量
        token_usage = self._get_metric(
            'TokenUsage',
            window_minutes
        )
        
        health = {
            'error_rate': error_rate,
            'latency_p99': latency,
            'token_usage': token_usage,
            'healthy': True,
            'reasons': []
        }
        
        # 健康检查
        if error_rate > 0.05:  # 5% 错误率阈值
            health['healthy'] = False
            health['reasons'].append(f"Error rate too high: {error_rate:.2%}")
        
        if latency > 10000:  # 10秒延迟阈值
            health['healthy'] = False
            health['reasons'].append(f"Latency too high: {latency}ms")
        
        return health
    
    def rollback_if_needed(self, previous_alias: str) -> bool:
        """如果需要则回滚"""
        
        health = self.check_health()
        
        if not health['healthy']:
            print(f"Health check failed: {health['reasons']}")
            print(f"Rolling back to {previous_alias}")
            
            # 执行回滚
            self._update_alias(previous_alias)
            return True
        
        return False
    
    def _get_metric(self, metric_name: str, window_minutes: int) -> float:
        """获取 CloudWatch 指标"""
        response = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/Bedrock',
            MetricName=metric_name,
            Dimensions=[
                {
                    'Name': 'AgentId',
                    'Value': self.agent_id
                }
            ],
            StartTime=datetime.utcnow() - timedelta(minutes=window_minutes),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Average']
        )
        
        datapoints = response['Datapoints']
        if datapoints:
            return sum(dp['Average'] for dp in datapoints) / len(datapoints)
        return 0.0
```

---

*Part of AI Agent DevTools Topic*
*Part of AWS DevTools Hero Learning Path*
