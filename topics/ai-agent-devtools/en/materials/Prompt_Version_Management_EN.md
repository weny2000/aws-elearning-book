# Prompt Version Management Best Practices

> Manage Prompts like Code - Version Control, A/B Testing, and Rollback

---

## Table of Contents

1. [Prompt as Code](#1-prompt-as-code)
2. [Version Control System](#2-version-control-system)
3. [A/B Testing Framework](#3-ab-testing-framework)
4. [Dynamic Prompt Loading](#4-dynamic-prompt-loading)
5. [Rollback Mechanism](#5-rollback-mechanism)

---

## 1. Prompt as Code

### 1.1 Prompt Directory Structure

```
prompts/
├── _base/                      # Base templates
│   ├── system.j2               # Jinja2 system template
│   └── user.j2
├── customer_service/           # Scenario: Customer Service
│   ├── v1.0.0/
│   │   ├── system.txt
│   │   ├── greeting.txt
│   │   └── escalation.txt
│   ├── v1.1.0/
│   │   └── ...
│   └── _tests/                 # Prompt tests
│       ├── test_greeting.py
│       └── test_escalation.py
├── code_generation/            # Scenario: Code Generation
│   └── v1.0.0/
│       ├── system.txt
│       ├── python.txt
│       └── javascript.txt
└── prompt_registry.yaml        # Registry
```

### 1.2 Prompt Template Engine

```python
# src/prompt_template_engine.py
from jinja2 import Environment, FileSystemLoader, StrictUndefined
import yaml
from typing import Dict, Any, Optional
import json

class PromptTemplateEngine:
    """Jinja2-powered Prompt Template Engine"""
    
    def __init__(self, prompts_dir: str = "prompts"):
        self.env = Environment(
            loader=FileSystemLoader(prompts_dir),
            undefined=StrictUndefined,  # Strict mode: error on undefined variables
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Register custom filters
        self.env.filters['to_json'] = lambda x: json.dumps(x, ensure_ascii=False)
        self.env.filters['format_list'] = lambda x: '\n'.join(f'- {item}' for item in x)
    
    def render(self, template_path: str, **kwargs) -> str:
        """Render template"""
        template = self.env.get_template(template_path)
        return template.render(**kwargs)
    
    def render_with_validation(self, template_path: str, 
                               expected_vars: list,
                               **kwargs) -> str:
        """Render with validation"""
        # Check required variables
        for var in expected_vars:
            if var not in kwargs:
                raise ValueError(f"Missing required variable: {var}")
        
        return self.render(template_path, **kwargs)


# Usage Example
engine = PromptTemplateEngine()

# Simple template
prompt = engine.render(
    'customer_service/v1.0.0/system.txt',
    customer_name='Zhang San',
    order_id='ORD-12345',
    issue_type='Refund'
)

# Complex template (with conditional logic)
complex_prompt = engine.render(
    'customer_service/v1.0.0/escalation.txt',
    customer_name='Zhang San',
    issue_type='Refund',
    order_value=5000,
    is_vip=True,
    previous_attempts=2
)
```

### 1.3 Prompt Metadata

```yaml
# prompts/customer_service/v1.0.0/metadata.yaml
version: 1.0.0
name: customer_service_base
description: "Basic Customer Service Prompt for general inquiry scenarios"

# Author Information
author: alice@example.com
created_at: "2024-01-15T10:00:00Z"
last_modified: "2024-01-20T15:30:00Z"

# Model Compatibility
model_compatibility:
  - anthropic.claude-3-sonnet
  - anthropic.claude-3-haiku
  - amazon.titan-text-express

# Performance Benchmarks
benchmarks:
  - metric: response_quality
    score: 4.5
    evaluator: human
  - metric: avg_tokens
    score: 350

# Usage Statistics
usage:
  total_invocations: 15000
  avg_latency_ms: 1200
  error_rate: 0.02

# Changelog
changelog:
  - version: 1.0.0
    date: "2024-01-15"
    changes:
      - "Initial version"
  - version: 1.0.1
    date: "2024-01-20"
    changes:
      - "Added VIP customer handling logic"
      - "Optimized refund script"

dependencies: []
```

---

## 2. Version Control System

### 2.1 Git-based Prompt Management

```bash
# .gitattributes - Treat Prompts as Code
*.txt text eol=lf
*.yaml text eol=lf
*.j2 text eol=lf

# Prompt File Type Detection
*.prompt linguist-language=Text

# Enforce Code Review
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

### 2.2 Prompt Registry Service

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
    """Prompt Registry Service"""
    
    def __init__(self, table_name: str = "prompt-registry"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        self.s3 = boto3.client('s3')
        self.bucket = "prompt-registry-storage"
    
    def register(self, prompt_path: str, content: str,
                 metadata: Dict, created_by: str) -> str:
        """Register new version"""
        
        # Calculate content hash
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # Check if already exists
        existing = self._find_by_hash(content_hash)
        if existing:
            raise ValueError(f"Identical content already registered: {existing}")
        
        # Generate version ID
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        version_id = f"{metadata.get('name', 'unknown')}-v{timestamp}"
        
        # Store to S3
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
        
        # Register to DynamoDB
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
        """Activate specific version"""
        
        # Get prompt info
        response = self.table.get_item(
            Key={'version_id': version_id}
        )
        
        if 'Item' not in response:
            raise ValueError(f"Version not found: {version_id}")
        
        prompt_path = response['Item']['prompt_path']
        
        # Deactivate all versions under this path
        self._deactivate_all_versions(prompt_path)
        
        # Activate new version
        self.table.update_item(
            Key={'version_id': version_id},
            UpdateExpression='SET is_active = :val',
            ExpressionAttributeValues={':val': True}
        )
    
    def get_active_version(self, prompt_path: str) -> Optional[PromptVersion]:
        """Get currently active version"""
        
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
        """List all versions"""
        
        response = self.table.query(
            IndexName='prompt-path-index',
            KeyConditionExpression='prompt_path = :path',
            ExpressionAttributeValues={':path': prompt_path},
            ScanIndexForward=False
        )
        
        return [PromptVersion(**item) for item in response.get('Items', [])]
    
    def rollback(self, prompt_path: str, steps: int = 1) -> str:
        """Rollback to previous version"""
        
        versions = self.list_versions(prompt_path)
        
        if len(versions) <= steps:
            raise ValueError("No previous version to rollback to")
        
        target_version = versions[steps]
        self.activate_version(target_version.version_id)
        
        return target_version.version_id
```

---

## 3. A/B Testing Framework

### 3.1 Prompt A/B Testing Service

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
    variant_a: str  # Version ID A
    variant_b: str  # Version ID B
    traffic_split: float  # Traffic percentage for A (0-1)
    success_metric: str
    min_samples: int
    duration_days: int

class PromptABTester:
    """Prompt A/B Tester"""
    
    def __init__(self):
        self.dynamodb = boto3.resource('dynamodb')
        self.experiment_table = self.dynamodb.Table('ab-test-experiments')
        self.result_table = self.dynamodb.Table('ab-test-results')
    
    def create_experiment(self, config: ABTestConfig) -> str:
        """Create A/B testing experiment"""
        
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
        """Assign variant to user (consistent hashing)"""
        
        # Get experiment config
        response = self.experiment_table.get_item(
            Key={'test_id': test_id}
        )
        
        if 'Item' not in response:
            raise ValueError(f"Test not found: {test_id}")
        
        config = response['Item']
        
        # Use user ID for consistent hashing
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
        """Record test result"""
        
        self.result_table.put_item(Item={
            'test_id': test_id,
            'timestamp': datetime.utcnow().isoformat(),
            'variant': variant,
            'metric_value': metric_value,
            'metadata': metadata
        })
    
    def get_test_results(self, test_id: str) -> Dict:
        """Get test result statistics"""
        
        # Query all results
        response = self.result_table.query(
            KeyConditionExpression='test_id = :tid',
            ExpressionAttributeValues={':tid': test_id}
        )
        
        items = response.get('Items', [])
        
        # Group by variant
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
        """Increment counter"""
        self.experiment_table.update_item(
            Key={'test_id': test_id},
            UpdateExpression=f'ADD {counter} :inc',
            ExpressionAttributeValues={':inc': 1}
        )
```

### 3.2 Statistical Significance Testing

```python
# src/statistical_analysis.py
import math
from typing import List, Tuple
from scipy import stats

class StatisticalAnalyzer:
    """Statistical Analysis Tools"""
    
    @staticmethod
    def calculate_confidence_interval(data: List[float], 
                                     confidence: float = 0.95) -> Tuple[float, float]:
        """Calculate confidence interval"""
        n = len(data)
        mean = sum(data) / n
        std_err = stats.sem(data)
        
        margin = std_err * stats.t.ppf((1 + confidence) / 2, n - 1)
        
        return mean - margin, mean + margin
    
    @staticmethod
    def t_test(group_a: List[float], group_b: List[float]) -> Dict:
        """T-test"""
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
        """Calculate required sample size"""
        
        # Simplified sample size calculation
        z_alpha = 1.96  # 95% confidence
        z_beta = 0.84   # 80% power
        
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

## 4. Dynamic Prompt Loading

### 4.1 Real-time Prompt Updates

```python
# src/dynamic_prompt_loader.py
import boto3
import json
from typing import Dict, Optional
import threading
import time

class DynamicPromptLoader:
    """Dynamic Prompt Loader (supports hot reload)"""
    
    def __init__(self, refresh_interval: int = 60):
        self.s3 = boto3.client('s3')
        self.bucket = "prompt-registry-storage"
        self.cache: Dict[str, Dict] = {}
        self.etag_cache: Dict[str, str] = {}
        self.refresh_interval = refresh_interval
        self._start_refresh_thread()
    
    def _start_refresh_thread(self):
        """Start background refresh thread"""
        def refresh_loop():
            while True:
                time.sleep(self.refresh_interval)
                self._refresh_all()
        
        thread = threading.Thread(target=refresh_loop, daemon=True)
        thread.start()
    
    def _refresh_all(self):
        """Refresh all cached prompts"""
        for version_id in list(self.cache.keys()):
            self._load_if_changed(version_id)
    
    def _load_if_changed(self, version_id: str) -> bool:
        """Reload if changed"""
        s3_key = f"prompts/{version_id}.txt"
        
        try:
            # Check ETag
            head = self.s3.head_object(Bucket=self.bucket, Key=s3_key)
            current_etag = head['ETag']
            
            cached_etag = self.etag_cache.get(version_id)
            
            if cached_etag != current_etag:
                # Changed, reload
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
        """Get prompt (with cache)"""
        
        # Check cache
        if version_id in self.cache:
            return self.cache[version_id]['content']
        
        # First load
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
        """Get prompt (with fallback)"""
        try:
            return self.get_prompt(version_id)
        except Exception as e:
            print(f"Failed to load {version_id}, falling back to {fallback_id}: {e}")
            return self.get_prompt(fallback_id)
```

### 4.2 Feature Flag Integration

```python
# src/prompt_feature_flags.py
import boto3
from typing import Dict, Optional

class PromptFeatureFlags:
    """Prompt Feature Flag Management"""
    
    def __init__(self):
        self.appconfig = boto3.client('appconfigdata')
        self.evidently = boto3.client('evidently')
    
    def get_active_prompt_version(self, feature: str,
                                  user_context: Dict) -> str:
        """Get prompt version based on feature flag"""
        
        # Check Evidently experiment
        try:
            evaluation = self.evidently.evaluate_feature(
                project='prompt-optimization',
                feature=feature,
                entityId=user_context.get('user_id', 'anonymous'),
                evaluationContext=json.dumps(user_context)
            )
            
            variation = evaluation['variation']
            
            # Map to prompt version
            version_map = {
                'control': 'v1.0.0',
                'treatment': 'v1.1.0-beta'
            }
            
            return version_map.get(variation, 'v1.0.0')
            
        except Exception as e:
            print(f"Evidently evaluation failed: {e}")
            return 'v1.0.0'  # Default version
    
    def is_feature_enabled(self, feature: str) -> bool:
        """Check feature flag status"""
        
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

## 5. Rollback Mechanism

### 5.1 Automatic Rollback Triggers

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
    """Prompt Automatic Rollback"""
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
        self.registry = PromptRegistry()
        
        self.rollback_conditions = [
            RollbackCondition('ErrorRate', 0.1, 5, 3),      # 5-min error rate > 10%
            RollbackCondition('P99Latency', 5000, 5, 3),    # 5-min P99 latency > 5s
            RollbackCondition('RefusalRate', 0.3, 5, 2),    # 5-min refusal rate > 30%
        ]
    
    def check_and_rollback(self, prompt_path: str, 
                          current_version: str) -> Dict:
        """Check and execute rollback"""
        
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
            # Execute rollback
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
        """Check single condition"""
        
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
        
        # Check consecutive breaches
        sorted_points = sorted(datapoints, key=lambda x: x['Timestamp'])
        recent_points = sorted_points[-condition.consecutive_breaches:]
        
        return all(
            dp['Average'] > condition.threshold
            for dp in recent_points
        )
    
    def _get_previous_version(self, prompt_path: str, 
                             current_version: str) -> str:
        """Get previous version"""
        versions = self.registry.list_versions(prompt_path)
        
        for i, version in enumerate(versions):
            if version.version_id == current_version and i < len(versions) - 1:
                return versions[i + 1].version_id
        
        return None
    
    def _send_alert(self, message: str, details: List[Dict]):
        """Send alert"""
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
