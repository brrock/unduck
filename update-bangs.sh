#!/bin/bash

# Define file names
BANG_JS_URL="https://duckduckgo.com/bang.js"
RAW_BANGS="bangs_raw.json"
FINAL_TS="src/bang.ts"
rm -f $FINAL_TS

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq and try again."
    exit 1
fi

# Download the latest bangs from DuckDuckGo
echo "Downloading latest bangs..."
curl -s "$BANG_JS_URL" -o "$RAW_BANGS"

# Check if download was successful
if [ ! -s "$RAW_BANGS" ]; then
    echo "Error: Failed to download $BANG_JS_URL."
    exit 1
fi

# Create the TypeScript file with bangs array
echo "/* Mostly ripped from duckduckgo.com/bang.js */" > "$FINAL_TS"
echo "export const bangs = " >> "$FINAL_TS"

# Add the downloaded bangs and custom entries
jq -r '. + [
  {
    "c": "AI",
    "d": "chat.openai.com",
    "r": 0,
    "s": "ChatGPT",
    "sc": "AI",
    "t": "cgpt",
    "u": "https://chat.openai.com?q={{{s}}}"
  },
  {
    "c": "AI",
    "d": "chat.openai.com",
    "r": 0,
    "s": "ChatGPT 4o",
    "sc": "AI",
    "t": "cgpt-4o",
    "u": "https://chat.openai.com?model=4o&q={{{s}}}"
  },
  {
    "c": "AI",
    "d": "chat.openai.com",
    "r": 0,
    "s": "ChatGPT o3-mini-high",
    "sc": "AI",
    "t": "cgpt-o3-mini-high",
    "u": "https://chat.openai.com?model=o3-mini-high&q={{{s}}}"
  },
  {
    "c": "AI",
    "d": "chat.openai.com",
    "r": 0,
    "s": "ChatGPT o1",
    "sc": "AI",
    "t": "cgpt-o1",
    "u": "https://chat.openai.com?model=o1&q={{{s}}}"
  },
  {
  "c": "AI",
  "d": "claude.ai",
  "r": 0,
  "s": "Claude",
  "sc": "AI",
  "t": "claude",
  "u": "https://claude.ai/new?q={{{s}}}"
  },
  {
    "c": "AI",
    "d": "www.t3.chat",
    "r": 0,
    "s": "T3 Chat",
    "sc": "AI",
    "t": "t3",
    "u": "https://www.t3.chat/new?q={{{s}}}"
  }
]' "$RAW_BANGS" >> "$FINAL_TS"

# Add semicolon
echo ";" >> "$FINAL_TS"

# Cleanup
rm "$RAW_BANGS"

echo "Successfully updated and saved as $FINAL_TS"
