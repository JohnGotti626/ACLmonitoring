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
-- 1. GARANZIA ESISTENZA DELLE 5+ TABELLE PRINCIPALI E COLONNE
-- ====================================================================

-- Tabella 1: PAZIENTI
CREATE TABLE IF NOT EXISTS public.pazienti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    email TEXT,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    patient_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pazienti ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pazienti ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.pazienti ADD COLUMN IF NOT EXISTS patient_id UUID;

-- Tabella 2: WORKOUT_LOGS (Rilevazioni Carichi & Esercizi Monopodalici/Bipodalici)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id TEXT NOT NULL,
    patient_email TEXT,
    user_id UUID,
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

ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS is_monopodalic BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS weight_sx_kg NUMERIC(6,2);
ALTER TABLE public.workout_logs ADD COLUMN IF NOT EXISTS weight_dx_kg NUMERIC(6,2);

-- Tabella 3: TEST_RESULTS (Risultati Test / ForceDecks / Dinamo / Hop)
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

-- Tabella 4: EVALUATIONS (Valutazioni Biomeccaniche e Storico Test)
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    data JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabella 5: TEST_VALUTAZIONI (Batteria Prestativa LCA)
CREATE TABLE IF NOT EXISTS public.test_valutazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paziente_id UUID NOT NULL REFERENCES public.pazienti(id) ON DELETE CASCADE,
    data_test DATE NOT NULL DEFAULT CURRENT_DATE,
    fase_test TEXT NOT NULL DEFAULT 'Return to Run',
    dynamo_q_0 NUMERIC(6,2),
    dynamo_q_60 NUMERIC(6,2),
    dynamo_q_90 NUMERIC(6,2),
    dynamo_f_0 NUMERIC(6,2),
    dynamo_f_60 NUMERIC(6,2),
    dynamo_f_90 NUMERIC(6,2),
    dynamo_q_sano_90 NUMERIC(6,2),
    dynamo_f_sano_90 NUMERIC(6,2),
    forcedecks_cmj_asym_braking NUMERIC(5,2),
    forcedecks_rfd_0_100 NUMERIC(6,2),
    forcedecks_rsi_mod_dvj NUMERIC(5,2),
    vbt_velocity_loss_pct NUMERIC(5,2),
    vbt_mean_velocity NUMERIC(4,2),
    hop_single NUMERIC(5,2),
    hop_triple NUMERIC(5,2),
    hop_crossover NUMERIC(5,2),
    hop_6m_timed NUMERIC(5,2),
    aclrsi_score_attuale NUMERIC(5,2),
    note_operative TEXT,
    esercizi_prescritti TEXT,
    alert_compenso TEXT,
    sintesi_copilot_ia TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabelle di supporto RBAC & Audit
CREATE TABLE IF NOT EXISTS public.profili_utenti (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT,
    cognome TEXT,
    ruolo TEXT NOT NULL DEFAULT 'ADMIN',
    qualifica TEXT DEFAULT 'Fisioterapista / Preparatore AT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    ruolo_utente TEXT,
    evento TEXT NOT NULL,
    dettagli JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- Sicurezza aggiuntiva: abilita automaticamente RLS su QUALSIASI altra
-- tabella presente nello schema 'public' per azzerare il Security Advisor
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
    ) OR EXISTS (
        SELECT 1 FROM public.profili_utenti
        WHERE id = auth.uid() AND UPPER(ruolo) IN ('ADMIN', 'STAFF')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. POLICIES RLS PER TABELLA: PAZIENTI
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Select_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Insert_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Patient_Update_Own_pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Tutti gli utenti autenticati vedono i pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Solo ADMIN inserisce o modifica pazienti" ON public.pazienti;
DROP POLICY IF EXISTS "Isolamento RLS Pazienti: paziente vede solo la propria scheda" ON public.pazienti;
DROP POLICY IF EXISTS "Terapista può inserire modificare ed eliminare pazienti" ON public.pazienti;

-- Policy Permissiva Admin / Terapisti (SELECT, INSERT, UPDATE, DELETE)
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

-- Policy Pazienti: SELECT, INSERT, UPDATE limitati alla propria riga (patient_id = auth.uid())
CREATE POLICY "Patient_Select_Own_pazienti"
    ON public.pazienti
    FOR SELECT
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR auth_user_id = auth.uid()
        OR LOWER(email) = LOWER(auth.jwt() ->> 'email')
    );

