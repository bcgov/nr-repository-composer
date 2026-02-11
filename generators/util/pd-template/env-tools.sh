#!/usr/bin/env bash

# Check for --skip-vault flag
SKIP_VAULT=false
if [[ "${1:-}" == "--skip-vault" ]]; then
  SKIP_VAULT=true
fi

export PROJECT_NAME="<%= projectName %>"
export SERVICE_NAME="<%= serviceName %>"

<% if (pomRoot) { -%>
export POM_ROOT="<%= pomRoot %>"
<% } -%>

# Only fetch vault secrets if --skip-vault is not set
if [[ "$SKIP_VAULT" == false ]]; then
<% if (toolsBuildSecrets) { for (const secret of toolsBuildSecrets.split(',')) { -%>
  export <%= secret.toUpperCase() %>=$(vault kv get -field=<%= secret.toLowerCase() %> "apps/tools/${PROJECT_NAME}/${SERVICE_NAME}")
<% } } -%>
fi