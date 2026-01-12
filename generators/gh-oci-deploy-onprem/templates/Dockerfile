# Use Tomcat as the base
FROM tomcat:10-jdk17

FROM ${RUNTIME_IMAGE} AS runtime

# Install ORAS CLI
RUN apt-get update && apt-get install -y curl tar && \
    curl -LO https://github.com/oras-project/oras/releases/download/v1.2.0/oras_1.2.0_linux_amd64.tar.gz && \
    tar -zxf oras_1.2.0_linux_amd64.tar.gz -C /usr/local/bin/ oras && \
    rm oras_1.2.0_linux_amd64.tar.gz

# Optional: Install Node.js if you need to run 'node index.js' alongside Tomcat
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Copy the run script into the image
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

# Set the working directory
WORKDIR /usr/local/tomcat

# Launch the run script
ENTRYPOINT ["/usr/local/bin/run.sh"]