CREATE POLICY "Patient_Insert_Own_pazienti"
    ON public.pazienti
    FOR INSERT
    TO authenticated
    WITH CHECK (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR auth_user_id = auth.uid()
    );

CREATE POLICY "Patient_Update_Own_pazienti"
    ON public.pazienti
    FOR UPDATE
    TO authenticated
    USING (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR auth_user_id = auth.uid()
    )
    WITH CHECK (
        id::text = auth.uid()::text
        OR patient_id::text = auth.uid()::text
        OR auth_user_id = auth.uid()
    );

-- ====================================================================
-- 5. POLICIES RLS PER TABELLA: WORKOUT_LOGS
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Select_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Insert_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Patient_Update_Own_workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Pazienti leggono solo i propri workout_logs e Staff legge tutto" ON public.workout_logs;
DROP POLICY IF EXISTS "Pazienti e Terapisti possono inserire workout_logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Modifica workout_logs per proprietario o Terapista" ON public.workout_logs;
DROP POLICY IF EXISTS "Eliminazione workout_logs per proprietario o Terapista" ON public.workout_logs;

-- Policy Permissiva Admin / Terapisti (SELECT, INSERT, UPDATE, DELETE)
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

-- Policy Pazienti: SELECT, INSERT, UPDATE limitati alle righe dove patient_id = auth.uid()
CREATE POLICY "Patient_Select_Own_workout_logs"
    ON public.workout_logs
    FOR SELECT
    TO authenticated
    USING (
        patient_id::text = auth.uid()::text
        OR user_id = auth.uid()
        OR LOWER(patient_email) = LOWER(auth.jwt() ->> 'email')
    );

CREATE POLICY "Patient_Insert_Own_workout_logs"
    ON public.workout_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        patient_id::text = auth.uid()::text
        OR user_id = auth.uid()
        OR LOWER(patient_email) = LOWER(auth.jwt() ->> 'email')
    );

CREATE POLICY "Patient_Update_Own_workout_logs"
    ON public.workout_logs
    FOR UPDATE
    TO authenticated
    USING (
        patient_id::text = auth.uid()::text
        OR user_id = auth.uid()
        OR LOWER(patient_email) = LOWER(auth.jwt() ->> 'email')
    )
    WITH CHECK (
        patient_id::text = auth.uid()::text
        OR user_id = auth.uid()
        OR LOWER(patient_email) = LOWER(auth.jwt() ->> 'email')
    );

-- ====================================================================
-- 6. POLICIES RLS PER TABELLA: TEST_RESULTS
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
-- 7. POLICIES RLS PER TABELLA: EVALUATIONS
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
-- 8. POLICIES RLS PER TABELLA: TEST_VALUTAZIONI
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
    USING (paziente_id::text = auth.uid()::text);

-- ====================================================================
-- 9. POLICIES RLS PER TABELLE DI SUPPORTO: PROFILI_UTENTI & AUDIT_LOGS
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_profili_utenti" ON public.profili_utenti;
DROP POLICY IF EXISTS "Utenti autenticati vedono il proprio profilo" ON public.profili_utenti;
DROP POLICY IF EXISTS "Solo ADMIN può modificare i ruoli utenti" ON public.profili_utenti;

CREATE POLICY "Admin_Full_Access_profili_utenti"
    ON public.profili_utenti
    FOR ALL
    TO authenticated
    USING (auth.uid() = id OR public.is_admin_or_therapist())
    WITH CHECK (auth.uid() = id OR public.is_admin_or_therapist());

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
              <p className="text-xs text-slate-400">Abilitazione Row Level Security e Policy su tutte le tabelle (Admin & Pazienti)</p>
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
