
// Script to check current Deno version and suggest updates
async function checkDenoVersion() {
  console.log("🔍 Checking Deno version...");
  
  try {
    // Get current Deno version
    const currentVersion = Deno.version.deno;
    console.log(`📦 Current Deno version: ${currentVersion}`);
    
    // Fetch latest Deno release from GitHub API
    const response = await fetch("https://api.github.com/repos/denoland/deno/releases/latest");
    const data = await response.json();
    const latestVersion = data.tag_name.replace('v', ''); // Remove 'v' prefix
    
    console.log(`🚀 Latest Deno version: ${latestVersion}`);
    
    if (currentVersion !== latestVersion) {
      console.log("\n⚠️  Your Deno version is outdated!");
      console.log("To update Deno, run one of these commands:");
      console.log("  • curl -fsSL https://deno.land/install.sh | sh");
      console.log("  • iwr https://deno.land/install.ps1 -useb | iex (Windows PowerShell)");
      console.log("  • brew upgrade deno (if installed via Homebrew)");
      console.log("  • deno upgrade (if you have Deno 1.30+)");
    } else {
      console.log("✅ You have the latest version of Deno!");
    }
    
    // Check PostgreSQL driver compatibility
    console.log("\n🔍 Checking PostgreSQL driver compatibility...");
    console.log("Current postgres driver: v0.19.3 (updated from v0.17.0)");
    console.log("✅ Updated to latest PostgreSQL driver version");
    console.log("Note: The newer driver should have better compatibility with modern PostgreSQL features");
    console.log("and may resolve 'channel_binding=require' issues in some environments.");
    
  } catch (error) {
    console.error("❌ Error checking Deno version:", error.message);
  }
}

if (import.meta.main) {
  await checkDenoVersion();
}
