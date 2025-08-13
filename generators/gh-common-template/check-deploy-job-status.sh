#!/bin/bash
set -e

# Use the timestamp from the previous step
GH_TASK_START="${GH_TASK_START}"
echo "Current GitHub task start: $GH_TASK_START"
sleep 30
MAX_WAIT=30

TRIGGER_ID=$(echo -n "${SERVICE_NAME} ${GITHUB_RUN_ID}" | jq -sRr @uri)

QUERY_URL="${BROKER_URL}/v1/intention/search?where=%7B%22event.trigger.id%22%3A%22${TRIGGER_ID}%22%7D&offset=0&limit=1"

# Wait for the Jenkins deployment job to be triggered (max 90s)
for ((i=1; i<=MAX_WAIT; i++)); do
  RESPONSE=$(curl -s -X 'POST' \
    "$QUERY_URL" \
    -H 'accept: application/json' \
    -H 'Authorization: Bearer '"${BROKER_JWT}"'' \
    -d '')
  
  DATA_LENGTH=$(echo "$RESPONSE" | jq '.data | length')

  if [[ -z "$RESPONSE" || "$RESPONSE" == "null" || "$DATA_LENGTH" -eq 0 ]]; then
    if [ $i -eq $MAX_WAIT ]; then
      echo "Error: Deployment job was not triggered from broker after $((MAX_WAIT*10)) seconds."
      exit 1
    fi
    echo "Waiting for deployment job to be triggered..."
    sleep 10
    continue
  fi
  break
done

# Wait for the deployment job to be closed (completed)
for ((i=1; i<=MAX_WAIT; i++)); do
  RESPONSE=$(curl -s -X 'POST' \
    "$QUERY_URL" \
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
