#!/usr/bin/env bash

export PROJECT_NAME=$1
export SERVICE_NAME=$2

# Vault server address
export VAULT_ADDR="https://knox.io.nrs.gov.bc.ca"

# Login locally (interactive or pre-configured OIDC)
export VAULT_TOKEN=$(vault login -method=oidc -tls-skip-verify -format=json | jq -r '.auth.client_token')

# Fetch Artifactory credentials
export ARTIFACTORY_USERNAME=$(vault kv get -field=artifactory_username "apps/tools/${PROJECT_NAME}/${SERVICE_NAME}")
export ARTIFACTORY_PASSWORD=$(vault kv get -field=artifactory_password "apps/tools/${PROJECT_NAME}/${SERVICE_NAME}")