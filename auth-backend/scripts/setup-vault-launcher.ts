
// Cross-platform launcher for setup-vault script
const isWindows = Deno.build.os === "windows";

const command = isWindows 
  ? ["cmd", "/c", "scripts\\setup-vault.bat"]
  : ["bash", "scripts/setup-vault.sh"];

console.log(`🔐 Launching Vault setup (${Deno.build.os})...`);

const process = new Deno.Command(command[0], {
  args: command.slice(1),
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await process.output();
Deno.exit(code);
