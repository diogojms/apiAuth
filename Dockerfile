
FROM node:latest

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Rebuild bcrypt
#RUN npm rebuild bcrypt

# Bundle app source
COPY . .

EXPOSE 8081
CMD [ "node", "server.js" ]

#docker build -t api-auth . 
#docker run --name api-auth -p 8081:8081 -d api-auth
