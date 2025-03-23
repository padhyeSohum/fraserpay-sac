
import { User, Booth, Product, Transaction } from '@/types';

// Transform Supabase database user to app User type
export const transformDatabaseUser = (dbUser: any): User => {
  return {
    id: dbUser.id,
    studentNumber: dbUser.student_number,
    name: dbUser.name,
    email: dbUser.email,
    role: dbUser.role,
    balance: (dbUser.tickets || 0) / 100, // Database stores in cents
    favoriteProducts: [],
    booths: dbUser.booth_access || []
  };
};

// Transform app User type to Supabase database format
export const transformUserToDatabase = (user: User): any => {
  return {
    id: user.id,
    student_number: user.studentNumber,
    name: user.name,
    email: user.email,
    role: user.role,
    tickets: Math.round(user.balance * 100), // Store in cents
    booth_access: user.booths || []
  };
};

// Transform Supabase database booth to app Booth type
export const transformDatabaseBooth = (dbBooth: any, products: any[] = []): Booth => {
  return {
    id: dbBooth.id,
    name: dbBooth.name,
    description: dbBooth.description || '',
    pin: dbBooth.pin,
    products: products.map(transformDatabaseProduct),
    managers: dbBooth.members || [],
    totalEarnings: (dbBooth.sales || 0) / 100, // Database stores in cents
    transactions: []
  };
};

// Transform Supabase database product to app Product type
export const transformDatabaseProduct = (dbProduct: any): Product => {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price / 100, // Database stores in cents
    boothId: dbProduct.booth_id,
    image: dbProduct.image,
    salesCount: 0
  };
};

// Transform Supabase database transaction to app Transaction type
export const transformDatabaseTransaction = (
  dbTransaction: any, 
  transactionProducts: any[] = []
): Transaction => {
  return {
    id: dbTransaction.id,
    timestamp: new Date(dbTransaction.created_at).getTime(),
    buyerId: dbTransaction.student_id,
    buyerName: dbTransaction.student_name,
    sellerId: dbTransaction.booth_id || undefined,
    sellerName: undefined,
    boothId: dbTransaction.booth_id || undefined,
    boothName: dbTransaction.booth_name || undefined,
    products: transactionProducts.map(tp => ({
      productId: tp.product_id,
      productName: tp.product_name,
      quantity: tp.quantity,
      price: tp.price / 100 // Database stores in cents
    })),
    amount: dbTransaction.amount / 100, // Database stores in cents
    type: dbTransaction.type,
    paymentMethod: dbTransaction.type === 'fund' ? 'cash' : undefined,
    sacMemberId: dbTransaction.sac_member || undefined,
    sacMemberName: undefined
  };
};
