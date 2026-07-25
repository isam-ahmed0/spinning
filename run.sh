#!/bin/bash
set -e

if [ -z "$DISCORD_BOT_TOKEN" ]; then
  echo "Error: DISCORD_BOT_TOKEN environment variable not set"
  exit 1
fi

if [ -z "$DISCORD_CLIENT_ID" ]; then
  echo "Error: DISCORD_CLIENT_ID environment variable not set"
  exit 1
fi

TOKEN="$DISCORD_BOT_TOKEN"
CLIENT_ID="$DISCORD_CLIENT_ID"
OWNER_ID="${OWNER_ID:-}"
GROQ_API_KEY="${GROQ_API_KEY:-}"
SERPAPI_KEY="${SERPAPI_KEY:-}"

jq --arg token "$TOKEN" --arg clientId "$CLIENT_ID" --arg ownerId "$OWNER_ID" --arg groqKey "$GROQ_API_KEY" --arg serpKey "$SERPAPI_KEY" \
  '.token = $token | .clientId = $clientId | .owner_id = $ownerId | .groq_api_key = $groqKey | .serpapi_key = $serpKey' \
  spiral.json > spiral.tmp && mv spiral.tmp spiral.json

echo "Starting Spinning Apple..."
spiral run -R
