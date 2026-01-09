#!/usr/bin/env bash

# Exit on error
set -e

# Parse arguments
ENGINE="podman"
POM_PATH="./pom.xml"

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
    --pom=*)
      POM_PATH="${1#*=}"
      shift
      ;;
    --pom)
      POM_PATH="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 --engine=[docker|podman] [--pom=path/to/pom.xml]"
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

# Source environment variables
source .docker/setenv.sh

MAVEN_IMAGE=maven:3.9.11-amazoncorretto-17

# Build command template
BUILD_CMD="$ENGINE run --rm \
  -v ${PWD}:/workspace \
  -w /workspace \
  -v ~/.m2:/root/.m2 \
  -v $(pwd)/.github/polaris-maven-settings.xml:/root/.m2/settings.xml:ro \
  -v $(pwd)/.m2repo:/m2repo \
  -e ARTIFACTORY_USERNAME=${ARTIFACTORY_USERNAME} \
  -e ARTIFACTORY_PASSWORD=${ARTIFACTORY_PASSWORD} \
  ${MAVEN_IMAGE} \
  mvn -B -DskipTests -Dmaven.repo.local=/m2repo -f \"${POM_PATH}\" install"

# Determine project directory from POM
PROJECT_DIR=$(dirname "$POM_PATH")

# Run the build
echo "Running build with $ENGINE..."
eval "$BUILD_CMD"

echo "Build completed using $ENGINE."

# If the project produced a WAR under ${PROJECT_DIR}/target, create run.sh (if missing)
TARGET_DIR="${PROJECT_DIR}/target"
if [ -d "$TARGET_DIR" ] && ls "$TARGET_DIR"/*.war >/dev/null 2>&1; then
  if [ ! -f run.sh ]; then
    cat > run.sh <<'RUNSH'
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
IMAGE_NAME="myapp"
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
  -f .docker/runtime/Dockerfile \
  -t myapp ."

# Run the build
echo "Running build with $ENGINE..."
eval "$BUILD_CMD"

echo "Build completed using $ENGINE."

# Run command template
RUN_CMD="$ENGINE run -d\
  -p ${PORT}:${PORT} \
  --name myapp \
  --replace \
  myapp"

# Run app
echo "Running image '$IMAGE_NAME'..."
eval "$RUN_CMD"
RUNSH
    chmod 755 run.sh
  fi
fi
