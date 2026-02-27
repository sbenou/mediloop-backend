# HashiCorp Vault Setup Guide

This guide will help you set up HashiCorp Vault for secure secret management in your Deno authentication backend.

## Quick Setup (Recommended)

### Option 1: Using Setup Scripts

**Linux/macOS/Git Bash:**

```bash
chmod +x scripts/setup-vault.sh
./scripts/setup-vault.sh
```

**Windows (Command Prompt):**

```cmd
scripts\setup-vault.bat
```

These scripts will:

- Set the required environment variables
- Start the Vault Docker container
- Wait for Vault to be ready
- Initialize Vault with your secrets
- Provide next steps

### Option 2: Manual Setup

If you prefer to run commands manually:

#### 1. Start Vault with Docker Compose

```bash
cd auth-backend
docker compose -f docker-compose.vault.yml up -d
```

Quick Vault sanity check

```bash
docker logs vault-dev
```

then

```bash
curl http://localhost:8200/v1/sys/health
```

or

```bash
export VAULT_ADDR=http://127.0.0.1:8200
vault status
```

if there is no vault CLI locally, exec into container

```bash
docker exec -it vault-dev sh
vault status
```

After startup, test:

#### 2. Set Environment Variables

**Linux/macOS/Git Bash:**

```bash
export VAULT_URL=http://localhost:8200
export VAULT_TOKEN=myroot
```

**Windows (Command Prompt):**

```cmd
set VAULT_URL=http://localhost:8200
set VAULT_TOKEN=myroot
```

**Windows (PowerShell):**

```powershell
$env:VAULT_URL="http://localhost:8200"
$env:VAULT_TOKEN="myroot"
```

#### 3. Initialize Vault with Secrets

```bash
deno run --allow-net --allow-env scripts/setupVault.ts
```

## Development Configuration

The setup uses these default values:

- **Vault URL**: http://localhost:8200
- **Root Token**: `myroot`
- **Vault UI**: http://localhost:8200

## Verify Setup

You can verify the setup by:

1. **Vault UI**: Visit http://localhost:8200 and login with token `myroot`
2. **Check secrets**: Navigate to `secret/` engine and verify paths:
   - `secret/auth` - Database and JWT secrets
   - `secret/oauth` - OAuth provider secrets
   - `secret/legacy` - Legacy Supabase secrets
3. **Test the server**: Run `deno run --allow-net --allow-env main.ts`

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
  hashicorp/vault:1.15.2
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

1. **Connection Refused**: Check if Vault is running with `docker ps`
2. **Permission Denied**: Verify token has correct policies
3. **Sealed Vault**: Run unseal process with keys
4. **Invalid Token**: Generate new token or renew existing
5. **Script Permission Denied**: Run `chmod +x scripts/setup-vault.sh` on Linux/macOS

### Debug Mode

Set `VAULT_LOG_LEVEL=debug` to enable detailed logging.

### Check Container Logs

```bash
docker logs vault-dev
```
