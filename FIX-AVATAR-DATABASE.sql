-- LUXSAVE - Fix Avatar Data
-- Esegui questo su Supabase SQL Editor DOPO aver fatto logout e login

-- Il problema: callback.js salvava l'URL completo invece dell'hash
-- Questo fix estrae l'hash dall'URL

-- Prima vediamo cosa c'è
SELECT id, username, avatar FROM users;

-- Fix: se avatar contiene "https://", estrai solo l'hash
UPDATE users 
SET avatar = CASE 
    WHEN avatar LIKE 'https://cdn.discordapp.com/avatars/%' THEN
        -- Prende la parte dopo l'ultimo / e prima di .png
        REPLACE(
            SUBSTRING(avatar FROM '/([^/]+)\.png$'),
            '.png', ''
        )
    WHEN avatar LIKE 'https://%' THEN
        NULL
    ELSE 
        avatar
END;

-- Verifica
SELECT id, username, avatar FROM users;
