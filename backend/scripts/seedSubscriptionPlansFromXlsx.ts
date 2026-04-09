#!/usr/bin/env -S deno run -A

import { load } from "@std/dotenv";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { FeatureCategory, PlanStatus, ServiceCategory } from "../shared/types/index.ts";

type ParsedPlan = {
  role: "patient" | "doctor" | "pharmacist" | "clinic" | "hospital";
  name: string;
  price_eur_month: number | null;
  target_audience: string | null;
  display_features: string[];
  display_services: string[];
  hidden_features: string[];
};

const isChildProcess = Deno.env.get("MEDILOOP_SUBSCRIPTION_XLSX_CHILD") === "1";

function trimUrl(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
}

if (!isChildProcess) {
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  const backendDir = join(scriptDir, "..");
  const devPath = join(backendDir, ".env.development");
  const testPath = fromFileUrl(new URL("../../.env.test", import.meta.url));
  const devVars = (await load({ envPath: devPath }).catch(() => ({}))) as Record<string, string>;
  const testVars = (await load({ envPath: testPath }).catch(() => ({}))) as Record<string, string>;
  const testUrl = trimUrl(testVars["TEST_DATABASE_URL"]);
  const devUrl = trimUrl(devVars["DATABASE_URL_DEV"]) || trimUrl(devVars["DATABASE_URL"]);
  const targets: Array<{ kind: "test" | "dev"; label: string }> = [];
  if (testUrl) targets.push({ kind: "test", label: "test (.env.test)" });
  if (devUrl && devUrl !== testUrl) targets.push({ kind: "dev", label: "development (.env.development)" });
  if (targets.length === 0) {
    console.error("No configured DB URL found for test/dev.");
    Deno.exit(1);
  }
  if (targets.length > 1) {
    for (const target of targets) {
      const env = { ...Deno.env.toObject(), MEDILOOP_SUBSCRIPTION_XLSX_CHILD: "1" } as Record<string, string>;
      if (target.kind === "test") {
        env["TEST_DATABASE_URL"] = testUrl!;
        delete env["MEDILOOP_IGNORE_TEST_DATABASE_URL"];
      } else {
        env["MEDILOOP_IGNORE_TEST_DATABASE_URL"] = "1";
        delete env["TEST_DATABASE_URL"];
        env["DATABASE_URL_DEV"] = devUrl!;
        env["DATABASE_URL"] = devUrl!;
      }
      console.log(`\n▶ Seeding workbook plans on ${target.label}`);
      const st = await new Deno.Command(Deno.execPath(), {
        args: ["run", "-A", fromFileUrl(import.meta.url)],
        cwd: backendDir,
        env,
        stdout: "inherit",
        stderr: "inherit",
      }).output();
      if (!st.success) Deno.exit(st.code ?? 1);
    }
    console.log("\n✅ Workbook plans seeded on all configured DBs.");
    Deno.exit(0);
  }
}

const { postgresService } = await import("../shared/services/postgresService.ts");

function slugify(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function splitBullets(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s\-•*]+/, "").trim())
    .filter((line) => line.length > 0);
}

function inferFeatureCategory(key: string): FeatureCategory {
  if (key.startsWith("rate_limit_")) return FeatureCategory.RATE_LIMITING;
  if (key.includes("storage") || key.includes("file_size")) return FeatureCategory.STORAGE;
  if (key.startsWith("max_")) return FeatureCategory.CAPACITY;
  if (key.includes("api") || key.includes("webhook")) return FeatureCategory.API_ACCESS;
  return FeatureCategory.INTEGRATIONS;
}

function inferFeatureValueType(key: string): "json" | "integer" | "boolean" | "string" {
  if (key.startsWith("rate_limit_")) return "json";
  if (key.startsWith("max_") || key.includes("_gb") || key.includes("_mb") || key.includes("_days")) return "integer";
  if (key.endsWith("_enabled")) return "boolean";
  return "string";
}

function inferFeatureDefault(key: string): string {
  const vt = inferFeatureValueType(key);
  if (vt === "json") return JSON.stringify({ enabled: true });
  if (vt === "integer") return "0";
  if (vt === "boolean") return "true";
  return "enabled";
}

function inferServiceCategory(label: string): ServiceCategory {
  const l = label.toLowerCase();
  if (l.includes("onboard")) return ServiceCategory.ONBOARDING;
  if (l.includes("support") || l.includes("chat") || l.includes("email")) return ServiceCategory.SUPPORT;
  if (l.includes("train") || l.includes("webinar")) return ServiceCategory.TRAINING;
  if (l.includes("consult") || l.includes("compliance")) return ServiceCategory.CONSULTING;
  return ServiceCategory.CUSTOM_DEVELOPMENT;
}

function serviceKeyForLabel(label: string): string {
  const normalized = label.trim().toLowerCase();
  const fixed: Record<string, string> = {
    "self-service onboarding": "onboarding_basic",
    "premium onboarding": "onboarding_premium",
    "email support": "support_email_standard",
    "priority support": "support_email_priority",
    "priority email support": "support_email_priority",
    "dedicated account manager": "support_account_manager",
    "live chat support": "support_live_chat",
    "phone support": "support_phone",
  };
  return fixed[normalized] ?? `xlsx_${slugify(label)}`;
}

