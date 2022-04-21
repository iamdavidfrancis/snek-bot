FROM node:lts-alpine3.9
LABEL maintainer="David Francis <david@iamdavidfrancis.com>"

USER root
ENV APP /usr/src/APP

COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json

RUN apk update && apk add python nvm && rm -rf /var/cache/apk/*

RUN nvm install 18.0.0
RUN nvm use 18.0.0

RUN cd /tmp && npm ci --loglevel=warn \
    && mkdir -p $APP \
    && mv /tmp/node_modules $APP

COPY src $APP/src
COPY package.json $APP
COPY tsconfig.json $APP

RUN mkdir $APP/videos

COPY videos/* $APP/videos/

WORKDIR $APP

RUN npm run build

CMD [ "node", "dist/index.js" ]