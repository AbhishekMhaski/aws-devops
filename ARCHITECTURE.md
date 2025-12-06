# AWS DevOps CI/CD Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud (us-east-1)                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                        VPC (10.0.0.0/16)                        │    │
│  │                                                                  │    │
│  │  ┌──────────────────────┐    ┌──────────────────────┐          │    │
│  │  │  Public Subnet (AZ1) │    │  Public Subnet (AZ2) │          │    │
│  │  │    10.0.1.0/24       │    │    10.0.2.0/24       │          │    │
│  │  │                      │    │                      │          │    │
│  │  │  ┌────────────────┐  │    │  ┌────────────────┐  │          │    │
│  │  │  │  NAT Gateway   │  │    │  │  NAT Gateway   │  │          │    │
│  │  │  └────────────────┘  │    │  └────────────────┘  │          │    │
│  │  └──────────┬───────────┘    └──────────┬───────────┘          │    │
│  │             │                           │                       │    │
│  │  ┌──────────┴───────────┐    ┌──────────┴───────────┐          │    │
│  │  │ Private Subnet (AZ1) │    │ Private Subnet (AZ2) │          │    │
│  │  │   10.0.11.0/24       │    │   10.0.12.0/24       │          │    │
│  │  │                      │    │                      │          │    │
│  │  │  ┌────────────────┐  │    │  ┌────────────────┐  │          │    │
│  │  │  │  ECS Task      │  │    │  │  ECS Task      │  │          │    │
│  │  │  │  (Fargate)     │  │    │  │  (Fargate)     │  │          │    │
│  │  │  │  Port: 3000    │  │    │  │  Port: 3000    │  │          │    │
│  │  │  └────────────────┘  │    │  └────────────────┘  │          │    │
│  │  └──────────────────────┘    └──────────────────────┘          │    │
│  │             ▲                           ▲                       │    │
│  │             └───────────┬───────────────┘                       │    │
│  │                         │                                       │    │
│  │              ┌──────────┴──────────┐                            │    │
│  │              │  Application Load   │                            │    │
│  │              │     Balancer        │                            │    │
│  │              │   (Public-facing)   │                            │    │
│  │              └──────────┬──────────┘                            │    │
│  └─────────────────────────┼───────────────────────────────────────┘    │
│                            │                                            │
│                            ▼                                            │
│                    ┌───────────────┐                                    │
│                    │   Internet    │                                    │
│                    │   Gateway     │                                    │
│                    └───────┬───────┘                                    │
└────────────────────────────┼──────────────────────────────────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │   Internet   │
                      │    Users     │
                      └──────────────┘
```

## CI/CD Pipeline Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│   GitHub    │────▶│ CodePipeline │────▶│  CodeBuild  │────▶│   ECR    │
│ Repository  │     │   (Source)   │     │   (Build)   │     │ Registry │
└─────────────┘     └──────────────┘     └─────────────┘     └────┬─────┘
                                                                    │
      ▲                                                             │
      │                                                             ▼
      │                                          ┌──────────────────────────┐
      │                                          │   ECS Fargate Cluster    │
      │                                          │                          │
      │                                          │  ┌────────────────────┐  │
      └──────────────────────────────────────────┤  │  Deploy New Tasks  │  │
                 Webhook Trigger                 │  │  (Blue/Green)      │  │
                                                 │  └────────────────────┘  │
                                                 └──────────────────────────┘
```

## Detailed Component Architecture

### 1. Source Stage (GitHub)
```
GitHub Repository
├── app/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   ├── package.json
│   └── buildspec.yml
└── terraform/
    └── *.tf files

    │
    ▼ (Push to main branch)
    │
CodePipeline Triggered
```

### 2. Build Stage (CodeBuild)
```
CodeBuild Process:
1. Pull source from GitHub
2. Read buildspec.yml
3. Login to ECR
4. Build Docker image
5. Tag image (latest + commit hash)
6. Push to ECR
7. Generate imagedefinitions.json
8. Output artifact to S3

Environment Variables:
- AWS_ACCOUNT_ID
- AWS_DEFAULT_REGION
- IMAGE_REPO_NAME
- CONTAINER_NAME
```

### 3. Deploy Stage (ECS)
```
ECS Deployment:
1. Read imagedefinitions.json
2. Create new task definition revision
3. Update ECS service
4. Launch new tasks
5. Wait for health checks
6. Drain old tasks
7. Complete deployment

Health Check:
- Path: /health
- Interval: 30s
- Timeout: 5s
- Healthy threshold: 2
```

## Network Architecture

