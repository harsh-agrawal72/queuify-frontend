import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';

import AppointmentManager from '../components/admin/AppointmentManager';
import ServiceManagement from '../components/admin/ServiceManagement';
import SlotManagement from '../components/admin/SlotManagement';
import LiveQueue from '../components/admin/LiveQueue';
import AnalyticsPanel from '../components/admin/AnalyticsPanel';
import SettingsPanel from '../components/admin/SettingsPanel';
import OrganizationAbout from '../components/admin/OrganizationAbout';
import AdminReviews from '../components/admin/AdminReviews';

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
                <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminDashboard;
