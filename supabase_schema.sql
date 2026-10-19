-- ====================================================================
-- SCRIPT SQL SUPABASE CONSOLIDATO - ZERO ERRORI & ZERO WARNINGS
-- Risolve i 31 Warning del Performance Advisor:
-- 1. 'Multiple Permissive Policies' -> Un'unica policy unificata per tabella
-- 2. 'Auth RLS Initialization Plan' -> Uso di (SELECT auth.uid()) per InitPlan
-- ====================================================================

-- 1. RIMOZIONE TOTALE DI TUTTE LE VECCHIE POLICY SU TUTTE LE TABELLE
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
-- 2. OTTIMIZZAZIONE FUNZIONI HELPER CON (SELECT auth.uid()) E (SELECT auth.jwt())
-- ====================================================================

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
        WHERE p.id = (SELECT auth.uid())
          AND UPPER(p.ruolo) IN ('ADMIN', 'STAFF')
    )
    OR COALESCE(LOWER((SELECT auth.jwt()) -> 'app_metadata' ->> 'role'), '') IN ('admin', 'staff', 'therapist');
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

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO authenticated, service_role;

-- ====================================================================
-- 3. CREAZIONE DI UN'UNICA POLICY EFFICIENTE PER TABELLA
--    Usa (SELECT auth.uid()) e (SELECT public.is_admin_or_therapist())
-- ====================================================================

-- 3.1 Tabella: WORKOUT_LOGS
CREATE POLICY "workout_logs_access_policy"
    ON public.workout_logs
    FOR ALL
    TO authenticated
    USING (
        patient_id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    )
    WITH CHECK (
        patient_id::text = (SELECT auth.uid())::text
        OR (SELECT public.is_admin_or_therapist())
    );

-- 3.2 Tabella: PAZIENTI
CREATE POLICY "pazienti_access_policy"
    ON public.pazienti
    FOR ALL
    TO authenticated
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

-- 3.3 Tabella: TEST_VALUTAZIONI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        EXECUTE '
            CREATE POLICY "test_valutazioni_access_policy"
                ON public.test_valutazioni
                FOR ALL
                TO authenticated
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

-- 3.4 Tabella: EVALUATIONS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        EXECUTE '
            CREATE POLICY "evaluations_access_policy"
                ON public.evaluations
                FOR ALL
                TO authenticated
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

-- 3.5 Tabella: TEST_RESULTS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        EXECUTE '
            CREATE POLICY "test_results_access_policy"
                ON public.test_results
                FOR ALL
                TO authenticated
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

-- 3.6 Tabella: PROFILI_UTENTI
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profili_utenti') THEN
        EXECUTE '
            CREATE POLICY "profili_utenti_access_policy"
                ON public.profili_utenti
                FOR ALL
                TO authenticated
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

-- 3.7 Tabella: AUDIT_LOGS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        EXECUTE '
            CREATE POLICY "audit_logs_access_policy"
                ON public.audit_logs
                FOR ALL
                TO authenticated
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

-- ====================================================================
-- FINE SCRIPT SQL
-- ====================================================================
