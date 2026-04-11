import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AssistantConfigPage from './pages/AssistantConfigPage';
import AssistantFaqPage from './pages/AssistantFaqPage';
import AssistantPromptPage from './pages/AssistantPromptPage';
import AssistantSessionsPage from './pages/AssistantSessionsPage';

function AppShell() {
  const { status } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={status === 'authenticated' ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant-config"
        element={
          <ProtectedRoute>
            <AssistantConfigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant-faq"
        element={
          <ProtectedRoute>
            <AssistantFaqPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant-prompt"
        element={
          <ProtectedRoute>
            <AssistantPromptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant-sessions"
        element={
          <ProtectedRoute>
            <AssistantSessionsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
