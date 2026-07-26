import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CampaignPage from './pages/CampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import TemplatePage from './pages/TemplatePage';
import UserUploadPage from './pages/UserUploadPage';
import ProfilePage from './pages/ProfilePage';
import EmployeeReportsPage from './pages/EmployeeReportsPage';

import PhishingDrillPage from './pages/PhishingDrillPage';
import LandingPage from './pages/LandingPage';

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />

      {/* Phishing drill page - no auth required (target users click the link from email) */}
      <Route path="/phishing/:token" element={<PhishingDrillPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity', 'analyst', 'employee']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campaigns"
        element={
          <ProtectedRoute roles={['admin']}>
            <CampaignPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/campaigns/:id"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity', 'analyst']}>
            <CampaignDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/templates"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity']}>
            <TemplatePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute roles={['admin']}>
            <UserUploadPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/employee-reports"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity']}>
            <EmployeeReportsPage />
          </ProtectedRoute>
        }
      />




      <Route
        path="/profile"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity', 'analyst', 'employee']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const AppLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isPublicPage = location.pathname === '/' || location.pathname.startsWith('/phishing/');

  return (
    <div className="min-h-screen text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      {user && !isPublicPage && <Navbar />}
      <AppRoutes />
    </div>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
