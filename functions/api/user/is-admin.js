// functions/api/user/is-admin.js
// Verifica se l'utente corrente è admin

export async function onRequest(context) {
  const { request, env } = context;
  
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  };
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ isAdmin: false });
    }
    
    // Get user from session
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return jsonResponse({ isAdmin: false });
    }
    
    const sessionToken = sessionMatch[1];
    
    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Get session
    const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?token=eq.${sessionToken}&expires_at=gt.${new Date().toISOString()}&select=user_id`;
    const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
    const sessions = await sessionResponse.json();
    
    if (!sessions || sessions.length === 0) {
      return jsonResponse({ isAdmin: false });
    }
    
    const userId = sessions[0].user_id;
    
    // Check if user is admin
    const adminUrl = `${env.SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${userId}&select=id`;
    const adminResponse = await fetch(adminUrl, { headers: supabaseHeaders });
    const admins = await adminResponse.json();
    
    return jsonResponse({
      isAdmin: admins && admins.length > 0
    });
    
  } catch (error) {
    console.error('Is admin check error:', error);
    return jsonResponse({ isAdmin: false });
  }
}
