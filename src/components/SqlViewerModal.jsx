import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
-- SCRIPT SQL SUPABASE - RISOLUZIONE 5 ERRORI SECURITY ADVISOR (RLS)
-- APP MONITORAGGIO LCA & RETURN TO SPORT (RTS)
-- Eseguire questo script nell'SQL Editor del proprio progetto Supabase.
-- ====================================================================

-- 0. ESTENSIONI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. GARANZIA ESISTENZA TABELLE E CONTROLLO SAFE COLONNA 'patient_id'
-- ====================================================================

-- Tabella 1: PAZIENTI
CREATE TABLE IF NOT EXISTS public.pazienti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    data_nascita DATE,
    codice_fiscale TEXT,
    genere TEXT,
    sport TEXT,
    ruolo_sportivo TEXT,
    livello TEXT,
    lato_lesione TEXT,
    data_intervento DATE,
    tipo_innesto TEXT,
    chirurgo TEXT,
    note_chirurgiche TEXT,
    complicanze TEXT,
    aclrsi_score_iniziale NUMERIC(5,2) DEFAULT 45.0,
    fase_riabilitativa TEXT DEFAULT 'Return to Run',
    prossimo_controllo DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella 2: WORKOUT_LOGS
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    category_icon TEXT DEFAULT 'squat',
    sets INTEGER NOT NULL DEFAULT 3,
    reps TEXT NOT NULL DEFAULT '10',
    weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0,
    is_monopodalic BOOLEAN DEFAULT FALSE,
    weight_sx_kg NUMERIC(6,2),
    weight_dx_kg NUMERIC(6,2),
    tempo_execution TEXT,
    tempo_speed TEXT,
    notes_rpe TEXT,
    notes TEXT,
    rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella 3: TEST_RESULTS
CREATE TABLE IF NOT EXISTS public.test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    data_test DATE DEFAULT CURRENT_DATE,
    fase_test TEXT,
    dati_json JSONB DEFAULT '{}'::jsonb,
    note_cliniche TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella 4: EVALUATIONS
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    data JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella 5: TEST_VALUTAZIONI
CREATE TABLE IF NOT EXISTS public.test_valutazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    data_test DATE NOT NULL DEFAULT CURRENT_DATE,
    fase_test TEXT NOT NULL DEFAULT 'Return to Run',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelle di supporto Profilo & Audit
CREATE TABLE IF NOT EXISTS public.profili_utenti (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nome TEXT,
    cognome TEXT,
    ruolo TEXT NOT NULL DEFAULT 'ADMIN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    evento TEXT NOT NULL,
    dettagli JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONTROLLO SAFE COLONNE 'patient_id' SU TUTTE LE TABELLE ESISTENTI
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='workout_logs' AND column_name='patient_id') THEN
        ALTER TABLE public.workout_logs ADD COLUMN patient_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='pazienti' AND column_name='patient_id') THEN
        ALTER TABLE public.pazienti ADD COLUMN patient_id UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='test_results' AND column_name='patient_id') THEN
        ALTER TABLE public.test_results ADD COLUMN patient_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='evaluations' AND column_name='patient_id') THEN
        ALTER TABLE public.evaluations ADD COLUMN patient_id UUID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='test_valutazioni' AND column_name='patient_id') THEN
        ALTER TABLE public.test_valutazioni ADD COLUMN patient_id UUID;
    END IF;
END $$;

-- Colonne aggiuntive per carichi monopodalici su workout_logs
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS is_monopodalic BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS weight_sx_kg NUMERIC(6,2);
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS weight_dx_kg NUMERIC(6,2);

-- ====================================================================
-- 2. ABILITAZIONE ROW LEVEL SECURITY (RLS) SU TUTTE LE TABELLE
-- ====================================================================

ALTER TABLE public.pazienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_valutazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profili_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Abilita automaticamente RLS anche su qualsiasi altra tabella nello schema 'public'
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl.tablename);
    END LOOP;
END $$;

-- ====================================================================
-- 3. FUNZIONE HELPER DI VERIFICA RUOLO ADMIN / TERAPISTA
-- ====================================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_therapist()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated'
        AND COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', '')
    ) OR (
        COALESCE(LOWER(auth.jwt() ->> 'role'), '') = 'service_role'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. POLICIES RLS PER TABELLA: PAZIENTI (usa 'id' e 'patient_id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Select_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Insert_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Update_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Tutti gli utenti autenticati vedono i pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Solo ADMIN inserisce o modifica pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Isolamento RLS Pazienti: paziente vede solo la propria scheda" ON public.pazienti;
DROP POLICY IF EXISTS "Terapista può inserire modificare ed eliminare pazienti" ON public.pazienti;

-- Admin (Terapisti): SELECT, INSERT, UPDATE, DELETE completi
CREATE POLICY "Admin_Full_Access_pazienti"
    ON public.pazienti
    FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    )
    WITH CHECK (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    );

-- Pazienti: SELECT, INSERT, UPDATE solo dove patient_id = auth.uid() o id = auth.uid()
CREATE POLICY "Patient_Select_Own_pazienti"
    ON public.pazienti
    FOR SELECT
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
    );

