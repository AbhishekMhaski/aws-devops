# ========================================
# Terraform Outputs
# ========================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "URL of the Application Load Balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "codepipeline_name" {
  description = "Name of the CodePipeline"
  value       = aws_codepipeline.main.name
}

output "codepipeline_url" {
  description = "URL to view the CodePipeline in AWS Console"
  value       = "https://${var.aws_region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.main.name}/view"
}

output "codebuild_project_name" {
  description = "Name of the CodeBuild project"
  value       = aws_codebuild_project.app.name
}

output "s3_artifacts_bucket" {
  description = "Name of the S3 bucket for pipeline artifacts"
  value       = aws_s3_bucket.artifacts.bucket
}

output "cloudwatch_log_group_ecs" {
  description = "CloudWatch log group for ECS tasks"
  value       = aws_cloudwatch_log_group.ecs.name
}

output "cloudwatch_log_group_codebuild" {
  description = "CloudWatch log group for CodeBuild"
  value       = aws_cloudwatch_log_group.codebuild.name
}

output "deployment_instructions" {
  description = "Instructions for deploying the application"
  value = <<-EOT
    
    ========================================
    AWS DevOps Pipeline Deployment Complete!
    ========================================
    
    Application URL: http://${aws_lb.main.dns_name}
    
    Pipeline Console: https://${var.aws_region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${aws_codepipeline.main.name}/view
    
    ECS Console: https://${var.aws_region}.console.aws.amazon.com/ecs/home?region=${var.aws_region}#/clusters/${aws_ecs_cluster.main.name}/services
    
    Next Steps:
    1. Push code to GitHub to trigger the pipeline
    2. Monitor pipeline execution in AWS Console
    3. Access your application at the ALB URL above
    4. View logs in CloudWatch: ${aws_cloudwatch_log_group.ecs.name}
    
    To trigger the pipeline manually:
    git add .
    git commit -m "Trigger pipeline"
    git push origin ${var.github_branch}
    
    ========================================
  EOT
}
