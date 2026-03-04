
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { worker } from '../lib/worker';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: 'client' | 'admin';
}

interface AuthState {
  user: { uid: string } | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ uid: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const userId = localStorage.getItem('auth_user_id');

    if (storedToken && userId) {
      setUser({ uid: userId });
      worker.post('/get-user-profile', { userId })
        .then(res => res.json())
        .then(profile => {
          setProfile(profile);
          setLoading(false);
        })
        .catch(() => {
          signOut();
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await worker.post('/login', { email, password });
      const { token, profile } = await response.json();

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user_id', profile.id);

      setUser({ uid: profile.id });
      setProfile(profile);

      if (profile.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/client');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await worker.post('/signup', { email, password, fullName, phone });
      const { token, profile } = await response.json();

      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user_id', profile.id);

      setUser({ uid: profile.id });
      setProfile(profile);
      navigate('/dashboard/client');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user_id');
    setUser(null);
    setProfile(null);
    navigate('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (requireAuth = false, requiredRole?: 'admin' | 'client') => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  useEffect(() => {
    if (!context.loading) {
      if (requireAuth && !context.user) {
        navigate('/auth');
      }
      if (requiredRole && context.profile?.role !== requiredRole) {
        navigate(context.profile?.role === 'admin' ? '/dashboard/admin' : '/dashboard/client');
      }
    }
  }, [context.loading, context.user, context.profile, requireAuth, requiredRole, navigate]);

  return context;
};
