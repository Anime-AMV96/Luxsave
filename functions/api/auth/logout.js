// functions/api/auth/logout.js
// Logout - elimina sessione

export async function onRequest(context) {
  const { request, env } = context;
  
  const getCookie = (request, name) => {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
  };
  
  const token = getCookie(request, 'session');
  
  if (token && env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      const supabaseHeaders = {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      };
      
      await fetch(`${env.SUPABASE_URL}/rest/v1/sessions?token=eq.${token}`, {
        method: 'DELETE',
        headers: supabaseHeaders
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0'
    }
  });
}
