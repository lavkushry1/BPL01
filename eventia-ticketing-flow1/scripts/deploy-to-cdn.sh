#!/bin/bash

# Script for deploying frontend assets to CDN
# Usage: ./deploy-to-cdn.sh [environment]
# Example: ./deploy-to-cdn.sh production

set -e

# Default to production if no environment is specified
ENVIRONMENT=${1:-"production"}
valid_environments=("production" "staging" "development")

# Validate environment
valid_env=false
for env in "${valid_environments[@]}"; do
  if [[ "$ENVIRONMENT" == "$env" ]]; then
    valid_env=true
    break
  fi
done

if [[ "$valid_env" == false ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'. Valid options are: ${valid_environments[*]}"
  exit 1
fi

# Load environment variables from .env.${ENVIRONMENT}
if [[ -f ".env.${ENVIRONMENT}" ]]; then
  echo "Loading environment variables from .env.${ENVIRONMENT}"
  export $(grep -v '^#' .env.${ENVIRONMENT} | xargs)
else
  echo "Warning: .env.${ENVIRONMENT} file not found. Using existing environment variables."
fi

# Check for required environment variables
required_vars=("AWS_S3_BUCKET" "AWS_CLOUDFRONT_DISTRIBUTION_ID")
for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "Error: Required environment variable $var is not set."
    exit 1
  fi
done

# Build the application
echo "Building application for ${ENVIRONMENT}..."
npm run build

# Check if build was successful
if [[ ! -d "dist" ]]; then
  echo "Error: Build failed. 'dist' directory not found."
  exit 1
fi

# Upload to S3
echo "Uploading to S3 bucket: ${AWS_S3_BUCKET}..."

# Upload HTML files with cache-control headers
aws s3 sync dist s3://${AWS_S3_BUCKET} \
  --exclude "*" \
  --include "*.html" \
  --cache-control "public, max-age=300" \
  --acl public-read

# Upload service worker with no-cache headers
aws s3 sync dist s3://${AWS_S3_BUCKET} \
  --exclude "*" \
  --include "sw.js" \
  --cache-control "public, max-age=0, must-revalidate" \
  --acl public-read

# Upload hashed assets with long-term caching
aws s3 sync dist s3://${AWS_S3_BUCKET} \
  --exclude "*" \
  --include "*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].*" \
  --cache-control "public, max-age=31536000, immutable" \
  --acl public-read

# Upload remaining files with default cache settings
aws s3 sync dist s3://${AWS_S3_BUCKET} \
  --exclude "*.html" \
  --exclude "sw.js" \
  --exclude "*.[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f].*" \
  --cache-control "public, max-age=86400" \
  --acl public-read

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache for distribution: ${AWS_CLOUDFRONT_DISTRIBUTION_ID}..."
aws cloudfront create-invalidation \
  --distribution-id ${AWS_CLOUDFRONT_DISTRIBUTION_ID} \
  --paths "/index.html" "/sw.js" "/*"

echo "Deployment to ${ENVIRONMENT} CDN completed successfully!"
echo "Please allow a few minutes for the CloudFront invalidation to complete."