import React, { useState } from 'react';

const getIndustryTerminology = (type) => {
    switch (type) {
        case 'Salon': return { action: 'Confirm Service', item: 'Service' };
        case 'Bank': return { action: 'Confirm Visit', item: 'Visit' };
        case 'Hospital':
        case 'Clinic': return { action: 'Confirm Appointment', item: 'Appointment' };
        case 'Government Office': return { action: 'Confirm Visit', item: 'Visit' };
        case 'Consultancy': return { action: 'Confirm Consultation', item: 'Consultation' };
        case 'Coaching Institute': return { action: 'Confirm Class', item: 'Class' };
        default: return { action: 'Confirm Booking', item: 'Booking' };
    }
};

const BookingModal = ({ slot, orgName, orgType, isOpen, onClose, onConfirm, bookingData }) => {
    const [prefResource, setPrefResource] = useState('ANY');
    const [prefTime, setPrefTime] = useState('FLEXIBLE');

    if (!isOpen) return null;
    const term = getIndustryTerminology(orgType);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
            <div className="relative p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white animate-in fade-in zoom-in duration-200">

                {!bookingData ? (
                    <>
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{term.action}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Confirming your {term.item.toLowerCase()} at <span className="font-semibold text-gray-900">{orgName}</span>
                            </p>

                            <div className="bg-indigo-50 p-4 rounded-xl text-left mb-6 border border-indigo-100">
                                <p className="text-sm font-medium text-indigo-900"><strong>Date:</strong> {new Date(slot.start_time).toLocaleDateString()}</p>
                                <p className="text-sm font-medium text-indigo-900"><strong>Time:</strong> {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>

                            {/* Preferences Section */}
                            <div className="space-y-4 mb-8 text-left">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Resource Preference</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPrefResource('ANY')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${prefResource === 'ANY' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'}`}
                                        >
                                            Any Available
                                        </button>
                                        <button
                                            onClick={() => setPrefResource('SPECIFIC')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${prefResource === 'SPECIFIC' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'}`}
                                        >
                                            This Resource
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">"Any Available" allows us to reassign you to another doctor/staff if needed.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Rescheduling Priority</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPrefTime('URGENT')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${prefTime === 'URGENT' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-200'}`}
                                        >
                                            Urgent Today
                                        </button>
                                        <button
                                            onClick={() => setPrefTime('FLEXIBLE')}
                                            className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${prefTime === 'FLEXIBLE' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-200'}`}
                                        >
                                            Flexible
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">"Urgent" puts you on a high-priority waitlist if same-day reassignment fails.</p>
                                </div>
                            </div>

                            <button
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                                onClick={() => onConfirm(prefResource, prefTime)}
                            >
                                {term.action}
                            </button>
                            <button
                                className="w-full mt-3 py-2 text-gray-500 font-medium hover:text-gray-700 transition-colors"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-bold text-gray-900 mt-2">Booking Confirmed!</h3>
                            <div className="mt-2 px-2 py-3">
                                <p className="text-sm text-gray-500 mb-4">
                                    Your token number is:
                                </p>
                                <div className="text-3xl font-extrabold text-blue-600 bg-blue-50 py-3 rounded-lg border border-blue-100 tracking-wider">
                                    {bookingData.tokenNumber}
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Please save this token for your visit.</p>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    onClick={onClose}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
