# 开发工具速查手册

> 常用命令、配置和最佳实践速查

---

## 📋 目录

- [Git 命令](#git-命令)
- [Docker 命令](#docker-命令)
- [Kubernetes 命令](#kubernetes-命令)
- [CI/CD 配置](#cicd-配置)
- [Linux 工具](#linux-工具)
- [云平台 CLI](#云平台-cli)

---

## Git 命令

### 基础操作

```bash
# 配置
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

# 仓库操作
git init
git clone <url>
git clone --depth 1 <url>  # 浅克隆

# 日常操作
git add .
git add -p                 # 交互式添加
git commit -m "message"
git commit --amend         # 修改最后一次提交
git status
git log --oneline --graph -10
git diff
git diff --staged
```

### 分支管理

```bash
# 分支操作
git branch                  # 列出本地分支
git branch -a               # 列出所有分支
git branch -d <branch>      # 删除分支
git branch -D <branch>      # 强制删除
git checkout -b <branch>    # 创建并切换
git switch -c <branch>      # 新方式

git merge <branch>          # 合并分支
git rebase <branch>         # 变基
git rebase -i HEAD~5        # 交互式变基

# 远程分支
git push -u origin <branch>
git push origin --delete <branch>
git fetch --prune           # 清理远程已删除分支
```

### 高级操作

```bash
# 暂存
git stash
git stash push -m "description"
git stash list
git stash pop
git stash drop stash@{0}
git stash clear

# 恢复
git reset HEAD~1            # 撤销最后一次提交
git reset --hard HEAD~1     # 强制撤销
git revert <commit>         # 创建撤销提交

# 查看历史
git log --all --decorate --oneline --graph
git log --author="name" --since="1 week ago"
git blame <file>
git show <commit>

# Cherry-pick
git cherry-pick <commit>
git cherry-pick -x <commit> # 保留来源信息

# 子模块
git submodule add <url> <path>
git submodule update --init --recursive
```

---

## Docker 命令

### 基础命令

```bash
# 镜像操作
docker pull <image>:<tag>
docker build -t <name>:<tag> .
docker images
docker rmi <image>
docker tag <source> <target>

# 容器操作
docker run -d --name myapp -p 8080:80 <image>
docker run -it --rm <image> /bin/sh    # 交互式
docker ps
docker ps -a
docker start/stop/restart <container>
docker rm <container>
docker rm -f <container>                # 强制删除

# 日志和调试
docker logs <container>
docker logs -f <container>              # 实时跟踪
docker logs --tail 100 <container>
docker exec -it <container> /bin/sh     # 进入容器
docker top <container>
docker stats
```

### Docker Compose

```bash
# 基础操作
docker-compose up
docker-compose up -d                    # 后台运行
docker-compose down
docker-compose down -v                  # 删除卷
docker-compose ps
docker-compose logs -f

# 构建
docker-compose build
docker-compose up --build               # 重建后启动
docker-compose pull                     # 拉取最新镜像

# 扩展
docker-compose scale web=3
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### 网络和卷

```bash
# 网络
docker network ls
docker network create mynet
docker run --network mynet <image>

# 卷
docker volume ls
docker volume create myvol
docker run -v myvol:/data <image>
docker run -v $(pwd):/app <image>       # 绑定挂载
```

---

## Kubernetes 命令

### 核心资源操作

```bash
# 集群信息
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

# 部署
kubectl get deployments
kubectl scale deployment <name> --replicas=5
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
kubectl rollout undo deployment/<name> --to-revision=2

# 服务
cubectl get svc
kubectl get ingress
kubectl port-forward svc/<name> 8080:80
```

### 配置和资源管理

```bash
# ConfigMap 和 Secret
kubectl create configmap myconfig --from-file=config.json
kubectl create configmap myconfig --from-literal=key=value
kubectl get configmap myconfig -o yaml

kubectl create secret generic mysecret --from-literal=password=123456
kubectl create secret tls mytls --cert=cert.pem --key=key.pem
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d

# 应用配置
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

### 调试和诊断

```bash
# 事件和监控
kubectl get events
kubectl get events --field-selector type=Warning
kubectl top nodes
kubectl top pods

# 调试 Pod
kubectl describe pod <pod>
kubectl get pod <pod> -o yaml
kubectl logs --previous <pod>           # 上一个容器日志

# 网络调试
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
kubectl get endpoints <service>
```

---

## CI/CD 配置

### GitHub Actions

```yaml
# 常用触发器
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'                  # 每天午夜
  workflow_dispatch:                     # 手动触发

# 常用 Action
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

# 条件执行
if: github.ref == 'refs/heads/main'
if: contains(github.event.head_commit.message, 'deploy')
if: ${{ success() }}
if: ${{ failure() }}
```

### GitLab CI

```yaml
# 常用关键字
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

# 常用模板
.only-main:
  only:
    - main

# 规则
rules:
  - if: $CI_COMMIT_BRANCH == "main"
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  - if: $CI_COMMIT_TAG

# 产物
artifacts:
  paths:
    - dist/
  expire_in: 1 week

# 报告
reports:
  junit: junit.xml
  coverage_report:
    coverage_format: cobertura
    path: coverage.xml
```

---

## Linux 工具

### 文件操作

```bash
# 查找
find . -name "*.js" -type f
find . -size +100M
find . -mtime -7                          # 7天内修改
locate filename

# 搜索
grep -r "pattern" .
grep -i "pattern" file                    # 忽略大小写
grep -v "pattern" file                    # 反向匹配
grep -E "pattern1|pattern2" file          # 正则
rg "pattern"                              # ripgrep (更快)

# 文本处理
awk '{print $1}' file
awk -F',' '{print $2}' file               # 指定分隔符
sed 's/old/new/g' file
sed -i 's/old/new/g' file                 # 直接修改
cut -d',' -f1,3 file
sort | uniq -c | sort -nr                 # 统计频率
head -n 20
 tail -n 20
 tail -f file                             # 实时跟踪
```

### 系统监控

```bash
# 进程
ps aux
ps aux | grep process
top
htop
kill -9 <pid>
pkill -f "pattern"

# 磁盘
df -h
du -sh directory
du -h --max-depth=1
ncdu                                      # 交互式磁盘分析

# 内存
free -h
vmstat 1

# 网络
netstat -tlnp
ss -tlnp
lsof -i :8080
curl -I http://example.com
wget -O - http://example.com

# IO
iostat -x 1
iotop
```

### 压缩和归档

```bash
# tar
tar -cvf archive.tar directory
tar -czvf archive.tar.gz directory        # gzip
tar -cjvf archive.tar.bz2 directory       # bzip2
tar -xvf archive.tar
tar -xzvf archive.tar.gz
tar -tvf archive.tar                      # 查看内容

# zip
zip -r archive.zip directory
unzip archive.zip
unzip -l archive.zip                      # 查看内容
```

---

## 云平台 CLI

### AWS CLI

```bash
# 配置
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

### 其他云 CLI

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

## 快捷键

### VS Code

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+P` | 快速打开文件 |
| `Ctrl+Shift+P` | 命令面板 |
| `Ctrl+Shift+F` | 全局搜索 |
| `Ctrl+`` | 打开终端 |
| `F12` | 跳转到定义 |
| `Alt+F12` | 速览定义 |
| `Shift+F12` | 查找引用 |
| `Ctrl+Shift+L` | 选中所有匹配 |
| `Ctrl+D` | 选中下一个匹配 |
| `Ctrl+Shift+K` | 删除行 |
| `Alt+Up/Down` | 移动行 |
| `Ctrl+/` | 注释/取消注释 |
| `F5` | 启动调试 |
| `F9` | 切换断点 |
| `F10` | 单步跳过 |
| `F11` | 单步进入 |

### Vim

| 快捷键 | 功能 |
|--------|------|
| `i` | 插入模式 |
| `Esc` | 普通模式 |
| `:w` | 保存 |
| `:q` | 退出 |
| `:wq` | 保存并退出 |
| `dd` | 删除行 |
| `yy` | 复制行 |
| `p` | 粘贴 |
| `u` | 撤销 |
| `Ctrl+r` | 重做 |
| `gg` | 文件开头 |
| `G` | 文件结尾 |
| `/pattern` | 搜索 |
| `n` | 下一个匹配 |

---

## 参考链接

- [Git 文档](https://git-scm.com/doc)
- [Docker 文档](https://docs.docker.com/)
- [Kubernetes 文档](https://kubernetes.io/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS CLI](https://docs.aws.amazon.com/cli/)
