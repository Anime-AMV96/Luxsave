// functions/api/auth/callback.js
// Callback dopo autorizzazione Discord

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // Helper functions inline
  const getCookie = (request, name) => {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
    return match ? match[1] : null;
  };
  
  const generateToken = () => {
    return crypto.randomUUID() + '-' + Date.now().toString(36);
  };
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = getCookie(request, 'oauth_state');
  
  // Check if env vars are set
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET || !env.DISCORD_REDIRECT_URI) {
    return new Response('Discord OAuth not configured', { status: 500 });
  }
  
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return new Response('Supabase not configured', { status: 500 });
  }
  
  // Verifica CSRF
  if (!state || state !== savedState) {
    return new Response('Invalid state - please try again', { status: 400 });
  }
  
  if (!code) {
    return new Response('No code provided', { status: 400 });
  }
  
  try {
    // 1. Scambia code per access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: env.DISCORD_REDIRECT_URI
      })
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${errorData}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    // 2. Ottieni info utente da Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!userResponse.ok) {
      throw new Error('Failed to get user info');
    }
    
    const discordUser = await userResponse.json();
    
    // 3. Helper per Supabase
    const supabaseHeaders = {
      'apikey': env.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${env.SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    const avatarUrl = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
      : null;
    
    const userData = {
      discord_id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator || '0',
      avatar: avatarUrl,
      email: discordUser.email
    };
    
    // Cerca utente esistente
    const searchUrl = `${env.SUPABASE_URL}/rest/v1/users?discord_id=eq.${discordUser.id}`;
    const searchResponse = await fetch(searchUrl, {
      headers: supabaseHeaders
    });
    
    const existingUsers = await searchResponse.json();
    let userId;
    
    if (existingUsers && existingUsers.length > 0) {
      // Aggiorna utente esistente
      userId = existingUsers[0].id;
      await fetch(`${env.SUPABASE_URL}/rest/v1/users?id=eq.${userId}`, {
        method: 'PATCH',
        headers: supabaseHeaders,
        body: JSON.stringify(userData)
      });
    } else {
      // Crea nuovo utente
      const insertResponse = await fetch(`${env.SUPABASE_URL}/rest/v1/users`, {
        method: 'POST',
        headers: supabaseHeaders,
        body: JSON.stringify(userData)
      });
      const newUsers = await insertResponse.json();
      if (!newUsers || !newUsers[0]) {
        throw new Error('Failed to create user');
      }
      userId = newUsers[0].id;
    }
    
    // 4. Crea sessione
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 giorni
    
    await fetch(`${env.SUPABASE_URL}/rest/v1/sessions`, {
      method: 'POST',
      headers: supabaseHeaders,
      body: JSON.stringify({
        user_id: userId,
        token: sessionToken,
        expires_at: expiresAt.toISOString()
      })
    });
    
    // 5. Redirect alla home con cookie di sessione
    const headers = new Headers();
    headers.set('Location', '/');
    // SameSite=None è necessario per i redirect OAuth cross-site
    headers.append('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${7*24*60*60}`);
    headers.append('Set-Cookie', `oauth_state=; Path=/; Max-Age=0`);
    
    return new Response(null, {
      status: 302,
      headers: headers
    });
    
  } catch (error) {
    console.error('OAuth error:', error);
    return new Response(`Authentication failed: ${error.message}`, { status: 500 });
  }
}
