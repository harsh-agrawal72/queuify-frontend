import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Users, Calendar, Clock, ChevronLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

const SlotView = () => {
    const [searchParams] = useSearchParams();
    const orgId = searchParams.get('orgId');
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!orgId) {
            toast.error('No organization selected');
            navigate('/organizations');
            return;
        }

        const fetchSlots = async () => {
            try {
                const res = await api.get(`/slots?orgId=${orgId}`);
                setSlots(res.data);
            } catch (err) {
                console.error(err);
                if (err.response?.status !== 404) {
                    toast.error('Failed to load slots');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, [orgId, navigate]);

    const handleBook = async (slotId) => {
        try {
            const loadingToast = toast.loading('Booking slot...');
            await api.post('/appointments', {
                orgId,
                slotId
            });
            toast.dismiss(loadingToast);
            toast.success('Appointment booked successfully!');
            navigate('/dashboard/appointments');
        } catch (err) {
            toast.dismiss();
            toast.error(err.response?.data?.message || 'Booking failed');
        }
    };

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/organizations')}
                className="flex items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Organizations
            </button>

            <div>
                <h2 className="text-2xl font-bold text-gray-900">Available Slots</h2>
                <p className="text-gray-500 text-sm">Select a time slot to book your appointment</p>
            </div>

            {loading ? (
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.map((slot, index) => {
                        const isFull = slot.booked_count >= slot.max_capacity;
                        const percentFilled = (slot.booked_count / slot.max_capacity) * 100;

                        return (
                            <motion.div
                                key={slot.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={clsx(
                                    "bg-white p-6 rounded-2xl border transition-all duration-200",
                                    isFull
                                        ? "border-gray-100 opacity-60"
                                        : "border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100"
                                )}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Calendar className="h-6 w-6" />
                                    </div>
                                    <div className={clsx(
                                        "px-2.5 py-1 rounded-full text-xs font-bold",
                                        isFull ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                                    )}>
                                        {isFull ? 'FULL' : 'AVAILABLE'}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    {format(new Date(slot.start_time), 'h:mm a')}
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">
                                    {format(new Date(slot.start_time), 'EEEE, MMMM d')}
                                </p>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex items-center">
                                            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                                            <span>Capacity</span>
                                        </div>
                                        <span className="font-medium">{slot.booked_count} / {slot.max_capacity}</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full rounded-full transition-all duration-500",
                                                isFull ? "bg-red-500" : "bg-green-500"
                                            )}
                                            style={{ width: `${percentFilled}%` }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleBook(slot.id)}
                                    disabled={isFull}
                                    className={clsx(
                                        "w-full mt-6 py-2.5 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2",
                                        isFull
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-95"
                                    )}
                                >
                                    {isFull ? 'No Slots Available' : 'Book Appointment'}
                                </button>
                            </motion.div>
                        );
                    })}
                    {slots.length === 0 && (
                        <div className="col-span-full text-center py-12">
                            <p className="text-gray-500 text-lg">No slots available for this organization.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SlotView;
