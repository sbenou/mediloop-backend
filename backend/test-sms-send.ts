import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
await load({ export: true });

import { smsService } from "./services/smsService.ts";

// Load .env file
const env = await load();

console.log("📱 Testing SMS sending...\n");

// IMPORTANT: Use YOUR verified phone number (the one you used to sign up with Twilio)
const testPhone = env.SMS_SENDER_ID || Deno.env.get("SMS_SENDER_ID");
const testOTP = "123456";

try {
  console.log("Sending OTP to:", testPhone);
  await smsService.sendOTP(testPhone, testOTP);
  console.log("\n✅ SMS sent successfully!");
  console.log("📱 Check your phone for the message!");
} catch (error) {
  console.error("\n❌ Failed to send SMS:");
  console.error(error.message);
}
