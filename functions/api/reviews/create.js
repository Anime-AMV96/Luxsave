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
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ success: false, error: 'Database non configurato' }, 500);
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
      return jsonResponse({ success: false, error: 'Devi effettuare il login' }, 401);
    }
    
    const sessionToken = sessionMatch[1];
    
    // Get session
    const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?token=eq.${sessionToken}&select=*`;
    const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
    const sessions = await sessionResponse.json();
    
    if (!sessions || sessions.length === 0) {
      return jsonResponse({ success: false, error: 'Sessione non valida' }, 401);
    }
    
    const session = sessions[0];
    
    // Get user
    const userUrl = `${env.SUPABASE_URL}/rest/v1/users?id=eq.${session.user_id}&select=*`;
    const userResponse = await fetch(userUrl, { headers: supabaseHeaders });
    const users = await userResponse.json();
    
    if (!users || users.length === 0) {
      return jsonResponse({ success: false, error: 'Utente non trovato' }, 401);
    }
    
    const user = users[0];
    
    // Parse body
    const data = await request.json();
    const { service, rating, title, content } = data;
    
    if (!service || !rating || !title || !content) {
      return jsonResponse({ success: false, error: 'Tutti i campi sono obbligatori' }, 400);
    }
    
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return jsonResponse({ success: false, error: 'Rating deve essere tra 1 e 5' }, 400);
    }
    
    // Create review
    const reviewData = {
      user_id: user.id,
      service: String(service).trim(),
      rating: ratingNum,
      title: String(title).trim(),
      content: String(content).trim(),
      approved: false
    };
    
    const createUrl = `${env.SUPABASE_URL}/rest/v1/reviews`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: { ...supabaseHeaders, 'Prefer': 'return=representation' },
      body: JSON.stringify(reviewData)
    });
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      return jsonResponse({ success: false, error: 'Errore salvataggio', details: errorText }, 500);
    }
    
    const review = await createResponse.json();
    
    // Discord notification with IN ATTESA
    if (env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '⭐ NUOVA RECENSIONE',
              description: '```⏳ IN ATTESA DI APPROVAZIONE```',
              color: 0xFFBE0B,
              fields: [
                { name: '👤 Utente', value: user.username || 'Anonimo', inline: true },
                { name: '📦 Servizio', value: service, inline: true },
                { name: '⭐ Valutazione', value: '★'.repeat(ratingNum) + '☆'.repeat(5 - ratingNum), inline: true },
                { name: '📝 Titolo', value: title, inline: false },
                { name: '💬 Contenuto', value: content.length > 300 ? content.substring(0, 297) + '...' : content, inline: false },
                { name: '📊 Stato', value: '⏳ **IN ATTESA**', inline: true }
              ],
              footer: { text: '💎 LUXSAVE - Vai al pannello admin per approvare' },
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (e) {
        console.error('Discord error:', e);
      }
    }
    
    return jsonResponse({
      success: true,
      message: 'Recensione inviata! Sarà visibile dopo l\'approvazione.',
      review: Array.isArray(review) ? review[0] : review
    });
    
  } catch (error) {
    console.error('Create review error:', error);
    return jsonResponse({ success: false, error: 'Errore creazione recensione', details: error.message }, 500);
  }
}
