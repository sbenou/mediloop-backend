import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "../../../shared/config/env.ts";
import { jwtService } from "../services/jwtService.ts";
import { databaseService } from "../../../shared/services/databaseService.ts";
import { kvStore } from "../../../shared/services/kvStore.ts";

const oauthRoutes = new Router();

// Google OAuth initiation
oauthRoutes.get("/oauth/google", (ctx) => {
  const redirectUri = `${config.SERVICE_URL}/oauth/google/callback`;
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
oauthRoutes.get("/oauth/google/callback", async (ctx) => {
  try {
    const url = ctx.request.url;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Authorization code required" };
      return;
    }

    // Exchange code for tokens
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
        redirect_uri: `${config.SERVICE_URL}/oauth/google/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      console.error("Token exchange failed:", tokens);
      ctx.response.status = 400;
      ctx.response.body = { error: "Token exchange failed" };
      return;
    }

    // Get user info from Google
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

    // Create or get user profile
    const profile = await databaseService.getOrCreateUserProfile(
      googleUser.email,
      googleUser.name,
      "google",
    );

    // Create JWT token
    const jwtToken = await jwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id,
    );

    // Store session in KV
    const sessionId = crypto.randomUUID();
    await kvStore.setSession(sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      authMethod: "google",
      loginTime: new Date().toISOString(),
    });

    // Redirect to frontend with token
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
oauthRoutes.get("/oauth/franceconnect", (ctx) => {
  const redirectUri = `${config.SERVICE_URL}/oauth/franceconnect/callback`;
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
oauthRoutes.get("/oauth/franceconnect/callback", async (ctx) => {
  try {
    const url = ctx.request.url;
    const code = url.searchParams.get("code");

    if (!code) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Authorization code required" };
      return;
    }

    // Exchange code for tokens
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
          redirect_uri: `${config.SERVICE_URL}/oauth/franceconnect/callback`,
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

    // Get user info from FranceConnect
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

    // Create or get user profile
    const profile = await databaseService.getOrCreateUserProfile(
      fcUser.email,
      `${fcUser.given_name} ${fcUser.family_name}`,
      "franceconnect",
    );

    // Create JWT token
    const jwtToken = await jwtService.createToken(
      profile.id,
      profile.email,
      profile.role,
      profile.tenant_id,
    );

    // Store session in KV
    const sessionId = crypto.randomUUID();
    await kvStore.setSession(sessionId, {
      userId: profile.id,
      email: profile.email,
      role: profile.role,
      authMethod: "franceconnect",
      loginTime: new Date().toISOString(),
    });

    // Redirect to frontend with token
    ctx.response.redirect(
      `${config.FRONTEND_URL}/auth/callback?token=${jwtToken}`,
    );
  } catch (error) {
    console.error("FranceConnect OAuth callback error:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "OAuth callback failed" };
  }
});

// LuxTrust OAuth placeholder
oauthRoutes.get("/oauth/luxtrust", (ctx) => {
  // Note: This is a placeholder - actual LuxTrust endpoints would need to be configured
  ctx.response.status = 501;
  ctx.response.body = {
    error: "LuxTrust OAuth integration not yet configured",
  };
});

export { oauthRoutes };
