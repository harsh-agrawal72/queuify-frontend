import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Navigation, ExternalLink } from 'lucide-react';

const MapModal = ({ isOpen, onClose, address, orgName }) => {
    if (!address) return null;

    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col h-[80vh]"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                                    <MapPin className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight">
                                        Location & Directions
                                    </h2>
                                    <p className="text-gray-500 text-sm font-medium">{orgName}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                            >
                                <X className="h-6 w-6 text-gray-400 group-hover:text-gray-600" />
                            </button>
                        </div>

                        {/* Map Area */}
                        <div className="flex-1 relative bg-gray-50">
                            <iframe
                                title="Organization Location"
                                width="100%"
                                height="100%"
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                                src={mapUrl}
                                className="grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                            />
                        </div>

                        {/* Footer Info & Actions */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Destination Address</p>
                                    <p className="text-slate-700 font-bold leading-relaxed">
                                        {address}
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <a
                                        href={directionsUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                                    >
                                        <Navigation className="h-4 w-4" />
                                        Get Directions
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MapModal;
