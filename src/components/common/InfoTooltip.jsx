import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Portal from './Portal';

const InfoTooltip = ({ text, position = 'top', align = 'center', className = "" }) => {
    const [isVisible, setIsVisible] = useState(false);
    const triggerRef = useRef(null);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + window.scrollY,
                left: rect.left + window.scrollX,
                width: rect.width,
                height: rect.height
            });
        }
    };

    useEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible]);

    // Position & Alignment Styles
    const getTooltipStyles = () => {
        if (!triggerRef.current) return {};
        
        const rect = triggerRef.current.getBoundingClientRect();
        const styles = { position: 'fixed', zIndex: 9999 };

        // Position logic
        if (position === 'top') {
            styles.top = rect.top - 10;
            styles.left = align === 'center' ? rect.left + rect.width / 2 : 
                         align === 'start' ? rect.left : rect.right;
            styles.translateX = align === 'center' ? '-50%' : 
                               align === 'start' ? '0%' : '-100%';
            styles.translateY = '-100%';
        } else if (position === 'bottom') {
            styles.top = rect.bottom + 10;
            styles.left = align === 'center' ? rect.left + rect.width / 2 : 
                         align === 'start' ? rect.left : rect.right;
            styles.translateX = align === 'center' ? '-50%' : 
                               align === 'start' ? '0%' : '-100%';
        } else if (position === 'left') {
            styles.top = rect.top + rect.height / 2;
            styles.left = rect.left - 10;
            styles.translateX = '-100%';
            styles.translateY = '-50%';
        } else if (position === 'right') {
            styles.top = rect.top + rect.height / 2;
            styles.left = rect.right + 10;
            styles.translateY = '-50%';
        }

        return styles;
    };

    const tooltipStyles = getTooltipStyles();

    return (
        <div 
            ref={triggerRef}
            className={`relative inline-flex items-center justify-center p-0.5 ${isVisible ? 'z-[100]' : 'z-auto'} ${className}`}
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
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: position === 'top' ? 8 : -8 }}
                            className={`fixed z-[9999] w-64 p-4 bg-slate-900 border border-white/10 text-white text-xs font-medium leading-relaxed rounded-2xl shadow-2xl pointer-events-none select-none`}
                            style={{ 
                                top: tooltipStyles.top,
                                left: tooltipStyles.left,
                                transform: `translate(${tooltipStyles.translateX || '0%'}, ${tooltipStyles.translateY || '0%'})`,
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' 
                            }}
                        >
                            {text}
                            {/* Tooltip Arrow */}
                            <div className={`absolute w-3 h-3 bg-slate-900 border-white/10 rotate-45 ${
                                position === 'top' ? 'bottom-[-6px] border-b border-r' :
                                position === 'bottom' ? 'top-[-6px] border-t border-l' :
                                position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' :
                                'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l'
                            }`} 
                            style={{
                                left: (position === 'top' || position === 'bottom') ? 
                                      (align === 'center' ? '50%' : align === 'start' ? '12px' : 'calc(100% - 12px)') : 
                                      (position === 'left' ? 'auto' : '-6px'),
                                transform: (position === 'top' || position === 'bottom') ? 'translateX(-50%) rotate(45deg)' : ''
                            }}
                            />
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default InfoTooltip;

