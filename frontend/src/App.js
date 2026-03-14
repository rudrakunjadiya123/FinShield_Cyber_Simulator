import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CampaignPage from './pages/CampaignPage';
import CampaignDetailPage from './pages/CampaignDetailPage';
import TemplatePage from './pages/TemplatePage';
import UserUploadPage from './pages/UserUploadPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import PhishingDrillPage from './pages/PhishingDrillPage';

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
        path="/analytics"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity', 'analyst']}>
            <AnalyticsDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute roles={['admin', 'cybersecurity', 'analyst']}>
            <LeaderboardPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const AppLayout = () => {
  const { user } = useAuth();
  const isPhishingPage = window.location.pathname.startsWith('/phishing/');

  return (
    <div className="min-h-screen bg-slate-100">
      {user && !isPhishingPage && <Navbar />}
      <AppRoutes />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </Router>
  );
}

export default App;
