
import { neon } from '@neondb/serverless';

// Get the database URL from environment or fallback
const getDatabaseUrl = () => {
  // In production, this would come from your Vault setup like the auth backend
  // For now, using the same pattern as your auth backend
  return process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DUFXR9MiPsf1@ep-small-base-a900n0vb-pooler.gwc.azure.neon.tech/neondb?sslmode=require&channel_binding=require';
};

const sql = neon(getDatabaseUrl());

export { sql };
