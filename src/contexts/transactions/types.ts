
import { Booth, CartItem, Product, Transaction, DateRange, TransactionStats } from '@/types';

export interface TransactionContextType {
  // Booth management
  booths: Booth[];
  getBoothById: (id: string) => Booth | undefined;
  loadBooths: () => void;
  loadStudentBooths: () => Booth[];
  getBoothsByUserId: (userId: string) => Booth[];
  fetchAllBooths: () => Promise<Booth[]>;
  createBooth: (name: string, description: string, userId: string, customPin?: string) => Promise<string | null>;
  refreshUserBooths: () => Promise<Booth[]>; // Add the new function here
  
  // Product management
  loadBoothProducts: (boothId: string) => Product[];
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
  
  // Cart management
  cart: CartItem[];
  addToCart: (product: Product, boothId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  incrementQuantity: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  
  // Transaction management
  loadBoothTransactions: (boothId: string) => Transaction[];
  loadUserTransactions: (userId: string) => Transaction[];
  loadUserFundsTransactions: (userId: string) => Transaction[];
  getSACTransactions: () => Transaction[];
  getTransactionStats: (transactions: Transaction[], dateRange?: DateRange) => TransactionStats;
  getLeaderboard: () => { boothId: string; boothName: string; earnings: number }[];
  recentTransactions: Transaction[];
  
  // Payment processing
  processPayment: (boothId: string) => Promise<boolean>;
  processPurchase: (boothId: string, studentId: string, items: CartItem[]) => Promise<boolean>;
  addFunds: (studentId: string, amount: number, sacUserId: string) => Promise<{ success: boolean }>;
  
  // User search
  findUserByStudentNumber: (studentNumber: string) => Promise<{ id: string; name: string; balance: number } | null>;
  
  // Loading states
  isLoading: boolean;
}

// Define SAC PIN - This is for demo purposes
export const SAC_PIN = "123456";
