
// Cross-platform launcher for vault manager script
const isWindows = Deno.build.os === "windows";

const command = isWindows 
  ? ["cmd", "/c", "scripts\\vault-manager.bat"]
  : ["bash", "scripts/vault-manager.sh"];

// Pass through all command line arguments
const args = [...command.slice(1), ...Deno.args];

console.log(`🔐 Launching Vault Manager (${Deno.build.os})...`);

const process = new Deno.Command(command[0], {
  args: args,
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await process.output();
Deno.exit(code);
