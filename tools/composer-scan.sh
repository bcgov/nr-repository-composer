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
REPOS=$(gh repo list $ORG --limit 1000 --json name --jq '.[].name')

echo "Scanning repositories for catalog-info.yaml files with the annotation $ANNOTATION_KEY..."

for REPO in $REPOS; do
    # Skip repositories that do not start with "nr"
    if [[ ! $REPO =~ ^nr ]]; then
        echo "Skipping repository: $REPO"
        continue
    fi

    echo "Checking repository: $REPO"
    FILE_URL="https://raw.githubusercontent.com/$ORG/$REPO/main/catalog-info.yaml"

    # Fetch the catalog-info.yaml file with authentication
    RESPONSE=$(curl -s -f -H "Authorization: token $TOKEN" "$FILE_URL")
    if [[ $? -ne 0 ]]; then
        echo "  No catalog-info.yaml found in $REPO"
        continue
    fi

    # Extract the annotation value using yq
    ANNOTATION_VALUE=$(echo "$RESPONSE" | yq eval ".metadata.annotations.\"$ANNOTATION_KEY\"" -)

    if [[ -n "$ANNOTATION_VALUE" && "$ANNOTATION_VALUE" != "null" ]]; then
        echo "  Found annotation in $REPO: $ANNOTATION_VALUE"

        # Clone the repository
        echo "  Cloning repository: $REPO"
        gh repo clone "$ORG/$REPO" "$REPO" -- -q
        cd $REPO

        # Split annotation value on comma and loop through values
        IFS=',' read -ra VALUES <<< "$ANNOTATION_VALUE"
        for VALUE in "${VALUES[@]}"; do
          echo "    - $VALUE"
          git reset --hard
          docker pull ghcr.io/bcgov/nr-repository-composer:latest
          docker run --rm -v ${PWD}:/src ghcr.io/bcgov/nr-repository-composer:latest -- nr-repository-composer:"$VALUE" --promptless --force --headless
          if [[ $? -ne 0 ]]; then
              echo "    ⚠️ Error running Docker command for $VALUE in $REPO"

              # Create a GitHub issue
              gh issue create --repo "$ORG/$REPO" --title "Composer [$VALUE]: Out of date" \
                  --body "This composer must be run manually to update it. Please see instructions."
          else
            if [[ -n "$(git status --porcelain)" ]]; then
              BRANCH_NAME="update-generated-files-$VALUE"
              git checkout -b "$BRANCH_NAME"
              git add .
              git commit -m "Automated update of generated files for $gen"
              git push origin "$BRANCH_NAME"
              gh pr create --base main --head "$BRANCH_NAME" --title "Automated update of generated files for $VALUE" --body "This PR contains updates to generated files for $VALUE."
            fi
          fi
        done
        cd ..

        # Delete the cloned repository after processing
        # echo "  Deleting cloned repository: $REPO"
        # rm -rf "$REPO"
    else
        echo "  Annotation not found in $REPO"
    fi

done

echo "Scan complete."
