import { Routes, Route } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Stats } from './pages/Stats';
import { Tenants } from './pages/Tenants';
import { TenantDetail } from './pages/TenantDetail';
import { Invoices } from './pages/Invoices';
import { Users } from './pages/Users';

export function App() {
  return (
    <Routes>
      <Route path="/kirish" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Stats />} />
        <Route path="mijozlar" element={<Tenants />} />
        <Route path="mijozlar/:id" element={<TenantDetail />} />
        <Route path="hisob-fakturalar" element={<Invoices />} />
        <Route path="foydalanuvchilar" element={<Users />} />
      </Route>
    </Routes>
  );
}
