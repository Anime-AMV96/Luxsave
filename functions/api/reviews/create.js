// functions/api/reviews/create.js
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
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ success: false, error: 'Supabase not configured' }, 500);
    }

    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Get user from session cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return jsonResponse({
        success: false,
        error: 'Devi effettuare il login per lasciare una recensione'
      }, 401);
    }
    
    const sessionToken = sessionMatch[1];
    
    // Get session and user
    const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?session_token=eq.${sessionToken}&expires_at=gt.${new Date().toISOString()}&select=*`;
    const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
    const sessions = await sessionResponse.json();
    
    if (!sessions || sessions.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Sessione scaduta, effettua nuovamente il login'
      }, 401);
    }
    
    const session = sessions[0];
    
    // Get user info
    const userUrl = `${env.SUPABASE_URL}/rest/v1/users?id=eq.${session.user_id}&select=*`;
    const userResponse = await fetch(userUrl, { headers: supabaseHeaders });
    const users = await userResponse.json();
    const user = users && users.length > 0 ? users[0] : null;
    
    if (!user) {
      return jsonResponse({ success: false, error: 'Utente non trovato' }, 401);
    }
    
    const data = await request.json();
    const { service, rating, title, content } = data;
    
    if (!service || !rating || !title || !content) {
      return jsonResponse({
        success: false,
        error: 'Tutti i campi sono obbligatori'
      }, 400);
    }
    
    if (rating < 1 || rating > 5) {
      return jsonResponse({
        success: false,
        error: 'Rating deve essere tra 1 e 5'
      }, 400);
    }
    
    // Check if already reviewed this service
    const existingUrl = `${env.SUPABASE_URL}/rest/v1/reviews?user_id=eq.${user.id}&service=eq.${encodeURIComponent(service)}&select=id`;
    const existingResponse = await fetch(existingUrl, { headers: supabaseHeaders });
    const existing = await existingResponse.json();
    
    if (existing && existing.length > 0) {
      return jsonResponse({
        success: false,
        error: 'Hai già recensito questo servizio'
      }, 400);
    }
    
    // Create review
    const createUrl = `${env.SUPABASE_URL}/rest/v1/reviews`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: user.id,
        user_name: user.username,
        user_avatar: user.avatar,
        service,
        rating: parseInt(rating),
        title,
        content,
        approved: false
      })
    });
    
    if (!createResponse.ok) {
      throw new Error('Failed to create review');
    }
    
    const review = await createResponse.json();
    
    return jsonResponse({
      success: true,
      message: 'Recensione inviata! Sarà visibile dopo l\'approvazione.',
      review: review[0]
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante la creazione della recensione'
    }, 500);
  }
}
