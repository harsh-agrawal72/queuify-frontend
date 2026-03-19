import React from 'react';

const MyBookings = ({ bookings, onCancel }) => {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-gray-500">You haven't made any bookings yet.</p>
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md border-l-4 overflow-hidden relative" style={{ borderLeftColor: booking.status === 'waitlisted_urgent' ? '#f59e0b' : '#4f46e5' }}>
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-gray-900">{booking.org_name || 'Organization'}</h4>
                                <span className={clsx(
                                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                                    booking.status === 'confirmed' && "bg-green-50 text-green-700 border-green-100",
                                    booking.status === 'waitlisted_urgent' && "bg-amber-100 text-amber-800 border-amber-200",
                                    booking.status === 'completed' && "bg-gray-50 text-gray-500 border-gray-200",
                                    booking.status === 'cancelled' && "bg-red-50 text-red-700 border-red-100",
                                    booking.status === 'pending' && "bg-blue-50 text-blue-700 border-blue-100"
                                )}>
                                    {booking.status === 'waitlisted_urgent' ? 'URGENT WAITLIST' : booking.status.replace('_', ' ')}
                                </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mb-3">{booking.service_name || 'General Service'}</p>

                            <div className="space-y-1.5 text-xs text-gray-600">
                                {booking.start_time ? (
                                    <>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <span className="text-gray-400">Date:</span>
                                            <span>{new Date(booking.start_time).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-medium">
                                            <span className="text-gray-400">Time:</span>
                                            <span>{new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="bg-red-50 text-red-700 p-2 rounded-lg font-bold border border-red-100 mt-2">
                                        {booking.status === 'waitlisted_urgent' 
                                            ? "Time update pending: High-priority waitlist for today." 
                                            : "Schedule interrupted: Manual action required."}
                                    </div>
                                )}
                                {booking.resource_name && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-gray-400">Resource:</span>
                                        <span className="font-medium">{booking.resource_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0">
                            <div className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-xl font-black text-lg mb-4 border border-indigo-100">
                                #{booking.token_number || booking.id.slice(-4).toUpperCase()}
                            </div>

                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <button
                                    onClick={() => onCancel(booking.id)}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors uppercase tracking-tighter"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
    );
};

export default MyBookings;
