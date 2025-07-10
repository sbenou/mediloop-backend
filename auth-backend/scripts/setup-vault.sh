
#!/bin/bash

# HashiCorp Vault Setup Script
# This script sets up environment variables and initializes Vault with secrets

echo "🔐 Starting HashiCorp Vault setup..."

# Set Vault environment variables
export VAULT_URL=http://localhost:8200
export VAULT_TOKEN=myroot

# Set application secrets (replace with your actual values)
# Database connection (contains password - SECRET)
export DATABASE_URL="postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require"

# JWT configuration (SECRET)
export JWT_SECRET="your-super-secret-jwt-key"

# OAuth provider secrets (SECRETS) - replace with your actual values
export GOOGLE_CLIENT_SECRET=""
export FRANCECONNECT_CLIENT_SECRET=""
export LUXTRUST_CLIENT_SECRET=""

# Supabase secrets (during transition - SECRETS) - replace with your actual values
export SUPABASE_URL=""
export SUPABASE_SERVICE_ROLE_KEY=""

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
deno run --allow-net --allow-env scripts/setupVault.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Vault setup completed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Vault UI: http://localhost:8200 (token: myroot)"
    echo "   2. Start your Deno server: deno run --allow-net --allow-env main.ts"
    echo ""
else
    echo "❌ Vault setup failed. Check the error messages above."
    exit 1
fi
