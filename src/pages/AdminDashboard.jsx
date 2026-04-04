import { Routes, Route, Navigate } from 'react-router-dom';
import React, { lazy } from 'react';
import AdminLayout from '../layouts/AdminLayout';

const AppointmentManager = lazy(() => import('../components/admin/AppointmentManager'));
const ServiceManagement = lazy(() => import('../components/admin/ServiceManagement'));
const SlotManagement = lazy(() => import('../components/admin/SlotManagement'));
const LiveQueue = lazy(() => import('../components/admin/LiveQueue'));
const AnalyticsPanel = lazy(() => import('../components/admin/AnalyticsPanel'));
const SettingsPanel = lazy(() => import('../components/admin/SettingsPanel'));
const OrganizationAbout = lazy(() => import('../components/admin/OrganizationAbout'));
const AdminReviews = lazy(() => import('../components/admin/AdminReviews'));
const SupportInbox = lazy(() => import('./dashboard/SupportInbox'));
const WalletDashboard = lazy(() => import('./admin/WalletDashboard'));


const AdminDashboard = () => {
    return (
        <React.Suspense fallback={
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="p-8 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <div className="h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Dashboard...</p>
                </div>
            </div>
        }>
            <Routes>
                <Route element={<AdminLayout />}>
                    <Route index element={<Navigate to="analytics" replace />} />
                    <Route path="analytics" element={<AnalyticsPanel />} />
                    <Route path="services" element={<ServiceManagement />} />
                    <Route path="slots" element={<SlotManagement />} />
                    <Route path="appointments" element={<AppointmentManager />} />
                    <Route path="queue" element={<LiveQueue />} />
                    <Route path="about" element={<OrganizationAbout />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="settings" element={<SettingsPanel />} />
                    <Route path="inbox" element={<SupportInbox />} />
                    <Route path="wallet" element={<WalletDashboard />} />
                    <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
                </Route>
            </Routes>
        </React.Suspense>
    );
};

export default AdminDashboard;
