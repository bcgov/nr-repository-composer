FROM docker.io/library/ubuntu:22.04

# Install dependencies
RUN apt-get update && \
    apt-get install -y curl git bash docker.io podman jq wget && \
    rm -rf /var/lib/apt/lists/*

# Install GitHub CLI
RUN type -p curl >/dev/null || apt-get install curl -y && \
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install gh -y

# Install yq
RUN wget https://github.com/mikefarah/yq/releases/download/v4.45.4/yq_linux_amd64 -O /usr/bin/yq && \
    chmod +x /usr/bin/yq

# Set workdir
WORKDIR /workspace

# Default command
CMD ["/bin/bash"]
