import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import NewBill from './pages/NewBill';
import Invoices from './pages/Invoices';
import InvoiceDetail from './pages/InvoiceDetail';
import Customers from './pages/Customers';
import Purchases from './pages/Purchases';
import Suppliers from './pages/Suppliers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import WorkerStock from './pages/WorkerStock';
import './styles/global.css';

const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
};

// Worker only sees stock update page
const WorkerRoute = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'worker') return <Navigate to="/worker/stock" replace />;
  return children;
};

const WorkerOnly = ({ children }) => {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'worker') return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1a1714', color: '#e8ddd0', border: '1px solid #2e2924' },
            success: { iconTheme: { primary: '#4caf82', secondary: '#1a1714' } },
            error: { iconTheme: { primary: '#e05050', secondary: '#1a1714' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Worker route — no sidebar, standalone page */}
          <Route path="/worker/stock" element={<WorkerOnly><WorkerStock /></WorkerOnly>} />
          {/* Admin/manager routes */}
          <Route path="/" element={<WorkerRoute><Layout /></WorkerRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="billing/new" element={<NewBill />} />
            <Route path="billing" element={<Invoices />} />
            <Route path="billing/:id" element={<InvoiceDetail />} />
            <Route path="customers" element={<Customers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
