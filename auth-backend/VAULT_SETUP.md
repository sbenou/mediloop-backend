
# HashiCorp Vault Setup Guide

This guide will help you set up HashiCorp Vault for secure secret management in your Deno authentication backend.

## Development Setup (Docker)

### 1. Start Vault with Docker Compose

```bash
cd auth-backend
docker-compose -f docker-compose.vault.yml up -d
```

This starts Vault in development mode with:
- Root token: `myroot`
- Vault UI: http://localhost:8200
- API endpoint: http://localhost:8200

### 2. Set Environment Variables

Create or update your `.env` file:

```bash
# Vault configuration
VAULT_URL=http://localhost:8200
VAULT_TOKEN=myroot
```

### 3. Initialize Vault with Secrets

Run the setup script to populate Vault with your secrets:

```bash
deno run --allow-net --allow-env scripts/setupVault.ts
```

### 4. Verify Setup

You can verify the setup by:

1. **Vault UI**: Visit http://localhost:8200 and login with token `myroot`
2. **CLI**: Use the Vault CLI to check secrets
3. **API**: Test the API endpoints

## Production Setup

### 1. Install Vault

**Linux/macOS:**
```bash
# Download and install Vault
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install vault
```

**Docker:**
```bash
docker run -d --name vault \
  -p 8200:8200 \
  -v vault-data:/vault/data \
  -v vault-config:/vault/config \
  --cap-add=IPC_LOCK \
  hashicorp/vault:latest
```

### 2. Initialize and Unseal Vault

```bash
# Initialize Vault (save the keys and root token!)
vault operator init

# Unseal Vault (use 3 of the 5 unseal keys)
vault operator unseal <key1>
vault operator unseal <key2>
vault operator unseal <key3>

# Login with root token
vault auth <root-token>
```

### 3. Enable KV Secrets Engine

```bash
vault secrets enable -path=secret kv-v2
```

### 4. Create Application Policy

```bash
vault policy write luxmed-auth - <<EOF
path "secret/data/auth" {
  capabilities = ["read"]
}
path "secret/data/oauth" {
  capabilities = ["read"]
}
path "secret/data/legacy" {
  capabilities = ["read"]
}
EOF
```

### 5. Create Application Token

```bash
vault token create -policy="luxmed-auth" -ttl=24h
```

### 6. Update Environment Variables

```bash
export VAULT_URL=https://your-vault-server:8200
export VAULT_TOKEN=<application-token>
```

## Secret Paths

The application expects secrets in these paths:

- `secret/auth` - Database and JWT secrets
- `secret/oauth` - OAuth provider secrets
- `secret/legacy` - Legacy Supabase secrets (temporary)

## Monitoring and Maintenance

### Health Check
```bash
curl -s http://localhost:8200/v1/sys/health
```

### Token Renewal
```bash
vault auth -method=token
vault token renew
```

### Backup Secrets
```bash
vault kv get -format=json secret/auth > backup-auth.json
vault kv get -format=json secret/oauth > backup-oauth.json
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if Vault is running
2. **Permission Denied**: Verify token has correct policies
3. **Sealed Vault**: Run unseal process with keys
4. **Invalid Token**: Generate new token or renew existing

### Debug Mode

Set `VAULT_LOG_LEVEL=debug` to enable detailed logging.
