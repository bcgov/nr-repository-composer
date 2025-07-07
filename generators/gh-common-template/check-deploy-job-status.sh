#!/bin/bash
set -e

# Use the timestamp from the previous step
GH_TASK_START="${GH_TASK_START}"
echo "Current GitHub task start: $GH_TASK_START"
sleep 30
MAX_WAIT=30

# Wait for the Jenkins deployment job to be triggered (max 90s)
for ((i=1; i<=MAX_WAIT; i++)); do
  RESPONSE=$(curl -s -X 'POST' \
    "${BROKER_URL}/v1/intention/search?where=%7B%22actions.action%22%3A%22${ACTION_NAME}%22%2C%22actions.service.project%22%3A%22${SERVICE_PROJECT}%22%2C%22actions.service.name%22%3A%22${SERVICE_NAME}%22%2C%22event.provider%22%3A%22${PROVIDER_NAME}%22%7D&offset=0&limit=1" \
    -H 'accept: application/json' \
    -H 'Authorization: Bearer '"${BROKER_JWT}"'' \
    -d '')
  TX_START=$(echo "$RESPONSE" | jq -r '.data[0].transaction.start // empty')
  if [[ -n "$TX_START" && "$TX_START" > "$GH_TASK_START" ]]; then
    echo "Found triggered job with transaction.start: $TX_START"
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    echo "Error: Deployment job was not triggered within MAX WAITING $((MAX_WAIT*5)) seconds."
    exit 1
  fi
  echo "Waiting for deployment job to be triggered..."
  sleep 5
done

# Wait for the deployment job to be closed (completed)
for ((i=1; i<=MAX_WAIT; i++)); do
  RESPONSE=$(curl -s -X 'POST' \
    "${BROKER_URL}/v1/intention/search?where=%7B%22actions.action%22%3A%22${ACTION_NAME}%22%2C%22actions.service.project%22%3A%22${SERVICE_PROJECT}%22%2C%22actions.service.name%22%3A%22${SERVICE_NAME}%22%2C%22event.provider%22%3A%22${PROVIDER_NAME}%22%7D&offset=0&limit=1" \
    -H 'accept: application/json' \
    -H 'Authorization: Bearer '"${BROKER_JWT}"'' \
    -d '')
  CLOSED=$(echo "$RESPONSE" | jq -r '.data[0].closed // false')
  if [[ "$CLOSED" == "true" ]]; then
    echo "Deployment job is closed."
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    echo "Error: Deployment job could not complete within $((MAX_WAIT*10)) seconds."
    exit 1
  fi
  echo "Deployment job still running... waiting 10s"
  sleep 10
done

# Check the outcome
STATUS=$(echo "$RESPONSE" | jq -r '.data[0].transaction.outcome // empty')
echo "status=$STATUS" >> $GITHUB_OUTPUT
if [[ "$STATUS" != "success" ]]; then
  echo "Deployment outcome is not success: $STATUS"
  exit 1
fi
