import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import { Loader2 } from 'lucide-react';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const SetPassword = lazy(() => import('./pages/SetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const VerifyOrgEmail = lazy(() => import('./pages/VerifyOrgEmail'));
const SuperadminDashboard = lazy(() => import('./pages/SuperadminDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));
const Security = lazy(() => import('./pages/Security'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));

// User Components
const UserLayout = lazy(() => import('./components/layout/UserLayout'));
const UserDashboard = lazy(() => import('./components/user/UserDashboard'));
const OrganizationsList = lazy(() => import('./components/user/OrganizationsList'));
const OrganizationDetails = lazy(() => import('./components/user/OrganizationDetails'));
const MyAppointments = lazy(() => import('./components/user/MyAppointments'));
const LiveQueue = lazy(() => import('./components/user/LiveQueue'));
const Profile = lazy(() => import('./components/user/Profile'));

import ScrollToTop from './components/ScrollToTop';
import { GoogleOAuthProvider } from '@react-oauth/google';
import TermsGuard from './components/common/TermsGuard';

// Premium Shimmer Loader for Suspense
const PremiumLoader = () => (
  <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="h-16 w-16 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center animate-pulse">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
      <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500 border-2 border-white rounded-full animate-bounce" />
    </div>
    <div className="flex flex-col items-center animate-pulse">
        <p className="text-xl font-black text-slate-900 tracking-tight">Queuify</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimizing Intelligence...</p>
    </div>
  </div>
);



function App() {
  return (
    <GoogleOAuthProvider clientId="147735626144-dk7ea0e72p3lak8tbsi0m1avtumi0h89.apps.googleusercontent.com">
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            <Suspense fallback={<PremiumLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/set-password" element={<SetPassword />} />
                <Route path="/verify-org-email" element={<VerifyOrgEmail />} />
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
                {/* User Dashboard Routes */}
                <Route element={
                  <ProtectedRoute roles={['user']}>
                    <TermsGuard>
                      <UserLayout />
                    </TermsGuard>
                  </ProtectedRoute>
                }>
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/organizations" element={<OrganizationsList />} />
                  <Route path="/organizations/:slug" element={<OrganizationDetails />} />
                  <Route path="/appointments" element={<MyAppointments />} />
                  <Route path="/queue/:appointmentId" element={<LiveQueue />} />
                  <Route path="/profile" element={<Profile />} />
                </Route>

                <Route path="/admin/*" element={
                  <ProtectedRoute role="admin">
                    <TermsGuard>
                      <AdminDashboard />
                    </TermsGuard>
                  </ProtectedRoute>
                } />

                <Route path="/dashboard" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-right" />
          </div>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
