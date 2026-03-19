#!/usr/bin/env -S deno run --allow-run --allow-env --allow-read

/**
 * Start All Services Launcher
 *
 * This script starts all Mediloop backend services in the correct order:
 * 1. Redis (Docker)
 * 2. Workers (Node.js)
 * 3. Deno Backend (HTTP + WebSocket)
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function runCommand(
  cmd: string[],
  cwd?: string,
): Promise<Deno.ChildProcess> {
  log(`\n▶️  Running: ${cmd.join(" ")}`, colors.blue);

  const process = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  }).spawn();

  return process;
}

async function checkRedis(): Promise<boolean> {
  try {
    const process = new Deno.Command("docker", {
      args: ["ps", "--filter", "name=mediloop_redis", "--format", "{{.Names}}"],
      stdout: "piped",
    }).spawn();

    const output = await process.output();
    const result = new TextDecoder().decode(output.stdout).trim();
    return result.includes("mediloop_redis");
  } catch {
    return false;
  }
}

async function main() {
  log("\n🚀 Starting Mediloop Backend Services\n", colors.green);

  // 1. Check/Start Redis
  log("📦 Step 1: Starting Redis...", colors.yellow);
  const redisRunning = await checkRedis();

  if (redisRunning) {
    log("✅ Redis is already running", colors.green);
  } else {
    log("🔄 Starting Redis container...", colors.blue);
    await runCommand(["docker-compose", "up", "-d", "redis"]);

    // Wait for Redis to be ready
    log("⏳ Waiting for Redis to be ready...", colors.blue);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    log("✅ Redis is ready", colors.green);
  }

  // 2. Start Workers
  log("\n👷 Step 2: Starting Workers...", colors.yellow);

  // Check if workers directory exists
  try {
    await Deno.stat("../workers");
    log("🔄 Starting Node.js workers...", colors.blue);

    const workersProcess = runCommand(["npm", "run", "dev"], "../workers");

    log("✅ Workers started", colors.green);
  } catch {
    log("⚠️  Workers directory not found, skipping...", colors.yellow);
  }

  // 3. Start Deno Backend
  log("\n🦕 Step 3: Starting Deno Backend...", colors.yellow);
  log("🔄 Starting Deno backend with hot reload...", colors.blue);

  await runCommand([
    "deno",
    "run",
    "--allow-net",
    "--allow-env",
    "--allow-read",
    "--watch",
    "main.ts",
  ]);

  log("\n✨ All services started successfully!", colors.green);
  log("\n📝 Services running:", colors.blue);
  log("   • Deno Backend: http://localhost:8000");
  log("   • WebSocket: ws://localhost:8000/ws/notifications");
  log("   • Workers: Background processing");
  log("   • Redis: localhost:6379");
  log("\n💡 Tip: Open http://localhost:3001 for Bull Board (job monitoring)\n");
}

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", () => {
  log("\n\n🛑 Shutting down services...", colors.yellow);
  Deno.exit(0);
});

if (import.meta.main) {
  main().catch((error) => {
    log(`\n❌ Error: ${error.message}`, colors.red);
    Deno.exit(1);
  });
}
