#!/bin/bash

ORG="bcgov-c"
ANNOTATION_KEY="composer.io.nrs.gov.bc.ca/generators"

# Check if already logged in
echo "Checking GitHub CLI authentication..."
if ! gh auth status &>/dev/null; then
    echo "Logging into GitHub CLI..."
    gh auth login
else
    echo "Already logged into GitHub CLI."
fi

# Get the authenticated user token
TOKEN=$(gh auth token)

# Get all repositories in the organization
REPOS=$(gh api orgs/$ORG/repos --paginate | jq --raw-output 'map(select(.archived == false)) | .[].name')

echo "Scanning repositories for catalog-info.yaml files with the annotation $ANNOTATION_KEY..."

for REPO in $REPOS; do
    # Skip repositories that do not start with "nr"
    if [[ ! $REPO =~ ^nr ]]; then
        echo "Skipping repository: $REPO"
        continue
    fi

   ./composer-update-repo.sh "$ORG" "$REPO"
done

echo "Scan complete."
