import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Default logged in as ADMIN Lead Therapist for direct clinical use
  const [user, setUser] = useState({
    id: 'admin-lead-01',
    email: 'lead.therapist@medical-acl.it',
    user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: 'ADMIN' }
  });
  const [role, setRole] = useState('ADMIN'); // 'ADMIN' | 'STAFF' | 'patient'
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

  // Ascolta il rientro dal Magic Link (OTP via Email) di Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      if (activeSession?.user) {
        setSession(activeSession);
        setUser(activeSession.user);
        const userRole = activeSession.user.user_metadata?.role || 'patient';
        setRole(userRole);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      if (activeSession?.user) {
        setSession(activeSession);
        setUser(activeSession.user);
        const userRole = activeSession.user.user_metadata?.role || 'patient';
        setRole(userRole);
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
    setUser({
      id: 'admin-lead-01',
      email: 'lead.therapist@medical-acl.it',
      user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi', role: 'ADMIN' }
    });
    setRole('ADMIN');
  };

  const switchRoleForDemo = (newRole) => {
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
