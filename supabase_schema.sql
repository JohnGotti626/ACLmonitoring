-- ====================================================================
-- SCRIPT SQL SUPABASE - RIPRISTINO ACCESSO COMPLETO STAFF / ADMIN
-- Eseguire questo script nel SQL Editor di Supabase per ripristinare
-- lettura, inserimento, modifica ed eliminazione su tutte le tabelle.
-- ====================================================================

-- 0. Rimuove eventuali policy restrittive precedenti
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

-- 1. Assicura che la politica su 'pazienti' permetta l'accesso completo (incluso accesso diretto dashboard)
CREATE POLICY "Admin_Full_Access_Pazienti"
ON public.pazienti
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 2. Ripristina l'accesso completo su 'workout_logs'
CREATE POLICY "Admin_Full_Access_Workout"
ON public.workout_logs
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 3. Ripristina l'accesso completo su 'evaluations', 'test_valutazioni', 'test_results', 'profili_utenti', 'audit_logs'
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='evaluations') THEN
        EXECUTE 'CREATE POLICY "Admin_Full_Access_Evaluations" ON public.evaluations FOR ALL TO public USING (true) WITH CHECK (true)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_valutazioni') THEN
        EXECUTE 'CREATE POLICY "Admin_Full_Access_Test_Valutazioni" ON public.test_valutazioni FOR ALL TO public USING (true) WITH CHECK (true)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='test_results') THEN
        EXECUTE 'CREATE POLICY "Admin_Full_Access_Test_Results" ON public.test_results FOR ALL TO public USING (true) WITH CHECK (true)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='profili_utenti') THEN
        EXECUTE 'CREATE POLICY "Admin_Full_Access_Profili_Utenti" ON public.profili_utenti FOR ALL TO public USING (true) WITH CHECK (true)';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
        EXECUTE 'CREATE POLICY "Admin_Full_Access_Audit_Logs" ON public.audit_logs FOR ALL TO public USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- 4. Creazione degli indici sulle foreign keys principali per velocizzare le query
CREATE INDEX IF NOT EXISTS idx_workout_logs_patient_id ON public.workout_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_valutazioni_patient_id ON public.test_valutazioni(patient_id);
CREATE INDEX IF NOT EXISTS idx_test_results_patient_id ON public.test_results(patient_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_patient_id ON public.evaluations(patient_id);
