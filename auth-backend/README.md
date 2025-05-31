
# Auth Backend Service

A standalone Deno-based authentication service with LuxTrust integration, designed for deployment on OVH Cloud HDS.

## Features

- **JWT-based authentication** with secure token management
- **Deno KV** for session storage and caching
- **OAuth integrations** (Google, FranceConnect, LuxTrust)
- **LuxTrust professional verification** for Luxembourg users
- **REST API** with CORS support
- **Database abstraction** (currently Supabase, easily switchable to PostgreSQL)

## API Endpoints

### Authentication
- `POST /auth/login` - Email/password login
- `POST /auth/verify` - Verify JWT token
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/profile` - Get user profile (protected)

### LuxTrust Services
- `POST /luxtrust/auth` - LuxTrust authentication
- `POST /luxtrust/verify-id` - Verify LuxTrust ID
- `POST /luxtrust/certification/upload` - Upload professional certification
- `POST /luxtrust/certification/verify` - Verify professional certification
- `POST /luxtrust/location/detect` - Location detection

### OAuth
- `GET /oauth/google` - Initiate Google OAuth
- `GET /oauth/google/callback` - Google OAuth callback
- `GET /oauth/franceconnect` - Initiate FranceConnect OAuth
- `GET /oauth/franceconnect/callback` - FranceConnect OAuth callback

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/auth_db

# JWT
JWT_SECRET=your-super-secret-jwt-key

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRANCECONNECT_CLIENT_ID=your-fc-client-id
FRANCECONNECT_CLIENT_SECRET=your-fc-client-secret
LUXTRUST_CLIENT_ID=your-luxtrust-client-id
LUXTRUST_CLIENT_SECRET=your-luxtrust-client-secret

# Service URLs
FRONTEND_URL=http://localhost:5173
SERVICE_URL=http://localhost:8000

# Supabase (during transition)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-key
```

## Running the Service

```bash
# Development
deno run --allow-net --allow-env --allow-read --unstable-kv main.ts

# Production
deno run --allow-net --allow-env --allow-read --unstable-kv --cached-only main.ts
```

## Migration to OVH Cloud HDS

1. **Replace database service**: Update `services/databaseService.ts` to use direct PostgreSQL connection
2. **Deploy on OVH**: Use Deno runtime on OVH Cloud HDS
3. **Update environment variables**: Configure OVH-specific URLs and credentials
4. **Update frontend**: Change API_BASE_URL to point to your OVH deployment

## Architecture

```
auth-backend/
├── main.ts                    # Entry point
├── config/
│   └── env.ts                # Environment configuration
├── services/
│   ├── kvStore.ts            # Deno KV service
│   ├── jwtService.ts         # JWT token management
│   └── databaseService.ts    # Database operations
└── routes/
    ├── auth.ts               # Authentication routes
    ├── luxtrust.ts           # LuxTrust routes
    └── oauth.ts              # OAuth routes
```

This service is designed to be completely independent and can be deployed separately from your main NestJS application.
