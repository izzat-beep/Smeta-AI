import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg)] text-[#5555E7]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#5555E7]/30 border-t-[#5555E7] rounded-full animate-spin" />
          <span className="text-sm text-[var(--c-muted)]">Yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/kirish" replace />;
  return <>{children}</>;
}
