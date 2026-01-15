// functions/api/auth/login.js
export async function onRequest(context) {
  const { env } = context;
  
  const clientId = env.DISCORD_CLIENT_ID;
  const redirectUri = env.DISCORD_REDIRECT_URI;
  
  // Check if environment variables are set
  if (!clientId || !redirectUri) {
    return new Response(JSON.stringify({
      error: 'Configuration error',
      message: 'Discord OAuth not configured. Please add DISCORD_CLIENT_ID and DISCORD_REDIRECT_URI to Cloudflare Pages environment variables.',
      instructions: [
        '1. Go to Cloudflare Dashboard > Workers & Pages',
        '2. Click on your project',
        '3. Go to Settings > Environment variables',
        '4. Add DISCORD_CLIENT_ID and DISCORD_REDIRECT_URI',
        '5. Retry deployment'
      ],
      missing: {
        DISCORD_CLIENT_ID: !clientId,
        DISCORD_REDIRECT_URI: !redirectUri
      }
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
  
  // State per CSRF protection
  const state = crypto.randomUUID();
  
  // URL di autorizzazione Discord
  const authUrl = new URL('https://discord.com/api/oauth2/authorize');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'identify email');
  authUrl.searchParams.set('state', state);
  
  // Redirect con cookie per state
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl.toString(),
      'Set-Cookie': `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=300`
    }
  });
}
