FROM node:24

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]


# RUN → executed while building the image
# CMD → default command executed when container starts