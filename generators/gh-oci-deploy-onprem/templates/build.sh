#!/bin/bash

# Default values
ENGINE="podman"  # Default to podman
REGISTRY_NAME="local-registry"
PORT=5000
TAG="v1.0.0"
REPO="node-app"

# Function to show usage
usage() {
    echo "Usage: $0 [--engine docker|podman]"
    exit 1
}

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --engine) ENGINE="$2"; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown parameter: $1"; usage ;;
    esac
    shift
done

echo "Using engine: $ENGINE"

# --- Step 1: Check if Engine is running ---
if ! $ENGINE info >/dev/null 2>&1; then
    echo "Error: $ENGINE is not running. Please start the $ENGINE daemon/service."
    exit 1
fi

# --- Step 2: Ensure Local Registry is running ---
# We check for the container name and start it if it exists but is stopped, 
# or run a new one if it doesn't exist at all.
if ! $ENGINE ps -a --format "{{.Names}}" | grep -q "^${REGISTRY_NAME}$"; then
    echo "Creating new local registry using $ENGINE..."
    # Note: Using full docker.io path for registry:2 for better Podman compatibility
    $ENGINE run -d -p ${PORT}:5000 --name ${REGISTRY_NAME} docker.io/library/registry:2
elif ! $ENGINE ps --format "{{.Names}}" | grep -q "^${REGISTRY_NAME}$"; then
    echo "Starting existing local registry..."
    $ENGINE start ${REGISTRY_NAME}
else
    echo "Local registry is already running."
fi

# --- Step 3: Build Node.js locally ---
echo "Running local build..."
npm ci
npm run build

# --- Step 4: Push to Registry via ORAS ---
ARTIFACT_URL="localhost:${PORT}/${REPO}:${TAG}"
echo "Publishing artifact to $ARTIFACT_URL..."

# Pushing multiple layers: dist, node_modules, and metadata files
oras push --plain-http \
    --export-manifest manifest.json \
    $ARTIFACT_URL \
    ./dist:application/vnd.oci.image.layer.v1.tar+gzip \
    ./node_modules:application/vnd.oci.image.layer.v1.tar+gzip \
    package.json:application/json \
    package-lock.json:application/json

echo "Success! Your artifact is ready for the Tomcat container."