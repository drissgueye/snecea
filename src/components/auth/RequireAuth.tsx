import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiRequest, tokenStorage } from '@/lib/api';

type Props = {
  children: JSX.Element;
};

export default function RequireAuth({ children }: Props) {
  const location = useLocation();
  const token = tokenStorage.getAccess();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setIsAuthed(false);
        setIsChecking(false);
        return;
      }
      try {
        await apiRequest('/profils/me/');
        setIsAuthed(true);
      } catch {
        tokenStorage.clear();
        setIsAuthed(false);
      } finally {
        setIsChecking(false);
      }
    };

    verify();
  }, [token]);

  if (isChecking) {
    return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>;
  }

  if (!isAuthed) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
