#!/usr/bin/env bash

# Build the image
podman build --pull=newer -t nr-repository-composer .
