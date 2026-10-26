import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
-- SCRIPT SQL SUPABASE DEFINITIVO
-- 1. STAFF_USERS & RLS
-- 2. METRICHE DINAMICHE PERSONALIZZATE (custom_metric_definitions & patient_custom_metrics)
-- 3. SESSIONI REPORT & DIRETTIVE PAZIENTE
-- ====================================================================

-- 1. Tabella staff_users e abilitazione RLS
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

-- 3. Funzione di controllo RLS per lo staff autorizzato
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

DROP POLICY IF EXISTS "staff_users_access_policy" ON public.staff_users;
CREATE POLICY "staff_users_access_policy"
    ON public.staff_users
    FOR SELECT
    TO anon, authenticated
    USING (
        LOWER(email) = LOWER((SELECT auth.email()))
        OR (SELECT public.is_admin_or_therapist())
    );

-- ====================================================================
-- 4. SISTEMA DI METRICHE DINAMICHE E PERSONALIZZATE PER TEST CLINICI
-- ====================================================================

-- 4.1 Tabella per i suggerimenti globali delle metriche per tipo di test
CREATE TABLE IF NOT EXISTS public.custom_metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_type TEXT NOT NULL, -- es. 'CMJ_BILATERALE', 'ISO_PUSH_LEG_EXT'
    metric_name TEXT NOT NULL, -- es. 'Angolo Flessione Ginocchio'
    unit TEXT, -- es. 'gradi', 'N/m', 'cm', '%'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(test_type, metric_name)
);

-- 4.2 Tabella per i valori misurati sui singoli pazienti
CREATE TABLE IF NOT EXISTS public.patient_custom_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.pazienti(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE,
    session_key TEXT DEFAULT NULL,
    test_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    unit TEXT DEFAULT NULL,
    metric_value NUMERIC,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_metric_defs_test_type
    ON public.custom_metric_definitions(test_type);

CREATE INDEX IF NOT EXISTS idx_patient_custom_metrics_patient_test
    ON public.patient_custom_metrics(patient_id, test_type);

-- 4.3 Abilita RLS e consenti lettura/scrittura allo staff autorizzato
ALTER TABLE public.custom_metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_custom_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_custom_metric_definitions_all" ON public.custom_metric_definitions;
CREATE POLICY "staff_custom_metric_definitions_all"
    ON public.custom_metric_definitions
    FOR ALL
    TO anon, authenticated
    USING ((SELECT public.is_admin_or_therapist()))
    WITH CHECK ((SELECT public.is_admin_or_therapist()));

DROP POLICY IF EXISTS "staff_patient_custom_metrics_all" ON public.patient_custom_metrics;
CREATE POLICY "staff_patient_custom_metrics_all"
    ON public.patient_custom_metrics
    FOR ALL
    TO anon, authenticated
    USING ((SELECT public.is_admin_or_therapist()))
    WITH CHECK ((SELECT public.is_admin_or_therapist()));

-- Seed iniziale suggerimenti metriche cliniche personalizzate comuni
INSERT INTO public.custom_metric_definitions (test_type, metric_name, unit) VALUES
    ('ISO_PUSH_LEG_EXT', 'Angolo Flessione Ginocchio', 'gradi'),
    ('ISO_PUSH_LEG_EXT', 'RFD 0-100ms Quadricipite SX', 'N/s'),
    ('ISO_PUSH_LEG_EXT', 'RFD 0-100ms Quadricipite DX', 'N/s'),
    ('ISO_PUSH_LEG_EXT', 'VAS Dolore Rotuleo durante spinta', '/10'),
    ('ISO_PUSH_LEG_CURL', 'Angolo Flessione Ischiocrurali', 'gradi'),
    ('ISO_PUSH_LEG_CURL', 'Picco Forza Ischiocrurali 30°', 'N'),
    ('CMJ_BILATERALE', 'Angolo Flessione Ginocchio Max', 'gradi'),
    ('CMJ_BILATERALE', 'Tempo di Volo', 'ms'),
    ('CMJ_BILATERALE', 'Velocità di Stacco (Takeoff Velocity)', 'm/s'),
    ('CMJ_MONOPODALICO', 'Valgismo Dinamico Ginocchio (2D)', 'gradi'),
    ('RSI_DROP_JUMP', 'Altezza Caduta Effettiva', 'cm'),
    ('RSI_DROP_JUMP', 'Picco Forza Verticale vGRF', 'BW')
ON CONFLICT (test_type, metric_name) DO NOTHING;

-- ====================================================================
-- 5. AGGIORNAMENTO TABELLE PAZIENTI & EVALUATIONS
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pazienti') THEN
        ALTER TABLE public.pazienti
            ADD COLUMN IF NOT EXISTS fase_attuale TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS direttive_terapista TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS custom_metrics_template JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluations') THEN
        ALTER TABLE public.evaluations
            ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS test_module TEXT DEFAULT 'ALL',
            ADD COLUMN IF NOT EXISTS module_dates JSONB DEFAULT '{}'::jsonb,
            ADD COLUMN IF NOT EXISTS custom_metrics JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-50 border border-slate-300/60 rounded-xl shadow-none flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-4 border-b border-slate-300/60 flex items-center justify-between bg-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1 bg-sky-100/80 text-sky-900 border border-sky-300/50 rounded">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Script SQL Supabase (Metriche Personalizzate, RLS &amp; Sessioni)</h3>
              <p className="text-xs text-slate-600 font-semibold">Include custom_metric_definitions, patient_custom_metrics e policy RLS per lo staff</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-100/80 hover:bg-emerald-200/70 text-emerald-900 border border-emerald-300/50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-900" />
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
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 overflow-y-auto font-mono text-xs text-slate-800 bg-slate-100/80 space-y-2 select-all leading-relaxed border-b border-slate-300/60">
          <pre>{sqlScript}</pre>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 text-xs text-slate-600 font-semibold flex items-center justify-between">
          <span>Incolla questo codice nel menu <strong>SQL Editor</strong> di Supabase e premi <strong>RUN</strong>.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-100/80 hover:bg-purple-200/70 text-purple-900 border border-purple-300/50 rounded-xl font-bold cursor-pointer"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
}
