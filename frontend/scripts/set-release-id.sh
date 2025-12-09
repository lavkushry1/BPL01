#!/bin/bash
# set-release-id.sh - Script to generate a unique release ID for builds
# This script should be run before building Docker images

set -e

# Generate a timestamp-based release ID
RELEASE_ID=$(date +%Y%m%d%H%M%S)

# Generate a short git hash if git is available
if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
  GIT_HASH=$(git rev-parse --short HEAD)
  RELEASE_ID="${RELEASE_ID}-${GIT_HASH}"

  # Add dirty flag if there are uncommitted changes
  if ! git diff-index --quiet HEAD --; then
    RELEASE_ID="${RELEASE_ID}-dirty"
  fi
fi

# Write the release ID to a file for Docker builds
echo "VITE_RELEASE_ID=${RELEASE_ID}" > .env.release
echo "BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> .env.release

echo "Generated release ID: ${RELEASE_ID}"
echo "Release information written to .env.release"

# Export for shell usage
export VITE_RELEASE_ID="${RELEASE_ID}"

exit 0 