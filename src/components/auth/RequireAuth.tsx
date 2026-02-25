import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiRequest, tokenStorage } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { AuthProfile } from '@/contexts/AuthContext';

type Props = {
  children: JSX.Element;
};

export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  const { setProfile } = useAuth();
  const token = tokenStorage.getAccess();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setProfile(null);
        setIsAuthed(false);
        setIsChecking(false);
        return;
      }
      try {
        const data = await apiRequest<AuthProfile>('/profils/me/');
        setProfile(data);
        setIsAuthed(true);
      } catch {
        tokenStorage.clear();
        setProfile(null);
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };

    verify();
  }, [token, setProfile]);

  if (isChecking) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