async function parseWorkbook(workbookPath: string): Promise<ParsedPlan[]> {
  const python = `
import json, openpyxl, re, sys
wb = openpyxl.load_workbook(sys.argv[1], data_only=True)
role_sheets = [
  ("Patient Plans", "patient"),
  ("Doctor Plans", "doctor"),
  ("Pharmacist Plans", "pharmacist"),
  ("Clinic Plans", "clinic")
]

def n(v):
  return re.sub(r"\\s+", " ", str(v or "").strip().lower())

def split_bullets(v):
  if v is None:
    return []
  lines = str(v).splitlines()
  out = []
  for line in lines:
    line = re.sub(r"^[\\s\\-•*]+", "", line).strip()
    if line:
      out.append(line)
  return out

def header_indexes(ws):
  hdr = {}
  for i, cell in enumerate(ws[1], start=1):
    text = n(cell.value)
    if "plan" in text and ("name" in text or "tier" in text):
      hdr["name"] = i
    elif "price" in text:
      hdr["price"] = i
    elif "target" in text:
      hdr["target"] = i
    elif "displayable features" in text:
      hdr["display_features"] = i
    elif "displayable services" in text:
      hdr["display_services"] = i
    elif "hidden" in text and "technical" in text:
      hdr["hidden_features"] = i
  return hdr

plans = []
for sheet_name, role in role_sheets:
  if sheet_name not in wb.sheetnames:
    continue
  ws = wb[sheet_name]
  idx = header_indexes(ws)
  for r in range(2, ws.max_row + 1):
    name = ws.cell(row=r, column=idx.get("name", 1)).value
    if name is None or str(name).strip() == "":
      continue
    price_raw = ws.cell(row=r, column=idx.get("price", 2)).value
    price = None
    if isinstance(price_raw, (int, float)):
      price = float(price_raw)
    else:
      txt = str(price_raw or "").strip()
      m = re.search(r"(\\d+(?:[\\.,]\\d+)?)", txt)
      if m:
        price = float(m.group(1).replace(",", "."))
    target = ws.cell(row=r, column=idx.get("target", 3)).value
    display_features = split_bullets(ws.cell(row=r, column=idx.get("display_features", 4)).value)
    display_services = split_bullets(ws.cell(row=r, column=idx.get("display_services", 5)).value)
    hidden_features = split_bullets(ws.cell(row=r, column=idx.get("hidden_features", 6)).value)
    plans.append({
      "role": role,
      "name": str(name).strip(),
      "price_eur_month": price,
      "target_audience": str(target).strip() if target is not None and str(target).strip() else None,
      "display_features": display_features,
      "display_services": display_services,
      "hidden_features": hidden_features
    })

if "Hospital Role" in wb.sheetnames:
  ws = wb["Hospital Role"]
  idx = header_indexes(ws)
  display_features = []
  display_services = []
  for r in range(2, ws.max_row + 1):
    display_features += split_bullets(ws.cell(row=r, column=idx.get("display_features", 2)).value)
    display_services += split_bullets(ws.cell(row=r, column=idx.get("display_services", 3)).value)
  if display_features or display_services:
    plans.append({
      "role": "hospital",
      "name": "Hospital Enterprise",
      "price_eur_month": None,
      "target_audience": "Institutional hospitals (contact sales)",
      "display_features": display_features,
      "display_services": display_services,
      "hidden_features": []
    })

print(json.dumps(plans))
`;
  const out = await new Deno.Command("python", {
    args: ["-c", python, workbookPath],
    stdout: "piped",
    stderr: "piped",
  }).output();
  if (!out.success) {
    const err = new TextDecoder().decode(out.stderr);
    throw new Error(`Python workbook parser failed: ${err}`);
  }
  const parsed = new TextDecoder().decode(out.stdout);
  return JSON.parse(parsed) as ParsedPlan[];
}

const workbookPath = fromFileUrl(new URL("../mediloop_exact_plans_en.xlsx", import.meta.url));
const parsedPlans = await parseWorkbook(workbookPath);
if (parsedPlans.length === 0) {
  throw new Error("No plans were parsed from workbook.");
}

console.log(`Parsed ${parsedPlans.length} plans from workbook.`);

const planIdByKey = new Map<string, string>();
const featureValueByKey = new Map<string, string>();
const serviceIdByKey = new Map<string, string>();

for (const plan of parsedPlans) {
  for (const featureKey of plan.hidden_features) {
    if (!featureKey) continue;
    const key = featureKey.trim();
    const category = inferFeatureCategory(key);
    const valueType = inferFeatureValueType(key);
    const defaultValue = inferFeatureDefault(key);
    await postgresService.query(
      `INSERT INTO features (name, key, category, description, default_value, value_type, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
       ON CONFLICT (key) DO UPDATE
       SET name = EXCLUDED.name,
           category = EXCLUDED.category,
           value_type = EXCLUDED.value_type,
           updated_at = NOW()`,
      [
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        key,
        category,
        `Technical feature from workbook (${plan.role})`,
        defaultValue,
        valueType,
        JSON.stringify({ source: "mediloop_exact_plans_en.xlsx" }),
      ],
    );
    const featureResult = await postgresService.query(
      `SELECT id, default_value FROM features WHERE key = $1`,
      [key],
    );
    if (featureResult.rows.length > 0) {
      const row = featureResult.rows[0] as { id: string; default_value: string };
      featureValueByKey.set(key, row.default_value || defaultValue);
    }
  }
}

