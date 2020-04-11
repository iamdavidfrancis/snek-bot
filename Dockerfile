FROM node:lts
LABEL maintainer="David Francis <david@iamdavidfrancis.com>"

USER root
ENV APP /usr/src/APP

COPY package.json /tmp/package.json

RUN cd /tmp && npm install --loglevel=warn \
    && mkdir -p $APP \
    && mv /tmp/node_modules $APP

COPY src $APP/src
COPY package.json $APP

WORKDIR $APP

CMD [ "node", "src/main.js" ]