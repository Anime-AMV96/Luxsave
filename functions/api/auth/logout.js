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
  
  if (token) {
    try {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
      
      await supabase
        .from('sessions')
        .delete()
        .eq('session_token', token);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  const response = Response.redirect('/', 302);
  response.headers.set('Set-Cookie', 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  
  return response;
}
