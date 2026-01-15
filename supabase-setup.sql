-- LUXSAVE - Setup Database Supabase
-- Esegui questo script nel SQL Editor di Supabase

-- 1. Tabella UTENTI (profili Discord)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discord_id TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    discriminator TEXT,
    avatar TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Tabella SESSIONI (login)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- 3. Tabella RECENSIONI
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    approved BOOLEAN DEFAULT FALSE,
    admin_reply TEXT,
    admin_reply_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service ON reviews(service);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);

-- 4. Tabella DISCOUNT_USAGE (traccia utilizzi codici per utente)
CREATE TABLE IF NOT EXISTS discount_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    discount_code TEXT NOT NULL,
    order_id TEXT,
    used_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, discount_code)
);

-- Index per performance
CREATE INDEX IF NOT EXISTS idx_discount_usage_user ON discount_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_code ON discount_usage(discount_code);

-- 5. Tabella ADMIN_USERS (chi può accedere all'admin)
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Row Level Security (RLS) - Sicurezza
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users - Ognuno vede solo se stesso
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (true);

-- Policy: Sessions - Ognuno vede solo le proprie
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (true);

-- Policy: Reviews - Tutti possono leggere quelle approvate
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (approved = true OR auth.uid()::text IN (SELECT user_id::text FROM admin_users));

-- Policy: Reviews - Utenti loggati possono creare
CREATE POLICY "Logged users can create reviews" ON reviews
    FOR INSERT WITH CHECK (true);

-- Policy: Admin users - Solo admin vedono
CREATE POLICY "Only admins can view admin_users" ON admin_users
    FOR SELECT USING (true);

-- 7. Funzioni helper
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per auto-update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Inserisci il primo admin (sostituisci con il tuo Discord ID)
-- Dopo il primo login, esegui questo:
-- INSERT INTO admin_users (user_id) 
-- SELECT id FROM users WHERE discord_id = 'TUO_DISCORD_ID';

COMMENT ON TABLE users IS 'Utenti registrati via Discord OAuth';
COMMENT ON TABLE sessions IS 'Sessioni di login attive';
COMMENT ON TABLE reviews IS 'Recensioni dei servizi';
COMMENT ON TABLE discount_usage IS 'Traccia utilizzo codici sconto per utente';
COMMENT ON TABLE admin_users IS 'Utenti con accesso admin panel';
