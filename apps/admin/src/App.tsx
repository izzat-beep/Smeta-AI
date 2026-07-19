import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from './components/AdminLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAdminAuth } from './lib/auth';
import { Login } from './pages/Login';
import { Stats } from './pages/Stats';
import { Tenants } from './pages/Tenants';
import { TenantDetail } from './pages/TenantDetail';
import { Invoices } from './pages/Invoices';
import { Users } from './pages/Users';
import { Vendors } from './pages/Vendors';
import { VendorProducts } from './pages/VendorProducts';
import { VendorOrders } from './pages/VendorOrders';
import { Security } from './pages/Security';

// Bosh sahifa rolga qarab: vendor -> mahsulotlar, admin -> statistika.
function IndexRoute() {
  const { isVendor } = useAdminAuth();
  return isVendor ? <Navigate to="/mahsulotlar" replace /> : <Stats />;
}

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
        <Route index element={<IndexRoute />} />
        {/* Super admin / support bo'limlari */}
        <Route path="mijozlar" element={<Tenants />} />
        <Route path="mijozlar/:id" element={<TenantDetail />} />
        <Route path="hisob-fakturalar" element={<Invoices />} />
        <Route path="foydalanuvchilar" element={<Users />} />
        <Route path="sotuvchilar" element={<Vendors />} />
        <Route path="xavfsizlik" element={<Security />} />
        {/* Vendor kabineti */}
        <Route path="mahsulotlar" element={<VendorProducts />} />
        <Route path="buyurtmalar" element={<VendorOrders />} />
      </Route>
    </Routes>
  );
}
