// functions/_shared.js - Utility functions condivise

export async function createSupabaseClient(env) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
  
  return {
    url: SUPABASE_URL,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    
    // Query helper
    async query(endpoint, options = {}) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1${endpoint}`, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        }
      });
      
      if (!response.ok) {
        throw new Error(`Supabase error: ${response.statusText}`);
      }
      
      return await response.json();
    },
    
    // Get user by Discord ID
    async getUserByDiscordId(discordId) {
      const users = await this.query(`/users?discord_id=eq.${discordId}`);
      return users[0] || null;
    },
    
    // Create or update user
    async upsertUser(userData) {
      return await this.query('/users', {
        method: 'POST',
        headers: {
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(userData)
      });
    },
    
    // Create session
    async createSession(userId, token, expiresAt) {
      return await this.query('/sessions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          token: token,
          expires_at: expiresAt
        })
      });
    },
    
    // Get session by token
    async getSessionByToken(token) {
      const sessions = await this.query(`/sessions?token=eq.${token}&expires_at=gte.${new Date().toISOString()}`);
      return sessions[0] || null;
    },
    
    // Delete session
    async deleteSession(token) {
      return await this.query(`/sessions?token=eq.${token}`, {
        method: 'DELETE'
      });
    },
    
    // Check if user is admin
    async isAdmin(userId) {
      const admins = await this.query(`/admin_users?user_id=eq.${userId}`);
      return admins.length > 0;
    }
  };
}

export function generateToken() {
  return crypto.randomUUID();
}

export function getCookie(request, name) {
  const cookies = request.headers.get('Cookie') || '';
  const match = cookies.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}

export function setCookie(name, value, maxAge = 7 * 24 * 60 * 60) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function deleteCookie(name) {
  return `${name}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function getAuthUser(request, env) {
  const token = getCookie(request, 'luxsave_session');
  if (!token) return null;
  
  const supabase = await createSupabaseClient(env);
  const session = await supabase.getSessionByToken(token);
  
  if (!session) return null;
  
  const user = await supabase.query(`/users?id=eq.${session.user_id}`);
  return user[0] || null;
}

export function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
  };
}

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
      ...headers
    }
  });
}
