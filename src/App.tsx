import { HashRouter, Routes, Route } from 'react-router';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import AddLoanPage from './pages/AddLoanPage';
import EditLoanPage from './pages/EditLoanPage';
import LoanDetailPage from './pages/LoanDetailPage';
import StrategiesPage from './pages/StrategiesPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="add-loan" element={<AddLoanPage />} />
          <Route path="edit-loan/:id" element={<EditLoanPage />} />
          <Route path="loan/:id" element={<LoanDetailPage />} />
          <Route path="strategies" element={<StrategiesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
