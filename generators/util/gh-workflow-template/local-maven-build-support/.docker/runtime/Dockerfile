# -------------------------------
# Runtime Stage: Tomcat + WAR
# -------------------------------
ARG RUNTIME_IMAGE=tomcat:9-jre17

FROM ${RUNTIME_IMAGE} AS runtime

ARG PROJECT_DIR=.
ARG PORT=8080
ARG USER_ID=1000
ARG GROUP_ID=1000
WORKDIR /usr/local/tomcat
ENV PORT=${PORT}
ENV CATALINA_OPTS="-Xms256m -Xmx512m"

# Copy WAR file(s) into Tomcat's webapps directory
COPY ${PROJECT_DIR}/target/*.war webapps/ROOT.war

EXPOSE ${PORT}

# Create non-root user (optional, Tomcat runs as root by default)
RUN set -eux; \
    if ! getent group ${GROUP_ID} >/dev/null 2>&1; then \
        groupadd -g ${GROUP_ID} appuser; \
    fi; \
    if ! getent passwd ${USER_ID} >/dev/null 2>&1; then \
        useradd -u ${USER_ID} -g ${GROUP_ID} -s /sbin/nologin -M appuser || true; \
    fi; \
    chown -R ${USER_ID}:${GROUP_ID} /usr/local/tomcat

USER ${USER_ID}:${GROUP_ID}

CMD ["catalina.sh", "run"]
