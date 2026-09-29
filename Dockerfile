FROM node:26-alpine

ARG APP=app
ARG HOME=/home/node

ENV NPM_CONFIG_PREFIX=$HOME/.npm-global
ENV PATH=$PATH:$HOME/.npm-global/bin

RUN npm install -g yo

COPY --chown=node:node package.json package-lock.json tsconfig.json $HOME/$APP/
COPY --chown=node:node src/ $HOME/$APP/src/
COPY --chown=node:node scripts/ $HOME/$APP/scripts/
RUN cd $HOME/$APP/ && npm ci && npm run build && npm link

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 755 /usr/local/bin/docker-entrypoint.sh

ENV HOME=/tmp
WORKDIR /src
VOLUME ["/src"]

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD []
