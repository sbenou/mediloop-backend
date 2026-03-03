#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read

// Test script to verify Twilio environment variables
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";

console.log("🔍 Testing Twilio Environment Variables...\n");

// Load .env file
const env = await load();

console.log("📋 Environment Variables:");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

const provider = env.SMS_PROVIDER || Deno.env.get("SMS_PROVIDER");
const apiKey = env.SMS_API_KEY || Deno.env.get("SMS_API_KEY");
const apiSecret = env.SMS_API_SECRET || Deno.env.get("SMS_API_SECRET");
const senderId = env.SMS_SENDER_ID || Deno.env.get("SMS_SENDER_ID");

if (provider) {
  console.log("✅ SMS_PROVIDER:", provider);
} else {
  console.log("❌ SMS_PROVIDER: NOT SET");
}

if (apiKey) {
  console.log(
    "✅ SMS_API_KEY:",
    apiKey.substring(0, 10) + "..." + " (length: " + apiKey.length + ")",
  );
} else {
  console.log("❌ SMS_API_KEY: NOT SET");
}

if (apiSecret) {
  console.log(
    "✅ SMS_API_SECRET:",
    apiSecret.substring(0, 10) + "..." + " (length: " + apiSecret.length + ")",
  );
} else {
  console.log("❌ SMS_API_SECRET: NOT SET");
}

if (senderId) {
  console.log("✅ SMS_SENDER_ID:", senderId);
} else {
  console.log("❌ SMS_SENDER_ID: NOT SET");
}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

// Validation
let allSet = true;
const required = [
  { name: "SMS_PROVIDER", value: provider },
  { name: "SMS_API_KEY", value: apiKey },
  { name: "SMS_API_SECRET", value: apiSecret },
  { name: "SMS_SENDER_ID", value: senderId },
];

for (const { name, value } of required) {
  if (!value) {
    console.log(`❌ Missing: ${name}`);
    allSet = false;
  }
}

if (allSet) {
  console.log("✅ All Twilio environment variables are set!");
  console.log("\n🎉 Ready to send SMS!");
} else {
  console.log("\n⚠️  Some environment variables are missing.");
  console.log("Please check your .env file.");
}

// Check .env file location
try {
  const stat = await Deno.stat(".env");
  console.log("\n📁 .env file found in current directory");
  console.log(`   Size: ${stat.size} bytes`);
  console.log(`   Modified: ${stat.mtime}`);
} catch {
  console.log("\n❌ .env file NOT found in current directory!");
  console.log(
    "   Make sure you're running this from the directory containing .env",
  );
}
