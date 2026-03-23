import { createBrowserRouter, RouterProvider } from 'react-router';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import AddLoanPage from './pages/AddLoanPage';
import EditLoanPage from './pages/EditLoanPage';
import LoanDetailPage from './pages/LoanDetailPage';
import StrategiesPage from './pages/StrategiesPage';
import SettingsPage from './pages/SettingsPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'add-loan', element: <AddLoanPage /> },
      { path: 'edit-loan/:id', element: <EditLoanPage /> },
      { path: 'loan/:id', element: <LoanDetailPage /> },
      { path: 'strategies', element: <StrategiesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
