# AWS Serverless クイックリファレンス

> 必須コマンド、設定、ベストプラクティスをすぐに確認

---

## AWS CLI コマンド

### Lambda

```bash
# すべての Lambda 関数を一覧表示
aws lambda list-functions

# 関数の詳細を取得
aws lambda get-function --function-name my-function

# 関数を同期実行
aws lambda invoke \
    --function-name my-function \
    --payload '{"key": "value"}' \
    --cli-binary-format raw-in-base64-out \
    response.json

# 非同期実行
aws lambda invoke \
    --function-name my-function \
    --invocation-type Event \
    --payload '{"key": "value"}' \
    --cli-binary-format raw-in-base64-out \
    /dev/null

# 関数コードを更新
aws lambda update-function-code \
    --function-name my-function \
    --zip-file fileb://function.zip

# 関数設定を更新
aws lambda update-function-configuration \
    --function-name my-function \
    --memory-size 512 \
    --timeout 30 \
    --environment Variables={KEY1=VAL1,KEY2=VAL2}

# エイリアスを管理
aws lambda create-alias \
    --function-name my-function \
    --name prod \
    --function-version 1

# Provisioned Concurrency を設定
aws lambda put-provisioned-concurrency-config \
    --function-name my-function \
    --qualifier prod \
    --provisioned-concurrent-executions 100

# CloudWatch ログを表示
aws logs tail /aws/lambda/my-function --follow
```

### API Gateway

```bash
# REST API を作成
aws apigateway create-rest-api --name my-api

# API ID を取得
API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`my-api`].id' --output text)

# リソースを作成
aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $(aws apigateway get-resources --rest-api-id $API_ID --query 'items[?path==`/`].id' --output text) \
    --path-part users

# メソッドを作成
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $RESOURCE_ID \
    --http-method GET \
    --authorization-type NONE

# API をデプロイ
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod
```

### SAM CLI

```bash
# 新規プロジェクトを初期化
sam init --runtime python3.11 --name my-project

# アプリケーションをビルド
sam build

# ローカルテスト
sam local invoke MyFunction --event event.json
sam local start-api

# デプロイ
sam deploy --guided
sam deploy --config-env prod

# 同期（開発用）
sam sync --watch

# ログ
sam logs --name MyFunction --tail
```

---

## Lambda 制限

| リソース | 制限値 |
|----------|-------|
| メモリ | 128 MB - 10,240 MB |
| タイムアウト | 900 秒（15 分） |
| デプロイパッケージ | 50 MB（圧縮時）、250 MB（展開時） |
| /tmp ストレージ | 10,240 MB |
| 同時実行 | 1,000（デフォルト、調整可能） |
| 環境変数 | 4 KB |
| レイヤー | 関数あたり 5 つ |

---

## イベントソース

| サービス | トリガータイプ | 一般的なユースケース |
|---------|-------------|-------------------|
| API Gateway | 同期/非同期 | HTTP API |
| S3 | 非同期 | ファイル処理 |
| SQS | ポーリング | キュー処理 |
| SNS | プッシュ | 通知 |
| EventBridge | プッシュ | スケジュール/イベント駆動 |
| DynamoDB Streams | ポーリング | 変更データキャプチャ |
| Kinesis | ポーリング | リアルタイムストリーミング |

---

## 料金計算式

**Lambda**: 
```
合計コスト = リクエストコスト + 実行時間コスト

リクエストコスト = 100 万件あたり $0.20
実行時間コスト = GB-秒あたり $0.0000166667

例: 100 万件リクエスト、512MB、平均 200ms
= $0.20 + (100 万 × 0.2s × 0.5GB × $0.0000166667)
= $0.20 + $1.67 = $1.87
```

---

## 参考リンク

- [AWS Lambda ドキュメント](https://docs.aws.amazon.com/lambda/)
- [SAM CLI ドキュメント](https://docs.aws.amazon.com/serverless-application-model/)
- [AWS Serverless Land](https://serverlessland.com/)
