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
    if (!isOpen) return null;
    const term = getIndustryTerminology(orgType);

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative p-5 border w-96 shadow-lg rounded-md bg-white">

                {!bookingData ? (
                    <>
                        <div className="mt-3 text-center">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{term.action}</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to {term.action.toLowerCase()} at <strong>{orgName}</strong>?
                                </p>
                                <div className="mt-4 bg-blue-50 p-2 rounded text-left">
                                    <p className="text-sm"><strong>Date:</strong> {new Date(slot.start_time).toLocaleDateString()}</p>
                                    <p className="text-sm"><strong>Time:</strong> {new Date(slot.start_time).toLocaleTimeString()} - {new Date(slot.end_time).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <div className="items-center px-4 py-3">
                                <button
                                    id="ok-btn"
                                    className="px-4 py-2 bg-green-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
                                    onClick={onConfirm}
                                >
                                    Confirm
                                </button>
                                <button
                                    className="mt-3 px-4 py-2 bg-gray-100 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                            </div>
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
