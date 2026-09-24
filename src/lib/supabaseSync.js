import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Carica tutti i pazienti da Supabase Cloud
 */
export async function fetchPatientsFromCloud() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('pazienti')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('⚡ [Supabase Cloud] Errore caricamento pazienti:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      // Mappa i record del database adattando la struttura per l'app React
      return data.map(row => ({
        id: row.id,
        nome: row.nome,
        cognome: row.cognome,
        data_nascita: row.data_nascita,
        codice_fiscale: row.codice_fiscale,
        genere: row.genere,
        sport: row.sport,
        ruolo_sportivo: row.ruolo_sportivo,
        livello: row.livello,
        lato_lesione: row.lato_lesione,
        data_intervento: row.data_intervento,
        tipo_innesto: row.tipo_innesto,
        chirurgo: row.chirurgo,
        note_chirurgiche: row.note_chirurgiche,
        complicanze: row.complicanze,
        aclrsi_score_iniziale: row.aclrsi_score_iniziale,
        fase_riabilitativa: row.fase_riabilitativa,
        prossimo_controllo: row.prossimo_controllo,
        note_operative: row.note_operative || '',
        esercizi_prescritti: row.esercizi_prescritti || '',
        alert_compenso: row.alert_compenso || '',
        tests: Array.isArray(row.tests) ? row.tests : (typeof row.tests === 'string' ? JSON.parse(row.tests) : []),
        deficits_list: Array.isArray(row.deficits_list) ? row.deficits_list : [],
        exercises_list: Array.isArray(row.exercises_list) ? row.exercises_list : []
      }));
    }
    return [];
  } catch (err) {
    console.error('⚡ [Supabase Cloud] Eccezione fetch:', err);
    return null;
  }
}

/**
 * Salva o aggiorna un paziente su Supabase Cloud (disponibile istantaneamente per tutti i colleghi online)
 */
export async function savePatientToCloud(patient) {
  if (!isSupabaseConfigured || !patient) return false;
  try {
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
      aclrsi_score_iniziale: patient.aclrsi_score_iniziale || 50.0,
      fase_riabilitativa: patient.fase_riabilitativa || 'Early Phase',
      prossimo_controllo: patient.prossimo_controllo || null,
      note_operative: patient.note_operative || '',
      esercizi_prescritti: patient.esercizi_prescritti || '',
      alert_compenso: patient.alert_compenso || '',
      tests: patient.tests || [],
      deficits_list: patient.deficits_list || [],
      exercises_list: patient.exercises_list || [],
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('pazienti')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('⚡ [Supabase Cloud] Errore salvataggio paziente:', error.message);
      return false;
    }
    console.log('⚡ [Supabase Cloud] Paziente salvato con successo:', patient.nome, patient.cognome);
    return true;
  } catch (err) {
    console.error('⚡ [Supabase Cloud] Eccezione savePatient:', err);
    return false;
  }
}

/**
 * Attiva l'ascolto Realtime per ricevere aggiornamenti istantanei quando un collega modifica i dati da qualsiasi rete
 */
export function subscribeToRealtimePatients(onUpdate) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel('realtime_pazienti_sync')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'pazienti' },
      async (payload) => {
        console.log('⚡ [Realtime Supabase] Modifica rilevata da un collega!', payload);
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
