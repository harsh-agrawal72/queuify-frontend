import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SetPassword from './pages/SetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SuperadminDashboard from './pages/SuperadminDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import CookiePolicy from './pages/CookiePolicy';
import Security from './pages/Security';
import About from './pages/About';
import Contact from './pages/Contact';
// User Components
import UserLayout from './components/layout/UserLayout';
import UserDashboard from './components/user/UserDashboard';
import OrganizationsList from './components/user/OrganizationsList';
import OrganizationDetails from './components/user/OrganizationDetails';
import MyAppointments from './components/user/MyAppointments';
import LiveQueue from './components/user/LiveQueue';
import Profile from './components/user/Profile';
import ScrollToTop from './components/ScrollToTop';

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="147735626144-dk7ea0e72p3lak8tbsi0m1avtumi0h89.apps.googleusercontent.com">
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/set-password" element={<SetPassword />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              <Route path="/security" element={<Security />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Role-specific dashboards */}
              <Route path="/superadmin/*" element={
                <ProtectedRoute role="superadmin">
                  <SuperadminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* User Dashboard Routes */}
              <Route element={
                <ProtectedRoute roles={['user']}>
                  <UserLayout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/organizations" element={<OrganizationsList />} />
                <Route path="/organizations/:slug" element={<OrganizationDetails />} />
                <Route path="/appointments" element={<MyAppointments />} />
                <Route path="/queue/:appointmentId" element={<LiveQueue />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/login" replace />} />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
