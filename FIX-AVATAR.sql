-- LUXSAVE - Fix Avatar Data
-- Esegui questo script nel SQL Editor di Supabase
-- Questo fix estrae l'hash dell'avatar dall'URL completo

-- Prima vediamo cosa c'è nella tabella
SELECT id, discord_id, username, avatar FROM users;

-- Fix: estrai solo l'hash dall'URL (se è un URL)
-- L'avatar Discord può essere: 
-- - null (nessun avatar)
-- - "a_1234567890abcdef" (hash animato)
-- - "1234567890abcdef" (hash statico)
-- - "https://cdn.discordapp.com/avatars/123/abc.png" (URL - da fixare!)

UPDATE users 
SET avatar = CASE 
    WHEN avatar LIKE 'https://cdn.discordapp.com/avatars/%' THEN
        -- Estrai l'hash dall'URL: prende la parte dopo l'ultimo "/" e prima di ".png"
        REPLACE(SUBSTRING(avatar FROM '[^/]+\.png$'), '.png', '')
    ELSE 
        avatar
END
WHERE avatar LIKE 'https://%';

-- Verifica il risultato
SELECT id, discord_id, username, avatar FROM users;
