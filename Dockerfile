FROM tarampampam/node:14-alpine

WORKDIR /usr/src/app

ADD tsconfig.json ./
ADD package.json ./
ADD .npmrc ./
RUN yarn install

ADD src ./src

ENV BUILD_ENV=${BUILD_ENV}

CMD yarn start:${BUILD_ENV}