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
  
  // Helper per query Supabase
  const supabaseQuery = async (table, query = {}) => {
    const url = new URL(`${env.SUPABASE_URL}/rest/v1/${table}`);
    
    // Aggiungi parametri query
    if (query.select) url.searchParams.append('select', query.select);
    if (query.eq) {
      for (const [key, value] of Object.entries(query.eq)) {
        url.searchParams.append(key, `eq.${value}`);
      }
    }
    if (query.gt) {
      for (const [key, value] of Object.entries(query.gt)) {
        url.searchParams.append(key, `gt.${value}`);
      }
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }
    
    return await response.json();
  };
  
  // Helper per ottenere utente da session
  const getAuthUser = async (request, env) => {
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    
    if (!sessionMatch) return null;
    
    const sessionToken = sessionMatch[1];
    
    try {
      const sessions = await supabaseQuery('sessions', {
        select: 'id,user_id,users(id,discord_id,username,avatar,email)',
        eq: { session_token: sessionToken },
        gt: { expires_at: new Date().toISOString() }
      });
      
      if (!sessions || sessions.length === 0) return null;
      
      return sessions[0]?.users || null;
    } catch (error) {
      console.error('Auth error:', error);
      return null;
    }
  };
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  try {
    const user = await getAuthUser(request, env);
    
    if (!user) {
      return jsonResponse({
        authenticated: false,
        user: null
      });
    }
    
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

