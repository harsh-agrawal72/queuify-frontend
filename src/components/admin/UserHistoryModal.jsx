import { useState, useEffect } from 'react';
import { X, Calendar, User, Star, Clock, Award, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import clsx from 'clsx';

const UserHistoryModal = ({ userId, isOpen, onClose, userName }) => {
    const [loyalty, setLoyalty] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && userId) {
            fetchUserLoyaltyAndHistory();
        }
    }, [isOpen, userId]);

    const fetchUserLoyaltyAndHistory = async () => {
        setLoading(true);
        try {
            const [loyaltyRes, historyRes] = await Promise.all([
                api.get(`/admin/users/${userId}/loyalty`),
                api.get(`/admin/users/${userId}/history`)
            ]);
            setLoyalty(loyaltyRes.data);
            setHistory(historyRes.data);
        } catch (err) {
            console.error('Failed to fetch user history:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transition-all border border-gray-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <User className="h-5 w-5 text-indigo-600" />
                            {userName || 'User'} History
                        </h3>
                        <p className="text-sm text-gray-500">Member since {loyalty?.firstVisit ? format(new Date(loyalty.firstVisit), 'PP') : 'Beginning'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                            <p className="text-gray-500 font-medium">Loading history...</p>
                        </div>
                    ) : (
                        <>
                            {/* Loyalty Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-center">
                                    <div className="text-2xl font-black text-indigo-700">{loyalty?.visitCount || 0}</div>
                                    <div className="text-[10px] uppercase tracking-wider text-indigo-500 font-bold">Total Visits</div>
                                </div>
                                <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 text-center">
                                    <div className="text-sm font-black text-green-700 flex items-center justify-center gap-1">
                                        <Award className="h-4 w-4" />
                                        {loyalty?.loyaltyTier || 'Bronze'}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-green-500 font-bold">Loyalty Tier</div>
                                </div>
                                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 text-center">
                                    <div className="text-sm font-black text-amber-700">
                                        {loyalty?.lastVisit ? format(new Date(loyalty.lastVisit), 'MMM d') : 'Never'}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Last Visit</div>
                                </div>
                                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 text-center">
                                    <div className="text-2xl font-black text-red-700">
                                        {loyalty?.userCancellationCount || 0}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-red-500 font-bold">Cancellations</div>
                                </div>
                            </div>

                            {/* Visit Timeline */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest px-1">Past Appointments</h4>
                                <div className="space-y-3">
                                    {history.map((apt, idx) => (
                                        <div key={apt.id} className="relative pl-6 pb-2 last:pb-0 group">
                                            {/* Timeline Line */}
                                            {idx !== history.length - 1 && (
                                                <div className="absolute left-2.5 top-6 bottom-0 w-0.5 bg-gray-100 group-hover:bg-indigo-100 transition-colors"></div>
                                            )}
                                            {/* Timeline Dot */}
                                            <div className={clsx(
                                                "absolute left-0 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shadow-sm z-10",
                                                apt.status === 'completed' ? "bg-green-500 border-white text-white" : 
                                                apt.status === 'cancelled' ? "bg-red-500 border-white text-white" : 
                                                "bg-indigo-500 border-white text-white"
                                            )}>
                                                {apt.status === 'completed' ? <Star className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                            </div>

                                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{apt.service_name}</p>
                                                        <p className="text-xs text-gray-500 italic">by {apt.resource_name || 'Staff'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold text-gray-900">{format(new Date(apt.preferred_date), 'MMM d, yyyy')}</p>
                                                        <span className={clsx(
                                                            "text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full",
                                                            apt.status === 'completed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                                        )}>
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                {apt.review_rating && (
                                                    <div className="flex items-center gap-1 mt-2">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={clsx(
                                                                    "h-3 w-3", 
                                                                    i < apt.review_rating ? "text-amber-400 fill-amber-400" : "text-gray-200"
                                                                )} 
                                                            />
                                                        ))}
                                                        {apt.review_comment && (
                                                            <span className="text-xs text-gray-400 truncate max-w-[200px] ml-2 font-medium italic">
                                                                "{apt.review_comment}"
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {history.length === 0 && (
                                        <div className="text-center py-8 text-gray-400 font-medium">
                                            No past appointments found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {loyalty?.isFrequentVisitor && (
                            <div className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-indigo-200 animate-bounce">
                                <Award className="h-3 w-3" /> FREQUENT VISITOR
                            </div>
                        )}
                        {loyalty?.userCancellationCount > 2 && (
                            <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-red-200">
                                <ShieldAlert className="h-3 w-3" /> HIGH CANCELLATION RISK
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserHistoryModal;
