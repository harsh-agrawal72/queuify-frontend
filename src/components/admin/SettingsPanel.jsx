import { useState, useEffect } from 'react';
import { api } from '../../services/api';
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
    ToggleRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useOutletContext } from 'react-router-dom';

const SettingsPanel = () => {
    const { user } = useAuth();
    const { openProfileModal } = useOutletContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

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
                    setNotifications({
                        emailAlerts: res.data.email_notification ?? true,
                        newBookingNotify: res.data.new_booking_notification ?? true
                    });
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
                toast.error("Failed to load organization details");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

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
            toast.success("Settings updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update settings");
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
                            <h2 className="text-lg font-semibold text-gray-800">General Information</h2>
                            <p className="text-sm text-gray-500">Update your public facing business details.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" /> Organization Name
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
                                    <Mail className="h-4 w-4 text-gray-400" /> Support Email
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
                                    <Phone className="h-4 w-4 text-gray-400" /> Phone Number
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
                                    <MapPin className="h-4 w-4 text-gray-400" /> Address
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
                            <h2 className="text-lg font-semibold text-gray-800">Business Hours</h2>
                            <p className="text-sm text-gray-500">Manage your operating timings.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 max-w-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Open Time</label>
                                <input
                                    type="time"
                                    name="openTime"
                                    value={formData.openTime}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Close Time</label>
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
                            <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
                            <p className="text-sm text-gray-500">Control how you receive alerts.</p>
                        </div>
                        <div className="space-y-4 max-w-lg">
                            {Object.entries(notifications).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700 font-medium capitalize">
                                            {key === 'emailAlerts' ? 'Email Alerts' : 'New Booking Notify'}
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
                            <h2 className="text-lg font-semibold text-gray-800">Security Settings</h2>
                            <p className="text-sm text-gray-500">Manage account security and access.</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4">
                            <Shield className="h-6 w-6 text-orange-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-orange-800">Password & Authentication</h3>
                                <p className="text-sm text-orange-700 mt-1">To change your password or update security settings, please visit your user profile.</p>
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
            default: return null;
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                {/* Navigation/Sidebar */}
                <div className="md:col-span-3 space-y-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('general')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Building2 className="h-5 w-5" /> General Info
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('hours')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'hours' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Clock className="h-5 w-5" /> Business Hours
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Bell className="h-5 w-5" /> Notifications
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Shield className="h-5 w-5" /> Security
                    </button>
                </div>

                {/* Main Form */}
                <div className="md:col-span-9">
                    <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                        {renderContent()}

                        <div className="pt-8 mt-auto flex justify-end border-t border-gray-50">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
