
import { Transaction, Booth, Product, CartItem } from '@/types';

export interface TransactionContextType {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  loadBoothTransactions: (boothId: string) => Transaction[];
  addFunds: (amount: number, studentId: string, paymentMethod: 'cash' | 'card', sacMemberId: string, sacMemberName: string) => Promise<boolean>;
  processPurchase: (boothId: string, buyerId: string, buyerName: string, sellerId: string, sellerName: string, cartItems: CartItem[], boothName: string) => Promise<boolean>;
  getBoothById: (boothId: string) => Booth | undefined;
  getBoothsByUserId: (userId: string) => Booth[];
  createBooth: (name: string, description: string, userId: string) => Promise<string | null>;
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  getLeaderboard: () => { boothId: string; boothName: string; earnings: number }[];
  fetchAllTransactions: () => Promise<void>;
  fetchAllBooths: () => Promise<void>;
}
