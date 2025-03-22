
import { supabase } from '@/integrations/supabase/client';
import { Booth, Product } from '@/types';

// Function to check if sample booths already exist
export const checkSampleBooths = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('id, name')
      .or('name.eq.SAC Booth,name.eq.Ms Sinclair\'s Sandwiches');
    
    if (error) {
      console.error('Error checking sample booths:', error);
      return false;
    }
    
    return data && data.length >= 2;
  } catch (error) {
    console.error('Error checking sample booths:', error);
    return false;
  }
};

// Function to create sample booths with products
export const createSampleBooths = async (): Promise<boolean> => {
  try {
    const boothsExist = await checkSampleBooths();
    
    if (boothsExist) {
      console.log('Sample booths already exist');
      return true;
    }
    
    console.log('Creating sample booths and products...');
    
    // Create SAC Booth
    const { data: sacBooth, error: sacBoothError } = await supabase
      .from('booths')
      .insert({
        name: 'SAC Booth',
        description: 'Student Activity Council Booth',
        pin: '9247',
        sales: 0
      })
      .select()
      .single();
    
    if (sacBoothError) {
      console.error('Error creating SAC Booth:', sacBoothError);
      return false;
    }
    
    // Create Ms Sinclair's Sandwiches
    const { data: sandwichBooth, error: sandwichBoothError } = await supabase
      .from('booths')
      .insert({
        name: 'Ms Sinclair\'s Sandwiches',
        description: 'Homemade fresh sandwiches',
        pin: '3015',
        sales: 0
      })
      .select()
      .single();
    
    if (sandwichBoothError) {
      console.error('Error creating Sandwich Booth:', sandwichBoothError);
      return false;
    }
    
    // Add products to SAC Booth
    const sacProducts = [
      { name: 'School Hoodie', price: 3500, booth_id: sacBooth.id },
      { name: 'Spirit T-Shirt', price: 1500, booth_id: sacBooth.id },
      { name: 'Fraser Mug', price: 1000, booth_id: sacBooth.id },
      { name: 'Event Ticket', price: 500, booth_id: sacBooth.id }
    ];
    
    const { error: sacProductsError } = await supabase
      .from('products')
      .insert(sacProducts);
    
    if (sacProductsError) {
      console.error('Error adding SAC products:', sacProductsError);
      return false;
    }
    
    // Add products to Sandwich Booth
    const sandwichProducts = [
      { name: 'Cheese Sandwich', price: 350, booth_id: sandwichBooth.id },
      { name: 'Veggie Wrap', price: 400, booth_id: sandwichBooth.id },
      { name: 'Turkey & Swiss', price: 450, booth_id: sandwichBooth.id },
      { name: 'BLT Supreme', price: 500, booth_id: sandwichBooth.id },
      { name: 'Cookie', price: 150, booth_id: sandwichBooth.id },
      { name: 'Bottled Water', price: 100, booth_id: sandwichBooth.id }
    ];
    
    const { error: sandwichProductsError } = await supabase
      .from('products')
      .insert(sandwichProducts);
    
    if (sandwichProductsError) {
      console.error('Error adding sandwich products:', sandwichProductsError);
      return false;
    }
    
    console.log('Sample booths and products created successfully!');
    return true;
  } catch (error) {
    console.error('Error creating sample booths:', error);
    return false;
  }
};
