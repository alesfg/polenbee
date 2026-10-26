import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ensureSession, onAuthChange } from '@/lib/auth';

// undefined while starting up, null if the anonymous sign-in failed (e.g. offline).
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    ensureSession().then(setSession).catch(() => setSession(null));
    return onAuthChange((s) => { if (s) setSession(s); });
  }, []);

  return session;
}
