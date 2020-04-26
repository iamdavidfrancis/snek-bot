FROM node:lts-alpine3.9
LABEL maintainer="David Francis <david@iamdavidfrancis.com>"

USER root
ENV APP /usr/src/APP

RUN apk update && apk add ffmpeg && rm -rf /var/cache/apk/*

COPY package.json /tmp/package.json

RUN cd /tmp && npm install --loglevel=warn \
    && mkdir -p $APP \
    && mv /tmp/node_modules $APP

COPY src $APP/src
COPY package.json $APP
COPY tsconfig.json $APP
COPY dimmadome.mp3 $APP

WORKDIR $APP

RUN npm run build

CMD [ "node", "dist/index.js" ]