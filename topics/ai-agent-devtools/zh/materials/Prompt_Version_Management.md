# Prompt 版本管理最佳实践

> 像管理代码一样管理 Prompt - 版本控制、A/B 测试和回滚

---

## 目录

1. [Prompt 即代码](#1-prompt-即代码)
2. [版本控制系统](#2-版本控制系统)
3. [A/B 测试框架](#3-ab-测试框架)
4. [动态 Prompt 加载](#4-动态-prompt-加载)
5. [回滚机制](#5-回滚机制)

---

## 1. Prompt 即代码

### 1.1 Prompt 目录结构

```
prompts/
├── _base/                      # 基础模板
│   ├── system.j2               # Jinja2 系统模板
│   └── user.j2
├── customer_service/           # 场景：客服
│   ├── v1.0.0/
│   │   ├── system.txt
│   │   ├── greeting.txt
│   │   └── escalation.txt
│   ├── v1.1.0/
│   │   └── ...
│   └── _tests/                 # Prompt 测试
│       ├── test_greeting.py
│       └── test_escalation.py
├── code_generation/            # 场景：代码生成
│   └── v1.0.0/
│       ├── system.txt
│       ├── python.txt
│       └── javascript.txt
└── prompt_registry.yaml        # 注册表
```

### 1.2 Prompt 模板引擎

```python
# src/prompt_template_engine.py
from jinja2 import Environment, FileSystemLoader, StrictUndefined
import yaml
from typing import Dict, Any, Optional
import json

class PromptTemplateEngine:
    """Jinja2 驱动的 Prompt 模板引擎"""
    
    def __init__(self, prompts_dir: str = "prompts"):
        self.env = Environment(
            loader=FileSystemLoader(prompts_dir),
            undefined=StrictUndefined,  # 严格模式，变量未定义时报错
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # 注册自定义过滤器
        self.env.filters['to_json'] = lambda x: json.dumps(x, ensure_ascii=False)
        self.env.filters['format_list'] = lambda x: '\n'.join(f'- {item}' for item in x)
    
    def render(self, template_path: str, **kwargs) -> str:
        """渲染模板"""
        template = self.env.get_template(template_path)
        return template.render(**kwargs)
    
    def render_with_validation(self, template_path: str, 
                               expected_vars: list,
                               **kwargs) -> str:
        """带验证的渲染"""
        # 检查必需变量
        for var in expected_vars:
            if var not in kwargs:
                raise ValueError(f"Missing required variable: {var}")
        
        return self.render(template_path, **kwargs)


# 使用示例
engine = PromptTemplateEngine()

# 简单模板
prompt = engine.render(
    'customer_service/v1.0.0/system.txt',
    customer_name='张三',
    order_id='ORD-12345',
    issue_type='退款'
)

# 复杂模板（带条件逻辑）
complex_prompt = engine.render(
    'customer_service/v1.0.0/escalation.txt',
    customer_name='张三',
    issue_type='退款',
    order_value=5000,
    is_vip=True,
    previous_attempts=2
)
```

### 1.3 Prompt 元数据

```yaml
# prompts/customer_service/v1.0.0/metadata.yaml
version: 1.0.0
name: customer_service_base
description: "基础客服 Prompt，适用于一般咨询场景"

# 作者信息
author: alice@example.com
created_at: "2024-01-15T10:00:00Z"
last_modified: "2024-01-20T15:30:00Z"

# 模型适配
model_compatibility:
  - anthropic.claude-3-sonnet
  - anthropic.claude-3-haiku
  - amazon.titan-text-express

# 性能基准
benchmarks:
  - metric: response_quality
    score: 4.5
    evaluator: human
  - metric: avg_tokens
    score: 350

# 使用统计
usage:
  total_invocations: 15000
  avg_latency_ms: 1200
  error_rate: 0.02

# 变更历史
changelog:
  - version: 1.0.0
    date: "2024-01-15"
    changes:
      - "初始版本"
  - version: 1.0.1
    date: "2024-01-20"
    changes:
      - "添加了 VIP 客户处理逻辑"
      - "优化了退款话术"

# 依赖
dependencies: []
```

---

## 2. 版本控制系统

### 2.1 Git-based Prompt 管理

```bash
# .gitattributes - 将 Prompt 视为代码
*.txt text eol=lf
*.yaml text eol=lf
*.j2 text eol=lf

# Prompt 文件类型检测
*.prompt linguist-language=Text

# 强制代码审查
prompts/**/v*/*  @prompt-reviewers
```

```yaml
# .github/workflows/prompt-ci.yml
name: Prompt CI

on:
  push:
    paths:
      - 'prompts/**'
  pull_request:
    paths:
      - 'prompts/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install pyyaml jinja2
      
      - name: Validate Prompt syntax
        run: python scripts/validate_prompts.py
      
      - name: Check for secrets
        run: python scripts/scan_prompt_secrets.py
      
      - name: Run Prompt tests
        run: pytest prompts/**/_tests/ -v
      
      - name: Compare with production
        run: python scripts/compare_prompt_versions.py
```

### 2.2 Prompt Registry 服务

```python
# src/prompt_registry.py
import boto3
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class PromptVersion:
    version_id: str
    prompt_path: str
    content_hash: str
    created_at: str
    created_by: str
    model_compatibility: List[str]
    tags: List[str]
    is_active: bool = False

class PromptRegistry:
    """Prompt 注册表服务"""
    
    def __init__(self, table_name: str = "prompt-registry"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        self.s3 = boto3.client('s3')
        self.bucket = "prompt-registry-storage"
    
    def register(self, prompt_path: str, content: str,
                 metadata: Dict, created_by: str) -> str:
        """注册新版本"""
        
        # 计算内容哈希
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # 检查是否已存在
        existing = self._find_by_hash(content_hash)
        if existing:
            raise ValueError(f"Identical content already registered: {existing}")
        
        # 生成版本 ID
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        version_id = f"{metadata.get('name', 'unknown')}-v{timestamp}"
        
        # 存储到 S3
        s3_key = f"prompts/{version_id}.txt"
        self.s3.put_object(
            Bucket=self.bucket,
            Key=s3_key,
            Body=content.encode('utf-8'),
            Metadata={
                'version_id': version_id,
                'content_hash': content_hash
            }
        )
        
        # 注册到 DynamoDB
        prompt_version = PromptVersion(
            version_id=version_id,
            prompt_path=prompt_path,
            content_hash=content_hash,
            created_at=datetime.utcnow().isoformat(),
            created_by=created_by,
            model_compatibility=metadata.get('model_compatibility', []),
            tags=metadata.get('tags', [])
        )
        
        self.table.put_item(Item=asdict(prompt_version))
        
        return version_id
    
    def activate_version(self, version_id: str):
        """激活特定版本"""
        
        # 获取 Prompt 信息
        response = self.table.get_item(
            Key={'version_id': version_id}
        )
        
        if 'Item' not in response:
            raise ValueError(f"Version not found: {version_id}")
        
        prompt_path = response['Item']['prompt_path']
        
        # 停用该路径下的所有版本
        self._deactivate_all_versions(prompt_path)
        
        # 激活新版本
        self.table.update_item(
            Key={'version_id': version_id},
            UpdateExpression='SET is_active = :val',
            ExpressionAttributeValues={':val': True}
        )
    
    def get_active_version(self, prompt_path: str) -> Optional[PromptVersion]:
        """获取当前激活的版本"""
        
        response = self.table.query(
            IndexName='path-active-index',
            KeyConditionExpression='prompt_path = :path AND is_active = :active',
            ExpressionAttributeValues={
                ':path': prompt_path,
                ':active': True
            }
        )
        
        items = response.get('Items', [])
        if items:
            return PromptVersion(**items[0])
        return None
    
    def list_versions(self, prompt_path: str) -> List[PromptVersion]:
        """列出所有版本"""
        
        response = self.table.query(
            IndexName='prompt-path-index',
            KeyConditionExpression='prompt_path = :path',
            ExpressionAttributeValues={':path': prompt_path},
            ScanIndexForward=False
        )
        
        return [PromptVersion(**item) for item in response.get('Items', [])]
    
    def rollback(self, prompt_path: str, steps: int = 1) -> str:
        """回滚到之前的版本"""
        
        versions = self.list_versions(prompt_path)
        
        if len(versions) <= steps:
            raise ValueError("No previous version to rollback to")
        
        target_version = versions[steps]
        self.activate_version(target_version.version_id)
        
        return target_version.version_id
```

---

## 3. A/B 测试框架

### 3.1 Prompt A/B 测试服务

```python
# src/prompt_ab_testing.py
import random
import boto3
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ABTestConfig:
    test_id: str
    prompt_path: str
    variant_a: str  # 版本 ID A
    variant_b: str  # 版本 ID B
    traffic_split: float  # A 的流量占比 (0-1)
    success_metric: str
    min_samples: int
    duration_days: int

class PromptABTester:
    """Prompt A/B 测试器"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.experiment_table = self.dynamodb.Table('ab-test-experiments')
        self.result_table = self.dynamodb.Table('ab-test-results')
    
    def create_experiment(self, config: ABTestConfig) -> str:
        """创建 A/B 测试实验"""
        
        self.experiment_table.put_item(Item={
            'test_id': config.test_id,
            'prompt_path': config.prompt_path,
            'variant_a': config.variant_a,
            'variant_b': config.variant_b,
            'traffic_split': config.traffic_split,
            'success_metric': config.success_metric,
            'min_samples': config.min_samples,
            'duration_days': config.duration_days,
            'status': 'running',
            'created_at': datetime.utcnow().isoformat(),
            'samples_a': 0,
            'samples_b': 0
        })
        
        return config.test_id
    
    def get_variant(self, test_id: str, user_id: str) -> str:
        """为用户分配变体（一致性哈希）"""
        
        # 获取实验配置
        response = self.experiment_table.get_item(
            Key={'test_id': test_id}
        )
        
        if 'Item' not in response:
            raise ValueError(f"Test not found: {test_id}")
        
        config = response['Item']
        
        # 使用用户 ID 进行一致性哈希
        hash_value = hash(f"{test_id}:{user_id}") % 100
        traffic_split = int(config['traffic_split'] * 100)
        
        if hash_value < traffic_split:
            variant = 'A'
            self._increment_counter(test_id, 'samples_a')
        else:
            variant = 'B'
            self._increment_counter(test_id, 'samples_b')
        
        return variant, config[f'variant_{variant.lower()}']
    
    def record_result(self, test_id: str, variant: str,
                     metric_value: float, metadata: Dict):
        """记录测试结果"""
        
        self.result_table.put_item(Item={
            'test_id': test_id,
            'timestamp': datetime.utcnow().isoformat(),
            'variant': variant,
            'metric_value': metric_value,
            'metadata': metadata
        })
    
    def get_test_results(self, test_id: str) -> Dict:
        """获取测试结果统计"""
        
        # 查询所有结果
        response = self.result_table.query(
            KeyConditionExpression='test_id = :tid',
            ExpressionAttributeValues={':tid': test_id}
        )
        
        items = response.get('Items', [])
        
        # 按变体分组统计
        stats_a = [float(i['metric_value']) for i in items if i['variant'] == 'A']
        stats_b = [float(i['metric_value']) for i in items if i['variant'] == 'B']
        
        return {
            'test_id': test_id,
            'variant_a': {
                'count': len(stats_a),
                'mean': sum(stats_a) / len(stats_a) if stats_a else 0,
                'min': min(stats_a) if stats_a else 0,
                'max': max(stats_a) if stats_a else 0
            },
            'variant_b': {
                'count': len(stats_b),
                'mean': sum(stats_b) / len(stats_b) if stats_b else 0,
                'min': min(stats_b) if stats_b else 0,
                'max': max(stats_b) if stats_b else 0
            },
            'improvement': (
                (sum(stats_b) / len(stats_b) - sum(stats_a) / len(stats_a)) /
                (sum(stats_a) / len(stats_a)) * 100
            ) if stats_a and stats_b else 0
        }
    
    def _increment_counter(self, test_id: str, counter: str):
        """增加计数器"""
        self.experiment_table.update_item(
            Key={'test_id': test_id},
            UpdateExpression=f'ADD {counter} :inc',
            ExpressionAttributeValues={':inc': 1}
        )
```

### 3.2 统计显著性检验

```python
# src/statistical_analysis.py
import math
from typing import List, Tuple
from scipy import stats

class StatisticalAnalyzer:
    """统计分析工具"""
    
    @staticmethod
    def calculate_confidence_interval(data: List[float], 
                                     confidence: float = 0.95) -> Tuple[float, float]:
        """计算置信区间"""
        n = len(data)
        mean = sum(data) / n
        std_err = stats.sem(data)
        
        margin = std_err * stats.t.ppf((1 + confidence) / 2, n - 1)
        
        return mean - margin, mean + margin
    
    @staticmethod
    def t_test(group_a: List[float], group_b: List[float]) -> Dict:
        """T 检验"""
        t_stat, p_value = stats.ttest_ind(group_a, group_b)
        
        return {
            't_statistic': t_stat,
            'p_value': p_value,
            'significant': p_value < 0.05,
            'effect_size': abs(sum(group_a)/len(group_a) - sum(group_b)/len(group_b))
        }
    
    @staticmethod
    def required_sample_size(baseline_rate: float, 
                           minimum_detectable_effect: float,
                           power: float = 0.8,
                           alpha: float = 0.05) -> int:
        """计算所需样本量"""
        
        # 简化版样本量计算
        z_alpha = 1.96  # 95% 置信度
        z_beta = 0.84   # 80% 功效
        
        p1 = baseline_rate
        p2 = baseline_rate * (1 + minimum_detectable_effect)
        
        pooled_p = (p1 + p2) / 2
        
        n = (
            (z_alpha * math.sqrt(2 * pooled_p * (1 - pooled_p)) +
             z_beta * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
        ) / ((p1 - p2) ** 2)
        
        return math.ceil(n)
```

---

## 4. 动态 Prompt 加载

### 4.1 实时 Prompt 更新

```python
# src/dynamic_prompt_loader.py
import boto3
import json
from typing import Dict, Optional
import threading
import time

class DynamicPromptLoader:
    """动态 Prompt 加载器（支持热更新）"""
    
    def __init__(self, refresh_interval: int = 60):
        self.s3 = boto3.client('s3')
        self.bucket = "prompt-registry-storage"
        self.cache: Dict[str, Dict] = {}
        self.etag_cache: Dict[str, str] = {}
        self.refresh_interval = refresh_interval
        self._start_refresh_thread()
    
    def _start_refresh_thread(self):
        """启动后台刷新线程"""
        def refresh_loop():
            while True:
                time.sleep(self.refresh_interval)
                self._refresh_all()
        
        thread = threading.Thread(target=refresh_loop, daemon=True)
        thread.start()
    
    def _refresh_all(self):
        """刷新所有缓存的 Prompt"""
        for version_id in list(self.cache.keys()):
            self._load_if_changed(version_id)
    
    def _load_if_changed(self, version_id: str) -> bool:
        """如果发生变化则重新加载"""
        s3_key = f"prompts/{version_id}.txt"
        
        try:
            # 检查 ETag
            head = self.s3.head_object(Bucket=self.bucket, Key=s3_key)
            current_etag = head['ETag']
            
            cached_etag = self.etag_cache.get(version_id)
            
            if cached_etag != current_etag:
                # 已更改，重新加载
                response = self.s3.get_object(Bucket=self.bucket, Key=s3_key)
                content = response['Body'].read().decode('utf-8')
                
                self.cache[version_id] = {
                    'content': content,
                    'etag': current_etag,
                    'last_modified': head['LastModified'].isoformat()
                }
                self.etag_cache[version_id] = current_etag
                
                return True
            
            return False
            
        except Exception as e:
            print(f"Error refreshing {version_id}: {e}")
            return False
    
    def get_prompt(self, version_id: str) -> str:
        """获取 Prompt（带缓存）"""
        
        # 检查缓存
        if version_id in self.cache:
            return self.cache[version_id]['content']
        
        # 首次加载
        s3_key = f"prompts/{version_id}.txt"
        response = self.s3.get_object(Bucket=self.bucket, Key=s3_key)
        content = response['Body'].read().decode('utf-8')
        
        self.cache[version_id] = {
            'content': content,
            'etag': response['ETag'],
            'last_modified': response['LastModified'].isoformat()
        }
        self.etag_cache[version_id] = response['ETag']
        
        return content
    
    def get_prompt_with_fallback(self, version_id: str, 
                                 fallback_id: str) -> str:
        """获取 Prompt（带降级）"""
        try:
            return self.get_prompt(version_id)
        except Exception as e:
            print(f"Failed to load {version_id}, falling back to {fallback_id}: {e}")
            return self.get_prompt(fallback_id)
```

### 4.2 Feature Flag 集成

```python
# src/prompt_feature_flags.py
import boto3
from typing import Dict, Optional

class PromptFeatureFlags:
    """Prompt Feature Flag 管理"""
    
    def __init__(self):
        self.appconfig = boto3.client('appconfigdata')
        self.evidently = boto3.client('evidently')
    
    def get_active_prompt_version(self, feature: str,
                                  user_context: Dict) -> str:
        """根据 Feature Flag 获取 Prompt 版本"""
        
        # 检查 Evidently 实验
        try:
            evaluation = self.evidently.evaluate_feature(
                project='prompt-optimization',
                feature=feature,
                entityId=user_context.get('user_id', 'anonymous'),
                evaluationContext=json.dumps(user_context)
            )
            
            variation = evaluation['variation']
            
            # 映射到 Prompt 版本
            version_map = {
                'control': 'v1.0.0',
                'treatment': 'v1.1.0-beta'
            }
            
            return version_map.get(variation, 'v1.0.0')
            
        except Exception as e:
            print(f"Evidently evaluation failed: {e}")
            return 'v1.0.0'  # 默认版本
    
    def is_feature_enabled(self, feature: str) -> bool:
        """检查功能开关状态"""
        
        try:
            response = self.appconfig.get_latest_configuration(
                ConfigurationToken='prompt-config'
            )
            
            config = json.loads(response['Configuration'].read())
            return config.get('features', {}).get(feature, False)
            
        except:
            return False
```

---

## 5. 回滚机制

### 5.1 自动回滚触发器

```python
# src/prompt_rollback.py
import boto3
import json
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class RollbackCondition:
    metric: str
    threshold: float
    duration_minutes: int
    consecutive_breaches: int

class PromptAutoRollback:
    """Prompt 自动回滚"""
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
        self.registry = PromptRegistry()
        
        self.rollback_conditions = [
            RollbackCondition('ErrorRate', 0.1, 5, 3),      # 5分钟错误率>10%
            RollbackCondition('P99Latency', 5000, 5, 3),    # 5分钟P99延迟>5s
            RollbackCondition('RefusalRate', 0.3, 5, 2),    # 5分钟拒绝率>30%
        ]
    
    def check_and_rollback(self, prompt_path: str, 
                          current_version: str) -> Dict:
        """检查并执行回滚"""
        
        alerts = []
        should_rollback = False
        
        for condition in self.rollback_conditions:
            if self._check_condition(prompt_path, condition):
                alerts.append({
                    'metric': condition.metric,
                    'threshold': condition.threshold
                })
                should_rollback = True
        
        if should_rollback:
            # 执行回滚
            previous_version = self._get_previous_version(prompt_path, current_version)
            
            if previous_version:
                self.registry.activate_version(previous_version)
                
                self._send_alert(
                    f"Prompt rolled back from {current_version} to {previous_version}",
                    alerts
                )
                
                return {
                    'rolled_back': True,
                    'from_version': current_version,
                    'to_version': previous_version,
                    'reasons': alerts
                }
        
        return {'rolled_back': False, 'checks': len(alerts)}
    
    def _check_condition(self, prompt_path: str, 
                        condition: RollbackCondition) -> bool:
        """检查单个条件"""
        
        from datetime import datetime, timedelta
        
        response = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Prompt',
            MetricName=condition.metric,
            Dimensions=[{'Name': 'PromptPath', 'Value': prompt_path}],
            StartTime=datetime.utcnow() - timedelta(minutes=condition.duration_minutes),
            EndTime=datetime.utcnow(),
            Period=60,
            Statistics=['Average']
        )
        
        datapoints = response.get('Datapoints', [])
        
        if len(datapoints) < condition.consecutive_breaches:
            return False
        
        # 检查连续 breach
        sorted_points = sorted(datapoints, key=lambda x: x['Timestamp'])
        recent_points = sorted_points[-condition.consecutive_breaches:]
        
        return all(
            dp['Average'] > condition.threshold
            for dp in recent_points
        )
    
    def _get_previous_version(self, prompt_path: str, 
                             current_version: str) -> str:
        """获取上一个版本"""
        versions = self.registry.list_versions(prompt_path)
        
        for i, version in enumerate(versions):
            if version.version_id == current_version and i < len(versions) - 1:
                return versions[i + 1].version_id
        
        return None
    
    def _send_alert(self, message: str, details: List[Dict]):
        """发送告警"""
        self.sns.publish(
            TopicArn='arn:aws:sns:REGION:ACCOUNT:prompt-alerts',
            Subject='Prompt Auto-Rollback Triggered',
            Message=json.dumps({
                'message': message,
                'details': details,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
```

---

*Part of AI Agent DevTools Topic*
*Part of AWS DevTools Hero Learning Path*
