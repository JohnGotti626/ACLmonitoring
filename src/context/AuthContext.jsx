import React, { createContext, useContext, useState } from 'react';
import { supabase, isSupabaseConfigured, createAuditLog } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Default logged in as ADMIN Lead Therapist for direct testing
  const [user, setUser] = useState({
    id: 'admin-lead-01',
    email: 'lead.therapist@medical-acl.it',
    user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi' }
  });
  const [role, setRole] = useState('ADMIN');
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

  const login = async (email, password, preferredRole = 'ADMIN') => {
    setUser({
      id: `usr-${Date.now()}`,
      email: email || 'lead.therapist@medical-acl.it',
      user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi' }
    });
    setRole(preferredRole || 'ADMIN');
    setLoading(false);
    return { success: true };
  };

  const logout = async () => {
    // Opzione per resettare o rimanere in test
    setUser({
      id: 'admin-lead-01',
      email: 'lead.therapist@medical-acl.it',
      user_metadata: { nome: 'Dott. Mario', cognome: 'Rossi' }
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
      switchRoleForDemo,
      isSupabaseConfigured,
      recentAuditLogs
    }}>
      {children}
    </AuthContext.Provider>
  );
};
