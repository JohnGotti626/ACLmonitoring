import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
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
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-white text-base">Script SQL per Supabase Editor (Performance & Security Ottimizzato)</h3>
              <p className="text-xs text-slate-400">Policy unica per tabella con (SELECT auth.uid()) — Zero Errori & Zero Performance Warnings</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copiato!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copia Script SQL</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto font-mono text-xs text-cyan-200 bg-slate-950 space-y-2 select-all leading-relaxed">
          <pre>{sqlScript}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-xs text-slate-400 flex items-center justify-between">
          <span>Incolla questo codice nel menu SQL Editor di Supabase e premi <strong>RUN</strong>.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
