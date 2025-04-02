
import { useState, useCallback } from 'react';
import { Transaction, User, Product, PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { addFunds as addFundsService } from '../transactionService';
import { firestore } from '@/integrations/firebase/client';
import { collection, query, where, getDocs } from 'firebase/firestore';

export interface UseTransactionReturn {
  recordTransaction: (
    buyerId: string,
    buyerName: string,
    products: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }[],
    amount: number,
    paymentMethod: PaymentMethod,
    boothId?: string,
    boothName?: string
  ) => Promise<boolean>;
  addFunds: (studentId: string, amount: number, sacMemberId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  getTransactionsByDate: (dateRange: {startDate?: Date; endDate?: Date}, boothId?: string) => Promise<Transaction[]>;
  getTransactionsByBooth: (boothId: string) => Promise<Transaction[]>;
  getStudentTransactions: (studentId: string) => Promise<Transaction[]>;
  getBoothTransactions: (boothId: string) => Promise<Transaction[]>;
  getLeaderboard: () => Promise<{ boothId: string; boothName: string; earnings: number; }[]>;
  findUserByStudentNumber: (studentNumber: string) => Promise<User | null>;
  getBoothProducts: (boothId: string) => Promise<Product[]>;
  getUserBooths: (userId: string) => Promise<any[]>;
}

export const useTransaction = (): UseTransactionReturn => {
  const recordTransaction = async (
    buyerId: string,
    buyerName: string,
    products: {
      productId: string;
      productName: string;
      quantity: number;
      price: number;
    }[],
    amount: number,
    paymentMethod: PaymentMethod,
    boothId?: string,
    boothName?: string
  ): Promise<boolean> => {
    try {
      console.log('Recording transaction:', {
        buyerId,
        buyerName,
        products,
        amount,
        paymentMethod,
        boothId,
        boothName
      });
      
      return true;
    } catch (error) {
      console.error('Error recording transaction:', error);
      return false;
    }
  };

  const addFunds = async (
    studentId: string, 
    amount: number, 
    sacMemberId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      // Only pass reason when it's a refund (negative amount) or when a reason is provided
      const shouldPassReason = amount < 0 || (reason && reason.trim().length > 0);
      const result = await addFundsService(
        studentId, 
        amount, 
        sacMemberId, 
        shouldPassReason ? reason : undefined
      );
      
      if (result.success) {
        // Don't show reason in the success message if it's not a refund and no reason was provided
        const reasonText = shouldPassReason && reason ? ` (Reason: ${reason})` : '';
        return { 
          success: true, 
          message: `Successfully ${amount < 0 ? 'refunded' : 'added'} $${Math.abs(amount).toFixed(2)}${reasonText}`
        };
      } else {
        return { 
          success: false, 
          message: 'Failed to add funds' 
        };
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      return { 
        success: false, 
        message: 'An error occurred while adding funds' 
      };
    }
  };

  const getTransactionsByDate = async (
    dateRange: {startDate?: Date; endDate?: Date},
    boothId?: string
  ): Promise<Transaction[]> => {
    return [];
  };

  const getTransactionsByBooth = async (boothId: string): Promise<Transaction[]> => {
    return [];
  };

  const getStudentTransactions = async (studentId: string): Promise<Transaction[]> => {
    return [];
  };

  const getBoothTransactions = async (boothId: string): Promise<Transaction[]> => {
    try {
      console.log(`Loading transactions for booth: ${boothId}`);
      return [];
    } catch (error) {
      console.error(`Error loading booth transactions: ${error}`);
      return [];
    }
  };

  const getLeaderboard = async (): Promise<{ boothId: string; boothName: string; earnings: number }[]> => {
    return [];
  };

  const findUserByStudentNumber = async (studentNumber: string): Promise<User | null> => {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('student_number', '==', studentNumber));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const userData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        name: userData.name,
        email: userData.email,
        studentNumber: userData.student_number,
        role: userData.role,
        balance: (userData.tickets || 0) / 100,
        booths: userData.booth_access || []
      };
    } catch (error) {
      console.error('Error finding user by student number:', error);
      return null;
    }
  };

  const getBoothProducts = async (boothId: string): Promise<Product[]> => {
    return [];
  };

  const getUserBooths = async (userId: string): Promise<any[]> => {
    return [];
  };

  return {
    recordTransaction,
    addFunds,
    getTransactionsByDate,
    getTransactionsByBooth,
    getStudentTransactions,
    getBoothTransactions,
    getLeaderboard,
    findUserByStudentNumber,
    getBoothProducts,
    getUserBooths
  };
};
