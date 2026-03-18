
// Application configuration - non-sensitive settings
export const appConfig = {
  // Server configuration
  server: {
    port: parseInt(Deno.env.get('PORT') || '8000', 10),
    host: Deno.env.get('HOST') || 'localhost',
  },

  // Service URLs
  urls: {
    frontend: Deno.env.get('FRONTEND_URL') || 'http://localhost:5173',
    service: Deno.env.get('SERVICE_URL') || 'http://localhost:8000',
  },

  // OAuth provider public configuration (client IDs are typically public)
  oauth: {
    google: {
      clientId: Deno.env.get('GOOGLE_CLIENT_ID') || '',
    },
    franceConnect: {
      clientId: Deno.env.get('FRANCECONNECT_CLIENT_ID') || '',
    },
    luxTrust: {
      clientId: Deno.env.get('LUXTRUST_CLIENT_ID') || '',
    },
  },

  // JWT configuration (non-secret parts)
  jwt: {
    expiresIn: '24h',
    issuer: 'luxmed-auth',
    audience: 'luxmed-app',
  },

  // Application settings
  app: {
    environment: Deno.env.get('NODE_ENV') || 'development',
    logLevel: Deno.env.get('LOG_LEVEL') || 'info',
  },
}

console.log(`App configuration loaded. Server will run on port: ${appConfig.server.port}`);
