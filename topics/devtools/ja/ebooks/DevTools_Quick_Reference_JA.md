# 開発ツールクイックリファレンス

> よく使用されるコマンド、設定、およびベストプラクティスのクイックリファレンスです

---

## 📋 目次

- [Git コマンド](#git-コマンド)
- [Docker コマンド](#docker-コマンド)
- [Kubernetes コマンド](#kubernetes-コマンド)
- [CI/CD 設定](#cicd-設定)
- [Linux ツール](#linux-ツール)
- [クラウドプラットフォーム CLI](#クラウドプラットフォーム-cli)

---

## Git コマンド

### 基本操作

```bash
# 設定
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

# リポジトリ操作
git init
git clone <url>
git clone --depth 1 <url>  # シャロークローン

# 日常操作
git add .
git add -p                 # インタラクティブ追加
git commit -m "message"
git commit --amend         # 最後のコミットを修正
git status
git log --oneline --graph -10
git diff
git diff --staged
```

### ブランチ管理

```bash
# ブランチ操作
git branch                  # ローカルブランチ一覧
git branch -a               # すべてのブランチ一覧
git branch -d <branch>      # ブランチ削除
git branch -D <branch>      # 強制削除
git checkout -b <branch>    # 作成して切り替え
git switch -c <branch>      # 新しい方式

git merge <branch>          # ブランチマージ
git rebase <branch>         # リベース
git rebase -i HEAD~5        # インタラクティブリベース

# リモートブランチ
git push -u origin <branch>
git push origin --delete <branch>
git fetch --prune           # リモート削除済みブランチのクリーンアップ
```

### 高度な操作

```bash
# スタッシュ
git stash
git stash push -m "description"
git stash list
git stash pop
git stash drop stash@{0}
git stash clear

# リセット
git reset HEAD~1            # 最後のコミットを取り消し
git reset --hard HEAD~1     # 強制取り消し
git revert <commit>         # 取り消しコミットを作成

# 履歴表示
git log --all --decorate --oneline --graph
git log --author="name" --since="1 week ago"
git blame <file>
git show <commit>

# Cherry-pick
git cherry-pick <commit>
git cherry-pick -x <commit> # ソース情報を保持

# サブモジュール
git submodule add <url> <path>
git submodule update --init --recursive
```

---

## Docker コマンド

### 基本コマンド

```bash
# イメージ操作
docker pull <image>:<tag>
docker build -t <name>:<tag> .
docker images
docker rmi <image>
docker tag <source> <target>

# コンテナ操作
docker run -d --name myapp -p 8080:80 <image>
docker run -it --rm <image> /bin/sh    # インタラクティブ
docker ps
docker ps -a
docker start/stop/restart <container>
docker rm <container>
docker rm -f <container>                # 強制削除

# ログとデバッグ
docker logs <container>
docker logs -f <container>              # リアルタイム追跡
docker logs --tail 100 <container>
docker exec -it <container> /bin/sh     # コンテナに入る
docker top <container>
docker stats
```

### Docker Compose

```bash
# 基本操作
docker-compose up
docker-compose up -d                    # バックグラウンド実行
docker-compose down
docker-compose down -v                  # ボリューム削除
docker-compose ps
docker-compose logs -f

# ビルド
docker-compose build
docker-compose up --build               # 再ビルド後に起動
docker-compose pull                     # 最新イメージをプル

# スケーリング
docker-compose scale web=3
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### ネットワークとボリューム

```bash
# ネットワーク
docker network ls
docker network create mynet
docker run --network mynet <image>

# ボリューム
docker volume ls
docker volume create myvol
docker run -v myvol:/data <image>
docker run -v $(pwd):/app <image>       # バインドマウント
```

---

## Kubernetes コマンド

### コアリソース操作

```bash
# クラスタ情報
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide

# Pod 操作
kubectl get pods
kubectl get pods -n <namespace>
kubectl get pods --all-namespaces
kubectl get pods -o wide
kubectl get pods --show-labels

kubectl describe pod <pod>
kubectl logs <pod>
kubectl logs <pod> -f
kubectl logs <pod> --tail 100
kubectl logs <pod> -c <container>

kubectl exec -it <pod> -- /bin/sh
kubectl cp <pod>:/path/file ./local
kubectl cp ./local <pod>:/path/file

# デプロイメント
kubectl get deployments
kubectl scale deployment <name> --replicas=5
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
kubectl rollout undo deployment/<name> --to-revision=2

# サービス
cubectl get svc
kubectl get ingress
kubectl port-forward svc/<name> 8080:80
```

### 設定とリソース管理

```bash
# ConfigMap と Secret
kubectl create configmap myconfig --from-file=config.json
kubectl create configmap myconfig --from-literal=key=value
kubectl get configmap myconfig -o yaml

kubectl create secret generic mysecret --from-literal=password=123456
kubectl create secret tls mytls --cert=cert.pem --key=key.pem
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d

# 設定の適用
kubectl apply -f manifest.yaml
kubectl apply -f ./directory/
kubectl apply -k kustomization/
kubectl delete -f manifest.yaml

# Helm
helm repo add <name> <url>
helm repo update
helm search repo <keyword>
helm install <release> <chart>
helm upgrade <release> <chart>
helm rollback <release> <revision>
helm uninstall <release>
helm list
helm get values <release>
```

### デバッグと診断

```bash
# イベントと監視
kubectl get events
kubectl get events --field-selector type=Warning
kubectl top nodes
kubectl top pods

# Pod デバッグ
kubectl describe pod <pod>
kubectl get pod <pod> -o yaml
kubectl logs --previous <pod>           # 前のコンテナログ

# ネットワークデバッグ
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
kubectl get endpoints <service>
```

---

## CI/CD 設定

### GitHub Actions

```yaml
# よく使用されるトリガー
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'                  # 毎日深夜
  workflow_dispatch:                     # 手動トリガー

# よく使用される Action
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
    token: ${{ secrets.GITHUB_TOKEN }}

- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'

- uses: actions/setup-python@v5
  with:
    python-version: '3.11'

- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}

# 条件付き実行
if: github.ref == 'refs/heads/main'
if: contains(github.event.head_commit.message, 'deploy')
if: ${{ success() }}
if: ${{ failure() }}
```

### GitLab CI

```yaml
# よく使用されるキーワード
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/

# よく使用されるテンプレート
.only-main:
  only:
    - main

# ルール
rules:
  - if: $CI_COMMIT_BRANCH == "main"
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  - if: $CI_COMMIT_TAG

# アーティファクト
artifacts:
  paths:
    - dist/
  expire_in: 1 week

# レポート
reports:
  junit: junit.xml
  coverage_report:
    coverage_format: cobertura
    path: coverage.xml
```

---

## Linux ツール

### ファイル操作

```bash
# 検索
find . -name "*.js" -type f
find . -size +100M
find . -mtime -7                          # 7日以内に変更
locate filename

# 検索
grep -r "pattern" .
grep -i "pattern" file                    # 大文字小文字無視
grep -v "pattern" file                    # 逆マッチ
grep -E "pattern1|pattern2" file          # 正規表現
rg "pattern"                              # ripgrep (より高速)

# テキスト処理
awk '{print $1}' file
awk -F',' '{print $2}' file               # 区切り文字指定
sed 's/old/new/g' file
sed -i 's/old/new/g' file                 # 直接修正
cut -d',' -f1,3 file
sort | uniq -c | sort -nr                 # 頻度集計
head -n 20
 tail -n 20
 tail -f file                             # リアルタイム追跡
```

### システム監視

```bash
# プロセス
ps aux
ps aux | grep process
top
htop
kill -9 <pid>
pkill -f "pattern"

# ディスク
df -h
du -sh directory
du -h --max-depth=1
ncdu                                      # インタラクティブディスク分析

# メモリ
free -h
vmstat 1

# ネットワーク
netstat -tlnp
ss -tlnp
lsof -i :8080
curl -I http://example.com
wget -O - http://example.com

# IO
iostat -x 1
iotop
```

### 圧縮とアーカイブ

```bash
# tar
tar -cvf archive.tar directory
tar -czvf archive.tar.gz directory        # gzip
tar -cjvf archive.tar.bz2 directory       # bzip2
tar -xvf archive.tar
tar -xzvf archive.tar.gz
tar -tvf archive.tar                      # 内容確認

# zip
zip -r archive.zip directory
unzip archive.zip
unzip -l archive.zip                      # 内容確認
```

---

## クラウドプラットフォーム CLI

### AWS CLI

```bash
# 設定
aws configure
aws configure --profile production
export AWS_PROFILE=production

# S3
aws s3 ls
aws s3 mb s3://bucket-name
aws s3 cp file.txt s3://bucket/
aws s3 sync ./local s3://bucket/remote
aws s3 rm s3://bucket/file
aws s3 presign s3://bucket/file --expires-in 3600

# EC2
aws ec2 describe-instances
aws ec2 run-instances --image-id ami-xxx --instance-type t3.micro
aws ec2 start-instances --instance-ids i-xxx
aws ec2 stop-instances --instance-ids i-xxx

# ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <url>
aws ecr create-repository --repository-name myapp

# EKS
aws eks update-kubeconfig --name cluster-name
aws eks list-clusters
```

### その他のクラウド CLI

```bash
# Azure
az login
az account list
az group create --name mygroup --location eastus
az vm create --resource-group mygroup --name myvm --image UbuntuLTS

# GCP
gcloud auth login
gcloud config set project project-id
gcloud compute instances list
gcloud container clusters get-credentials cluster-name

# Terraform
terraform init
terraform plan
terraform apply
terraform apply -auto-approve
terraform destroy
terraform state list
terraform show
terraform import aws_instance.myinstance i-xxx
```

---

## ショートカットキー

### VS Code

| ショートカットキー | 機能 |
|--------|------|
| `Ctrl+P` | クイックファイルオープン |
| `Ctrl+Shift+P` | コマンドパレット |
| `Ctrl+Shift+F` | グローバル検索 |
| `Ctrl+`` | ターミナルを開く |
| `F12` | 定義へジャンプ |
| `Alt+F12` | 定義をプレビュー |
| `Shift+F12` | 参照を検索 |
| `Ctrl+Shift+L` | すべてのマッチを選択 |
| `Ctrl+D` | 次のマッチを選択 |
| `Ctrl+Shift+K` | 行を削除 |
| `Alt+Up/Down` | 行を移動 |
| `Ctrl+/` | コメント/コメント解除 |
| `F5` | デバッグ開始 |
| `F9` | ブレークポイント切り替え |
| `F10` | ステップオーバー |
| `F11` | ステップイン |

### Vim

| ショートカットキー | 機能 |
|--------|------|
| `i` | 挿入モード |
| `Esc` | ノーマルモード |
| `:w` | 保存 |
| `:q` | 終了 |
| `:wq` | 保存して終了 |
| `dd` | 行を削除 |
| `yy` | 行をコピー |
| `p` | 貼り付け |
| `u` | 元に戻す |
| `Ctrl+r` | やり直し |
| `gg` | ファイルの先頭 |
| `G` | ファイルの末尾 |
| `/pattern` | 検索 |
| `n` | 次のマッチ |

---

## 参考リンク

- [Git ドキュメント](https://git-scm.com/doc)
- [Docker ドキュメント](https://docs.docker.com/)
- [Kubernetes ドキュメント](https://kubernetes.io/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS CLI](https://docs.aws.amazon.com/cli/)
