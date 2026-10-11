import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AiStatusProvider } from './context/AiStatusContext';

import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MyPlantsPage from './pages/MyPlantsPage';
import PlantDoctorPage from './pages/PlantDoctorPage';
import GardeningAssistantPage from './pages/GardeningAssistantPage';
import GardenPlannerPage from './pages/GardenPlannerPage';
import CareCalendarPage from './pages/CareCalendarPage';
import TouchGrassPage from './pages/TouchGrassPage';
import AnalyticsPage from './pages/AnalyticsPage';

import './styles/global.css';
import './styles/components.css';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AiStatusProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Marketing & Auth Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Application Routes */}
                <Route
                  element={
                    <ProtectedRoute>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/plants" element={<MyPlantsPage />} />
                  <Route path="/doctor" element={<PlantDoctorPage />} />
                  <Route path="/assistant" element={<GardeningAssistantPage />} />
                  <Route path="/planner" element={<GardenPlannerPage />} />
                  <Route path="/calendar" element={<CareCalendarPage />} />
                  <Route path="/challenge" element={<TouchGrassPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AiStatusProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
