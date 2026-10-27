import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// "Delete my data": removes the caller's pollen history and their (anonymous) auth user.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, reason: 'unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const authClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await authClient.auth.getUser();
    if (userError || !userData.user) {
      return jsonResponse({ success: false, reason: 'unauthorized' }, 401);
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error: rowsError } = await admin.from('polenbee_pollen_analyses').delete().eq('user_id', userId);
    if (rowsError) throw rowsError;

    // The same Supabase project hosts other apps; only drop users that exist purely for PolenBee.
    if (userData.user.is_anonymous) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
      if (deleteError) throw deleteError;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('polenbee-delete-data error', error);
    return jsonResponse({ success: false, reason: 'server_error' }, 500);
  }
});
