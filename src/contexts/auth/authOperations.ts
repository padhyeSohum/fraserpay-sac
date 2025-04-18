import { auth, firestore } from '@/integrations/firebase/client';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { User } from '@/types';
import { fetchUserData } from './authUtils';
import { SAC_PIN } from './types';
import { signInWithGoogle, extractStudentNumberFromEmail } from '@/utils/auth';

const MAX_RETRIES = 3;

const withRetry = async <T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (error.code === 'auth/network-request-failed' && retries > 0) {
      console.log(`Network request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
};

const SAC_AUTHORIZED_EMAILS = [
  '909957@pdsb.net'
];

export const loginUser = async (studentNumber: string, password: string): Promise<User | null> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('student_number', '==', studentNumber));
    
    const querySnapshot = await withRetry(async () => {
      return await getDocs(q);
    });
    
    if (querySnapshot.empty) {
      throw new Error('Student number not found');
    }
    
    const userData = querySnapshot.docs[0].data();
    
    const userCredential = await withRetry(async () => {
      return await signInWithEmailAndPassword(auth, userData.email, password);
    });
    
    if (!userCredential.user) {
      throw new Error('Failed to authenticate user');
    }
    
    toast.success('Login successful');
    
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

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    console.log('Starting Google sign-in process');
    const googleUser = await signInWithGoogle();
    if (!googleUser) {
      console.log('Google sign-in failed or was cancelled by user');
      return null;
    }
    
    const email = googleUser.email;
    if (!email) {
      toast.error('Failed to get email from Google account');
      return null;
    }
    
    console.log('Google sign-in successful, email:', email);
    
    const studentNumber = extractStudentNumberFromEmail(email);
    if (!studentNumber) {
      toast.error('Could not extract student number from email');
      return null;
    }
    
    console.log('Extracted student number:', studentNumber);
    
    const usersRef = collection(firestore, 'users');
    
    let userQuery = query(usersRef, where('uid', '==', googleUser.uid));
    let querySnapshot = await withRetry(async () => {
      return await getDocs(userQuery);
    });
    
    if (querySnapshot.empty) {
      console.log('User not found by UID, trying student number lookup');
      userQuery = query(usersRef, where('student_number', '==', studentNumber));
      querySnapshot = await withRetry(async () => {
        return await getDocs(userQuery);
      });
    }
    
    let userData: User | null = null;
    
    if (!querySnapshot.empty) {
      console.log('Found existing user record');
      const userDoc = querySnapshot.docs[0].data();
      const userId = querySnapshot.docs[0].id;
      
      const isSACAuthorized = SAC_AUTHORIZED_EMAILS.includes(email);
      const userRole = isSACAuthorized ? 'sac' : (userDoc.role || 'student');
      
      await withRetry(async () => {
        return await updateDoc(doc(firestore, 'users', userId), {
          uid: googleUser.uid,
          email: email,
          role: userRole
        });
      });
      
      toast.success('Login successful');
      
      userData = await fetchUserData(userId);
    } else {
      console.log('Creating new user account');
      const qrCode = `USER:${googleUser.uid}`;
      
      const isSACAuthorized = SAC_AUTHORIZED_EMAILS.includes(email);
      const userRole = isSACAuthorized ? 'sac' : 'student';
      
      await withRetry(async () => {
        return await setDoc(doc(firestore, 'users', googleUser.uid), {
          name: googleUser.displayName || 'Student',
          email: email,
          uid: googleUser.uid,
          student_number: studentNumber,
          role: userRole,
          tickets: 0,
          booth_access: [],
          qr_code: qrCode,
          created_at: new Date().toISOString()
        });
      });
      
      toast.success('New account created successfully');
      userData = await fetchUserData(googleUser.uid);
    }
    
    console.log('Google auth complete, returning user data:', userData?.id);
    return userData;
  } catch (error: any) {
    console.error('Error in Google sign-in:', error);
    toast.error(error instanceof Error ? error.message : 'Google sign-in failed');
    return null;
  }
};

export const registerUser = async (
  studentNumber: string, 
  name: string, 
  email: string, 
  password: string
): Promise<boolean> => {
  try {
    const usersRef = collection(firestore, 'users');
    const studentQuery = query(usersRef, where('student_number', '==', studentNumber));
    
    const studentSnapshot = await withRetry(async () => {
      return await getDocs(studentQuery);
    });
    
    const userCredential = await withRetry(async () => {
      return await createUserWithEmailAndPassword(auth, email, password);
    });
    
    if (!userCredential.user) {
      throw new Error('Failed to create account');
    }
    
    const qrCode = `USER:${userCredential.user.uid}`;
    
    let existingUserData: any = null;
    let existingUserDocId: string | null = null;
    let existingTickets = 0;
    let existingBoothAccess: string[] = [];
    
    if (!studentSnapshot.empty) {
      existingUserDocId = studentSnapshot.docs[0].id;
      existingUserData = studentSnapshot.docs[0].data();
      existingTickets = existingUserData.tickets || 0;
      existingBoothAccess = existingUserData.booth_access || [];
      console.log(`Found existing user with student number ${studentNumber}, current balance: ${existingTickets}`);
    }
    
    await withRetry(async () => {
      return await setDoc(doc(firestore, 'users', userCredential.user.uid), {
        name,
        email,
        uid: userCredential.user.uid,
        student_number: studentNumber,
        role: 'student',
        tickets: existingTickets,
        booth_access: existingBoothAccess,
        qr_code: qrCode || "",
        created_at: new Date().toISOString()
      });
    });
    
    if (existingUserDocId && existingUserDocId !== userCredential.user.uid) {
      try {
        await withRetry(async () => {
          return await deleteDoc(doc(firestore, 'users', existingUserDocId));
        });
        console.log(`Deleted old user record: ${existingUserDocId}`);
      } catch (deleteError) {
        console.error('Error deleting old user record:', deleteError);
      }
    }
    
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

export const verifySACAccess = async (pin: string, userId: string): Promise<boolean> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      toast.error('User not found');
      return false;
    }

    const userData = userDoc.data();
    
    if (SAC_AUTHORIZED_EMAILS.includes(userData.email)) {
      await withRetry(async () => {
        return await updateDoc(userRef, { role: 'sac' });
      });
      
      toast.success('SAC access granted');
      return true;
    }
    
    if (pin === SAC_PIN) {
      await withRetry(async () => {
        return await updateDoc(userRef, { role: 'sac' });
      });
      
      toast.success('SAC access granted');
      return true;
    }
    
    toast.error('Unauthorized access');
    return false;
  } catch (error) {
    console.error('Error verifying SAC access:', error);
    toast.error('Failed to verify SAC access');
    return false;
  }
};

export const verifyBoothAccess = async (pin: string, userId: string, userBooths: string[] = []): Promise<{ success: boolean, boothId?: string }> => {
  try {
    console.log("Verifying booth PIN:", pin);
    
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
    
    const hasAccess = userBooths.includes(boothId);
    
    if (hasAccess) {
      console.log("User already has access to booth:", boothId);
      toast.info(`You already have access to ${boothData.name || 'this booth'}`);
      return { success: true, boothId: boothId };
    }
    
    const updatedBoothAccess = [...(userBooths || []), boothId];
    
    const userRef = doc(firestore, 'users', userId);
    await withRetry(async () => {
      return await updateDoc(userRef, { booth_access: updatedBoothAccess });
    });
    
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
