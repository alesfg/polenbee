import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// There is no login screen: every device gets an anonymous Supabase user so its
// pollen history is stored under its own id.
export async function ensureSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signed, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signed.session;
}

export function onAuthChange(callback: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}