for (const plan of parsedPlans) {
  for (const label of plan.display_services) {
    const key = serviceKeyForLabel(label);
    await postgresService.query(
      `INSERT INTO services (name, key, category, description, is_recurring, metadata)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (key) DO UPDATE
       SET name = EXCLUDED.name,
           category = EXCLUDED.category,
           updated_at = NOW()`,
      [
        label,
        key,
        inferServiceCategory(label),
        `Marketing service from workbook label: ${label}`,
        true,
        JSON.stringify({ source: "mediloop_exact_plans_en.xlsx", label }),
      ],
    );
    const serviceResult = await postgresService.query(
      `SELECT id FROM services WHERE key = $1`,
      [key],
    );
    if (serviceResult.rows.length > 0) {
      const row = serviceResult.rows[0] as { id: string };
      serviceIdByKey.set(key, row.id);
    }
  }
}

let order = 1;
for (const plan of parsedPlans) {
  const planKey = `${plan.role}_${slugify(plan.name)}`;
  const monthlyPriceCents = plan.price_eur_month === null ? null : Math.round(plan.price_eur_month * 100);
  const metadata = {
    target_role: plan.role,
    source: "mediloop_exact_plans_en.xlsx",
    target_audience: plan.target_audience,
    contact_sales_only: plan.role === "hospital" && monthlyPriceCents === null,
  };
  await postgresService.query(
    `INSERT INTO plans (
      name, key, description, status, is_public, monthly_price_cents, annual_price_cents, display_order, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
    ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        is_public = EXCLUDED.is_public,
        monthly_price_cents = EXCLUDED.monthly_price_cents,
        annual_price_cents = EXCLUDED.annual_price_cents,
        display_order = EXCLUDED.display_order,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()`,
    [
      plan.name,
      planKey,
      plan.target_audience ?? `${plan.role} plan`,
      PlanStatus.ACTIVE,
      true,
      monthlyPriceCents,
      monthlyPriceCents === null ? null : monthlyPriceCents * 10,
      order++,
      JSON.stringify(metadata),
    ],
  );
  const planResult = await postgresService.query(`SELECT id FROM plans WHERE key = $1`, [planKey]);
  if (planResult.rows.length === 0) continue;
  const planId = (planResult.rows[0] as { id: string }).id;
  planIdByKey.set(planKey, planId);

  await postgresService.query(`DELETE FROM plan_features WHERE plan_id = $1`, [planId]);
  for (const featureKey of plan.hidden_features) {
    const key = featureKey.trim();
    const featureRow = await postgresService.query(`SELECT id FROM features WHERE key = $1`, [key]);
    if (featureRow.rows.length === 0) continue;
    const featureId = (featureRow.rows[0] as { id: string }).id;
    await postgresService.query(
      `INSERT INTO plan_features (plan_id, feature_id, value)
       VALUES ($1, $2, $3)`,
      [planId, featureId, featureValueByKey.get(key) ?? inferFeatureDefault(key)],
    );
  }

  await postgresService.query(`DELETE FROM plan_services WHERE plan_id = $1`, [planId]);
  for (const label of plan.display_services) {
    const serviceKey = serviceKeyForLabel(label);
    const serviceId = serviceIdByKey.get(serviceKey);
    if (!serviceId) continue;
    await postgresService.query(
      `INSERT INTO plan_services (plan_id, service_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (plan_id, service_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
      [planId, serviceId, 1],
    );
  }

  await postgresService.query(`DELETE FROM plan_marketing_items WHERE plan_id = $1 AND locale = 'en'`, [planId]);
  let sortOrder = 1;
  for (const label of plan.display_features) {
    await postgresService.query(
      `INSERT INTO plan_marketing_items (plan_id, sort_order, kind, label, visibility, locale)
       VALUES ($1, $2, 'feature', $3, 'card', 'en')
       ON CONFLICT (plan_id, kind, label, locale)
       DO UPDATE SET sort_order = EXCLUDED.sort_order, visibility = EXCLUDED.visibility, updated_at = NOW()`,
      [planId, sortOrder++, label],
    );
  }
  for (const label of plan.display_services) {
    await postgresService.query(
      `INSERT INTO plan_marketing_items (plan_id, sort_order, kind, label, visibility, locale)
       VALUES ($1, $2, 'service', $3, 'card', 'en')
       ON CONFLICT (plan_id, kind, label, locale)
       DO UPDATE SET sort_order = EXCLUDED.sort_order, visibility = EXCLUDED.visibility, updated_at = NOW()`,
      [planId, sortOrder++, label],
    );
  }
}

console.log(`Seeded ${planIdByKey.size} workbook plans with marketing items.`);
await postgresService.close();
