import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, ArrowRight, Star, Clock, Shield, Filter, ChevronRight, Sparkles, Users, BadgeCheck, MessageCircle, Stethoscope, Scissors, Landmark, Library, Briefcase, GraduationCap, Wrench, ClipboardList } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const getIndustryTerminology = (type) => {
    switch (type) {
        case 'Salon': return { action: 'View Services', item: 'Service', emoji: '💇' };
        case 'Bank': return { action: 'Reserve Slot', item: 'Visit', emoji: '🏦' };
        case 'Hospital': return { action: 'Book Appointment', item: 'Appointment', emoji: '🏥' };
        case 'Clinic': return { action: 'Book Appointment', item: 'Appointment', emoji: '🩺' };
        case 'Government Office': return { action: 'Schedule Visit', item: 'Visit', emoji: '🏛️' };
        case 'Consultancy': return { action: 'Schedule Consultation', item: 'Consultation', emoji: '💼' };
        case 'Coaching Institute': return { action: 'Join Class/Slot', item: 'Class', emoji: '📚' };
        case 'Service Center': return { action: 'Schedule Service', item: 'Repair', emoji: '🔧' };
        default: return { action: 'Book Appointment', item: 'Appointment', emoji: '📋' };
    }
};

const formatTime12h = (timeStr) => {
    if (!timeStr || timeStr === '-') return null;
    try {
        const parts = timeStr.split(':');
        if (parts.length < 2) return timeStr;
        let [hours, minutes] = parts;
        let h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${minutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
};
const getTypeGradient = (type) => {
    switch (type) {
        case 'Hospital': case 'Clinic': return 'from-slate-700 to-slate-800';
        case 'Salon': return 'from-zinc-700 to-zinc-800';
        case 'Bank': return 'from-slate-800 to-indigo-950';
        case 'Government Office': return 'from-stone-700 to-stone-800';
        case 'Consultancy': return 'from-indigo-900 to-slate-900';
        case 'Coaching Institute': return 'from-teal-900 to-slate-900';
        case 'Service Center': return 'from-slate-600 to-slate-700';
        default: return 'from-slate-800 to-slate-900';
    }
};

export default function OrganizationsList() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    useEffect(() => {
        const fetchOrgs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (filter === 'favorites') params.append('onlyFavorites', 'true');
                else if (filter && filter !== 'All') params.append('type', filter);
                
                if (user?.city) params.append('city', user.city);
                if (user?.state) params.append('state', user.state);
                if (user?.pincode) params.append('pincode', user.pincode);
                params.append('status', 'active');

                const { data } = await api.get(`/organizations?${params.toString()}`);
                setOrgs(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        const timer = setTimeout(fetchOrgs, 400);
        return () => clearTimeout(timer);
    }, [search, filter]);

    const categories = [
        { label: 'All', value: '', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Clinic', value: 'Clinic', icon: <Stethoscope className="h-4 w-4" /> },
        { label: 'Hospital', value: 'Hospital', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Salon', value: 'Salon', icon: <Scissors className="h-4 w-4" /> },
        { label: 'Bank', value: 'Bank', icon: <Landmark className="h-4 w-4" /> },
        { label: 'Government', value: 'Government Office', icon: <Library className="h-4 w-4" /> },
        { label: 'Consultancy', value: 'Consultancy', icon: <Briefcase className="h-4 w-4" /> },
        { label: 'Coaching', value: 'Coaching Institute', icon: <GraduationCap className="h-4 w-4" /> },
        { label: 'Service Center', value: 'Service Center', icon: <Wrench className="h-4 w-4" /> },
        { label: 'Other', value: 'Other', icon: <ClipboardList className="h-4 w-4" /> },
    ];

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        for (let i = 0; i < 5; i++) {
            stars.push(
                <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < fullStars ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                />
            );
        }
        return stars;
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Elegant Compact Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 px-6 py-8 md:px-10 md:py-10 text-white shadow-2xl shadow-indigo-100/20">
                {/* Modern Abstract Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
                
                <div className="relative z-10 max-w-2xl">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-black tracking-tight mb-3 leading-tight"
                    >
                        Professional Services, <span className="text-indigo-400">Simplified.</span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-400 text-xs md:text-sm font-medium mb-6 leading-relaxed max-w-lg"
                    >
                        Connect with top-rated organizations and manage your appointments with our intelligent queue system.
                    </motion.p>
                    
                    {/* Integrated Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative group max-w-xl"
                    >
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-xl blur-xl group-focus-within:bg-indigo-500/40 transition-all" />
                        <div className="relative flex items-center bg-white rounded-xl p-0.5 shadow-2xl overflow-hidden">
                            <Search className="h-5 w-5 text-gray-400 ml-3" />
                            <input
                                type="text"
                                placeholder="Search by name, category, or service..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium py-3 px-3 text-xs md:text-sm placeholder-gray-400"
                            />
                            <button className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 transition active:scale-95 text-sm">
                                Search
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Category Filter Section - Now as a Custom Dropdown with Icons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">{t('org.browse_categories', 'Browse Categories')}</h2>
                    <button
                        onClick={() => setFilter(filter === 'favorites' ? '' : 'favorites')}
                        className={`ml-2 p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 text-xs font-bold ${
                            filter === 'favorites'
                            ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100'
                            : 'bg-white text-gray-400 border-gray-100 hover:text-rose-500 hover:border-rose-100'
                        }`}
                        title={filter === 'favorites' ? "Show All Organizations" : "Show Favorites Only"}
                    >
                        <Star className={`h-4 w-4 ${filter === 'favorites' ? 'fill-rose-600' : ''}`} />
                        <span>{t('org.favorites', 'Favorites')}</span>
                    </button>
                </div>
                
                <div className="relative min-w-[260px] z-30">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full pl-11 pr-12 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all flex items-center justify-between hover:border-indigo-200"
                    >
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500">
                            <Filter className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span>{categories.find(c => c.value === filter)?.icon}</span>
                            <span>{categories.find(c => c.value === filter)?.label || 'All'}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? '-rotate-90' : 'rotate-90'}`} />
                    </button>

                    <AnimatePresence>
                        {isDropdownOpen && (
                            <>
                                {/* Click Away Backdrop */}
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsDropdownOpen(false)} 
                                />
                                
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full right-0 w-[400px] mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-indigo-100/50 overflow-hidden z-20"
                                >
                                    <div className="grid grid-cols-2 p-2 gap-1">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat.value}
                                                onClick={() => {
                                                    setFilter(cat.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold transition-all rounded-xl hover:bg-indigo-50 group
                                                    ${filter === cat.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600'}
                                                `}
                                            >
                                                <div className={`p-1.5 rounded-lg transition-colors ${filter === cat.value ? 'bg-white shadow-sm' : 'bg-gray-50 group-hover:bg-white'}`}>
                                                    <span className="text-indigo-500">{cat.icon}</span>
                                                </div>
                                                <span className="truncate">{cat.label}</span>
                                                {filter === cat.value && (
                                                    <BadgeCheck className="h-3.5 w-3.5 text-indigo-600 ml-auto" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="space-y-8">
                {!loading && (
                    <div className="flex items-center justify-between px-2">
                        <p className="text-sm font-medium text-gray-500">
                            Found <span className="text-gray-900 font-black">{orgs.length}</span> results
                        </p>
                        {search && (
                            <button 
                                onClick={() => setSearch('')}
                                className="text-xs font-bold text-indigo-600 hover:underline"
                            >
                                Clear search
                            </button>
                        )}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-2xl animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-3/4 bg-gray-100 rounded-full animate-pulse" />
                                        <div className="h-3 w-1/2 bg-gray-50 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-12 bg-gray-100 rounded-2xl animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : orgs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                        <AnimatePresence mode="popLayout">
                            {orgs.map((org, index) => {
                                const term = getIndustryTerminology(org.type);
                                const gradient = getTypeGradient(org.type);
                                const hasRating = org.avg_rating > 0;

                                return (
                                    <motion.div
                                        key={org.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="group bg-white rounded-[2.5rem] border border-gray-100 p-1 hover:border-indigo-100 hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] transition-all duration-500 flex flex-col h-full"
                                    >
                                        <div className="p-7 flex flex-col h-full">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-6">
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} p-0.5 shadow-lg group-hover:scale-110 transition-transform duration-500 overflow-hidden`}>
                                                    <div className="w-full h-full bg-white rounded-[0.85rem] flex items-center justify-center overflow-hidden">
                                                        {org.logo_url ? (
                                                            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className={`text-2xl font-black bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
                                                                {org.name[0]}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            const toggleFav = async () => {
                                                                try {
                                                                    const res = await api.post(`/organizations/${org.id}/favorite`);
                                                                    setOrgs(prev => prev.map(o => 
                                                                        o.id === org.id ? { ...o, is_favorite: res.data.isFavorite } : o
                                                                    ));
                                                                } catch (err) {
                                                                    console.error("Failed to toggle favorite", err);
                                                                }
                                                            };
                                                            toggleFav();
                                                        }}
                                                        className={`p-2.5 rounded-xl border transition-all duration-300 ${
                                                            org.is_favorite 
                                                            ? 'bg-rose-50 text-rose-600 border-rose-100 shadow-sm shadow-rose-100' 
                                                            : 'bg-white text-gray-300 border-gray-100 hover:text-rose-400 hover:border-rose-100'
                                                        }`}
                                                    >
                                                        <Star className={`h-5 w-5 ${org.is_favorite ? 'fill-rose-600' : ''}`} />
                                                    </button>
                                                    {org.is_verified && (
                                                        <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100 shadow-sm">
                                                            <BadgeCheck className="h-5 w-5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="space-y-2 mb-6">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                                                        {org.name}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-lg">
                                                        {org.type || 'Professional'}
                                                    </span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-lg">
                                                        ID: {org.org_code}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Details Section */}
                                            <div className="space-y-4 mb-8 flex-1">
                                                {hasRating ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-0.5">
                                                            {renderStars(parseFloat(org.avg_rating))}
                                                        </div>
                                                        <span className="text-sm font-black text-gray-900 ml-1">{Number(org.avg_rating).toFixed(1)}</span>
                                                        <span className="text-xs text-gray-400 font-medium">({org.total_reviews})</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-gray-400 font-bold bg-gray-50/50 px-3 py-1.5 rounded-xl border border-gray-100 w-fit">
                                                        No ratings yet
                                                    </div>
                                                )}

                                                <div className="flex flex-col gap-2.5">
                                                    {org.address && (
                                                        <div className="flex items-start gap-2 text-xs text-gray-500 font-medium">
                                                            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                                            <span className="line-clamp-1">{org.address}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                            <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>
                                                                {org.open_time && org.close_time ? (
                                                                    `${formatTime12h(org.open_time)} - ${formatTime12h(org.close_time)}`
                                                                ) : (
                                                                    'Schedule not set'
                                                                )}
                                                            </span>
                                                        </div>
                                                        {(() => {
                                                            if (!org.open_time || !org.close_time) return null;
                                                            const now = new Date();
                                                            const currentMin = now.getHours() * 60 + now.getMinutes();
                                                            const [oH, oM] = org.open_time.split(':').map(Number);
                                                            const [cH, cM] = org.close_time.split(':').map(Number);
                                                            const openMin = oH * 60 + (oM || 0);
                                                            const closeMin = cH * 60 + (cM || 0);
                                                            
                                                            const isOpen = currentMin >= openMin && currentMin <= closeMin;
                                                            return (
                                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border shadow-sm ${
                                                                    isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                                                }`}>
                                                                    {isOpen ? 'Open Now' : 'Closed'}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Professional CTA */}
                                            <div className="flex items-center gap-3">
                                                <Link
                                                    to={`/organizations/${org.slug}`}
                                                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm text-center transition-all duration-300 hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 active:scale-95 flex items-center justify-center gap-2 group/btn"
                                                >
                                                    {term.action}
                                                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Link>
                                                {org.contact_phone && (
                                                    <a
                                                        href={`https://wa.me/${org.contact_phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 transition-colors"
                                                    >
                                                        <MessageCircle className="h-5 w-5" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-24 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100"
                    >
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50">
                            <Building2 className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">No organizations found</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto mb-8">
                            We couldn't find any results matching your current filters. Try searching with different terms.
                        </p>
                        <button
                            onClick={() => { setSearch(''); setFilter(''); }}
                            className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold border border-indigo-100 hover:bg-indigo-50 transition shadow-sm"
                        >
                            Reset all filters
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
