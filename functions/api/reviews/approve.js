// functions/api/reviews/approve.js
export async function onRequest(context) {
  const { request, env } = context;
  
  const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
  });
  
  if (request.method === 'OPTIONS') return jsonResponse({}, 200);
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return jsonResponse({ success: false, error: 'Not configured' }, 500);

    const headers = { 'apikey': env.SUPABASE_ANON_KEY, 'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' };
    const { reviewId } = await request.json();
    if (!reviewId) return jsonResponse({ success: false, error: 'Review ID required' }, 400);
    
    // Get review
    const getRes = await fetch(`${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}&select=*`, { headers });
    const reviews = await getRes.json();
    const review = reviews?.[0];
    
    // Get user
    let user = null;
    if (review?.user_id) {
      const userRes = await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=eq.${review.user_id}&select=username`, { headers });
      const users = await userRes.json();
      user = users?.[0];
    }
    
    // Update
    await fetch(`${env.SUPABASE_URL}/rest/v1/reviews?id=eq.${reviewId}`, {
      method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify({ approved: true })
    });
    
    // Discord notification
    if (env.DISCORD_WEBHOOK_URL && review) {
      await fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{ title: '✅ RECENSIONE APPROVATA', color: 0x00FF00, fields: [
            { name: '👤 Utente', value: user?.username || 'Utente', inline: true },
            { name: '🎬 Servizio', value: review.service, inline: true },
            { name: '⭐ Valutazione', value: '⭐'.repeat(review.rating), inline: true }
          ]}]
        })
      }).catch(() => {});
    }
    
    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ success: false, error: e.message }, 500);
  }
}
