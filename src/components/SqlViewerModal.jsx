import React, { useState } from 'react';
import { X, Copy, Check, Database } from 'lucide-react';

export default function SqlViewerModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlScript = `-- ====================================================================
-- SCRIPT SQL SUPABASE - RISOLUZIONE ERRORI E 11 WARNINGS SECURITY ADVISOR
-- APP MONITORAGGIO LCA & RETURN TO SPORT (RTS)
-- Eseguire questo script nell'SQL Editor del proprio progetto Supabase.
-- ====================================================================

-- 0. ESTENSIONI
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. GARANZIA ESISTENZA TABELLE E CONTROLLO SAFE COLONNA 'patient_id'
-- ====================================================================

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

CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    data JSONB DEFAULT '{}'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.test_valutazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.pazienti(id) ON DELETE CASCADE,
    data_test DATE NOT NULL DEFAULT CURRENT_DATE,
    fase_test TEXT NOT NULL DEFAULT 'Return to Run',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='patient_id') THEN
        ALTER TABLE public.audit_logs ADD COLUMN patient_id UUID;
    END IF;
END $$;

-- ====================================================================
-- 2. RISOLUZIONE WARNINGS: FUNCTION SEARCH PATH MUTABLE &
--    PUBLIC CAN EXECUTE SECURITY DEFINER FUNCTION
-- ====================================================================

-- 2.1 Funzione Trigger: handle_new_user() con SET search_path = ''
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
        COALESCE(NEW.raw_user_meta_data->>'nome', 'Utente'),
        COALESCE(NEW.raw_user_meta_data->>'cognome', 'Staff'),
        COALESCE(NEW.raw_user_meta_data->>'ruolo', 'STAFF')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 2.2 Funzione RBAC: is_admin() con SET search_path = ''
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT p.ruolo INTO user_role
    FROM public.profili_utenti p
    WHERE p.id = auth.uid();

    RETURN (
        UPPER(COALESCE(user_role, '')) IN ('ADMIN', 'STAFF')
        OR (
            auth.role() = 'authenticated'
            AND COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', '')
        )
    );
END;
$$;

-- 2.3 Funzione RBAC: is_admin_or_therapist() con SET search_path = ''
CREATE OR REPLACE FUNCTION public.is_admin_or_therapist()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated'
        AND COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), 'admin') IN ('admin', 'staff', 'therapist', '')
    ) OR (
        COALESCE(LOWER(auth.jwt() ->> 'role'), '') = 'service_role'
    );
END;
$$;

-- 2.4 Limitazione esplicita degli esecutori (REVOKE da PUBLIC/anon, GRANT solo a authenticated)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_admin_or_therapist() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_therapist() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_therapist() TO authenticated, service_role;

-- ====================================================================
-- 3. ABILITAZIONE ROW LEVEL SECURITY (RLS) SU TUTTE LE TABELLE
-- ====================================================================

ALTER TABLE public.pazienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_valutazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profili_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Admin_Full_Access_pazienti"
    ON public.pazienti
    FOR ALL
    TO authenticated, anon
    USING (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    )
    WITH CHECK (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    );

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

CREATE POLICY "Admin_Full_Access_workout_logs"
    ON public.workout_logs
    FOR ALL
    TO authenticated, anon
    USING (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    )
    WITH CHECK (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    );

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
-- 6. POLICIES RLS PER TABELLE TEST: TEST_RESULTS, EVALUATIONS, TEST_VALUTAZIONI
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_test_results" ON public.test_results;
DROP POLICY IF EXISTS "Patient_Select_Own_test_results" ON public.test_results;

CREATE POLICY "Admin_Full_Access_test_results"
    ON public.test_results
    FOR ALL
    TO authenticated, anon
    USING (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    )
    WITH CHECK (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    );

CREATE POLICY "Patient_Select_Own_test_results"
    ON public.test_results
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admin_Full_Access_evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Patient_Select_Own_evaluations" ON public.evaluations;

CREATE POLICY "Admin_Full_Access_evaluations"
    ON public.evaluations
    FOR ALL
    TO authenticated, anon
    USING (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    )
    WITH CHECK (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    );

CREATE POLICY "Patient_Select_Own_evaluations"
    ON public.evaluations
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Admin_Full_Access_test_valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Patient_Select_Own_test_valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Tutti gli utenti autenticati vedono le valutazioni" ON public.test_valutazioni;
DROP POLICY IF EXISTS "Solo ADMIN crea o modifica valutazioni" ON public.test_valutazioni;

CREATE POLICY "Admin_Full_Access_test_valutazioni"
    ON public.test_valutazioni
    FOR ALL
    TO authenticated, anon
    USING (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    )
    WITH CHECK (
        COALESCE(LOWER(auth.jwt() -> 'user_metadata' ->> 'role'), '') != 'patient'
        OR public.is_admin_or_therapist()
    );

CREATE POLICY "Patient_Select_Own_test_valutazioni"
    ON public.test_valutazioni
    FOR SELECT
    TO authenticated
    USING (patient_id::text = auth.uid()::text);

-- ====================================================================
-- 7. POLICIES RLS STRINGENTI SU PROFILI_UTENTI & AUDIT_LOGS
--    (RISOLUZIONE WARNING 'RLS Policy Always True')
-- ====================================================================

DROP POLICY IF EXISTS "Admin_Full_Access_profili_utenti" ON public.profili_utenti;
DROP POLICY IF EXISTS "Utenti autenticati vedono il proprio profilo" ON public.profili_utenti;
DROP POLICY IF EXISTS "Solo ADMIN può modificare i ruoli utenti" ON public.profili_utenti;

CREATE POLICY "Admin_Full_Access_profili_utenti"
    ON public.profili_utenti
    FOR ALL
    TO authenticated
    USING (id::text = auth.uid()::text OR public.is_admin())
    WITH CHECK (id::text = auth.uid()::text OR public.is_admin());

-- Rimozione di tutte le policy permissive con USING (true) su audit_logs
DROP POLICY IF EXISTS "Admin_Full_Access_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Utenti autenticati possono inserire log di accesso" ON public.audit_logs;
DROP POLICY IF EXISTS "Solo ADMIN legge gli audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Utenti autenticati registrano log" ON public.audit_logs;
DROP POLICY IF EXISTS "Solo ADMIN legge audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Only Admin Read Audit Logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated Insert Audit Logs" ON public.audit_logs;

-- Policy RLS stringente su audit_logs
CREATE POLICY "Only Admin Read Audit Logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Authenticated Insert Audit Logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (patient_id::text = auth.uid()::text OR public.is_admin());
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
              <h3 className="font-extrabold text-white text-base">Script SQL per Supabase Editor (RLS & Zero Warnings)</h3>
              <p className="text-xs text-slate-400">Risoluzione 5 Errori RLS e 11 Warnings (search_path, REVOKE EXECUTE, audit_logs)</p>
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
