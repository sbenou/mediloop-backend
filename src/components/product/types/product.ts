export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  type: 'medication' | 'parapharmacy';
  requires_prescription: boolean;
  category_id: string | null;
  subcategory_id: string | null;
  pharmacy_id: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
  products?: Product[];
}