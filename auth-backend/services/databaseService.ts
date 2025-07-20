import { PostgresService } from "./postgresService.ts";
import { config } from "../config/env.ts";
import { Profile } from "../types.ts";

export class DatabaseService {
  private postgresService: PostgresService;

  constructor(postgresService: PostgresService) {
    this.postgresService = postgresService;
  }

  private async hashPassword(password: string): Promise<string> {
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Derive key using PBKDF2
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      importedKey,
      512 // 64 bytes * 8 bits
    );
    
    const keyHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    return saltHex + ':' + keyHex;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const [saltHex, keyHex] = hash.split(':');
    
    // Convert salt from hex
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Derive key using same parameters
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    const importedKey = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      importedKey,
      512 // 64 bytes * 8 bits
    );
    
    const derivedKeyHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
    if (keyHex.length !== derivedKeyHex.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < keyHex.length; i++) {
      result |= keyHex.charCodeAt(i) ^ derivedKeyHex.charCodeAt(i);
    }
    
    return result === 0;
  }

  async verifyUserPassword(email: string, passwordPlain: string): Promise<Profile> {
    const client = await this.postgresService.getClient()

    try {
      const result = await client.queryObject<Profile>(
        "SELECT id, email, password_hash, full_name, role, tenant_id FROM profiles WHERE email = $1 LIMIT 1",
        [email]
      )

      if (result.rows.length === 0) {
        throw new Error("Profile not found")
      }

      const profile = result.rows[0]

      if (!profile.password_hash) {
        throw new Error("Password hash not found for user")
      }

      const passwordValid = await this.verifyPassword(passwordPlain, profile.password_hash)

      if (!passwordValid) {
        throw new Error("Invalid login credentials")
      }

      return profile
    } catch (error) {
      console.error("Error verifying password:", error)
      throw new Error("Invalid login credentials")
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async getUserProfile(userId: string): Promise<Profile> {
    const client = await this.postgresService.getClient()

    try {
      const result = await client.queryObject<Profile>(
        "SELECT id, email, full_name, role, tenant_id FROM profiles WHERE id = $1 LIMIT 1",
        [userId]
      )

      if (result.rows.length === 0) {
        throw new Error("Profile not found")
      }

      return result.rows[0]
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw new Error("Failed to fetch user profile")
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async getUserByEmail(email: string): Promise<Profile> {
    const client = await this.postgresService.getClient()

    try {
      const result = await client.queryObject<Profile>(
        "SELECT id, email, full_name, role, tenant_id FROM profiles WHERE email = $1 LIMIT 1",
        [email]
      )

      if (result.rows.length === 0) {
        throw new Error("Profile not found")
      }

      return result.rows[0]
    } catch (error) {
      console.error("Error fetching user profile:", error)
      throw new Error("Failed to fetch user profile")
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async createUser(email: string, passwordPlain: string, fullName: string, role: string, tenantId?: string): Promise<Profile> {
    const client = await this.postgresService.getClient()

    try {
      // Hash the password
      const hashedPassword = await this.hashPassword(passwordPlain)

      // Insert the new user
      const result = await client.queryObject<Profile>(
        `INSERT INTO profiles (email, password_hash, full_name, role, tenant_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING id, email, full_name, role, tenant_id`,
        [email, hashedPassword, fullName, role, tenantId]
      )

      if (result.rows.length === 0) {
        throw new Error("Failed to insert user")
      }

      console.log('New user created:', email)
      return result.rows[0]
    } catch (error) {
      console.error("Error creating user:", error)
      throw new Error("Failed to create user")
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const client = await this.postgresService.getClient()
    
    try {
      // Hash the new password
      const hashedPassword = await this.hashPassword(newPassword)
      
      // Update the password
      const result = await client.queryObject(
        'UPDATE profiles SET password_hash = $1, updated_at = NOW() WHERE email = $2',
        [hashedPassword, email]
      )
      
      if (result.rowCount === 0) {
        throw new Error('User not found')
      }
      
      console.log('Password updated successfully for user:', email)
    } finally {
      this.postgresService.releaseClient(client)
    }
  }

  async createUserWithPasswordInSchema(
    schema: string, 
    userId: string, 
    email: string, 
    fullName: string, 
    hashedPassword: string, 
    role: string
  ): Promise<Profile> {
    return await this.postgresService.executeInSchema(schema, async () => {
      const result = await this.postgresService.query(`
        INSERT INTO profiles (id, email, password_hash, full_name, role, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, full_name, role
      `, [userId, email, hashedPassword, fullName, role])

      if (result.rows.length === 0) {
        throw new Error("Failed to insert user in tenant schema")
      }

      console.log('User profile created in schema:', schema, 'for user:', email)
      return result.rows[0]
    })
  }
}

export const databaseService = new DatabaseService(new PostgresService())
