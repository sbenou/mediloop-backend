/**
 * Public read-only marketplace catalog (Neon).
 * Mounted before auth — same role as Supabase anon read for storefront browsing.
 */
import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { postgresService } from "../../../shared/services/postgresService.ts";

export const catalogPublicRouter = new Router();

type CatRow = { id: string; name: string; type: string };
type SubRow = { id: string; category_id: string; name: string };
type ProdRow = {
  id: string;
  category_id: string | null;
  subcategory_id: string | null;
  pharmacy_id: string | null;
  name: string;
  description: string | null;
  price: string | number | null;
  image_url: string | null;
  type: string;
  requires_prescription: boolean | null;
  created_at: string | null;
};

function numPrice(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

catalogPublicRouter.get("/api/catalog/tree", async (ctx: Context) => {
  try {
    const { rows: catRows } = await postgresService.query(
      `SELECT id::text, name, type FROM public.catalog_categories ORDER BY name ASC`,
    );
    const { rows: subRows } = await postgresService.query(
      `SELECT id::text, category_id::text, name FROM public.catalog_subcategories ORDER BY name ASC`,
    );
    const { rows: prodRows } = await postgresService.query(
      `SELECT id::text, category_id::text, subcategory_id::text, pharmacy_id::text,
              name, description, price, image_url, type, requires_prescription, created_at::text
         FROM public.catalog_products
        ORDER BY name ASC`,
    );

    const categories = (catRows || []) as unknown as CatRow[];
    const subcategories = (subRows || []) as unknown as SubRow[];
    const products = (prodRows || []) as unknown as ProdRow[];

    const subsByCategory = new Map<string, SubRow[]>();
    for (const s of subcategories) {
      const list = subsByCategory.get(s.category_id) ?? [];
      list.push(s);
      subsByCategory.set(s.category_id, list);
    }

    const prodsBySub = new Map<string, ProdRow[]>();
    for (const p of products) {
      if (!p.subcategory_id) continue;
      const list = prodsBySub.get(p.subcategory_id) ?? [];
      list.push(p);
      prodsBySub.set(p.subcategory_id, list);
    }

    const tree = categories.map((c) => {
      const subs = subsByCategory.get(c.id) ?? [];
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        subcategories: subs.map((s) => ({
          id: s.id,
          name: s.name,
          products: (prodsBySub.get(s.id) ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: numPrice(p.price),
            image_url: p.image_url,
            type: p.type,
            requires_prescription: Boolean(p.requires_prescription),
            category_id: p.category_id,
            subcategory_id: p.subcategory_id,
            pharmacy_id: p.pharmacy_id,
            created_at: p.created_at,
          })),
        })),
      };
    });

    ctx.response.type = "json";
    ctx.response.body = { categories: tree };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[catalog] GET /api/catalog/tree:", msg);
    ctx.response.status = 500;
    ctx.response.type = "json";
    ctx.response.body = { error: "Failed to load catalog", details: msg };
  }
});
