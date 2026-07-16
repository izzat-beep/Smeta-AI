import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PageLoader } from './components/PageLoader';

// Kod bo'linishi (route-lazy): har sahifa alohida chunk bo'lib, faqat kerak
// bo'lganda yuklanadi. Avval barcha 17 sahifa bitta ~930 KB bundle'da eager
// yuklanardi — mobil 3G/4G'da birinchi ochilish 8-15 soniya edi (audit #3).
// Sahifalar named-export bo'lgani uchun .then() bilan default'ga o'giramiz.
const Landing = lazy(() => import('./pages/Landing').then((m) => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Privacy = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal').then((m) => ({ default: m.Terms })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects').then((m) => ({ default: m.Projects })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then((m) => ({ default: m.ProjectDetail })));
const Calculator = lazy(() => import('./pages/Calculator').then((m) => ({ default: m.Calculator })));
const Materials = lazy(() => import('./pages/Materials').then((m) => ({ default: m.Materials })));
const MaterialDetail = lazy(() => import('./pages/MaterialDetail').then((m) => ({ default: m.MaterialDetail })));
const Cart = lazy(() => import('./pages/Cart').then((m) => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then((m) => ({ default: m.Checkout })));
const Payment = lazy(() => import('./pages/Payment').then((m) => ({ default: m.Payment })));
const Reports = lazy(() => import('./pages/Reports').then((m) => ({ default: m.Reports })));
const Sales = lazy(() => import('./pages/Sales').then((m) => ({ default: m.Sales })));
const Realtors = lazy(() => import('./pages/Realtors').then((m) => ({ default: m.Realtors })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));
const ChatPage = lazy(() => import('./pages/ChatPage').then((m) => ({ default: m.ChatPage })));

export function App() {
  return (
    <Suspense fallback={<PageLoader fullScreen />}>
      <Routes>
        {/* Ochiq sahifalar */}
        <Route path="/" element={<Landing />} />
        <Route path="/kirish" element={<Login />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />

        {/* Himoyalangan ilova */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="loyihalar" element={<Projects />} />
          <Route path="loyihalar/:id" element={<ProjectDetail />} />
          <Route path="kalkulyator" element={<Calculator />} />
          <Route path="materiallar" element={<Materials />} />
          <Route path="materiallar/:id" element={<MaterialDetail />} />
          <Route path="savat" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="tolov/:orderId" element={<Payment />} />
          <Route path="hisobotlar" element={<Reports />} />
          <Route path="sotuvlar" element={<Sales />} />
          <Route path="maklerlar" element={<Realtors />} />
          <Route path="sozlamalar" element={<Settings />} />
          <Route path="ai" element={<ChatPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
