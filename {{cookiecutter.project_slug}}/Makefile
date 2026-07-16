# MyProject Makefile
# Quick commands for deployment and management

.PHONY: help install-hooks deploy deploy-frontend deploy-backend deploy-infra \
        infra-plan infra-apply infra-destroy infra-output \
        backend-logs task-logs lambda-logs alarm-status \
        start-backend ping-backend stop-backend task-status \
        build-backend push-backend clean test-backend test-frontend

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

# Configuration
AWS_REGION ?= us-east-1
TF_DIR := terraform/environments/prod
PROJECT_NAME := MyProject
ENVIRONMENT := prod

##@ Help

help: ## Display this help
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)Usage:$(NC)\n  make $(YELLOW)<target>$(NC)\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Setup

install-hooks: ## Install git hooks for deployment prompts
	@echo "$(BLUE)Installing git hooks...$(NC)"
	@./scripts/install-hooks.sh

##@ Deployment

deploy: ## Auto-detect changes and deploy (frontend/backend/infra)
	@echo "$(BLUE)Running auto-deployment...$(NC)"
	@./scripts/deploy.sh

deploy-frontend: ## Deploy frontend to S3 + CloudFront
	@echo "$(BLUE)Deploying frontend...$(NC)"
	@./scripts/deploy-frontend.sh

deploy-backend: ## Build and push backend Docker image to ECR
	@echo "$(BLUE)Deploying backend...$(NC)"
	@./scripts/deploy-backend.sh

deploy-infra: infra-apply ## Deploy infrastructure (alias for infra-apply)

##@ Infrastructure (Terraform)

create-cert: ## Create wildcard SSL certificate for *.yerson.co
	@echo "$(BLUE)Creating wildcard certificate...$(NC)"
	@./scripts/create-wildcard-cert.sh yerson.co

infra-plan: ## Preview Terraform changes
	@echo "$(BLUE)Creating Terraform plan...$(NC)"
	@cd $(TF_DIR) && terraform init -input=false
	@cd $(TF_DIR) && terraform plan -input=false

infra-apply: ## Apply Terraform changes (deploys infrastructure)
	@echo "$(BLUE)Applying Terraform changes...$(NC)"
	@./scripts/deploy-infrastructure.sh apply

infra-destroy: ## Destroy all infrastructure (WARNING: destructive!)
	@echo "$(RED)⚠️  This will DESTROY all infrastructure!$(NC)"
	@./scripts/deploy-infrastructure.sh destroy

infra-output: ## Show Terraform outputs
	@cd $(TF_DIR) && terraform output

infra-output-json: ## Show Terraform outputs in JSON format
	@cd $(TF_DIR) && terraform output -json

infra-init: ## Initialize Terraform
	@cd $(TF_DIR) && terraform init

infra-validate: ## Validate Terraform configuration
	@cd $(TF_DIR) && terraform validate

infra-fmt: ## Format Terraform files
	@cd $(TF_DIR) && terraform fmt -recursive

##@ Backend Logs & Monitoring

backend-logs: ## Stream live logs from backend ECS task
	@echo "$(BLUE)Streaming backend logs...$(NC)"
	@aws logs tail /ecs/$(PROJECT_NAME)-$(ENVIRONMENT) --follow --region $(AWS_REGION)

task-logs: backend-logs ## Alias for backend-logs

lambda-logs: ## Stream live logs from Task Manager Lambda
	@echo "$(BLUE)Streaming Task Manager Lambda logs...$(NC)"
	@aws logs tail /aws/lambda/$(PROJECT_NAME)-task-manager-$(ENVIRONMENT) --follow --region $(AWS_REGION)

lambda-monitor-logs: ## Stream live logs from Task Monitor Lambda
	@echo "$(BLUE)Streaming Task Monitor Lambda logs...$(NC)"
	@aws logs tail /aws/lambda/$(PROJECT_NAME)-task-monitor-$(ENVIRONMENT) --follow --region $(AWS_REGION)

logs-all: ## Stream all logs (task manager, monitor, and backend)
	@echo "$(YELLOW)Opening 3 log streams in parallel...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop all streams$(NC)"
	@(aws logs tail /aws/lambda/$(PROJECT_NAME)-task-manager-$(ENVIRONMENT) --follow --region $(AWS_REGION) 2>&1 | sed 's/^/[TASK-MGR] /' &) && \
	 (aws logs tail /aws/lambda/$(PROJECT_NAME)-task-monitor-$(ENVIRONMENT) --follow --region $(AWS_REGION) 2>&1 | sed 's/^/[MONITOR] /' &) && \
	 (aws logs tail /ecs/$(PROJECT_NAME)-$(ENVIRONMENT) --follow --region $(AWS_REGION) 2>&1 | sed 's/^/[BACKEND] /' &) && \
	 wait

##@ Backend Task Management

