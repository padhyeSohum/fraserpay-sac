
  const loadUsers = async () => {
    setIsUserLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        console.log('SAC Dashboard: Loaded users', data.length);
        setUsersList(data);
        setFilteredUsers(data);
        
        setStats(prev => ({
          ...prev,
          totalUsers: data.length
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
      setUsersList([]);
      setFilteredUsers([]);
    } finally {
      setIsUserLoading(false);
    }
  };
  
  const handleStudentFound = async (student: any, qrUrl: string) => {
    // Get the latest user data to ensure we have the current balance
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', student.id)
        .single();
      
      if (!error && userData) {
        // Update with the latest data from Supabase
        setFoundStudent({
          ...student,
          balance: userData.tickets / 100
        });
      } else {
        setFoundStudent(student);
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
      setFoundStudent(student);
    }
    
    setQrCodeUrl(qrUrl);
    setIsStudentDetailOpen(true);
  };
  
  const handleUserSelected = async (user: any) => {
    // Get the latest user data to ensure we have the current balance
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (!error && userData) {
        // Use the latest data from Supabase
        user = userData;
      }
    } catch (error) {
      console.error('Error fetching latest user data:', error);
    }
    
    const student = {
      id: user.id,
      name: user.name,
      studentNumber: user.student_number,
      email: user.email,
      balance: user.tickets / 100,
      qrCode: user.qr_code
    };
    
    setFoundStudent(student);
    
    if (user.qr_code || user.id) {
      const userData = user.qr_code || encodeUserData(user.id);
      const qrUrl = generateQRCode(userData);
      setQrCodeUrl(qrUrl);
    }
    
    setIsStudentDetailOpen(true);
  };
