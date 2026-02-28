import { useState, useEffect } from 'react';
import { api, apiService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Calendar, User, Search, Filter } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AdminReviews() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRating, setFilterRating] = useState('all');

    useEffect(() => {
        let mounted = true;

        const fetchReviews = async () => {
            if (!user?.org_id) return;
            try {
                setLoading(true);
                const res = await apiService.getOrgReviews(user.org_id);
                if (mounted) {
                    console.log('Admin Reviews Fetched:', res.data);
                    setStats(res.data.stats);
                    setReviews(res.data.reviews || []);
                }
            } catch (err) {
                console.error("Failed to fetch reviews", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (user?.org_id) {
            fetchReviews();
        } else {
            setLoading(false); // don't hang if no org_id
        }

        return () => {
            mounted = false;
        };
    }, [user?.org_id]);

    const filteredReviews = reviews.filter(review => {
        const matchesSearch = review.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (review.comment && review.comment.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating;
        return matchesSearch && matchesRating;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
                    <p className="text-gray-500 mt-1">Monitor feedback and ratings from your patients.</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Average Rating</p>
                        <div className="flex items-end gap-2">
                            <h3 className="text-4xl font-black text-gray-900">{stats?.averageRating || '0.0'}</h3>
                            <span className="text-gray-400 font-medium mb-1">/ 5.0</span>
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-500">
                        <Star className="h-8 w-8 fill-current" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                >
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Reviews</p>
                        <h3 className="text-4xl font-black text-gray-900">{stats?.totalReviews || 0}</h3>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-500">
                        <MessageSquare className="h-8 w-8" />
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name or comment..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                    />
                </div>
                <div className="relative min-w-[150px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                        value={filterRating}
                        onChange={(e) => setFilterRating(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium appearance-none"
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden text-sm md:text-base">
                {filteredReviews.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900">No reviews found</h3>
                        <p className="mt-1">Try adjusting your filters or search term.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredReviews.map((review) => (
                            <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                            {review.user_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                {review.user_name}
                                            </h4>
                                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {format(parseISO(review.created_at), 'MMM d, yyyy - h:mm a')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full items-center gap-1 font-bold border border-yellow-200 shrink-0 self-start">
                                        <Star className="h-4 w-4 fill-current" /> {review.rating}/5
                                    </div>
                                </div>

                                {review.comment ? (
                                    <p className="text-gray-700 leading-relaxed mt-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        "{review.comment}"
                                    </p>
                                ) : (
                                    <p className="text-gray-400 italic mt-2 text-sm">No comment provided.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
