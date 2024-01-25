FROM node:21

ARG APP=app
ARG HOME=/home/node

ENV NPM_CONFIG_PREFIX=$HOME/.npm-global
ENV PATH=$PATH:$HOME/.npm-global/bin

RUN npm install -g yo@4.3.1

COPY --chown=node:node ./generator-nr-maven-build $HOME/$APP/
RUN cd $HOME/$APP/ && npm ci && npm link

ENV HOME=/tmp
WORKDIR /src
VOLUME ["/src"]

ENTRYPOINT ["yo"]
