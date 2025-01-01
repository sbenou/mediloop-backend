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