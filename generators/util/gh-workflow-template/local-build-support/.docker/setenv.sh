#!/usr/bin/env bash

# Vault server address
export VAULT_ADDR="https://knox.io.nrs.gov.bc.ca"

# Login locally (interactive or pre-configured OIDC)
export VAULT_TOKEN=$(vault login -method=oidc -tls-skip-verify -format=json | jq -r '.auth.client_token')

# Fetch Artifactory credentials
export ARTIFACTORY_USERNAME=$(vault kv get -field=artifactory_username apps/tools/oscar-example/java-maven-pipeline-example)
export ARTIFACTORY_PASSWORD=$(vault kv get -field=artifactory_password apps/tools/oscar-example/java-maven-pipeline-example)
