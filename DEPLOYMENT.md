# AWS DevOps CI/CD Pipeline - Deployment Guide

## 📋 Prerequisites Checklist

Before you begin, ensure you have:

- [ ] AWS Account with administrative access
- [ ] AWS CLI installed and configured
- [ ] Terraform (v1.0+) installed
- [ ] GitHub account
- [ ] GitHub Personal Access Token with `repo` and `admin:repo_hook` permissions
- [ ] Git installed

## 🚀 Step-by-Step Deployment

### Step 1: Verify Prerequisites

```bash
# Check AWS CLI
aws --version
aws sts get-caller-identity

# Check Terraform
terraform --version

# Check Git
git --version
```

### Step 2: Clone the Repository

```bash
git clone https://github.com/Amitabh-DevOps/aws-devops.git
cd aws-devops
```

### Step 3: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `repo` (Full control of private repositories)
   - `admin:repo_hook` (Full control of repository hooks)
4. Generate and copy the token

### Step 4: Configure Terraform Variables

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` and add your GitHub token:

```hcl
aws_region   = "us-east-1"
project_name = "aws-devops"
github_repo  = "Amitabh-DevOps/aws-devops"
github_branch = "main"
github_token = "ghp_your_token_here"  # Replace with your token
```

### Step 5: Initialize Terraform

```bash
terraform init
```

This will:
- Download required providers
- Initialize the backend
- Prepare the working directory

### Step 6: Review the Infrastructure Plan

```bash
terraform plan
```

Review the resources that will be created:
- VPC with public/private subnets
- NAT Gateways
- ECR Repository
- ECS Cluster and Service
- Application Load Balancer
- CodePipeline and CodeBuild
- IAM Roles and Policies
- S3 Bucket for artifacts
- CloudWatch Log Groups

### Step 7: Deploy the Infrastructure

```bash
terraform apply
```

Type `yes` when prompted. This will take approximately 10-15 minutes.

### Step 8: Save Important Outputs

After deployment completes, save these outputs:

```bash
terraform output > ../deployment-info.txt
```

Important outputs:
- `alb_url` - Your application URL
- `codepipeline_url` - Pipeline console URL
- `ecr_repository_url` - Docker registry URL

### Step 9: Push Initial Code to Trigger Pipeline

The infrastructure is now ready. Push your code to trigger the first pipeline run:

```bash
cd ..
git add .
git commit -m "Initial deployment - trigger pipeline"
git push origin main
```

### Step 10: Monitor the Pipeline

1. Open the CodePipeline URL from the outputs
2. Watch the pipeline progress through stages:
   - **Source**: Pulls code from GitHub (~10 seconds)
   - **Build**: Builds Docker image (~3-5 minutes)
   - **Deploy**: Deploys to ECS (~2-3 minutes)

### Step 11: Access Your Application

Once the pipeline completes successfully:

```bash
# Get the ALB URL
cd terraform
terraform output alb_url
```

Open the URL in your browser. You should see the AWS DevOps Dashboard!

## 🔍 Verification Steps

### Check ECS Service

```bash
aws ecs describe-services \
  --cluster aws-devops-cluster \
  --services aws-devops-service \
  --region us-east-1
```

### Check Running Tasks

```bash
aws ecs list-tasks \
  --cluster aws-devops-cluster \
  --service-name aws-devops-service \
  --region us-east-1
```

### View Application Logs

```bash
aws logs tail /ecs/aws-devops --follow --region us-east-1
```

### Check Pipeline Status

```bash
aws codepipeline get-pipeline-state \
  --name aws-devops-pipeline \
  --region us-east-1
```

## 🔄 Making Changes

After the initial deployment, any push to the `main` branch will automatically trigger the pipeline:

```bash
# Make your changes
git add .
git commit -m "Your change description"
git push origin main
```

The pipeline will:
1. Pull the latest code
2. Build a new Docker image
3. Push to ECR
4. Deploy to ECS with zero downtime

## 📊 Monitoring

### CloudWatch Logs

- **ECS Logs**: `/ecs/aws-devops`
- **CodeBuild Logs**: `/aws/codebuild/aws-devops`

### AWS Console Links

- **ECS Console**: https://console.aws.amazon.com/ecs/home?region=us-east-1
- **CodePipeline Console**: https://console.aws.amazon.com/codesuite/codepipeline/pipelines
- **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1

## 🧪 Testing the Application

### Health Check

```bash
curl http://<ALB_DNS_NAME>/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-06T...",
  "uptime": 123.45,
  "environment": "prod"
}
```

### API Endpoints

```bash
# Pipeline Status
curl http://<ALB_DNS_NAME>/api/pipeline-status

# Metrics
curl http://<ALB_DNS_NAME>/api/metrics
```

## 🛠️ Troubleshooting

### Pipeline Fails at Build Stage

**Check CodeBuild logs:**
```bash
aws logs tail /aws/codebuild/aws-devops --follow --region us-east-1
```

**Common issues:**
- Docker build errors: Check Dockerfile syntax
- ECR permissions: Verify IAM role has ECR access

### Pipeline Fails at Deploy Stage

**Check ECS service events:**
```bash
aws ecs describe-services \
  --cluster aws-devops-cluster \
  --services aws-devops-service \
  --region us-east-1 \
  --query 'services[0].events[0:5]'
```

**Common issues:**
- Task fails health checks: Check application logs
- Insufficient resources: Verify task definition CPU/memory

### Application Not Accessible

**Check ALB target health:**
```bash
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN> \
  --region us-east-1
```

**Common issues:**
- Security group rules: Verify ALB can reach ECS tasks
- Health check path: Ensure `/health` endpoint works

### GitHub Webhook Not Working

**Manually trigger pipeline:**
```bash
aws codepipeline start-pipeline-execution \
  --name aws-devops-pipeline \
  --region us-east-1
```

## 🧹 Cleanup

To destroy all resources and avoid AWS charges:

```bash
cd terraform
terraform destroy
```

Type `yes` when prompted. This will:
- Delete all ECS tasks and services
- Remove the ALB and target groups
- Delete ECR images and repository
- Remove CodePipeline and CodeBuild
- Delete VPC and networking resources
- Remove S3 artifacts bucket
- Delete CloudWatch log groups

**Note**: Ensure you want to delete everything before running this command!

## 💰 Cost Estimation

Approximate monthly costs (us-east-1):
- **ECS Fargate** (2 tasks): ~$15-20
- **Application Load Balancer**: ~$20
- **NAT Gateways** (2): ~$65
- **ECR Storage**: ~$1-5
- **CodePipeline**: $1 (first pipeline free)
- **CodeBuild**: Pay per build minute (~$0.005/min)
- **Data Transfer**: Variable

**Total**: ~$100-120/month

To reduce costs:
- Use 1 NAT Gateway instead of 2
- Reduce ECS task count to 1
- Use smaller Fargate task sizes

## 📚 Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

## 🤝 Support

For issues or questions:
- Create an issue on GitHub
- Check AWS CloudWatch logs
- Review Terraform state: `terraform show`

---

**Happy DevOps! 🚀**
