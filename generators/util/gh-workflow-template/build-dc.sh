#!/usr/bin/env bash

echo "===> Create Intention"
# Start with empty actions array, then add one action per service
cat ./.github/workflows/build-dc.json | jq "\
    .event.reason=\"${EVENT_REASON}\" | \
    .event.url=\"https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}\" | \
    .actions = [] \
    " > intention.json

<%_ for (const service of services) { _%>
# Add action for <%= service.serviceName %>
jq "\
    .actions += [{
      \"action\": \"package-build\",
      \"id\": \"dcbuild_<%= service.index %>\",
      \"provision\": [],
      \"service\": {
        \"project\": \"<%= service.projectName %>\",
        \"name\": \"<%= service.serviceName %>\",
        \"environment\": \"tools\"
      },
      \"package\": {
        \"category\": \"infrastructure\",
        \"version\": \"${PACKAGE_VERSION}\",
        \"buildGuid\": \"${PACKAGE_BUILD_GUID}\",
        \"buildVersion\": \"${PACKAGE_BUILD_VERSION}\",
        \"buildNumber\": ${PACKAGE_BUILD_NUMBER},
        \"name\": \"<%= service.serviceName %>-dc\",
        \"type\": \"oci-archive\",
        \"license\": \"<%= license %>\"
      }
    }] \
    " intention.json > intention.tmp && mv intention.tmp intention.json

<%_ } _%>