# Use a suitable Bun base image
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app
RUN apt update -y
RUN apt install jq curl -y

COPY package.json bun.lock ./
COPY ./update-bangs.sh ./
# 2. Install dependencies
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build
EXPOSE 6001


CMD bun start --port 6001
