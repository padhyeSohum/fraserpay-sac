
import { supabase } from '@/integrations/supabase/client';

// Create sample booths for demo purposes
export const createSampleBooths = async () => {
  try {
    // Check if sample booths already exist
    const { data: existingBooths, error: checkError } = await supabase
      .from('booths')
      .select('id, name, pin')
      .or('pin.eq.9247,pin.eq.3015');
    
    if (checkError) {
      console.error('Error checking existing booths:', checkError);
      return;
    }
    
    // Only create sample booths if they don't exist
    if (existingBooths && existingBooths.length >= 2) {
      console.log('Sample booths already exist, skipping creation');
      return;
    }
    
    // Create SAC Booth if it doesn't exist
    const sacBoothExists = existingBooths?.some(booth => booth.pin === '9247');
    if (!sacBoothExists) {
      const { data: sacBooth, error: sacError } = await supabase
        .from('booths')
        .insert({
          name: 'SAC Booth',
          description: 'Student Activities Council booth for handling funds and transactions',
          pin: '9247',
          members: [],
          sales: 0
        })
        .select()
        .single();
      
      if (sacError) {
        console.error('Error creating SAC booth:', sacError);
      } else {
        console.log('Created SAC booth:', sacBooth);
        
        // Add products to SAC booth
        const sacProducts = [
          { name: 'T-Shirt', price: 1500, image: 'https://via.placeholder.com/150' },
          { name: 'Raffle Ticket', price: 200, image: 'https://via.placeholder.com/150' },
          { name: 'Water Bottle', price: 500, image: 'https://via.placeholder.com/150' }
        ];
        
        for (const product of sacProducts) {
          const { error: productError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              price: product.price,
              booth_id: sacBooth.id,
              image: product.image
            });
          
          if (productError) {
            console.error(`Error adding product ${product.name}:`, productError);
          }
        }
      }
    }
    
    // Create Ms Sinclair's Sandwiches booth if it doesn't exist
    const sandwichBoothExists = existingBooths?.some(booth => booth.pin === '3015');
    if (!sandwichBoothExists) {
      const { data: sandwichBooth, error: sandwichError } = await supabase
        .from('booths')
        .insert({
          name: "Ms Sinclair's Sandwiches",
          description: 'Delicious sandwiches made with love',
          pin: '3015',
          members: [],
          sales: 0
        })
        .select()
        .single();
      
      if (sandwichError) {
        console.error("Error creating Ms Sinclair's Sandwiches booth:", sandwichError);
      } else {
        console.log("Created Ms Sinclair's Sandwiches booth:", sandwichBooth);
        
        // Add products to Sandwich booth
        const sandwichProducts = [
          { name: 'Ham & Cheese', price: 550, image: 'https://via.placeholder.com/150' },
          { name: 'Turkey & Avocado', price: 650, image: 'https://via.placeholder.com/150' },
          { name: 'Veggie Deluxe', price: 500, image: 'https://via.placeholder.com/150' },
          { name: 'Chips', price: 150, image: 'https://via.placeholder.com/150' },
          { name: 'Soda', price: 200, image: 'https://via.placeholder.com/150' }
        ];
        
        for (const product of sandwichProducts) {
          const { error: productError } = await supabase
            .from('products')
            .insert({
              name: product.name,
              price: product.price,
              booth_id: sandwichBooth.id,
              image: product.image
            });
          
          if (productError) {
            console.error(`Error adding product ${product.name}:`, productError);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error creating sample booths:', error);
  }
};
