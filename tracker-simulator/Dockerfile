FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production --silent
COPY . .
CMD ["node", "index.js"]
