import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const checkDeviceAccess = () => {
    if (typeof window === 'undefined') return { isClientOnly: false, isTherapistDevice: true };
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    const isPortalParam =
      params.get('portal') === 'client' ||
      hash.includes('access_token=') ||
      hash.includes('type=magiclink') ||
      hash.includes('type=recovery');

    try {
      // Se accedi con ?admin=1 o apri direttamente il gestionale per la prima volta (senza ?portal=client),
      // il tuo telefono/PC viene memorizzato automaticamente come Dispositivo Terapista
      if (params.get('admin') === '1') {
        localStorage.setItem('acl_therapist_device', 'true');
        localStorage.removeItem('acl_client_only');
        return { isClientOnly: false, isTherapistDevice: true };
      }

      const isTherapistDevice = localStorage.getItem('acl_therapist_device') === 'true';

      if (isPortalParam) {
        if (params.get('patientId')) {
          localStorage.setItem('acl_client_patient_id', params.get('patientId'));
        }
        // Se NON è il dispositivo del Terapista, blocca permanentemente il dispositivo come Cliente
        if (!isTherapistDevice) {
          localStorage.setItem('acl_client_only', 'true');
          return { isClientOnly: true, isTherapistDevice: false };
        }
        // Se è il dispositivo del Terapista che sta visualizzando ?portal=client, mostra la vista cliente temporanea
        return { isClientOnly: false, isTherapistDevice: true, viewingClientPortal: true };
      }

      // Se l'utente apre l'URL principale (senza ?portal=client):
      // Se era un cliente (acl_client_only = true e non dispositivo Terapista), resta bloccato come cliente
      if (localStorage.getItem('acl_client_only') === 'true' && !isTherapistDevice) {
        return { isClientOnly: true, isTherapistDevice: false };
      }

      // Altrimenti è il Terapista che accede all'URL principale: memorizza automaticamente il dispositivo!
      localStorage.setItem('acl_therapist_device', 'true');
      return { isClientOnly: false, isTherapistDevice: true };
    } catch (_) {
      return { isClientOnly: isPortalParam, isTherapistDevice: !isPortalParam };
    }
  };

  const initialAccess = checkDeviceAccess();

  // Default logged in as ADMIN Lead Therapist automaticamente senza password per il dispositivo Terapista
  const [user, setUser] = useState(() =>
    initialAccess.isClientOnly
      ? null
      : {
          id: 'admin-lead-01',
          email: 'lead.therapist@medical-acl.it',
          user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: 'ADMIN' }
        }
  );
  const [role, setRole] = useState(() => (initialAccess.isClientOnly ? 'patient' : 'ADMIN')); // 'ADMIN' | 'STAFF' | 'patient'
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentAuditLogs, setRecentAuditLogs] = useState([
    {
      id: Date.now(),
      timestamp: new Date().toLocaleString('it-IT'),
      email: 'lead.therapist@medical-acl.it',
      role: 'ADMIN',
      event: 'DIRECT_ADMIN_ACCESS'
    }
  ]);

  const AUTHORIZED_STAFF_EMAILS = [
    'ceresoli.andrea@gmail.com',
    'andreagotti96@outlook.it',
    'benemapelli@gmail.com',
    'nicolanasatti@gmail.com',
    'nasattialice@gmail.com'
  ];

  // Ascolta il rientro dal Magic Link (OTP via Email) di Supabase:
  // - Se l'email è in staff_users / AUTHORIZED_STAFF_EMAILS, autorizza come ADMIN (Terapista).
  // - Se il dispositivo è di un Cliente, forza role = 'patient'.
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const handleSession = async (activeSession) => {
      if (!activeSession?.user) return;
      const normalizedEmail = (activeSession.user.email || '').trim().toLowerCase();

      // 1. Controllo immediato email Terapisti autorizzati (lista + tabella staff_users + profili_utenti)
      if (normalizedEmail) {
        let isAuthorizedStaff = AUTHORIZED_STAFF_EMAILS.includes(normalizedEmail);

        if (!isAuthorizedStaff) {
          const { data: staffRow } = await supabase
            .from('staff_users')
            .select('email')
            .ilike('email', normalizedEmail)
            .maybeSingle();
          if (staffRow?.email) isAuthorizedStaff = true;
        }

        if (!isAuthorizedStaff) {
          const { data: staffProfile } = await supabase
            .from('profili_utenti')
            .select('ruolo')
            .ilike('email', normalizedEmail)
            .maybeSingle();
          if (staffProfile && ['ADMIN', 'STAFF'].includes((staffProfile.ruolo || '').toUpperCase())) {
            isAuthorizedStaff = true;
          }
        }

        if (isAuthorizedStaff) {
          try {
            localStorage.setItem('acl_therapist_device', 'true');
            localStorage.removeItem('acl_client_only');
          } catch (_) {}
          setSession(activeSession);
          setUser(activeSession.user);
          setRole('ADMIN');
          return;
        }
      }

      const access = checkDeviceAccess();
      if (access.isTherapistDevice && !access.viewingClientPortal) {
        // Il Terapista sta aprendo il gestionale sul proprio dispositivo: disconnette l'eventuale sessione Magic Link di test
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setRole('ADMIN');
        return;
      }

      setSession(activeSession);
      setUser(activeSession.user);
      if (!access.isTherapistDevice) {
        setRole('patient');
      }
    };

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      handleSession(activeSession);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      handleSession(activeSession);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  /**
   * Invia il Magic Link (OTP via Email) al paziente tramite Supabase Auth
   */
  const sendMagicLink = async (email, patientId = null) => {
    if (!email) return { success: false, error: 'Inserisci un indirizzo email valido.' };
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/?portal=client${patientId ? `&patientId=${patientId}` : ''}`;
      const { data, error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            role: 'patient',
            patient_id: patientId
          }
        }
      });
      setLoading(false);
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data, redirectUrl };
    } catch (err) {
      setLoading(false);
      return { success: false, error: err.message || 'Errore invio Magic Link' };
    }
  };

  const login = async (email, password, preferredRole = 'ADMIN') => {
    if (checkDeviceAccess().isClientOnly) {
      setRole('patient');
      return { success: false, error: 'Accesso gestionale disabilitato per il profilo cliente.' };
    }
    setUser({
      id: `usr-${Date.now()}`,
      email: email || 'lead.therapist@medical-acl.it',
      user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: preferredRole }
    });
    setRole(preferredRole || 'ADMIN');
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut().catch(() => {});
    }
    setSession(null);
    if (checkDeviceAccess().isClientOnly || role === 'patient') {
      setUser(null);
      setRole('patient');
      return;
    }
    setUser({
      id: 'admin-lead-01',
      email: 'lead.therapist@medical-acl.it',
      user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: 'ADMIN' }
    });
    setRole('ADMIN');
  };

  const switchRoleForDemo = (newRole) => {
    if (checkDeviceAccess().isClientOnly || role === 'patient') return;
    setRole(newRole);
  };

  return (
    <AuthContext.Provider value={{
      user,
      role,
      session,
      loading,
      login,
      logout,
      sendMagicLink,
      switchRoleForDemo,
      isSupabaseConfigured,
      recentAuditLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};
