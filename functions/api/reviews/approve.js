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
    
    const data = await request.json();
    const { reviewId } = data;
    
    if (!reviewId) {
      return jsonResponse({ success: false, error: 'Review ID richiesto' }, 400);
    }
    
    // First, get the review details for Discord notification
    const getUrl = `${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}&select=*`;
    const getResponse = await fetch(getUrl, { headers: supabaseHeaders });
    
    let reviewData = null;
    if (getResponse.ok) {
      const reviews = await getResponse.json();
      if (Array.isArray(reviews) && reviews.length > 0) {
        reviewData = reviews[0];
      }
    }
    
    // Get user info
    let userData = null;
    if (reviewData && reviewData.user_id) {
      const userUrl = `${env.SUPABASE_URL}/rest/v1/users?id=eq.${reviewData.user_id}&select=username,avatar,discord_id`;
      const userResponse = await fetch(userUrl, { headers: supabaseHeaders });
      if (userResponse.ok) {
        const users = await userResponse.json();
        if (Array.isArray(users) && users.length > 0) {
          userData = users[0];
        }
      }
    }
    
    // Update review to approved
    const updateUrl = `${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`;
    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        ...supabaseHeaders,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ approved: true })
    });
    
    if (!updateResponse.ok) {
      throw new Error('Failed to approve review');
    }
    
    // Send Discord notification for approved review
    if (env.DISCORD_WEBHOOK_URL && reviewData) {
      try {
        const stars = '⭐'.repeat(reviewData.rating || 5);
        const userName = userData?.username || 'Utente';
        
        await fetch(env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '✅ RECENSIONE APPROVATA E PUBBLICATA',
              color: 0x00FF00, // Verde
              fields: [
                {
                  name: '👤 Utente',
                  value: userName,
                  inline: true
                },
                {
                  name: '🎬 Servizio',
                  value: reviewData.service || 'N/A',
                  inline: true
                },
                {
                  name: '⭐ Valutazione',
                  value: stars,
                  inline: true
                },
                {
                  name: '📝 Titolo',
                  value: reviewData.title || 'Nessun titolo',
                  inline: false
                },
                {
                  name: '💬 Contenuto',
                  value: (reviewData.content || 'Nessun contenuto').substring(0, 500),
                  inline: false
                },
                {
                  name: '📊 Stato',
                  value: '✅ **PUBBLICATA SUL SITO**',
                  inline: false
                }
              ],
              footer: {
                text: `ID Recensione: ${reviewId}`
              },
              timestamp: new Date().toISOString()
            }]
          })
        });
      } catch (webhookError) {
        console.error('Discord webhook error:', webhookError);
        // Non blocchiamo per errore webhook
      }
    }
    
    return jsonResponse({
      success: true,
      message: 'Recensione approvata e pubblicata'
    });
    
  } catch (error) {
    console.error('Approve review error:', error);
    return jsonResponse({
      success: false,
      error: 'Errore durante l\'approvazione'
    }, 500);
  }
}
