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
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({ success: true, reviews: [] });
    }

    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get('admin') === 'true';
    
    let reviewsUrl = `${env.SUPABASE_URL}/rest/v1/reviews?select=*&order=created_at.desc`;
    
    if (!isAdminRequest) {
      reviewsUrl += '&approved=eq.true';
    }
    
    const reviewsResponse = await fetch(reviewsUrl, { headers: supabaseHeaders });
    
    if (!reviewsResponse.ok) {
      return jsonResponse({ success: false, reviews: [], error: 'Errore caricamento recensioni' });
    }
    
    const reviews = await reviewsResponse.json();
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
      return jsonResponse({ success: true, reviews: [] });
    }
    
    // Get user info
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    let usersMap = {};
    
    if (userIds.length > 0) {
      try {
        const formattedIds = userIds.map(id => `"${id}"`).join(',');
        const usersUrl = `${env.SUPABASE_URL}/rest/v1/users?id=in.(${formattedIds})&select=id,username,avatar,discord_id`;
        const usersResponse = await fetch(usersUrl, { headers: supabaseHeaders });
        
        if (usersResponse.ok) {
          const users = await usersResponse.json();
          if (Array.isArray(users)) {
            users.forEach(u => { usersMap[u.id] = u; });
          }
        }
      } catch (e) {
        console.error('Users fetch error:', e);
      }
    }
    
    // Format reviews
    const formattedReviews = reviews.map(r => {
      const user = usersMap[r.user_id] || {};
      
      return {
        id: r.id,
        user_id: r.user_id,
        users: {
          username: user.username || 'Utente Anonimo',
          avatar: user.avatar || null,
          discord_id: user.discord_id || null
        },
        user_name: user.username || 'Utente Anonimo',
        service: r.service,
        rating: r.rating,
        title: r.title,
        content: r.content,
        approved: r.approved,
        admin_reply: r.admin_reply,
        created_at: r.created_at
      };
    });
    
    return jsonResponse({ success: true, reviews: formattedReviews });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    return jsonResponse({ success: false, reviews: [], error: error.message });
  }
}