start-backend: ## Start backend task via API Gateway
	@echo "$(BLUE)Starting backend task...$(NC)"
	@API_ENDPOINT=$$(cd $(TF_DIR) && terraform output -raw api_start_endpoint 2>/dev/null || echo ""); \
	if [ -z "$$API_ENDPOINT" ]; then \
		echo "$(RED)Error: API endpoint not found. Deploy infrastructure first.$(NC)"; \
		exit 1; \
	fi; \
	echo "Calling: $$API_ENDPOINT"; \
	curl -s "$$API_ENDPOINT" | jq '.' || curl -s "$$API_ENDPOINT"

ping-backend: ## Ping backend to extend lifetime
	@echo "$(BLUE)Pinging backend task...$(NC)"
	@API_ENDPOINT=$$(cd $(TF_DIR) && terraform output -raw api_start_endpoint 2>/dev/null || echo ""); \
	if [ -z "$$API_ENDPOINT" ]; then \
		echo "$(RED)Error: API endpoint not found.$(NC)"; \
		exit 1; \
	fi; \
	curl -s "$$API_ENDPOINT?action=ping" | jq '.' || curl -s "$$API_ENDPOINT?action=ping"

stop-backend: ## Stop running backend task
	@echo "$(BLUE)Stopping backend task...$(NC)"
	@CLUSTER=$$(cd $(TF_DIR) && terraform output -raw ecs_cluster_name 2>/dev/null || echo ""); \
	if [ -z "$$CLUSTER" ]; then \
		echo "$(RED)Error: ECS cluster not found.$(NC)"; \
		exit 1; \
	fi; \
	TASK_ARN=$$(aws ecs list-tasks --cluster $$CLUSTER --region $(AWS_REGION) --query 'taskArns[0]' --output text); \
	if [ "$$TASK_ARN" = "None" ] || [ -z "$$TASK_ARN" ]; then \
		echo "$(YELLOW)No running tasks found.$(NC)"; \
	else \
		echo "Stopping task: $$TASK_ARN"; \
		aws ecs stop-task --cluster $$CLUSTER --task $$TASK_ARN --region $(AWS_REGION); \
		echo "$(GREEN)Task stopped.$(NC)"; \
	fi

task-status: ## Show current backend task status
	@echo "$(BLUE)Checking task status...$(NC)"
	@CLUSTER=$$(cd $(TF_DIR) && terraform output -raw ecs_cluster_name 2>/dev/null || echo ""); \
	if [ -z "$$CLUSTER" ]; then \
		echo "$(RED)Error: ECS cluster not found.$(NC)"; \
		exit 1; \
	fi; \
	TASK_ARNS=$$(aws ecs list-tasks --cluster $$CLUSTER --region $(AWS_REGION) --query 'taskArns' --output text); \
	if [ -z "$$TASK_ARNS" ]; then \
		echo "$(YELLOW)No running tasks.$(NC)"; \
	else \
		echo "$(GREEN)Running tasks:$(NC)"; \
		aws ecs describe-tasks --cluster $$CLUSTER --tasks $$TASK_ARNS --region $(AWS_REGION) --query 'tasks[*].[taskArn,lastStatus,containers[0].lastStatus]' --output table; \
	fi

alarm-status: ## Show CloudWatch alarm status
	@echo "$(BLUE)Checking alarm status...$(NC)"
	@aws cloudwatch describe-alarms \
		--alarm-names $(PROJECT_NAME)-task-inactivity-$(ENVIRONMENT) \
		--region $(AWS_REGION) \
		--query 'MetricAlarms[0].[AlarmName,StateValue,StateReason]' \
		--output table

##@ Database

db-backup: ## Backup SQLite database from S3
	@echo "$(BLUE)Backing up database...$(NC)"
	@DB_BUCKET=$$(cd $(TF_DIR) && terraform output -raw database_bucket_name 2>/dev/null || echo ""); \
	if [ -z "$$DB_BUCKET" ]; then \
		echo "$(RED)Error: Database bucket not found.$(NC)"; \
		exit 1; \
	fi; \
	BACKUP_FILE="backup-$$(date +%Y%m%d-%H%M%S).sqlite3"; \
	aws s3 cp s3://$$DB_BUCKET/db.sqlite3 ./$$BACKUP_FILE --region $(AWS_REGION); \
	echo "$(GREEN)Database backed up to: $$BACKUP_FILE$(NC)"

db-restore: ## Restore SQLite database to S3 (requires BACKUP_FILE=path/to/backup.sqlite3)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(RED)Error: BACKUP_FILE not specified.$(NC)"; \
		echo "Usage: make db-restore BACKUP_FILE=backup-20250126.sqlite3"; \
		exit 1; \
	fi
	@echo "$(YELLOW)⚠️  This will overwrite the current database!$(NC)"
	@read -p "Are you sure? (yes/no): " CONFIRM; \
	if [ "$$CONFIRM" != "yes" ]; then \
		echo "$(RED)Aborted.$(NC)"; \
		exit 1; \
	fi
	@DB_BUCKET=$$(cd $(TF_DIR) && terraform output -raw database_bucket_name 2>/dev/null || echo ""); \
	if [ -z "$$DB_BUCKET" ]; then \
		echo "$(RED)Error: Database bucket not found.$(NC)"; \
		exit 1; \
	fi; \
	aws s3 cp $(BACKUP_FILE) s3://$$DB_BUCKET/db.sqlite3 --region $(AWS_REGION); \
	echo "$(GREEN)Database restored from: $(BACKUP_FILE)$(NC)"

