import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InfoTooltip = ({ text, position = 'top', className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div 
            className={`relative inline-flex items-center ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onTouchStart={() => setIsVisible(!isVisible)}
        >
            <Info className="h-3.5 w-3.5 text-gray-400 hover:text-indigo-500 cursor-help transition-colors" />
            
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                        className={`absolute z-[100] w-52 p-3 bg-slate-900/95 backdrop-blur-md text-white text-[11px] font-medium leading-relaxed rounded-2xl shadow-2xl pointer-events-none border border-white/10 ${positions[position]}`}
                    >
                        {text}
                        {/* Tooltip Arrow */}
                        <div className={`absolute w-2 h-2 bg-slate-900 border-white/10 rotate-45 ${
                            position === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r' :
                            position === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-t border-l' :
                            position === 'left' ? 'right-[-5px] top-1/2 -translate-y-1/2 border-t border-r' :
                            'left-[-5px] top-1/2 -translate-y-1/2 border-b border-l'
                        }`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfoTooltip;
