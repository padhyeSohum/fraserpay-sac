
import { useState, useCallback } from 'react';
import { Product } from '@/types';
import { 
  addProductToBooth as addProductToBoothService, 
  removeProductFromBooth as removeProductFromBoothService 
} from '../boothService';
import { toast } from 'sonner';

export interface UseProductManagementReturn {
  loadBoothProducts: (boothId: string, booths: Array<any>) => Product[];
  addProductToBooth: (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => Promise<boolean>;
  removeProductFromBooth: (boothId: string, productId: string) => Promise<boolean>;
}

export const useProductManagement = (): UseProductManagementReturn => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const loadBoothProducts = useCallback((boothId: string, booths: Array<any>) => {
    console.log('Loading booth products for booth:', boothId);
    const booth = booths.find(booth => booth.id === boothId);
    if (!booth) {
      console.warn('Booth not found for id:', boothId);
      return [];
    }
    
    return booth.products || [];
  }, []);

  const addProductToBoothImpl = useCallback(async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>) => {
    console.log('Adding product to booth:', { boothId, product });
    
    // Prevent multiple concurrent calls
    if (isProcessing) {
      console.warn('Product operation already in progress, please wait');
      toast.error('An operation is already in progress. Please wait.');
      return false;
    }
    
    try {
      setIsProcessing(true);
      
      if (!boothId) {
        console.error('Invalid booth ID');
        toast.error('Invalid booth ID');
        return false;
      }
      
      if (!product || !product.name || !product.price) {
        console.error('Invalid product data');
        toast.error('Please provide valid product information');
        return false;
      }
      
      // Call the service function to add the product
      const result = await addProductToBoothService(boothId, product);
      console.log('Product add result:', result);
      
      if (result) {
        toast.success('Product added successfully');
      } else {
        toast.error('Failed to add product');
      }
      
      return result;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Error adding product: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  const removeProductFromBoothImpl = useCallback(async (boothId: string, productId: string) => {
    console.log('Removing product from booth:', { boothId, productId });
    
    // Prevent multiple concurrent calls
    if (isProcessing) {
      console.warn('Product operation already in progress, please wait');
      toast.error('An operation is already in progress. Please wait.');
      return false;
    }
    
    try {
      setIsProcessing(true);
      
      if (!boothId) {
        console.error('Invalid booth ID');
        toast.error('Invalid booth ID');
        return false;
      }
      
      if (!productId) {
        console.error('Invalid product ID');
        toast.error('Invalid product ID');
        return false;
      }
      
      // Call the service function to remove the product
      const result = await removeProductFromBoothService(boothId, productId);
      console.log('Product remove result:', result);
      
      if (result) {
        toast.success('Product removed successfully');
      } else {
        toast.error('Failed to remove product');
      }
      
      return result;
    } catch (error) {
      console.error('Error removing product:', error);
      toast.error('Error removing product: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing]);

  return {
    loadBoothProducts,
    addProductToBooth: addProductToBoothImpl,
    removeProductFromBooth: removeProductFromBoothImpl
  };
};
