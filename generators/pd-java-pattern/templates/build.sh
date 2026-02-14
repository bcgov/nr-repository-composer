#!/usr/bin/env bash

# Exit on error
set -e

# Parse arguments
ENGINE="podman"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --engine=*)
      ENGINE="${1#*=}"
      shift
      ;;
    --engine)
      ENGINE="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 --engine=[docker|podman]"
      exit 1
      ;;
  esac
done

if [[ -z "$ENGINE" ]]; then
  echo "Error: --engine argument is required (docker or podman)"
  exit 1
fi

if [[ "$ENGINE" != "docker" && "$ENGINE" != "podman" ]]; then
  echo "Error: ENGINE must be 'docker' or 'podman'"
  exit 1
fi

# PROJECT_DIR is the directory where this script is located
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "Determined PROJECT_DIR: $PROJECT_DIR"

# Read values from catalog-info.yaml
CATALOG_FILE="${PROJECT_DIR}/catalog-info.yaml"
if [[ ! -f "$CATALOG_FILE" ]]; then
  CATALOG_FILE="catalog-info.yaml"
fi

if [[ -f "$CATALOG_FILE" ]]; then
  PROJECT_NAME=$(grep "name:" "$CATALOG_FILE" | head -1 | sed 's/.*name: *//; s/ *#.*//')
  SERVICE_NAME=$(grep "system:" "$CATALOG_FILE" | head -1 | sed 's/.*system: *//; s/ *#.*//')
  POM_ROOT=$(grep "playbook.io.nrs.gov.bc.ca/pomRoot:" "$CATALOG_FILE" | sed 's/.*pomRoot: *//; s/ *#.*//' | tr -d '"')
  JAVA_VERSION=$(grep "playbook.io.nrs.gov.bc.ca/javaVersion:" "$CATALOG_FILE" | sed 's/.*javaVersion: *//; s/ *#.*//' | tr -d '"')
else
  echo "Warning: catalog-info.yaml not found, using defaults"
  PROJECT_NAME="unknown"
  SERVICE_NAME="unknown"
  POM_ROOT=""
  JAVA_VERSION="17"
fi

# Normalize POM_ROOT: remove leading ./ and trailing /
POM_ROOT="${POM_ROOT#./}"
POM_ROOT="${POM_ROOT%/}"

# Source environment variables if available
if [[ -f "$PROJECT_DIR/.docker/setenv.sh" ]]; then
  source $PROJECT_DIR/.docker/setenv.sh ${PROJECT_NAME} ${SERVICE_NAME}
fi

# Use Java version from catalog or default to 17
JAVA_VERSION="${JAVA_VERSION:-17}"
MAVEN_IMAGE="maven:3.9.11-amazoncorretto-${JAVA_VERSION}"

# Compute git root for other volume mounts
GIT_ROOT=$(cd "$(git rev-parse --show-toplevel 2>/dev/null || echo "$PWD")" && pwd)

# POM_PATH_CONTAINER is relative to PROJECT_DIR which is mounted as /workspace
if [[ -z "$POM_ROOT" ]]; then
  POM_PATH_CONTAINER="pom.xml"
else
  POM_PATH_CONTAINER="${POM_ROOT}/pom.xml"
fi

# Build command template
BUILD_CMD="$ENGINE run --rm \
  -v ${PROJECT_DIR}:/workspace \
  -w /workspace \
  -v ~/.m2:/root/.m2 \
  -v ${GIT_ROOT}/.github/polaris-maven-settings.xml:/root/.m2/settings.xml:ro \
  -v ${GIT_ROOT}/.m2repo:/m2repo \
  -e ARTIFACTORY_USERNAME=${ARTIFACTORY_USERNAME} \
  -e ARTIFACTORY_PASSWORD=${ARTIFACTORY_PASSWORD} \
  ${MAVEN_IMAGE} \
  mvn -B -DskipTests -Dmaven.repo.local=/m2repo -f \"${POM_PATH_CONTAINER}\" install"

# Run the build
echo "Running build with $ENGINE..."
eval "$BUILD_CMD"

echo "Build completed using $ENGINE."