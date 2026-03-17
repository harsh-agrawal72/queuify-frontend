import React from 'react';
import { MessageCircle } from 'lucide-react';

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
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-400 font-bold text-lg border border-gray-100">
                        {org.logo_url ? (
                            <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                        ) : (
                            org.name[0]
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{org.name}</h3>
                            {org.contact_phone && (
                                <a
                                    href={`https://wa.me/${org.contact_phone.replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 rounded-full text-emerald-500 hover:bg-emerald-50 transition-colors"
                                    title="WhatsApp Chat"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </a>
                            )}
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