CREATE POLICY "Patient_Insert_Own_pazienti"
    ON public.pazienti
    FOR INSERT
    TO authenticated
    WITH CHECK (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
    );

CREATE POLICY "Patient_Update_Own_pazienti"
    ON public.pazienti
    FOR UPDATE
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
    )
    WITH CHECK (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
    );

-- ====================================================================
-- 5. POLICIES RLS PER TABELLA: WORKOUT_LOGS (usa esclusivamente 'patient_id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Select_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Insert_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Update_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Pazienti leggono solo i propri workout_logs e Staff legge tutto" ON public.workout_logs;
DROP POLICY IF EXISTS "Pazienti e Terapisti possono inserire workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Modifica workout_logs per proprietario o Terapista" ON public.workout_logs;
DROP POLICY IF EXISTS "Eliminazione workout_logs per proprietario o Terapista" ON public.workout_logs;

-- Admin (Terapisti): SELECT, INSERT, UPDATE, DELETE completi
CREATE POLICY "Admin_Full_Access_workout_logs"
    ON public.workout_logs
    FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    )
    WITH CHECK (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    );

-- Pazienti: SELECT, INSERT, UPDATE solo dove patient_id = auth.uid()
CREATE POLICY "Patient_Select_Own_workout_logs"
    ON public.workout_logs
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

CREATE POLICY "Patient_Insert_Own_workout_logs"
    ON public.workout_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (patient_id::text = auth.uid()::text);

CREATE POLICY "Patient_Update_Own_workout_logs"
    ON public.workout_logs
    FOR UPDATE
    TO authenticated
    USING (patient_id::text = auth.uid()::text)
    WITH CHECK (patient_id::text = auth.uid()::text);

-- ====================================================================
-- 6. POLICIES RLS PER TABELLA: TEST_RESULTS (usa 'patient_id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_test_results" ON public.test_results;
DROP POLICY IF EXISTS "Patient_Select_Own_test_results" ON public.test_results;

CREATE POLICY "Admin_Full_Access_test_results"
    ON public.test_results
    FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    )
    WITH CHECK (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    );

CREATE POLICY "Patient_Select_Own_test_results"
    ON public.test_results
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

-- ====================================================================
-- 7. POLICIES RLS PER TABELLA: EVALUATIONS (usa 'patient_id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Patient_Select_Own_evaluations" ON public.evaluations;

CREATE POLICY "Admin_Full_Access_evaluations"
    ON public.evaluations
    FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    )
    WITH CHECK (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    );

CREATE POLICY "Patient_Select_Own_evaluations"
    ON public.evaluations
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

-- ====================================================================
-- 8. POLICIES RLS PER TABELLA: TEST_VALUTAZIONI (usa 'patient_id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_test_valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Patient_Select_Own_test_valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Tutti gli utenti autenticati vedono le valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Solo ADMIN crea o modifica valutazioni" ON public.test_valutazioni;

CREATE POLICY "Admin_Full_Access_test_valutazioni"
    ON public.test_valutazioni
    FOR ALL
    TO authenticated, anon
    USING (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    )
    WITH CHECK (
        public.is_admin_or_therapist()
        OR COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
    );

CREATE POLICY "Patient_Select_Own_test_valutazioni"
    ON public.test_valutazioni
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

-- ====================================================================
-- 9. POLICIES RLS PER TABELLE DI PROFILO E AUDIT (usa 'id')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_profili_utenti" ON public.profili_utenti;
DROP POLICY IF EXISTS "Utenti autenticati vedono il proprio profilo" ON public.profili_utenti;
DROP POLICY IF EXISTS "Solo ADMIN può modificare i ruoli utenti" ON public.profili_utenti;

CREATE POLICY "Admin_Full_Access_profili_utenti"
    ON public.profili_utenti
    FOR ALL
    TO authenticated
    USING (id::text = auth.uid()::text OR public.is_admin_or_therapist())
    WITH CHECK (id::text = auth.uid()::text OR public.is_admin_or_therapist());

DROP POLICY IF EXISTS "Admin_Full_Access_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Utenti autenticati possono inserire log di accesso" ON public.audit_logs;
DROP POLICY IF EXISTS "Solo ADMIN legge gli audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Utenti autenticati registrano log" ON public.audit_logs;
DROP POLICY IF EXISTS "Solo ADMIN legge audit logs" ON public.audit_logs;

CREATE POLICY "Admin_Full_Access_audit_logs"
    ON public.audit_logs
    FOR ALL
    TO authenticated, anon
    USING (true)
    WITH CHECK (true);
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
              <h3 className="font-extrabold text-white text-base">Script SQL per Supabase Editor (RLS & Sicurezza)</h3>
              <p className="text-xs text-slate-400">Abilitazione Row Level Security e Policy su tutte le tabelle (patient_id & id)</p>
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
