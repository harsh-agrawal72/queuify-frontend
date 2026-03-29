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
    );
};

export default AdminDashboard;
