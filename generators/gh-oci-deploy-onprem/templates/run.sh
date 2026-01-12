#!/bin/bash
# run.sh - Internal container script

export CATALINA_OPTS="$CATALINA_OPTS -Djava.net.preferIPv4Stack=true"

# 1. Configuration
# Note: 'host.docker.internal' refers to your laptop/host from inside the container
ARTIFACT="host.docker.internal:5000/node-app:v1.0.0"
WEBAPPS_DIR="/usr/local/tomcat/webapps/ROOT"

echo "--- Pulling Artifacts from Local Registry ---"
# Clear existing ROOT to avoid conflicts
rm -rf ${WEBAPPS_DIR}/*

# Pull directly into the webapps directory
# -o specifies the output directory
oras pull --plain-http -o ${WEBAPPS_DIR} ${ARTIFACT}

echo "--- Deploying Node.js Files ---"
# If you pushed a 'dist' folder, move its contents to ROOT so Tomcat serves them
if [ -d "${WEBAPPS_DIR}/dist" ]; then
    cp -r ${WEBAPPS_DIR}/dist/* ${WEBAPPS_DIR}/
fi

echo "--- Starting Application ---"
# Start Node.js in the background (if your app has a server component)
cd ${WEBAPPS_DIR} && npm install && node main.js &

# Start Tomcat in the foreground (this keeps the container alive)
exec catalina.sh run