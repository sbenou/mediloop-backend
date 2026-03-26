import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "../../../shared/config/env.ts";
import { enhancedJwtService } from "../services/enhancedJwtService.ts";
import { registrationService } from "../services/registrationService.ts";
import { kvStore } from "../../../shared/services/kvStore.ts";

const oauthRoutes = new Router();

function getClientIP(ctx: { request: { headers: Headers; ip?: string } }): string {
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return ctx.request.ip || "unknown";
}

function getUserAgent(ctx: { request: { headers: Headers } }): string {
  return ctx.request.headers.get("user-agent") || "unknown";
}

// Google OAuth initiation
oauthRoutes.get("/api/oauth/google", (ctx) => {
  const redirectUri = `${config.SERVICE_URL}/api/oauth/google/callback`;
  const scope = "openid email profile";
  const state = crypto.randomUUID();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", config.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  ctx.response.redirect(authUrl.toString());
});

// Google OAuth callback
oauthRoutes.get("/api/oauth/google/callback", async (ctx) => {
  try {
    const url = ctx.request.url;
    const code = url.searchParams.get("code");

    if (!code) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Authorization code required" };
      return;
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.GOOGLE_CLIENT_ID,
        client_secret: config.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: `${config.SERVICE_URL}/api/oauth/google/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error("Token exchange failed:", tokens);
      ctx.response.status = 400;
      ctx.response.body = { error: "Token exchange failed" };
      return;
    }

    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    const googleUser = await userResponse.json();
    console.log("Google user info:", googleUser);

    if (!googleUser.email || typeof googleUser.email !== "string") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email not provided by Google" };
      return;
    }

    const account = await registrationService.ensureUserForOAuth(
      googleUser.email,
      googleUser.name || googleUser.email,
      "google",
    );

    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);
    const { token: jwtToken } = await enhancedJwtService.createToken(
      account.id,
      account.email,
      account.role,
      ipAddress,
      userAgent,
    );

    const sessionId = crypto.randomUUID();
    await kvStore.setSession(sessionId, {
      userId: account.id,
      email: account.email,
      role: account.role,
      authMethod: "google",
      loginTime: new Date().toISOString(),
    });

    ctx.response.redirect(
      `${config.FRONTEND_URL}/auth/callback?token=${jwtToken}`,
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "OAuth callback failed" };
  }
});

// FranceConnect OAuth initiation
oauthRoutes.get("/api/oauth/franceconnect", (ctx) => {
  const redirectUri = `${config.SERVICE_URL}/api/oauth/franceconnect/callback`;
  const scope = "openid email profile";
  const state = crypto.randomUUID();

  const authUrl = new URL(
    "https://fcp.integ01.dev-franceconnect.fr/api/v1/authorize",
  );
  authUrl.searchParams.set("client_id", config.FRANCECONNECT_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scope);
  authUrl.searchParams.set("state", state);

  ctx.response.redirect(authUrl.toString());
});

// FranceConnect OAuth callback
oauthRoutes.get("/api/oauth/franceconnect/callback", async (ctx) => {
  try {
    const url = ctx.request.url;
    const code = url.searchParams.get("code");

    if (!code) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Authorization code required" };
      return;
    }

    const tokenResponse = await fetch(
      "https://fcp.integ01.dev-franceconnect.fr/api/v1/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.FRANCECONNECT_CLIENT_ID,
          client_secret: config.FRANCECONNECT_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: `${config.SERVICE_URL}/api/oauth/franceconnect/callback`,
        }),
      },
    );

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error("FranceConnect token exchange failed:", tokens);
      ctx.response.status = 400;
      ctx.response.body = { error: "Token exchange failed" };
      return;
    }

    const userResponse = await fetch(
      "https://fcp.integ01.dev-franceconnect.fr/api/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    );

    const fcUser = await userResponse.json();
    console.log("FranceConnect user info:", fcUser);

    if (!fcUser.email || typeof fcUser.email !== "string") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email not provided by FranceConnect" };
      return;
    }

    const fullName = `${fcUser.given_name ?? ""} ${fcUser.family_name ?? ""}`
      .trim() || fcUser.email;

    const account = await registrationService.ensureUserForOAuth(
      fcUser.email,
      fullName,
      "franceconnect",
    );

    const ipAddress = getClientIP(ctx);
    const userAgent = getUserAgent(ctx);
    const { token: jwtToken } = await enhancedJwtService.createToken(
      account.id,
      account.email,
      account.role,
      ipAddress,
      userAgent,
    );

    const sessionId = crypto.randomUUID();
    await kvStore.setSession(sessionId, {
      userId: account.id,
      email: account.email,
      role: account.role,
      authMethod: "franceconnect",
      loginTime: new Date().toISOString(),
    });

    ctx.response.redirect(
      `${config.FRONTEND_URL}/auth/callback?token=${jwtToken}`,
    );
  } catch (error) {
    console.error("FranceConnect OAuth callback error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "OAuth callback failed" };
  }
});

// LuxTrust OAuth placeholder (full mock flows live under /api/luxtrust/*)
oauthRoutes.get("/api/oauth/luxtrust", (ctx) => {
  ctx.response.status = 501;
  ctx.response.body = {
    error: "Use POST /api/luxtrust/auth for the LuxTrust sandbox flow",
  };
});

export { oauthRoutes };
