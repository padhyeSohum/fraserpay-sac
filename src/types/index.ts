export type UserRole = 'student' | 'booth' | 'sac';

export interface User {
  id: string;
  studentNumber: string;
  name: string;
  email: string;
  role: UserRole;
  balance: number;
  favoriteProducts?: string[];
  booths?: string[];
}

export interface Booth {
  id: string;
  name: string;
  description?: string;
  pin: string;
  products: Product[];
  managers: string[]; // User IDs of managers
  totalEarnings: number;
  transactions: Transaction[];
  createdAt?: string; // Adding the missing createdAt property
}

export interface Product {
  id: string;
  name: string;
  price: number;
  boothId: string;
  image?: string;
  salesCount?: number;
}

export type PaymentMethod = 'cash' | 'card';

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
  type: 'purchase' | 'fund' | 'refund';
  paymentMethod?: PaymentMethod;
  sacMemberId?: string;
  sacMemberName?: string;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}

export interface TransactionStats {
  dailySales: {
    [date: string]: number;
  };
  topProducts: {
    productId: string;
    productName: string;
    count: number;
  }[];
  totalSales: number;
}

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}
