
# Welcome to medihop-delivery project

## Project info

**URL**: https://lovable.dev/projects/6b9503d2-ebf4-4f52-8713-ddddc11a9956

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the
[Lovable Project](https://lovable.dev/projects/6b9503d2-ebf4-4f52-8713-ddddc11a9956)
and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push
changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed -
[install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once
  you're done.

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open
[Lovable](https://lovable.dev/projects/6b9503d2-ebf4-4f52-8713-ddddc11a9956) and
click on Share -> Publish.

## I want to use a custom domain - is that possible?

We don't support custom domains (yet). If you want to deploy your project under
your own domain then we recommend using Netlify. Visit our docs for more
details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)

## Deno Authentication Backend Setup

The `auth-backend` directory contains a standalone Deno-based authentication service with HashiCorp Vault integration for secure secret management.

### Prerequisites

1. **Install Deno**: https://deno.land/manual/getting_started/installation
2. **Install Docker**: Required for running HashiCorp Vault locally
3. **Make sure Docker is running** before starting the setup

### Quick Start (Recommended)

Navigate to the auth-backend directory and run the setup command:

```bash
cd auth-backend

# Cross-platform setup (automatically detects your OS)
deno task setup-vault
```

This command will:
- Detect your operating system
- Start the Vault Docker container
- Set up environment variables automatically
- Initialize Vault with default secrets
- Provide next steps

### Starting the Development Server

After Vault is set up, start the development server with the correct environment:

```bash
# Using the cross-platform launcher (recommended - handles environment automatically)
deno task start-dev
```

This command will:
- Set the correct environment variables (VAULT_URL, VAULT_TOKEN, NODE_ENV)
- Start the Deno server with Vault integration
- Work on both Windows and Unix systems

### Managing Vault Secrets (New Simplified Commands)

Use the new vault task for all vault operations - **environment variables are handled automatically**:

```bash
# Get secrets from a path
deno task vault get auth

# Set a new secret (merges with existing secrets at the same path)
deno task vault set auth DATABASE_URL_DEV="your-dev-database-url"

# Set multiple secrets at once (all merge with existing)
deno task vault set auth DATABASE_URL_PROD="your-prod-url" JWT_SECRET="your-jwt-secret"

# Add more secrets without losing existing ones
deno task vault set oauth GOOGLE_CLIENT_SECRET="your-google-secret"

# Delete all secrets from a path
deno task vault delete legacy

# Check Vault health
deno task vault health

# Initialize/setup Vault with default secrets
deno task vault setup
```

**Important**: The `set` command now **merges** with existing secrets instead of overwriting them. This means you can safely add new secrets without losing previously stored ones.

### Available Deno Tasks

```bash
# Development server with auto-reload and correct environment
deno task start-dev

# Production server
deno task prod

# Setup Vault (cross-platform, handles environment automatically)
deno task setup-vault

# Vault management (handles environment variables automatically)
deno task vault <command> [args...]

# Direct development server (if you prefer, but start-dev is recommended)
deno task dev

# Check Deno version and get update instructions
deno task check-version

# Upgrade Deno to latest version (requires Deno 1.30+)
deno task upgrade-deno
```

### Deno Version Management

Check your current Deno version and get update instructions:

```bash
# Check current version vs latest
deno task check-version

# Upgrade Deno (if you have Deno 1.30+)
deno task upgrade-deno

# Or manually update using one of these methods:
curl -fsSL https://deno.land/install.sh | sh          # Unix/Linux/macOS
iwr https://deno.land/install.ps1 -useb | iex        # Windows PowerShell
brew upgrade deno                                     # Homebrew users
```

### Environment Management

**No Manual Environment Setup Required!**

The scripts automatically handle environment variables:
- `VAULT_URL=http://localhost:8200`
- `VAULT_TOKEN=myroot`
- `NODE_ENV=development`

You don't need to set these manually - the cross-platform launchers handle everything.

### Database Connection Notes

**Important**: If you encounter connection issues with PostgreSQL, you may need to modify your database URL:

- **Remove `&channel_binding=require`** from database URLs if you get connection errors
- This parameter is not supported by all PostgreSQL drivers
- Your connection remains secure with `sslmode=require`

Example:
```bash
# If this doesn't work:
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&channel_binding=require"

# Try this instead:
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Troubleshooting

**"VAULT_TOKEN not set" Error:**
- Use `deno task vault` commands instead of running scripts directly
- The vault task automatically handles environment variables

**"403 Forbidden" Error:**
- Run `deno task vault health` to check Vault status
- If unhealthy, run `deno task setup-vault` to restart everything

**Docker Issues:**
- Make sure Docker is running
- Check container logs: `docker logs vault-dev`
- Restart setup: `deno task setup-vault`

**Database Connection Issues:**
- Remove `&channel_binding=require` from database URLs
- Ensure `sslmode=require` is present for secure connections
- Check if your PostgreSQL driver supports all connection parameters

**Deno Version Issues:**
- Run `deno task check-version` to check for updates
- Update Deno if you're using an older version
- Some features require newer Deno versions

### Complete Setup Example

```bash
# Complete setup and configuration example:
cd auth-backend

# 1. Check Deno version and update if needed
deno task check-version
deno task upgrade-deno  # if update is available

# 2. Initial setup (starts Vault and configures default secrets)
deno task setup-vault

# 3. Add your development database URL (merges with existing)
deno task vault set auth DATABASE_URL_DEV="postgresql://user:pass@localhost:5432/mydb?sslmode=require"

# 4. Add your production database URL (doesn't overwrite dev URL)
deno task vault set auth DATABASE_URL_PROD="postgresql://user:pass@prod-server:5432/mydb?sslmode=require"

# 5. Add OAuth secrets (stored separately, doesn't affect auth secrets)
deno task vault set oauth GOOGLE_CLIENT_SECRET="your-google-secret"

# 6. Start the development server with correct environment
deno task start-dev
```

### Vault Web UI

Once Vault is running, you can access the web UI at:

- **URL**: http://localhost:8200
- **Token**: `myroot`

## Database Setup

How to clean up or start the project

```bash
npx supabase login
npx supabase db reset
npx supabase link --project-ref hrrlefgnhkbzuwyklejj <password>
psql "postgresql://postgres.hrrlefgnhkbzuwyklejj:<your_db_password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" // test if it works locally
npx supabase db remote --db-url "postgresql://postgres.hrrlefgnhkbzuwyklejj:<your_db_password>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
npx supabase db push --debug
```
