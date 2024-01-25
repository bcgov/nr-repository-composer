FROM node:21

USER node

ARG APP=app
ARG HOME=/home/node

ENV NPM_CONFIG_PREFIX=$HOME/.npm-global
ENV PATH=$PATH:$HOME/.npm-global/bin

COPY --chown=node:node . $HOME/$APP/
RUN npm install -g yo@4.3.1

WORKDIR $HOME/$APP/generator-nr-pipeline-template

RUN npm ci && npm link

CMD ["yo", "nr-pipeline-template"]
