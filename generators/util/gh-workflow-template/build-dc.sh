#!/usr/bin/env bash

echo "===> Create Intention"
# Create intention
cat ./.github/workflows/build-dc.json | jq "\
    .event.reason=\"${EVENT_REASON}\" | \
    .event.url=\"https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}\" | \
    (.actions[] | select(.id == \"dcbuild\") .package.version) |= \"${PACKAGE_VERSION}\" | \
    (.actions[] | select(.id == \"dcbuild\") .package.buildGuid) |= \"${PACKAGE_BUILD_GUID}\" | \
    (.actions[] | select(.id == \"dcbuild\") .package.buildVersion) |= \"${PACKAGE_BUILD_VERSION}\" | \
    (.actions[] | select(.id == \"dcbuild\") .package.buildNumber) |= ${PACKAGE_BUILD_NUMBER} \
    " > intention.json