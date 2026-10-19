-- ====================================================================
-- SCRIPT SQL SUPABASE DEFINITIVO - ISOLAMENTO MAGIC LINK CLIENTI
-- Chiunque acceda tramite Magic Link (auth.uid() IS NOT NULL) è SEMPRE
-- trattato come Cliente (vede/modifica solo i propri dati).
-- Il Terapista nel gestionale mantiene pieno accesso senza USING (true).
-- ====================================================================

-- 1. CANCELLA TUTTE LE POLICY PRECEDENTI
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

-- 2. Rimuove il trigger che assegnava ADMIN ai nuovi utenti Magic Link
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. FUNZIONE HELPER:
--    - Magic Link (auth.uid() IS NOT NULL) -> Cliente (is_admin = FALSE, salvo app_metadata = 'admin')
--    - Gestionale Terapista (auth.uid() IS NULL o app_metadata = 'admin'/'therapist') -> Terapista (is_admin = TRUE)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
    SELECT (
        (SELECT auth.uid()) IS NULL
        OR COALESCE(LOWER((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') IN ('admin', 'therapist', 'staff')
    );
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

ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.is_admin_or_therapist() SET search_path = '';

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO anon, authenticated, service_role;

-- ====================================================================
-- 4. POLICY RLS STRUTTURATE (MAGIC LINK = SOLO DATI PROPRI | TERAPISTA = TUTTI)
-- ====================================================================

-- 4.1 Tabella: PAZIENTI
CREATE POLICY "pazienti_staff_and_patient_access"
    ON public.pazienti
    FOR ALL
    TO anon, authenticated
    USING (
        id::text = (SELECT auth.uid())::text
        OR patient_id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    )
    WITH CHECK (
        id::text = (SELECT auth.uid())::text
        OR patient_id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    );

-- 4.2 Tabella: WORKOUT_LOGS
CREATE POLICY "workout_logs_staff_and_patient_access"
    ON public.workout_logs
    FOR ALL
    TO anon, authenticated
    USING (
        patient_id::text = (SELECT auth.uid())::text
        OR id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    )
    WITH CHECK (
        patient_id::text = (SELECT auth.uid())::text
        OR id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    );

-- 4.3 Tabella: TEST_VALUTAZIONI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        EXECUTE '
            CREATE POLICY "test_valutazioni_staff_and_patient_access"
                ON public.test_valutazioni
                FOR ALL
                TO anon, authenticated
                USING (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                )
                WITH CHECK (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                );
        ';
    END IF;
END $$;

-- 4.4 Tabella: EVALUATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        EXECUTE '
            CREATE POLICY "evaluations_staff_and_patient_access"
                ON public.evaluations
                FOR ALL
                TO anon, authenticated
                USING (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                )
                WITH CHECK (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                );
        ';
    END IF;
END $$;

-- 4.5 Tabella: TEST_RESULTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        EXECUTE '
            CREATE POLICY "test_results_staff_and_patient_access"
                ON public.test_results
                FOR ALL
                TO anon, authenticated
                USING (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                )
                WITH CHECK (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                );
        ';
    END IF;
END $$;

-- 4.6 Tabella: PROFILI_UTENTI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profili_utenti') THEN
        EXECUTE '
            CREATE POLICY "profili_utenti_staff_and_user_access"
                ON public.profili_utenti
                FOR ALL
                TO anon, authenticated
                USING (
                    id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                )
                WITH CHECK (
                    id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                );
        ';
    END IF;
END $$;

-- 4.7 Tabella: AUDIT_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        EXECUTE '
            CREATE POLICY "audit_logs_staff_and_patient_access"
                ON public.audit_logs
                FOR ALL
                TO anon, authenticated
                USING (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                )
                WITH CHECK (
                    patient_id::text = (SELECT auth.uid())::text
                    OR id::text = (SELECT auth.uid())::text
                    OR (SELECT public.is_admin_or_therapist())
                );
        ';
    END IF;
END $$;
