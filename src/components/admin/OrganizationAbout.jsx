import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
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
    Clock,
    Globe,
    Mail,
    Phone,
    Facebook,
    Instagram,
    Linkedin,
    ShieldCheck,
    ShieldAlert,
    ShieldOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OrganizationAbout = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
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
        images: []
    });

    const fetchData = async () => {
        try {
            const res = await api.get('/organizations/profile');
            setProfile(prev => ({
                ...prev,
                ...res.data,
                images: res.data.images || []
            }));
        } catch (error) {
            console.error('Failed to fetch organization profile', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

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
            await api.patch('/organizations/profile', profile);
            toast.success('Profile updated successfully');
            fetchData(); // Refresh to get updated trust score
        } catch (error) {
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
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

        const toastId = toast.loading('Uploading image...');
        try {
            await api.post('/organizations/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Image uploaded successfully', { id: toastId });
            fetchData();
        } catch (error) {
            toast.error('Failed to upload image', { id: toastId });
        }
    };

    const handleDeleteImage = async (imageId) => {
        if (!window.confirm('Are you sure you want to delete this image?')) return;

        try {
            await api.delete(`/organizations/images/${imageId}`);
            toast.success('Image deleted');
            fetchData();
        } catch (error) {
            toast.error('Failed to delete image');
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
            {/* Header & Trust Score */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">About Organization</h1>
                    <p className="text-gray-500 mt-1">Manage your public profile to build trust with your customers.</p>
                </div>

                <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                className="text-indigo-200"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="transparent"
                                strokeDasharray={175.92}
                                strokeDashoffset={175.92 - (175.92 * profile.trustScore) / 100}
                                className="text-indigo-600 transition-all duration-1000"
                            />
                        </svg>
                        <span className="absolute text-sm font-bold text-indigo-700">{profile.trustScore}%</span>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Trust Score</p>
                        <p className="text-sm text-indigo-900 font-medium">
                            {profile.trustScore < 50 ? 'Complete your profile' :
                                profile.trustScore < 80 ? 'Looking good!' : 'Highly Trusted!'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Forms */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Basic Information */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Info className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    name="description"
                                    value={profile.description || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder="Tell your customers about your organization, history, and mission..."
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                                    <input
                                        type="number"
                                        name="established_year"
                                        value={profile.established_year || ''}
                                        onChange={handleChange}
                                        placeholder="e.g. 2010"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Staff</label>
                                    <input
                                        type="number"
                                        name="total_staff"
                                        value={profile.total_staff || ''}
                                        onChange={handleChange}
                                        placeholder="Approx. number of employees"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact & Location */}
                    <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <h2 className="text-lg font-semibold text-gray-900">Contact & Location</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        name="contact_email"
                                        value={profile.contact_email || ''}
                                        onChange={handleChange}
                                        placeholder="public@example.com"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                    <input
                                        type="tel"
                                        name="contact_phone"
                                        value={profile.contact_phone || ''}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={profile.address || ''}
                                    onChange={handleChange}
                                    placeholder="Street, Landmark..."
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={profile.city || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={profile.state || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                                    <input
                                        type="text"
                                        name="pincode"
                                        value={profile.pincode || ''}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="url"
                                        name="website_url"
                                        value={profile.website_url || ''}
                                        onChange={handleChange}
                                        placeholder="https://www.example.com"
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
                            <h2 className="text-lg font-semibold text-gray-900">Social Media Links</h2>
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
                            <h2 className="text-lg font-semibold text-gray-900">Legal & Verification</h2>
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
                            <h2 className="text-lg font-semibold text-gray-900">Media</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Logo Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {profile.images?.find(img => img.image_type === 'logo') ? (
                                            <img
                                                src={profile.images.find(img => img.image_type === 'logo').image_url}
                                                alt="Logo"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 className="h-6 w-6 text-gray-300" />
                                        )}
                                    </div>
                                    <label className="cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                                        {profile.images?.find(img => img.image_type === 'logo') ? 'Change' : 'Upload'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                        />
                                    </label>
                                </div>
                            </div>

                            {/* Cover Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cover Image</label>
                                <div className="relative group rounded-xl overflow-hidden aspect-video bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                                    {profile.images?.find(img => img.image_type === 'cover') ? (
                                        <>
                                            <img
                                                src={profile.images.find(img => img.image_type === 'cover').image_url}
                                                alt="Cover"
                                                className="w-full h-full object-cover shadow-inner"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <label className="cursor-pointer bg-white text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <ImageIcon className="h-4 w-4" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                                                </label>
                                                <button
                                                    onClick={() => handleDeleteImage(profile.images.find(img => img.image_type === 'cover').id)}
                                                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <label className="cursor-pointer flex flex-col items-center">
                                            <Plus className="h-8 w-8 text-gray-300 mb-2" />
                                            <span className="text-xs text-gray-500">Add Cover Image</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Gallery Management */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">Photo Gallery</label>
                                    <span className="text-xs text-gray-500">{profile.images?.filter(i => i.image_type === 'gallery').length || 0}/10</span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                    {profile.images?.filter(i => i.image_type === 'gallery').map(img => (
                                        <div key={img.id} className="relative group rounded-lg overflow-hidden aspect-square border border-gray-100 shadow-sm cursor-pointer bg-gray-50 flex items-center justify-center p-1.5" onClick={() => setSelectedImage(img.image_url)}>
                                            <img src={img.image_url} alt="Gallery" className="w-full h-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img.id); }}
                                                    className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                                                    title="Delete Image"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {(profile.images?.filter(i => i.image_type === 'gallery').length || 0) < 10 && (
                                        <label className="cursor-pointer border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center aspect-square hover:bg-gray-50 hover:border-indigo-300 transition-all group">
                                            <Plus className="h-6 w-6 text-gray-300 group-hover:text-indigo-400" />
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={(e) => handleImageUpload(e, 'gallery')} />
                                        </label>
                                    )}
                                </div>
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
                                Save All Changes
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default OrganizationAbout;
