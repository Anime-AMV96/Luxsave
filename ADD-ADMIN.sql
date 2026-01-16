-- LUXSAVE - Aggiungi Admin
-- Esegui questo script nel SQL Editor di Supabase

-- Prima trova il tuo user_id dalla tabella users
-- Esegui questa query per vedere tutti gli utenti:
SELECT id, discord_id, username, avatar FROM users;

-- Poi inserisci il tuo user_id qui sotto (sostituisci YOUR_USER_ID_HERE con l'id trovato sopra)
-- Esempio: se il tuo id è '123e4567-e89b-12d3-a456-426614174000'

-- INSERT INTO admin_users (user_id, role) VALUES ('YOUR_USER_ID_HERE', 'superadmin');

-- OPPURE, se conosci il tuo Discord ID, usa questa query automatica:
-- Sostituisci 'TUO_DISCORD_ID' con il tuo Discord ID numerico (es: '123456789012345678')

INSERT INTO admin_users (user_id, role)
SELECT id, 'superadmin' FROM users WHERE discord_id = 'TUO_DISCORD_ID'
ON CONFLICT (user_id) DO NOTHING;

-- Verifica che sei stato aggiunto:
SELECT au.*, u.username, u.discord_id 
FROM admin_users au 
JOIN users u ON au.user_id = u.id;
