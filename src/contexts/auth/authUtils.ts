
import { auth, firestore } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';
import { User, UserRole } from '@/types';
import { transformFirebaseUser } from '@/utils/firebase';

// Define an interface for the raw user data from Firestore
interface FirestoreUserData {
  id: string;
  name?: string;
  email?: string;
  student_number?: string;
  role?: UserRole;
  tickets?: number;
  points?: number;
  booth_access?: string[];
  qr_code?: string;
  created_at?: string;
  [key: string]: any; // Allow for additional properties
}

// Fetch user data from Firestore
export const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    // console.log(userSnap);
    
    if (!userSnap.exists()) {
      console.error('No user data found for ID:', userId);
      return null;
    }
    
    const userData: FirestoreUserData = {
      id: userSnap.id,
      ...userSnap.data()
    };
    
    // Ensure all required fields have valid values
    if (!userData.booth_access) userData.booth_access = [];
    if (userData.tickets === undefined || userData.tickets === null) userData.tickets = 0;
    if (userData.points === undefined || userData.points === null) userData.points = 0;
    
    return transformFirebaseUser(userData);
  } catch (error) {
    console.error('Unexpected error fetching user data:', error);
    return null;
  }
};