### VPC Configuration
```
VPC: 10.0.0.0/16
│
├── Public Subnets (Internet-facing)
│   ├── AZ1: 10.0.1.0/24
│   └── AZ2: 10.0.2.0/24
│       ├── Internet Gateway
│       ├── NAT Gateways
│       └── Application Load Balancer
│
└── Private Subnets (Internal)
    ├── AZ1: 10.0.11.0/24
    └── AZ2: 10.0.12.0/24
        └── ECS Fargate Tasks
```

### Security Groups
```
ALB Security Group:
- Inbound: 0.0.0.0/0:80 (HTTP)
- Inbound: 0.0.0.0/0:443 (HTTPS)
- Outbound: All traffic

ECS Tasks Security Group:
- Inbound: ALB Security Group:3000
- Outbound: All traffic
```

## Data Flow

### User Request Flow
```
1. User → Internet
2. Internet → Internet Gateway
3. Internet Gateway → Application Load Balancer
4. ALB → Target Group (Health Check)
5. Target Group → ECS Task (Port 3000)
6. ECS Task → Application Response
7. Response flows back through the chain
```

### Container Deployment Flow
```
1. Developer pushes code to GitHub
2. GitHub webhook triggers CodePipeline
3. CodePipeline pulls source code
4. CodeBuild builds Docker image
5. Docker image pushed to ECR
6. CodePipeline triggers ECS deployment
7. ECS pulls new image from ECR
8. New tasks launched in private subnets
9. ALB routes traffic to new tasks
10. Old tasks drained and terminated
```

## IAM Roles and Permissions

```
┌─────────────────────────────────────────────────────────┐
│                     IAM Roles                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ECS Execution Role                                      │
│  ├── Pull images from ECR                               │
│  ├── Write logs to CloudWatch                           │
│  └── Access secrets (if configured)                     │
│                                                          │
│  ECS Task Role                                           │
│  └── Application-specific permissions                   │
│                                                          │
│  CodeBuild Role                                          │
│  ├── Read from S3 artifacts                             │
│  ├── Write to S3 artifacts                              │
│  ├── Push to ECR                                        │
│  └── Write to CloudWatch Logs                           │
│                                                          │
│  CodePipeline Role                                       │
│  ├── Read/Write S3 artifacts                            │
│  ├── Start CodeBuild projects                           │
│  ├── Update ECS services                                │
│  └── Pass roles to ECS                                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Monitoring and Logging

```
CloudWatch Integration:
│
├── ECS Container Logs
│   └── /ecs/aws-devops
│       ├── Application logs
│       ├── Error logs
│       └── Access logs
│
├── CodeBuild Logs
│   └── /aws/codebuild/aws-devops
│       ├── Build output
│       └── Build errors
│
└── Metrics
    ├── ECS Service metrics
    │   ├── CPU utilization
    │   ├── Memory utilization
    │   └── Task count
    │
    ├── ALB metrics
    │   ├── Request count
    │   ├── Target response time
    │   └── HTTP status codes
    │
    └── Auto-scaling triggers
        ├── CPU > 70% → Scale out
        └── CPU < 30% → Scale in
```

## High Availability

```
Multi-AZ Deployment:
│
├── Availability Zone 1
│   ├── Public Subnet
│   │   ├── NAT Gateway
│   │   └── ALB (Active)
│   └── Private Subnet
│       └── ECS Task 1
│
└── Availability Zone 2
    ├── Public Subnet
    │   ├── NAT Gateway
    │   └── ALB (Active)
    └── Private Subnet
        └── ECS Task 2

Benefits:
- Automatic failover
- Load distribution
- Zero-downtime deployments
- Fault tolerance
```

## Scaling Strategy

```
Auto Scaling Configuration:
│
├── Target Tracking Policies
│   ├── CPU Utilization: 70%
│   └── Memory Utilization: 80%
│
├── Scaling Limits
│   ├── Minimum: 2 tasks
│   └── Maximum: 4 tasks
│
└── Cooldown Periods
    ├── Scale out: 60 seconds
    └── Scale in: 300 seconds
```

## Cost Optimization

```
Resource Optimization:
│
├── Fargate Spot (Future Enhancement)
│   └── Save up to 70% on compute costs
│
├── ECR Lifecycle Policies
│   ├── Keep last 10 tagged images
│   └── Remove untagged after 7 days
│
├── CloudWatch Log Retention
│   └── 7 days retention
│
└── Single NAT Gateway Option
    └── Use 1 NAT instead of 2 (saves ~$32/month)
```

---

This architecture provides:
- ✅ High availability across multiple AZs
- ✅ Automated CI/CD pipeline
- ✅ Container orchestration with ECS Fargate
- ✅ Load balancing and auto-scaling
- ✅ Comprehensive monitoring and logging
- ✅ Infrastructure as Code with Terraform
- ✅ Security best practices
