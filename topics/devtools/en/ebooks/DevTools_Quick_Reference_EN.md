# DevTools Quick Reference

> Quick reference for common commands, configurations, and best practices

---

## 📋 Table of Contents

- [Git Commands](#git-commands)
- [Docker Commands](#docker-commands)
- [Kubernetes Commands](#kubernetes-commands)
- [CI/CD Configuration](#cicd-configuration)
- [Linux Tools](#linux-tools)
- [Cloud Platform CLI](#cloud-platform-cli)

---

## Git Commands

### Basic Operations

```bash
# Configuration
git config --global user.name "Your Name"
git config --global user.email "email@example.com"
git config --global init.defaultBranch main
git config --global core.editor "code --wait"

# Repository Operations
git init
git clone <url>
git clone --depth 1 <url>  # Shallow clone

# Daily Operations
git add .
git add -p                 # Interactive add
git commit -m "message"
git commit --amend         # Amend last commit
git status
git log --oneline --graph -10
git diff
git diff --staged
```

### Branch Management

```bash
# Branch Operations
git branch                  # List local branches
git branch -a               # List all branches
git branch -d <branch>      # Delete branch
git branch -D <branch>      # Force delete
git checkout -b <branch>    # Create and switch
git switch -c <branch>      # New way

git merge <branch>          # Merge branch
git rebase <branch>         # Rebase
git rebase -i HEAD~5        # Interactive rebase

# Remote Branches
git push -u origin <branch>
git push origin --delete <branch>
git fetch --prune           # Clean up remote deleted branches
```

### Advanced Operations

```bash
# Stash
git stash
git stash push -m "description"
git stash list
git stash pop
git stash drop stash@{0}
git stash clear

# Reset
git reset HEAD~1            # Undo last commit
git reset --hard HEAD~1     # Force undo
git revert <commit>         # Create revert commit

# View History
git log --all --decorate --oneline --graph
git log --author="name" --since="1 week ago"
git blame <file>
git show <commit>

# Cherry-pick
git cherry-pick <commit>
git cherry-pick -x <commit> # Preserve source info

# Submodules
git submodule add <url> <path>
git submodule update --init --recursive
```

---

## Docker Commands

### Basic Commands

```bash
# Image Operations
docker pull <image>:<tag>
docker build -t <name>:<tag> .
docker images
docker rmi <image>
docker tag <source> <target>

# Container Operations
docker run -d --name myapp -p 8080:80 <image>
docker run -it --rm <image> /bin/sh    # Interactive
docker ps
docker ps -a
docker start/stop/restart <container>
docker rm <container>
docker rm -f <container>                # Force delete

# Logs and Debugging
docker logs <container>
docker logs -f <container>              # Real-time follow
docker logs --tail 100 <container>
docker exec -it <container> /bin/sh     # Enter container
docker top <container>
docker stats
```

### Docker Compose

```bash
# Basic Operations
docker-compose up
docker-compose up -d                    # Run in background
docker-compose down
docker-compose down -v                  # Delete volumes
docker-compose ps
docker-compose logs -f

# Build
docker-compose build
docker-compose up --build               # Rebuild and start
docker-compose pull                     # Pull latest images

# Scale
docker-compose scale web=3
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

### Networks and Volumes

```bash
# Networks
docker network ls
docker network create mynet
docker run --network mynet <image>

# Volumes
docker volume ls
docker volume create myvol
docker run -v myvol:/data <image>
docker run -v $(pwd):/app <image>       # Bind mount
```

---

## Kubernetes Commands

### Core Resource Operations

```bash
# Cluster Info
kubectl cluster-info
kubectl get nodes
kubectl get nodes -o wide

# Pod Operations
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

# Deployments
kubectl get deployments
kubectl scale deployment <name> --replicas=5
kubectl rollout status deployment/<name>
kubectl rollout history deployment/<name>
kubectl rollout undo deployment/<name>
kubectl rollout undo deployment/<name> --to-revision=2

# Services
kubectl get svc
kubectl get ingress
kubectl port-forward svc/<name> 8080:80
```

### Configuration and Resource Management

```bash
# ConfigMap and Secret
kubectl create configmap myconfig --from-file=config.json
kubectl create configmap myconfig --from-literal=key=value
kubectl get configmap myconfig -o yaml

kubectl create secret generic mysecret --from-literal=password=123456
kubectl create secret tls mytls --cert=cert.pem --key=key.pem
kubectl get secret mysecret -o jsonpath='{.data.password}' | base64 -d

# Apply Configuration
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

### Debugging and Diagnostics

```bash
# Events and Monitoring
kubectl get events
kubectl get events --field-selector type=Warning
kubectl top nodes
kubectl top pods

# Debug Pod
kubectl describe pod <pod>
kubectl get pod <pod> -o yaml
kubectl logs --previous <pod>           # Previous container logs

# Network Debugging
kubectl run debug --rm -it --image=nicolaka/netshoot -- /bin/bash
kubectl get endpoints <service>
```

---

## CI/CD Configuration

### GitHub Actions

```yaml
# Common Triggers
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'                  # Daily at midnight
  workflow_dispatch:                     # Manual trigger

# Common Actions
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

# Conditional Execution
if: github.ref == 'refs/heads/main'
if: contains(github.event.head_commit.message, 'deploy')
if: ${{ success() }}
if: ${{ failure() }}
```

### GitLab CI

```yaml
# Common Keywords
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

# Common Templates
.only-main:
  only:
    - main

# Rules
rules:
  - if: $CI_COMMIT_BRANCH == "main"
  - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  - if: $CI_COMMIT_TAG

# Artifacts
artifacts:
  paths:
    - dist/
  expire_in: 1 week

# Reports
reports:
  junit: junit.xml
  coverage_report:
    coverage_format: cobertura
    path: coverage.xml
```

---

## Linux Tools

### File Operations

```bash
# Find
find . -name "*.js" -type f
find . -size +100M
find . -mtime -7                          # Modified within 7 days
locate filename

# Search
grep -r "pattern" .
grep -i "pattern" file                    # Case insensitive
grep -v "pattern" file                    # Invert match
grep -E "pattern1|pattern2" file          # Regex
rg "pattern"                              # ripgrep (faster)

# Text Processing
awk '{print $1}' file
awk -F',' '{print $2}' file               # Specify delimiter
sed 's/old/new/g' file
sed -i 's/old/new/g' file                 # Edit in place
cut -d',' -f1,3 file
sort | uniq -c | sort -nr                 # Count frequency
head -n 20
 tail -n 20
 tail -f file                             # Real-time follow
```

### System Monitoring

```bash
# Processes
ps aux
ps aux | grep process
top
htop
kill -9 <pid>
pkill -f "pattern"

# Disk
df -h
du -sh directory
du -h --max-depth=1
ncdu                                      # Interactive disk analyzer

# Memory
free -h
vmstat 1

# Network
netstat -tlnp
ss -tlnp
lsof -i :8080
curl -I http://example.com
wget -O - http://example.com

# IO
iostat -x 1
iotop
```

### Compression and Archiving

```bash
# tar
tar -cvf archive.tar directory
tar -czvf archive.tar.gz directory        # gzip
tar -cjvf archive.tar.bz2 directory       # bzip2
tar -xvf archive.tar
tar -xzvf archive.tar.gz
tar -tvf archive.tar                      # View contents

# zip
zip -r archive.zip directory
unzip archive.zip
unzip -l archive.zip                      # View contents
```

---

## Cloud Platform CLI

### AWS CLI

```bash
# Configuration
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

### Other Cloud CLIs

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

## Keyboard Shortcuts

### VS Code

| Shortcut | Function |
|----------|----------|
| `Ctrl+P` | Quick file open |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+Shift+F` | Global search |
| `` Ctrl+` `` | Open terminal |
| `F12` | Go to definition |
| `Alt+F12` | Peek definition |
| `Shift+F12` | Find references |
| `Ctrl+Shift+L` | Select all matches |
| `Ctrl+D` | Select next match |
| `Ctrl+Shift+K` | Delete line |
| `Alt+Up/Down` | Move line |
| `Ctrl+/` | Toggle comment |
| `F5` | Start debugging |
| `F9` | Toggle breakpoint |
| `F10` | Step over |
| `F11` | Step into |

### Vim

| Shortcut | Function |
|----------|----------|
| `i` | Insert mode |
| `Esc` | Normal mode |
| `:w` | Save |
| `:q` | Quit |
| `:wq` | Save and quit |
| `dd` | Delete line |
| `yy` | Yank (copy) line |
| `p` | Paste |
| `u` | Undo |
| `Ctrl+r` | Redo |
| `gg` | Beginning of file |
| `G` | End of file |
| `/pattern` | Search |
| `n` | Next match |

---

## Reference Links

- [Git Documentation](https://git-scm.com/doc)
- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [AWS CLI](https://docs.aws.amazon.com/cli/)
