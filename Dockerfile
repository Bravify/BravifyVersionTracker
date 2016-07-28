FROM mhart/alpine-node:6.3.1

COPY . /usr/src/bvt

WORKDIR /usr/src/bvt
RUN npm install

EXPOSE 8080

CMD [ "node" "server.js" ]