db-list-backups: ## List all database backup versions in S3
	@echo "$(BLUE)Listing database backups...$(NC)"
	@DB_BUCKET=$$(cd $(TF_DIR) && terraform output -raw database_bucket_name 2>/dev/null || echo ""); \
	if [ -z "$$DB_BUCKET" ]; then \
		echo "$(RED)Error: Database bucket not found.$(NC)"; \
		exit 1; \
	fi; \
	aws s3api list-object-versions \
		--bucket $$DB_BUCKET \
		--prefix db.sqlite3 \
		--region $(AWS_REGION) \
		--query 'Versions[*].[VersionId,LastModified,Size]' \
		--output table

##@ Docker (Local Backend Development)

build-backend: ## Build backend Docker image locally
	@echo "$(BLUE)Building backend Docker image...$(NC)"
	@cd BackEndApi && docker build -f compose/production/django/Dockerfile -t MyProject-backend:local .

run-backend-local: ## Run backend Docker container locally
	@echo "$(BLUE)Running backend locally...$(NC)"
	@docker run -p 8000:8000 --rm MyProject-backend:local

push-backend: ## Push backend image to ECR
	@$(MAKE) deploy-backend

##@ Monitoring & Status

status: ## Show overall system status
	@echo "$(BLUE)========================================$(NC)"
	@echo "$(BLUE)   MyProject System Status$(NC)"
	@echo "$(BLUE)========================================$(NC)"
	@echo ""
	@echo "$(YELLOW)Infrastructure:$(NC)"
	@cd $(TF_DIR) && terraform output -json 2>/dev/null | jq -r 'to_entries[] | "  \(.key): \(.value.value)"' || echo "  Not deployed"
	@echo ""
	@echo "$(YELLOW)Backend Task:$(NC)"
	@$(MAKE) -s task-status || echo "  Error checking task"
	@echo ""
	@echo "$(YELLOW)CloudWatch Alarm:$(NC)"
	@$(MAKE) -s alarm-status || echo "  Error checking alarm"

endpoints: ## Show all service endpoints
	@echo "$(BLUE)Service Endpoints:$(NC)"
	@echo ""
	@echo "$(YELLOW)API Gateway (start backend):$(NC)"
	@cd $(TF_DIR) && terraform output -raw api_start_endpoint 2>/dev/null || echo "  Not deployed"
	@echo ""
	@echo "$(YELLOW)Frontend URL:$(NC)"
	@cd $(TF_DIR) && terraform output -raw frontend_url 2>/dev/null || echo "  Not deployed"
	@echo ""
	@echo "$(YELLOW)CloudFront Distribution:$(NC)"
	@cd $(TF_DIR) && terraform output -raw cloudfront_domain 2>/dev/null || echo "  Not deployed"
	@echo ""

##@ Cleanup

clean: ## Clean up temporary files and caches
	@echo "$(BLUE)Cleaning up...$(NC)"
	@rm -f .last-deploy
	@rm -f terraform/environments/prod/tfplan
	@rm -f terraform/environments/prod/.terraform.lock.hcl
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)Cleanup complete.$(NC)"

clean-all: clean ## Clean everything including Terraform state (use with caution!)
	@echo "$(RED)⚠️  This will remove Terraform state files!$(NC)"
	@read -p "Are you sure? (yes/no): " CONFIRM; \
	if [ "$$CONFIRM" = "yes" ]; then \
		rm -rf terraform/environments/prod/.terraform; \
		echo "$(GREEN)Deep clean complete.$(NC)"; \
	else \
		echo "$(RED)Aborted.$(NC)"; \
	fi

##@ Development

dev-frontend: ## Start frontend development server
	@echo "$(BLUE)Starting frontend dev server...$(NC)"
	@cd frontend && npm start

dev-backend: ## Start backend development server
	@echo "$(BLUE)Starting backend dev server...$(NC)"
	@cd BackEndApi && docker-compose -f local.yml up

test-backend: ## Run backend tests inside the dev container
	@echo "$(BLUE)Running backend tests...$(NC)"
	@docker compose -f docker-compose.dev.yml run --rm \
	  -e DJANGO_SETTINGS_MODULE=config.settings.test \
	  -e POSTGRES_PASSWORD=$${POSTGRES_PASSWORD:-projectmaker_password} \
	  -e DJANGO_SECRET_KEY=$${DJANGO_SECRET_KEY:-insecure-test-secret} \
	  backend sh -lc 'cd /project/BackEndApi/src && python manage.py test $(TEST)'

test-frontend: ## Run frontend tests inside the dev container
	@echo "$(BLUE)Running frontend tests...$(NC)"
	@docker compose -f docker-compose.dev.yml run --rm --no-deps frontend sh -lc './scripts/install-deps.sh --silent && CI=true npm test -- --watchAll=false'

build-frontend: ## Build frontend for production
	@echo "$(BLUE)Building frontend...$(NC)"
	@cd frontend && npm run build
