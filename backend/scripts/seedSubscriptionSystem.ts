#!/usr/bin/env -S deno run -A

/**
 * Complete Subscription System Seeding Script
 *
 * Seeds the database with:
 * - All rate limiting and capacity features
 * - 32 professional services (healthcare-specific)
 * - 3 standard subscription plans (Starter, Professional, Enterprise)
 *
 * Database targets (both when configured):
 * - **TEST_DATABASE_URL** from repo-root `.env.test`
 * - **DATABASE_URL_DEV** or **DATABASE_URL** from `backend/.env.development`
 * - If both URLs exist and differ, runs one subprocess per database (see `MEDILOOP_SUBSCRIPTION_SEED_CHILD`).
 * - Dev runs use `MEDILOOP_IGNORE_TEST_DATABASE_URL=1` so `.env.test` cannot override the dev URL
 *   (`shared/config/env.ts`).
 *
 * Run: deno run -A backend/scripts/seedSubscriptionSystem.ts
 */

import { load } from "@std/dotenv";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";
import {
  FeatureCategory,
  ServiceCategory,
  PlanStatus,
} from "../shared/types/index.ts";

const isChildProcess =
  Deno.env.get("MEDILOOP_SUBSCRIPTION_SEED_CHILD") === "1";

function trimUrl(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
}

/** Same merge rule as envLoader: do not override existing process env. */
function mergeIntoEnv(record: Record<string, string>) {
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined && !Deno.env.get(key)) {
      Deno.env.set(key, value);
    }
  }
}

const scriptDir = dirname(fromFileUrl(import.meta.url));
const backendDir = join(scriptDir, "..");

if (!isChildProcess) {
  const devPath = join(backendDir, ".env.development");
  const testPath = fromFileUrl(new URL("../../.env.test", import.meta.url));
  const devVars = (await load({ envPath: devPath }).catch(() => ({}))) as Record<
    string,
    string
  >;
  const testVars = (await load({ envPath: testPath }).catch(() => ({}))) as Record<
    string,
    string
  >;

  const testUrl = trimUrl(testVars["TEST_DATABASE_URL"]);
  const devUrl =
    trimUrl(devVars["DATABASE_URL_DEV"]) || trimUrl(devVars["DATABASE_URL"]);

  type Target = { label: string; kind: "test" | "dev" };
  const targets: Target[] = [];
  if (testUrl) {
    targets.push({
      label: "test (.env.test → TEST_DATABASE_URL)",
      kind: "test",
    });
  }
  if (devUrl && devUrl !== testUrl) {
    targets.push({
      label: "development (.env.development → DATABASE_URL_DEV / DATABASE_URL)",
      kind: "dev",
    });
  }

  if (targets.length === 0) {
    console.error(
      "No database URL found. Set TEST_DATABASE_URL in .env.test and/or DATABASE_URL_DEV (or DATABASE_URL) in backend/.env.development",
    );
    Deno.exit(1);
  }

  if (targets.length > 1) {
    for (const t of targets) {
      const base = Deno.env.toObject();
      const childEnv: Record<string, string> = {
        ...base,
        MEDILOOP_SUBSCRIPTION_SEED_CHILD: "1",
      };
      if (t.kind === "test") {
        childEnv["TEST_DATABASE_URL"] = testUrl!;
        delete childEnv["MEDILOOP_IGNORE_TEST_DATABASE_URL"];
      } else {
        childEnv["MEDILOOP_IGNORE_TEST_DATABASE_URL"] = "1";
        delete childEnv["TEST_DATABASE_URL"];
        childEnv["DATABASE_URL_DEV"] = devUrl!;
        childEnv["DATABASE_URL"] = devUrl!;
      }
      console.log(
        `\n${"=".repeat(60)}\n▶ Subscription seed: ${t.label}\n${"=".repeat(60)}\n`,
      );
      const st = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", fromFileUrl(import.meta.url)],
        cwd: backendDir,
        env: childEnv,
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      if (!st.success) Deno.exit(st.code ?? 1);
    }
    console.log("\n✅ Subscription catalog seeded on all configured databases.\n");
    Deno.exit(0);
  }

  if (targets[0]!.kind === "dev") {
    Deno.env.set("MEDILOOP_IGNORE_TEST_DATABASE_URL", "1");
    Deno.env.delete("TEST_DATABASE_URL");
    Deno.env.set("DATABASE_URL_DEV", devUrl!);
    Deno.env.set("DATABASE_URL", devUrl!);
  } else {
    Deno.env.delete("MEDILOOP_IGNORE_TEST_DATABASE_URL");
    Deno.env.set("TEST_DATABASE_URL", testUrl!);
  }
}

