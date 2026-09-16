import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  'https://jvuinqtpnubsozrnamze.supabase.co';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  'sb_publishable_Fxas-EXPeF_KXZtu9lj6eg_6Snfm6zY';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('your-supabase-project-url') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Registra un evento di audit log su Supabase (es: Login, Accesso, Cambiamento dati)
 */
export async function createAuditLog({ userId, userEmail, role, event, details = {} }) {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT LOG ${timestamp}] Event: ${event} | User: ${userEmail} (${role})`, details);

  try {
    const { data, error } = await supabase.from('audit_logs').insert([
      {
        user_id: userId || null,
        user_email: userEmail,
        ruolo_utente: role,
        evento: event,
        dettagli: details,
        created_at: timestamp
      }
    ]);

    if (error) {
      console.warn('Errore salvataggio audit_log su Supabase:', error.message);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error('Eccezione audit log:', err);
    return { success: false, error: err };
  }
}
