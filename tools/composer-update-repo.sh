#!/bin/bash

# Check if the required arguments are provided
if [[ -z "$1" || -z "$2" ]]; then
    echo "Usage: $0 <organization> <repository>"
    echo "Example: $0 bcgov-c nr-msd"
    exit 1
fi

ORG=$1
if [[ ! "$ORG" =~ ^(bcgov|bcgov-nr|bcgov-c)$ ]]; then
    echo "Error: Organization must be one of [bcgov, bcgov-nr, bcgov-c]"
    exit 1
fi
CONTAINER_IMAGE="ghcr.io/bcgov/nr-repository-composer:latest"
#CONTAINER_IMAGE="nr-repository-composer"
ANNOTATION_KEY="composer.io.nrs.gov.bc.ca/generators"
SKIP_KEY="composer.io.nrs.gov.bc.ca/skipAutomatedScan"
REPO=$2

# Check dependencies
if ! command yq > /dev/null 2>&1; then
  echo "Unable to find yq dependency."
  exit 1
fi

# Check git user.name
if { ! { git config --global user.name &>/dev/null ;} ;} \
  && { [ -z "$GIT_AUTHOR_NAME" ] || [ -z "$GIT_COMMITTER_NAME" ] ;}; then
  echo 'Git user is not configured for committing.'
  echo 'Please set `git config --global user.name` or use both environment variables `GIT_AUTHOR_NAME` and `GIT_COMMITTER_NAME`'
  exit 1
fi

# Check git user.email
if { ! { git config --global user.email &>/dev/null ;} ;} \
  && { [ -z "$GIT_AUTHOR_EMAIL" ] || [ -z "$GIT_COMMITTER_EMAIL" ] ;}; then
  echo 'Git email is not configured for committing.'
  echo 'Please set `git config --global user.email` or use both environment variables `GIT_AUTHOR_EMAIL` and `GIT_COMMITTER_EMAIL`'
  exit 1
fi

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
# REPOS=$(gh repo list $ORG --limit 1000 --json name --jq '.[].name')

echo "Scanning repository $REPO..."


if [[ ! $REPO =~ ^nr ]]; then
    echo "Skipping repository: $REPO"
    exit 0
fi

echo "Checking repository: $REPO"
FILE_URL="https://raw.githubusercontent.com/$ORG/$REPO/main/catalog-info.yaml"

# Fetch the catalog-info.yaml file with authentication
RESPONSE=$(curl -s -f -H "Authorization: token $TOKEN" "$FILE_URL")
if [[ $? -ne 0 ]]; then
    echo "  No catalog-info.yaml found in $REPO"
    continue
fi

# Check if kind is Location
KIND=$(echo "$RESPONSE" | yq eval ".kind" -)
TARGETS="catalog-info.yaml"

if [[ "$KIND" == "Location" ]]; then
    echo "  catalog-info.yaml kind is 'Location'. Processing multiple targets..."

    TARGETS=$(echo "$RESPONSE" | yq eval '.spec.targets[]' -)
    echo "  Found targets: $TARGETS"
fi

echo "  Cloning repository: $REPO"

if gh repo clone "$ORG/$REPO" "$REPO" -- -q; then
  cd "$REPO"
else
  echo "  ❌ Failed cloning repository: $REPO"
  exit 1
fi

gh_create_issue_idempotent () {
  EXISTING_ISSUES=$(gh api "repos/$ORG/$REPO/issues" --paginate --jq "map(select(.title == \"$1\" and .body == \"$2\")) | .[].number")
  if [ -z "$EXISTING_ISSUES" ]; then
    gh issue create --repo "$ORG/$REPO" --title "$1" --body "$2"
  else
    for ISSUE_NUMBER in $EXISTING_ISSUES; do
      echo "    ⚠️ Existing issue: https://github.com/$ORG/$REPO/issues/$ISSUE_NUMBER"
    done
  fi

}

for TARGET_FILE in $TARGETS; do
    echo "  ➤ Processing target: $TARGET_FILE"

    git reset --hard
    git clean -fd

    if [[ ! -f "$TARGET_FILE" ]]; then
        echo "    ❌ File not found: $TARGET_FILE"

        ISSUE_TITLE="Backstage location target not found: $TARGET_FILE"
        ISSUE_BODY="When scanning this repository, we encountered an invalid reference to a file in the root catalog file. The file '$TARGET_FILE' does not exist. Please update this reference."

        gh_create_issue_idempotent "$ISSUE_TITLE" "$ISSUE_BODY"
        continue
    fi

    TARGET_ANNOTATION=$(yq eval ".metadata.annotations.\"$ANNOTATION_KEY\"" "$TARGET_FILE")
    TARGET_SERVICE=$(yq eval ".metadata.name" "$TARGET_FILE")
    TARGET_SKIP=$(yq eval ".metadata.annotations.\"$SKIP_KEY\"" "$TARGET_FILE")

    if [[ -z "$TARGET_ANNOTATION" || "$TARGET_ANNOTATION" == "null" ]]; then
        echo "    ⚠️ Annotation not found in $TARGET_FILE"
        continue
    elif [[ -n "$TARGET_SKIP" && "$TARGET_SKIP" == "true" ]]; then
        echo "    ⚠️ Skip annotation found in $TARGET_FILE"
        continue
    fi

    IFS=',' read -ra VALUES <<< "$TARGET_ANNOTATION"
    for VALUE in "${VALUES[@]}"; do
        echo "    🎯 Running generator: $VALUE"
        git reset --hard > /dev/null
        git clean -fd > /dev/null
        podman pull $CONTAINER_IMAGE
        podman run --rm -v "${PWD}:/src" -w "/src/$(dirname $TARGET_FILE)" -u "$(id -u):$(id -g)" --userns=keep-id --entrypoint yo $CONTAINER_IMAGE nr-repository-composer:"$VALUE" --headless --force

        if [[ $? -ne 0 ]]; then
            echo "    ⚠️ Docker failed for $VALUE"

            ISSUE_TITLE="Composer [$VALUE]: Out of date"
            ISSUE_BODY="This composer must be run manually to update it. Please see [instructions](https://github.com/bcgov/nr-repository-composer/blob/main/README.md) for the composer to run the $VALUE generator."

            gh_create_issue_idempotent "$ISSUE_TITLE" "$ISSUE_BODY"
        else
            if [[ -n "$(git status --porcelain)" ]]; then
                BRANCH_NAME="composer/update-${TARGET_SERVICE}-${VALUE}"
                echo "    🪄 Creating branch: $BRANCH_NAME"
                git checkout -b "$BRANCH_NAME"
                git add .
                git commit -m "Chore: Automated update of composer files for $TARGET_SERVICE : $VALUE ($TARGET_FILE)"
                git push origin "$BRANCH_NAME"
                gh pr create --base main --head "$BRANCH_NAME" \
                    --title "Update generated files for $TARGET_SERVICE : $VALUE ($TARGET_FILE)" \
                    --body "This PR updates generated files for $TARGET_SERVICE using the $VALUE generator from $TARGET_FILE."
            else
                echo "    ✅ No changes detected for $VALUE"
            fi
        fi
    done
done

cd ..
echo "  Deleting cloned repository: $REPO"
rm -rf "$REPO"

echo "Scan complete."
