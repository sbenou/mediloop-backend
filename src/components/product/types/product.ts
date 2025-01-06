export interface Category {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
}

export interface Subcategory {
  id: string;
  name: string;
  category_id: string;
}