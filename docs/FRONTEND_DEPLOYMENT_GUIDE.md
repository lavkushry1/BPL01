# Frontend Deployment Guide

## Overview

This document provides a comprehensive guide to the frontend deployment process for the Eventia Ticketing application. We have implemented a robust CI/CD pipeline using GitHub Actions to automate the build, test, and deployment processes across different environments.

## Deployment Workflows

We have set up three main GitHub Actions workflows for frontend deployment:

### 1. Frontend Deployment (`frontend-deploy.yml`)

This workflow handles the basic deployment process for the frontend application.

**Triggers:**
- Push to `main` or `develop` branches (changes in `eventia-ticketing-flow1` directory)
- Pull requests to `main` or `develop` branches
- Manual trigger with environment selection

**Jobs:**
- **Build and Test**: Builds the application and runs tests
- **Deploy to Staging**: Deploys to staging environment (from `develop` branch)
- **Deploy to Production**: Deploys to production environment (from `main` branch)

### 2. Frontend Continuous Deployment (`frontend-cd.yml`)

This workflow provides a more sophisticated continuous deployment process with environment-specific configurations.

**Triggers:**
- Push to `main` or `develop` branches (changes in `eventia-ticketing-flow1` directory)
- Manual trigger with environment selection

**Jobs:**
- **Prepare**: Determines the target environment and version
- **Build**: Builds the application with environment-specific variables
- **Deploy**: Deploys to the target environment
- **Notify**: Sends notifications about deployment status

### 3. Frontend CDN Deployment (`frontend-cdn-deploy.yml`)

This workflow deploys the frontend assets to a CDN for improved global performance.

**Triggers:**
- Push to `main` branch (changes in `eventia-ticketing-flow1` directory)
- Manual trigger with environment selection

**Jobs:**
- **Build**: Builds the application with CDN-specific configuration
- **Deploy to AWS**: Uploads assets to S3 and invalidates CloudFront cache
- **Performance Check**: Runs performance tests on the deployed CDN assets
- **Notify**: Sends notifications about CDN deployment status

## Environment Configuration

The deployment workflows use environment-specific variables stored as GitHub Secrets:

### Common Variables
- `VITE_API_URL_{ENV}`: Backend API URL for each environment
- `VITE_WS_URL_{ENV}`: WebSocket URL for each environment
- `VITE_SENTRY_DSN`: Sentry DSN for error tracking
- `VITE_PAYMENT_GATEWAY_PUBLIC_KEY`: Payment gateway public key

### Docker Variables
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

### Server Variables
- `SSH_HOST_{ENV}`: SSH host for each environment
- `SSH_USER`: SSH username
- `SSH_PRIVATE_KEY`: SSH private key

### CDN Variables
- `AWS_ACCESS_KEY_ID`: AWS access key ID
- `AWS_SECRET_ACCESS_KEY`: AWS secret access key
- `AWS_REGION`: AWS region
- `AWS_S3_BUCKET_{ENV}`: S3 bucket name for each environment
- `AWS_CLOUDFRONT_DISTRIBUTION_{ENV}`: CloudFront distribution ID for each environment
- `VITE_CDN_URL_{ENV}`: CDN URL for each environment

## Deployment Process

### Standard Deployment

1. Code is pushed to a branch (`develop` for staging, `main` for production)
2. GitHub Actions workflow is triggered
3. Application is built with environment-specific variables
4. Docker image is built and pushed to Docker Hub
5. Image is deployed to the target server via SSH
6. Sentry release is created for error tracking

### CDN Deployment

1. Code is pushed to the `main` branch
2. GitHub Actions workflow is triggered
3. Application is built with CDN-specific configuration
4. Built assets are uploaded to AWS S3
5. CloudFront cache is invalidated
6. Performance tests are run on the deployed assets

## Manual Deployment

To manually trigger a deployment:

1. Go to the GitHub Actions tab in the repository
2. Select the desired workflow
3. Click "Run workflow"
4. Select the target branch and environment
5. Click "Run workflow"

## Monitoring Deployments

Deployment status notifications are sent to Slack. You can also monitor deployments in the GitHub Actions tab.

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check the build logs for errors
   - Ensure all required environment variables are set
   - Verify that the code passes all tests locally

2. **Deployment Failures**
   - Check SSH access to the target server
   - Verify Docker Hub credentials
   - Ensure the target server has sufficient resources

3. **CDN Deployment Issues**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Ensure CloudFront distribution is properly configured

## Best Practices

1. **Environment Isolation**
   - Keep environment configurations separate
   - Use different resources for each environment

2. **Secret Management**
   - Store secrets in GitHub Secrets
   - Rotate secrets regularly

3. **Deployment Verification**
   - Run automated tests after deployment
   - Perform manual smoke tests on critical features

4. **Rollback Plan**
   - Have a plan for rolling back deployments if issues are detected
   - Keep previous versions of Docker images available

## Future Improvements

1. **Blue-Green Deployments**: Implement zero-downtime deployments
2. **Canary Releases**: Gradually roll out changes to a subset of users
3. **Automated Rollbacks**: Automatically roll back deployments if issues are detected
4. **Enhanced Monitoring**: Implement more comprehensive monitoring of deployed applications
5. **Performance Budgets**: Enforce performance budgets in the CI/CD pipeline