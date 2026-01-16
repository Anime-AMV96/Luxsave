-- LUXSAVE - FIX POLICIES
-- Esegui TUTTO questo codice su Supabase SQL Editor per risolvere i problemi delle recensioni

-- Rimuovi TUTTE le policies esistenti per reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can update reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can delete reviews" ON reviews;
DROP POLICY IF EXISTS "Logged users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Enable read access for all users" ON reviews;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reviews;
DROP POLICY IF EXISTS "Enable update for users based on email" ON reviews;

-- Ricrea le policies CORRETTE per reviews
CREATE POLICY "reviews_select_policy" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "reviews_insert_policy" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "reviews_update_policy" ON reviews
    FOR UPDATE USING (true);
    
CREATE POLICY "reviews_delete_policy" ON reviews
    FOR DELETE USING (true);

-- Verifica che RLS sia abilitato
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Mostra le policies attive (per debug)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reviews';
