
import { auth, firestore } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { User, UserRole } from '@/types';
import { transformFirebaseUser } from '@/utils/firebase';

// Fetch user data from Firestore
export const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('No user data found for ID:', userId);
      return null;
    }
    
    const userData = {
      id: userSnap.id,
      ...userSnap.data()
    };
    
    return transformFirebaseUser(userData);
  } catch (error) {
    console.error('Unexpected error fetching user data:', error);
    return null;
  }
};
