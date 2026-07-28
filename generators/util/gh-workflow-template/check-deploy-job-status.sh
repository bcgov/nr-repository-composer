#!/bin/bash
set -e

# Helper function to set GitHub Actions outputs
set_github_output() {
  if [[ -n "${1}" ]]; then
    echo "failure_reason=${1}" >> $GITHUB_OUTPUT
  fi
  echo "last_http_code=${LAST_HTTP_CODE}" >> $GITHUB_OUTPUT
  echo "last_curl_exit=${LAST_CURL_EXIT}" >> $GITHUB_OUTPUT
  echo "trigger_attempts=${TRIGGER_ATTEMPTS}" >> $GITHUB_OUTPUT
  echo "completion_attempts=${COMPLETION_ATTEMPTS}" >> $GITHUB_OUTPUT
  if [[ -n "${TRIGGER_WAIT_SECONDS}" ]]; then
    echo "trigger_wait_seconds=${TRIGGER_WAIT_SECONDS}" >> $GITHUB_OUTPUT
  fi
  if [[ -n "${COMPLETION_WAIT_SECONDS}" ]]; then
    echo "completion_wait_seconds=${COMPLETION_WAIT_SECONDS}" >> $GITHUB_OUTPUT
  fi
  if [[ -n "${EVENT_URL}" ]]; then
    echo "event_url=$EVENT_URL" >> $GITHUB_OUTPUT
  fi
  if [[ -n "${STATUS+x}" ]]; then
    echo "status=$STATUS" >> $GITHUB_OUTPUT
  fi
}

# Use the timestamp from the previous step
GH_TASK_START="${GH_TASK_START}"
echo "Current GitHub task start: $GH_TASK_START"
sleep 30
MAX_WAIT=30

TRIGGER_ID=$(echo -n "${SERVICE_NAME} ${TRIGGER_UUID}" | jq -sRr @uri)

QUERY_URL="${BROKER_URL}/v1/intention/search?where=%7B%22event.trigger.id%22%3A%22${TRIGGER_ID}%22%7D&offset=0&limit=1"

# Initialize tracking variables
TRIGGER_ATTEMPTS=0
COMPLETION_ATTEMPTS=0
LAST_HTTP_CODE=""
LAST_CURL_EXIT=""
TRIGGER_START_TIME=$(date +%s)

# Wait for the Jenkins deployment job to be triggered (Trigger Phase - max 5 minutes)
for ((i=1; i<=MAX_WAIT; i++)); do
  TRIGGER_ATTEMPTS=$i
  
  RESPONSE=$(curl -sS -X 'POST' \
    --output "/tmp/broker_trigger_response.json" \
    --write-out "%{http_code}" \
    --retry 1 \
    --retry-delay 1 \
    --connect-timeout 5 \
    --max-time 15 \
    "$QUERY_URL" \
    -H 'accept: application/json' \
    -H 'Authorization: Bearer '"${BROKER_JWT}"'' \
    -d '' \
  )
  LAST_HTTP_CODE="$RESPONSE"
  LAST_CURL_EXIT=$?
  
  if [ -f "/tmp/broker_trigger_response.json" ]; then
    RESPONSE=$(cat "/tmp/broker_trigger_response.json")
  else
    RESPONSE=""
  fi
  
  if [ "$LAST_CURL_EXIT" -eq 28 ]; then
    echo "Warning: Trigger phase polling timed out (curl exit code 28) on iteration $i/$MAX_WAIT."
  elif [ "$LAST_CURL_EXIT" -ne 0 ] && [ "$LAST_CURL_EXIT" -ne 28 ]; then
    echo "Warning: Trigger phase query failed with exit code $LAST_CURL_EXIT on iteration $i/$MAX_WAIT."
  fi
  
  DATA_LENGTH=$(echo "$RESPONSE" | jq '.data | length' 2>/dev/null || echo 0)

  if [[ -z "$RESPONSE" || "$RESPONSE" == "null" || "$DATA_LENGTH" -eq 0 ]]; then
    if [ $i -eq $MAX_WAIT ]; then
      TRIGGER_END_TIME=$(date +%s)
      TRIGGER_WAIT_SECONDS=$((TRIGGER_END_TIME - TRIGGER_START_TIME))
      set_github_output "Deployment job was not triggered from broker after $((MAX_WAIT*10)) seconds."
      echo "Error: Deployment job was not triggered from broker after $((MAX_WAIT*10)) seconds."
      exit 1
    fi
    echo "Waiting for deployment job to be triggered..."
    sleep 10
    continue
  fi
  break
