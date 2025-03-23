
import { Booth, Product } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchAllBooths = async (): Promise<Booth[]> => {
  try {
    const { data: boothsData, error: boothsError } = await supabase
      .from('booths')
      .select('*');

    if (boothsError) {
      throw boothsError;
    }

    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*');

    if (productsError) {
      throw productsError;
    }

    if (boothsData) {
      const formattedBooths: Booth[] = boothsData.map(b => {
        const boothProducts = productsData?.filter(p => p.booth_id === b.id) || [];
        
        return {
          id: b.id,
          name: b.name,
          description: b.description || '',
          pin: b.pin,
          products: boothProducts.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price / 100,
            boothId: p.booth_id,
            salesCount: 0,
            image: p.image
          })),
          managers: b.members || [],
          totalEarnings: b.sales / 100,
          transactions: []
        };
      });

      return formattedBooths;
    }
    return [];
  } catch (error) {
    console.error('Error fetching booths:', error);
    toast.error('Failed to load booths');
    return [];
  }
};

export const getBoothById = (booths: Booth[], boothId: string): Booth | undefined => {
  return booths.find(b => b.id === boothId);
};

export const getBoothsByUserId = (booths: Booth[], userId: string): Booth[] => {
  return booths.filter(booth => booth.managers.includes(userId));
};

export const createBooth = async (name: string, description: string, userId: string): Promise<string | null> => {
  try {
    console.log("Creating booth:", { name, description, userId });
    
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    
    const { data, error } = await supabase
      .from('booths')
      .insert({
        name,
        description,
        pin,
        members: [userId],
        sales: 0
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating booth:", error);
      throw error;
    }
    
    if (!data) {
      console.error("No data returned from booth creation");
      throw new Error("Failed to create booth");
    }
    
    console.log("Booth created:", data);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('booth_access')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error("Error fetching user booth access:", userError);
      throw userError;
    }
    
    const updatedBoothAccess = [...(userData.booth_access || []), data.id];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ booth_access: updatedBoothAccess })
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating user booth access:", updateError);
      throw updateError;
    }
    
    console.log("Booth added to local state:", {
      id: data.id,
      name: data.name,
      description: data.description || '',
      pin: data.pin,
      managers: [userId]
    });
    
    return data.id;
  } catch (error) {
    console.error('Error creating booth:', error);
    toast.error('Failed to create booth');
    return null;
  }
};

export const addProductToBooth = async (boothId: string, product: Omit<Product, 'id' | 'boothId' | 'salesCount'>): Promise<boolean> => {
  try {
    const priceInCents = Math.round(product.price * 100);
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        price: priceInCents,
        booth_id: boothId,
        image: product.image
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding product:', error);
      throw error;
    }
    
    toast.success(`Added product: ${product.name}`);
    
    return true;
  } catch (error) {
    console.error('Error adding product:', error);
    toast.error('Failed to add product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    return false;
  }
};

export const removeProductFromBooth = async (boothId: string, productId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('booth_id', boothId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error removing product:', error);
    toast.error('Failed to remove product');
    return false;
  }
};

export const getLeaderboard = (booths: Booth[]) => {
  const boothEarnings = booths.map(booth => ({
    boothId: booth.id,
    boothName: booth.name,
    earnings: booth.totalEarnings
  }));
  
  return boothEarnings.sort((a, b) => b.earnings - a.earnings);
};
