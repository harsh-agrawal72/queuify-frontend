import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, ArrowRight, Star, Clock, Shield, Filter, ChevronRight, Sparkles, Users, BadgeCheck, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

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
    const { user } = useAuth();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('');

    useEffect(() => {
        const fetchOrgs = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (search) params.append('search', search);
                if (filter && filter !== 'All') params.append('type', filter);
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
        { label: 'Clinic', value: 'Clinic', icon: '🩺' },
        { label: 'Hospital', value: 'Hospital', icon: '🏥' },
        { label: 'Salon', value: 'Salon', icon: '💇' },
        { label: 'Bank', value: 'Bank', icon: '🏦' },
        { label: 'Government', value: 'Government Office', icon: '🏛️' },
        { label: 'Consultancy', value: 'Consultancy', icon: '💼' },
        { label: 'Coaching', value: 'Coaching Institute', icon: '📚' },
        { label: 'Service Center', value: 'Service Center', icon: '🔧' },
        { label: 'Other', value: 'Other', icon: '📋' },
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
        <div className="max-w-7xl mx-auto space-y-10 pb-20">
            {/* Elegant Hero Section */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 md:px-16 md:py-24 text-white">
                {/* Modern Abstract Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[80px]" />
                
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-6"
                    >
                        <Sparkles className="h-3 w-3" />
                        Explore Our Network
                    </motion.div>
                    
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight mb-6 leading-[1.1]"
                    >
                        Professional Services, <br />
                        <span className="text-indigo-400">Simplified.</span>
                    </motion.h1>
                    
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-lg md:text-xl font-medium mb-10 leading-relaxed"
                    >
                        Connect with top-rated organizations and manage your appointments with our intelligent queue system.
                    </motion.p>
                    
                    {/* Integrated Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative group max-w-xl"
                    >
                        <div className="absolute inset-0 bg-indigo-500/20 rounded-2xl blur-xl group-focus-within:bg-indigo-500/40 transition-all" />
                        <div className="relative flex items-center bg-white rounded-2xl p-1 shadow-2xl overflow-hidden">
                            <Search className="h-6 w-6 text-gray-400 ml-4" />
                            <input
                                type="text"
                                placeholder="Search by name, category, or service..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 font-medium py-4 px-4 text-sm md:text-base placeholder-gray-400"
                            />
                            <button className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition active:scale-95">
                                Search
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Category Filter Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Browse Categories</h2>
                    <div className="h-1 flex-1 mx-6 bg-gray-100 rounded-full hidden md:block" />
                </div>
                
                <div className="flex items-center gap-3 overflow-x-auto pb-4 px-2 no-scrollbar">
                    {categories.map((cat, idx) => (
                        <motion.button
                            key={cat.value}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => setFilter(cat.value)}
                            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border shadow-sm
                                ${filter === cat.value
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-100 scale-105'
                                    : 'bg-white text-gray-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30'
                                }`}
                        >
                            <span className="text-base">{cat.icon}</span>
                            {cat.label}
                        </motion.button>
                    ))}
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
                                                {org.is_verified && (
                                                    <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100 shadow-sm">
                                                        <BadgeCheck className="h-5 w-5" />
                                                    </div>
                                                )}
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
                                                            <span>{org.open_time?.slice(0, 5)} - {org.close_time?.slice(0, 5)}</span>
                                                        </div>
                                                        {(() => {
                                                            const now = new Date();
                                                            const currentStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                                                            const isOpen = currentStr >= (org.open_time?.slice(0, 5) || '00:00') && 
                                                                         currentStr <= (org.close_time?.slice(0, 5) || '23:59');
                                                            return (
                                                                <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border ${
                                                                    isOpen ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
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
