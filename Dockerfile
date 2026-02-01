FROM node:current-alpine3.14
LABEL maintainer="David Francis <david@iamdavidfrancis.com>"

USER root
ENV APP=/usr/src/APP

COPY package.json /tmp/package.json
COPY package-lock.json /tmp/package-lock.json

RUN apk update && apk add --no-cache --virtual .gyp make g++

# We need to keep python around for the youtube-dl
RUN apk add --no-cache python3

# Symlink python
RUN ln -s $(which python3) /usr/bin/python

RUN cd /tmp && npm ci --loglevel=warn \
    && mkdir -p $APP \
    && mv /tmp/node_modules $APP \
    && apk del .gyp

COPY src $APP/src
COPY package.json $APP
COPY tsconfig.json $APP

RUN mkdir $APP/videos

COPY videos/* $APP/videos/

WORKDIR $APP

RUN npm run build

CMD [ "node", "dist/index.js" ]