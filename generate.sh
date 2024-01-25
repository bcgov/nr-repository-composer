#!/usr/bin/env bash

# Build the image
podman build -t nr-pipeline-template .

# Run the container
podman run -it --name nr-pipeline-template nr-pipeline-template

# Copy the generated files
podman cp --overwrite nr-pipeline-template:/home/node/app/.github .
podman cp --overwrite nr-pipeline-template:/home/node/app/.jenkins .
podman cp --overwrite nr-pipeline-template:/home/node/app/generator-nr-pipeline-template/.yo-rc.json generator-nr-pipeline-template

# Remove container
podman container rm nr-pipeline-template
