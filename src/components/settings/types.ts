
export type AddressType = "main" | "secondary" | "work";

export interface Address {
  id: string;
  user_id: string;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  type: AddressType;
  is_default: boolean;
}

export type RelationType = "parent" | "child" | "spouse" | "sibling" | "friend" | "other";

export interface NextOfKin {
  id: string;
  user_id: string;
  full_name: string;
  phone_number: string;
  relation: RelationType;
  street: string;
  city: string;
  postal_code: string;
  country: string;
  created_at: string;
  updated_at: string;
}
