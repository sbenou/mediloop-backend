/**
 * Generates docs/postman/Mediloop-Backend.postman_collection.json (v2.1).
 * Run: node scripts/generate-postman-collection.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "docs", "postman");
const outFile = join(outDir, "Mediloop-Backend.postman_collection.json");

const jsonHeader = {
  key: "Content-Type",
  value: "application/json",
};

function noauth() {
  return { type: "noauth" };
}

function bearerInherited() {
  return undefined;
}

/**
 * @param {object} o
 * @param {string} o.name
 * @param {string} o.method
 * @param {string} o.path - path only, e.g. /api/auth/login
 * @param {string} [o.desc]
 * @param {boolean} [o.public]
 * @param {object} [o.body] - raw json string for body
 * @param {Array<{key:string,value:string,disabled?:boolean}>} [o.extraHeaders]
 */
function item(o) {
  const headers = [];
  if (o.method !== "GET" && o.method !== "DELETE" && o.body) {
    headers.push(jsonHeader);
  }
  if (o.extraHeaders) headers.push(...o.extraHeaders);

  const auth = o.public ? noauth() : bearerInherited();

  /** @type {Record<string, unknown>} */
  const req = {
    method: o.method,
    header: headers.length ? headers : undefined,
    url: `{{baseUrl}}${o.path}`,
  };

  if (auth) req.auth = auth;

  if (o.body) {
    req.body = { mode: "raw", raw: o.body };
  }

  if (o.desc) {
    req.description = o.desc;
  }

  return { name: o.name, request: req };
}

