import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { kvStore } from "../../../shared/services/kvStore.ts";

/**
 * LuxTrust sandbox / mock endpoints (Oak), mounted under /api/luxtrust/*.
 */
const luxtrustRoutes = new Router();

luxtrustRoutes.post("/api/luxtrust/auth", async (ctx) => {
  try {
    console.log("LuxTrust authentication request received");

    if (Deno.env.get("DENO_ENV") !== "test") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const sessionId = crypto.randomUUID();

    const luxtrustResponse = {
      success: true,
      profile: {
        id: `lux-${Date.now()}`,
        firstName: "Dr. Jean",
        lastName: "Luxembourg",
        professionalId: "LUX-DOC-2024-001",
        certificationLevel: "professional" as const,
        isVerified: true,
      },
      signature: `LuxTrust-Signature-${Date.now()}`,
      timestamp: new Date().toISOString(),
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      sessionId: sessionId,
    };

    await kvStore.setLuxTrustVerification(sessionId, luxtrustResponse);

    console.log(
      "LuxTrust authentication successful, stored in KV with session:",
      sessionId,
    );

    ctx.response.type = "json";
    ctx.response.body = luxtrustResponse;
  } catch (error) {
    console.error("LuxTrust authentication error:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = {
      success: false,
      error: "LuxTrust authentication failed",
      timestamp: new Date().toISOString(),
    };
  }
});

luxtrustRoutes.post("/api/luxtrust/verify-id", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const luxtrustId = body?.luxtrustId as string;
    console.log("LuxTrust ID verification request for:", luxtrustId);

    const patterns = [
      /^LUX-\d{4}-\d{6}$/,
      /^LT-[A-Z]{3}-\d{6}$/,
      /^LUXTRUST-\d{6}$/,
      /^TEST-LUX-ID-\d{6}$/,
    ];

    const isValidFormat = patterns.some((pattern) => pattern.test(luxtrustId));

    if (!isValidFormat) {
      ctx.response.type = "json";
      ctx.response.body = {
        success: false,
        status: "failed",
        error: "Invalid LuxTrust ID format",
        timestamp: new Date().toISOString(),
      };
      return;
    }

    if (Deno.env.get("DENO_ENV") !== "test") {
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const isVerificationSuccessful = Math.random() > 0.1;

    const sessionId = crypto.randomUUID();
    const verificationResponse = {
      success: isVerificationSuccessful,
      status: isVerificationSuccessful ? "verified" : "failed",
      luxtrustId: luxtrustId,
      verificationId: `VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
    };

    await kvStore.set(
      ["luxtrust_id_verification", sessionId],
      verificationResponse,
      { expireIn: 3600000 },
    );

    ctx.response.type = "json";
    ctx.response.body = verificationResponse;
  } catch (error) {
    console.error("LuxTrust ID verification error:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = {
      success: false,
      status: "failed",
      error: "LuxTrust ID verification failed",
      timestamp: new Date().toISOString(),
    };
  }
});

luxtrustRoutes.post("/api/luxtrust/certification/upload", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const fileName = body?.fileName as string;
    const certificationType = body?.certificationType as string;
    const userId = body?.userId as string;
    console.log("Certification upload request:", fileName, certificationType);

    if (Deno.env.get("DENO_ENV") !== "test") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const sessionId = crypto.randomUUID();
    const certificationResponse = {
      success: true,
      certification: {
        id: `cert-${Date.now()}`,
        fileName: fileName,
        type: certificationType,
        status: "pending",
        uploadedAt: new Date().toISOString(),
        userId: userId,
      },
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    };

    await kvStore.set(
      ["certification_upload", sessionId],
      certificationResponse,
      { expireIn: 3600000 },
    );

    ctx.response.type = "json";
    ctx.response.body = certificationResponse;
  } catch (error) {
    console.error("Certification upload error:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = {
      success: false,
      error: "Certification upload failed",
      timestamp: new Date().toISOString(),
    };
  }
});

luxtrustRoutes.post("/api/luxtrust/certification/verify", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const certificationId = body?.certificationId as string;
    console.log("Certification verification request for:", certificationId);

    if (Deno.env.get("DENO_ENV") !== "test") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const sessionId = crypto.randomUUID();
    const verificationResponse = {
      success: true,
      verificationId: `LUX-VER-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      status: "verified",
      verifiedAt: new Date().toISOString(),
      certificationId: certificationId,
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    };

    await kvStore.set(
      ["certification_verification", sessionId],
      verificationResponse,
      { expireIn: 3600000 },
    );

    ctx.response.type = "json";
    ctx.response.body = verificationResponse;
  } catch (error) {
    console.error("Certification verification error:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = {
      success: false,
      error: "Certification verification failed",
      timestamp: new Date().toISOString(),
    };
  }
});

luxtrustRoutes.post("/api/luxtrust/location/detect", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const countryCode = body?.countryCode as string;
    console.log("Location detection request for:", countryCode);

    if (Deno.env.get("DENO_ENV") !== "test") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const sessionId = crypto.randomUUID();
    const locationResponse = {
      success: true,
      detectedCountry: countryCode,
      isLuxembourg: countryCode === "LU",
      luxtrustAvailable: countryCode === "LU",
      sessionId: sessionId,
      timestamp: new Date().toISOString(),
    };

    await kvStore.setLocationData(sessionId, locationResponse);

    ctx.response.type = "json";
    ctx.response.body = locationResponse;
  } catch (error) {
    console.error("Location detection error:", error);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = {
      success: false,
      error: "Location detection failed",
      timestamp: new Date().toISOString(),
    };
  }
});

export { luxtrustRoutes };
