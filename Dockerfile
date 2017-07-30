FROM node:boron
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app
COPY scripts/gactions /usr/local/bin
RUN chmod +x /usr/local/bin/gactions
COPY creds.data /usr/local/bin
RUN npm install
COPY . /usr/src/app
EXPOSE 8080
CMD [ "npm", "start" ]
