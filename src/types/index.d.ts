export interface User {
  id: string;
  studentNumber: string;
  name: string;
  email?: string;
  role: string;
  balance: number;
  favoriteProducts: string[];
  booths?: string[];
  emailNotifications?: boolean;
}

export interface Booth {
  id: string;
  name: string;
  description: string;
  pin: string;
  products: Product[];
  managers: string[];
  totalEarnings: number;
  transactions: Transaction[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  boothId: string;
  image?: string;
  salesCount: number;
}

export interface Transaction {
  id: string;
  timestamp: number;
  buyerId: string;
  buyerName: string;
  sellerId?: string;
  sellerName?: string;
  boothId?: string;
  boothName?: string;
  products?: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  amount: number;
  type: 'fund' | 'purchase' | 'refund';
  paymentMethod?: 'cash' | 'card' | 'other';
  sacMemberId?: string;
  sacMemberName?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'other';
