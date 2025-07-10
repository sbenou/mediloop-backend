
#!/bin/bash

# Vault Manager Script for Unix/Linux/macOS
# This script handles all vault operations with proper environment setup

echo "🔐 Starting Vault Manager..."

# Set Vault environment variables
export VAULT_URL=http://localhost:8200
export VAULT_TOKEN=myroot
export NODE_ENV=development

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Vault container is running
if ! docker ps | grep -q vault-dev; then
    echo "🚀 Starting Vault container..."
    docker-compose -f docker-compose.vault.yml up -d
    echo "⏳ Waiting for Vault to be ready..."
    sleep 5
fi

# Check if Vault is healthy
if ! curl -s http://localhost:8200/v1/sys/health > /dev/null; then
    echo "❌ Vault is not responding. Please check the container logs:"
    echo "   docker logs vault-dev"
    exit 1
fi

# Run the vault manager with all arguments passed through
echo "🔧 Running Vault Manager with environment variables set..."
VAULT_URL=$VAULT_URL VAULT_TOKEN=$VAULT_TOKEN NODE_ENV=$NODE_ENV deno run --allow-net --allow-env --allow-read scripts/vaultManager.ts "$@"

if [ $? -eq 0 ]; then
    echo "✅ Vault operation completed successfully!"
else
    echo "❌ Vault operation failed. Check the error messages above."
    exit 1
fi
