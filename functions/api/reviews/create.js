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
    return jsonResponse({ success: false, error: 'Method not allowed' }, 405);
  }
  
  try {
    // Check Supabase config
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ 
        success: false, 
        error: 'Database non configurato',
        details: 'SUPABASE_URL o SUPABASE_ANON_KEY mancanti'
      }, 500);
    }

    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Get session cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    
    if (!sessionMatch) {
      return jsonResponse({
        success: false,
        error: 'Devi effettuare il login per lasciare una recensione'
      }, 401);
    }
    
    const sessionToken = sessionMatch[1];
    
    // Get session
    const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?token=eq.${sessionToken}&select=*`;
    const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
    
    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      return jsonResponse({
        success: false,
        error: 'Errore verifica sessione',
        details: errorText
      }, 500);
    }
    
    const sessions = await sessionResponse.json();
    
    if (!sessions || sessions.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Sessione non trovata o scaduta'
      }, 401);
    }
    
    const session = sessions[0];
    
    // Check session expiry
    if (new Date(session.expires_at) < new Date()) {
      return jsonResponse({
        success: false,
        error: 'Sessione scaduta, effettua nuovamente il login'
      }, 401);
    }
    
    // Get user
    const userUrl = `${env.SUPABASE_URL}/rest/v1/users?id=eq.${session.user_id}&select=*`;
    const userResponse = await fetch(userUrl, { headers: supabaseHeaders });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      return jsonResponse({
        success: false,
        error: 'Errore recupero utente',
        details: errorText
      }, 500);
    }
    
    const users = await userResponse.json();
    
    if (!users || users.length === 0) {
      return jsonResponse({
        success: false,
        error: 'Utente non trovato'
      }, 401);
    }
    
    const user = users[0];
    
    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (e) {
      return jsonResponse({
        success: false,
        error: 'Dati non validi',
        details: 'Il body della richiesta non è JSON valido'
      }, 400);
    }
    
    const { service, rating, title, content } = data;
    
    // Validate fields
    if (!service || !rating || !title || !content) {
      return jsonResponse({
        success: false,
        error: 'Tutti i campi sono obbligatori',
        details: `Mancanti: ${!service ? 'service ' : ''}${!rating ? 'rating ' : ''}${!title ? 'title ' : ''}${!content ? 'content' : ''}`
      }, 400);
    }
    
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return jsonResponse({
        success: false,
        error: 'Rating deve essere un numero tra 1 e 5'
      }, 400);
    }
    
    // Check if already reviewed this service
    const existingUrl = `${env.SUPABASE_URL}/rest/v1/reviews?user_id=eq.${user.id}&service=eq.${encodeURIComponent(service)}&select=id`;
    const existingResponse = await fetch(existingUrl, { headers: supabaseHeaders });
    
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      if (existing && existing.length > 0) {
        return jsonResponse({
          success: false,
          error: 'Hai già recensito questo servizio'
        }, 400);
      }
    }
    
    // Create review - using explicit column list
    const reviewData = {
      user_id: user.id,
      service: String(service).trim(),
      rating: ratingNum,
      title: String(title).trim().substring(0, 200),
      content: String(content).trim().substring(0, 2000),
      approved: false
    };
    
    const createUrl = `${env.SUPABASE_URL}/rest/v1/reviews`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        ...supabaseHeaders,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(reviewData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Supabase create error:', errorText);
      return jsonResponse({
        success: false,
        error: 'Errore salvataggio recensione',
        details: errorText
      }, 500);
    }
    
    const reviews = await createResponse.json();
    const review = Array.isArray(reviews) ? reviews[0] : reviews;
    
    // Send Discord notification (optional)
    if (env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '⭐ Nuova Recensione',
              color: 0x00FFF7,
              fields: [
                { name: '👤 Utente', value: user.username || 'Anonimo', inline: true },
                { name: '📦 Servizio', value: service, inline: true },
                { name: '⭐ Valutazione', value: '⭐'.repeat(ratingNum), inline: true },
                { name: '📝 Titolo', value: title.substring(0, 100) },
                { name: '💬 Contenuto', value: content.length > 200 ? content.substring(0, 197) + '...' : content }
              ],
              footer: { text: '💎 LUXSAVE - In attesa di approvazione' },
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (discordError) {
        // Non bloccare se la notifica fallisce
        console.error('Discord notification failed:', discordError);
      }
    }
    
    return jsonResponse({
      success: true,
      message: 'Recensione inviata! Sarà visibile dopo l\'approvazione.',
      review: review
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante la creazione della recensione',
      details: error.message || String(error)
    }, 500);
  }
}
