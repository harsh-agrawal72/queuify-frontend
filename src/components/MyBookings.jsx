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
        <div className="space-y-4">
            {bookings.map((booking) => (
                <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 transition-all hover:shadow-md">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-lg text-gray-800">{booking.org_name || 'Organization'}</h4>
                            <p className="text-sm text-blue-600 font-medium mt-1">Token: {booking.token_number}</p>
                            <div className="mt-2 text-sm text-gray-600">
                                <p><span className="font-semibold">Date:</span> {new Date(booking.start_time).toLocaleDateString()}</p>
                                <p><span className="font-semibold">Time:</span> {new Date(booking.start_time).toLocaleTimeString()} - {new Date(booking.end_time).toLocaleTimeString()}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'getting_ready' ? 'bg-yellow-100 text-yellow-800' :
                                    booking.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                }`}>
                                {booking.status.replace('_', ' ').toUpperCase()}
                            </span>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{booking.org_name}</h3>
                                    <p className="text-sm text-gray-600">{booking.org_address}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase ${booking.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                                                booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'
                                            }`}>
                                            {booking.status}
                                        </span>
                                        {booking.payment_status && (
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase ${booking.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {booking.payment_status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-lg font-bold text-xl inline-block mb-2">
                                        #{booking.token_number}
                                    </div>
                                </div>
                            </div>

                            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                                <button
                                    onClick={() => onCancel(booking.id)}
                                    className="text-xs text-red-600 hover:text-red-800 underline mt-2"
                                >
                                    Cancel Booking
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MyBookings;
