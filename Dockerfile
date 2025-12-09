FROM node:24-alpine

ARG APP=app
ARG HOME=/home/node

ENV NPM_CONFIG_PREFIX=$HOME/.npm-global
ENV PATH=$PATH:$HOME/.npm-global/bin

RUN npm install -g yo

COPY --chown=node:node ./ $HOME/$APP/
RUN cd $HOME/$APP/ && npm ci && npm link

ENV HOME=/tmp
WORKDIR /src
VOLUME ["/src"]

ENTRYPOINT ["yo"]
CMD []
