#!/bin/bash

SCRIPT_NAME="$(basename $0)"

print_usage() {
    echo "Usage: $SCRIPT_NAME [ -l | --list ] <organization>"
    echo "Example: $SCRIPT_NAME bcgov-c"
}

# Parse options
PARSED_OPTIONS=$(getopt -o l --long list -- "$@")
if [[ $? -ne 0 ]]; then
    print_usage
    exit 1;
fi

eval set -- "$PARSED_OPTIONS"

# Consume options
while :
do
    case "$1" in
        -l | --list) OPT_LIST=1; shift ;;
        --) shift; break ;;
        *) echo "Unexpected option: $1 - review $SCRIPT_NAME option parsing."; print_usage ;;
    esac
done

# Check if the required arguments are provided
if [[ -z "$1" ]]; then
    echo "$SCRIPT_NAME: missing <organization>"
    print_usage
    exit 1
fi

ORG="$1"
if [[ ! "$ORG" =~ ^(bcgov|bcgov-nr|bcgov-c)$ ]]; then
    echo "Error: Organization must be one of [bcgov, bcgov-nr, bcgov-c]"
    exit 1
fi

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
REPOS=$(gh api orgs/$ORG/repos --paginate --jq 'map(select(.archived == false)) | .[].name')

echo "Scanning repositories for catalog-info.yaml files with the annotation $ANNOTATION_KEY..."

for REPO in $REPOS; do
    # Skip repositories that do not start with "nr"
    if [[ ! $REPO =~ ^nr ]]; then
        echo "Skipping repository: $REPO"
        continue
    fi

    if [[ $OPT_LIST ]]; then
        ./composer-update-repo.sh "$ORG" "$REPO" --list
    else
        ./composer-update-repo.sh "$ORG" "$REPO"
    fi
done

echo "Scan complete."
