-- ====================================================================
-- SCRIPT SQL SUPABASE - APP MONITORAGGIO LCA & RETURN TO SPORT (RTS)
-- Autore: Lead Software Medical Developer & DB Architect
-- Eseguire questo script nell'SQL Editor del proprio progetto Supabase.
-- ====================================================================

-- 1. ESTENSIONI E CLEANUP PREVENTIVO (OPZIONALE)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELLA PROFILI UTENTI (RBAC: ADMIN vs STAFF)
CREATE TABLE IF NOT EXISTS public.profili_utenti (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT,
    cognome TEXT,
    ruolo TEXT NOT NULL CHECK (ruolo IN ('ADMIN', 'STAFF')) DEFAULT 'STAFF',
    qualifica TEXT DEFAULT 'Fisioterapista / Preparatore AT',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELLA PAZIENTI
CREATE TABLE IF NOT EXISTS public.pazienti (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    cognome TEXT NOT NULL,
    data_nascita DATE NOT NULL,
    codice_fiscale TEXT,
    genere TEXT CHECK (genere IN ('M', 'F', 'Altro')),
    sport TEXT NOT NULL,
    ruolo_sportivo TEXT,
    livello TEXT NOT NULL CHECK (livello IN ('Amatoriale', 'Semi-Pro', 'Professionista')),
    lato_lesione TEXT NOT NULL CHECK (lato_lesione IN ('Sx', 'Dx', 'Bilaterale')),
    data_intervento DATE NOT NULL,
    tipo_innesto TEXT NOT NULL, -- es: 'STG', 'Rotuleo', 'Quadricipitale', 'Allograft'
    chirurgo TEXT,
    note_chirurgiche TEXT,
    complicanze TEXT,
    aclrsi_score_iniziale NUMERIC(5,2) DEFAULT 45.0,
    fase_riabilitativa TEXT DEFAULT 'Return to Run' CHECK (fase_riabilitativa IN ('Early Phase', 'Return to Run', 'Return to Sport', 'Return to Play')),
    prossimo_controllo DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELLA TEST VALUTAZIONI (BATTERIA PRESTATIVA LCA)
CREATE TABLE IF NOT EXISTS public.test_valutazioni (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paziente_id UUID NOT NULL REFERENCES public.pazienti(id) ON DELETE CASCADE,
    data_test DATE NOT NULL DEFAULT CURRENT_DATE,
    fase_test TEXT NOT NULL CHECK (fase_test IN ('Early Phase', 'Return to Run', 'Return to Sport', 'Return to Play')),
    
    -- DYNAMO ISOMETRIC / ISOKINETIC PEAK TORQUE
    dynamo_q_0 NUMERIC(6,2),        -- Quadricipite a 0° (Nm o N)
    dynamo_q_60 NUMERIC(6,2),       -- Quadricipite a 60°
    dynamo_q_90 NUMERIC(6,2),       -- Quadricipite a 90°
    dynamo_f_0 NUMERIC(6,2),        -- Flessori a 0°
    dynamo_f_60 NUMERIC(6,2),       -- Flessori a 60°
    dynamo_f_90 NUMERIC(6,2),       -- Flessori a 90°
    dynamo_q_sano_90 NUMERIC(6,2),  -- Quadricipite Arto Sano a 90° (per LSI)
    dynamo_f_sano_90 NUMERIC(6,2),  -- Flessori Arto Sano a 90° (per LSI)

    -- FORCEDECKS FORCE PLATES
    forcedecks_cmj_asym_braking NUMERIC(5,2), -- CMJ Asymmetric Braking Force (%)
    forcedecks_rfd_0_100 NUMERIC(6,2),        -- Rate of Force Development 0-100ms (N/s)
    forcedecks_rsi_mod_dvj NUMERIC(5,2),      -- RSImod su Drop Vertical Jump

    -- VITRUVE / GYMAWARE VBT (VELOCITY BASED TRAINING)
    vbt_velocity_loss_pct NUMERIC(5,2),       -- Velocity Loss (%)
    vbt_mean_velocity NUMERIC(4,2),            -- Mean Velocity (m/s)

    -- HOP TESTS (LSI - Limb Symmetry Index %)
    hop_single NUMERIC(5,2),                  -- Single Hop LSI %
    hop_triple NUMERIC(5,2),                  -- Triple Hop LSI %
    hop_crossover NUMERIC(5,2),               -- Crossover Hop LSI %
    hop_6m_timed NUMERIC(5,2),                -- 6m Timed Hop LSI %

    -- SCORES & DIRETTIVE OPERATIVE
    aclrsi_score_attuale NUMERIC(5,2),
    note_operative TEXT,                      -- Deficit prioritari e note fisio
    esercizi_prescritti TEXT,                 -- Indicazioni di carico e VBT
    alert_compenso TEXT,                      -- Avvertenze per lo staff sul campo
    sintesi_copilot_ia TEXT,                  -- Output sintetico dell'engine IA Biomeccanico

    created_by UUID REFERENCES public.profili_utenti(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELLA AUDIT LOGS (TRACCIAMENTO ACCESSI E AZIONI)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    ruolo_utente TEXT,
    evento TEXT NOT NULL, -- es: 'LOGIN', 'LOGOUT', 'DATA_ENTRY', 'GENERATE_REPORT'
    dettagli JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUTOMATIC CREATION OF USER PROFILE ON SIGNUP (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. ROW LEVEL SECURITY (RLS) POLICIES

-- Abilita RLS su tutte le tabelle
ALTER TABLE public.profili_utenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pazienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_valutazioni ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Funzione helper per verificare se l'utente collegato è ADMIN (Lead Therapist)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT ruolo INTO user_role FROM public.profili_utenti WHERE id = auth.uid();
    RETURN user_role = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy su Profili Utenti
CREATE POLICY "Utenti autenticati vedono il proprio profilo"
    ON public.profili_utenti FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR is_admin());

CREATE POLICY "Solo ADMIN può modificare i ruoli utenti"
    ON public.profili_utenti FOR ALL
    TO authenticated
    USING (is_admin());

-- Policy su Pazienti (ADMIN: CRUD completo | STAFF: Lettura Sola)
CREATE POLICY "Tutti gli utenti autenticati vedono i pazienti"
    ON public.pazienti FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo ADMIN inserisce o modifica pazienti"
    ON public.pazienti FOR ALL
    TO authenticated
    USING (is_admin());

-- Policy su Test Valutazioni (ADMIN: CRUD completo | STAFF: Lettura Sola)
CREATE POLICY "Tutti gli utenti autenticati vedono le valutazioni"
    ON public.test_valutazioni FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Solo ADMIN crea o modifica valutazioni"
    ON public.test_valutazioni FOR ALL
    TO authenticated
    USING (is_admin());

-- Policy su Audit Logs (Registrazione aperta, Lettura riservata ad ADMIN)
CREATE POLICY "Utenti autenticati possono inserire log di accesso"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Solo ADMIN legge gli audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (is_admin());

-- 8. DATI INIZIALI DI PROVA (SEED DATA - UUID v4 a 36 caratteri validi)
INSERT INTO public.pazienti (
    id, nome, cognome, data_nascita, codice_fiscale, genere, sport, ruolo_sportivo, livello, lato_lesione, data_intervento, tipo_innesto, chirurgo, note_chirurgiche, complicanze, aclrsi_score_iniziale, fase_riabilitativa, prossimo_controllo
) VALUES
(
    'a1b2c3d4-e5f6-4789-a012-56789abcdef1',
    'Marco', 'Rossi', '1998-05-14', 'RSSMRC98E14F205Z', 'M', 'Calcio', 'Ala Sinistra', 'Professionista', 'Sx',
    CURRENT_DATE - INTERVAL '120 days', 'Rotuleo', 'Dr. Roberto Mariani', 'Ricostruzione LCA con tendon rotuleo con autofissaggio ad interferenza.', 'Nessuna complicanza peri-operatoria. Idrarto risolto al 2° mese.',
    42.5, 'Return to Run', CURRENT_DATE + INTERVAL '15 days'
),
(
    'b2c3d4e5-f6a7-4890-b123-6789abcdef02',
    'Giulia', 'Bianchi', '2001-11-22', 'BNCGLI01S62H501Y', 'F', 'Basket', 'Playmaker', 'Semi-Pro', 'Dx',
    CURRENT_DATE - INTERVAL '210 days', 'STG', 'Dr. Stefano Zaffagnini', 'Ricostruzione LCA con Semitendinoso e Gracile duplicato.', 'Lieve rigidità in flessione risolta con mobilizzazione precoce.',
    68.0, 'Return to Sport', CURRENT_DATE + INTERVAL '30 days'
),
(
    'c3d4e5f6-a7b8-4901-c234-789abcdef003',
    'Alessandro', 'Verdi', '2003-03-08', 'VRDLSN03C08L219X', 'M', 'Rugby', 'Terza Linea', 'Amatoriale', 'Dx',
    CURRENT_DATE - INTERVAL '45 days', 'Quadricipitale', 'Dr. Massimo Berruto', 'Innesto di tendine quadricipitale con zaffetto osseo.', 'Piccolo ematoma post-chirurgico riassorbito.',
    35.0, 'Early Phase', CURRENT_DATE + INTERVAL '15 days'
);

INSERT INTO public.test_valutazioni (
    paziente_id, data_test, fase_test,
    dynamo_q_0, dynamo_q_60, dynamo_q_90, dynamo_f_0, dynamo_f_60, dynamo_f_90, dynamo_q_sano_90, dynamo_f_sano_90,
    forcedecks_cmj_asym_braking, forcedecks_rfd_0_100, forcedecks_rsi_mod_dvj,
    vbt_velocity_loss_pct, vbt_mean_velocity,
    hop_single, hop_triple, hop_crossover, hop_6m_timed,
    aclrsi_score_attuale, note_operative, esercizi_prescritti, alert_compenso, sintesi_copilot_ia
) VALUES
(
    'a1b2c3d4-e5f6-4789-a012-56789abcdef1',
    CURRENT_DATE - INTERVAL '10 days', 'Return to Run',
    180.0, 210.0, 225.0, 110.0, 130.0, 140.0, 260.0, 155.0,
    14.2, 1850.0, 0.41,
    12.5, 0.85,
    86.5, 84.0, 88.0, 91.0,
    64.0,
    'Deficit residuo peak torque Quadricipite a 90° del 13.5%. Valutare incremento carico su Trap Bar Deadlift.',
    '4x6 Trap Bar Deadlift al 75% 1RM (Target VBT: 0.65 m/s). 3x5 Drop Jump da box 30cm.',
    'Attenzione a valgo dinamico residuo in atterraggio monopodalico a stanchezza elevata.',
    'COPILOT IA: Il paziente mostra ottimi progressi nella fase Return to Run (LSI Quad 86.5%). La simmetria negli Hop Tests è soddisfacente (>85%), ma la forza di frenata asimmetrica su CMJ (14.2%) richiede ancora 2 settimane di lavoro eccentrico mirato prima di passare alla fase Return to Sport completa.'
),
(
    'b2c3d4e5-f6a7-4890-b123-6789abcdef02',
    CURRENT_DATE - INTERVAL '5 days', 'Return to Sport',
    240.0, 275.0, 290.0, 150.0, 175.0, 185.0, 300.0, 190.0,
    6.8, 2350.0, 0.52,
    8.0, 0.98,
    96.0, 95.5, 97.0, 96.5,
    82.5,
    'Criteri RTS quasi totalmente sbloccati. Eccellente controllo neuromuscolare.',
    'Cambio di direzione reattivo con stimoli visivi. Plyometrics ad alta intensità.',
    'Nessun alert critico. Mantenere monitoraggio fatica VBT con Velocity Loss < 10%.',
    'COPILOT IA: Criteri per il Return to Sport sbloccati con successo. Tutti i bicchieri prestativi superano la soglia del 90% LSI con RSImod elevato (0.52) e asimmetria di frenata nei limiti di sicurezza (<8%). Idonea per reingresso in gruppo.'
);

-- FINE SCRIPT SQL
