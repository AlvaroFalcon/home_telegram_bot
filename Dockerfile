FROM node:18-alpine

# Install only essential packages for Chromium
RUN apk add --no-cache chromium nss ca-certificates

# Tell Puppeteer to skip downloading its own Chromium and use the system version
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
	CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . /app/
CMD ["npm", "run", "start"]
