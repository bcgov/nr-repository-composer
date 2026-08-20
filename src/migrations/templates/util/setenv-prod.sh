export VAULT_ADDR="https://knox.io.nrs.gov.bc.ca"
export VAULT_TOKEN=$(vault login -method=oidc -format json -tls-skip-verify | jq -r '.auth.client_token')