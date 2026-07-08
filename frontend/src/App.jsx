import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, ROLE_HOME } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import EventsList from './pages/fan/EventsList';
import EventDetail from './pages/fan/EventDetail';
import Checkout from './pages/fan/Checkout';
import MyTickets from './pages/fan/MyTickets';

import BoxOffice from './pages/boxoffice/BoxOffice';
import GateScanner from './pages/gate/GateScanner';

import AdminDashboard from './pages/admin/AdminDashboard';
import ManageEvents from './pages/admin/ManageEvents';
import Reports from './pages/admin/Reports';
import ManageUsers from './pages/admin/ManageUsers';

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />

        {/* Fan */}
        <Route path="/events" element={<ProtectedRoute roles={['fan']}><EventsList /></ProtectedRoute>} />
        <Route path="/events/:id" element={<ProtectedRoute roles={['fan']}><EventDetail /></ProtectedRoute>} />
        <Route path="/checkout/:id" element={<ProtectedRoute roles={['fan']}><Checkout /></ProtectedRoute>} />
        <Route path="/my-tickets" element={<ProtectedRoute roles={['fan']}><MyTickets /></ProtectedRoute>} />

        {/* Box Office */}
        <Route path="/box-office" element={<ProtectedRoute roles={['box_office_staff']}><BoxOffice /></ProtectedRoute>} />

        {/* Gate */}
        <Route path="/gate" element={<ProtectedRoute roles={['gate_scanner_officer', 'stadium_admin']}><GateScanner /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute roles={['stadium_admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/events" element={<ProtectedRoute roles={['stadium_admin']}><ManageEvents /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['stadium_admin']}><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['stadium_admin', 'sport_commission_officer']}><Reports /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
