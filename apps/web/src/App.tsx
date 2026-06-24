import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Calculator } from './pages/Calculator';
import { Materials } from './pages/Materials';
import { Reports } from './pages/Reports';
import { Sales } from './pages/Sales';
import { Realtors } from './pages/Realtors';
import { Settings } from './pages/Settings';
import { ChatPage } from './pages/ChatPage';

export function App() {
  return (
    <Routes>
      {/* Ochiq sahifalar */}
      <Route path="/" element={<Landing />} />
      <Route path="/kirish" element={<Login />} />

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
        <Route path="kalkulyator" element={<Calculator />} />
        <Route path="materiallar" element={<Materials />} />
        <Route path="hisobotlar" element={<Reports />} />
        <Route path="sotuvlar" element={<Sales />} />
        <Route path="maklerlar" element={<Realtors />} />
        <Route path="sozlamalar" element={<Settings />} />
        <Route path="ai" element={<ChatPage />} />
      </Route>
    </Routes>
  );
}
