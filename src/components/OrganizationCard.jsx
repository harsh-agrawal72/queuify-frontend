import React from 'react';

const getIndustryTerminology = (type) => {
    switch (type) {
        case 'Salon': return { action: 'View Services', item: 'Service' };
        case 'Bank': return { action: 'Reserve Slot', item: 'Visit' };
        case 'Hospital':
        case 'Clinic': return { action: 'Book Appointment', item: 'Appointment' };
        case 'Government Office': return { action: 'Schedule Visit', item: 'Visit' };
        case 'Consultancy': return { action: 'Schedule Consultation', item: 'Consultation' };
        case 'Coaching Institute': return { action: 'Join Class/Slot', item: 'Class' };
        case 'Service Center': return { action: 'Schedule Service', item: 'Repair' };
        default: return { action: 'Book Appointment', item: 'Appointment' };
    }
};

const OrganizationCard = ({ org, onViewSlots }) => {
    const term = getIndustryTerminology(org.type);

    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
            <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{org.name}</h3>
                            {org.type && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-100">
                                    {org.type}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 font-medium">#{org.org_code || 'N/A'}</p>
                    </div>
                </div>

                {org.address && (
                    <p className="text-gray-500 mb-4 text-sm flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                        {org.address}
                    </p>
                )}

                <button
                    onClick={() => onViewSlots(org)}
                    className="w-full bg-gray-900 text-white py-3 px-4 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                >
                    {term.action}
                </button>
            </div>
        </div>
    );
};

export default OrganizationCard;
