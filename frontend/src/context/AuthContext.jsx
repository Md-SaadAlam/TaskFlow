import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/endpoints';
import { TOKEN_KEY } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check for an existing login

  // On first load: if a token exists, ask the backend who it belongs to (persistent login).
  useEffect(() => {
    async function restoreLogin() {
      if (!localStorage.getItem(TOKEN_KEY)) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.me();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    }
    restoreLogin();
  }, []);

  // The API client fires this event when the server rejects our token.
  useEffect(() => {
    const handleExpired = () => setUser(null);
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  async function login(email, password, accountType) {
    const data = await authApi.login({ email, password, accountType });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }

  async function register(body) {
    const data = await authApi.register(body);
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
