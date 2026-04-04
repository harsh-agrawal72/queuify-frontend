import { useState, useEffect, useRef } from 'react';
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
    Info,
    CreditCard,
    QrCode,
    Download,
    Printer,
    ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    const [orgSlug, setOrgSlug] = useState('');
    const [qrBase64, setQrBase64] = useState('');
    const qrRef = useRef(null);

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
        queue_mode_default: 'CENTRAL',
        payout_bank_name: '',
        payout_account_holder: '',
        payout_account_number: '',
        payout_ifsc: '',
        payout_upi_id: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlerts: true,
        newBookingNotify: true
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [settingsRes, adminsRes] = await Promise.all([
                    api.get('/admin/org'),
                    api.get('/admin/admins')
                ]);

                if (settingsRes.data) {
                    setFormData({
                        name: settingsRes.data.name || '',
                        email: settingsRes.data.contact_email || settingsRes.data.email || '',
                        phone: settingsRes.data.phone || '',
                        address: settingsRes.data.address || '',
                        openTime: settingsRes.data.open_time || '09:00',
                        closeTime: settingsRes.data.close_time || '17:00',
                        queue_mode_default: settingsRes.data.queue_mode_default || 'CENTRAL',
                        payout_bank_name: settingsRes.data.payout_bank_name || '',
                        payout_account_holder: settingsRes.data.payout_account_holder || '',
                        payout_account_number: settingsRes.data.payout_account_number || '',
                        payout_ifsc: settingsRes.data.payout_ifsc || '',
                        payout_upi_id: settingsRes.data.payout_upi_id || ''
                    });
                    setOrgName(settingsRes.data.name || '');
                    setOrgSlug(settingsRes.data.slug || '');
                    setNotifications({
                        emailAlerts: settingsRes.data.email_notification ?? true,
                        newBookingNotify: settingsRes.data.new_booking_notification ?? true
                    });
                }
                setAdmins(adminsRes.data || []);
            } catch (error) {
                console.error("Failed to fetch initial settings data", error);
                toast.error(t('admin.settings.load_failed', 'Failed to load organization settings'));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleInviteAdmin = async (e) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await api.post('/admin/admins/invite', { email: inviteEmail, name: inviteName });
            toast.success(t('admin.settings.admins.invite_success', 'Admin invited successfully'));
            setAdmins([res.data, ...admins]);
            setInviteEmail('');
            setInviteName('');
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.settings.admins.invite_failed', 'Failed to invite admin'));
        } finally {
            setInviting(false);
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (!window.confirm(t('admin.settings.admins.remove_confirm', 'Are you sure you want to remove this admin?'))) return;
        try {
            await api.delete(`/admin/admins/${adminId}`);
            toast.success(t('admin.settings.admins.remove_success', 'Admin removed'));
            setAdmins(admins.filter(a => a.id !== adminId));
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.settings.admins.remove_failed', 'Failed to remove admin'));
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
                new_booking_notification: notifications.newBookingNotify,
                payout_bank_name: formData.payout_bank_name,
                payout_account_holder: formData.payout_account_holder,
                payout_account_number: formData.payout_account_number,
                payout_ifsc: formData.payout_ifsc,
                payout_upi_id: formData.payout_upi_id
            });
            toast.success(t('admin.settings.save_success', "Settings updated successfully"));
        } catch (error) {
            console.error(error);
            toast.error(t('admin.settings.save_failed', "Failed to update settings"));
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
                            <h2 className="text-lg font-semibold text-gray-800">{t('admin.settings.general.title', 'General Information')}</h2>
                            <p className="text-sm text-gray-500">{t('admin.settings.general.subtitle', 'Update your public facing business details.')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-gray-400" /> {t('admin.settings.general.org_name', 'Organization Name')}
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
                                    <Mail className="h-4 w-4 text-gray-400" /> {t('admin.settings.general.email', 'Support Email')}
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
                                    <Phone className="h-4 w-4 text-gray-400" /> {t('admin.settings.general.phone', 'Phone Number')}
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
                                    <MapPin className="h-4 w-4 text-gray-400" /> {t('admin.settings.general.address', 'Address')}
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
                                {t('admin.settings.hours.title', 'Business Hours')}
                                <InfoTooltip text={t('admin.settings.hours.tooltip', "Global operating timings for your organization. Bookings can only be made within these hours.")} />
                            </h2>
                            <p className="text-sm text-gray-500">{t('admin.settings.hours.subtitle', "Manage your operating timings.")}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-8 max-w-lg">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.settings.hours.open', 'Open Time')}</label>
                                <input
                                    type="time"
                                    name="openTime"
                                    value={formData.openTime}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.settings.hours.close', 'Close Time')}</label>
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
                            <h2 className="text-lg font-semibold text-gray-800">{t('admin.settings.notifications.title', 'Notifications')}</h2>
                            <p className="text-sm text-gray-500">{t('admin.settings.notifications.subtitle', 'Control how you receive alerts.')}</p>
                        </div>
                        <div className="space-y-4 max-w-lg">
                            {Object.entries(notifications).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Bell className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700 font-medium capitalize">
                                            {key === 'emailAlerts' ? t('admin.settings.notifications.email', 'Email Alerts') : t('admin.settings.notifications.new_booking', 'New Booking Notify')}
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
                            <h2 className="text-lg font-semibold text-gray-800">{t('admin.settings.security.title', 'Security Settings')}</h2>
                            <p className="text-sm text-gray-500">{t('admin.settings.security.subtitle', 'Manage account security and access.')}</p>
                        </div>
                        <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex gap-4">
                            <Shield className="h-6 w-6 text-orange-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-orange-800">{t('admin.settings.security.password_title', 'Password & Authentication')}</h3>
                                <p className="text-sm text-orange-700 mt-1">{t('admin.settings.security.password_desc', 'To change your password or update security settings, please visit your user profile.')}</p>
                                <button
                                    type="button"
                                    onClick={openProfileModal}
                                    className="mt-3 text-sm font-medium text-orange-900 bg-orange-100 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors"
                                >
                                    {t('common.go_to_profile', 'Go to Profile')}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'payout':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('admin.payout_settings.title', 'Payout & Bank Settings')}</h2>
                            <p className="text-sm text-gray-500">{t('admin.payout_settings.subtitle', 'Securely store your account details for faster withdrawals.')}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex justify-between">
                                    {t('admin.payout_settings.ifsc', 'IFSC Code')}
                                    {formData.payout_ifsc && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (!formData.payout_ifsc || formData.payout_ifsc.length < 11) {
                                                    toast.error(t('admin.payout_settings.ifsc_invalid_msg', "Please enter a valid 11-digit IFSC code"));
                                                    return;
                                                }
                                                const loadingToast = toast.loading(t('admin.payout_settings.verifying', "Verifying IFSC..."));
                                                try {
                                                    const res = await fetch(`https://ifsc.razorpay.com/${formData.payout_ifsc}`);
                                                    if (!res.ok) throw new Error(t('admin.payout_settings.invalid_ifsc', "Invalid IFSC code"));
                                                    const data = await res.json();
                                                    setFormData(prev => ({ ...prev, payout_bank_name: data.BANK }));
                                                    toast.success(t('admin.payout_settings.verified_bank', `Verified: ${data.BANK}`, { bank: data.BANK }), { id: loadingToast });
                                                } catch (err) {
                                                    toast.error(t('admin.payout_settings.verify_error', "Invalid IFSC code or network error"), { id: loadingToast });
                                                }
                                            }}
                                            className="text-[10px] text-indigo-600 font-bold hover:underline"
                                        >
                                            {t('admin.payout_settings.ifsc_verify', 'Verify & Get Bank Name')}
                                        </button>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    name="payout_ifsc"
                                    value={formData.payout_ifsc}
                                    onChange={handleChange}
                                    placeholder={t('admin.payout_settings.ifsc_placeholder', "e.g. HDFC0001234")}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all uppercase"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.payout_settings.bank_name', 'Bank Name')}</label>
                                <input
                                    type="text"
                                    name="payout_bank_name"
                                    value={formData.payout_bank_name}
                                    onChange={handleChange}
                                    placeholder={t('admin.payout_settings.bank_placeholder', "e.g. HDFC Bank")}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.payout_settings.holder_name', 'Account Holder Name')}</label>
                                <input
                                    type="text"
                                    name="payout_account_holder"
                                    value={formData.payout_account_holder}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{t('admin.payout_settings.acc_number', 'Account Number')}</label>
                                <input
                                    type="text"
                                    name="payout_account_number"
                                    value={formData.payout_account_number}
                                    onChange={handleChange}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-50">
                            <div className="space-y-2 max-w-md">
                                <label className="text-sm font-medium text-gray-700">{t('admin.payout_settings.upi_id', 'UPI ID (Alternative)')}</label>
                                <input
                                    type="text"
                                    name="payout_upi_id"
                                    value={formData.payout_upi_id}
                                    onChange={handleChange}
                                    placeholder={t('admin.payout_settings.upi_placeholder', "e.g. name@upi")}
                                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'admins':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800">{t('admin.settings.admins.title', 'Admin Management')}</h2>
                            <p className="text-sm text-gray-500">{t('admin.settings.admins.subtitle', 'Invite and manage administrators for your organization.')}</p>
                        </div>

                        {/* Invite Form */}
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-indigo-500" /> {t('admin.settings.admins.invite_new', 'Invite New Admin')}
                            </h3>
                            <div className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder={t('admin.settings.admins.name_placeholder', 'Name (e.g. John Doe)')}
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    className="flex-1 p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none"
                                />
                                <input
                                    type="email"
                                    placeholder={t('admin.settings.admins.email_placeholder', 'Email Address')}
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
                                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('admin.settings.admins.send_invite', 'Send Invite')}
                                </button>
                            </div>
                        </div>

                        {/* Admin List */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-gray-700">{t('admin.settings.admins.current', 'Current Admins')}</h3>
                            {admins.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">{t('admin.settings.admins.none', 'No admins found.')}</p>
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
            case 'qrcode':
                const scanUrl = `${window.location.protocol}//${window.location.host}/scan/${orgSlug}`;
                
                const generateQrImage = () => {
                    const svg = document.getElementById('org-qr-code');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const base64 = 'data:image/svg+xml;base64,' + btoa(svgData);
                    setQrBase64(base64);
                };

                const downloadQR = () => {
                    const svg = document.getElementById('org-qr-code');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                        canvas.width = img.width + 40;
                        canvas.height = img.height + 100;
                        ctx.fillStyle = 'white';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(img, 20, 20);
                        ctx.fillStyle = '#111827';
                        ctx.font = 'bold 16px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(orgName, canvas.width / 2, img.height + 60);
                        ctx.font = '12px sans-serif';
                        ctx.fillStyle = '#6B7280';
                        ctx.fillText(t('admin.qr.scan_to_book', 'Scan to Book Appointment'), canvas.width / 2, img.height + 80);
                        
                        const pngFile = canvas.toDataURL('image/png');
                        const downloadLink = document.createElement('a');
                        downloadLink.download = `${orgName.replace(/\s+/g, '_')}_QR.png`;
                        downloadLink.href = pngFile;
                        downloadLink.click();
                        toast.success(t('admin.qr.download_success', 'QR Code downloaded!'));
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                };

                const printQR = () => {
                    const svg = document.getElementById('org-qr-code');
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const base64 = 'data:image/svg+xml;base64,' + btoa(svgData);
                    
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                        <html>
                            <head>
                                <title>Print QR - ${orgName}</title>
                                <style>
                                    body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                                    .card { border: 2px solid #eee; padding: 40px; border-radius: 20px; }
                                    h1 { margin-top: 20px; color: #111827; }
                                    p { color: #6B7280; }
                                </style>
                            </head>
                            <body>
                                <div class="card">
                                    <img src="${base64}" width="300" height="300" />
                                    <h1>${orgName}</h1>
                                    <p>${t('admin.qr.scan_desc', 'Scan this QR to book an appointment')}</p>
                                </div>
                                <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                            </body>
                        </html>
                    `);
                    printWindow.document.close();
                };

                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 pb-4">
                        <div className="border-b border-gray-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-indigo-600" /> {t('admin.qr.title', 'Organization QR Code')}
                            </h2>
                            <p className="text-sm text-gray-500">{t('admin.qr.subtitle', 'Generate and print your unique QR code for easy customer access.')}</p>
                        </div>

                        {!orgSlug && (
                            <div className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col items-center text-center space-y-4">
                                <div className="p-3 bg-amber-100 rounded-2xl">
                                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-amber-900">{t('admin.qr.missing_link', 'Missing Public Link!')}</h3>
                                    <p className="text-sm text-amber-700 max-w-md mx-auto">{t('admin.qr.missing_link_desc', "Your organization doesn't have a unique public link yet. This is required to generate a QR code.")}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        const loadingToast = toast.loading(t('admin.qr.generating', "Generating your public link..."));
                                        try {
                                            // Trigger an update to save settings which should generate a slug on the backend if missing
                                            await handleSave(new Event('submit'));
                                            // Refresh details to get the new slug
                                            const res = await api.get('/admin/org');
                                            if (res.data.slug) {
                                                setOrgSlug(res.data.slug);
                                                toast.success(t('admin.qr.gen_success', "Public link generated!"), { id: loadingToast });
                                            } else {
                                                throw new Error("Slug still missing");
                                            }
                                        } catch (err) {
                                            toast.error(t('admin.qr.gen_failed', "Failed to generate link. Please contact support."), { id: loadingToast });
                                        }
                                    }}
                                    className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors shadow-lg shadow-amber-100"
                                >
                                    {t('admin.qr.generate_btn', 'Generate Public Link')}
                                </button>
                            </div>
                        )}

                        {orgSlug && (
                            <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-start opacity-1 animate-in fade-in duration-500">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-[2rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                    <div className="relative bg-white border border-gray-100 rounded-[2rem] p-8 shadow-xl shadow-indigo-100/50 flex flex-col items-center w-full max-w-[320px]">
                                        <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                                            <QRCodeSVG 
                                                id="org-qr-code"
                                                value={scanUrl} 
                                                size={200}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg text-center leading-tight">{orgName}</h3>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-2">{t('admin.qr.scan_to_book', 'Scan to Book Appointment')}</p>
                                        
                                        <div className="mt-8 flex gap-3 w-full">
                                            <button 
                                                type="button"
                                                onClick={downloadQR}
                                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                            >
                                                <Download className="h-4 w-4" /> {t('admin.qr.download', 'Download')}
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={printQR}
                                                className="p-2.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-xl hover:bg-white hover:text-indigo-600 transition-all"
                                                title={t('admin.qr.print', "Print")}
                                            >
                                                <Printer className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                            <Info className="h-4 w-4 text-indigo-500" /> {t('admin.qr.how_to_use', 'How to use?')}
                                        </h4>
                                        <ul className="space-y-3">
                                            {[
                                                { title: t('admin.qr.step1_title', 'Print & Display'), desc: t('admin.qr.step1_desc', 'Download and print this QR code to display at your reception or entrance.') },
                                                { title: t('admin.qr.step2_title', 'Instant Scan'), desc: t('admin.qr.step2_desc', 'Customers scan the code using their phone camera.') },
                                                { title: t('admin.qr.step3_title', 'Automated Flow'), desc: t('admin.qr.step3_desc', 'They will be instantly redirected to your booking page. New users will be prompted to join Queuify first.') }
                                            ].map((item, i) => (
                                                <li key={i} className="flex gap-3">
                                                    <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5 border border-indigo-100">
                                                        {i + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
                                        <p className="text-xs font-semibold text-indigo-900 uppercase tracking-widest">{t('admin.qr.public_link', 'Public Link')}</p>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-indigo-100">
                                            <code className="text-[10px] text-indigo-600 break-all flex-1">{scanUrl}</code>
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(scanUrl);
                                                    toast.success(t('admin.qr.link_copied', 'Link copied!'));
                                                }}
                                                className="p-1 hover:bg-indigo-50 rounded transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3 text-indigo-500" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'danger':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-red-100 pb-4 mb-4">
                            <h2 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" /> {t('admin.settings.danger.title', 'Danger Zone')}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">{t('admin.settings.danger.subtitle', 'These actions are permanent and cannot be undone.')}</p>
                        </div>

                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                            <h3 className="font-bold text-red-800 text-base mb-1">{t('admin.settings.danger.delete_org', 'Delete Organization')}</h3>
                            <p className="text-sm text-red-600 mb-4">
                                {t('admin.settings.danger.delete_desc', 'Permanently deletes {{name}} and all associated data — admins, services, slots, and appointments. This cannot be reversed.', { name: orgName })}
                            </p>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t('admin.settings.danger.confirm_placeholder', 'Type {{code}} to confirm', { code: 'DELETE' })}
                                </label>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={e => setDeleteConfirmText(e.target.value)}
                                    placeholder={t('admin.settings.danger.input_placeholder', 'Type DELETE here')}
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
                                        toast.success(t('admin.settings.danger.delete_success', 'Organization deleted'));
                                        logout();
                                        navigate('/');
                                    } catch (err) {
                                        toast.error(err.response?.data?.message || t('admin.settings.danger.delete_failed', 'Failed to delete organization'));
                                    } finally {
                                        setDeletingOrg(false);
                                    }
                                }}
                                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Trash2 className="h-4 w-4" />
                                {deletingOrg ? t('common.deleting', 'Deleting...') : t('admin.settings.danger.confirm_btn', 'Permanently Delete Organization')}
                            </button>
                        </div>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.settings.header', 'Organization Settings')}</h1>

            <div className="flex flex-col md:grid md:grid-cols-12 gap-6 md:gap-8">
                {/* Navigation/Sidebar */}
                <div className="md:col-span-3 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                    {[
                        { id: 'general', icon: Building2, label: t('admin.settings.tabs.general', 'General') },
                        { id: 'hours', icon: Clock, label: t('admin.settings.tabs.hours', 'Hours') },
                        { id: 'qrcode', icon: QrCode, label: t('admin.settings.tabs.qrcode', 'QR Code') },
                        { id: 'notifications', icon: Bell, label: t('admin.settings.tabs.alerts', 'Alerts') },
                        { id: 'payout', icon: CreditCard, label: t('admin.settings.tabs.payout', 'Payout') },
                        { id: 'security', icon: Shield, label: t('admin.settings.tabs.security', 'Security') },
                        { id: 'admins', icon: Users, label: t('admin.settings.tabs.admins', 'Admins') },
                        { id: 'danger', icon: AlertTriangle, label: t('admin.settings.tabs.danger', 'Danger') }
                    ].map(tab => (
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
                        
                        <div className="pt-6 mt-auto flex justify-end border-t border-gray-50 bg-white sticky bottom-0 md:relative z-10 -mx-5 -mb-5 p-5 md:m-0 md:p-0 md:bg-transparent rounded-b-2xl">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                            >
                                {saving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
                                {saving ? t('admin.settings.common.saving', 'Saving...') : t('admin.settings.common.save_changes', 'Save Changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
