#!/usr/bin/env bash

echo "===> Create Intention"
# Create intention
cat ./.github/workflows/build-intention.json | jq "\
    .event.url=\"https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}\" | \
    (.actions[] | select(.id == \"build\") .service.project) |= \"${SERVICE_PROJECT}\" | \
    (.actions[] | select(.id == \"build\") .service.name) |= \"${SERVICE_NAME}\" | \
    (.actions[] | select(.id == \"build\") .package.version) |= \"${PROJECT_VERSION}\" | \
    (.actions[] | select(.id == \"build\") .package.buildVersion) |= \"${GIT_COMMIT}\" | \
    (.actions[] | select(.id == \"build\") .package.buildNumber) |= ${BUILD_NUMBER} \
    " > intention.json