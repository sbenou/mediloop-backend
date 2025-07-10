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

The `auth-backend` directory contains a standalone Deno-based authentication service with HashiCorp Vault integration.

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
- Set up environment variables
- Initialize Vault with default secrets
- Provide next steps

### Starting the Deno Server

After Vault is set up, start the development server:

```bash
# Using the cross-platform launcher (recommended)
deno task start-dev

# Or direct command (if you prefer)
deno task dev
```

### Managing Vault Secrets (New Simplified Commands)

Use the new vault task for all vault operations - **no need to set environment variables manually**:

```bash
# Get secrets from a path
deno task vault get auth

# Set a new secret (like your database URL)
deno task vault set auth DATABASE_URL_DEV="your-dev-database-url"

# Set multiple secrets at once
deno task vault set auth DATABASE_URL_PROD="your-prod-url" JWT_SECRET="your-jwt-secret"

# Delete secrets from a path
deno task vault delete legacy

# Check Vault health
deno task vault health

# Initialize/setup Vault with default secrets
deno task vault setup
```

### Available Deno Tasks

```bash
# Development server with auto-reload
deno task dev

# Production server
deno task prod

# Setup Vault (cross-platform)
deno task setup-vault

# Start development server with Vault integration
deno task start-dev

# Vault management (handles environment variables automatically)
deno task vault <command> [args...]
```

### Troubleshooting

**"VAULT_TOKEN not set" Error:**
- Use `deno task vault` commands instead of running vault manager directly
- The vault task automatically handles environment variables

**"403 Forbidden" Error:**
- Run `deno task vault health` to check Vault status
- If unhealthy, run `deno task setup-vault` to restart everything

**Docker Issues:**
- Make sure Docker is running
- Check container logs: `docker logs vault-dev`
- Restart setup: `deno task setup-vault`

### Examples

```bash
# Complete setup and configuration example:
cd auth-backend

# 1. Initial setup (starts Vault and configures default secrets)
deno task setup-vault

# 2. Add your development database URL
deno task vault set auth DATABASE_URL_DEV="postgresql://user:pass@localhost:5432/mydb"

# 3. Add your production database URL
deno task vault set auth DATABASE_URL_PROD="postgresql://user:pass@prod-server:5432/mydb"

# 4. Start the development server
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
