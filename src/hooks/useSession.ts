import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { onAuthChange, getSession } from '@/lib/auth';

export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    getSession().then(setSession);
    return onAuthChange(setSession);
  }, []);

  return session;
}
