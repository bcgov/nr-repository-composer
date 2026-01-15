#!/bin/bash
# deploy.sh

IMAGE_NAME="<%= serviceName %>-image"
CONTAINER_NAME="<%=serviceName %>-app"
ENGINE="podman" # Change to docker if needed

echo "--- Rebuilding Container Image ---"
$ENGINE build -t $IMAGE_NAME -f ./.docker/runtime/Dockerfile .

echo "--- Stopping and Removing Old Container ---"
$ENGINE rm -f $CONTAINER_NAME 2>/dev/null || true

echo "--- Starting New Container ---"
$ENGINE run -d \
  --name $CONTAINER_NAME \
  -p 3000:3000 \
  --add-host=host.docker.internal:host-gateway \
  $IMAGE_NAME

echo "--- Deployment Complete ---"
$ENGINE ps | grep $CONTAINER_NAME