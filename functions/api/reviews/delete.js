// functions/api/reviews/delete.js
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
    const { reviewId } = data;
    
    if (!reviewId) {
      return jsonResponse({ success: false, error: 'Review ID richiesto' }, 400);
    }
    
    // Delete review
    const deleteUrl = `${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: supabaseHeaders
    });
    
    if (!deleteResponse.ok) {
      throw new Error('Failed to delete review');
    }
    
    return jsonResponse({
      success: true,
      message: 'Recensione eliminata'
    });
    
  } catch (error) {
    console.error('Delete review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante l\'eliminazione'
    }, 500);
  }
}
