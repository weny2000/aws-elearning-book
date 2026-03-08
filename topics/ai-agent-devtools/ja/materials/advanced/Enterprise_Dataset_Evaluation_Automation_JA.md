# エンタープライズデータセット評価の自動化

> スケーラブルで再現可能なAIデータセット品質評価パイプラインの構築

---

## 目次

1. [データセット品質フレームワーク](#1-データセット品質フレームワーク)
2. [自動化データ検証](#2-自動化データ検証)
3. [合成データ生成と検証](#3-合成データ生成と検証)
4. [データセットバージョン管理とリネージ](#4-データセットバージョン管理とリネージ)
5. [CI/CD統合](#5-cicd統合)

---

## 1. データセット品質フレームワーク

### 1.1 多次元品質評価体系

```python
# src/dataset_quality_framework.py
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Callable
from enum import Enum
import json
import hashlib
from datetime import datetime

class QualityDimension(Enum):
    COMPLETENESS = "completeness"      # 完全性
    CONSISTENCY = "consistency"        # 一貫性
    ACCURACY = "accuracy"              # 正確性
    TIMELINESS = "timeliness"          # タイムリネス
    VALIDITY = "validity"              # 有効性
    UNIQUENESS = "uniqueness"          # 一意性
    BALANCE = "balance"                # バランス性（クラス分布）

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
    """データセット品質評価エンジン"""
    
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
        """完全な品質評価を実行します"""
        
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
        
        # データセットIDの生成
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
        """データ完全性を評価します"""
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
            if count / len(dataset) > 0.1:  # 欠損率>10%
                issues.append(f"Field '{field}' has {count}/{len(dataset)} missing values")
        
        return score, {'missing_by_field': missing_by_field}, issues
    
    def _evaluate_consistency(self, dataset: List[Dict], 
                              schema: Dict) -> tuple:
        """データ一貫性を評価します"""
        inconsistencies = []
        
        # タイプ一貫性のチェック
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
        
        # クロスフィールド一貫性ルールのチェック
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
        """LLMを使用してデータ正確性を評価します"""
        
        # サンプリングチェック
        sample_size = min(100, len(dataset))
        samples = dataset[:sample_size]
        
        # ルールエンジンによる検証
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
        """クラスバランス性を評価します"""
        
        label_field = schema.get('label_field')
        if not label_field:
            return 1.0, {}, []
        
        # クラス分布の統計
        class_distribution = {}
        for record in dataset:
            label = record.get(label_field)
            class_distribution[label] = class_distribution.get(label, 0) + 1
        
        # ジニ係数またはクラス不均衡度の計算
        total = len(dataset)
        proportions = [count / total for count in class_distribution.values()]
        
        # 不均衡度 = 最大比率 / 最小比率
        max_prop = max(proportions)
        min_prop = min(proportions)
        imbalance_ratio = max_prop / min_prop if min_prop > 0 else float('inf')
        
        # スコア：1は完全にバランス、小さいほど不均衡
        score = 1 / (1 + imbalance_ratio / 10)  # 正規化
        
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
        """値のタイプをチェックします"""
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
        """一貫性ルールをチェックします"""
        violations = 0
        
        for record in dataset:
            if not eval(rule['condition'], {'record': record}):
                violations += 1
        
        return violations
    
    def _validate_record_accuracy(self, record: Dict, schema: Dict) -> bool:
        """単一レコードの正確性を検証します"""
        # ビジネスルール検証の実装
        return True  # 簡略化
```

### 1.2 品質ゲート（Quality Gates）

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
    """品質ゲートパイプライン"""
    
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
                auto_reject=False  # 警告のみでブロックしない
            ),
        ]
    
    def evaluate(self, report: DatasetQualityReport) -> Dict:
        """品質ゲートを評価します"""
        
        results = {
            'passed': [],
            'failed': [],
            'warnings': [],
            'overall_passed': True
        }
        
        for gate in self.gates:
            # 対応する次元のスコアを検索
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
            
            # スコアのチェック
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

## 2. 自動化データ検証

### 2.1 LLMベースのデータ検証

```python
# src/llm_data_validator.py
import boto3
import json
from typing import Dict, List
from concurrent.futures import ThreadPoolExecutor

class LLMDataValidator:
    """LLMを使用したインテリジェントデータ検証"""
    
    def __init__(self, model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"):
        self.bedrock = boto3.client('bedrock-runtime')
        self.model_id = model_id
    
    def validate_record(self, record: Dict, context: str) -> Dict:
        """単一レコードを検証します"""
        
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
        """バッチ検証"""
        
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
        """テキスト品質を検証します"""
        
        issues = []
        
        # 基本チェック
        if len(text) < min_length:
            issues.append(f"Text too short: {len(text)} chars")
        
        if len(text) > max_length:
            issues.append(f"Text too long: {len(text)} chars")
        
        # LLMによる品質評価
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

### 2.2 自動化異常検知

```python
# src/anomaly_detection.py
import numpy as np
from typing import List, Dict
from scipy import stats

class DataAnomalyDetector:
    """データ異常検知器"""
    
    def __init__(self):
        self.methods = {
            'statistical': self._statistical_detection,
            'isolation_forest': self._isolation_forest_detection,
            'pattern_based': self._pattern_based_detection
        }
    
    def detect(self, dataset: List[Dict], 
               method: str = 'statistical') -> List[Dict]:
        """異常を検知します"""
        
        detector = self.methods.get(method, self._statistical_detection)
        return detector(dataset)
    
    def _statistical_detection(self, dataset: List[Dict]) -> List[Dict]:
        """統計ベースの異常検知"""
        anomalies = []
        
        # 数値フィールドの異常検知
        numeric_fields = self._extract_numeric_fields(dataset)
        
        for field in numeric_fields:
            values = [r[field] for r in dataset if r.get(field) is not None]
            
            if len(values) < 10:
                continue
            
            # Z-score検知
            z_scores = np.abs(stats.zscore(values))
            
            for idx, (record, z_score) in enumerate(zip(dataset, z_scores)):
                if z_score > 3:  # 3標準偏差
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
        """パターンベースの異常検知"""
        
        anomalies = []
        
        # 重複パターンの検知（コピーペーストエラーの可能性）
        text_fields = self._extract_text_fields(dataset)
        
        for field in text_fields:
            texts = [r[field] for r in dataset if r.get(field)]
            
            # 重複の検索
            from collections import Counter
            text_counts = Counter(texts)
            
            for text, count in text_counts.items():
                if count > len(dataset) * 0.05:  # 5%以上重複
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

## 3. 合成データ生成と検証

### 3.1 LLMベースの合成データ生成

```python
# src/synthetic_data_generator.py
import boto3
import json
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor

class SyntheticDataGenerator:
    """合成データ生成器"""
    
    def __init__(self, model_id: str = "anthropic.claude-3-sonnet-20240229-v1:0"):
        self.bedrock = boto3.client('bedrock-runtime')
        self.model_id = model_id
    
    def generate_from_schema(self, schema: Dict, 
                            count: int,
                            examples: Optional[List[Dict]] = None) -> List[Dict]:
        """Schemaベースで合成データを生成します"""
        
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
        
        # JSONの抽出
        import re
        json_match = re.search(r'\[.*\]', generated_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        
        return []
    
    def generate_variations(self, base_record: Dict, 
                           count: int) -> List[Dict]:
        """レコードのバリエーションを生成します"""
        
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
        """合成データ品質を検証します"""
        
        # 統計的類似性チェック
        stats_comparison = self._compare_statistics(synthetic, real_data)
        
        # LLMによるリアリズム評価
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
        """統計分布を比較します"""
        # 簡略化された分布比較
        return 0.85  # placeholder
    
    def _llm_realism_check(self, synthetic: List[Dict], 
                          real: List[Dict]) -> Dict:
        """LLMリアリズムチェック"""
        
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

## 4. データセットバージョン管理とリネージ

### 4.1 データセットバージョン管理

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
    parent_versions: List[str]  # リネージ
    transformations: List[Dict]  # 適用された変換
    created_by: str
    created_at: str
    quality_score: Optional[float] = None
    tags: Dict[str, str] = None

class DatasetLineageTracker:
    """データセットリネージトラッカー"""
    
    def __init__(self, table_name: str = "dataset-lineage"):
        self.dynamodb = boto3.resource('dynamodb')
        self.table = self.dynamodb.Table(table_name)
        self.s3 = boto3.client('s3')
    
    def register_version(self, version: DatasetVersion) -> str:
        """新しいバージョンを登録します"""
        
        # DynamoDBへの保存
        self.table.put_item(Item={
            'PK': f"DATASET#{version.dataset_name}",
            'SK': f"VERSION#{version.version_id}",
            **asdict(version)
        })
        
        # 最新バージョンポインタの更新
        self.table.put_item(Item={
            'PK': f"DATASET#{version.dataset_name}",
            'SK': 'LATEST',
            'version_id': version.version_id
        })
        
        return version.version_id
    
    def get_version(self, dataset_name: str, 
                   version_id: str) -> Optional[DatasetVersion]:
        """特定のバージョンを取得します"""
        
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
        """完全なリネージチェーンを取得します"""
        
        lineage = []
        current_version = version_id
        
        while current_version:
            version = self.get_version(dataset_name, current_version)
            if not version:
                break
            
            lineage.append(version)
            
            # 親バージョンの取得
            if version.parent_versions:
                current_version = version.parent_versions[0]  # 簡略化：最初の親バージョンを取得
            else:
                break
        
        return lineage
    
    def compare_versions(self, dataset_name: str,
                        v1_id: str, v2_id: str) -> Dict:
        """2つのバージョンを比較します"""
        
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
        """共通祖先を検索します"""
        v1_ancestors = set(v1.parent_versions)
        v2_ancestors = set(v2.parent_versions)
        
        common = v1_ancestors & v2_ancestors
        return next(iter(common)) if common else None
```

---

## 5. CI/CD統合

### 5.1 CodeBuild データセット検証パイプライン

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

### 5.2 Step Functions データパイプライン

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

*AI Agent DevTools トピック - アドバンスドの一部*
*AWS DevTools Hero ラーニングパスの一部*