const collection = {
  info: {
    name: "Mediloop Backend",
    description:
      "Mediloop HTTP API (from backend/main.ts). Set collection variables: baseUrl, accessToken. Optional Option C: set **both** tenantId + membershipId (user_tenants.id UUID), or leave both empty. A pre-request script sends workspace headers only when both are non-empty.\n\nWebSocket: ws://{{host}}:{{port}}/ws/notifications (not HTTP).",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  auth: {
    type: "bearer",
    bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }],
  },
  event: [
    {
      listen: "prerequest",
      script: {
        type: "text/javascript",
        exec: [
          "const t = (pm.collectionVariables.get('tenantId') || '').trim();",
          "const m = (pm.collectionVariables.get('membershipId') || '').trim();",
          "if (t && m) {",
          "  pm.request.headers.upsert({ key: 'X-Mediloop-Tenant-Id', value: t });",
          "  pm.request.headers.upsert({ key: 'X-Mediloop-Membership-Id', value: m });",
          "} else {",
          "  pm.request.headers.remove('X-Mediloop-Tenant-Id');",
          "  pm.request.headers.remove('X-Mediloop-Membership-Id');",
          "}",
        ],
      },
    },
  ],
  variable: [
    { key: "baseUrl", value: "http://localhost:8000" },
    { key: "accessToken", value: "" },
    { key: "tenantId", value: "" },
    { key: "membershipId", value: "" },
    { key: "verificationToken", value: "" },
    { key: "inviteToken", value: "" },
    { key: "resetToken", value: "" },
    { key: "wearableId", value: "" },
    { key: "subscriptionId", value: "" },
    { key: "stripeCustomerId", value: "" },
  ],
  item: [
    {
      name: "Health",
      item: [
        item({
          name: "GET Health",
          method: "GET",
          path: "/health",
          public: true,
        }),
      ],
    },
    {
      name: "Auth — Core",
      item: [
        item({
          name: "POST Register",
          method: "POST",
          path: "/api/auth/register",
          public: true,
          body: `{
  "email": "newuser@example.com",
  "password": "SecurePass1!",
  "fullName": "Test User",
  "role": "patient",
  "workplaceName": null,
  "pharmacyName": null
}`,
        }),
        item({
          name: "GET Verify email (query)",
          method: "GET",
          path: "/api/auth/verify-email?token={{verificationToken}}",
          public: true,
        }),
        item({
          name: "POST Verify email (body)",
          method: "POST",
          path: "/api/auth/verify-email",
          public: true,
          body: `{
  "token": "{{verificationToken}}"
}`,
        }),
        item({
          name: "POST Resend verification",
          method: "POST",
          path: "/api/auth/resend-verification",
          public: true,
          body: `{
  "email": "user@example.com"
}`,
        }),
        item({
          name: "GET Verification status",
          method: "GET",
          path: "/api/auth/verification-status?email=user@example.com",
          public: true,
        }),
        item({
          name: "POST Login",
          method: "POST",
          path: "/api/auth/login",
          public: true,
          body: `{
  "email": "user@example.com",
  "password": "your-password"
}`,
        }),
        item({
          name: "POST Logout",
          method: "POST",
          path: "/api/auth/logout",
          desc: "Uses Authorization: Bearer (collection auth). Revokes current access token.",
          body: `{}`,
        }),
        item({
          name: "POST Verify token",
          method: "POST",
          path: "/api/auth/verify-token",
          desc: "Public middleware route, but requires Authorization: Bearer with the JWT to verify.",
          body: `{}`,
        }),
        item({
          name: "POST Refresh",
          method: "POST",
          path: "/api/auth/refresh",
          public: true,
          body: `{
  "refresh_token": "{{accessToken}}"
}`,
        }),
        item({
          name: "GET Profile",
          method: "GET",
          path: "/api/auth/profile",
        }),
      ],
    },
    {
      name: "Auth — Password reset",
      item: [
        item({
          name: "POST Request reset OTP",
          method: "POST",
          path: "/api/auth/request-password-reset-otp",
          public: true,
          body: `{
  "email": "user@example.com"
}`,
        }),
        item({
          name: "POST Reset password with OTP",
          method: "POST",
          path: "/api/auth/reset-password-with-otp",
          public: true,
          body: `{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "NewSecurePass1!"
}`,
        }),
        item({
          name: "POST Request reset link",
          method: "POST",
          path: "/api/auth/request-password-reset-link",
          public: true,
          body: `{
  "email": "user@example.com"
}`,
        }),
        item({
          name: "POST Reset password with token",
          method: "POST",
          path: "/api/auth/reset-password-with-token",
          public: true,
          body: `{
  "token": "{{resetToken}}",
  "newPassword": "NewSecurePass1!"
}`,
        }),
        item({
          name: "GET Verify reset token",
          method: "GET",
          path: "/api/auth/verify-reset-token/{{resetToken}}",
          public: true,
        }),
      ],
    },
    {
      name: "Auth — Invitations",
      item: [
        item({
          name: "POST Create invitation (deprecated)",
          method: "POST",
          path: "/api/invitations/create",
          body: `{
  "email": "invitee@example.com",
  "tenantId": "00000000-0000-4000-8000-000000000000",
  "role": "doctor",
  "message": "Join us",
  "expiresInHours": 72
}`,
        }),
        item({
          name: "POST Send invitation",
          method: "POST",
          path: "/api/invitations/send",
          body: `{
  "email": "invitee@example.com",
  "tenantId": "00000000-0000-4000-8000-000000000000",
  "role": "doctor",
  "message": "Join us"
}`,
        }),
        item({
          name: "GET Validate invitation",
          method: "GET",
          path: "/api/invitations/validate/{{inviteToken}}",
          public: true,
        }),
        item({
          name: "POST Accept invitation",
          method: "POST",
          path: "/api/invitations/accept",
          public: true,
          body: `{
  "token": "{{inviteToken}}",
  "password": "SecurePass1!",
  "fullName": "Invited User"
}`,
        }),
        item({
          name: "GET My pending invites",
          method: "GET",
          path: "/api/invitations/pending/my-invites",
        }),
      ],
    },
    {
      name: "Auth — OAuth",
      item: [
        item({
          name: "GET Google OAuth start",
          method: "GET",
          path: "/api/oauth/google",
          public: true,
          body: undefined,
        }),
        item({
          name: "GET Google OAuth callback",
          method: "GET",
          path: "/api/oauth/google/callback?code=...",
          public: true,
        }),
        item({
          name: "GET FranceConnect start",
          method: "GET",
          path: "/api/oauth/franceconnect",
          public: true,
        }),
        item({
          name: "GET FranceConnect callback",
          method: "GET",
          path: "/api/oauth/franceconnect/callback?code=...",
          public: true,
        }),
        item({
          name: "GET OAuth LuxTrust placeholder",
          method: "GET",
          path: "/api/oauth/luxtrust",
          public: true,
        }),
      ],
    },
    {
      name: "Auth — LuxTrust sandbox",
      item: [
        item({
          name: "POST LuxTrust auth",
          method: "POST",
          path: "/api/luxtrust/auth",
          public: true,
          body: `{}`,
        }),
        item({
          name: "POST Verify LuxTrust ID",
          method: "POST",
          path: "/api/luxtrust/verify-id",
          public: true,
          body: `{
  "luxtrustId": "LUX-2024-123456"
}`,
        }),
        item({
          name: "POST Certification upload",
          method: "POST",
          path: "/api/luxtrust/certification/upload",
          public: true,
          body: `{
  "fileName": "cert.pdf",
  "certificationType": "medical",
  "userId": "00000000-0000-4000-8000-000000000000"
}`,
        }),
        item({
          name: "POST Certification verify",
          method: "POST",
          path: "/api/luxtrust/certification/verify",
          public: true,
          body: `{
  "certificationId": "cert-123"
}`,
        }),
        item({
          name: "POST Location detect",
          method: "POST",
          path: "/api/luxtrust/location/detect",
          public: true,
          body: `{
  "countryCode": "LU"
}`,
        }),
      ],
    },
    {
      name: "Auth — Domain verification",
      item: [
        item({
          name: "POST Initiate verification",
          method: "POST",
          path: "/api/domain/initiate-verification",
          body: `{
  "tenantId": "00000000-0000-4000-8000-000000000000",
  "domain": "clinic.example.com"
}`,
        }),
        item({
          name: "POST Verify domain",
          method: "POST",
          path: "/api/domain/verify",
          body: `{
  "verificationId": "verification-id-from-initiate"
}`,
        }),
        item({
          name: "DELETE Remove domain",
          method: "DELETE",
          path: "/api/domain/remove",
          body: `{
  "tenantId": "00000000-0000-4000-8000-000000000000"
}`,
        }),
        item({
          name: "GET Verifications for tenant",
          method: "GET",
          path: "/api/domain/verifications/00000000-0000-4000-8000-000000000000",
        }),
      ],
    },
    {
      name: "Auth — Token management (legacy paths)",
      item: [
        item({
          name: "POST Refresh token",
          method: "POST",
          path: "/refresh-token",
          public: true,
          body: `{
  "token": "{{accessToken}}"
}`,
        }),
        item({
          name: "POST Revoke token",
          method: "POST",
          path: "/revoke-token",
          body: `{
  "token": "{{accessToken}}",
  "reason": "USER_REVOKED"
}`,
        }),
        item({
          name: "POST Revoke all tokens",
          method: "POST",
          path: "/revoke-all-tokens",
          body: `{
  "reason": "USER_SIGNOUT_ALL"
}`,
        }),
        item({
          name: "GET Sessions",
          method: "GET",
          path: "/sessions",
        }),
        item({
          name: "GET Security log",
          method: "GET",
          path: "/security-log?limit=50",
        }),
        item({
          name: "POST Verify token (legacy)",
          method: "POST",
          path: "/verify-token",
          desc: "Requires Authorization: Bearer with the JWT.",
          body: `{}`,
        }),
        item({
          name: "POST Cleanup expired tokens",
          method: "POST",
          path: "/cleanup-expired",
          body: `{}`,
        }),
      ],
    },
    {
      name: "Auth — Token rotation (legacy paths)",
      item: [
        item({
          name: "GET Rotated token",
          method: "GET",
          path: "/rotated-token",
        }),
        item({
          name: "POST Trigger rotation (manual)",
          method: "POST",
          path: "/trigger-rotation",
          body: `{}`,
        }),
      ],
    },
    {
      name: "Email",
      item: [
        item({
          name: "POST Send templated email",
          method: "POST",
          path: "/api/send-templated-email",
          body: `{
  "templateName": "welcome",
  "recipientEmail": "user@example.com",
  "variables": { "name": "Ada" }
}`,
        }),
        item({
          name: "GET Email templates",
          method: "GET",
          path: "/api/email-templates",
        }),
        item({
          name: "GET Email logs",
          method: "GET",
          path: "/api/email-logs?limit=50",
        }),
        item({
          name: "POST Send login email",
          method: "POST",
          path: "/api/send-login-email",
          body: `{
  "email": "user@example.com",
  "otp": "123456"
}`,
        }),
      ],
    },
    {
      name: "Wearables",
      item: [
        item({ name: "GET Wearables", method: "GET", path: "/api/wearables" }),
        item({
          name: "POST Wearable",
          method: "POST",
          path: "/api/wearables",
          body: `{
  "device_type": "apple_watch",
  "device_name": "Watch",
  "device_id": "device-unique-id",
  "connection_status": "connected",
  "battery_level": 80,
  "meta": {}
}`,
        }),
        item({
          name: "PATCH Wearable",
          method: "PATCH",
          path: "/api/wearables/{{wearableId}}",
          body: `{
  "last_synced": "2025-01-01T12:00:00.000Z",
  "battery_level": 75,
  "connection_status": "connected"
}`,
        }),
        item({
          name: "DELETE Wearable",
          method: "DELETE",
          path: "/api/wearables/{{wearableId}}",
        }),
      ],
    },
    {
      name: "Clinical",
      item: [
        item({
          name: "GET Prescriptions",
          method: "GET",
          path: "/api/prescriptions",
        }),
        item({
          name: "GET Teleconsultations",
          method: "GET",
          path: "/api/teleconsultations",
        }),
        item({
          name: "GET Has accepted doctor",
          method: "GET",
          path: "/api/clinical/has-accepted-doctor",
        }),
      ],
    },
    {
      name: "Notifications",
      item: [
        item({
          name: "POST Send notification",
          method: "POST",
          path: "/api/notifications/send",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "notification": { "title": "Hi", "body": "Test" },
  "channels": ["in_app"]
}`,
        }),
        item({
          name: "POST Send to topic",
          method: "POST",
          path: "/api/notifications/send-to-topic",
          body: `{
  "topic": "news",
  "notification": { "title": "Broadcast", "body": "Test" },
  "channels": ["push"]
}`,
        }),
        item({
          name: "POST Send to multiple",
          method: "POST",
          path: "/api/notifications/send-to-multiple",
          body: `{
  "userIds": ["00000000-0000-4000-8000-000000000000"],
  "notification": { "title": "Hi", "body": "Test" },
  "channels": ["in_app"]
}`,
        }),
        item({
          name: "POST Schedule",
          method: "POST",
          path: "/api/notifications/schedule",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "notification": { "title": "Later", "body": "Test" },
  "sendAt": "2030-01-01T12:00:00.000Z",
  "channels": ["in_app"]
}`,
        }),
        item({
          name: "POST Register FCM token",
          method: "POST",
          path: "/api/notifications/register-token",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "fcmToken": "fcm-token-here",
  "platform": "web",
  "deviceId": "device-1"
}`,
        }),
        item({
          name: "POST Unregister FCM token",
          method: "POST",
          path: "/api/notifications/unregister-token",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "fcmToken": "fcm-token-here"
}`,
        }),
        item({
          name: "POST Subscribe to topic",
          method: "POST",
          path: "/api/notifications/subscribe-to-topic",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "topic": "some-topic"
}`,
        }),
        item({
          name: "POST Unsubscribe from topic",
          method: "POST",
          path: "/api/notifications/unsubscribe-from-topic",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "topic": "some-topic"
}`,
        }),
        item({
          name: "POST Update online status",
          method: "POST",
          path: "/api/notifications/update-online-status",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "isOnline": true
}`,
        }),
        item({
          name: "GET History",
          method: "GET",
          path: "/api/notifications/history?userId=00000000-0000-4000-8000-000000000000&limit=20",
        }),
        item({
          name: "POST Mark read",
          method: "POST",
          path: "/api/notifications/mark-read",
          body: `{
  "notificationId": "00000000-0000-4000-8000-000000000000"
}`,
        }),
        item({
          name: "GET Topics",
          method: "GET",
          path: "/api/notifications/topics?userId=00000000-0000-4000-8000-000000000000",
        }),
      ],
    },
    {
      name: "Payments — Subscriptions",
      item: [
        item({
          name: "POST Pharmacy checkout session",
          method: "POST",
          path: "/api/subscriptions/pharmacy",
          body: `{
  "userId": "00000000-0000-4000-8000-000000000000",
  "pharmacyId": "00000000-0000-4000-8000-000000000000"
}`,
        }),
        item({
          name: "POST Cancel pharmacy subscription",
          method: "POST",
          path: "/api/subscriptions/pharmacy/cancel",
          body: `{
  "subscriptionId": "{{subscriptionId}}"
}`,
        }),
        item({
          name: "GET Subscription by id",
          method: "GET",
          path: "/api/subscriptions/{{subscriptionId}}",
        }),
        item({
          name: "GET Subscriptions for Stripe customer",
          method: "GET",
          path: "/api/subscriptions/customer/{{stripeCustomerId}}",
        }),
      ],
    },
    {
      name: "Payments — Webhooks",
      item: [
        item({
          name: "POST Stripe webhook",
          method: "POST",
          path: "/api/webhooks/stripe",
          public: true,
          desc: "Send raw body + stripe-signature header (normally from Stripe, not Bearer).",
          extraHeaders: [
            { key: "stripe-signature", value: "<from-stripe>", type: "text" },
          ],
          body: "{}",
        }),
        item({
          name: "GET Webhook health",
          method: "GET",
          path: "/api/webhooks/health",
          public: true,
        }),
      ],
    },
  ],
};

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, JSON.stringify(collection, null, 2), "utf8");
console.log("Wrote", outFile);
