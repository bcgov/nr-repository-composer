#!/usr/bin/env bash
set -euo pipefail

# Modify this to change the image version used
IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"

# NR Repository Composer runner script
# Usage: ./nr-repository-composer.sh <podman|docker> <working-directory> [generator] [options...]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check arguments
if [ $# -lt 3 ]; then
    echo "Usage: $0 <podman|docker> <working-directory> <generator> [options...]"
    echo ""
    echo "Examples:"
    echo "  $0 podman /path/to/repo backstage"
    echo "  $0 docker . gh-maven-build --help"
    echo "  $0 podman ~/projects/my-app gh-nodejs-build --ask-answered"
    echo ""
    echo "Note: 'nr-repository-composer:' prefix is automatically added to the generator name"
    exit 1
fi

CONTAINER_CMD="$1"
WORKING_DIR="$2"
GENERATOR="$3"
shift 3

# Prepend nr-repository-composer: to generator name if not already present
if [[ "$GENERATOR" != nr-repository-composer:* ]]; then
    GENERATOR="nr-repository-composer:$GENERATOR"
fi

# Validate container command
if [ "$CONTAINER_CMD" != "podman" ] && [ "$CONTAINER_CMD" != "docker" ]; then
    echo "Error: First argument must be 'podman' or 'docker'"
    exit 1
fi

# Check if container command exists
if ! command -v "$CONTAINER_CMD" &> /dev/null; then
    echo "Error: $CONTAINER_CMD is not installed or not in PATH"
    exit 1
fi

# Resolve working directory to absolute path
if [ ! -d "$WORKING_DIR" ]; then
    echo "Error: Directory '$WORKING_DIR' does not exist"
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

GIT_ROOT=$(find_git_root "$WORKING_DIR")
if [ -z "$GIT_ROOT" ]; then
    echo "Error: No .git directory found in '$WORKING_DIR' or any parent directory"
    echo "The composer must be run within a git repository"
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

# Add userns keep-id for podman (better file permissions)
if [ "$CONTAINER_CMD" = "podman" ]; then
    CONTAINER_ARGS="$CONTAINER_ARGS --userns keep-id"
fi

# Run the container with any additional arguments passed to the script
exec $CONTAINER_CMD $CONTAINER_ARGS $IMAGE "$GENERATOR" "$@"
