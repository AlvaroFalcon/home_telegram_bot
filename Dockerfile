FROM node:18-alpine

# Install dependencies for running Chromium
RUN apk add --no-cache \
	chromium \
	nss \
	freetype \
	harfbuzz \
	ca-certificates \
	ttf-freefont

# Configure Puppeteer to skip downloading Chromium and use the installed binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
	PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
	CHROME_BIN=/usr/bin/chromium-browser

WORKDIR /app
COPY package*.json /app/
RUN npm install
COPY . /app/
CMD ["npm", "run", "start"]