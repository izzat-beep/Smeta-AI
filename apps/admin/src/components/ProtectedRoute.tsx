import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '../lib/auth';
import { ChangePassword } from '../pages/ChangePassword';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { role, mustChangePassword, loading } = useAdminAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#16181D]">
        <div className="w-10 h-10 border-2 border-[#5555E7]/30 border-t-[#5555E7] rounded-full animate-spin" />
      </div>
    );
  }
  if (!role) return <Navigate to="/kirish" replace />;
  // Vendor birinchi kirishda parolni o'zgartirishi shart.
  if (mustChangePassword) return <ChangePassword />;
  return <>{children}</>;
}