// Default `.env` in cwd (optional)
await load({ export: true });

// Repo-root `.env.test` — must run BEFORE any import of postgresService/env (config freezes DATABASE_URL on first load)
const envTestUrl = new URL("../../.env.test", import.meta.url);
try {
  const testVars = await load({ envPath: fromFileUrl(envTestUrl) }) as Record<
    string,
    string
  >;
  mergeIntoEnv(testVars);
  const testDbUrl = testVars["TEST_DATABASE_URL"];
  if (
    typeof testDbUrl === "string" &&
    testDbUrl.length > 0 &&
    Deno.env.get("MEDILOOP_IGNORE_TEST_DATABASE_URL") !== "1"
  ) {
    Deno.env.set("TEST_DATABASE_URL", testDbUrl);
  }
  if (Deno.env.get("MEDILOOP_IGNORE_TEST_DATABASE_URL") !== "1") {
    console.log(
      "✅ Loaded repository .env.test (TEST_DATABASE_URL applied for this seed run if present)",
    );
  }
} catch {
  // No repo-root .env.test — OK
}

const { postgresService } = await import("../shared/services/postgresService.ts");
const { FeatureService } = await import(
  "../modules/payments/services/featureService.ts"
);
const { ProfessionalService } = await import(
  "../modules/auth/services/professionalService.ts"
);
const { PlanService } = await import(
  "../modules/payments/services/planService.ts"
);

const featureService = new FeatureService();
const professionalService = new ProfessionalService();
const planService = new PlanService();

console.log("🌱 Seeding Mediloop Subscription System...\n");
console.log("=".repeat(60));

// ========== FEATURES ==========
console.log("\n📊 CREATING FEATURES");
console.log("=".repeat(60));

