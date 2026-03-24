import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import InfoTooltip from '../common/InfoTooltip';
import {
    Save,
    Building2,
    Mail,
    Phone,
    MapPin,
    Clock,
    Bell,
    Shield,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Users,
    UserPlus,
    Trash2,
    AlertTriangle,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SettingsPanel = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const { openProfileModal } = useOutletContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    // Delete org states
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deletingOrg, setDeletingOrg] = useState(false);
    const [orgName, setOrgName] = useState('');

    const [admins, setAdmins] = useState([]);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviting, setInviting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        openTime: '09:00',
        closeTime: '17:00',
        queue_mode_default: 'CENTRAL'
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newBookingNotify: true
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.get('/admin/org');
                if (res.data) {
                    setFormData({
                        name: res.data.name || '',
                        email: res.data.contact_email || res.data.email || '',
                        phone: res.data.phone || '',
                        address: res.data.address || '',
                        openTime: res.data.open_time || '09:00',
                        closeTime: res.data.close_time || '17:00',
                        queue_mode_default: res.data.queue_mode_default || 'CENTRAL'
                    });
                    setOrgName(res.data.name || '');
                    setNotifications({
                        emailAlerts: res.data.email_notification ?? true,
                        newBookingNotify: res.data.new_booking_notification ?? true
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast.error(t('settings.load_failed', 'Failed to load organization details'));
            } finally {
                setLoading(false);
            }
        };

        const fetchAdmins = async () => {
            try {
                const res = await api.get('/admin/admins');
                setAdmins(res.data);
            } catch (error) {
                console.error("Failed to fetch admins", error);
            }
        };

        fetchSettings();
        fetchAdmins();
    }, []);

    const handleInviteAdmin = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await api.post('/admin/admins/invite', { email: inviteEmail, name: inviteName });
            toast.success(t('settings.admins.invite_success', 'Admin invited successfully'));
            setAdmins([res.data, ...admins]);
            setInviteEmail('');
            setInviteName('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('settings.admins.invite_failed', 'Failed to invite admin'));
        } finally {
            setInviting(false);
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!window.confirm(t('settings.admins.remove_confirm', 'Are you sure you want to remove this admin?'))) return;
        try {
            await api.delete(`/admin/admins/${adminId}`);
            toast.success(t('settings.admins.remove_success', 'Admin removed'));
            setAdmins(admins.filter(a => a.id !== adminId));
        } catch (error) {
            toast.error(error.response?.data?.message || t('settings.admins.remove_failed', 'Failed to remove admin'));
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/admin/org', {
                name: formData.name,
                contactEmail: formData.email,
                phone: formData.phone,
                address: formData.address,
                openTime: formData.openTime,
                closeTime: formData.closeTime,
                queue_mode_default: formData.queue_mode_default,
                email_notification: notifications.emailAlerts,
                new_booking_notification: notifications.newBookingNotify
            });
            toast.success(t('settings.save_success', "Settings updated successfully"));
        } catch (error) {
            console.error(error);
            toast.error(t('settings.save_failed', "Failed to update settings"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('settings.general.title', 'General Information')}</h2>
                            <p className="text-sm text-gray-500">{t('settings.general.subtitle', 'Update your public facing business details.')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" /> {t('settings.general.org_name', 'Organization Name')}
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" /> {t('settings.general.email', 'Support Email')}
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    disabled
                                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" /> {t('settings.general.phone', 'Phone Number')}
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="+91 "
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400" /> {t('settings.general.address', 'Address')}
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                    </div>
                );
            case 'hours':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-1.5">
                                Business Hours
                                <InfoTooltip text={t('settings.hours.tooltip', "Global operating timings for your organization. Bookings can only be made within these hours.")} />
                            </h2>
                            <p className="text-sm text-gray-500">{t('settings.hours.subtitle', "Manage your operating timings.")}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 max-w-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.hours.open', 'Open Time')}</label>
                                <input
                                    type="time"
                                    name="openTime"
                                    value={formData.openTime}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('settings.hours.close', 'Close Time')}</label>
                                <input
                                    type="time"
                                    name="closeTime"
                                    value={formData.closeTime}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'notifications':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('settings.notifications.title', 'Notifications')}</h2>
                            <p className="text-sm text-gray-500">{t('settings.notifications.subtitle', 'Control how you receive alerts.')}</p>
                        </div>
                        <div className="space-y-4 max-w-lg">
                            {Object.entries(notifications).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700 font-medium capitalize">
                                            {key === 'emailAlerts' ? t('settings.notifications.email', 'Email Alerts') : t('settings.notifications.new_booking', 'New Booking Notify')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))}
                                        className={`transition-colors ${val ? 'text-indigo-600' : 'text-gray-300'}`}
                                    >
                                        {val ? <ToggleRight className="h-8 w-8" /> : <ToggleLeft className="h-8 w-8" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('settings.security.title', 'Security Settings')}</h2>
                            <p className="text-sm text-gray-500">{t('settings.security.subtitle', 'Manage account security and access.')}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4">
                            <Shield className="h-6 w-6 text-orange-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-orange-800">{t('settings.security.password_title', 'Password & Authentication')}</h3>
                                <p className="text-sm text-orange-700 mt-1">{t('settings.security.password_desc', 'To change your password or update security settings, please visit your user profile.')}</p>
                                <button
                                    type="button"
                                    onClick={openProfileModal}
                                    className="mt-3 text-sm font-medium text-orange-900 bg-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
                                >
                                    Go to Profile
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'admins':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('settings.admins.title', 'Admin Management')}</h2>
                            <p className="text-sm text-gray-500">{t('settings.admins.subtitle', 'Invite and manage administrators for your organization.')}</p>
                        </div>

                        {/* Invite Form */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-indigo-500" /> {t('settings.admins.invite_new', 'Invite New Admin')}
                            </h3>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder={t('settings.admins.name_placeholder', 'Name (e.g. John Doe)')}
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder={t('settings.admins.email_placeholder', 'Email Address')}
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={handleInviteAdmin}
                                    disabled={inviting || !inviteEmail || !inviteName}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('settings.admins.send_invite', 'Send Invite')}
                                </button>
                            </div>
                        </div>

                        {/* Admin List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700">{t('settings.admins.current', 'Current Admins')}</h3>
                            {admins.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">{t('settings.admins.none', 'No admins found.')}</p>
                            ) : (
                                <div className="border border-gray-100 rounded-xl overflow-hidden">
                                    {admins.map((admin, idx) => (
                                        <div key={admin.id} className={`flex items-center justify-between p-4 ${idx !== admins.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                            <div>
                                                <p className="font-medium text-gray-800 text-sm">
                                                    {admin.name} {admin.id === user?.id && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{t('common.you', 'You')}</span>}
                                                </p>
                                                <p className="text-xs text-gray-500">{admin.email}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-xs px-2.5 py-1 rounded-full ${admin.is_suspended ? 'bg-red-100 text-red-700' : admin.activated_at ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {admin.is_suspended ? t('common.suspended', 'Suspended') : admin.activated_at ? t('common.active', 'Active') : t('common.invited', 'Invited')}
                                                </span>
                                                {admin.id !== user?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteAdmin(admin.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Remove Admin"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'danger':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-red-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> {t('settings.danger.title', 'Danger Zone')}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{t('settings.danger.subtitle', 'These actions are permanent and cannot be undone.')}</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                            <h3 className="font-bold text-red-800 text-base mb-1">{t('settings.danger.delete_org', 'Delete Organization')}</h3>
                            <p className="text-sm text-red-600 mb-4">
                                {t('settings.danger.delete_desc', 'Permanently deletes {{name}} and all associated data — admins, services, slots, and appointments. This cannot be reversed.', { name: orgName })}
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t('settings.danger.confirm_placeholder', 'Type {{code}} to confirm', { code: 'DELETE' })}
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder={t('settings.danger.input_placeholder', 'Type DELETE here')}
                                    className="w-full px-4 py-2.5 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none text-sm font-mono"
                                />
                            </div>
                            <button
                                type="button"
                                disabled={deleteConfirmText !== 'DELETE' || deletingOrg}
                                onClick={async () => {
                                    setDeletingOrg(true);
                                    try {
                                        await api.delete('/admin/org', { data: { confirmText: 'DELETE' } });
                                        toast.success(t('settings.danger.delete_success', 'Organization deleted'));
                                        logout();
                                        navigate('/');
                                    } catch (err) {
                                        toast.error(err.response?.data?.message || t('settings.danger.delete_failed', 'Failed to delete organization'));
                                    } finally {
                                        setDeletingOrg(false);
                                    }
                                }}
                                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deletingOrg ? t('common.deleting', 'Deleting...') : t('settings.danger.confirm_btn', 'Permanently Delete Organization')}
                            </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('settings.header', 'Organization Settings')}</h1>

            <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8">
                {/* Navigation/Sidebar */}
                <div className="md:col-span-3 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {[{ id: 'general', icon: Building2, label: t('settings.tabs.general', 'General') }, { id: 'hours', icon: Clock, label: t('settings.tabs.hours', 'Hours') }, { id: 'notifications', icon: Bell, label: t('settings.tabs.alerts', 'Alerts') }, { id: 'security', icon: Shield, label: t('settings.tabs.security', 'Security') }, { id: 'admins', icon: Users, label: t('settings.tabs.admins', 'Admins') }, { id: 'danger', icon: AlertTriangle, label: t('settings.tabs.danger', 'Danger') }].map(tab => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 md:gap-3 px-4 py-2.5 md:py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 md:bg-indigo-50 text-white md:text-indigo-700 shadow-lg md:shadow-none' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <tab.icon className="h-4 w-4 md:h-5 md:w-5" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Main Form */}
                <div className="md:col-span-9">
                    <form onSubmit={handleSave} className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                        {renderContent()}
                        
                        <div className="pt-6 mt-6 flex justify-end border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {t('common.save_changes', 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
