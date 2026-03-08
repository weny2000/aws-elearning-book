# FinOps: Token Cost Optimization and Automation

> Enterprise LLM Cost Control and FinOps Best Practices

---

## Table of Contents

1. [Token Cost Models](#1-token-cost-models)
2. [Real-time Cost Monitoring](#2-real-time-cost-monitoring)
3. [Intelligent Cost Optimization](#3-intelligent-cost-optimization)
4. [Budgeting and Alerts](#4-budgeting-and-alerts)
5. [Cost Allocation and Attribution](#5-cost-allocation-and-attribution)

---

## 1. Token Cost Models

### 1.1 Multi-dimensional Cost Calculation

```python
# src/token_cost_calculator.py
from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum
import json

class ModelTier(Enum):
    PREMIUM = "premium"      # Claude 3 Opus, GPT-4
    STANDARD = "standard"    # Claude 3 Sonnet, GPT-3.5
    ECONOMY = "economy"      # Claude 3 Haiku, lightweight models

@dataclass
class TokenCost:
    input_tokens: int
    output_tokens: int
    model_id: str
    region: str
    request_timestamp: str

class TokenCostCalculator:
    """Token Cost Calculator"""
    
    # AWS Bedrock Pricing (per 1K tokens)
    PRICING = {
        'anthropic.claude-3-opus-20240229-v1:0': {
            'input': 0.015,
            'output': 0.075,
            'tier': ModelTier.PREMIUM
        },
        'anthropic.claude-3-sonnet-20240229-v1:0': {
            'input': 0.003,
            'output': 0.015,
            'tier': ModelTier.STANDARD
        },
        'anthropic.claude-3-haiku-20240307-v1:0': {
            'input': 0.00025,
            'output': 0.00125,
            'tier': ModelTier.ECONOMY
        },
        'amazon.titan-text-express-v1': {
            'input': 0.0008,
            'output': 0.0016,
            'tier': ModelTier.ECONOMY
        }
    }
    
    def calculate(self, token_cost: TokenCost) -> Dict:
        """Calculate cost for a single request"""
        
        pricing = self.PRICING.get(token_cost.model_id, {
            'input': 0.001,
            'output': 0.001
        })
        
        input_cost = (token_cost.input_tokens / 1000) * pricing['input']
        output_cost = (token_cost.output_tokens / 1000) * pricing['output']
        total_cost = input_cost + output_cost
        
        # Calculate cost composition ratio
        input_ratio = input_cost / total_cost if total_cost > 0 else 0
        
        return {
            'input_cost': round(input_cost, 6),
            'output_cost': round(output_cost, 6),
            'total_cost': round(total_cost, 6),
            'input_ratio': round(input_ratio, 2),
            'cost_per_token': round(total_cost / (token_cost.input_tokens + token_cost.output_tokens), 8),
            'tier': pricing.get('tier', ModelTier.STANDARD).value
        }
    
    def calculate_batch(self, requests: List[TokenCost]) -> Dict:
        """Calculate cost for batch requests"""
        
        total_input = sum(r.input_tokens for r in requests)
        total_output = sum(r.output_tokens for r in requests)
        
        # Group by model
        by_model = {}
        for req in requests:
            model = req.model_id
            if model not in by_model:
                by_model[model] = []
            by_model[model].append(req)
        
        model_breakdown = {}
        for model, reqs in by_model.items():
            model_input = sum(r.input_tokens for r in reqs)
            model_output = sum(r.output_tokens for r in reqs)
            
            cost = self.calculate(TokenCost(
                input_tokens=model_input,
                output_tokens=model_output,
                model_id=model,
                region='us-east-1',
                request_timestamp=''
            ))
            
            model_breakdown[model] = {
                'requests': len(reqs),
                'input_tokens': model_input,
                'output_tokens': model_output,
                'cost': cost['total_cost']
            }
        
        total_cost = sum(m['cost'] for m in model_breakdown.values())
        
        return {
            'summary': {
                'total_requests': len(requests),
                'total_input_tokens': total_input,
                'total_output_tokens': total_output,
                'total_cost': round(total_cost, 4),
                'avg_cost_per_request': round(total_cost / len(requests), 6) if requests else 0
            },
            'by_model': model_breakdown
        }
    
    def estimate_cost(self, prompt: str, 
                     expected_response_length: int,
                     model_id: str) -> Dict:
        """Estimate cost"""
        
        # Simple estimation: 1 token ≈ 4 characters
        input_tokens = len(prompt) // 4
        output_tokens = expected_response_length // 4
        
        return self.calculate(TokenCost(
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            model_id=model_id,
            region='us-east-1',
            request_timestamp=''
        ))
    
    def compare_models(self, prompt: str, 
                      expected_length: int) -> List[Dict]:
        """Compare costs across different models"""
        
        comparisons = []
        
        for model_id in self.PRICING.keys():
            estimate = self.estimate_cost(prompt, expected_length, model_id)
            
            comparisons.append({
                'model': model_id,
                'estimated_cost': estimate['total_cost'],
                'input_tokens': estimate.get('input_tokens', 0),
                'output_tokens': estimate.get('output_tokens', 0),
                'tier': self.PRICING[model_id]['tier'].value
            })
        
        return sorted(comparisons, key=lambda x: x['estimated_cost'])
```

### 1.2 Cost Attribution Model

```python
# src/cost_attribution.py
from typing import Dict, List
from dataclasses import dataclass
from collections import defaultdict
import json

@dataclass
class CostRecord:
    cost: float
    user_id: str
    project: str
    feature: str
    model_id: str
    timestamp: str
    metadata: Dict

class CostAttributionEngine:
    """Cost Attribution Engine"""
    
    def __init__(self):
        self.records: List[CostRecord] = []
    
    def add_record(self, record: CostRecord):
        """Add cost record"""
        self.records.append(record)
    
    def get_attribution_by_dimension(self, 
                                     dimension: str) -> Dict:
        """Attribute by dimension"""
        
        attribution = defaultdict(lambda: {
            'total_cost': 0.0,
            'total_tokens': 0,
            'request_count': 0
        })
        
        for record in self.records:
            key = getattr(record, dimension, 'unknown')
            
            attribution[key]['total_cost'] += record.cost
            attribution[key]['request_count'] += 1
            
            # Estimate token count (simplified)
            estimated_tokens = record.cost * 1000 / 0.001  # Simplified estimation
            attribution[key]['total_tokens'] += int(estimated_tokens)
        
        # Calculate percentage
        total_cost = sum(r.cost for r in self.records)
        
        for key in attribution:
            attribution[key]['cost_percentage'] = (
                attribution[key]['total_cost'] / total_cost * 100
            ) if total_cost > 0 else 0
        
        return dict(attribution)
    
    def get_cost_matrix(self) -> Dict:
        """Get cost matrix (project x model)"""
        
        matrix = defaultdict(lambda: defaultdict(float))
        
        for record in self.records:
            matrix[record.project][record.model_id] += record.cost
        
        return {
            'projects': list(matrix.keys()),
            'models': list(set(r.model_id for r in self.records)),
            'matrix': {p: dict(m) for p, m in matrix.items()}
        }
    
    def get_feature_cost_breakdown(self, project: str) -> Dict:
        """Get feature cost breakdown"""
        
        feature_costs = defaultdict(lambda: {
            'cost': 0.0,
            'calls': 0
        })
        
        for record in self.records:
            if record.project == project:
                feature_costs[record.feature]['cost'] += record.cost
                feature_costs[record.feature]['calls'] += 1
        
        # Calculate average cost per feature
        for feature in feature_costs:
            calls = feature_costs[feature]['calls']
            feature_costs[feature]['avg_cost_per_call'] = (
                feature_costs[feature]['cost'] / calls if calls > 0 else 0
            )
        
        return dict(feature_costs)
```

---

## 2. Real-time Cost Monitoring

### 2.1 CloudWatch Cost Metrics

```python
# src/cost_monitoring.py
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, List

class RealTimeCostMonitor:
    """Real-time Cost Monitor"""
    
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.logs = boto3.client('logs')
    
    def emit_cost_metric(self, token_cost: TokenCost, 
                        calculated_cost: Dict):
        """Send cost metrics to CloudWatch"""
        
        timestamp = datetime.utcnow()
        
        metrics = [
            {
                'MetricName': 'LLMCost',
                'Value': calculated_cost['total_cost'],
                'Unit': 'None',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'ModelId', 'Value': token_cost.model_id},
                    {'Name': 'Region', 'Value': token_cost.region}
                ]
            },
            {
                'MetricName': 'InputTokens',
                'Value': token_cost.input_tokens,
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'ModelId', 'Value': token_cost.model_id}
                ]
            },
            {
                'MetricName': 'OutputTokens',
                'Value': token_cost.output_tokens,
                'Unit': 'Count',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'ModelId', 'Value': token_cost.model_id}
                ]
            },
            {
                'MetricName': 'CostPer1KTokens',
                'Value': calculated_cost['cost_per_token'] * 1000,
                'Unit': 'None',
                'Timestamp': timestamp,
                'Dimensions': [
                    {'Name': 'ModelId', 'Value': token_cost.model_id}
                ]
            }
        ]
        
        self.cloudwatch.put_metric_data(
            Namespace='LLM/Cost',
            MetricData=metrics
        )
    
    def get_cost_dashboard_data(self, 
                                hours: int = 24) -> Dict:
        """Get dashboard data"""
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours)
        
        # Get cost metrics
        response = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Cost',
            MetricName='LLMCost',
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1-hour granularity
            Statistics=['Sum', 'Average']
        )
        
        datapoints = sorted(response['Datapoints'], 
                           key=lambda x: x['Timestamp'])
        
        # Calculate statistics
        total_cost = sum(dp['Sum'] for dp in datapoints)
        avg_hourly = total_cost / len(datapoints) if datapoints else 0
        
        return {
            'period_hours': hours,
            'total_cost': round(total_cost, 4),
            'average_hourly': round(avg_hourly, 4),
            'trend': self._calculate_trend(datapoints),
            'hourly_breakdown': [
                {
                    'hour': dp['Timestamp'].isoformat(),
                    'cost': round(dp['Sum'], 4)
                }
                for dp in datapoints
            ]
        }
    
    def _calculate_trend(self, datapoints: List[Dict]) -> str:
        """Calculate trend"""
        
        if len(datapoints) < 2:
            return 'stable'
        
        first_half = sum(dp['Sum'] for dp in datapoints[:len(datapoints)//2])
        second_half = sum(dp['Sum'] for dp in datapoints[len(datapoints)//2:])
        
        if second_half > first_half * 1.2:
            return 'increasing'
        elif second_half < first_half * 0.8:
            return 'decreasing'
        
        return 'stable'
    
    def detect_cost_anomalies(self, 
                             window_hours: int = 1) -> List[Dict]:
        """Detect cost anomalies"""
        
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=24)  # Compare with 24-hour history
        
        # Get historical data
        history = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Cost',
            MetricName='LLMCost',
            StartTime=start_time,
            EndTime=end_time - timedelta(hours=window_hours),
            Period=3600,
            Statistics=['Sum']
        )
        
        # Get recent data
        recent = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Cost',
            MetricName='LLMCost',
            StartTime=end_time - timedelta(hours=window_hours),
            EndTime=end_time,
            Period=3600,
            Statistics=['Sum']
        )
        
        if not history['Datapoints'] or not recent['Datapoints']:
            return []
        
        # Calculate statistics
        historical_values = [dp['Sum'] for dp in history['Datapoints']]
        mean = sum(historical_values) / len(historical_values)
        variance = sum((x - mean) ** 2 for x in historical_values) / len(historical_values)
        std_dev = variance ** 0.5
        
        anomalies = []
        
        for dp in recent['Datapoints']:
            value = dp['Sum']
            z_score = (value - mean) / std_dev if std_dev > 0 else 0
            
            if z_score > 3:  # 3 sigma
                anomalies.append({
                    'timestamp': dp['Timestamp'].isoformat(),
                    'cost': value,
                    'z_score': round(z_score, 2),
                    'expected_range': [mean - 2*std_dev, mean + 2*std_dev],
                    'severity': 'critical' if z_score > 4 else 'warning'
                })
        
        return anomalies
```

### 2.2 Cost Log Analysis

```python
# src/cost_log_analyzer.py
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, List

class CostLogAnalyzer:
    """Cost Log Analyzer"""
    
    def __init__(self, log_group: str = '/aws/bedrock/cost'):
        self.logs = boto3.client('logs')
        self.log_group = log_group
    
    def analyze_usage_patterns(self, hours: int = 24) -> Dict:
        """Analyze usage patterns"""
        
        # Query logs
        query = f"""
        fields @timestamp, modelId, inputTokens, outputTokens, cost
        | filter @message like /cost/
        | stats 
            count() as requestCount,
            sum(inputTokens) as totalInputTokens,
            sum(outputTokens) as totalOutputTokens,
            sum(cost) as totalCost
          by bin(1h), modelId
        | sort @timestamp desc
        """
        
        start_query = self.logs.start_query(
            logGroupName=self.log_group,
            startTime=int((datetime.utcnow() - timedelta(hours=hours)).timestamp()),
            endTime=int(datetime.utcnow().timestamp()),
            queryString=query
        )
        
        query_id = start_query['queryId']
        
        # Wait for query to complete
        import time
        while True:
            response = self.logs.get_query_results(queryId=query_id)
            if response['status'] in ['Complete', 'Failed', 'Cancelled']:
                break
            time.sleep(1)
        
        # Analyze results
        results = response.get('results', [])
        
        # Extract patterns
        patterns = {
            'peak_hours': self._find_peak_hours(results),
            'most_expensive_models': self._find_expensive_models(results),
            'token_efficiency': self._calculate_efficiency(results)
        }
        
        return patterns
    
    def _find_peak_hours(self, results: List[Dict]) -> List[Dict]:
        """Find peak hours"""
        
        hourly_costs = defaultdict(float)
        
        for result in results:
            timestamp = result.get('@timestamp', '')
            hour = timestamp.split(':')[0] if timestamp else 'unknown'
            
            cost_field = next((f for f in result if f['field'] == 'totalCost'), None)
            if cost_field:
                hourly_costs[hour] += float(cost_field['value'])
        
        # Sort to find peaks
        sorted_hours = sorted(hourly_costs.items(), 
                             key=lambda x: x[1], 
                             reverse=True)
        
        return [
            {'hour': hour, 'cost': round(cost, 4)}
            for hour, cost in sorted_hours[:5]
        ]
    
    def _calculate_efficiency(self, results: List[Dict]) -> Dict:
        """Calculate Token efficiency"""
        
        total_input = 0
        total_output = 0
        total_cost = 0.0
        
        for result in results:
            for field in result:
                if field['field'] == 'totalInputTokens':
                    total_input += int(field['value'])
                elif field['field'] == 'totalOutputTokens':
                    total_output += int(field['value'])
                elif field['field'] == 'totalCost':
                    total_cost += float(field['value'])
        
        total_tokens = total_input + total_output
        
        return {
            'input_output_ratio': round(total_input / total_output, 2) if total_output > 0 else 0,
            'cost_per_1k_tokens': round(total_cost / (total_tokens / 1000), 6) if total_tokens > 0 else 0,
            'total_tokens': total_tokens,
            'total_cost': round(total_cost, 4)
        }
```

---

## 3. Intelligent Cost Optimization

### 3.1 Dynamic Model Selection

```python
# src/dynamic_model_selection.py
import boto3
import json
from typing import Dict, Optional
from enum import Enum

class QueryComplexity(Enum):
    SIMPLE = 1      # Simple Q&A
    STANDARD = 2    # Standard reasoning
    COMPLEX = 3     # Complex analysis

class SmartModelRouter:
    """Smart Model Router"""
    
    def __init__(self):
        self.bedrock = boto3.client('bedrock-runtime')
        self.calculator = TokenCostCalculator()
    
    def route(self, query: str, 
             context: Optional[str] = None,
             max_budget: Optional[float] = None) -> Dict:
        """Intelligently route to the most suitable model"""
        
        # 1. Analyze query complexity
        complexity = self._analyze_complexity(query, context)
        
        # 2. Estimate costs for each model
        estimated_length = self._estimate_response_length(query, complexity)
        
        cost_estimates = {}
        for model_id in self.calculator.PRICING.keys():
            cost_estimates[model_id] = self.calculator.estimate_cost(
                query + (context or ''),
                estimated_length,
                model_id
            )
        
        # 3. Select based on complexity and budget
        selected_model = self._select_model(
            complexity, 
            cost_estimates,
            max_budget
        )
        
        return {
            'selected_model': selected_model,
            'complexity': complexity.name,
            'estimated_cost': cost_estimates[selected_model],
            'alternatives': [
                {'model': m, 'cost': c}
                for m, c in cost_estimates.items()
                if m != selected_model
            ]
        }
    
    def _analyze_complexity(self, query: str, 
                           context: Optional[str]) -> QueryComplexity:
        """Analyze query complexity"""
        
        # Heuristic rules
        complexity_score = 0
        
        # Length
        query_length = len(query.split())
        if query_length > 50:
            complexity_score += 2
        elif query_length > 20:
            complexity_score += 1
        
        # Keywords
        complex_indicators = [
            'explain', 'analyze', 'compare', 'evaluate',
            'synthesize', 'reason', 'deduce', 'calculate',
            'step by step', 'detailed', 'comprehensive'
        ]
        
        for indicator in complex_indicators:
            if indicator in query.lower():
                complexity_score += 1
                break
        
        # Context complexity
        if context:
            context_length = len(context.split())
            if context_length > 500:
                complexity_score += 1
        
        # Map to complexity level
        if complexity_score >= 3:
            return QueryComplexity.COMPLEX
        elif complexity_score >= 1:
            return QueryComplexity.STANDARD
        
        return QueryComplexity.SIMPLE
    
    def _estimate_response_length(self, query: str, 
                                  complexity: QueryComplexity) -> int:
        """Estimate response length"""
        
        base_lengths = {
            QueryComplexity.SIMPLE: 200,
            QueryComplexity.STANDARD: 500,
            QueryComplexity.COMPLEX: 1000
        }
        
        # Adjust based on query length
        query_factor = min(len(query) / 100, 2)  # Max 2x
        
        return int(base_lengths[complexity] * query_factor)
    
    def _select_model(self, complexity: QueryComplexity,
                     cost_estimates: Dict,
                     max_budget: Optional[float]) -> str:
        """Select model"""
        
        # Complexity to model mapping
        complexity_mapping = {
            QueryComplexity.SIMPLE: [
                'anthropic.claude-3-haiku-20240307-v1:0',
                'amazon.titan-text-express-v1'
            ],
            QueryComplexity.STANDARD: [
                'anthropic.claude-3-sonnet-20240229-v1:0'
            ],
            QueryComplexity.COMPLEX: [
                'anthropic.claude-3-opus-20240229-v1:0',
                'anthropic.claude-3-sonnet-20240229-v1:0'
            ]
        }
        
        candidates = complexity_mapping[complexity]
        
        # Select lowest cost among candidates
        valid_candidates = [
            (model, cost_estimates[model])
            for model in candidates
            if model in cost_estimates
        ]
        
        if max_budget:
            valid_candidates = [
                (m, c) for m, c in valid_candidates
                if c['total_cost'] <= max_budget
            ]
        
        if not valid_candidates:
            # Fallback to cheapest
            return min(cost_estimates.items(), 
                      key=lambda x: x[1]['total_cost'])[0]
        
        return min(valid_candidates, key=lambda x: x[1]['total_cost'])[0]
```

### 3.2 Token Compression and Truncation

```python
# src/token_optimizer.py
import re
from typing import Dict, List, Optional

class TokenOptimizer:
    """Token Optimizer"""
    
    def optimize_context(self, context: str, 
                        max_tokens: int = 2000) -> str:
        """Optimize context to save Tokens"""
        
        # 1. Remove redundant whitespace
        optimized = re.sub(r'\s+', ' ', context)
        
        # 2. Remove stop words (preserve meaning)
        optimized = self._remove_stop_words(optimized)
        
        # 3. If still too long, perform smart truncation
        current_tokens = len(optimized) // 4  # Rough estimation
        
        if current_tokens > max_tokens:
            optimized = self._smart_truncate(optimized, max_tokens)
        
        return optimized
    
    def _remove_stop_words(self, text: str) -> str:
        """Remove stop words"""
        
        stop_words = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were',
            'be', 'been', 'being', 'have', 'has', 'had',
            'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'shall',
            'can', 'need', 'dare', 'ought', 'used'
        }
        
        words = text.split()
        filtered = [w for w in words if w.lower() not in stop_words]
        
        return ' '.join(filtered)
    
    def _smart_truncate(self, text: str, 
                       max_tokens: int) -> str:
        """Smart text truncation"""
        
        # Split text into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text)
        
        # Keep most important sentences (beginning and end are usually most important)
        selected = []
        
        # Keep first 30%
        beginning = sentences[:max(1, len(sentences) // 3)]
        
        # Keep last 20%
        end = sentences[-max(1, len(sentences) // 5):]
        
        selected = beginning + ['...'] + end
        
        result = ' '.join(selected)
        
        # Ensure within limit
        while len(result) // 4 > max_tokens and len(selected) > 2:
            # Remove middle sentences
            mid = len(selected) // 2
            selected = selected[:mid] + selected[mid+1:]
            result = ' '.join(selected)
        
        return result
    
    def compress_prompt(self, prompt: str) -> str:
        """Compress prompt"""
        
        # Remove comments
        prompt = re.sub(r'#.*$', '', prompt, flags=re.MULTILINE)
        
        # Simplify instructions
        replacements = {
            'Please provide a detailed explanation of': 'Explain',
            'I would like you to': '',
            'Could you please': '',
            'It would be great if you could': '',
        }
        
        for old, new in replacements.items():
            prompt = prompt.replace(old, new)
        
        # Remove extra whitespace
        prompt = re.sub(r'\n\n+', '\n\n', prompt)
        prompt = re.sub(r'  +', ' ', prompt)
        
        return prompt.strip()


class CachingStrategy:
    """Caching Strategy"""
    
    def __init__(self):
        self.cache = {}
    
    def get_cache_key(self, query: str, 
                     model_id: str) -> str:
        """Generate cache key"""
        import hashlib
        content = f"{model_id}:{query}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def should_cache(self, query: str) -> bool:
        """Determine if should cache"""
        
        # Cache common queries
        cacheable_patterns = [
            r'^what is',  # Definition queries
            r'^how to',   # How-to queries
            r'^explain',  # Explanation queries
        ]
        
        return any(re.match(pattern, query, re.I) 
                  for pattern in cacheable_patterns)
```

---

## 4. Budgeting and Alerts

### 4.1 Budget Management

```python
# src/budget_management.py
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, Optional
from dataclasses import dataclass

@dataclass
class BudgetConfig:
    daily_limit: float
    monthly_limit: float
    alert_thresholds: list  # [0.5, 0.8, 0.95]
    alert_sns_topic: str

class BudgetManager:
    """Budget Manager"""
    
    def __init__(self, config: BudgetConfig):
        self.config = config
        self.cloudwatch = boto3.client('cloudwatch')
        self.sns = boto3.client('sns')
        self.dynamodb = boto3.resource('dynamodb')
        self.budget_table = self.dynamodb.Table('llm-budgets')
    
    def check_budget(self, current_cost: float) -> Dict:
        """Check budget status"""
        
        # Get today's spend
        spent_today = self._get_today_spend()
        spent_month = self._get_month_spend()
        
        status = {
            'daily': {
                'spent': spent_today,
                'limit': self.config.daily_limit,
                'remaining': self.config.daily_limit - spent_today,
                'percentage': (spent_today / self.config.daily_limit * 100) 
                             if self.config.daily_limit > 0 else 0
            },
            'monthly': {
                'spent': spent_month,
                'limit': self.config.monthly_limit,
                'remaining': self.config.monthly_limit - spent_month,
                'percentage': (spent_month / self.config.monthly_limit * 100)
                             if self.config.monthly_limit > 0 else 0
            }
        }
        
        # Check threshold alerts
        alerts = []
        for threshold in self.config.alert_thresholds:
            if status['daily']['percentage'] >= threshold * 100:
                alerts.append({
                    'type': 'daily',
                    'threshold': threshold,
                    'message': f'Daily budget {threshold*100}% exceeded'
                })
            
            if status['monthly']['percentage'] >= threshold * 100:
                alerts.append({
                    'type': 'monthly',
                    'threshold': threshold,
                    'message': f'Monthly budget {threshold*100}% exceeded'
                })
        
        status['alerts'] = alerts
        status['should_block'] = (
            status['daily']['percentage'] >= 100 or
            status['monthly']['percentage'] >= 100
        )
        
        # Send alerts
        for alert in alerts:
            self._send_alert(alert)
        
        return status
    
    def _get_today_spend(self) -> float:
        """Get today's spend"""
        
        today = datetime.utcnow().replace(hour=0, minute=0, second=0)
        
        response = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Cost',
            MetricName='LLMCost',
            StartTime=today,
            EndTime=datetime.utcnow(),
            Period=86400,
            Statistics=['Sum']
        )
        
        if response['Datapoints']:
            return sum(dp['Sum'] for dp in response['Datapoints'])
        
        return 0.0
    
    def _get_month_spend(self) -> float:
        """Get this month's spend"""
        
        today = datetime.utcnow()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0)
        
        response = self.cloudwatch.get_metric_statistics(
            Namespace='LLM/Cost',
            MetricName='LLMCost',
            StartTime=start_of_month,
            EndTime=today,
            Period=86400,
            Statistics=['Sum']
        )
        
        if response['Datapoints']:
            return sum(dp['Sum'] for dp in response['Datapoints'])
        
        return 0.0
    
    def _send_alert(self, alert: Dict):
        """Send alert"""
        
        message = f"""
LLM Budget Alert

{alert['message']}
Time: {datetime.utcnow().isoformat()}
Threshold: {alert['threshold']*100}%

Please review your LLM usage.
"""
        
        self.sns.publish(
            TopicArn=self.config.alert_sns_topic,
            Subject='LLM Budget Alert',
            Message=message
        )
    
    def forecast_monthly_spend(self) -> Dict:
        """Forecast monthly spend"""
        
        today = datetime.utcnow()
        days_in_month = 30  # Simplified
        days_elapsed = today.day
        
        spent_so_far = self._get_month_spend()
        daily_average = spent_so_far / days_elapsed if days_elapsed > 0 else 0
        
        forecast = daily_average * days_in_month
        
        return {
            'spent_so_far': round(spent_so_far, 4),
            'daily_average': round(daily_average, 4),
            'forecast': round(forecast, 4),
            'budget': self.config.monthly_limit,
            'projected_overage': max(0, forecast - self.config.monthly_limit),
            'risk_level': 'high' if forecast > self.config.monthly_limit * 1.2 else
                         'medium' if forecast > self.config.monthly_limit else
                         'low'
        }
```

---

## 5. Cost Allocation and Attribution

### 5.1 Multi-tenant Cost Allocation

```python
# src/multi_tenant_cost_allocation.py
from typing import Dict, List
from collections import defaultdict
import json

class MultiTenantCostAllocator:
    """Multi-tenant Cost Allocator"""
    
    def __init__(self):
        self.allocations = defaultdict(lambda: {
            'cost': 0.0,
            'tokens': 0,
            'requests': 0
        })
    
    def record_usage(self, tenant_id: str, 
                    user_id: str,
                    feature: str,
                    cost: float,
                    tokens: int):
        """Record usage"""
        
        # By tenant
        self.allocations[f"tenant:{tenant_id}"]['cost'] += cost
        self.allocations[f"tenant:{tenant_id}"]['tokens'] += tokens
        self.allocations[f"tenant:{tenant_id}"]['requests'] += 1
        
        # By user
        self.allocations[f"user:{user_id}"]['cost'] += cost
        self.allocations[f"user:{user_id}"]['tokens'] += tokens
        self.allocations[f"user:{user_id}"]['requests'] += 1
        
        # By feature
        self.allocations[f"feature:{feature}"]['cost'] += cost
        self.allocations[f"feature:{feature}"]['tokens'] += tokens
        self.allocations[f"feature:{feature}"]['requests'] += 1
    
    def generate_billing_report(self, period: str) -> Dict:
        """Generate billing report"""
        
        report = {
            'period': period,
            'generated_at': datetime.utcnow().isoformat(),
            'by_tenant': {},
            'by_feature': {},
            'total': {
                'cost': 0.0,
                'tokens': 0,
                'requests': 0
            }
        }
        
        for key, data in self.allocations.items():
            if key.startswith('tenant:'):
                tenant_id = key.split(':')[1]
                report['by_tenant'][tenant_id] = data
            elif key.startswith('feature:'):
                feature = key.split(':')[1]
                report['by_feature'][feature] = data
            
            report['total']['cost'] += data['cost']
            report['total']['tokens'] += data['tokens']
            report['total']['requests'] += data['requests']
        
        return report
    
    def calculate_unit_economics(self, tenant_id: str) -> Dict:
        """Calculate unit economics"""
        
        tenant_data = self.allocations.get(f"tenant:{tenant_id}", {})
        
        cost = tenant_data.get('cost', 0)
        tokens = tenant_data.get('tokens', 0)
        requests = tenant_data.get('requests', 0)
        
        return {
            'tenant_id': tenant_id,
            'cost_per_request': round(cost / requests, 6) if requests > 0 else 0,
            'cost_per_1k_tokens': round(cost / (tokens / 1000), 6) if tokens > 0 else 0,
            'tokens_per_request': round(tokens / requests, 2) if requests > 0 else 0,
            'total_cost': round(cost, 4)
        }
```

---

*Part of AI Agent DevTools Topic - Advanced*
*Part of AWS DevTools Hero Learning Path*
