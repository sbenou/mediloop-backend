/**
 * Normalizes Supabase-exported CSVs (column order may differ from Neon \copy lists),
 * validates headers, writes temp CSVs + a small psql script, then runs psql.
 *
 * Database URL:
 *   --dev  → MEDILOOP_CATALOG_IMPORT_DATABASE_URL, else DATABASE_URL_DEV (.env.development)
 *   default → MEDILOOP_CATALOG_IMPORT_DATABASE_URL, else TEST_DATABASE_URL (.env.test), else DATABASE_URL_DEV
 *
 * CSV paths: MEDILOOP_CATALOG_IMPORT_CSV_DIR (or per-file MEDILOOP_CATALOG_CSV_*). If unset, the script
 * looks for the three default filenames under backend/data/catalog-import, then %USERPROFILE%/Downloads.
 *
 * Flags:
 *   --dev      Target development Neon (DATABASE_URL_DEV) unless URL overridden above.
 *   --truncate TRUNCATE catalog_* tables (CASCADE) before import.
 *
 * Run: cd backend && deno task import-marketplace-catalog-csv
 * Dev:  cd backend && deno task import-marketplace-catalog-csv-dev
 */
import { load } from "https://deno.land/std@0.208.0/dotenv/mod.ts";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";
import { dirname, fromFileUrl, join } from "https://deno.land/std@0.224.0/path/mod.ts";

const scriptDir = dirname(fromFileUrl(import.meta.url));
const backendDir = join(scriptDir, "..");
const repoRoot = join(backendDir, "..");
const tmpDir = join(scriptDir, ".catalog-import-tmp");

const DEFAULT_CSV_NAMES = {
  categories: "categories_rows.csv",
  subcategories: "subcategories_rows.csv",
  products: "products_rows.csv",
} as const;

function redactConnectionString(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(unparseable URL)";
  }
}

function libpqEnvFromDatabaseUrl(raw: string): Record<string, string> {
  const u = new URL(raw);
  const database = u.pathname.replace(/^\//, "") || "postgres";
  const user = decodeURIComponent(u.username);
  const password = u.password !== "" ? decodeURIComponent(u.password) : "";
  const sslmode = u.searchParams.get("sslmode") ?? "require";
  const channelBinding = u.searchParams.get("channel_binding");

  const env: Record<string, string> = {
    PGHOST: u.hostname,
    PGPORT: u.port || "5432",
    PGUSER: user,
    PGDATABASE: database,
    PGSSLMODE: sslmode,
  };
  if (password) env.PGPASSWORD = password;
  if (channelBinding) env.PGCHANNELBINDING = channelBinding;
  return env;
}

function normHeader(h: string): string {
  return h.replace(/^\ufeff/, "").trim().toLowerCase();
}

function parseCsvRecords(content: string): { headers: string[]; records: Record<string, string>[] } {
  const rows = parse(content, { skipFirstRow: false }) as string[][];
  if (rows.length < 2) {
    throw new Error("CSV must have a header row and at least one data row");
  }
  const rawHeaders = rows[0].map((h) => h.replace(/^\ufeff/, "").trim());
  const keys = rawHeaders.map(normHeader);
  const records: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.every((c) => c.trim() === "")) continue;
    const o: Record<string, string> = {};
    for (let i = 0; i < keys.length; i++) {
      o[keys[i]] = row[i] ?? "";
    }
    records.push(o);
  }
  return { headers: keys, records };
}

