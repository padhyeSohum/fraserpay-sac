
  const handleBoothTransaction = async () => {
    if (!selectedBooth) {
      toast.error('Please select a booth');
      return;
    }
    
    if (!foundStudent) {
      toast.error('Please find a student first');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Please add products to cart');
      return;
    }
    
    const booth = getBoothById(selectedBooth);
    if (!booth) {
      toast.error('Selected booth not found');
      return;
    }
    
    setIsProcessingTransaction(true);
    
    try {
      const result = await processPurchase(
        booth.id,
        foundStudent.id,
        foundStudent.name,
        userId || '',
        userName || '',
        cart,
        booth.name
      );
      
      if (result.success) {
        // Ensure the UI refreshes with the updated balance
        // Fetch the latest user data directly from Supabase
        const { data: updatedUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', foundStudent.id)
          .single();
        
        if (!error && updatedUser) {
          setFoundStudent({
            ...foundStudent,
            balance: updatedUser.tickets / 100
          });
          
          console.log('Updated student balance after transaction:', updatedUser.tickets / 100);
        }
        
        clearCart();
        onOpenChange(false);
        setSelectedBooth('');
        setTransactionStudentNumber('');
        setFoundStudent(null);
        
        toast.success('Transaction completed successfully');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    } finally {
      setIsProcessingTransaction(false);
    }
  };