const features = [
  // RATE LIMITING FEATURES
  {
    name: "Login Rate Limit",
    key: "rate_limit_login",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum login attempts per time window",
    default_value: JSON.stringify({
      max_requests: 5,
      window_seconds: 900,
      enabled: true,
    }),
    value_type: "json" as const,
  },
  {
    name: "API Rate Limit",
    key: "rate_limit_api",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum API requests per minute",
    default_value: JSON.stringify({
      max_requests: 60,
      window_seconds: 60,
      enabled: true,
    }),
    value_type: "json" as const,
  },
  {
    name: "Password Reset Rate Limit",
    key: "rate_limit_password_reset",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum password reset requests per hour",
    default_value: JSON.stringify({
      max_requests: 3,
      window_seconds: 3600,
      enabled: true,
    }),
    value_type: "json" as const,
  },
  {
    name: "Registration Rate Limit",
    key: "rate_limit_registration",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum registration attempts",
    default_value: JSON.stringify({
      max_requests: 3,
      window_seconds: 3600,
      enabled: true,
    }),
    value_type: "json" as const,
  },
  {
    name: "OTP Request Rate Limit",
    key: "rate_limit_otp_request",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum OTP generation requests",
    default_value: JSON.stringify({
      max_requests: 5,
      window_seconds: 3600,
      enabled: true,
    }),
    value_type: "json" as const,
  },
  {
    name: "OTP Verify Rate Limit",
    key: "rate_limit_otp_verify",
    category: FeatureCategory.RATE_LIMITING,
    description: "Maximum OTP verification attempts",
    default_value: JSON.stringify({
      max_requests: 10,
      window_seconds: 900,
      enabled: true,
    }),
    value_type: "json" as const,
  },

  // STORAGE FEATURES
  {
    name: "Storage Limit",
    key: "storage_limit_gb",
    category: FeatureCategory.STORAGE,
    description: "Maximum storage space in GB",
    default_value: "10",
    value_type: "integer" as const,
  },
  {
    name: "Document Upload Limit",
    key: "storage_document_upload_mb",
    category: FeatureCategory.STORAGE,
    description: "Maximum single document upload size in MB",
    default_value: "10",
    value_type: "integer" as const,
  },

  // CAPACITY FEATURES
  {
    name: "Max Patients",
    key: "max_patients",
    category: FeatureCategory.CAPACITY,
    description: "Maximum number of active patients",
    default_value: "100",
    value_type: "integer" as const,
  },
  {
    name: "Max Users",
    key: "max_users",
    category: FeatureCategory.CAPACITY,
    description: "Maximum number of staff users per organization",
    default_value: "5",
    value_type: "integer" as const,
  },
  {
    name: "Max Locations",
    key: "max_locations",
    category: FeatureCategory.CAPACITY,
    description: "Maximum number of practice locations",
    default_value: "1",
    value_type: "integer" as const,
  },
  {
    name: "Max Appointments Per Day",
    key: "max_appointments_per_day",
    category: FeatureCategory.CAPACITY,
    description: "Maximum appointments that can be scheduled per day",
    default_value: "100",
    value_type: "integer" as const,
  },

  // API ACCESS FEATURES
  {
    name: "API Access Enabled",
    key: "api_access_enabled",
    category: FeatureCategory.API_ACCESS,
    description: "Enable REST API access",
    default_value: "false",
    value_type: "boolean" as const,
  },
  {
    name: "Webhook Support",
    key: "webhook_support_enabled",
    category: FeatureCategory.API_ACCESS,
    description: "Enable webhook notifications",
    default_value: "false",
    value_type: "boolean" as const,
  },
  {
    name: "White Label Branding",
    key: "white_label_enabled",
    category: FeatureCategory.API_ACCESS,
    description: "Enable custom branding and white labeling",
    default_value: "false",
    value_type: "boolean" as const,
  },

  // INTEGRATION FEATURES
  {
    name: "Third-Party Integrations",
    key: "integrations_third_party_enabled",
    category: FeatureCategory.INTEGRATIONS,
    description: "Enable integrations with third-party services",
    default_value: "false",
    value_type: "boolean" as const,
  },
  {
    name: "Max Active Integrations",
    key: "integrations_max_active",
    category: FeatureCategory.INTEGRATIONS,
    description: "Maximum number of active third-party integrations",
    default_value: "3",
    value_type: "integer" as const,
  },
  {
    name: "HL7/FHIR Support",
    key: "integrations_hl7_fhir_enabled",
    category: FeatureCategory.INTEGRATIONS,
    description: "Enable HL7 and FHIR interoperability",
    default_value: "false",
    value_type: "boolean" as const,
  },
];

let createdFeatures = 0;
let existingFeatures = 0;

for (const featureData of features) {
  try {
    const existing = await featureService.getFeatureByKey(featureData.key);
    if (existing) {
      console.log(`  ⊙ Feature exists: ${featureData.key}`);
      existingFeatures++;
    } else {
      await featureService.createFeature(featureData);
      console.log(`  ✓ Created: ${featureData.key}`);
      createdFeatures++;
    }
  } catch (error) {
    console.error(`  ✗ Error with ${featureData.key}:`, error.message);
  }
}

console.log(
  `\n  Summary: ${createdFeatures} created, ${existingFeatures} already existed`,
);

// ========== PROFESSIONAL SERVICES ==========
console.log("\n🛠️  CREATING PROFESSIONAL SERVICES");
console.log("=".repeat(60));

