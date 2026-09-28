#!/bin/sh
# Container entrypoint for the NR Repository Composer.
#
# Default behaviour is a thin passthrough to `yo`. The `--all` mode re-runs
# every generator recorded in the repository's catalog-info.yaml files, using
# the `backstage-scan` generator for discovery so no `yq` (or any other host
# tooling) is required.
set -eu

REPO_ROOT="/src"
SCAN_GENERATOR="nr-repository-composer:backstage-scan"

if [ "${1:-}" != "--all" ]; then
    exec yo "$@"
fi
shift

TAB=$(printf '\t')
RECORDS=$(mktemp)
# shellcheck disable=SC2064
trap "rm -f '$RECORDS'" EXIT

# Discovery runs from the repository root so Location targets resolve.
cd "$REPO_ROOT"
yo "$SCAN_GENERATOR" --headless | grep "^COMPONENT${TAB}" > "$RECORDS" || true

if [ ! -s "$RECORDS" ]; then
    echo "No components found. Is there a catalog-info.yaml at the repository root?" >&2
    exit 1
fi

ran=0
failed=0

# Read from the file, not a pipe, so generators keep stdin for prompting.
while IFS="$TAB" read -r _tag name dir skip generators; do
    if [ "$skip" = "true" ]; then
        echo "Skipping $name ($dir): skipAutomatedScan is set"
        continue
    fi
    if [ -z "$generators" ]; then
        echo "Skipping $name ($dir): no generators recorded"
        continue
    fi

    for generator in $(echo "$generators" | tr ',' ' '); do
        ran=$((ran + 1))
        echo "Running $generator in $dir"
        # The loop reads records from a file, so restore the terminal as stdin
        # before starting an interactive Yeoman generator.
        if ! (cd "$REPO_ROOT/$dir" && yo "nr-repository-composer:$generator" "$@" < /dev/tty); then
            failed=$((failed + 1))
            echo "Generator $generator failed in $dir" >&2
        fi
    done
done < "$RECORDS"

if [ "$ran" -eq 0 ]; then
    echo "No generators recorded. Nothing to run."
    exit 0
fi

if [ "$failed" -gt 0 ]; then
    echo "$failed of $ran generator run(s) failed." >&2
    exit 1
fi

echo "Completed $ran generator run(s)."
