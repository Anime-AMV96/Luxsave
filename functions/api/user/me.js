// functions/api/user/me.js
// Ottieni informazioni utente corrente

export async function onRequest(context) {
  const { request, env } = context;
  
  // Helper per JSON response
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  };
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  // Check if Supabase is configured
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return jsonResponse({
      authenticated: false,
      user: null,
      message: 'Auth not configured'
    });
  }
  
  try {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return jsonResponse({
        authenticated: false,
        user: null
      });
    }
    
    const sessionToken = sessionMatch[1];
    
    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Get session
    const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?token=eq.${sessionToken}&expires_at=gt.${new Date().toISOString()}&select=*`;
    const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
    const sessions = await sessionResponse.json();
    
    if (!sessions || sessions.length === 0) {
      return jsonResponse({
        authenticated: false,
        user: null
      });
    }
    
    const session = sessions[0];
    
    // Get user
    const userUrl = `${env.SUPABASE_URL}/rest/v1/users?id=eq.${session.user_id}&select=*`;
    const userResponse = await fetch(userUrl, { headers: supabaseHeaders });
    const users = await userResponse.json();
    
    if (!users || users.length === 0) {
      return jsonResponse({
        authenticated: false,
        user: null
      });
    }
    
    const user = users[0];
    
    return jsonResponse({
      authenticated: true,
      user: {
        id: user.id,
        discord_id: user.discord_id,
        username: user.username,
        avatar: user.avatar,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return jsonResponse({
      authenticated: false,
      user: null,
      error: error.message
    });
  }
}
