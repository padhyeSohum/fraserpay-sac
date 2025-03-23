
import { useState } from 'react';
import { Product } from '@/types';
import { addProductToBooth, removeProductFromBooth } from '../boothService';

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

  return {
    loadBoothProducts,
    addProductToBooth,
    removeProductFromBooth
  };
};
