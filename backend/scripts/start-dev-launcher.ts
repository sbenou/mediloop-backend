
// Cross-platform launcher for start-dev script
const isWindows = Deno.build.os === "windows";

const command = isWindows 
  ? ["cmd", "/c", "scripts\\start-dev.bat"]
  : ["bash", "scripts/start-dev.sh"];

console.log(`🚀 Launching development server (${Deno.build.os})...`);

const process = new Deno.Command(command[0], {
  args: command.slice(1),
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await process.output();
Deno.exit(code);
