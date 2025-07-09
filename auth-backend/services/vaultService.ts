
export class VaultService {
  private vaultUrl: string;
  private vaultToken: string;
  private secretsCache: Map<string, any> = new Map();

  constructor() {
    this.vaultUrl = Deno.env.get('VAULT_URL') || 'http://localhost:8200';
    this.vaultToken = Deno.env.get('VAULT_TOKEN') || '';
    
    if (!this.vaultToken) {
      console.warn('VAULT_TOKEN not set - Vault operations will fail');
    }
  }

  async getSecret(path: string): Promise<any> {
    // Check cache first
    if (this.secretsCache.has(path)) {
      return this.secretsCache.get(path);
    }

    try {
      const response = await fetch(`${this.vaultUrl}/v1/secret/data/${path}`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.vaultToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Vault request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const secretData = data.data?.data;
      
      if (secretData) {
        // Cache the secret for 5 minutes
        this.secretsCache.set(path, secretData);
        setTimeout(() => this.secretsCache.delete(path), 5 * 60 * 1000);
      }

      return secretData;
    } catch (error) {
      console.error(`Failed to fetch secret from Vault at path ${path}:`, error);
      throw error;
    }
  }

  async setSecret(path: string, secrets: Record<string, string>): Promise<void> {
    try {
      const response = await fetch(`${this.vaultUrl}/v1/secret/data/${path}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': this.vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: secrets
        }),
      });

      if (!response.ok) {
        throw new Error(`Vault write failed: ${response.status} ${response.statusText}`);
      }

      // Update cache
      this.secretsCache.set(path, secrets);
    } catch (error) {
      console.error(`Failed to write secret to Vault at path ${path}:`, error);
      throw error;
    }
  }

  async deleteSecret(path: string): Promise<void> {
    try {
      const response = await fetch(`${this.vaultUrl}/v1/secret/data/${path}`, {
        method: 'DELETE',
        headers: {
          'X-Vault-Token': this.vaultToken,
        },
      });

      if (!response.ok) {
        throw new Error(`Vault delete failed: ${response.status} ${response.statusText}`);
      }

      // Remove from cache
      this.secretsCache.delete(path);
    } catch (error) {
      console.error(`Failed to delete secret from Vault at path ${path}:`, error);
      throw error;
    }
  }

  clearCache(): void {
    this.secretsCache.clear();
  }
}

export const vaultService = new VaultService();
