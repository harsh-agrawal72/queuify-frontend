import React, { useState, useEffect } from 'react';
import { X, Info, AlertTriangle, AlertCircle, ExternalLink, Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

/**
 * BroadcastBanner displays global system messages at the top of the dashboard.
 * Supports types: info, success, warning, emergency, broadcast.
 */
const BroadcastBanner = ({ notifications = [], onDismiss }) => {
    const { t } = useTranslation();
    const [currentIndex, setCurrentIndex] = useState(0);

    const broadcasts = notifications.filter(n => 
        ['info', 'success', 'warning', 'emergency', 'broadcast'].includes(n.type) && !n.is_read
    );

    if (broadcasts.length === 0) return null;

    const current = broadcasts[currentIndex];

    const getStyles = (type) => {
        switch (type) {
            case 'emergency':
                return {
                    bg: 'bg-rose-600',
                    icon: AlertCircle,
                    textColor: 'text-white',
                    badge: 'bg-rose-500'
                };
            case 'warning':
                return {
                    bg: 'bg-amber-500',
                    icon: AlertTriangle,
                    textColor: 'text-white',
                    badge: 'bg-amber-400'
                };
            case 'info':
            case 'broadcast':
                return {
                    bg: 'bg-indigo-600',
                    icon: Megaphone,
                    textColor: 'text-white',
                    badge: 'bg-indigo-500'
                };
            case 'success':
                return {
                    bg: 'bg-emerald-600',
                    icon: Info,
                    textColor: 'text-white',
                    badge: 'bg-emerald-500'
                };
            default:
                return {
                    bg: 'bg-gray-800',
                    icon: Megaphone,
                    textColor: 'text-white',
                    badge: 'bg-gray-700'
                };
        }
    };

    const style = getStyles(current.type);
    const Icon = style.icon;

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % broadcasts.length);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className={clsx("relative w-full z-30 transition-colors duration-500", style.bg)}
            >
                <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap">
                        <div className="w-0 flex-1 flex items-center">
                            <span className={clsx("flex p-2 rounded-lg", style.badge)}>
                                <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                            </span>
                            <div className="ml-3 font-medium text-white truncate">
                                <span className="md:hidden">
                                    <strong>{current.title}:</strong> {current.message}
                                </span>
                                <span className="hidden md:inline">
                                    <strong className="mr-2 uppercase tracking-tighter text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                                        {t(`broadcast.type.${current.type}`, current.type)}
                                    </strong>
                                    <span className="font-bold mr-2">{current.title} —</span>
                                    <span>{current.message}</span>
                                </span>
                            </div>
                        </div>

                        <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto flex items-center gap-2">
                            {current.link && (
                                <a
                                    href={current.link}
                                    className="flex items-center justify-center px-4 py-1.5 border border-transparent rounded-lg shadow-sm text-xs font-bold text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                                >
                                    {t('common.view_details', 'View Details')}
                                    <ExternalLink className="ml-1 h-3 w-3" />
                                </a>
                            )}
                            
                            {broadcasts.length > 1 && (
                                <button
                                    onClick={handleNext}
                                    className="flex items-center justify-center px-3 py-1.5 border border-white/30 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors"
                                >
                                    {t('common.next', 'Next')} ({currentIndex + 1}/{broadcasts.length})
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => onDismiss?.(current.id)}
                                className="-mr-1 flex p-2 rounded-md hover:bg-black/10 focus:outline-none transition-colors"
                            >
                                <span className="sr-only">Dismiss</span>
                                <X className="h-5 w-5 text-white" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BroadcastBanner;
