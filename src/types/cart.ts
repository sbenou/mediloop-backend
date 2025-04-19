export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface BoostCartItem extends Omit<CartItem, 'quantity'> {
  type: 'boost';
  boost_type: 'top-position' | 'first-position';
  duration: string;
}

export interface PlanCartItem extends Omit<CartItem, 'quantity'> {
  type: 'plan';
  interval: string;
  features: string[];
}
