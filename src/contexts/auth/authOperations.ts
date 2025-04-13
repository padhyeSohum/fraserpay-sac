import { auth, firestore } from '@/integrations/firebase/client';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { User } from '@/types';
import { fetchUserData } from './authUtils';
import { SAC_PIN } from './types';

// Maximum retry attempts for network operations
const MAX_RETRIES = 3;

// Helper function to retry operations on network failure
const withRetry = async <T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (error.code === 'auth/network-request-failed' && retries > 0) {
      console.log(`Network request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      // Wait for a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Check if student number exists in Firebase
export const checkStudentNumberExists = async (studentNumber: string): Promise<boolean> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    
    const querySnapshot = await withRetry(async () => {
      return await getDocs(q);
    });
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking student number:', error);
    throw error;
  }
};

// Login functionality
export const loginUser = async (studentNumber: string, password: string): Promise<User | null> => {
  try {
    // First, find the user by student number
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    
    const querySnapshot = await withRetry(async () => {
      return await getDocs(q);
    });
    
    if (querySnapshot.empty) {
      throw new Error('Student number not found');
    }
    
    const userData = querySnapshot.docs[0].data();
    
    // Now sign in with email and password
    const userCredential = await withRetry(async () => {
      return await signInWithEmailAndPassword(auth, userData.email, password);
    });
    
    if (!userCredential.user) {
      throw new Error('Failed to authenticate user');
    }
    
    toast.success('Login successful');
    
    // Fetch and return user data
    return await fetchUserData(userCredential.user.uid);
    
  } catch (error: any) {
    if (error.code === 'auth/network-request-failed') {
      toast.error('Network connection error. Please check your internet connection and try again.');
    } else {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
    console.error(error);
    return null;
  }
};

// Registration functionality
export const registerUser = async (
  studentNumber: string, 
  name: string, 
  email: string, 
  password: string
): Promise<boolean> => {
  try {
    // Check if user already exists in Firestore by student number
    const studentExists = await checkStudentNumberExists(studentNumber);
    
    if (studentExists) {
      toast.error('Only students from John Fraser SS can access FraserPay, please ensure you\'ve used the right student number or contact SAC');
      return false;
    }
    
    // Register user with Firebase Auth
    const userCredential = await withRetry(async () => {
      return await createUserWithEmailAndPassword(auth, email, password);
    });
    
    if (!userCredential.user) {
      throw new Error('Failed to create account');
    }
    
    // Generate QR code for the user
    const qrCode = `USER:${userCredential.user.uid}`;
    
    // Create user profile in Firestore users collection
    await withRetry(async () => {
      return await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        name,
        email,
        student_number: studentNumber,
        role: 'student',
        tickets: 0,
        booth_access: [], 
        qr_code: qrCode || "", 
        created_at: new Date().toISOString()
      });
    });
    
    toast.success('Registration successful!');
    return true;
    
  } catch (error: any) {
    if (error.code === 'auth/network-request-failed') {
      toast.error('Network connection error. Please check your internet connection and try again.');
    } else if (error.code === 'auth/email-already-in-use') {
      toast.error('This email is already registered. Please use a different email or try logging in.');
    } else {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    }
    console.error(error);
    throw error;
  }
};

// Logout functionality
export const logoutUser = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    toast.info('Logged out');
    return true;
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    return false;
  }
};

// SAC PIN verification functionality
export const verifySACAccess = async (pin: string, userId: string): Promise<boolean> => {
  if (pin === SAC_PIN) {
    try {
      // Update user role to SAC in Firestore
      const userRef = doc(firestore, 'users', userId);
      await withRetry(async () => {
        return await updateDoc(userRef, { role: 'sac' });
      });
      
      toast.success('SAC access granted');
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to grant SAC access');
      return false;
    }
  }
  
  toast.error('Invalid PIN');
  return false;
};

// Booth PIN verification functionality
export const verifyBoothAccess = async (pin: string, userId: string, userBooths: string[] = []): Promise<{ success: boolean, boothId?: string }> => {
  try {
    console.log("Verifying booth PIN:", pin);
    
    // Find booth with matching PIN
    const boothsRef = collection(firestore, 'booths');
    const q = query(boothsRef, where('pin', '==', pin));
    
    const querySnapshot = await withRetry(async () => {
      return await getDocs(q);
    });
    
    if (querySnapshot.empty) {
      console.error("No booth found with that PIN");
      throw new Error('Invalid booth PIN');
    }
    
    const boothDoc = querySnapshot.docs[0];
    const boothData = boothDoc.data();
    const boothId = boothDoc.id;
    
    console.log("Found booth:", boothId);
    
    // Check if user already has access
    const hasAccess = userBooths.includes(boothId);
    
    if (hasAccess) {
      console.log("User already has access to booth:", boothId);
      toast.info(`You already have access to ${boothData.name || 'this booth'}`);
      return { success: true, boothId: boothId };
    }
    
    // Add booth to user's booth access
    const updatedBoothAccess = [...(userBooths || []), boothId];
    
    // Update user's booth access in Firestore
    const userRef = doc(firestore, 'users', userId);
    await withRetry(async () => {
      return await updateDoc(userRef, { booth_access: updatedBoothAccess });
    });
    
    // Add user to booth members if members array exists
    if (boothData.members !== undefined) {
      const updatedMembers = [...(boothData.members || []), userId];
      
      const boothRef = doc(firestore, 'booths', boothId);
      await withRetry(async () => {
        return await updateDoc(boothRef, { members: updatedMembers });
      });
    }
    
    console.log("User successfully joined booth:", boothId);
    toast.success(`You now have access to ${boothData.name || 'this booth'}`);
    return { success: true, boothId: boothId };
    
  } catch (error) {
    console.error('Error verifying booth PIN:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to verify booth PIN');
    return { success: false };
  }
};
