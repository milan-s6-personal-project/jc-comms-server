# FROM node:18.16.0-alpine3.17
# RUN mkdir -p /opt/app
# WORKDIR /opt/app
# COPY package.json src/package-lock.json .
# RUN npm install
# COPY . .
# EXPOSE 3001
# CMD [ "node", "src/index.js"]

FROM node:18.16.0-alpine3.17
RUN mkdir -p /opt/app
WORKDIR /opt/app
COPY package.json package-lock.json .
COPY src/ .
RUN npm install
EXPOSE 5000
CMD [ "node", "index.js"]