
// DEPRECATED: This file is kept for backward compatibility but is no longer in use.
// The application now uses Firebase exclusively for data storage and authentication.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { clearAppStorage } from '@/utils/storage';

const SUPABASE_URL = "https://mpzvrwziwwyyrhjbchqa.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenZyd3ppd3d5eXJoamJjaHFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIzNTIzMjUsImV4cCI6MjA1NzkyODMyNX0.ouzNwP4rCQTRgS_IQzUsviyfPtU_7hPf6UIBJ2u0ZQA";

// Recreate the client with explicit persistence options
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    detectSessionInUrl: true,
    flowType: 'implicit'
  }
});

// Function to clear Supabase auth state (useful for troubleshooting)
export const clearSupabaseAuth = async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
    clearAppStorage();
    localStorage.removeItem('supabase.auth.token');
    console.log('Supabase auth cleared');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
};
