
import { useState } from 'react';
import { Product, CartItem } from '@/types';
import { toast } from 'sonner';

export interface UseCartReturn {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  total: number;
  totalItems: number;
}

export const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const addToCart = (product: Product) => {
    setCart(prevCart => {
      // Check if product already exists in cart
      const existingItem = prevCart.find(item => item.productId === product.id);
      
      if (existingItem) {
        // Update quantity if product already exists
        return prevCart.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Add new product to cart
        return [...prevCart, { productId: product.id, product, quantity: 1 }];
      }
    });
    
    toast.success(`Added ${product.name} to cart`);
  };
  
  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.productId !== productId));
  };
  
  const clearCart = () => {
    setCart([]);
  };
  
  const increaseQuantity = (productId: string) => {
    setCart(prevCart => 
      prevCart.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      )
    );
  };
  
  const decreaseQuantity = (productId: string) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === productId);
      
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map(item => 
          item.productId === productId
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        );
      } else {
        return prevCart.filter(item => item.productId !== productId);
      }
    });
  };
  
  const total = cart.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );
  
  const totalItems = cart.reduce((sum, item) => 
    sum + item.quantity, 0
  );

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    increaseQuantity,
    decreaseQuantity,
    total,
    totalItems
  };
};
