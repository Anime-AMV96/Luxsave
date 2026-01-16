// functions/api/reviews/get.js
// Ottieni lista recensioni (pubbliche o tutte per admin)

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
  
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
      return jsonResponse({
        success: true,
        reviews: [],
        message: 'Supabase not configured'
      });
    }

    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Check URL params
    const url = new URL(request.url);
    const isAdminRequest = url.searchParams.get('admin') === 'true';
    
    // Build query URL - get all reviews or only approved
    let reviewsUrl = `${env.SUPABASE_URL}/rest/v1/reviews?select=*&order=created_at.desc`;
    
    // Se non è richiesta admin, mostra solo approvate
    if (!isAdminRequest) {
      reviewsUrl += '&approved=eq.true';
    }
    
    const reviewsResponse = await fetch(reviewsUrl, { headers: supabaseHeaders });
    
    if (!reviewsResponse.ok) {
      const errorText = await reviewsResponse.text();
      console.error('Fetch reviews error:', errorText);
      return jsonResponse({
        success: false,
        reviews: [],
        error: 'Errore caricamento recensioni'
      });
    }
    
    const reviews = await reviewsResponse.json();
    
    if (!Array.isArray(reviews)) {
      return jsonResponse({
        success: true,
        reviews: []
      });
    }
    
    // Get user info for each review
    const userIds = [...new Set(reviews.map(r => r.user_id).filter(Boolean))];
    let usersMap = {};
    
    if (userIds.length > 0) {
      const usersUrl = `${env.SUPABASE_URL}/rest/v1/users?id=in.(${userIds.join(',')})&select=id,username,avatar`;
      const usersResponse = await fetch(usersUrl, { headers: supabaseHeaders });
      
      if (usersResponse.ok) {
        const users = await usersResponse.json();
        if (Array.isArray(users)) {
          users.forEach(u => {
            usersMap[u.id] = u;
          });
        }
      }
    }
    
    // Format reviews with user info
    const formattedReviews = reviews.map(r => {
      const user = usersMap[r.user_id] || {};
      return {
        id: r.id,
        user_id: r.user_id,
        user_name: user.username || 'Utente',
        user_avatar: user.avatar || null,
        service: r.service,
        rating: r.rating,
        title: r.title,
        content: r.content,
        approved: r.approved,
        admin_reply: r.admin_reply,
        created_at: r.created_at
      };
    });
    
    return jsonResponse({
      success: true,
      reviews: formattedReviews
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    return jsonResponse({
      success: false,
      reviews: [],
      error: error.message
    });
  }
}
