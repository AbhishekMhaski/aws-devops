# Quick Reference Guide

## 🚀 Quick Commands

### Local Development
```bash
# Install dependencies
cd app
npm install

# Run locally
npm start

# Access application
http://localhost:3000

# Health check
curl http://localhost:3000/health
```

### Docker Commands
```bash
# Build Docker image
cd app
docker build -t aws-devops-app .

# Run container
docker run -p 3000:3000 aws-devops-app

# Test container
curl http://localhost:3000/health
```

### Terraform Commands
```bash
cd terraform

# Initialize
terraform init

# Validate configuration
terraform validate

# Format code
terraform fmt

# Plan deployment
terraform plan

# Apply changes
terraform apply

# Show outputs
terraform output

# Destroy infrastructure
terraform destroy
```

### AWS CLI Commands

#### ECR
```bash
# List repositories
aws ecr describe-repositories --region us-east-1

# List images
aws ecr list-images --repository-name aws-devops-app --region us-east-1

# Get login command
aws ecr get-login-password --region us-east-1
```

#### ECS
```bash
# List clusters
aws ecs list-clusters --region us-east-1

# Describe service
aws ecs describe-services \
  --cluster aws-devops-cluster \
  --services aws-devops-service \
  --region us-east-1

# List tasks
aws ecs list-tasks \
  --cluster aws-devops-cluster \
  --service-name aws-devops-service \
  --region us-east-1

# Update service (force new deployment)
aws ecs update-service \
  --cluster aws-devops-cluster \
  --service aws-devops-service \
  --force-new-deployment \
  --region us-east-1
```

#### CodePipeline
```bash
# Get pipeline state
aws codepipeline get-pipeline-state \
  --name aws-devops-pipeline \
  --region us-east-1

# Start pipeline execution
aws codepipeline start-pipeline-execution \
  --name aws-devops-pipeline \
  --region us-east-1

# Get pipeline execution history
aws codepipeline list-pipeline-executions \
  --pipeline-name aws-devops-pipeline \
  --region us-east-1
```

#### CloudWatch Logs
```bash
# Tail ECS logs
aws logs tail /ecs/aws-devops --follow --region us-east-1

# Tail CodeBuild logs
aws logs tail /aws/codebuild/aws-devops --follow --region us-east-1

# Get log streams
aws logs describe-log-streams \
  --log-group-name /ecs/aws-devops \
  --region us-east-1
```

## 📋 Important URLs

### AWS Console
- **ECS**: https://console.aws.amazon.com/ecs/home?region=us-east-1
- **CodePipeline**: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
- **ECR**: https://console.aws.amazon.com/ecr/repositories
- **CloudWatch**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1
- **VPC**: https://console.aws.amazon.com/vpc/home?region=us-east-1

### Application Endpoints
- **Main App**: http://<ALB_DNS_NAME>
- **Health Check**: http://<ALB_DNS_NAME>/health
- **Pipeline Status API**: http://<ALB_DNS_NAME>/api/pipeline-status
- **Metrics API**: http://<ALB_DNS_NAME>/api/metrics

## 🔧 Troubleshooting Quick Fixes

### Pipeline stuck in "In Progress"
```bash
# Check CodeBuild logs
aws logs tail /aws/codebuild/aws-devops --follow --region us-east-1
```

### ECS tasks failing
```bash
# Check service events
aws ecs describe-services \
  --cluster aws-devops-cluster \
  --services aws-devops-service \
  --region us-east-1 \
  --query 'services[0].events[0:10]'

# Check task logs
aws logs tail /ecs/aws-devops --follow --region us-east-1
```

### Application not accessible
```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw target_group_arn) \
  --region us-east-1

# Check security groups
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=aws-devops-*" \
  --region us-east-1
```

### Terraform state issues
```bash
# Refresh state
terraform refresh

# Show current state
terraform show

# List resources
terraform state list

# Remove stuck resource
terraform state rm <resource_name>
```

## 📊 Monitoring Queries

### CloudWatch Insights Queries

#### ECS Error Logs
```
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20
```

#### Request Count by Status
```
fields @timestamp, status
| stats count() by status
| sort count desc
```

#### Slow Requests
```
fields @timestamp, @message
| filter @message like /duration/
| parse @message /duration: (?<duration>\d+)/
| filter duration > 1000
| sort @timestamp desc
```

## 🔐 Security Best Practices

### GitHub Token
- Store in AWS Secrets Manager (recommended)
- Never commit to repository
- Rotate regularly
- Use minimal required scopes

### AWS Credentials
```bash
# Use AWS CLI profiles
aws configure --profile devops

# Use environment variables
export AWS_PROFILE=devops
export AWS_REGION=us-east-1
```

### Terraform State
- Use remote backend (S3 + DynamoDB)
- Enable encryption
- Enable versioning
- Restrict access with IAM

## 💰 Cost Monitoring

### Get current month costs
```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

### Set up billing alerts
1. Go to CloudWatch Console
2. Create Alarm
3. Select "Billing" metric
4. Set threshold (e.g., $100)
5. Configure SNS notification

## 🔄 Common Workflows

### Deploy New Feature
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# ... edit files ...

# 3. Test locally
cd app && npm start

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 5. Create PR and merge to main
# Pipeline will auto-deploy
```

### Rollback Deployment
```bash
# Option 1: Revert commit
git revert HEAD
git push origin main

# Option 2: Force previous deployment
aws ecs update-service \
  --cluster aws-devops-cluster \
  --service aws-devops-service \
  --task-definition aws-devops-task:<previous-revision> \
  --force-new-deployment \
  --region us-east-1
```

### Scale Service
```bash
# Scale to 4 tasks
aws ecs update-service \
  --cluster aws-devops-cluster \
  --service aws-devops-service \
  --desired-count 4 \
  --region us-east-1
```

## 📝 File Locations

### Configuration Files
- **Terraform**: `terraform/*.tf`
- **Docker**: `app/Dockerfile`
- **CodeBuild**: `app/buildspec.yml`
- **Node.js**: `app/package.json`

### Application Files
- **Server**: `app/src/server.js`
- **Frontend**: `app/public/index.html`
- **Styles**: `app/public/css/style.css`
- **JavaScript**: `app/public/js/app.js`

### Documentation
- **README**: `README.md`
- **Deployment**: `DEPLOYMENT.md`
- **Architecture**: `ARCHITECTURE.md`
- **Quick Ref**: `QUICK_REFERENCE.md` (this file)

## 🎯 Performance Optimization

### Reduce Build Time
```yaml
# In buildspec.yml, enable caching
cache:
  paths:
    - '/root/.npm/**/*'
    - 'app/node_modules/**/*'
```

### Optimize Docker Image
```dockerfile
# Use multi-stage builds
# Use alpine images
# Minimize layers
# Use .dockerignore
```

### ECS Task Optimization
```hcl
# Adjust CPU/Memory based on usage
container_cpu    = 256  # or 512, 1024
container_memory = 512  # or 1024, 2048
```

## 📞 Support Resources

- **AWS Support**: https://console.aws.amazon.com/support/
- **Terraform Docs**: https://registry.terraform.io/providers/hashicorp/aws/latest/docs
- **Docker Docs**: https://docs.docker.com/
- **Node.js Docs**: https://nodejs.org/docs/
- **GitHub Issues**: https://github.com/Amitabh-DevOps/aws-devops/issues

---

**Keep this guide handy for quick reference! 📚**
