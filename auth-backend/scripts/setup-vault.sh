
#!/bin/bash

# HashiCorp Vault Setup Script
# This script sets up environment variables and initializes Vault with secrets

echo "🔐 Starting HashiCorp Vault setup..."

# Set environment for development
export NODE_ENV=development

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Vault container if not already running
echo "🚀 Starting Vault container..."
docker-compose -f docker-compose.vault.yml up -d

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
sleep 5

# Check if Vault is healthy
if ! curl -s http://localhost:8200/v1/sys/health > /dev/null; then
    echo "❌ Vault is not responding. Please check the container logs:"
    echo "   docker logs vault-dev"
    exit 1
fi

echo "✅ Vault is ready!"

# Run the Deno setup script
echo "🔧 Running Vault initialization script..."
deno run --allow-net --allow-env --allow-read scripts/setupVault.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Vault setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Vault UI: http://localhost:8200 (token: myroot)"
    echo "   2. Start your Deno server: deno run --allow-net --allow-env --allow-read main.ts"
    echo ""
else
    echo "❌ Vault setup failed. Check the error messages above."
    exit 1
fi
