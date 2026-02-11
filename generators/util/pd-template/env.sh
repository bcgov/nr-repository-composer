#!/usr/bin/env bash

# Optional: Path parameter
TARGET_PATH="${1:-.}"

# Check for --skip-vault flag
SKIP_VAULT=false
if [[ "$TARGET_PATH" == "--skip-vault" ]]; then
  SKIP_VAULT=true
  TARGET_PATH="${2:-.}"
fi

# Check if catalog-info.yaml exists
CATALOG_FILE="${TARGET_PATH}/catalog-info.yaml"
if [[ ! -f "$CATALOG_FILE" ]]; then
  echo "Error: catalog-info.yaml not found at ${TARGET_PATH}" >&2
  return 1 2>/dev/null || exit 1
fi

# Check if kind is Component
KIND=$(grep "^kind:" "$CATALOG_FILE" | head -1 | sed 's/\w*kind: *//; s/ *#.*//')
if [[ "$KIND" != "Component" ]]; then
  echo "Error: catalog-info.yaml kind is '${KIND}', expected 'Component'" >&2
  return 1 2>/dev/null || exit 1
fi

export VAULT_ADDR="https://knox.io.nrs.gov.bc.ca"
# Check if VAULT_TOKEN is already valid, otherwise login (unless --skip-vault)
if [[ "$SKIP_VAULT" == false ]]; then
  if [[ -z "${VAULT_TOKEN:-}" ]] || ! vault token lookup &>/dev/null 2>&1; then
    export VAULT_TOKEN=$(vault login -method=oidc -format json 2>/dev/null | jq -r '.auth.client_token')
  fi
fi

# Source .vault-tools.env from target path if it exists
VAULT_TOOLS_ENV="${TARGET_PATH}/env-tools.sh"
if [[ -f "$VAULT_TOOLS_ENV" ]]; then
  if [[ "$SKIP_VAULT" == true ]]; then
    source "$VAULT_TOOLS_ENV" --skip-vault
  else
    source "$VAULT_TOOLS_ENV"
  fi
fi
