# 企业级数据集评价自动化

> 构建可扩展、可重复的AI数据集质量评估流水线

---

## 目录

1. [数据集质量框架](#1-数据集质量框架)
2. [自动化数据验证](#2-自动化数据验证)
3. [合成数据生成与验证](#3-合成数据生成与验证)
4. [数据集版本与血缘](#4-数据集版本与血缘)
5. [CI/CD集成](#5-cicd集成)

---

## 1. 数据集质量框架

### 1.1 多维度质量评估体系

```python
# src/dataset_quality_framework.py
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from enum import Enum
import json
import hashlib
from datetime import datetime

class QualityDimension(Enum):
    COMPLETENESS = "completeness"      # 完整性
    CONSISTENCY = "consistency"        # 一致性
    ACCURACY = "accuracy"              # 准确性
    TIMELINESS = "timeliness"          # 时效性
    VALIDITY = "validity"              # 有效性
    UNIQUENESS = "uniqueness"          # 唯一性
    BALANCE = "balance"                # 平衡性（类别分布）

@dataclass
class QualityMetric:
    dimension: QualityDimension
    score: float  # 0-1
    details: Dict
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    
@dataclass
class DatasetQualityReport:
    dataset_id: str
    version: str
    overall_score: float
    metrics: List[QualityMetric]
    recommendations: List[str]
    critical_issues: List[str]

class DatasetQualityEngine:
    """数据集质量评估引擎"""
    
    def __init__(self):
        self.evaluators: Dict[QualityDimension, Callable] = {
            QualityDimension.COMPLETENESS: self._evaluate_completeness,
            QualityDimension.CONSISTENCY: self._evaluate_consistency,
            QualityDimension.ACCURACY: self._evaluate_accuracy,
            QualityDimension.TIMELINESS: self._evaluate_timeliness,
            QualityDimension.VALIDITY: self._evaluate_validity,
            QualityDimension.UNIQUENESS: self._evaluate_uniqueness,
            QualityDimension.BALANCE: self._evaluate_balance,
        }
    
    def evaluate(self, dataset: List[Dict], 
                 schema: Dict,
                 dimensions: Optional[List[QualityDimension]] = None) -> DatasetQualityReport:
        """执行完整质量评估"""
        
        dimensions = dimensions or list(QualityDimension)
        metrics = []
        recommendations = []
        critical_issues = []
        
        for dimension in dimensions:
            evaluator = self.evaluators.get(dimension)
            if evaluator:
                score, details, issues = evaluator(dataset, schema)
                metrics.append(QualityMetric(
                    dimension=dimension,
                    score=score,
                    details=details
                ))
                
                if score < 0.5:
                    critical_issues.extend(issues)
                elif score < 0.8:
                    recommendations.extend(issues)
        
        overall_score = sum(m.score for m in metrics) / len(metrics)
        
        # 生成数据集ID
        dataset_hash = hashlib.sha256(
            json.dumps(dataset[:100], sort_keys=True).encode()
        ).hexdigest()[:16]
        
        return DatasetQualityReport(
            dataset_id=f"ds-{dataset_hash}",
            version=datetime.utcnow().strftime("%Y%m%d%H%M%S"),
            overall_score=overall_score,
            metrics=metrics,
            recommendations=recommendations,
            critical_issues=critical_issues
        )
    
    def _evaluate_completeness(self, dataset: List[Dict], 
                               schema: Dict) -> tuple:
        """评估数据完整性"""
        total_cells = len(dataset) * len(schema.get('required_fields', []))
        filled_cells = 0
        missing_by_field = {}
        
        for record in dataset:
            for field in schema.get('required_fields', []):
                if record.get(field) not in [None, '', []]:
                    filled_cells += 1
                else:
                    missing_by_field[field] = missing_by_field.get(field, 0) + 1
        
        score = filled_cells / total_cells if total_cells > 0 else 0
        
        issues = []
        for field, count in missing_by_field.items():
            if count / len(dataset) > 0.1:  # 缺失率>10%
                issues.append(f"Field '{field}' has {count}/{len(dataset)} missing values")
        
        return score, {'missing_by_field': missing_by_field}, issues
    
    def _evaluate_consistency(self, dataset: List[Dict], 
                              schema: Dict) -> tuple:
        """评估数据一致性"""
        inconsistencies = []
        
        # 检查类型一致性
        for field, field_type in schema.get('field_types', {}).items():
            type_violations = 0
            for record in dataset:
                value = record.get(field)
                if value is not None:
                    if not self._check_type(value, field_type):
                        type_violations += 1
            
            if type_violations > 0:
                inconsistencies.append({
                    'field': field,
                    'type_violations': type_violations
                })
        
        # 检查跨字段一致性规则
        for rule in schema.get('consistency_rules', []):
            violations = self._check_consistency_rule(dataset, rule)
            if violations > 0:
                inconsistencies.append({
                    'rule': rule['name'],
                    'violations': violations
                })
        
        total_checks = len(schema.get('field_types', {})) + len(schema.get('consistency_rules', []))
        score = 1 - (len(inconsistencies) / total_checks) if total_checks > 0 else 1
        
        return score, {'inconsistencies': inconsistencies}, [
            f"{inc['field'] if 'field' in inc else inc['rule']}: {inc.get('type_violations', inc.get('violations', 0))} violations"
            for inc in inconsistencies
        ]
    
    def _evaluate_accuracy(self, dataset: List[Dict], 
                          schema: Dict) -> tuple:
        """使用LLM评估数据准确性"""
        
        # 采样检查
        sample_size = min(100, len(dataset))
        samples = dataset[:sample_size]
        
        # 使用规则引擎验证
        accuracy_issues = []
        correct_count = 0
        
        for record in samples:
            is_accurate = self._validate_record_accuracy(record, schema)
            if is_accurate:
                correct_count += 1
            else:
                accuracy_issues.append(f"Record {record.get('id')}: accuracy check failed")
        
        score = correct_count / sample_size
        
        return score, {'checked_samples': sample_size}, accuracy_issues[:10]
    
    def _evaluate_balance(self, dataset: List[Dict], 
                         schema: Dict) -> tuple:
        """评估类别平衡性"""
        
        label_field = schema.get('label_field')
        if not label_field:
            return 1.0, {}, []
        
        # 统计类别分布
        class_distribution = {}
        for record in dataset:
            label = record.get(label_field)
            class_distribution[label] = class_distribution.get(label, 0) + 1
        
        # 计算Gini系数或类别不平衡度
        total = len(dataset)
        proportions = [count / total for count in class_distribution.values()]
        
        # 不平衡度 = 最大比例 / 最小比例
        max_prop = max(proportions)
        min_prop = min(proportions)
        imbalance_ratio = max_prop / min_prop if min_prop > 0 else float('inf')
        
        # 分数：1表示完全平衡，越小越不平衡
        score = 1 / (1 + imbalance_ratio / 10)  # 归一化
        
        issues = []
        if imbalance_ratio > 10:
            issues.append(f"Severe class imbalance: ratio={imbalance_ratio:.2f}")
        elif imbalance_ratio > 3:
            issues.append(f"Moderate class imbalance: ratio={imbalance_ratio:.2f}")
        
        return score, {
            'class_distribution': class_distribution,
            'imbalance_ratio': imbalance_ratio
        }, issues
    
    def _check_type(self, value, expected_type: str) -> bool:
        """检查值类型"""
        type_checks = {
            'string': lambda x: isinstance(x, str),
            'integer': lambda x: isinstance(x, int),
            'float': lambda x: isinstance(x, (int, float)),
            'boolean': lambda x: isinstance(x, bool),
            'list': lambda x: isinstance(x, list),
            'dict': lambda x: isinstance(x, dict),
        }
        checker = type_checks.get(expected_type)
        return checker(value) if checker else True
    
    def _check_consistency_rule(self, dataset: List[Dict], 
                                rule: Dict) -> int:
        """检查一致性规则"""
        violations = 0
        
        for record in dataset:
            if not eval(rule['condition'], {'record': record}):
                violations += 1
        
        return violations
    
    def _validate_record_accuracy(self, record: Dict, schema: Dict) -> bool:
        """验证单条记录准确性"""
        # 实现业务规则验证
        return True  # 简化处理
```

### 1.2 质量门禁（Quality Gates）

```python
# src/quality_gates.py
from typing import List, Dict
from dataclasses import dataclass

@dataclass
class QualityGate:
    name: str
    dimension: QualityDimension
    min_score: float
    max_critical_issues: int
    auto_reject: bool = False

class QualityGatePipeline:
    """质量门禁流水线"""
    
    def __init__(self):
        self.gates: List[QualityGate] = [
            QualityGate(
                name="Critical Completeness",
                dimension=QualityDimension.COMPLETENESS,
                min_score=0.95,
                max_critical_issues=0,
                auto_reject=True
            ),
            QualityGate(
                name="Data Consistency",
                dimension=QualityDimension.CONSISTENCY,
                min_score=0.90,
                max_critical_issues=5,
                auto_reject=True
            ),
            QualityGate(
                name="Label Balance",
                dimension=QualityDimension.BALANCE,
                min_score=0.70,
                max_critical_issues=0,
                auto_reject=False  # 警告但不阻断
            ),
        ]
    
    def evaluate(self, report: DatasetQualityReport) -> Dict:
        """评估质量门禁"""
        
        results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'overall_passed': True
        }
        
        for gate in self.gates:
            # 查找对应维度的评分
            metric = next(
                (m for m in report.metrics if m.dimension == gate.dimension),
                None
            )
            
            if not metric:
                results['failed'].append({
                    'gate': gate.name,
                    'reason': f'Metric for {gate.dimension} not found'
                })
                if gate.auto_reject:
                    results['overall_passed'] = False
                continue
            
            # 检查评分
            if metric.score < gate.min_score:
                failure = {
                    'gate': gate.name,
                    'dimension': gate.dimension.value,
                    'score': metric.score,
                    'required': gate.min_score
                }
                
                if gate.auto_reject:
                    results['failed'].append(failure)
                    results['overall_passed'] = False
                else:
                    results['warnings'].append(failure)
            else:
                results['passed'].append({
                    'gate': gate.name,
                    'score': metric.score
                })
        
        return results
```

---

## 2. 自动化数据验证

### 2.1 基于LLM的数据验证

```python
# src/llm_data_validator.py
import boto3
import json
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

class LLMDataValidator:
    """使用LLM进行智能数据验证"""
    
    def __init__(self, model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"):
        self.bedrock = boto3.client('bedrock-runtime')
        self.model_id = model_id
    
    def validate_record(self, record: Dict, context: str) -> Dict:
        """验证单条记录"""
        
        prompt = f"""You are a data quality validator. Validate the following record for consistency and accuracy.

Context: {context}

Record: {json.dumps(record, indent=2)}

Check for:
1. Logical consistency (e.g., dates make sense, values in valid ranges)
2. Semantic accuracy (e.g., text fields contain meaningful content)
3. Format compliance (e.g., IDs follow expected patterns)

Output JSON:
{{
    "valid": true/false,
    "confidence": 0.0-1.0,
    "issues": ["issue description"],
    "suggestions": ["suggested fixes"]
}}"""
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "temperature": 0,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        return json.loads(result['content'][0]['text'])
    
    def batch_validate(self, records: List[Dict], 
                      context: str,
                      max_workers: int = 5) -> List[Dict]:
        """批量验证"""
        
        def validate_wrapper(record):
            return {
                'record_id': record.get('id'),
                'validation': self.validate_record(record, context)
            }
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(validate_wrapper, records))
        
        return results
    
    def validate_text_quality(self, text: str, 
                             min_length: int = 10,
                             max_length: int = 10000) -> Dict:
        """验证文本质量"""
        
        issues = []
        
        # 基本检查
        if len(text) < min_length:
            issues.append(f"Text too short: {len(text)} chars")
        
        if len(text) > max_length:
            issues.append(f"Text too long: {len(text)} chars")
        
        # 使用LLM进行质量评估
        prompt = f"""Rate the quality of the following text on a scale of 1-5:

Text: {text[:1000]}...

Criteria:
- 5: Excellent - Clear, coherent, well-structured
- 4: Good - Minor issues but usable
- 3: Fair - Some problems but salvageable
- 2: Poor - Significant issues
- 1: Unusable - Nonsensical or garbled

Output: {{"score": X, "reason": "explanation"}}"""
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 200,
                "temperature": 0,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        llm_assessment = json.loads(result['content'][0]['text'])
        
        return {
            'length': len(text),
            'llm_quality_score': llm_assessment.get('score'),
            'llm_assessment': llm_assessment.get('reason'),
            'issues': issues,
            'usable': llm_assessment.get('score', 0) >= 3 and len(issues) == 0
        }
```

### 2.2 自动化异常检测

```python
# src/anomaly_detection.py
import numpy as np
from typing import List, Dict
from scipy import stats

class DataAnomalyDetector:
    """数据异常检测器"""
    
    def __init__(self):
        self.methods = {
            'statistical': self._statistical_detection,
            'isolation_forest': self._isolation_forest_detection,
            'pattern_based': self._pattern_based_detection
        }
    
    def detect(self, dataset: List[Dict], 
               method: str = 'statistical') -> List[Dict]:
        """检测异常"""
        
        detector = self.methods.get(method, self._statistical_detection)
        return detector(dataset)
    
    def _statistical_detection(self, dataset: List[Dict]) -> List[Dict]:
        """基于统计的异常检测"""
        anomalies = []
        
        # 数值字段异常检测
        numeric_fields = self._extract_numeric_fields(dataset)
        
        for field in numeric_fields:
            values = [r[field] for r in dataset if r.get(field) is not None]
            
            if len(values) < 10:
                continue
            
            # Z-score检测
            z_scores = np.abs(stats.zscore(values))
            
            for idx, (record, z_score) in enumerate(zip(dataset, z_scores)):
                if z_score > 3:  # 3个标准差
                    anomalies.append({
                        'record_id': record.get('id', idx),
                        'field': field,
                        'value': record[field],
                        'z_score': float(z_score),
                        'method': 'z_score',
                        'severity': 'high' if z_score > 4 else 'medium'
                    })
        
        return anomalies
    
    def _pattern_based_detection(self, dataset: List[Dict]) -> List[Dict]:
        """基于模式的异常检测"""
        
        anomalies = []
        
        # 检测重复模式（可能的复制粘贴错误）
        text_fields = self._extract_text_fields(dataset)
        
        for field in text_fields:
            texts = [r[field] for r in dataset if r.get(field)]
            
            # 查找重复
            from collections import Counter
            text_counts = Counter(texts)
            
            for text, count in text_counts.items():
                if count > len(dataset) * 0.05:  # 超过5%重复
                    for record in dataset:
                        if record.get(field) == text:
                            anomalies.append({
                                'record_id': record.get('id'),
                                'field': field,
                                'issue': 'suspicious_duplicate',
                                'duplicate_count': count,
                                'severity': 'medium'
                            })
        
        return anomalies
```

---

## 3. 合成数据生成与验证

### 3.1 基于LLM的合成数据生成

```python
# src/synthetic_data_generator.py
import boto3
import json
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor

class SyntheticDataGenerator:
    """合成数据生成器"""
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        self.bedrock = boto3.client('bedrock-runtime')
        self.model_id = model_id
    
    def generate_from_schema(self, schema: Dict, 
                            count: int,
                            examples: Optional[List[Dict]] = None) -> List[Dict]:
        """基于Schema生成合成数据"""
        
        prompt = f"""Generate {count} synthetic data records following this schema:

Schema: {json.dumps(schema, indent=2)}

{"Examples: " + json.dumps(examples[:3], indent=2) if examples else ""}

Requirements:
1. Data must be realistic and diverse
2. Follow the exact field types and constraints
3. Include edge cases (nulls, empty strings, long text)
4. Maintain logical consistency across fields

Output as JSON array."""
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 4000,
                "temperature": 0.7,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        generated_text = result['content'][0]['text']
        
        # 提取JSON
        import re
        json_match = re.search(r'\[.*\]', generated_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        return []
    
    def generate_variations(self, base_record: Dict, 
                           count: int) -> List[Dict]:
        """生成记录的变体"""
        
        prompt = f"""Generate {count} variations of this record:

Base: {json.dumps(base_record, indent=2)}

Create variations that:
1. Keep the same intent/label
2. Vary wording, style, and structure
3. Include different lengths and complexity
4. Add realistic noise (typos, informal language)

Output as JSON array."""
        
        response = self.bedrock.invoke_model(
            modelId=self.model_id,
            body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 3000,
                "temperature": 0.8,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['body'].read())
        generated_text = result['content'][0]['text']
        
        import re
        json_match = re.search(r'\[.*\]', generated_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        return []
    
    def validate_synthetic_data(self, synthetic: List[Dict],
                                real_data: List[Dict]) -> Dict:
        """验证合成数据质量"""
        
        # 统计相似性检查
        stats_comparison = self._compare_statistics(synthetic, real_data)
        
        # 使用LLM评估真实性
        sample_check = self._llm_realism_check(
            synthetic[:5], 
            real_data[:5]
        )
        
        return {
            'statistical_similarity': stats_comparison,
            'realism_score': sample_check['score'],
            'issues': sample_check['issues'],
            'usable': stats_comparison > 0.8 and sample_check['score'] > 0.7
        }
    
    def _compare_statistics(self, synthetic: List[Dict], 
                           real: List[Dict]) -> float:
        """比较统计分布"""
        # 简化的分布比较
        return 0.85  # placeholder
    
    def _llm_realism_check(self, synthetic: List[Dict], 
                          real: List[Dict]) -> Dict:
        """LLM真实性检查"""
        
        prompt = f"""Compare synthetic and real data for realism:

Real samples: {json.dumps(real, indent=2)}

Synthetic samples: {json.dumps(synthetic, indent=2)}

Rate synthetic data realism (0-1) and identify any obvious synthetic artifacts.

Output: {{"score": X.XX, "issues": ["issue1", "issue2"]}}"""
        
        response = self.bedrock.invoke_model(
            ModelId=self.model_id,
            Body=json.dumps({
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": 500,
                "messages": [{"role": "user", "content": prompt}]
            })
        )
        
        result = json.loads(response['Body'].read())
        return json.loads(result['content'][0]['text'])
```

---

## 4. 数据集版本与血缘

### 4.1 数据集版本管理

```python
# src/dataset_lineage.py
import boto3
import hashlib
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class DatasetVersion:
    version_id: str
    dataset_name: str
    s3_uri: str
    format: str  # 'json', 'csv', 'parquet'
    row_count: int
    size_bytes: int
    schema_hash: str
    content_hash: str
    parent_versions: List[str]  # 血缘
    transformations: List[Dict]  # 应用的转换
    created_by: str
    created_at: str
    quality_score: Optional[float] = None
    tags: Dict[str, str] = None

class DatasetLineageTracker:
    """数据集血缘追踪器"""
    
    def __init__(self, table_name: str = "dataset-lineage"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        self.s3 = boto3.client('s3')
    
    def register_version(self, version: DatasetVersion) -> str:
        """注册新版本"""
        
        # 存储到 DynamoDB
        self.table.put_item(Item={
            'PK': f"DATASET#{version.dataset_name}",
            'SK': f"VERSION#{version.version_id}",
            **asdict(version)
        })
        
        # 更新最新版本指针
        self.table.put_item(Item={
            'PK': f"DATASET#{version.dataset_name}",
            'SK': 'LATEST',
            'version_id': version.version_id
        })
        
        return version.version_id
    
    def get_version(self, dataset_name: str, 
                   version_id: str) -> Optional[DatasetVersion]:
        """获取特定版本"""
        
        response = self.table.get_item(
            Key={
                'PK': f"DATASET#{dataset_name}",
                'SK': f"VERSION#{version_id}"
            }
        )
        
        if 'Item' in response:
            return DatasetVersion(**response['Item'])
        return None
    
    def get_lineage(self, dataset_name: str, 
                   version_id: str) -> List[DatasetVersion]:
        """获取完整血缘链"""
        
        lineage = []
        current_version = version_id
        
        while current_version:
            version = self.get_version(dataset_name, current_version)
            if not version:
                break
            
            lineage.append(version)
            
            # 获取父版本
            if version.parent_versions:
                current_version = version.parent_versions[0]  # 简化：取第一个父版本
            else:
                break
        
        return lineage
    
    def compare_versions(self, dataset_name: str,
                        v1_id: str, v2_id: str) -> Dict:
        """比较两个版本"""
        
        v1 = self.get_version(dataset_name, v1_id)
        v2 = self.get_version(dataset_name, v2_id)
        
        if not v1 or not v2:
            return {'error': 'Version not found'}
        
        return {
            'version_1': v1_id,
            'version_2': v2_id,
            'row_diff': v2.row_count - v1.row_count,
            'size_diff': v2.size_bytes - v1.size_bytes,
            'schema_changed': v1.schema_hash != v2.schema_hash,
            'transformations_v1': v1.transformations,
            'transformations_v2': v2.transformations,
            'common_ancestor': self._find_common_ancestor(v1, v2)
        }
    
    def _find_common_ancestor(self, v1: DatasetVersion, 
                             v2: DatasetVersion) -> Optional[str]:
        """查找共同祖先"""
        v1_ancestors = set(v1.parent_versions)
        v2_ancestors = set(v2.parent_versions)
        
        common = v1_ancestors & v2_ancestors
        return next(iter(common)) if common else None
```

---

## 5. CI/CD集成

### 5.1 CodeBuild 数据集验证流水线

```yaml
# buildspec-dataset-validation.yml
version: 0.2

env:
  variables:
    DATASET_BUCKET: ${DATASET_BUCKET}
    QUALITY_THRESHOLD: 0.85

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install -r requirements.txt
      - pip install pytest boto3 numpy scipy

  pre_build:
    commands:
      - echo "Downloading dataset..."
      - aws s3 cp s3://${DATASET_BUCKET}/datasets/${DATASET_NAME}/${VERSION}/ ./data/ --recursive

  build:
    commands:
      - echo "Running data quality checks..."
      - python scripts/validate_dataset.py 
          --input ./data/
          --schema schema.json
          --output quality_report.json
      
      - echo "Running anomaly detection..."
      - python scripts/detect_anomalies.py
          --input ./data/
          --output anomalies.json
      
      - echo "Generating statistics..."
      - python scripts/generate_statistics.py
          --input ./data/
          --output stats.json

  post_build:
    commands:
      - echo "Evaluating quality gates..."
      - |
        python scripts/evaluate_gates.py \
          --report quality_report.json \
          --threshold ${QUALITY_THRESHOLD}
      
      - echo "Uploading results..."
      - aws s3 cp quality_report.json s3://${DATASET_BUCKET}/reports/${DATASET_NAME}/${VERSION}/
      
      - |
        if [ $? -eq 0 ]; then
          echo "Quality gates passed"
        else
          echo "Quality gates failed"
          exit 1
        fi

reports:
  dataset-quality:
    files:
      - quality_report.json
    file-format: CUSTOMJSON

artifacts:
  files:
    - quality_report.json
    - anomalies.json
    - stats.json
```

### 5.2 Step Functions 数据流水线

```json
{
  "Comment": "Dataset Validation and Processing Pipeline",
  "StartAt": "ValidateDataQuality",
  "States": {
    "ValidateDataQuality": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:validate-quality",
      "Next": "CheckQualityGates"
    },
    "CheckQualityGates": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.quality_score",
          "NumericGreaterThanEquals": 0.85,
          "Next": "GenerateStatistics"
        }
      ],
      "Default": "NotifyQualityFailure"
    },
    "GenerateStatistics": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:generate-stats",
      "Next": "CheckForAnomalies"
    },
    "CheckForAnomalies": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:detect-anomalies",
      "Next": "AnomalyCheck"
    },
    "AnomalyCheck": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.anomaly_count",
          "NumericEquals": 0,
          "Next": "RegisterVersion"
        }
      ],
      "Default": "HumanReview"
    },
    "HumanReview": {
      "Type": "Task",
      "Resource": "arn:aws:sns:...",
      "Next": "WaitForApproval"
    },
    "WaitForApproval": {
      "Type": "Wait",
      "Seconds": 3600,
      "Next": "CheckApproval"
    },
    "CheckApproval": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:check-approval",
      "Next": "ApprovalDecision"
    },
    "ApprovalDecision": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.approved",
          "BooleanEquals": true,
          "Next": "RegisterVersion"
        }
      ],
      "Default": "RejectDataset"
    },
    "RegisterVersion": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:register-version",
      "End": true
    },
    "RejectDataset": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:...:function:reject-dataset",
      "End": true
    },
    "NotifyQualityFailure": {
      "Type": "Task",
      "Resource": "arn:aws:sns:...",
      "End": true
    }
  }
}
```

---

*Part of AI Agent DevTools Topic - Advanced*
*Part of AWS DevTools Hero Learning Path*
