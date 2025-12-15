#!/usr/bin/env bash
set -euo pipefail

# Modify this to change the image version used
IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"

# Set to "false" to skip pulling the latest image (uses cached version)
PULL_IMAGE="true"

# NR Repository Composer runner script
# Usage: ./nr-repository-composer.sh <working-directory> <generator> [options...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check arguments
if [ $# -lt 2 ]; then
    echo "Usage: $0 <working-directory> <generator> [options...]"
    echo ""
    echo "Examples:"
    echo "  $0 /path/to/repo backstage"
    echo "  $0 . gh-maven-build --help"
    echo "  $0 ~/projects/my-app gh-nodejs-build --ask-answered"
    echo ""
    echo "Note: 'nr-repository-composer:' prefix is automatically added to the generator name"
    exit 1
fi

# Detect container runtime (prefer podman over docker)
if command -v podman &> /dev/null; then
    CONTAINER_CMD="podman"
elif command -v docker &> /dev/null; then
    CONTAINER_CMD="docker"
else
    echo "Error: Neither podman nor docker is installed or in PATH" >&2
    echo "Please install podman or docker to use this tool" >&2
    exit 1
fi

WORKING_DIR="$1"
GENERATOR="$2"
shift 2

# Prepend nr-repository-composer: to generator name if not already present
if [[ "$GENERATOR" != nr-repository-composer:* ]]; then
    GENERATOR="nr-repository-composer:$GENERATOR"
fi

# Resolve working directory to absolute path
if [ ! -d "$WORKING_DIR" ]; then
    echo "Error: Directory '$WORKING_DIR' does not exist" >&2
    exit 1
fi

WORKING_DIR="$(cd "$WORKING_DIR" && pwd)"

# Find git repository root by walking up the directory tree
find_git_root() {
    local dir="$1"
    while [ "$dir" != "/" ]; do
        if [ -d "$dir/.git" ]; then
            echo "$dir"
            return 0
        fi
        dir="$(dirname "$dir")"
    done
    return 1
}

GIT_ROOT=$(find_git_root "$WORKING_DIR") || true
if [ -z "$GIT_ROOT" ]; then
    echo "Error: No .git directory found in '$WORKING_DIR' or any parent directory" >&2
    echo "The composer must be run within a git repository" >&2
    exit 1
fi

# Calculate relative path from git root to working directory
RELATIVE_PATH="${WORKING_DIR#$GIT_ROOT}"
RELATIVE_PATH="${RELATIVE_PATH#/}"  # Remove leading slash if present

# Set container working directory
if [ -z "$RELATIVE_PATH" ]; then
    CONTAINER_WORKDIR="/src"
else
    CONTAINER_WORKDIR="/src/$RELATIVE_PATH"
fi

# Build container arguments
CONTAINER_ARGS="run --rm -it -v ${GIT_ROOT}:/src -w ${CONTAINER_WORKDIR}"

# Add container runtime specific arguments
if [ "$CONTAINER_CMD" = "podman" ]; then
    CONTAINER_ARGS="$CONTAINER_ARGS --userns keep-id"
    # Add pull policy for podman
    if [ "$PULL_IMAGE" = "true" ]; then
        CONTAINER_ARGS="$CONTAINER_ARGS --pull newer"
    fi
else
    # Docker: add pull policy
    if [ "$PULL_IMAGE" = "true" ]; then
        CONTAINER_ARGS="$CONTAINER_ARGS --pull always"
    fi
fi

# Run the container with any additional arguments passed to the script
exec $CONTAINER_CMD $CONTAINER_ARGS $IMAGE "$GENERATOR" "$@"
