
#!/bin/bash

# Development startup script for Deno server
echo "🚀 Starting Deno server in development mode..."

# Set environment for development
export NODE_ENV=development

# Set Vault environment variables
export VAULT_URL=http://localhost:8200
export VAULT_TOKEN=myroot

# Start the Deno server with all required permissions
echo "🔧 Starting server with Vault integration..."
VAULT_URL=$VAULT_URL VAULT_TOKEN=$VAULT_TOKEN NODE_ENV=$NODE_ENV deno run --allow-net --allow-env --allow-read --unstable-kv --unstable-cron main.ts
