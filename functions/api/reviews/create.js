// functions/api/reviews/create.js
export async function onRequest(context) {
  const { request, env } = context;
  
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
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }
  
  try {
    const user = await getAuthUser(request, env);
    
    if (!user) {
      return jsonResponse({
        success: false,
        error: 'Devi effettuare il login per lasciare una recensione'
      }, 401);
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
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    
    // Verifica se già recensito
    const { data: existing } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('service', service);
    
    if (existing && existing.length > 0) {
      return jsonResponse({
        success: false,
        error: 'Hai già recensito questo servizio'
      }, 400);
    }
    
    // Crea recensione
    const { data: review, error } = await supabase
      .from('reviews')
      .insert([{
        user_id: user.id,
        service,
        rating: parseInt(rating),
        title,
        content,
        approved: false
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return jsonResponse({
      success: true,
      message: 'Recensione inviata! Sarà visibile dopo l\'approvazione.',
      review: review
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante la creazione della recensione'
    }, 500);
  }
}
