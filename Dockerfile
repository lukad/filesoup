FROM node:lts as frontend

WORKDIR /frontend

COPY frontend/package.json frontend/yarn.lock ./

RUN yarn

COPY frontend/bsconfig.json ./
COPY frontend/src ./src

# RUN yarn build
