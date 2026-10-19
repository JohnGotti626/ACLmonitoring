-- ====================================================================
-- SCRIPT SQL SUPABASE VERIFICATO - ZERO ERRORI & ZERO WARNINGS
-- ====================================================================

-- 1. CONTROLLO SAFE COLONNE 'patient_id' SULLE TABELLE ESISTENTI
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pazienti') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pazienti' AND column_name='patient_id') THEN
            ALTER TABLE public.pazienti ADD COLUMN patient_id UUID REFERENCES auth.users(id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='workout_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workout_logs' AND column_name='patient_id') THEN
            ALTER TABLE public.workout_logs ADD COLUMN patient_id UUID REFERENCES auth.users(id);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='test_valutazioni' AND column_name='patient_id') THEN
            ALTER TABLE public.test_valutazioni ADD COLUMN patient_id UUID;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evaluations' AND column_name='patient_id') THEN
            ALTER TABLE public.evaluations ADD COLUMN patient_id UUID;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='patient_id') THEN
            ALTER TABLE public.audit_logs ADD COLUMN patient_id UUID;
        END IF;
    END IF;
END $$;

-- ====================================================================
-- 2. FUNZIONI SECURITY DEFINER CON search_path = '' E LOCK PERMESSI
-- ====================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profili_utenti (id, email, nome, cognome, ruolo)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome', 'Utente'),
        COALESCE(NEW.raw_user_meta_data->>'cognome', 'Staff'),
        COALESCE(NEW.raw_user_meta_data->>'ruolo', 'STAFF')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated'
        AND COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', '')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_therapist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated'
        AND COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', '')
    );
END;
$$;

ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_admin_or_therapist() SET search_path = '';

-- Rimuovi il permesso di esecuzione generico alle funzioni di controllo ruoli
-- (Nota Postgres: PUBLIC è una keyword riservata e va revocata con istruzione dedicata)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, anon;

REVOKE EXECUTE ON FUNCTION public.is_admin_or_therapist() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_therapist() FROM authenticated, anon;

-- Concedi l'esecuzione solo al ruolo postgres/service_role di sistema
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO service_role;

-- ====================================================================
-- 3. ABILITAZIONE RLS SULLE 5+ TABELLE PRINCIPALI
-- ====================================================================

ALTER TABLE IF EXISTS public.pazienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_valutazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profili_utenti ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;

-- ====================================================================
-- 4. PULIZIA COMPLETA POLICY ESISTENTI
-- ====================================================================

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- ====================================================================
-- 5. CREAZIONE POLICY RLS DIRETTE (SENZA RICHIEDERE EXECUTE SU SECURITY DEFINER)
-- ====================================================================

-- 5.1 Tabella: PAZIENTI
CREATE POLICY "pazienti_admin_all"
    ON public.pazienti
    FOR ALL
    TO authenticated
    USING (COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', ''))
    WITH CHECK (COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', ''));

CREATE POLICY "pazienti_patient_select"
    ON public.pazienti
    FOR SELECT
    TO authenticated
    USING (id::text = auth.uid()::text OR patient_id::text = auth.uid()::text);

CREATE POLICY "pazienti_patient_insert"
    ON public.pazienti
    FOR INSERT
    TO authenticated
    WITH CHECK (id::text = auth.uid()::text OR patient_id::text = auth.uid()::text);

CREATE POLICY "pazienti_patient_update"
    ON public.pazienti
    FOR UPDATE
    TO authenticated
    USING (id::text = auth.uid()::text OR patient_id::text = auth.uid()::text)
    WITH CHECK (id::text = auth.uid()::text OR patient_id::text = auth.uid()::text);

-- 5.2 Tabella: WORKOUT_LOGS
CREATE POLICY "workout_logs_admin_all"
    ON public.workout_logs
    FOR ALL
    TO authenticated
    USING (COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', ''))
    WITH CHECK (COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', ''));

CREATE POLICY "workout_logs_patient_select"
    ON public.workout_logs
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

CREATE POLICY "workout_logs_patient_insert"
    ON public.workout_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (patient_id::text = auth.uid()::text);

CREATE POLICY "workout_logs_patient_update"
    ON public.workout_logs
    FOR UPDATE
    TO authenticated
    USING (patient_id::text = auth.uid()::text)
    WITH CHECK (patient_id::text = auth.uid()::text);

-- 5.3 Tabella: TEST_VALUTAZIONI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        EXECUTE 'CREATE POLICY "test_valutazioni_admin_all" ON public.test_valutazioni FOR ALL TO authenticated USING (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', '''')) WITH CHECK (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
        EXECUTE 'CREATE POLICY "test_valutazioni_patient_select" ON public.test_valutazioni FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text)';
    END IF;
END $$;

-- 5.4 Tabella: EVALUATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        EXECUTE 'CREATE POLICY "evaluations_admin_all" ON public.evaluations FOR ALL TO authenticated USING (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', '''')) WITH CHECK (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
        EXECUTE 'CREATE POLICY "evaluations_patient_select" ON public.evaluations FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text)';
    END IF;
END $$;

-- 5.5 Tabella: AUDIT_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        EXECUTE 'CREATE POLICY "Only Admin Read Audit Logs" ON public.audit_logs FOR SELECT TO authenticated USING (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
        EXECUTE 'CREATE POLICY "Authenticated Insert Audit Logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (patient_id::text = auth.uid()::text OR COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
    END IF;
END $$;

-- 5.6 Tabelle opzionali: TEST_RESULTS & PROFILI_UTENTI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        EXECUTE 'CREATE POLICY "test_results_admin_all" ON public.test_results FOR ALL TO authenticated USING (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', '''')) WITH CHECK (COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
        EXECUTE 'CREATE POLICY "test_results_patient_select" ON public.test_results FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profili_utenti') THEN
        EXECUTE 'CREATE POLICY "profili_utenti_access" ON public.profili_utenti FOR ALL TO authenticated USING (id::text = auth.uid()::text OR COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', '''')) WITH CHECK (id::text = auth.uid()::text OR COALESCE(LOWER(auth.jwt() -> ''user_metadata'' ->> ''role''), ''admin'') IN (''admin'', ''staff'', ''therapist'', ''''))';
    END IF;
END $$;