const services = [
  // ===== ONBOARDING SERVICES =====
  {
    name: "Basic Onboarding Session",
    key: "onboarding_basic",
    category: ServiceCategory.ONBOARDING,
    description:
      "1-hour video call covering platform basics, user setup, and first patient entry",
    is_recurring: false,
    metadata: { duration_hours: 1, max_participants: 5 },
  },
  {
    name: "Standard Onboarding Package",
    key: "onboarding_standard",
    category: ServiceCategory.ONBOARDING,
    description:
      "Comprehensive onboarding including data migration planning, workflow configuration, and team training (3 hours over 2 sessions)",
    is_recurring: false,
    metadata: { duration_hours: 3, sessions: 2, max_participants: 10 },
  },
  {
    name: "Premium Onboarding Package",
    key: "onboarding_premium",
    category: ServiceCategory.ONBOARDING,
    description:
      "White-glove onboarding with dedicated specialist, full data migration, and customized configuration (8 hours over 4 sessions)",
    is_recurring: false,
    metadata: { duration_hours: 8, sessions: 4, includes_migration: true },
  },
  {
    name: "Data Migration Service",
    key: "data_migration",
    category: ServiceCategory.ONBOARDING,
    description:
      "Professional data migration from existing EHR/practice management system",
    is_recurring: false,
    metadata: {
      includes: [
        "extraction",
        "cleaning",
        "validation",
        "import",
        "verification",
      ],
    },
  },
  {
    name: "Go-Live Support",
    key: "go_live_support",
    category: ServiceCategory.ONBOARDING,
    description:
      "Dedicated support during first week of live operation with daily check-ins",
    is_recurring: false,
    metadata: { duration_days: 7, daily_checkins: true },
  },

  // ===== TRAINING SERVICES =====
  {
    name: "Staff Training Session",
    key: "training_staff_onetime",
    category: ServiceCategory.TRAINING,
    description:
      "Single 2-hour group training for administrative staff (up to 10 participants)",
    is_recurring: false,
    metadata: {
      duration_hours: 2,
      max_participants: 10,
      audience: "administrative",
    },
  },
  {
    name: "Clinician Training Session",
    key: "training_clinician_onetime",
    category: ServiceCategory.TRAINING,
    description:
      "Single 2-hour training for healthcare providers (up to 10 participants)",
    is_recurring: false,
    metadata: { duration_hours: 2, max_participants: 10, audience: "clinical" },
  },
  {
    name: "Monthly Refresher Training",
    key: "training_monthly_refresher",
    category: ServiceCategory.TRAINING,
    description:
      "Monthly 1-hour training covering new features, best practices, and advanced tips",
    is_recurring: true,
    metadata: { duration_hours: 1, frequency: "monthly" },
  },
  {
    name: "Quarterly Advanced Training",
    key: "training_quarterly_advanced",
    category: ServiceCategory.TRAINING,
    description:
      "Quarterly 2-hour deep-dive on advanced features and optimization",
    is_recurring: true,
    metadata: { duration_hours: 2, frequency: "quarterly" },
  },
  {
    name: "Custom Training Development",
    key: "training_custom_development",
    category: ServiceCategory.TRAINING,
    description:
      "Development of custom training materials specific to organization's workflows",
    is_recurring: false,
    metadata: {
      deliverables: ["videos", "documentation", "quick_reference_guides"],
    },
  },
  {
    name: "Train-the-Trainer Program",
    key: "training_train_trainer",
    category: ServiceCategory.TRAINING,
    description:
      "4-hour program to train designated staff as internal Mediloop experts",
    is_recurring: false,
    metadata: { duration_hours: 4, certification: true },
  },

  // ===== SUPPORT SERVICES =====
  {
    name: "Standard Email Support",
    key: "support_email_standard",
    category: ServiceCategory.SUPPORT,
    description:
      "Email support during business hours with 48-hour response time",
    is_recurring: true,
    metadata: { response_time_hours: 48, availability: "business_hours" },
  },
  {
    name: "Priority Email Support",
    key: "support_email_priority",
    category: ServiceCategory.SUPPORT,
    description: "Priority email support with 24-hour response time",
    is_recurring: true,
    metadata: { response_time_hours: 24, priority: true },
  },
  {
    name: "Live Chat Support",
    key: "support_live_chat",
    category: ServiceCategory.SUPPORT,
    description: "Real-time chat support during business hours",
    is_recurring: true,
    metadata: { availability: "business_hours", instant: true },
  },
  {
    name: "Phone Support",
    key: "support_phone",
    category: ServiceCategory.SUPPORT,
    description: "Direct phone support line during business hours",
    is_recurring: true,
    metadata: { availability: "business_hours", callback_available: true },
  },
  {
    name: "24/7 Emergency Support",
    key: "support_emergency_24_7",
    category: ServiceCategory.SUPPORT,
    description: "Round-the-clock emergency support for critical issues",
    is_recurring: true,
    metadata: { availability: "24_7_365", sla_response_hours: 2 },
  },
  {
    name: "Dedicated Support Agent",
    key: "support_dedicated_agent",
    category: ServiceCategory.SUPPORT,
    description:
      "Named support agent who learns your organization's specific needs",
    is_recurring: true,
    metadata: { single_point_of_contact: true, monthly_checkins: true },
  },
  {
    name: "Dedicated Account Manager",
    key: "support_account_manager",
    category: ServiceCategory.SUPPORT,
    description:
      "Senior account manager for strategic guidance and relationship management",
    is_recurring: true,
    metadata: { quarterly_reviews: true, roadmap_input: true },
  },

  // ===== CONSULTING SERVICES =====
  {
    name: "HIPAA Compliance Consultation",
    key: "consulting_hipaa_onetime",
    category: ServiceCategory.CONSULTING,
    description:
      "One-time 4-hour HIPAA compliance review and configuration guidance",
    is_recurring: false,
    metadata: {
      duration_hours: 4,
      includes: ["baa_review", "security_audit", "access_control"],
    },
  },
  {
    name: "Annual HIPAA Compliance Review",
    key: "consulting_hipaa_annual",
    category: ServiceCategory.CONSULTING,
    description: "Annual HIPAA compliance audit and update",
    is_recurring: true,
    metadata: { duration_hours: 4, frequency: "annual" },
  },
  {
    name: "Workflow Optimization Consultation",
    key: "consulting_workflow_optimization",
    category: ServiceCategory.CONSULTING,
    description:
      "8-hour deep-dive analysis of practice workflows with optimization recommendations",
    is_recurring: false,
    metadata: { duration_hours: 8, deliverables: ["analysis", "roadmap"] },
  },
  {
    name: "Monthly Strategic Consulting",
    key: "consulting_monthly_strategic",
    category: ServiceCategory.CONSULTING,
    description:
      "Monthly 2-hour consulting sessions for strategic planning and optimization",
    is_recurring: true,
    metadata: { duration_hours: 2, frequency: "monthly" },
  },
  {
    name: "Revenue Cycle Optimization",
    key: "consulting_revenue_cycle",
    category: ServiceCategory.CONSULTING,
    description:
      "Comprehensive 12-hour revenue cycle analysis and optimization",
    is_recurring: false,
    metadata: {
      duration_hours: 12,
      includes: ["billing_review", "denial_analysis", "reporting"],
    },
  },
  {
    name: "Multi-Location Setup Consultation",
    key: "consulting_multi_location",
    category: ServiceCategory.CONSULTING,
    description:
      "6-hour specialized consulting for multi-location practice configuration",
    is_recurring: false,
    metadata: { duration_hours: 6 },
  },
  {
    name: "Integration Strategy Consultation",
    key: "consulting_integration_strategy",
    category: ServiceCategory.CONSULTING,
    description:
      "4-hour consultation on third-party integrations and data flow",
    is_recurring: false,
    metadata: { duration_hours: 4 },
  },
  {
    name: "Security & Compliance Audit",
    key: "consulting_security_audit",
    category: ServiceCategory.CONSULTING,
    description: "Comprehensive 8-hour security and compliance audit",
    is_recurring: false,
    metadata: {
      duration_hours: 8,
      includes: ["penetration_test", "access_audit", "gap_analysis"],
    },
  },

  // ===== CUSTOM DEVELOPMENT =====
  {
    name: "Custom Report Development",
    key: "development_custom_report",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description:
      "Development of custom reports tailored to specific organizational needs",
    is_recurring: false,
    metadata: {
      deliverables: [
        "requirements",
        "design",
        "development",
        "testing",
        "training",
      ],
    },
  },
  {
    name: "Custom Form/Template Creation",
    key: "development_custom_forms",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description: "Creation of custom forms and document templates",
    is_recurring: false,
    metadata: { includes: ["conditional_logic", "validation", "testing"] },
  },
  {
    name: "Custom Integration Development",
    key: "development_custom_integration",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description: "Development of custom integrations with third-party systems",
    is_recurring: false,
    metadata: {
      includes: ["api_development", "testing", "documentation", "monitoring"],
    },
  },
  {
    name: "Custom Workflow Automation",
    key: "development_custom_automation",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description: "Development of custom automated workflows",
    is_recurring: false,
    metadata: {
      includes: ["design", "automation_logic", "testing", "optimization"],
    },
  },
  {
    name: "Custom Feature Development",
    key: "development_custom_feature",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description:
      "Development of bespoke features unique to organization's needs",
    is_recurring: false,
    metadata: { full_sdlc: true },
  },
  {
    name: "API Access & Documentation",
    key: "development_api_access",
    category: ServiceCategory.CUSTOM_DEVELOPMENT,
    description: "API access provisioning with 4-hour developer onboarding",
    is_recurring: false,
    metadata: {
      duration_hours: 4,
      includes: ["api_keys", "documentation", "examples"],
    },
  },
];

