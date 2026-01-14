#!/usr/bin/env bash

# Exit on error
set -e

# Check arguments
if [ $# -lt 1 ]; then
  echo "Usage: $0 [docker|podman]"
  exit 1
fi

ENGINE=$1
shift

POM_PATH="./pom.xml"
IMAGE_NAME="<%= serviceName %>-image"
CONTAINER_NAME="<%=serviceName %>-app"
PORT=${PORT:-8080}

# Parse optional flags (only --pom supported)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pom=*)
      POM_PATH="${1#*=}"
      shift
      ;;
    --pom)
      POM_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 ENGINE [--pom=path/to/pom.xml]"
      exit 1
      ;;
  esac
done

# Validate engine
if [[ "$ENGINE" != "docker" && "$ENGINE" != "podman" ]]; then
  echo "Error: ENGINE must be 'docker' or 'podman'"
  exit 1
fi

PROJECT_DIR=$(dirname "$POM_PATH")
echo "Determined PROJECT_DIR: $PROJECT_DIR"

# Build command template
BUILD_CMD="$ENGINE build --build-arg PROJECT_DIR=\"$PROJECT_DIR\" \
  -f $PROJECT_DIR/.docker/runtime/Dockerfile \
  -t $IMAGE_NAME ."

# Run the build
echo "Running build with $ENGINE..."
eval "$BUILD_CMD"

echo "Build completed using $ENGINE."

# Run command template
RUN_CMD="$ENGINE run -d\
  -p ${PORT}:${PORT} \
  --name $CONTAINER_NAME \
  --replace \
  $IMAGE_NAME"

# Run app
echo "Running image '$IMAGE_NAME'..."
eval "$RUN_CMD"
