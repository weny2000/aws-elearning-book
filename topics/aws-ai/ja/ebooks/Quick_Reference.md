# AWS AI/ML クイックリファレンス

> よく使用するコマンドと設定の早見表

---

## 🚀 Bedrock API リファレンス

### モデル呼び出し

```python
import boto3
import json

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# 基本的な呼び出し
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    body=json.dumps({
        'messages': [{'role': 'user', 'content': 'Hello'}],
        'max_tokens': 256,
        'anthropic_version': 'bedrock-2023-05-31'
    })
)

# ストリーミングレスポンス
response = bedrock.invoke_model_with_response_stream(
    modelId='amazon.nova-pro-v1:0',
    body=json.dumps({'inputText': 'Explain AI'})
)
```

### モデル ID 一覧

| プロバイダー | モデル | モデル ID |
|------------|--------|----------|
| Anthropic | Claude 3.5 Sonnet | `anthropic.claude-3-5-sonnet-20240620-v1:0` |
| Anthropic | Claude 3 Haiku | `anthropic.claude-3-haiku-20240307-v1:0` |
| Amazon | Nova Pro | `amazon.nova-pro-v1:0` |
| Amazon | Nova Lite | `amazon.nova-lite-v1:0` |
| Meta | Llama 3 70B | `meta.llama3-70b-instruct-v1:0` |
| Mistral | Mistral Large | `mistral.mistral-large-2402-v1:0` |

---

## 📝 プロンプトテンプレート

### システムプロンプト

```python
SYSTEM_PROMPT = """あなたはプロフェッショナルなアシスタントです。
以下の原則に従ってください:
- 簡潔で明確な回答を提供する
- 専門用語は分かりやすく説明する
- 不確実な情報は正直に伝える
- 日本語で回答する"""
```

### Few-Shot プロンプティング

```python
few_shot_prompt = """
以下は顧客からの問い合わせと適切な対応例です:

問い合わせ: 注文の状態を確認したいです
対応: 注文番号を教えていただければ、現在のステータスを確認いたします。

問い合わせ: 返品はできますか？
対応: はい、購入から30日以内であれば返品可能です。返品理由をお聞かせください。

問い合わせ: {user_query}
対応:
"""
```

---

## 🔧 Knowledge Base 設定

### CLI コマンド

```bash
# ナレッジベースの作成
aws bedrock-agent create-knowledge-base \
    --name customer-support-kb \
    --description "カスタマーサポート用ナレッジベース" \
    --role-arn arn:aws:iam::account:role/BedrockKnowledgeBaseRole \
    --knowledge-base-configuration '{"type":"VECTOR","vectorKnowledgeBaseConfiguration":{"embeddingModelArn":"arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"}}'

# データソースの作成
aws bedrock-agent create-data-source \
    --knowledge-base-id $KB_ID \
    --name s3-documents \
    --data-source-configuration '{"type":"S3","s3Configuration":{"bucketArn":"arn:aws:s3:::my-knowledge-base"}}'

# データの同期
aws bedrock-agent start-ingestion-job \
    --knowledge-base-id $KB_ID \
    --data-source-id $DS_ID
```

---

## 🤖 Agents 設定

### エージェント作成

```bash
# エージェントの作成
aws bedrock-agent create-agent \
    --agent-name customer-support-agent \
    --description "カスタマーサポートエージェント" \
    --idle-session-ttl-in-seconds 1800 \
    --instruction "あなたは親切なカスタマーサポートアシスタントです。" \
    --foundation-model anthropic.claude-3-sonnet-20240229-v1:0

# アクショングループの作成
aws bedrock-agent create-agent-action-group \
    --agent-id $AGENT_ID \
    --agent-version DRAFT \
    --action-group-name order-management \
    --action-group-executor '{"lambda":"arn:aws:lambda:...:function:orderAPI"}' \
    --api-schema '{"payload":"s3://bucket/openapi.json"}'
```

---

## 🛡️ Guardrails 設定

### ガードレール作成

```bash
aws bedrock create-guardrail \
    --name content-filter \
    --description "コンテンツフィルター" \
    --content-policy-config '{
        "filtersConfig": [
            {"type": "SEXUAL", "inputStrength": "HIGH", "outputStrength": "HIGH"},
            {"type": "VIOLENCE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
            {"type": "HATE", "inputStrength": "HIGH", "outputStrength": "HIGH"}
        ]
    }'
```

### ガードレール適用

```python
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-sonnet-20240229-v1:0',
    guardrailIdentifier='my-guardrail',
    guardrailVersion='DRAFT',
    body={...}
)
```

---

## 💰 料金計算

### Bedrock 料金モデル

| モデル | 入力 ($/1K tokens) | 出力 ($/1K tokens) |
|--------|-------------------|-------------------|
| Claude 3.5 Sonnet | $0.003 | $0.015 |
| Claude 3 Haiku | $0.00025 | $0.00125 |
| Nova Pro | $0.0008 | $0.0032 |
| Nova Lite | $0.00006 | $0.00024 |

### コスト見積もり例

```
シナリオ: 1日10,000リクエスト、平均入力500トークン、出力800トークン

Claude 3 Haiku の場合:
- 入力コスト: 10,000 × 500 × $0.00025 / 1,000 = $1.25/日
- 出力コスト: 10,000 × 800 × $0.00125 / 1,000 = $10.00/日
- 月間コスト: ($1.25 + $10.00) × 30 = $337.50
```

---

## 📊 CloudWatch メトリクス

### カスタムダッシュボード

```python
import boto3

cloudwatch = boto3.client('cloudwatch')

# ダッシュボード作成
cloudwatch.put_dashboard(
    DashboardName='Bedrock-Metrics',
    DashboardBody=json.dumps({
        "widgets": [
            {
                "type": "metric",
                "properties": {
                    "title": "Invocations",
                    "metrics": [["AWS/Bedrock", "Invocations", "ModelId", "anthropic.claude-3-sonnet"]],
                    "period": 300,
                    "stat": "Sum"
                }
            }
        ]
    })
)
```

---

## 🔐 IAM ポリシー

### Bedrock 最小権限

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel",
                "bedrock:InvokeModelWithResponseStream"
            ],
            "Resource": [
                "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-*",
                "arn:aws:bedrock:*::foundation-model/amazon.nova-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:Retrieve",
                "bedrock:RetrieveAndGenerate"
            ],
            "Resource": "arn:aws:bedrock:*:*:knowledge-base/*"
        }
    ]
}
```

---

## 🐛 トラブルシューティング

### 一般的なエラー

| エラー | HTTP ステータス | 解決策 |
|--------|----------------|--------|
| ThrottlingException | 429 | 指数バックオフで再試行 |
| ValidationException | 400 | リクエストサイズ確認 |
| AccessDeniedException | 403 | IAM 権限確認 |
| ModelTimeoutException | 408 | タイムアウト設定の見直し |

### デバッグログ

```python
import logging

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# boto3 ログ有効化
boto3.set_stream_logger('', logging.DEBUG)
```

---

## 🔗 便利なリンク

- [Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [Bedrock 料金](https://aws.amazon.com/bedrock/pricing/)
- [Bedrock クォータ](https://docs.aws.amazon.com/bedrock/latest/userguide/quotas.html)

---

*最終更新: 2026-03-01*
