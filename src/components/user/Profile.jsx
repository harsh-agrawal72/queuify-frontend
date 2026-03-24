import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Save, Shield, Bell, Calendar, CheckCircle, Award, Clock, Sparkles, Eye, EyeOff, Trash2, AlertTriangle, Phone, MapPin, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, updateUser, logout } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [address, setAddress] = useState(user?.address || '');
    const [city, setCity] = useState(user?.city || '');
    const [state, setState] = useState(user?.state || '');
    const [pincode, setPincode] = useState(user?.pincode || '');
    const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profile_picture_url || '');
    const [emailNotifications, setEmailNotifications] = useState(user?.email_notification_enabled ?? true);
    const [notificationAlerts, setNotificationAlerts] = useState(user?.notification_enabled ?? true);
    const [loading, setLoading] = useState(false);

    // Password change states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [stats, setStats] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Delete account states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/user/stats');
                setStats(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validations
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('profile_picture', file);

        setUploadingImage(true);
        try {
            const { data } = await api.post('/users/profile/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // The backend returns { id, url }. The url is relative like /v1/users/profile/image/ID
            // We need to make it absolute or relative to the API base URL
            const absoluteUrl = `${api.defaults.baseURL}${data.url.replace('/v1', '')}`;
            // Wait, api.defaults.baseURL might already include /v1
            const finalUrl = data.url.startsWith('/') ? `${api.defaults.baseURL.replace('/v1', '')}${data.url}` : data.url;
            
            setProfilePictureUrl(finalUrl);
            
            // Also update the user in context immediately for the navbar/sidebar
            updateUser({ ...user, profile_picture_url: finalUrl });
            
            toast.success('Photo uploaded successfully');
        } catch (err) {
            console.error(err);
            toast.error('Failed to upload photo');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.patch('/user/profile', {
                name,
                phone,
                address,
                city,
                state,
                pincode,
                profile_picture_url: profilePictureUrl,
                email_notification_enabled: emailNotifications,
                notification_enabled: notificationAlerts
            });
            // Update user in AuthContext + localStorage so toggles persist
            updateUser({
                name,
                phone,
                address,
                city,
                state,
                pincode,
                profile_picture_url: profilePictureUrl,
                email_notification_enabled: emailNotifications,
                notification_enabled: notificationAlerts
            });
            toast.success('Profile updated successfully');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (!newPassword) {
            toast.error('Please enter a new password');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        setPasswordLoading(true);
        try {
            await api.patch('/user/profile', { password: newPassword });
            toast.success('Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            toast.error('Please enter your password to confirm');
            return;
        }
        setDeleting(true);
        try {
            await api.delete('/user/account', { data: { password: deletePassword } });
            toast.success('Account deleted successfully');
            logout();
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
    const totalAppointments = stats?.total || 0;
    const completedAppointments = stats?.completed || 0;
    const memberSince = user?.created_at ? format(parseISO(user.created_at), 'MMMM yyyy') : 'N/A';

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Profile Hero Card */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
                    {/* Avatar */}
                    <div className="relative group cursor-pointer" onClick={handleImageClick}>
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white font-black text-3xl border-2 border-white/20 shadow-2xl overflow-hidden relative">
                            {uploadingImage ? (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : null}
                            {profilePictureUrl ? (
                                <img src={profilePictureUrl} alt={user?.name} className="w-full h-full object-cover" />
                            ) : (
                                initials
                            )}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-white text-indigo-600 p-2 rounded-xl shadow-lg border border-indigo-50 group-hover:scale-110 transition-transform">
                            <Camera className="h-4 w-4" />
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    {/* Info */}
                    <div className="text-center md:text-left flex-1">
                        <h1 className="text-2xl md:text-3xl font-black text-white">{user?.name}</h1>
                        <p className="text-indigo-200 mt-1">{user?.email}</p>
                        <div className="flex items-center gap-4 mt-3 justify-center md:justify-start">
                            <span className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold border border-white/10">
                                <Shield className="h-3.5 w-3.5 text-emerald-300" />
                                {user?.role === 'user' ? 'Verified Member' : user?.role}
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-indigo-200 text-xs font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                Member since {memberSince}
                            </span>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 min-w-[80px]">
                            <p className="text-2xl font-black text-white">{totalAppointments}</p>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1">Visits</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10 min-w-[80px]">
                            <p className="text-2xl font-black text-emerald-300">{completedAppointments}</p>
                            <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider mt-1">Done</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Edit Form */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2"
                >
                    <form onSubmit={handleUpdate} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <User className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Personal Information</h2>
                                <p className="text-xs text-gray-400">Update your account details below</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Name Field */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                        placeholder="Your full name"
                                    />
                                </div>
                            </div>

                             {/* Phone Field */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                     <div className="relative">
                                         <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <input
                                             type="tel"
                                             value={phone}
                                             onChange={e => setPhone(e.target.value)}
                                             className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                             placeholder="Your phone number"
                                         />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-2">Profile Photo</label>
                                     <button
                                         type="button"
                                         onClick={handleImageClick}
                                         className="w-full flex items-center gap-3 px-4 py-3 border border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-500 text-sm font-medium"
                                     >
                                         <Camera className="h-4 w-4 text-indigo-500" />
                                         {profilePictureUrl ? 'Change Profile Photo' : 'Upload Profile Photo'}
                                     </button>
                                 </div>
                             </div>

                             {/* Address Field */}
                             <div>
                                 <label className="block text-sm font-semibold text-gray-700 mb-2">Residential Address</label>
                                 <div className="relative">
                                     <MapPin className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                                     <textarea
                                         value={address}
                                         onChange={e => setAddress(e.target.value)}
                                         rows="2"
                                         className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white resize-none"
                                         placeholder="Enter your full address"
                                     ></textarea>
                                 </div>
                             </div>

                             {/* City, State, Pincode Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                                     <div className="relative">
                                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <input
                                             type="text"
                                             value={city}
                                             onChange={e => setCity(e.target.value)}
                                             className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                             placeholder="New Delhi"
                                         />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                                     <div className="relative">
                                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <input
                                             type="text"
                                             value={state}
                                             onChange={e => setState(e.target.value)}
                                             className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                             placeholder="Delhi"
                                         />
                                     </div>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                                     <div className="relative">
                                         <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                         <input
                                             type="text"
                                             value={pincode}
                                             onChange={e => setPincode(e.target.value)}
                                             className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                             placeholder="110001"
                                         />
                                     </div>
                                 </div>
                             </div>
                             
                             <p className="text-[11px] text-gray-400 -mt-2 flex items-center gap-1">
                                 Used for finding organizations in your local area first
                             </p>

                         </div>

                        {/* Save Button */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 active:scale-[0.98]"
                            >
                                <Save className="h-4 w-4" />
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>

                    {/* Separate Change Password Card */}
                    <form onSubmit={handlePasswordChange} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                                <Lock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900">Change Password</h2>
                                <p className="text-xs text-gray-400">Ensure your account stays secure</p>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* New Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showNewPassword ? 'text' : 'password'}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password Strength Indicator */}
                                {newPassword && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${newPassword.length >= level * 3
                                                        ? newPassword.length >= 12 ? 'bg-emerald-500'
                                                            : newPassword.length >= 8 ? 'bg-amber-500'
                                                                : 'bg-red-400'
                                                        : 'bg-gray-100'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-[11px] mt-1 font-medium ${newPassword.length >= 12 ? 'text-emerald-600'
                                            : newPassword.length >= 8 ? 'text-amber-600'
                                                : newPassword.length >= 6 ? 'text-red-500'
                                                    : 'text-red-400'
                                            }`}>
                                            {newPassword.length >= 12 ? 'Strong password ✓'
                                                : newPassword.length >= 8 ? 'Good password'
                                                    : newPassword.length >= 6 ? 'Weak — add more characters'
                                                        : 'Too short — minimum 6 characters'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="Re-enter new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        className={`w-full pl-11 pr-12 py-3 border rounded-xl focus:ring-2 outline-none text-sm transition-all bg-gray-50 focus:bg-white ${confirmPassword && confirmPassword !== newPassword
                                            ? 'border-red-300 focus:ring-red-100 focus:border-red-400'
                                            : confirmPassword && confirmPassword === newPassword
                                                ? 'border-emerald-300 focus:ring-emerald-100 focus:border-emerald-400'
                                                : 'border-gray-200 focus:ring-indigo-100 focus:border-indigo-400'
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== newPassword && (
                                    <p className="text-[11px] text-red-500 mt-1.5 font-medium">Passwords do not match</p>
                                )}
                                {confirmPassword && confirmPassword === newPassword && newPassword.length >= 6 && (
                                    <p className="text-[11px] text-emerald-600 mt-1.5 font-medium flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Update Password Button */}
                        <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={passwordLoading || !newPassword || newPassword !== confirmPassword}
                                className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                            >
                                <Lock className="h-4 w-4" />
                                {passwordLoading ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </motion.div>

                {/* Right Column: Preferences + Account Info */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-6"
                >
                    {/* Notification Preferences */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Notifications
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Email Alerts</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Booking confirmations & reminders via email</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${emailNotifications ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Push Notifications</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">In-app alerts for queue & status updates</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setNotificationAlerts(!notificationAlerts)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${notificationAlerts ? 'bg-indigo-600' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${notificationAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Account Summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Account Summary
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Total Appointments</p>
                                    <p className="text-sm font-bold text-gray-900">{totalAppointments}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Completed</p>
                                    <p className="text-sm font-bold text-gray-900">{completedAppointments}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                                <Award className="h-4 w-4 text-purple-500" />
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500">Success Rate</p>
                                    <p className="text-sm font-bold text-gray-900">
                                        {totalAppointments > 0
                                            ? `${Math.round((completedAppointments / totalAppointments) * 100)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Info */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
                        <h3 className="font-bold flex items-center gap-2 mb-3">
                            <Shield className="h-5 w-5 text-emerald-400" />
                            Security
                        </h3>
                        <div className="space-y-2 text-sm text-slate-300">
                            <div className="flex items-center justify-between">
                                <span>Account Status</span>
                                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                    Active
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Role</span>
                                <span className="font-semibold text-white capitalize">{user?.role}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Member Since</span>
                                <span className="font-semibold text-white">{memberSince}</span>
                            </div>
                        </div>
                    </div>
                    {/* Danger Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-red-50 rounded-2xl border border-red-100 p-5"
                    >
                        <h3 className="font-bold text-red-700 flex items-center gap-2 mb-1">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </h3>
                        <p className="text-xs text-red-500 mb-4">This will permanently delete your account and all data.</p>
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete My Account
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Delete Account Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-red-100 rounded-xl"><Trash2 className="h-5 w-5 text-red-600" /></div>
                            <h2 className="font-bold text-gray-900 text-lg">Delete Account</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 ml-12">
                            This action is <strong>irreversible</strong>. All your appointments and data will be permanently deleted.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Enter your password to confirm</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={e => setDeletePassword(e.target.value)}
                                placeholder="Your current password"
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); }}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleting || !deletePassword}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
