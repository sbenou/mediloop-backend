
// Deno KV service for session and data management
export class KVStore {
  private kv: Deno.Kv | null = null

  async initialize() {
    if (!this.kv) {
      this.kv = await Deno.openKv()
    }
    return this.kv
  }

  async set(key: string[], value: any, options?: { expireIn?: number }) {
    const kv = await this.initialize()
    await kv.set(key, value, options)
  }

  async get<T>(key: string[]): Promise<T | null> {
    const kv = await this.initialize()
    const result = await kv.get<T>(key)
    return result.value
  }

  async delete(key: string[]) {
    const kv = await this.initialize()
    await kv.delete(key)
  }

  async list<T>(selector: Deno.KvListSelector): Promise<T[]> {
    const kv = await this.initialize()
    const entries = []
    for await (const entry of kv.list<T>(selector)) {
      entries.push(entry.value)
    }
    return entries
  }

  // Session management methods
  async setSession(sessionId: string, sessionData: any, expireIn = 86400000) {
    await this.set(['sessions', sessionId], sessionData, { expireIn })
  }

  async getSession(sessionId: string) {
    return await this.get(['sessions', sessionId])
  }

  async deleteSession(sessionId: string) {
    await this.delete(['sessions', sessionId])
  }

  // LuxTrust specific methods
  async setLuxTrustVerification(sessionId: string, verificationData: any) {
    await this.set(['luxtrust_verification', sessionId], verificationData, { expireIn: 3600000 })
  }

  async getLuxTrustVerification(sessionId: string) {
    return await this.get(['luxtrust_verification', sessionId])
  }

  // Location detection methods
  async setLocationData(sessionId: string, locationData: any) {
    await this.set(['location_detection', sessionId], locationData, { expireIn: 3600000 })
  }
}

export const kvStore = new KVStore()