function csvLine(fields: string[]): string {
  return fields
    .map((f) => {
      // FORMAT csv: NULL is an unquoted empty field, not \N (that is text-format COPY).
      if (/[",\n\r]/.test(f)) return `"${f.replace(/"/g, '""')}"`;
      return f;
    })
    .join(",");
}

function requireHeaders(fileLabel: string, headers: string[], required: readonly string[]): void {
  const set = new Set(headers);
  const missing = required.filter((r) => !set.has(r));
  if (missing.length > 0) {
    console.error(`${fileLabel}: missing columns: ${missing.join(", ")}`);
    console.error(`  Found: ${[...set].sort().join(", ")}`);
    Deno.exit(1);
  }
}

function extraHeaders(
  fileLabel: string,
  headers: string[],
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  const extra = [...new Set(headers)].filter((h) => h && !allowedSet.has(h));
  if (extra.length > 0) {
    console.warn(`${fileLabel}: ignoring extra columns: ${extra.sort().join(", ")}`);
  }
}

function boolCsv(v: string): string {
  const s = v.trim().toLowerCase();
  if (s === "" || s === "false" || s === "f" || s === "0" || s === "no") return "f";
  return "t";
}

function nullUuid(v: string): string {
  const t = v.trim();
  return t === "" ? "" : t;
}

function normalizeCategories(path: string): string {
  const text = Deno.readTextFileSync(path);
  const { headers, records } = parseCsvRecords(text);
  const allowed = ["id", "name", "type", "created_at"] as const;
  requireHeaders("categories", headers, allowed);
  extraHeaders("categories", headers, allowed);

  const outPath = join(tmpDir, "categories.normalized.csv");
  const lines = [csvLine([...allowed])];
  for (const row of records) {
    lines.push(
      csvLine([
        row.id.trim(),
        row.name.trim(),
        row.type.trim(),
        row.created_at.trim(),
      ]),
    );
  }
  Deno.writeTextFileSync(outPath, lines.join("\n") + "\n");
  return outPath;
}

function normalizeSubcategories(path: string): string {
  const text = Deno.readTextFileSync(path);
  const { headers, records } = parseCsvRecords(text);
  const allowed = ["id", "name", "category_id", "created_at"] as const;
  requireHeaders("subcategories", headers, allowed);
  extraHeaders("subcategories", headers, allowed);

  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  for (let i = 0; i < records.length; i++) {
    const cid = records[i].category_id.trim();
    if (!uuidRe.test(cid)) {
      console.error(
        `subcategories row ${i + 2}: category_id must be a UUID (got ${JSON.stringify(cid.slice(0, 80))}). ` +
          "Supabase exports use id, name, category_id, created_at — if you still see a category name here, re-export from Table Editor.",
      );
      Deno.exit(1);
    }
  }

  // Neon table column order used by \copy (must match CSV column order):
  const copyOrder = ["id", "category_id", "name", "created_at"] as const;
  const outPath = join(tmpDir, "subcategories.normalized.csv");
  const lines = [csvLine([...copyOrder])];
  for (const row of records) {
    lines.push(
      csvLine([
        row.id.trim(),
        row.category_id.trim(),
        row.name.trim(),
        row.created_at.trim(),
      ]),
    );
  }
  Deno.writeTextFileSync(outPath, lines.join("\n") + "\n");
  return outPath;
}

const PRODUCT_ALLOWED = [
  "id",
  "category_id",
  "subcategory_id",
  "pharmacy_id",
  "name",
  "description",
  "price",
  "image_url",
  "type",
  "requires_prescription",
  "created_at",
  "popularity",
] as const;

function normalizeProducts(path: string): string {
  const text = Deno.readTextFileSync(path);
  const { headers, records } = parseCsvRecords(text);
  requireHeaders("products", headers, ["id", "name", "price", "type", "created_at"]);
  extraHeaders("products", headers, PRODUCT_ALLOWED);

  const copyOrder = [
    "id",
    "category_id",
    "subcategory_id",
    "pharmacy_id",
    "name",
    "description",
    "price",
    "image_url",
    "type",
    "requires_prescription",
    "created_at",
  ] as const;

  const outPath = join(tmpDir, "products.normalized.csv");
  const lines = [csvLine([...copyOrder])];
  for (const row of records) {
    lines.push(
      csvLine([
        row.id.trim(),
        nullUuid(row.category_id ?? ""),
        nullUuid(row.subcategory_id ?? ""),
        nullUuid(row.pharmacy_id ?? ""),
        row.name.trim(),
        (row.description ?? "").trim(),
        row.price.trim(),
        (row.image_url ?? "").trim(),
        row.type.trim(),
        boolCsv(row.requires_prescription ?? ""),
        row.created_at.trim(),
      ]),
    );
  }
  Deno.writeTextFileSync(outPath, lines.join("\n") + "\n");
  return outPath;
}

function toPsqlPath(p: string): string {
  return p.replace(/\\/g, "/");
}

function userHomeDir(): string | undefined {
  if (Deno.build.os === "windows") {
    return Deno.env.get("USERPROFILE")?.trim() || undefined;
  }
  return Deno.env.get("HOME")?.trim() || undefined;
}

/** When no CSV paths are configured, use the first folder that contains all three default filenames. */
function discoverDefaultCsvDir(): string | undefined {
  const home = userHomeDir();
  const candidates = [
    join(backendDir, "data", "catalog-import"),
    ...(home ? [join(home, "Downloads")] : []),
  ];
  for (const dir of candidates) {
    try {
      Deno.statSync(join(dir, DEFAULT_CSV_NAMES.categories));
      Deno.statSync(join(dir, DEFAULT_CSV_NAMES.subcategories));
      Deno.statSync(join(dir, DEFAULT_CSV_NAMES.products));
      return dir;
    } catch {
      /* try next */
    }
  }
  return undefined;
}

function resolveCsvPaths(
  dotenv: Record<string, string>,
): { categories: string; subcategories: string; products: string } {
  const c =
    Deno.env.get("MEDILOOP_CATALOG_CSV_CATEGORIES")?.trim() ||
    dotenv["MEDILOOP_CATALOG_CSV_CATEGORIES"]?.trim();
  const s =
    Deno.env.get("MEDILOOP_CATALOG_CSV_SUBCATEGORIES")?.trim() ||
    dotenv["MEDILOOP_CATALOG_CSV_SUBCATEGORIES"]?.trim();
  const p =
    Deno.env.get("MEDILOOP_CATALOG_CSV_PRODUCTS")?.trim() ||
    dotenv["MEDILOOP_CATALOG_CSV_PRODUCTS"]?.trim();
  let dir =
    Deno.env.get("MEDILOOP_CATALOG_IMPORT_CSV_DIR")?.trim() ||
    dotenv["MEDILOOP_CATALOG_IMPORT_CSV_DIR"]?.trim();

  if (!c && !s && !p && !dir) {
    const found = discoverDefaultCsvDir();
    if (found) {
      dir = found;
      console.log(
        `MEDILOOP_CATALOG_IMPORT_CSV_DIR not set; using folder where all three CSVs were found:\n  ${dir}`,
      );
    }
  }

  const categories = c ||
    (dir ? join(dir, DEFAULT_CSV_NAMES.categories) : "");
  const subcategories = s ||
    (dir ? join(dir, DEFAULT_CSV_NAMES.subcategories) : "");
  const products = p ||
    (dir ? join(dir, DEFAULT_CSV_NAMES.products) : "");

  if (!categories || !subcategories || !products) {
    console.error(
      "Set CSV locations in backend/.env.development (or the shell), for example:\n" +
        "  MEDILOOP_CATALOG_IMPORT_CSV_DIR=C:/Users/YOU/Downloads\n" +
        "Or put categories_rows.csv, subcategories_rows.csv, products_rows.csv in:\n" +
        `  ${join(backendDir, "data", "catalog-import")}\n` +
        "Or set full paths: MEDILOOP_CATALOG_CSV_CATEGORIES, MEDILOOP_CATALOG_CSV_SUBCATEGORIES, MEDILOOP_CATALOG_CSV_PRODUCTS.",
    );
    Deno.exit(1);
  }

  for (const [label, path] of [["categories", categories], ["subcategories", subcategories], ["products", products]] as const) {
    try {
      Deno.statSync(path);
    } catch {
      console.error(`${label}: file not found: ${path}`);
      Deno.exit(1);
    }
  }

  return { categories, subcategories, products };
}

const preferDev = Deno.args.includes("--dev");
const doTruncate = Deno.args.includes("--truncate");

const testPath = join(repoRoot, ".env.test");
const devPath = join(backendDir, ".env.development");

let testVars: Record<string, string> = {};
let devVars: Record<string, string> = {};
try {
  testVars = (await load({ envPath: testPath })) as Record<string, string>;
} catch {
  /* optional */
}
try {
  devVars = (await load({ envPath: devPath })) as Record<string, string>;
} catch {
  /* optional */
}

const dotenvMerged: Record<string, string> = { ...testVars, ...devVars };

const fromShell = Deno.env.get("MEDILOOP_CATALOG_IMPORT_DATABASE_URL")?.trim();
const fromTest = testVars["TEST_DATABASE_URL"]?.trim();
const fromDev = devVars["DATABASE_URL_DEV"]?.trim();

let dbUrl: string | undefined;
let source: string;
if (fromShell) {
  dbUrl = fromShell;
  source = "MEDILOOP_CATALOG_IMPORT_DATABASE_URL";
} else if (preferDev) {
  dbUrl = fromDev;
  source = "DATABASE_URL_DEV (.env.development) [import-marketplace-catalog-csv-dev]";
  if (!dbUrl) {
    console.error(
      "No DATABASE_URL_DEV in backend/.env.development. Add it or set MEDILOOP_CATALOG_IMPORT_DATABASE_URL.",
    );
    Deno.exit(1);
  }
} else {
  dbUrl = fromTest || fromDev;
  source = fromTest
    ? "TEST_DATABASE_URL (.env.test)"
    : "DATABASE_URL_DEV (backend/.env.development)";
}

if (!dbUrl) {
  console.error(
    "No database URL found. Set TEST_DATABASE_URL in repo-root .env.test, DATABASE_URL_DEV in backend/.env.development, or MEDILOOP_CATALOG_IMPORT_DATABASE_URL.",
  );
  Deno.exit(1);
}

console.log(`Using ${source}:\n  ${redactConnectionString(dbUrl)}`);

const { categories: catPath, subcategories: subPath, products: prodPath } = resolveCsvPaths(dotenvMerged);

console.log("CSV sources:");
console.log(`  categories:    ${catPath}`);
console.log(`  subcategories: ${subPath}`);
console.log(`  products:      ${prodPath}`);

await Deno.mkdir(tmpDir, { recursive: true });

let normCat: string;
let normSub: string;
let normProd: string;
try {
  normCat = normalizeCategories(catPath);
  normSub = normalizeSubcategories(subPath);
  normProd = normalizeProducts(prodPath);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  Deno.exit(1);
}

const sqlParts: string[] = [
  "-- Generated by run-import-marketplace-catalog-csv.ts — do not edit by hand.",
];
if (doTruncate) {
  sqlParts.push(
    "TRUNCATE TABLE public.catalog_products, public.catalog_subcategories, public.catalog_categories CASCADE;",
  );
  console.log("Will TRUNCATE catalog_products, catalog_subcategories, catalog_categories (CASCADE) before COPY.");
} else {
  console.warn(
    "Tip: if categories were already loaded, re-run with --truncate to avoid duplicate key errors, or truncate those tables manually in Neon.",
  );
}

const q = (p: string) => `'${toPsqlPath(p).replace(/'/g, "''")}'`;
sqlParts.push(
  `\\copy public.catalog_categories (id, name, type, created_at) FROM ${q(normCat)} WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`,
  `\\copy public.catalog_subcategories (id, category_id, name, created_at) FROM ${q(normSub)} WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`,
  `\\copy public.catalog_products (id, category_id, subcategory_id, pharmacy_id, name, description, price, image_url, type, requires_prescription, created_at) FROM ${q(normProd)} WITH (FORMAT csv, HEADER true, ENCODING 'UTF8')`,
);

const sqlPath = join(tmpDir, "import-catalog.generated.sql");
Deno.writeTextFileSync(sqlPath, sqlParts.join("\n") + "\n");

const libpq = libpqEnvFromDatabaseUrl(dbUrl);
const cmd = new Deno.Command("psql", {
  args: ["-X", "-v", "ON_ERROR_STOP=1", "-f", toPsqlPath(sqlPath)],
  env: { ...Deno.env.toObject(), ...libpq },
  stdout: "inherit",
  stderr: "inherit",
});

const status = await cmd.output();
Deno.exit(status.code);
