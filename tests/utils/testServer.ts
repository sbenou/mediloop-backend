/**
 * Test Server Management Utility
 * Start and stop a test-specific server instance
 */

export class TestServer {
  private process: Deno.ChildProcess | null = null;
  private port: number;
  private baseUrl: string;

  constructor(port = 8001) {
    this.port = port;
    this.baseUrl = `http://localhost:${port}`;
  }

  /**
   * Start the test server
   */
  async start(): Promise<void> {
    console.log(`\n🚀 Starting test server on port ${this.port}...`);

    // Set test port
    Deno.env.set("TEST_PORT", this.port.toString());

    // Start server process - use "null" to discard output and prevent buffer overflow
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "--allow-run",
        "--unstable-kv",
        "backend/test-server.ts",
      ],
      cwd: Deno.cwd(),
      stdout: "null", // ✅ Use "null" to discard output (prevents buffer overflow)
      stderr: "null", // ✅ Use "null" to discard errors (prevents buffer overflow)
    });

    this.process = command.spawn();
    // ✅ DON'T capture processStatus here - it creates a resource leak warning
    // We'll handle the status promise only in stop() where it's actually used

    // Wait for server to be ready
    await this.waitForServer();
    console.log(`✅ Test server ready at ${this.baseUrl}\n`);
  }

  /**
   * Stop the test server
   */
  async stop(): Promise<void> {
    if (this.process) {
      console.log("\n🛑 Stopping test server...");

      try {
        // Kill the process
        this.process.kill("SIGTERM");

        // ✅ Capture and await the status promise HERE (in the same test where it completes)
        // This prevents resource leak warnings about promises started in one test and completed in another
        await this.process.status;
      } catch (error) {
        // Process already terminated or other error - that's okay
        console.log("  ℹ️  Process cleanup completed");
      }

      this.process = null;
      console.log("✅ Test server stopped\n");
    }
  }

  /**
   * Wait for the server to be ready by polling the health endpoint
   */
  private async waitForServer(maxAttempts = 30): Promise<void> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/health`, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.ok) {
          return;
        }
      } catch {
        // Server not ready yet
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error("Test server failed to start within timeout period");
  }

  /**
   * Get the base URL of the test server
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}
