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

    // Start server process with visible output
    const command = new Deno.Command("deno", {
      args: [
        "run",
        "--allow-net",
        "--allow-env",
        "--allow-read",
        "--allow-run",
        "--unstable-kv", // ← ADD THIS LINE
        "auth-backend/test-server.ts",
      ],
      cwd: Deno.cwd(), // ← ADD THIS LINE to ensure correct working directory
      stdout: "inherit",
      stderr: "inherit",
    });

    this.process = command.spawn();

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
      this.process.kill("SIGTERM");
      await this.process.status;
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
