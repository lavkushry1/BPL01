#!/bin/bash
# scan-vulnerabilities.sh - Script to scan the project for vulnerabilities
# This script can be run locally or in CI/CD pipelines

set -e

echo "Starting vulnerability scanning at $(date)"

# Function to check if command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Ensure we have the tools we need
if ! command_exists trivy; then
  echo "Installing Trivy..."
  curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
fi

if ! command_exists npm; then
  echo "Error: npm is required but not installed"
  exit 1
fi

# Perform npm audit
echo "Running npm audit..."
npm audit --production --json > npm-audit-results.json || true
echo "NPM audit completed, results saved to npm-audit-results.json"

# Run Trivy filesystem scan
echo "Running Trivy filesystem scan..."
trivy fs --exit-code 0 --severity HIGH,CRITICAL --output trivy-fs-results.json --format json . || true
echo "Trivy filesystem scan completed, results saved to trivy-fs-results.json"

# If we're running in a Docker environment, scan the image
if command_exists docker; then
  echo "Running Trivy image scan..."
  IMAGE_NAME="${IMAGE_NAME:-eventia-frontend:latest}"
  
  # Check if image exists
  if docker image inspect $IMAGE_NAME &>/dev/null; then
    trivy image --exit-code 0 --severity HIGH,CRITICAL --output trivy-image-results.json --format json $IMAGE_NAME || true
    echo "Trivy image scan completed, results saved to trivy-image-results.json"
  else
    echo "Image $IMAGE_NAME not found, skipping image scan"
  fi
fi

# Run dependency check for known vulnerabilities
echo "Running npm audit fix (dry run)..."
npm audit fix --dry-run

# Summary of findings
echo "============================================================"
echo "Vulnerability Scan Summary"
echo "============================================================"
echo "Scan completed at $(date)"

# Parse and display npm audit results
if [ -f npm-audit-results.json ]; then
  HIGH_VULNS=$(grep -c '"severity":"high"' npm-audit-results.json || echo 0)
  CRIT_VULNS=$(grep -c '"severity":"critical"' npm-audit-results.json || echo 0)
  echo "NPM Audit Results:"
  echo "- High severity vulnerabilities: $HIGH_VULNS"
  echo "- Critical severity vulnerabilities: $CRIT_VULNS"
fi

# Parse and display trivy results
if [ -f trivy-fs-results.json ]; then
  HIGH_VULNS=$(grep -c '"Severity":"HIGH"' trivy-fs-results.json || echo 0)
  CRIT_VULNS=$(grep -c '"Severity":"CRITICAL"' trivy-fs-results.json || echo 0)
  echo "Trivy Filesystem Scan Results:"
  echo "- High severity vulnerabilities: $HIGH_VULNS"
  echo "- Critical severity vulnerabilities: $CRIT_VULNS"
fi

if [ -f trivy-image-results.json ]; then
  HIGH_VULNS=$(grep -c '"Severity":"HIGH"' trivy-image-results.json || echo 0)
  CRIT_VULNS=$(grep -c '"Severity":"CRITICAL"' trivy-image-results.json || echo 0)
  echo "Trivy Image Scan Results:"
  echo "- High severity vulnerabilities: $HIGH_VULNS"
  echo "- Critical severity vulnerabilities: $CRIT_VULNS"
fi

echo "============================================================"
echo "For detailed information, review the JSON result files"
echo "To fix vulnerabilities, run: npm audit fix"
echo "============================================================"

exit 0 