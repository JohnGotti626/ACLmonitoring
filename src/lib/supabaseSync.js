import { supabase, isSupabaseConfigured } from './supabase';
import { normalizePhaseForDb } from '../utils/phaseUtils';
import { sortTestsByDate } from '../utils/testUtils';

/**
 * Carica tutti i pazienti da Supabase Cloud (senza alcun fallback su localStorage)
 */
export async function fetchPatientsFromCloud() {
  if (!isSupabaseConfigured) {
    console.error('❌ [Supabase Cloud] Client Supabase non configurato correttamente.');
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('pazienti')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Supabase Cloud] Errore caricamento pazienti:', error.message, error);
      return null;
    }

    if (Array.isArray(data)) {
      return data.map(row => {
        const normPhase = normalizePhaseForDb(row.fase_riabilitativa || row.fase_attuale);
        const rawTests = Array.isArray(row.tests)
          ? row.tests
          : typeof row.tests === 'string'
          ? JSON.parse(row.tests)
          : [];
        const sortedTests = sortTestsByDate(rawTests);

        return {
          ...row,
          id: row.id,
          nome: row.nome || '',
          cognome: row.cognome || '',
          data_nascita: row.data_nascita || '2000-01-01',
          codice_fiscale: row.codice_fiscale || '',
          genere: row.genere || 'M',
          sport: row.sport || 'Calcio',
          ruolo_sportivo: row.ruolo_sportivo || '',
          livello: row.livello || 'Amatoriale',
          lato_lesione: row.lato_lesione || 'Dx',
          data_intervento: row.data_intervento || new Date().toISOString().split('T')[0],
          tipo_innesto: row.tipo_innesto || 'STG',
          chirurgo: row.chirurgo || '',
          note_chirurgiche: row.note_chirurgiche || '',
          complicanze: row.complicanze || '',
          aclrsi_score_iniziale: row.aclrsi_score_iniziale ?? 50.0,
          fase_riabilitativa: normPhase,
          fase_attuale: normPhase,
          prossimo_controllo: row.prossimo_controllo || null,
          note_operative: row.note_operative || '',
          esercizi_prescritti: row.esercizi_prescritti || '',
          alert_compenso: row.alert_compenso || '',
          tests: sortedTests,
          deficits_list: Array.isArray(row.deficits_list) ? row.deficits_list : [],
          exercises_list: Array.isArray(row.exercises_list) ? row.exercises_list : []
        };
      });
    }
    return [];
  } catch (err) {
    console.error('❌ [Supabase Cloud] Eccezione fetchPatientsFromCloud:', err);
    return null;
  }
}

/**
 * Aggiorna un paziente esistente su Supabase Cloud usando la Primary Key `id`
 */
