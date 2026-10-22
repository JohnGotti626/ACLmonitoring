-- ====================================================================
-- SCRIPT SQL SUPABASE DEFINITIVO - STAFF_USERS, RLS & SESSIONI TEST LCA
-- ====================================================================

-- 1. Assicurati che la tabella staff_users esista e abbia RLS abilitata
CREATE TABLE IF NOT EXISTS public.staff_users (
    email TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- 2. Inserisci le email dei terapisti autorizzati
INSERT INTO public.staff_users (email) VALUES
    ('ceresoli.andrea@gmail.com'),
    ('andreagotti96@outlook.it'),
    ('benemapelli@gmail.com'),
    ('nicolanasatti@gmail.com'),
    ('nasattialice@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 3. Aggiorna la funzione di controllo RLS (supporta sia email staff_users sia accesso diretto gestionale)
CREATE OR REPLACE FUNCTION public.is_admin_or_therapist()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        (SELECT auth.uid()) IS NULL
        OR EXISTS (
            SELECT 1 FROM public.staff_users 
            WHERE LOWER(email) = LOWER((SELECT auth.email()))
        )
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN public.is_admin_or_therapist();
END;
$$;

ALTER FUNCTION public.is_admin_or_therapist() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.is_admin_or_therapist() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- 4. Policy RLS sulla tabella staff_users (evita 'RLS Enabled No Policy')
DROP POLICY IF EXISTS "staff_users_access_policy" ON public.staff_users;
CREATE POLICY "staff_users_access_policy"
    ON public.staff_users
    FOR SELECT
    TO anon, authenticated
    USING (
        LOWER(email) = LOWER((SELECT auth.email()))
        OR (SELECT public.is_admin_or_therapist())
    );

-- 5. Aggiornamento Schema Evaluations / Test Clinici per Inserimento Modulare e Sessioni Report
--    Tutti i campi numerici accettano NULL come default (MAI 0 quando non testati)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluations') THEN
        ALTER TABLE public.evaluations
            ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS test_module TEXT DEFAULT 'ALL',
            ADD COLUMN IF NOT EXISTS module_dates JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_valutazioni') THEN
        ALTER TABLE public.test_valutazioni
            ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS test_module TEXT DEFAULT 'ALL',
            ADD COLUMN IF NOT EXISTS module_dates JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;
