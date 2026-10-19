import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const isClientUrl = () => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';
    if (
      params.get('portal') === 'client' ||
      hash.includes('access_token=') ||
      hash.includes('type=magiclink') ||
      hash.includes('type=recovery')
    ) {
      try {
        sessionStorage.setItem('acl_client_only', 'true');
      } catch (_) {}
      return true;
    }
    try {
      return sessionStorage.getItem('acl_client_only') === 'true';
    } catch (_) {
      return false;
    }
  };

  // Default logged in as ADMIN Lead Therapist SOLO se non proviene da link/sessione cliente
  const [user, setUser] = useState(() =>
    isClientUrl()
      ? null
      : {
          id: 'admin-lead-01',
          email: 'lead.therapist@medical-acl.it',
          user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: 'ADMIN' }
        }
  );
  const [role, setRole] = useState(() => (isClientUrl() ? 'patient' : 'ADMIN')); // 'ADMIN' | 'STAFF' | 'patient'
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

  // Ascolta il rientro dal Magic Link (OTP via Email) di Supabase:
  // Chiunque acceda da Magic Link è SEMPRE e SOLO un Cliente ('patient') e non può mai accedere al gestionale
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession?.user) {
        try {
          sessionStorage.setItem('acl_client_only', 'true');
        } catch (_) {}
        setSession(activeSession);
        setUser(activeSession.user);
        setRole('patient');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (activeSession?.user) {
        try {
          sessionStorage.setItem('acl_client_only', 'true');
        } catch (_) {}
        setSession(activeSession);
        setUser(activeSession.user);
        setRole('patient');
      }
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
    if (session || isClientUrl()) {
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
    if (isClientUrl() || role === 'patient') {
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
    if (session || isClientUrl() || role === 'patient') return;
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
