/**
 * SMS Service for sending OTP codes via SMS
 *
 * This is a template/stub implementation.
 * Choose ONE of the following providers and implement:
 *
 * 1. Twilio (Most popular)
 * 2. AWS SNS (If you're on AWS)
 * 3. Vonage/Nexmo
 * 4. MessageBird
 * 5. Plivo
 */

export interface SMSServiceConfig {
  provider: "twilio" | "aws-sns" | "vonage" | "test";
  apiKey?: string;
  apiSecret?: string;
  senderId?: string; // Phone number or sender name
}

export class SMSService {
  private config: SMSServiceConfig;

  constructor() {
    // Load config from environment
    this.config = {
      provider: (Deno.env.get("SMS_PROVIDER") as any) || "test",
      apiKey: Deno.env.get("SMS_API_KEY"),
      apiSecret: Deno.env.get("SMS_API_SECRET"),
      senderId: Deno.env.get("SMS_SENDER_ID") || "Mediloop",
    };

    console.log(
      "📱 SMS Service initialized with provider:",
      this.config.provider,
    );
  }

  /**
   * Send OTP code via SMS
   */
  async sendOTP(phoneNumber: string, otpCode: string): Promise<void> {
    console.log(`📱 Sending OTP to ${phoneNumber}...`);

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      throw new Error(
        "Invalid phone number format. Use international format: +1234567890",
      );
    }

    switch (this.config.provider) {
      case "twilio":
        return await this.sendViaTwilio(phoneNumber, otpCode);
      case "aws-sns":
        return await this.sendViaAWSSNS(phoneNumber, otpCode);
      case "vonage":
        return await this.sendViaVonage(phoneNumber, otpCode);
      case "test":
        return await this.sendViaTestMode(phoneNumber, otpCode);
      default:
        throw new Error(`Unsupported SMS provider: ${this.config.provider}`);
    }
  }

  /**
   * Test mode - logs to console instead of sending
   */
  private async sendViaTestMode(
    phoneNumber: string,
    otpCode: string,
  ): Promise<void> {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📱 SMS TEST MODE - Message Details:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("To:", phoneNumber);
    console.log("From:", this.config.senderId);
    console.log("Message:");
    console.log(`  Your Mediloop password reset code is: ${otpCode}`);
    console.log(`  This code expires in 15 minutes.`);
    console.log(`  If you didn't request this, please ignore.`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ SMS logged (not sent - test mode)");
  }

  /**
   * Send via Twilio
   * Docs: https://www.twilio.com/docs/sms/quickstart/node
   */
  private async sendViaTwilio(
    phoneNumber: string,
    otpCode: string,
  ): Promise<void> {
    if (!this.config.apiKey || !this.config.apiSecret) {
      throw new Error(
        "Twilio credentials not configured. Set SMS_API_KEY and SMS_API_SECRET",
      );
    }

    const accountSid = this.config.apiKey;
    const authToken = this.config.apiSecret;
    const fromNumber = this.config.senderId;

    const message = `Your Mediloop password reset code is: ${otpCode}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, please ignore this message.`;

    try {
      // Twilio REST API
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const auth = btoa(`${accountSid}:${authToken}`);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: phoneNumber,
          Body: message,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Twilio API error:", error);
        throw new Error(
          `Failed to send SMS via Twilio: ${response.statusText}`,
        );
      }

      const result = await response.json();
      console.log("✅ SMS sent via Twilio. SID:", result.sid);
    } catch (error) {
      console.error("❌ Failed to send SMS via Twilio:", error);
      throw error;
    }
  }

  /**
   * Send via AWS SNS
   * Docs: https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html
   */
  private async sendViaAWSSNS(
    phoneNumber: string,
    otpCode: string,
  ): Promise<void> {
    console.warn("⚠️  AWS SNS implementation pending");
    throw new Error("AWS SNS SMS sending not yet implemented");

    // TODO: Implement AWS SNS using AWS SDK
    // const { SNSClient, PublishCommand } = await import("@aws-sdk/client-sns");
    // const client = new SNSClient({ region: "us-east-1" });
    // ...
  }

  /**
   * Send via Vonage (formerly Nexmo)
   * Docs: https://developer.vonage.com/en/messaging/sms/overview
   */
  private async sendViaVonage(
    phoneNumber: string,
    otpCode: string,
  ): Promise<void> {
    console.warn("⚠️  Vonage implementation pending");
    throw new Error("Vonage SMS sending not yet implemented");

    // TODO: Implement Vonage
    // const { Vonage } = await import("@vonage/server-sdk");
    // const vonage = new Vonage({ apiKey, apiSecret });
    // ...
  }

  /**
   * Validate phone number format (basic check)
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Must start with + and contain 10-15 digits
    const phoneRegex = /^\+[1-9]\d{9,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number for display (mask middle digits)
   */
  formatPhoneForDisplay(phoneNumber: string): string {
    if (!phoneNumber) return "";

    // +1234567890 -> +12****7890
    if (phoneNumber.length > 6) {
      const start = phoneNumber.slice(0, 3);
      const end = phoneNumber.slice(-4);
      return `${start}****${end}`;
    }

    return phoneNumber;
  }
}

// Export singleton instance
export const smsService = new SMSService();
