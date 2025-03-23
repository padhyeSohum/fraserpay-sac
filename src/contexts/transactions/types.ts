
import { Transaction, Booth, Product, CartItem, TransactionStats, DateRange } from '@/types';

export interface TransactionContextType {
  // Booth management
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => void;
  loadStudentBooths: () => Booth[];
  
  // Product management
  loadBoothProducts: (boothId: string) => Product[];
  
  // Transaction management
  loadBoothTransactions: (boothId: string) => Transaction[];
  loadUserFundsTransactions: () => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (boothId: string, dateRange: DateRange) => TransactionStats;
  
  // Cart management
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  
  // Payment processing
  processPayment: (boothId: string) => Promise<Transaction | null>;
  addFunds: (userId: string, amount: number, sacMemberId: string) => Promise<number>;
  
  // Loading states
  isLoading: boolean;
}
