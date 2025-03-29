
import { User, Booth, Product, Transaction } from '@/types';
import { DocumentData } from 'firebase/firestore';

// Transform Firestore document to app User type
export const transformFirebaseUser = (dbUser: DocumentData): User => {
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

// Transform app User type to Firestore document format
export const transformUserToFirebase = (user: User): DocumentData => {
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

// Transform Firestore document to app Booth type
export const transformFirebaseBooth = (dbBooth: DocumentData, products: DocumentData[] = []): Booth => {
  return {
    id: dbBooth.id,
    name: dbBooth.name,
    description: dbBooth.description || '',
    pin: dbBooth.pin,
    products: products.map(transformFirebaseProduct),
    managers: dbBooth.members || [],
    totalEarnings: (dbBooth.sales || 0) / 100, // Database stores in cents
    transactions: []
  };
};

// Transform Firestore document to app Product type
export const transformFirebaseProduct = (dbProduct: DocumentData): Product => {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    price: dbProduct.price / 100, // Database stores in cents
    boothId: dbProduct.booth_id,
    image: dbProduct.image,
    salesCount: 0
  };
};

// Transform Firestore document to app Transaction type
export const transformFirebaseTransaction = (
  dbTransaction: DocumentData, 
  transactionProducts: DocumentData[] = []
): Transaction => {
  return {
    id: dbTransaction.id,
    timestamp: dbTransaction.created_at ? new Date(dbTransaction.created_at).getTime() : Date.now(),
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
