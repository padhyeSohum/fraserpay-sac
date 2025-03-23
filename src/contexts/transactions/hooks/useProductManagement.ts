
import { useState } from 'react';
import { Product } from '@/types';
import { addProductToBooth as addProductToBoothService, removeProductFromBooth as removeProductFromBoothService } from '../boothService';

export interface UseProductManagementReturn {
  loadBoothProducts: (boothId: string, booths: Array<any>) => Product[];
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
}

export const useProductManagement = (): UseProductManagementReturn => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadBoothProducts = (boothId: string, booths: Array<any>) => {
    console.log('Loading booth products for booth:', boothId);
    const booth = booths.find(booth => booth.id === boothId);
    return booth ? booth.products : [];
  };

  const addProductToBoothImpl = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    console.log('Adding product to booth:', { boothId, product });
    
    // Prevent multiple concurrent calls
    if (isProcessing) {
      console.warn('Product operation already in progress, please wait');
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      // Call the service function to add the product
      const result = await addProductToBoothService(boothId, product);
      console.log('Product add result:', result);
      return result;
    } catch (error) {
      console.error('Error adding product:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const removeProductFromBoothImpl = async (boothId: string, productId: string) => {
    console.log('Removing product from booth:', { boothId, productId });
    
    // Prevent multiple concurrent calls
    if (isProcessing) {
      console.warn('Product operation already in progress, please wait');
      return false;
    }
    
    setIsProcessing(true);
    
    try {
      // Call the service function to remove the product
      const result = await removeProductFromBoothService(boothId, productId);
      console.log('Product remove result:', result);
      return result;
    } catch (error) {
      console.error('Error removing product:', error);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    loadBoothProducts,
    addProductToBooth: addProductToBoothImpl,
    removeProductFromBooth: removeProductFromBoothImpl
  };
};
