import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import BasketballLoader from '../common/BasketballLoader';

type RequireAdminProps = {
  children: ReactNode;
};

export default function RequireAdmin({ children }: RequireAdminProps) {
  const { isAdmin, loading, userId } = useIsAdmin();

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <BasketballLoader size="lg" />
      </main>
    );
  }

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
