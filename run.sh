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

jq --arg token "$TOKEN" --arg clientId "$CLIENT_ID" '.token = $token | .clientId = $clientId' spiral.json > spiral.tmp && mv spiral.tmp spiral.json

echo "Starting Spinning..."
spiral run
