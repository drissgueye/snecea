import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type Props = {
  children: JSX.Element;
};

/**
 * Restreint l'accès aux utilisateurs ayant le rôle administrateur.
 * Redirige vers le tableau de bord si l'utilisateur n'est pas admin.
 */
export default function RequireAdmin({ children }: Props) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
