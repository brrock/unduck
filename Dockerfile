# Use a suitable Bun base image
FROM oven/bun:latest

# Set the working directory inside the container
WORKDIR /app

# 1. Copy package.json and bun.lockb (or bun.lock) first.
# This allows Docker to cache the 'bun install' step
# unless these files change.
COPY package.json bun.lock ./ # Use bun.lock if you're not using bun create/bun init's default

# 2. Install dependencies
RUN bun install --frozen-lockfile # --frozen-lockfile is good practice for CI/CD

# 3. Copy the rest of your application code
COPY . .

# 4. Expose the port your application will listen on
EXPOSE 5173 

# 5. Command to run your application when the container starts
CMD ["bun", "run", "start", "--", "--host"] 