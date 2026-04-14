/**
 * Marketplace catalog from Deno/Neon (`/api/catalog/tree`).
 * Replaces direct Supabase REST for categories / subcategories / products.
 */
import { MEDILOOP_API_BASE } from "@/lib/activeContext";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  MEDILOOP_API_BASE;

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  type: string;
  requires_prescription: boolean;
  category_id: string | null;
  subcategory_id: string | null;
  pharmacy_id: string | null;
  created_at: string | null;
}

export interface CatalogSubcategory {
  id: string;
  name: string;
  products: CatalogProduct[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  type: string;
  subcategories: CatalogSubcategory[];
}

export async function fetchCatalogTree(): Promise<CatalogCategory[]> {
  const res = await fetch(`${API_BASE}/api/catalog/tree`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const data = (await res.json().catch(() => ({}))) as {
    categories?: CatalogCategory[];
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || res.statusText || "Catalog request failed");
  }
  return Array.isArray(data.categories) ? data.categories : [];
}
