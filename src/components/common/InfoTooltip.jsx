import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InfoTooltip = ({ text, position = 'top', className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2.5',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2.5',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2.5',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2.5'
    };

    return (
        <div 
            className={`relative inline-flex items-center justify-center p-0.5 ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsVisible(!isVisible);
            }}
        >
            <div className={`flex items-center justify-center rounded-full transition-all duration-200 cursor-help border ${
                isVisible 
                ? 'bg-indigo-600 text-white shadow-lg border-indigo-700' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-100 shadow-sm'
            } w-5 h-5`}>
                <Info size={11} strokeWidth={3} />
            </div>
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        className={`absolute z-[999] w-64 p-4 bg-slate-900 border border-white/10 text-white text-xs font-medium leading-relaxed rounded-2xl shadow-2xl pointer-events-none select-none ${positions[position]}`}
                        style={{ filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' }}
                    >
                        {text}
                        {/* Tooltip Arrow */}
                        <div className={`absolute w-3 h-3 bg-slate-900 border-white/10 rotate-45 ${
                            position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r' :
                            position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-t border-l' :
                            position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' :
                            'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l'
                        }`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfoTooltip;
