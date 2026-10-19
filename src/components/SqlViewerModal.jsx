import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
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
              <h3 className="font-extrabold text-white text-base">Script SQL per Supabase Editor (Accesso Completo Staff/Admin)</h3>
              <p className="text-xs text-slate-400">Ripristino lettura e scrittura su pazienti, workout_logs, evaluations e test</p>
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