let createdServices = 0;
let existingServices = 0;

for (const serviceData of services) {
  try {
    const existing = await professionalService.getServiceByKey(serviceData.key);
    if (existing) {
      console.log(`  ⊙ Service exists: ${serviceData.key}`);
      existingServices++;
    } else {
      await professionalService.createService(serviceData);
      console.log(`  ✓ Created: ${serviceData.key}`);
      createdServices++;
    }
  } catch (error) {
    console.error(`  ✗ Error with ${serviceData.key}:`, error.message);
  }
}

console.log(
  `\n  Summary: ${createdServices} created, ${existingServices} already existed`,
);

// ========== SUBSCRIPTION PLANS ==========
console.log("\n📦 CREATING SUBSCRIPTION PLANS");
console.log("=".repeat(60));

const plans = [
  {
    name: "Starter",
    key: "starter",
    description: "Perfect for small practices getting started with Mediloop",
    status: PlanStatus.ACTIVE,
    is_public: true,
    monthly_price_cents: 2900, // $29/month
    annual_price_cents: 29000, // $290/year (2 months free)
    display_order: 1,
    metadata: {
      badge: "Best for Solo Practitioners",
      max_patients_display: "Up to 100 patients",
      max_users_display: "Up to 3 users",
    },
    features: [
      // Rate limits
      {
        feature_key: "rate_limit_login",
        value: JSON.stringify({
          max_requests: 5,
          window_seconds: 900,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_api",
        value: JSON.stringify({
          max_requests: 60,
          window_seconds: 60,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_password_reset",
        value: JSON.stringify({
          max_requests: 3,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_registration",
        value: JSON.stringify({
          max_requests: 3,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_request",
        value: JSON.stringify({
          max_requests: 5,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_verify",
        value: JSON.stringify({
          max_requests: 10,
          window_seconds: 900,
          enabled: true,
        }),
      },
      // Storage
      { feature_key: "storage_limit_gb", value: "10" },
      { feature_key: "storage_document_upload_mb", value: "10" },
      // Capacity
      { feature_key: "max_patients", value: "100" },
      { feature_key: "max_users", value: "3" },
      { feature_key: "max_locations", value: "1" },
      { feature_key: "max_appointments_per_day", value: "50" },
      // API & Integrations
      { feature_key: "api_access_enabled", value: "false" },
      { feature_key: "webhook_support_enabled", value: "false" },
      { feature_key: "white_label_enabled", value: "false" },
      { feature_key: "integrations_third_party_enabled", value: "false" },
      { feature_key: "integrations_max_active", value: "0" },
      { feature_key: "integrations_hl7_fhir_enabled", value: "false" },
    ],
    services: [
      { service_key: "onboarding_basic", quantity: 1 },
      { service_key: "training_staff_onetime", quantity: 1 },
      { service_key: "support_email_standard", quantity: 1 },
    ],
  },
  {
    name: "Professional",
    key: "professional",
    description:
      "For growing practices with advanced needs and multiple staff members",
    status: PlanStatus.ACTIVE,
    is_public: true,
    monthly_price_cents: 9900, // $99/month
    annual_price_cents: 99000, // $990/year
    display_order: 2,
    metadata: {
      badge: "Most Popular",
      max_patients_display: "Up to 1,000 patients",
      max_users_display: "Up to 10 users",
    },
    features: [
      // Rate limits - higher
      {
        feature_key: "rate_limit_login",
        value: JSON.stringify({
          max_requests: 20,
          window_seconds: 900,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_api",
        value: JSON.stringify({
          max_requests: 300,
          window_seconds: 60,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_password_reset",
        value: JSON.stringify({
          max_requests: 10,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_registration",
        value: JSON.stringify({
          max_requests: 10,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_request",
        value: JSON.stringify({
          max_requests: 20,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_verify",
        value: JSON.stringify({
          max_requests: 30,
          window_seconds: 900,
          enabled: true,
        }),
      },
      // Storage
      { feature_key: "storage_limit_gb", value: "100" },
      { feature_key: "storage_document_upload_mb", value: "50" },
      // Capacity
      { feature_key: "max_patients", value: "1000" },
      { feature_key: "max_users", value: "10" },
      { feature_key: "max_locations", value: "3" },
      { feature_key: "max_appointments_per_day", value: "200" },
      // API & Integrations
      { feature_key: "api_access_enabled", value: "true" },
      { feature_key: "webhook_support_enabled", value: "true" },
      { feature_key: "white_label_enabled", value: "false" },
      { feature_key: "integrations_third_party_enabled", value: "true" },
      { feature_key: "integrations_max_active", value: "5" },
      { feature_key: "integrations_hl7_fhir_enabled", value: "false" },
    ],
    services: [
      { service_key: "onboarding_standard", quantity: 1 },
      { service_key: "training_staff_onetime", quantity: 1 },
      { service_key: "training_clinician_onetime", quantity: 1 },
      { service_key: "support_email_priority", quantity: 1 },
      { service_key: "support_live_chat", quantity: 1 },
      { service_key: "training_monthly_refresher", quantity: 1 },
      { service_key: "consulting_hipaa_onetime", quantity: 1 },
    ],
  },
  {
    name: "Enterprise",
    key: "enterprise",
    description:
      "For large healthcare organizations requiring maximum capacity and white-glove service",
    status: PlanStatus.ACTIVE,
    is_public: true,
    monthly_price_cents: 29900, // $299/month
    annual_price_cents: 299000, // $2,990/year
    display_order: 3,
    metadata: {
      badge: "Enterprise Grade",
      max_patients_display: "Unlimited patients",
      max_users_display: "Up to 100 users",
    },
    features: [
      // Rate limits - highest
      {
        feature_key: "rate_limit_login",
        value: JSON.stringify({
          max_requests: 100,
          window_seconds: 900,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_api",
        value: JSON.stringify({
          max_requests: 1000,
          window_seconds: 60,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_password_reset",
        value: JSON.stringify({
          max_requests: 50,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_registration",
        value: JSON.stringify({
          max_requests: 50,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_request",
        value: JSON.stringify({
          max_requests: 100,
          window_seconds: 3600,
          enabled: true,
        }),
      },
      {
        feature_key: "rate_limit_otp_verify",
        value: JSON.stringify({
          max_requests: 200,
          window_seconds: 900,
          enabled: true,
        }),
      },
      // Storage
      { feature_key: "storage_limit_gb", value: "1000" },
      { feature_key: "storage_document_upload_mb", value: "100" },
      // Capacity
      { feature_key: "max_patients", value: "999999" },
      { feature_key: "max_users", value: "100" },
      { feature_key: "max_locations", value: "999" },
      { feature_key: "max_appointments_per_day", value: "999999" },
      // API & Integrations
      { feature_key: "api_access_enabled", value: "true" },
      { feature_key: "webhook_support_enabled", value: "true" },
      { feature_key: "white_label_enabled", value: "true" },
      { feature_key: "integrations_third_party_enabled", value: "true" },
      { feature_key: "integrations_max_active", value: "999" },
      { feature_key: "integrations_hl7_fhir_enabled", value: "true" },
    ],
    services: [
      { service_key: "onboarding_premium", quantity: 1 },
      { service_key: "data_migration", quantity: 1 },
      { service_key: "go_live_support", quantity: 1 },
      { service_key: "training_staff_onetime", quantity: 2 },
      { service_key: "training_clinician_onetime", quantity: 2 },
      { service_key: "training_train_trainer", quantity: 1 },
      { service_key: "support_email_priority", quantity: 1 },
      { service_key: "support_live_chat", quantity: 1 },
      { service_key: "support_phone", quantity: 1 },
      { service_key: "support_emergency_24_7", quantity: 1 },
      { service_key: "support_account_manager", quantity: 1 },
      { service_key: "training_monthly_refresher", quantity: 1 },
      { service_key: "training_quarterly_advanced", quantity: 1 },
      { service_key: "consulting_hipaa_annual", quantity: 1 },
      { service_key: "consulting_monthly_strategic", quantity: 1 },
    ],
  },
];

let createdPlans = 0;
let existingPlans = 0;

for (const planData of plans) {
  try {
    const existing = await planService.getPlanByKey(planData.key);
    if (existing) {
      console.log(`  ⊙ Plan exists: ${planData.key}`);
      existingPlans++;
    } else {
      await planService.createPlan(planData);
      console.log(
        `  ✓ Created: ${planData.key} ($${planData.monthly_price_cents / 100}/mo)`,
      );
      createdPlans++;
    }
  } catch (error) {
    console.error(`  ✗ Error with ${planData.key}:`, error.message);
  }
}

console.log(
  `\n  Summary: ${createdPlans} created, ${existingPlans} already existed`,
);

// ========== FINAL SUMMARY ==========
console.log("\n" + "=".repeat(60));
console.log("✅ SEEDING COMPLETE");
console.log("=".repeat(60));
console.log(
  `\n📊 Features: ${createdFeatures} created, ${existingFeatures} existed`,
);
console.log(
  `🛠️  Services: ${createdServices} created, ${existingServices} existed`,
);
console.log(`📦 Plans: ${createdPlans} created, ${existingPlans} existed`);

console.log("\n📋 Next Steps:");
console.log("  1. Create subscriptions for your organizations");
console.log("  2. Test dynamic rate limiting on your endpoints");
console.log("  3. Monitor usage via admin API");
console.log("  4. Customize plans as needed (no code changes required!)");

console.log("\n💡 Example: Create a subscription");
console.log("  POST /api/admin/subscriptions");
console.log("  {");
console.log('    "organization_id": "your-org-uuid",');
console.log('    "plan_key": "professional",');
console.log('    "status": "active"');
console.log("  }");

console.log("\n");

// Close the postgresService connection
await postgresService.close();
