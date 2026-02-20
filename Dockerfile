FROM node:24-alpine

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH=$PATH:/home/node/.npm-global/bin

RUN npm install -g yo

COPY --chown=node:node ./ /home/node/app/
RUN cd /home/node/app/ && npm ci && npm link

WORKDIR /src
VOLUME ["/src"]

ENTRYPOINT ["yo"]
CMD []
