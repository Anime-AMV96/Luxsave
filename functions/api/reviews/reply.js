// functions/api/reviews/reply.js
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
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };
    
    const data = await request.json();
    const { reviewId, reply } = data;
    
    if (!reviewId || !reply) {
      return jsonResponse({ success: false, error: 'Review ID e risposta richiesti' }, 400);
    }
    
    // Update review with admin reply
    const updateUrl = `${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: supabaseHeaders,
      body: JSON.stringify({ admin_reply: reply })
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to save reply');
    }
    
    return jsonResponse({
      success: true,
      message: 'Risposta salvata'
    });
    
  } catch (error) {
    console.error('Reply error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante il salvataggio'
    }, 500);
  }
}
