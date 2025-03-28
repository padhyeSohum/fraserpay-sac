
import { auth, firestore } from '@/integrations/firebase/client';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { User } from '@/types';
import { fetchUserData } from './authUtils';
import { SAC_PIN } from './types';

// Login functionality
export const loginUser = async (studentNumber: string, password: string): Promise<User | null> => {
  try {
    // First, find the user by student number
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('Student number not found');
    }
    
    const userData = querySnapshot.docs[0].data();
    
    // Now sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
    
    if (!userCredential.user) {
      throw new Error('Failed to authenticate user');
    }
    
    toast.success('Login successful');
    
    // Fetch and return user data
    return await fetchUserData(userCredential.user.uid);
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Login failed');
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
    // Check if user already exists
    const usersRef = collection(firestore, 'users');
    const studentQuery = query(usersRef, where('student_number', '==', studentNumber));
    const emailQuery = query(usersRef, where('email', '==', email));
    
    const [studentSnapshot, emailSnapshot] = await Promise.all([
      getDocs(studentQuery),
      getDocs(emailQuery)
    ]);
    
    if (!studentSnapshot.empty || !emailSnapshot.empty) {
      throw new Error('Student number or email already registered');
    }
    
    // Register user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    if (!userCredential.user) {
      throw new Error('Failed to create account');
    }
    
    // Generate QR code for the user
    const qrCode = `USER:${userCredential.user.uid}`;
    
    // Create user profile in Firestore users collection
    await setDoc(doc(firestore, 'users', userCredential.user.uid), {
      name,
      email,
      student_number: studentNumber,
      role: 'student',
      tickets: 0,
      booth_access: [], // Ensure this is an empty array, not undefined
      qr_code: qrCode || "", // Ensure qr_code is never null or undefined
      created_at: new Date().toISOString()
    });
    
    toast.success('Registration successful!');
    return true;
    
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Registration failed');
    console.error(error);
    return false;
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
      await updateDoc(userRef, { role: 'sac' });
      
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
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error("No booth found with that PIN");
      throw new Error('Invalid booth PIN');
    }
    
    const boothDoc = querySnapshot.docs[0];
    const boothData = {
      id: boothDoc.id,
      ...boothDoc.data()
    };
    
    console.log("Found booth:", boothData);
    
    // Check if user already has access
    const hasAccess = userBooths.includes(boothData.id);
    
    if (hasAccess) {
      console.log("User already has access to booth:", boothData.id);
      toast.info(`You already have access to ${boothData.name}`);
      return { success: true, boothId: boothData.id };
    }
    
    // Add booth to user's booth access
    const updatedBoothAccess = [...(userBooths || []), boothData.id];
    
    // Update user's booth access in Firestore
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { booth_access: updatedBoothAccess });
    
    // Add user to booth members
    const updatedMembers = [...(boothData.members || []), userId];
    
    const boothRef = doc(firestore, 'booths', boothData.id);
    await updateDoc(boothRef, { members: updatedMembers });
    
    console.log("User successfully joined booth:", boothData.id);
    toast.success(`You now have access to ${boothData.name}`);
    return { success: true, boothId: boothData.id };
    
  } catch (error) {
    console.error('Error verifying booth PIN:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to verify booth PIN');
    return { success: false };
  }
};
