import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/UserManagement';
import { LeadManagement } from './pages/LeadManagement';
import { CustomerManagement } from './pages/CustomerManagement';
import { ContactManagement } from './pages/ContactManagement';
import { CallManagement } from './pages/CallManagement';
import { CommunicationManagement } from './pages/CommunicationManagement';
import { TaskManagement } from './pages/TaskManagement';
import { FollowUpManagement } from './pages/FollowUpManagement';
import { SalesPipeline } from './pages/SalesPipeline';
import { ProductManagement } from './pages/ProductManagement';
import { NotesActivities } from './pages/NotesActivities';
import { AppointmentManagement } from './pages/AppointmentManagement';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { Profile } from './pages/Profile';

import { UpcomingMeetingAlertBanner } from './components/UpcomingMeetingAlertBanner';
import { RefreshFeedbackOverlay } from './components/common/RefreshFeedbackOverlay';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <RefreshFeedbackOverlay />
      <Navbar />
      <UpcomingMeetingAlertBanner />
      <div className="flex-1 flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <ReportsAnalytics />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pipeline"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <SalesPipeline />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <ProductManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <LeadManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <CustomerManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/contacts"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <ContactManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/calls"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <CallManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/communications"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <CommunicationManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <TaskManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/followups"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <FollowUpManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/notes-activities"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <NotesActivities />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_EMPLOYEE']}>
                <AppLayout>
                  <AppointmentManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback & Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