export async function updatePatientInCloud(patient) {
  if (!isSupabaseConfigured || !patient?.id) {
    console.error('❌ [Supabase Cloud] Impossibile aggiornare: ID paziente mancante.');
    return { success: false, error: new Error('ID paziente mancante') };
  }

  try {
    const normPhase = normalizePhaseForDb(patient.fase_riabilitativa || patient.fase_attuale);
    const sortedTests = sortTestsByDate(patient.tests || []);

    const updatePayload = {
      nome: patient.nome,
      cognome: patient.cognome,
      data_nascita: patient.data_nascita || '2000-01-01',
      codice_fiscale: patient.codice_fiscale || '',
      genere: patient.genere || 'M',
      sport: patient.sport || 'Calcio',
      ruolo_sportivo: patient.ruolo_sportivo || '',
      livello: patient.livello || 'Amatoriale',
      lato_lesione: patient.lato_lesione || 'Dx',
      data_intervento: patient.data_intervento || new Date().toISOString().split('T')[0],
      tipo_innesto: patient.tipo_innesto || 'STG',
      chirurgo: patient.chirurgo || '',
      note_chirurgiche: patient.note_chirurgiche || '',
      complicanze: patient.complicanze || '',
      aclrsi_score_iniziale: Number(patient.aclrsi_score_iniziale) || 50.0,
      fase_riabilitativa: normPhase,
      prossimo_controllo: patient.prossimo_controllo || null,
      note_operative: patient.note_operative || '',
      esercizi_prescritti: patient.esercizi_prescritti || '',
      alert_compenso: patient.alert_compenso || '',
      tests: sortedTests,
      deficits_list: Array.isArray(patient.deficits_list) ? patient.deficits_list : [],
      exercises_list: Array.isArray(patient.exercises_list) ? patient.exercises_list : [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pazienti')
      .update(updatePayload)
      .eq('id', patient.id)
      .select();

    if (error) {
      console.error('❌ [Supabase Cloud] Errore .update() paziente:', error.message, error);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error(
        '⚠️ [Supabase Cloud] Nessuna riga aggiornata su pazienti per id =',
        patient.id,
        '— Verifica le Policy RLS (FOR UPDATE) sulla tabella public.pazienti in Supabase!'
      );
      return {
        success: false,
        error: new Error(
          'Permesso RLS mancante per UPDATE su tabella pazienti. Esegui la policy SQL per sbloccare le modifiche.'
        )
      };
    }

    console.log('✅ [Supabase Cloud] Paziente aggiornato con successo (ID:', patient.id, ')');
    return { success: true, data: data[0] };
  } catch (err) {
    console.error('❌ [Supabase Cloud] Eccezione updatePatientInCloud:', err);
    return { success: false, error: err };
  }
}

/**
 * Crea o salva un paziente su Supabase Cloud
 */
export async function savePatientToCloud(patient, isNew = false) {
  if (!isSupabaseConfigured || !patient) return false;

  if (!isNew && patient.id) {
    const res = await updatePatientInCloud(patient);
    if (res.success) return true;
  }

  try {
    const normPhase = normalizePhaseForDb(patient.fase_riabilitativa || patient.fase_attuale);
    const sortedTests = sortTestsByDate(patient.tests || []);
    const payload = {
      id: patient.id,
      nome: patient.nome,
      cognome: patient.cognome,
      data_nascita: patient.data_nascita || '2000-01-01',
      codice_fiscale: patient.codice_fiscale || '',
      genere: patient.genere || 'M',
      sport: patient.sport || 'Calcio',
      ruolo_sportivo: patient.ruolo_sportivo || '',
      livello: patient.livello || 'Amatoriale',
      lato_lesione: patient.lato_lesione || 'Dx',
      data_intervento: patient.data_intervento || new Date().toISOString().split('T')[0],
      tipo_innesto: patient.tipo_innesto || 'STG',
      chirurgo: patient.chirurgo || '',
      note_chirurgiche: patient.note_chirurgiche || '',
      complicanze: patient.complicanze || '',
      aclrsi_score_iniziale: Number(patient.aclrsi_score_iniziale) || 50.0,
      fase_riabilitativa: normPhase,
      prossimo_controllo: patient.prossimo_controllo || null,
      note_operative: patient.note_operative || '',
      esercizi_prescritti: patient.esercizi_prescritti || '',
      alert_compenso: patient.alert_compenso || '',
      tests: sortedTests,
      deficits_list: Array.isArray(patient.deficits_list) ? patient.deficits_list : [],
      exercises_list: Array.isArray(patient.exercises_list) ? patient.exercises_list : [],
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pazienti')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (error) {
      console.error('❌ [Supabase Cloud] Errore salvataggio paziente:', error.message, error);
      return false;
    }

    return Boolean(data && data.length > 0);
  } catch (err) {
    console.error('❌ [Supabase Cloud] Eccezione savePatientToCloud:', err);
    return false;
  }
}

/**
 * Elimina un paziente da Supabase Cloud usando la Primary Key `id`
 */
export async function deletePatientFromCloud(patientId) {
  if (!isSupabaseConfigured || !patientId) {
    console.error('❌ [Supabase Cloud] ID paziente non valido per eliminazione.');
    return { success: false, error: new Error('ID paziente non valido') };
  }

  try {
    // 1. Elimina anche gli eventuali workout_logs associati al paziente
    await supabase.from('workout_logs').delete().eq('patient_id', String(patientId));

    // 2. Elimina il paziente tramite Primary Key `id`
    const { data, error } = await supabase
      .from('pazienti')
      .delete()
      .eq('id', patientId)
      .select();

    if (error) {
      console.error('❌ [Supabase Cloud] Errore .delete() paziente:', error.message, error);
      return { success: false, error };
    }

    if (!data || data.length === 0) {
      console.error(
        '⚠️ [Supabase Cloud] Nessuna riga eliminata per id =',
        patientId,
        '— Verifica le Policy RLS (FOR DELETE) sulla tabella public.pazienti in Supabase!'
      );
      return {
        success: false,
        error: new Error(
          'Permesso RLS mancante per DELETE su tabella pazienti. Esegui la policy SQL per sbloccare l\'eliminazione.'
        )
      };
    }

    console.log('✅ [Supabase Cloud] Paziente eliminato definitivamente dal DB (ID:', patientId, ')');
    return { success: true, data };
  } catch (err) {
    console.error('❌ [Supabase Cloud] Eccezione deletePatientFromCloud:', err);
    return { success: false, error: err };
  }
}

/**
 * Attiva l'ascolto Realtime per ricevere aggiornamenti istantanei
 */
export function subscribeToRealtimePatients(onUpdate) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('realtime_pazienti_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pazienti' },
      async (payload) => {
        console.log('⚡ [Realtime Supabase] Modifica rilevata sulla tabella pazienti!', payload);
        const updatedList = await fetchPatientsFromCloud();
        if (updatedList) {
          onUpdate(updatedList);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
