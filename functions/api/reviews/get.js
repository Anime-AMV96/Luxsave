// functions/api/reviews/get.js
export async function onRequest(context) {
  const { request, env } = context;
  
  const jsonResponse = (data, status = 200) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  };
  
  if (request.method === 'OPTIONS') return jsonResponse({}, 200);
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ success: true, reviews: [] });
    }

    const headers = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const url = new URL(request.url);
    const isAdmin = url.searchParams.get('admin') === 'true';
    
    let reviewsUrl = `${env.SUPABASE_URL}/rest/v1/reviews?select=*&order=created_at.desc`;
    if (!isAdmin) reviewsUrl += '&approved=eq.true';
    
    const res = await fetch(reviewsUrl, { headers });
    if (!res.ok) return jsonResponse({ success: false, reviews: [] });
    
    const reviews = await res.json();
    if (!Array.isArray(reviews) || !reviews.length) return jsonResponse({ success: true, reviews: [] });
    
    // Get users
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    let usersMap = {};
    
    if (userIds.length) {
      const ids = userIds.map(id => `"${id}"`).join(',');
      const usersRes = await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=in.(${ids})&select=id,username,avatar,discord_id`, { headers });
      if (usersRes.ok) {
        const users = await usersRes.json();
        users.forEach(u => usersMap[u.id] = u);
      }
    }
    
    const formatted = reviews.map(r => {
      const u = usersMap[r.user_id] || {};
      return {
        ...r,
        users: { username: u.username || 'Utente', avatar: u.avatar, discord_id: u.discord_id },
        user_name: u.username || 'Utente'
      };
    });
    
    return jsonResponse({ success: true, reviews: formatted });
  } catch (e) {
    return jsonResponse({ success: false, reviews: [], error: e.message });
  }
}