done

TRIGGER_END_TIME=$(date +%s)
TRIGGER_WAIT_SECONDS=$((TRIGGER_END_TIME - TRIGGER_START_TIME))

# Wait for the deployment job to be closed (Completion Phase - max 5 minutes)
COMPLETION_START_TIME=$(date +%s)
for ((i=1; i<=MAX_WAIT; i++)); do
  COMPLETION_ATTEMPTS=$i
  
  RESPONSE=$(curl -sS -X 'POST' \
    --output "/tmp/broker_completion_response.json" \
    --write-out "%{http_code}" \
    --retry 1 \
    --retry-delay 1 \
    --connect-timeout 5 \
    --max-time 15 \
    "$QUERY_URL" \
    -H 'accept: application/json' \
    -H 'Authorization: Bearer '"${BROKER_JWT}"'' \
    -d '' \
  )
  LAST_HTTP_CODE="$RESPONSE"
  LAST_CURL_EXIT=$?
  
  if [ -f "/tmp/broker_completion_response.json" ]; then
    RESPONSE=$(cat "/tmp/broker_completion_response.json")
  else
    RESPONSE=""
  fi
  
  if [ "$LAST_CURL_EXIT" -eq 28 ]; then
    echo "Warning: Completion phase polling timed out (curl exit code 28) on iteration $i/$MAX_WAIT."
  elif [ "$LAST_CURL_EXIT" -ne 0 ] && [ "$LAST_CURL_EXIT" -ne 28 ]; then
    echo "Warning: Completion phase query failed with exit code $LAST_CURL_EXIT on iteration $i/$MAX_WAIT."
  fi
  
  CLOSED=$(echo "$RESPONSE" | jq -r '.data[0].closed // false' 2>/dev/null || echo "false")
  if [[ "$CLOSED" == "true" ]]; then
    echo "Deployment job is closed."
    break
  fi
  if [ $i -eq $MAX_WAIT ]; then
    COMPLETION_END_TIME=$(date +%s)
    COMPLETION_WAIT_SECONDS=$((COMPLETION_END_TIME - COMPLETION_START_TIME))
    set_github_output "Deployment job could not complete within $((MAX_WAIT*10)) seconds (Completion Phase Timeout)."
    echo "Error: Deployment job could not complete within $((MAX_WAIT*10)) seconds (Completion Phase Timeout)."
    exit 1
  fi
  echo "Deployment job still running... waiting 10s"
  sleep 10
done

COMPLETION_END_TIME=$(date +%s)
COMPLETION_WAIT_SECONDS=$((COMPLETION_END_TIME - COMPLETION_START_TIME))

# Extract and display the event URL
EVENT_URL=$(echo "$RESPONSE" | jq -r '.data[0].event.url // empty')
if [[ -n "$EVENT_URL" ]]; then
  echo "Event URL: $EVENT_URL"
else
  echo "Event URL not found in response."
fi

# Check the outcome
STATUS=$(echo "$RESPONSE" | jq -r '.data[0].transaction.outcome // empty')
if [[ "$STATUS" != "success" ]]; then
  echo "Deployment outcome is not success: $STATUS"
  set_github_output "Deployment outcome is not success: $STATUS"
  exit 1
fi

# Success - set outputs
set_github_output
