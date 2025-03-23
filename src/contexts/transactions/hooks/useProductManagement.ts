
import { useState } from 'react';
import { Product } from '@/types';
import { addProductToBooth as addProductToBoothService, removeProductFromBooth as removeProductFromBoothService } from '../boothService';

export interface UseProductManagementReturn {
  loadBoothProducts: (boothId: string, booths: Array<any>) => Product[];
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
}

export const useProductManagement = (): UseProductManagementReturn => {
  const loadBoothProducts = (boothId: string, booths: Array<any>) => {
    const booth = booths.find(booth => booth.id === boothId);
    return booth ? booth.products : [];
  };

  const addProductToBoothImpl = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    try {
      return await addProductToBoothService(boothId, product);
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    }
  };

  const removeProductFromBoothImpl = async (boothId: string, productId: string) => {
    try {
      return await removeProductFromBoothService(boothId, productId);
    } catch (error) {
      console.error('Error removing product:', error);
      return false;
    }
  };

  return {
    loadBoothProducts,
    addProductToBooth: addProductToBoothImpl,
    removeProductFromBooth: removeProductFromBoothImpl
  };
};
