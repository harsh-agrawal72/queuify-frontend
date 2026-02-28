import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Search, MapPin, Building2, ArrowRight, Star, Clock, Shield, Filter, ChevronRight, Sparkles, Users, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
        case 'Hospital': case 'Clinic': return 'from-red-500 to-rose-600';
        case 'Salon': return 'from-pink-500 to-fuchsia-600';
        case 'Bank': return 'from-blue-500 to-cyan-600';
        case 'Government Office': return 'from-amber-500 to-orange-600';
        case 'Consultancy': return 'from-violet-500 to-purple-600';
        case 'Coaching Institute': return 'from-emerald-500 to-teal-600';
        case 'Service Center': return 'from-slate-500 to-gray-600';
        default: return 'from-indigo-500 to-blue-600';
    }
};

export default function OrganizationsList() {
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
        { label: 'All', value: '', icon: '🏢' },
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
        <div className="space-y-8">
            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-3xl p-8 md:p-10 text-white overflow-hidden"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-amber-300" />
                        <span className="text-xs font-bold uppercase tracking-widest text-indigo-200">Queuify Network</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black mb-2">Find & Book Instantly</h1>
                    <p className="text-indigo-200 text-sm md:text-base max-w-lg mb-6">
                        Discover trusted organizations near you. Skip the wait, book your appointment in seconds.
                    </p>

                    {/* Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search hospitals, clinics, salons..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-900 placeholder-gray-400 font-medium text-sm focus:ring-4 focus:ring-white/20 outline-none shadow-xl shadow-indigo-900/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Stats Bar */}
                    <div className="flex items-center gap-6 mt-6 text-xs text-indigo-200">
                        <div className="flex items-center gap-1.5">
                            <Shield className="h-4 w-4 text-emerald-400" />
                            <span className="font-semibold">Verified Organizations</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-amber-300" />
                            <span className="font-semibold">Real-time Availability</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-blue-300" />
                            <span className="font-semibold">{orgs.length}+ Organizations</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Category Filter Pills */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
            >
                <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                {categories.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => setFilter(cat.value)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border
                            ${filter === cat.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'
                            }`}
                    >
                        <span className="text-sm">{cat.icon}</span>
                        {cat.label}
                    </button>
                ))}
            </motion.div>

            {/* Results Count */}
            {!loading && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                        Showing <span className="font-bold text-gray-900">{orgs.length}</span> organization{orgs.length !== 1 ? 's' : ''}
                        {filter && filter !== 'All' && <span> in <span className="font-semibold text-indigo-600">{filter}</span></span>}
                        {search && <span> matching "<span className="font-semibold text-indigo-600">{search}</span>"</span>}
                    </p>
                </div>
            )}

            {/* Organization Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                            <div className="h-3 bg-gray-200 rounded-full animate-pulse" />
                            <div className="p-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-2xl animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-5 w-3/4 bg-gray-100 rounded-lg animate-pulse" />
                                        <div className="h-3 w-1/2 bg-gray-50 rounded-lg animate-pulse" />
                                    </div>
                                </div>
                                <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : orgs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {orgs.map((org, index) => {
                            const term = getIndustryTerminology(org.type);
                            const gradient = getTypeGradient(org.type);
                            const hasRating = org.avg_rating > 0;

                            return (
                                <motion.div
                                    key={org.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: index * 0.04 }}
                                    className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-100 transition-all duration-300 group flex flex-col"
                                >
                                    {/* Top Color Bar */}
                                    <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                                    <div className="p-6 sm:p-7 flex flex-col flex-1">
                                        {/* Header Row: Avatar + Info */}
                                        <div className="flex items-start gap-4 mb-5">
                                            <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                                {org.name[0]}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-1">
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <h3 className="text-xl font-black text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                        {org.name}
                                                    </h3>
                                                    <BadgeCheck className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100/80 px-2.5 py-1 rounded-md border border-gray-200 uppercase tracking-wide">
                                                        {org.org_code}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-gradient-to-r ${gradient} text-white shadow-sm`}>
                                                        {org.type || 'General'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rating Row */}
                                        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100/60">
                                            {hasRating ? (
                                                <div className="flex items-center bg-yellow-50/50 px-3 py-1.5 rounded-xl border border-yellow-100/50 w-fit">
                                                    <div className="flex items-center gap-1 mr-2">
                                                        {renderStars(parseFloat(org.avg_rating))}
                                                    </div>
                                                    <span className="text-sm font-black text-gray-900">{Number(org.avg_rating).toFixed(1)}</span>
                                                    <span className="text-xs text-gray-500 font-medium ml-1">({org.total_reviews} review{org.total_reviews !== 1 ? 's' : ''})</span>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">No reviews yet</span>
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="space-y-2.5 mb-5 flex-1">
                                            {org.address && (
                                                <div className="flex items-start gap-2 text-xs text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                                    <span className="line-clamp-2">{org.address}</span>
                                                </div>
                                            )}
                                            {(org.open_time || org.close_time) && (
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    <span>
                                                        {org.open_time?.slice(0, 5)} - {org.close_time?.slice(0, 5)}
                                                    </span>
                                                    {(() => {
                                                        const now = new Date();
                                                        const currentHours = now.getHours();
                                                        const currentMinutes = now.getMinutes();
                                                        const currentTimeStr = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

                                                        const isOpenTime = org.open_time ? org.open_time.slice(0, 5) : '00:00';
                                                        const isCloseTime = org.close_time ? org.close_time.slice(0, 5) : '23:59';

                                                        const isOpen = currentTimeStr >= isOpenTime && currentTimeStr <= isCloseTime;

                                                        return isOpen ? (
                                                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                Open
                                                            </span>
                                                        ) : (
                                                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                                Closed
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>

                                        {/* CTA Button */}
                                        <Link
                                            to={`/organizations/${org.slug}`}
                                            className="mt-2 relative flex items-center justify-center gap-2 w-full bg-gray-900 text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md group-hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] overflow-hidden group/btn"
                                        >
                                            <span className="relative z-10">{term.action}</span>
                                            <ArrowRight className="h-4 w-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                                            <div className="absolute inset-0 bg-white/0 hover:bg-white/10 transition-colors" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-20"
                >
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Building2 className="h-10 w-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No organizations found</h3>
                    <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                        {search
                            ? `We couldn't find any organizations matching "${search}". Try adjusting your search or filters.`
                            : 'No organizations are currently available. Check back later!'}
                    </p>
                    {(search || filter) && (
                        <button
                            onClick={() => { setSearch(''); setFilter(''); }}
                            className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm hover:underline"
                        >
                            Clear all filters
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    )}
                </motion.div>
            )}
        </div>
    );
}
