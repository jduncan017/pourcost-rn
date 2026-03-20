import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://jalzwbubdznevftnudqu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_R1yJbAZOsCYCmZDk-i2fiA_GtUG2o-q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // required for React Native
  },
});
