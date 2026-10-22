import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
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
              <h3 className="font-extrabold text-white text-base">Script SQL per Supabase Editor (staff_users, RLS &amp; Sessioni Test)</h3>
              <p className="text-xs text-slate-400">Tabella staff_users, policy RLS e colonne session_id / session_name per i Report di Valutazione</p>
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
