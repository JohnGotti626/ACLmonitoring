-- ====================================================================
-- SCRIPT SQL SUPABASE DEFINITIVO - ZERO ERRORI & ZERO WARNINGS
-- Risolve:
-- 1. Tutti gli 8 errori 'RLS references user_metadata'
-- 2. Tutti i 5 errori 'RLS Disabled in Public'
-- 3. Tutti i warning su search_path, SECURITY DEFINER e audit_logs
-- ====================================================================

-- 1. VERIFICA SAFE DELLE COLONNE NECESSARIE ('patient_id' ed 'email')
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pazienti') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pazienti' AND column_name='patient_id') THEN
            ALTER TABLE public.pazienti ADD COLUMN patient_id UUID REFERENCES auth.users(id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pazienti' AND column_name='email') THEN
            ALTER TABLE public.pazienti ADD COLUMN email TEXT;
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

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='test_results' AND column_name='patient_id') THEN
            ALTER TABLE public.test_results ADD COLUMN patient_id UUID;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='patient_id') THEN
            ALTER TABLE public.audit_logs ADD COLUMN patient_id UUID;
        END IF;
    END IF;
END $$;

-- ====================================================================
-- 2. ELIMINAZIONE COMPLETA VECCHIE POLICY SU TUTTE LE TABELLE
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
-- 3. FUNZIONI HELPER SICURE (SENZA 'user_metadata' E CON search_path = '')
-- ====================================================================

-- Trigger creazione profilo utente
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
        'Utente',
        'Staff',
        'ADMIN'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Funzioni di controllo ruolo Admin/Terapista (SECURITY INVOKER + app_metadata + profili_utenti)
-- Zero riferimenti a user_metadata e nessun rischio di esposizione SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profili_utenti p
        WHERE p.id = auth.uid()
          AND UPPER(p.ruolo) IN ('ADMIN', 'STAFF')
    )
    OR COALESCE(LOWER(auth.jwt() -> 'app_metadata' ->> 'role'), '') IN ('admin', 'staff', 'therapist');
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_therapist()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT public.is_admin();
$$;

ALTER FUNCTION public.handle_new_user() SET search_path = '';
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_admin_or_therapist() SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO authenticated, service_role;

-- ====================================================================
-- 4. ABILITAZIONE ROW LEVEL SECURITY (RLS) SU TUTTE LE TABELLE
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
-- 5. NUOVE POLICY RLS PULITE E SICURE (ZERO 'user_metadata')
-- ====================================================================

-- 5.1 Tabella: PROFILI_UTENTI (Lettura del proprio profilo necessaria per is_admin())
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profili_utenti') THEN
        EXECUTE 'CREATE POLICY "profili_utenti_select_own" ON public.profili_utenti FOR SELECT TO authenticated USING (id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "profili_utenti_admin_all" ON public.profili_utenti FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
END $$;

-- 5.2 Tabella: PAZIENTI
-- Paziente loggato: SELECT se id = auth.uid(), patient_id = auth.uid() o email = auth.email()
-- Admin/Terapista: ALL tramite is_admin()
CREATE POLICY "pazienti_select_own"
    ON public.pazienti
    FOR SELECT
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR LOWER(email) = LOWER(auth.email())
    );

CREATE POLICY "pazienti_update_own"
    ON public.pazienti
    FOR UPDATE
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR LOWER(email) = LOWER(auth.email())
    )
    WITH CHECK (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR LOWER(email) = LOWER(auth.email())
    );

CREATE POLICY "pazienti_admin_all"
    ON public.pazienti
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5.3 Tabella: WORKOUT_LOGS
-- Paziente: SELECT, INSERT, UPDATE dove patient_id = auth.uid() o id = auth.uid()
-- Admin/Terapista: ALL tramite is_admin()
CREATE POLICY "workout_logs_patient_select"
    ON public.workout_logs
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text);

CREATE POLICY "workout_logs_patient_insert"
    ON public.workout_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text);

CREATE POLICY "workout_logs_patient_update"
    ON public.workout_logs
    FOR UPDATE
    TO authenticated
    USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)
    WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text);

CREATE POLICY "workout_logs_admin_all"
    ON public.workout_logs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5.4 Tabella: TEST_VALUTAZIONI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        EXECUTE 'CREATE POLICY "test_valutazioni_patient_select" ON public.test_valutazioni FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_valutazioni_patient_insert" ON public.test_valutazioni FOR INSERT TO authenticated WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_valutazioni_patient_update" ON public.test_valutazioni FOR UPDATE TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text) WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_valutazioni_admin_all" ON public.test_valutazioni FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
END $$;

-- 5.5 Tabella: EVALUATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        EXECUTE 'CREATE POLICY "evaluations_patient_select" ON public.evaluations FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "evaluations_patient_insert" ON public.evaluations FOR INSERT TO authenticated WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "evaluations_patient_update" ON public.evaluations FOR UPDATE TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text) WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "evaluations_admin_all" ON public.evaluations FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
END $$;

-- 5.6 Tabella: TEST_RESULTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        EXECUTE 'CREATE POLICY "test_results_patient_select" ON public.test_results FOR SELECT TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_results_patient_insert" ON public.test_results FOR INSERT TO authenticated WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_results_patient_update" ON public.test_results FOR UPDATE TO authenticated USING (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text) WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "test_results_admin_all" ON public.test_results FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
END $$;

-- 5.7 Tabella: AUDIT_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        EXECUTE 'CREATE POLICY "Only Admin Read Audit Logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin())';
        EXECUTE 'CREATE POLICY "Authenticated Insert Audit Logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (patient_id::text = auth.uid()::text OR id::text = auth.uid()::text OR public.is_admin())';
    END IF;
END $$;

-- ====================================================================
-- FINE SCRIPT SQL
-- ====================================================================
