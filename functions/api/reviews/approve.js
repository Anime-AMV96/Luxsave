// functions/api/reviews/approve.js
export async function onRequest(context) {
  const { request, env } = context;
  
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  };
  
  const getAuthUser = async (request, env) => {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    if (!sessionMatch) return null;
    const sessionToken = sessionMatch[1];
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      const { data: session } = await supabase
        .from('sessions')
        .select('*, users(*)')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();
      return session?.users || null;
    } catch (error) {
      return null;
    }
  };
  
  const isAdmin = async (userId, env) => {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      const { data } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', userId)
        .single();
      return !!data;
    } catch {
      return false;
    }
  };
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  try {
    const user = await getAuthUser(request, env);
    
    if (!user || !(await isAdmin(user.id, env))) {
      return jsonResponse({
        success: false,
        error: 'Non autorizzato'
      }, 403);
    }
    
    const data = await request.json();
    const { reviewId } = data;
    
    if (!reviewId) {
      return jsonResponse({
        success: false,
        error: 'Review ID richiesto'
      }, 400);
    }
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    const { error } = await supabase
      .from('reviews')
      .update({ approved: true })
      .eq('id', reviewId);
    
    if (error) throw error;
    
    return jsonResponse({
      success: true,
      message: 'Recensione approvata'
    });
    
  } catch (error) {
    console.error('Approve review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante l\'approvazione'
    }, 500);
  }
}
