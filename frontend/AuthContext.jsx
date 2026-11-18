import { createContext, useCallback, useContext, useState } from 'react';
import * as api from '../api/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) =>
  role === 'admin' ? '/admin/dashboard' : role === 'recruiter' ? '/recruiter/dashboard' : '/developer/dashboard';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => api.getCurrent());

  // Re-read the signed-in user and profile after any change.
  const refresh = useCallback(() => setSession(api.getCurrent()), []);

  const signIn = useCallback(async (email, password, admin = false) => {
    const user = await api.login(email, password, { admin });
    setSession(api.getCurrent());
    return user;
  }, []);

  const signUp = useCallback(async (data) => {
    const user = await api.register(data);
    setSession(api.getCurrent());
    return user;
  }, []);

  const signOut = useCallback(() => {
    api.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, profile: session?.profile ?? null, refresh, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
