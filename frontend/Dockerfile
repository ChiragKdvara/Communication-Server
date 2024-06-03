# Use an official Node.js runtime as the base image
FROM node:18.17.1-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install --legacy-peer-deps
RUN npm install -g serve  --legacy-peer-deps
# Copy the rest of the application source code to the container
COPY . .

EXPOSE 5173
# Serve the app
#CMD ["serve","-s","build"]
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

