// functions/api/auth/login.js
// Inizia il flow di login con Discord

export async function onRequest(context) {
  const { env } = context;
  
  const clientId = env.DISCORD_CLIENT_ID;
  const redirectUri = env.DISCORD_REDIRECT_URI;
  
  // State per CSRF protection
  const state = crypto.randomUUID();
  
  // URL di autorizzazione Discord
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify email');
  authUrl.searchParams.set('state', state);
  
  // Salva state in cookie per verificarlo dopo
  const response = Response.redirect(authUrl.toString(), 302);
  response.headers.set('Set-Cookie', `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`);
  
  return response;
}
