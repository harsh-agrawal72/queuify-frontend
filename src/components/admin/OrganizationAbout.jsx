import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import InfoTooltip from '../common/InfoTooltip';
import {
    Info,
    MapPin,
    Image as ImageIcon,
    Share2,
    Save,
    CheckCircle2,
    AlertCircle,
    Plus,
    Trash2,
    Loader2,
    Building2,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    ShieldCheck,
    ShieldAlert,
    ShieldOff,
    FileText,
    Download,
    X,
    Lock
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const OrganizationAbout = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    
    const planFeatures = user?.plan_features || {};
    const hasCustomBranding = planFeatures.has_custom_branding === true;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [verifyingEmail, setVerifyingEmail] = useState(false);
    const [profile, setProfile] = useState({
        description: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_email: '',
        contact_phone: '',
        website_url: '',
        working_hours: {},
        gst_number: '',
        registration_number: '',
        established_year: '',
        total_staff: '',
        facebook_url: '',
        instagram_url: '',
        linkedin_url: '',
        trustScore: 0,
        images: [],
        email_verified: false,
        keywords: ''
    });

    const isSetupIncomplete = user?.role === 'admin' && !user?.org_is_setup_completed;

    const fetchData = async () => {
        try {
            const res = await api.get('/organizations/profile');
            // If setup is now complete but wasn't before, update the global auth state
            if (res.data.org_is_setup_completed && !user?.org_is_setup_completed) {
                updateUser({ org_is_setup_completed: true });
            }
            setProfile(prev => ({
                ...prev,
                ...res.data,
                images: res.data.images || []
            }));
        } catch (error) {
            console.error('Failed to fetch organization profile', error);
            toast.error(t('admin.about.load_failed', 'Failed to load profile'));
        } finally {
            setLoading(false);
        }
    };

    const isFieldMissing = (field) => isSetupIncomplete && !profile[field];
    const isImageMissing = (type) => isSetupIncomplete && !profile.images?.some(img => img.image_type === type);

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const {
                description,
                address,
                city,
                state,
                pincode,
                contact_email,
                contact_phone,
                website_url,
                working_hours,
                gst_number,
                registration_number,
                established_year,
                total_staff,
                facebook_url,
                instagram_url,
                linkedin_url,
                keywords
            } = profile;

            await api.patch('/organizations/profile', {
                description,
                address,
                city,
                state,
                pincode,
                contact_email,
                contact_phone,
                website_url,
                working_hours,
                gst_number,
                registration_number,
                established_year,
                total_staff,
                facebook_url,
                instagram_url,
                linkedin_url,
                keywords
            });
            toast.success(t('admin.about.save_success', 'Profile updated successfully'));
            fetchData();
        } catch (error) {
            console.error('Save failed:', error);
            toast.error(error.response?.data?.message || t('admin.about.save_failed', 'Failed to save profile'));
        } finally {
            setSaving(false);
        }
    };

    const handleVerifyEmail = async () => {
        setVerifyingEmail(true);
        try {
            await api.post('/organizations/request-verification');
            toast.success(t('admin.about.verification_sent', 'Verification link sent to your email'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.about.verification_failed', 'Failed to send verification email'));
        } finally {
            setVerifyingEmail(false);
        }
    };

    const handleImageUpload = async (e, type) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append('type', type);

        if (type === 'gallery') {
            for (let i = 0; i < files.length; i++) {
                formData.append('gallery', files[i]);
            }
        } else {
            formData.append(type, files[0]);
        }

        const isDocument = ['pan_card', 'aadhar_card'].includes(type);
        const toastId = toast.loading(t('admin.about.uploading_media', 'Uploading {{type}}...', { type: isDocument ? t('common.document', 'document') : t('common.image', 'image') }));
        try {
            await api.post('/organizations/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success(t('admin.about.upload_success', 'Image uploaded successfully'), { id: toastId });
            fetchData();
        } catch (error) {
            toast.error(t('admin.about.upload_failed_msg', 'Failed to upload image'), { id: toastId });
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!imageId) return;
        if (!window.confirm(t('admin.about.delete_image_confirm', 'Are you sure you want to delete this image?'))) return;

        try {
            await api.delete(`/organizations/images/${imageId}`);
            toast.success(t('admin.about.image_deleted', 'Image deleted'));
            fetchData();
        } catch (error) {
            toast.error(t('admin.about.delete_image_failed', 'Failed to delete image'));
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Setup Progress Checklist (Only if incomplete) */}
            {isSetupIncomplete && (() => {
                const checklist = [
                    { label: t('setup.check_basic', 'Description & Keywords'), done: profile.description && profile.keywords },
                    { label: t('setup.check_contact', 'Phone & Address'), done: profile.contact_phone && profile.address && profile.city },
                    { label: t('setup.check_documents', 'Identity (PAN & Aadhar)'), done: profile.images?.some(img => img.image_type === 'pan_card') && profile.images?.some(img => img.image_type === 'aadhar_card') }
                ];
                const isAllDone = checklist.every(item => item.done);

                return (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-3xl shadow-sm border transition-all duration-500 ${
                            isAllDone ? "bg-emerald-50 border-emerald-100" : "bg-indigo-50 border-indigo-100"
                        }`}
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl shadow-lg transition-colors ${
                                    isAllDone ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                                }`}>
                                    {isAllDone ? <CheckCircle2 className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h2 className={`text-lg font-black tracking-tight ${
                                        isAllDone ? "text-emerald-900" : "text-indigo-900"
                                    }`}>
                                        {isAllDone 
                                            ? t('setup.all_set_title', 'You are all set!') 
                                            : t('setup.checklist_title', 'Mandatory Setup Checklist')
                                        }
                                    </h2>
                                    <p className={`text-sm font-medium ${
                                        isAllDone ? "text-emerald-700" : "text-indigo-700"
                                    }`}>
                                        {isAllDone 
                                            ? t('setup.all_set_subtitle', 'We will verify your details ASAP, then you can use all your features.') 
                                            : t('setup.checklist_subtitle', 'Please complete the following blocks to unlock all features.')
                                        }
                                    </p>
                                </div>
                            </div>

                            {!isAllDone && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {checklist.map((item, idx) => (
                                        <div key={idx} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                                            item.done ? "bg-white border-emerald-100 text-emerald-700" : "bg-indigo-100/50 border-indigo-200 text-indigo-400"
                                        }`}>
                                            {item.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })()}

            {/* Header & Verification Status */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white">
                <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
                        {t('admin.about.title', 'Organization Profile')}
                        <InfoTooltip text={t('admin.about.tooltip', 'This is your public profile. This information is shown to users when they search for your organization. Keep it updated to build trust and help users find you.')} />
                    </h1>
                    <p className="text-slate-400 mt-1">{t('admin.about.subtitle', 'Manage your public information and verification documents.')}</p>
                </div>

                {profile.verified ? (
                    <div className="flex items-center gap-3 bg-indigo-500/10 text-indigo-400 px-6 py-3 rounded-2xl border border-indigo-500/20 shadow-sm scale-105 transition-transform" title="Your organization is verified by Queuify">
                        <ShieldCheck className="h-5 w-5 fill-indigo-400 text-slate-950" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('admin.about.verified_label', 'Verified Partner')}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 bg-slate-800/50 text-slate-500 px-6 py-3 rounded-2xl border border-slate-800">
                        <ShieldOff className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('admin.about.standard_label', 'Standard Profile')}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Information */}
                    <div className={`bg-white p-8 rounded-3xl border shadow-sm space-y-8 transition-colors ${isFieldMissing('description') ? 'border-rose-200 ring-4 ring-rose-50' : 'border-gray-100'}`}>
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Info className="h-5 w-5 text-indigo-600" /> {t('admin.about.basic_info', 'Basic Information')}
                                    {isSetupIncomplete && <span className="text-[10px] text-rose-500 font-bold uppercase ml-2 tracking-widest">{t('common.required', 'Required')}</span>}
                                </h2>
                                {profile.verified && (
                                    <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100 shadow-sm" title={t('admin.about.verified_title', 'Your organization is verified by Queuify')}>
                                        <ShieldCheck className="h-4 w-4 fill-blue-600 text-white" />
                                        <span className="text-xs font-bold uppercase tracking-widest">{t('admin.about.verified_account', 'Verified Account')}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('common.description', 'Description')}
                                    {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                </label>
                                <textarea
                                    name="description"
                                    value={profile.description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder={t('admin.about.description_placeholder', 'Tell your customers about your organization, history, and mission...')}
                                    className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none ${isFieldMissing('description') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('admin.about.keywords', 'Search Keywords & Hashtags')}
                                    {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                    <InfoTooltip text={t('admin.about.keywords_tooltip', 'Enter comma-separated tags and hashtags like #doctor, #heartspecialist, etc. This helps users find you more easily in search results.')} />
                                </label>
                                <textarea
                                    name="keywords"
                                    value={profile.keywords || ''}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder={t('admin.about.keywords_placeholder', 'e.g. #heart, #specialist, clinic, best care...')}
                                    className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none ${isFieldMissing('keywords') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                />
                                <p className="text-[10px] text-gray-500 mt-1 italic tracking-tight">
                                    Separate each keyword or hashtag with a comma. These act as SEO tags for your profile.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.about.established', 'Established Year')}</label>
                                    <input
                                        type="number"
                                        name="established_year"
                                        value={profile.established_year || ''}
                                        onChange={handleChange}
                                        placeholder={t('admin.about.year_placeholder', 'e.g. 2010')}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.about.total_staff', 'Total Staff')}</label>
                                    <input
                                        type="number"
                                        name="total_staff"
                                        value={profile.total_staff || ''}
                                        onChange={handleChange}
                                        placeholder={t('admin.about.staff_placeholder', 'Approx. number of employees')}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact & Location */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">{t('admin.about.contact_location', 'Contact & Location')}</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                        {profile.email_verified ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                                            <CheckCircle2 className="h-3 w-3" /> {t('common.verified', 'Verified')}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={handleVerifyEmail}
                                                disabled={verifyingEmail}
                                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider underline disabled:opacity-50"
                                            >
                                                {verifyingEmail ? t('common.sending', 'Sending...') : t('admin.about.verify_now', 'Verify Now')}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={profile.contact_email || ''}
                                        readOnly
                                        className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 cursor-not-allowed outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('admin.about.phone', 'Contact Phone')}
                                        {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={profile.contact_phone || ''}
                                        onChange={handleChange}
                                        placeholder={t('admin.about.phone_placeholder', '+91 98765 43210')}
                                        className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isFieldMissing('contact_phone') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('admin.about.address', 'Full Address')}
                                    {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profile.address || ''}
                                    onChange={handleChange}
                                    placeholder={t('admin.about.address_placeholder', 'Street, Landmark...')}
                                    className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isFieldMissing('address') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('common.city', 'City')}
                                        {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={profile.city || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isFieldMissing('city') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('common.state', 'State')}
                                        {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={profile.state || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isFieldMissing('state') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('common.pincode', 'Pincode')}
                                        {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                    </label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={profile.pincode || ''}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${isFieldMissing('pincode') ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'}`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.about.website', 'Website URL')}</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="url"
                                        name="website_url"
                                        value={profile.website_url || ''}
                                        onChange={handleChange}
                                        placeholder={t('admin.about.website_placeholder', 'https://www.example.com')}
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Social Media */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Share2 className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">{t('admin.about.social_links', 'Social Media Links')}</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="relative">
                                <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="url"
                                    name="facebook_url"
                                    value={profile.facebook_url || ''}
                                    onChange={handleChange}
                                    placeholder="Facebook profile URL"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Instagram className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="url"
                                    name="instagram_url"
                                    value={profile.instagram_url || ''}
                                    onChange={handleChange}
                                    placeholder="Instagram profile URL"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <input
                                    type="url"
                                    name="linkedin_url"
                                    value={profile.linkedin_url || ''}
                                    onChange={handleChange}
                                    placeholder="LinkedIn business URL"
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Legal / Verification */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                <ShieldOff className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">{t('admin.about.legal_verification', 'Legal & Verification')}</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                                    <input
                                        type="text"
                                        name="gst_number"
                                        value={profile.gst_number || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 27AAAAA0000A1Z5"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                                    <input
                                        type="text"
                                        name="registration_number"
                                        value={profile.registration_number || ''}
                                        onChange={handleChange}
                                        placeholder="Company Reg. No."
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Side: Media & Actions */}
                <div className="space-y-8">
                    {/* Media Management */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <ImageIcon className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">{t('admin.about.media', 'Media')}</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Verification Documents */}
                            <div className={`p-4 rounded-xl border mb-6 transition-colors ${isImageMissing('pan_card') || isImageMissing('aadhar_card') ? 'bg-rose-50 border-rose-200' : 'bg-amber-50/50 border-amber-100'}`}>
                                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${isImageMissing('pan_card') || isImageMissing('aadhar_card') ? 'text-rose-900' : 'text-amber-900'}`}>
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    {t('admin.about.verification_docs', 'Verification Documents (PDF)')}
                                    {isSetupIncomplete && <span className="text-[10px] text-rose-500 font-bold uppercase ml-1 tracking-widest">{t('common.required', 'Required')}</span>}
                                </h3>
                                <div className="space-y-4">
                                    {/* PAN Card */}
                                    <div className={`flex items-center justify-between bg-white p-3 rounded-lg border ${isImageMissing('pan_card') ? 'border-rose-300 shadow-sm' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {t('admin.about.pan_card', 'PAN Card')}
                                                    {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                                </p>
                                                {profile.images?.find(img => img.image_type === 'pan_card') ? (
                                                    <a 
                                                        href={profile.images.find(img => img.image_type === 'pan_card').image_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                                    >
                                                        <Download className="h-3 w-3" /> {t('admin.about.view_document', 'View Document')}
                                                    </a>
                                                ) : (
                                                    <p className="text-xs text-rose-500 font-medium italic">{t('common.not_uploaded', 'Missing Document')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <label className="cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                                            {profile.images?.find(img => img.image_type === 'pan_card') ? t('common.replace', 'Replace') : t('common.upload', 'Upload')}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => handleImageUpload(e, 'pan_card')}
                                            />
                                        </label>
                                    </div>

                                    {/* Aadhar Card */}
                                    <div className={`flex items-center justify-between bg-white p-3 rounded-lg border ${isImageMissing('aadhar_card') ? 'border-rose-300 shadow-sm' : 'border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {t('admin.about.aadhar_card', 'Aadhar Card')}
                                                    {isSetupIncomplete && <span className="text-rose-500 ml-1">*</span>}
                                                </p>
                                                {profile.images?.find(img => img.image_type === 'aadhar_card') ? (
                                                    <a 
                                                        href={profile.images.find(img => img.image_type === 'aadhar_card').image_url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                                    >
                                                        <Download className="h-3 w-3" /> {t('admin.about.view_document', 'View Document')}
                                                    </a>
                                                ) : (
                                                    <p className="text-xs text-rose-500 font-medium italic">{t('common.not_uploaded', 'Missing Document')}</p>
                                                )}
                                            </div>
                                        </div>
                                        <label className="cursor-pointer bg-white border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors">
                                            {profile.images?.find(img => img.image_type === 'aadhar_card') ? t('common.replace', 'Replace') : t('common.upload', 'Upload')}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => handleImageUpload(e, 'aadhar_card')}
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                             <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('admin.about.logo_label', 'Organization Logo')}
                                    <span className="text-[10px] text-gray-400 font-bold uppercase ml-2 tracking-widest">{t('common.optional', 'Optional')}</span>
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors border-gray-200`}>
                                        {profile.images?.find(img => img.image_type === 'logo') ? (
                                            <img
                                                src={profile.images.find(img => img.image_type === 'logo').image_url}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 className={`h-6 w-6 text-gray-300`} />
                                        )}
                                    </div>
                                    <label className={`cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!hasCustomBranding ? 'opacity-50 grayscale' : 'hover:bg-gray-50'}`}>
                                        {profile.images?.find(img => img.image_type === 'logo') ? t('common.change', 'Change') : t('common.upload', 'Upload')}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            disabled={!hasCustomBranding}
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                        />
                                    </label>
                                </div>
                                {!hasCustomBranding && (
                                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl pointer-events-none group">
                                        <div className="pointer-events-auto bg-gray-900 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2 shadow-lg scale-90 group-hover:scale-100 transition-transform cursor-pointer" onClick={() => navigate('/admin/membership')}>
                                            <Lock className="h-3 w-3" /> {t('common.upgrade_to_unlock', 'Premium Feature')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cover Image Upload */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.about.cover_label', 'Cover Image')}</label>
                                <div className="relative group rounded-xl overflow-hidden aspect-video bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                    {profile.images?.find(img => img.image_type === 'cover') ? (
                                        <>
                                            <img
                                                src={profile.images.find(img => img.image_type === 'cover').image_url}
                                                alt="Cover"
                                                className="w-full h-full object-cover shadow-inner"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <label className={`cursor-pointer bg-white text-gray-900 p-2 rounded-lg transition-colors ${!hasCustomBranding ? 'hidden' : 'hover:bg-gray-100'}`}>
                                                    <ImageIcon className="h-4 w-4" />
                                                    <input type="file" className="hidden" accept="image/*" disabled={!hasCustomBranding} onChange={(e) => handleImageUpload(e, 'cover')} />
                                                </label>
                                                <button
                                                    onClick={() => handleDeleteImage(profile.images.find(img => img.image_type === 'cover').id)}
                                                    className={`bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors ${!hasCustomBranding ? 'hidden' : ''}`}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className={`flex flex-col items-center ${!hasCustomBranding ? 'opacity-30' : 'cursor-pointer'}`}>
                                            <Plus className="h-8 w-8 text-gray-300 mb-2" />
                                            <span className="text-xs text-gray-500">{t('admin.about.add_cover', 'Add Cover Image')}</span>
                                            <input type="file" className="hidden" accept="image/*" disabled={!hasCustomBranding} onChange={(e) => handleImageUpload(e, 'cover')} />
                                        </label>
                                    )}
                                </div>
                                {!hasCustomBranding && (
                                    <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl pointer-events-none">
                                        <div className="pointer-events-auto bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl cursor-pointer hover:bg-indigo-600 transition-colors" onClick={() => navigate('/admin/membership')}>
                                            <Lock className="h-4 w-4" /> {t('common.upgrade_to_unlock', 'Upgrade to Professional to unlock Branding')}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Gallery Management */}
                            <div className="space-y-3 relative">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">{t('admin.about.gallery_label', 'Photo Gallery')}</label>
                                    <span className="text-xs text-gray-500">{profile.images?.filter(i => i.image_type === 'gallery').length || 0}/10</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {profile.images?.filter(i => i.image_type === 'gallery').map(img => (
                                        <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square border border-gray-100 shadow-sm cursor-pointer bg-gray-50 flex items-center justify-center p-1.5" onClick={() => setSelectedImage(img.image_url)}>
                                            <img src={img.image_url} alt="Gallery" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                                    className={`bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-lg ${!planFeatures.has_gallery_upload ? 'hidden' : ''}`}
                                                    title="Delete Image"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(profile.images?.filter(i => i.image_type === 'gallery').length || 0) < 10 && (
                                        <label className={`border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center aspect-square transition-all group ${!planFeatures.has_gallery_upload ? 'opacity-30' : 'cursor-pointer hover:bg-gray-50 hover:border-indigo-300'}`}>
                                            <Plus className="h-6 w-6 text-gray-300 group-hover:text-indigo-400" />
                                            <input type="file" className="hidden" accept="image/*" multiple disabled={!planFeatures.has_gallery_upload} onChange={(e) => handleImageUpload(e, 'gallery')} />
                                        </label>
                                    )}
                                </div>
                                {!planFeatures.has_gallery_upload && (
                                    <div className="absolute inset-x-0 bottom-0 top-8 z-10 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl pointer-events-none">
                                        <div className="pointer-events-auto bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl cursor-pointer hover:bg-indigo-600 transition-colors" onClick={() => navigate('/admin/membership')}>
                                            <Lock className="h-4 w-4" /> {t('common.upgrade_to_unlock', 'Upgrade to Professional to unlock Photo Gallery')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image Lightbox Modal */}
                        <AnimatePresence>
                            {selectedImage && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setSelectedImage(null)}
                                    className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
                                >
                                    <motion.button
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={() => setSelectedImage(null)}
                                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 feedback-ring"
                                    >
                                        <X className="h-6 w-6" />
                                    </motion.button>

                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="relative max-w-full max-h-full flex items-center justify-center"
                                    >
                                        <img
                                            src={selectedImage}
                                            alt="Full View"
                                            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                                        />
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="pt-8 border-t border-gray-100">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Save className="h-5 w-5" />
                                )}
                                {t('admin.about.save_btn', 'Save All Changes')}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default OrganizationAbout;
