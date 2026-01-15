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
  
  // CORS preflight
  if (request.method === 'OPTIONS') {
    return jsonResponse({}, 200);
  }
  
  try {
    // Check if Supabase is configured
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
    
    // Get user auth
    const cookieHeader = request.headers.get('Cookie') || '';
    const sessionMatch = cookieHeader.match(/session=([^;]+)/);
    let isAdmin = false;
    
    if (sessionMatch && isAdminRequest) {
      const sessionToken = sessionMatch[1];
      
      // Check session
      const sessionUrl = `${env.SUPABASE_URL}/rest/v1/sessions?session_token=eq.${sessionToken}&expires_at=gt.${new Date().toISOString()}&select=user_id`;
      const sessionResponse = await fetch(sessionUrl, { headers: supabaseHeaders });
      const sessions = await sessionResponse.json();
      
      if (sessions && sessions.length > 0) {
        // Check if admin
        const adminUrl = `${env.SUPABASE_URL}/rest/v1/admin_users?user_id=eq.${sessions[0].user_id}`;
        const adminResponse = await fetch(adminUrl, { headers: supabaseHeaders });
        const admins = await adminResponse.json();
        isAdmin = admins && admins.length > 0;
      }
    }
    
    // Build query URL
    let reviewsUrl = `${env.SUPABASE_URL}/rest/v1/reviews?select=*&order=created_at.desc`;
    
    // Se non admin, solo recensioni approvate
    if (!isAdmin && !isAdminRequest) {
      reviewsUrl += '&approved=eq.true';
    }
    
    const reviewsResponse = await fetch(reviewsUrl, { headers: supabaseHeaders });
    const reviews = await reviewsResponse.json();
    
    // Format reviews with user info
    const formattedReviews = Array.isArray(reviews) ? reviews.map(r => ({
      id: r.id,
      user_id: r.user_id,
      user_name: r.user_name || 'Utente',
      user_avatar: r.user_avatar,
      service: r.service,
      rating: r.rating,
      title: r.title,
      content: r.content,
      approved: r.approved,
      admin_reply: r.admin_reply,
      created_at: r.created_at
    })) : [];
    
    return jsonResponse({
      success: true,
      reviews: formattedReviews,
      isAdmin: isAdmin
    });
    
  } catch (error) {
    console.error('Get reviews error:', error);
    return jsonResponse({
      success: true,
      reviews: [],
      error: error.message
    });
  }
}
