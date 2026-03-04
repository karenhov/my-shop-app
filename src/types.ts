export interface Product {
  id: number;
  name: string;
  price: number;
  code: string;
  description: string;
  image: string;
  category: 'sneakers' | 'slippers';
  min_quantity?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface PromoCode {
  id: number;
  code: string;
  discount_percent: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  created_at: string;
  items: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_time: number;
  name: string;
  image: string;
  code: string;
}
