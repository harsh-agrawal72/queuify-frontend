import React from 'react';
import { Clock, Bell, XCircle, MapPin, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

const WaitlistTrackerCard = ({ notification, onCancel, onRefresh }) => {
    const { t } = useTranslation();
    const now = new Date();
    const desired = parseISO(notification.desired_time);
    const estimated = parseISO(notification.current_estimated_time);
    
    // Status Logic
    const isLive = differenceInMinutes(estimated, now) <= 15;
    const isReady = estimated <= desired;
    const minutesRemaining = differenceInMinutes(estimated, now);
    const waitGap = differenceInMinutes(estimated, desired);

    return (
        <div className={clsx(
            "bg-white rounded-2xl border-2 p-5 transition-all relative overflow-hidden",
            isReady ? "border-emerald-100 shadow-emerald-50 shadow-lg" : "border-gray-50 shadow-sm"
        )}>
            {/* Status Indicator */}
            <div className={clsx(
                "absolute top-0 right-0 px-4 py-1 text-[10px] font-black uppercase tracking-widest rounded-bl-xl",
                notification.status === 'notified' ? "bg-indigo-100 text-indigo-700" :
                isReady ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-amber-100 text-amber-700"
            )}>
                {notification.status === 'notified' ? t('user_dashboard.tracker.notified', 'Notified') : 
                 isReady ? t('user_dashboard.tracker.ready', 'Ready to book') : t('user_dashboard.tracker.tracking', 'Tracking Live')}
            </div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        {notification.org_name}
                        {isLive && <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">{notification.service_name}</p>
                </div>
                <button 
                    onClick={() => onCancel(notification.id)}
                    className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title={t('common.cancel', 'Cancel Tracker')}
                >
                    <XCircle className="h-5 w-5" />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('user_dashboard.tracker.desired_time', 'Your Preferred Time')}</p>
                    <p className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        {format(desired, 'h:mm a')}
                    </p>
                </div>
                <div className={clsx(
                    "p-3 rounded-xl border transition-colors",
                    isReady ? "bg-emerald-50 border-emerald-100" : "bg-indigo-50 border-indigo-100"
                )}>
                    <p className={clsx(
                        "text-[10px] font-black uppercase tracking-widest mb-1",
                        isReady ? "text-emerald-400" : "text-indigo-400"
                    )}>{t('user_dashboard.tracker.estimated_time', 'Current Estimated')}</p>
                    <p className={clsx(
                        "text-sm font-bold flex items-center gap-1.5",
                        isReady ? "text-emerald-700" : "text-indigo-700"
                    )}>
                        <Clock className="h-3.5 w-3.5" />
                        {format(estimated, 'h:mm a')}
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={clsx(
                            "h-full transition-all duration-1000 ease-out",
                            isReady ? "bg-emerald-500 w-full" : "bg-indigo-600 w-[65%]"
                        )} 
                    />
                </div>
                
                <div className="flex justify-between items-center">
                    <p className="text-[11px] text-gray-500 font-medium">
                        {isReady ? (
                            <span className="text-emerald-600 font-bold">{t('user_dashboard.tracker.go_book', "Queue reached! You can book now.")}</span>
                        ) : (
                            <span>{t('user_dashboard.tracker.wait_est', 'Approx. {{min}} mins until selection reaches your time', { min: waitGap })}</span>
                        )}
                    </p>
                    {isReady && (
                        <button className="flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:underline uppercase tracking-wider">
                            {t('user_dashboard.tracker.book_now', "Book Now")}
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Back-of-card info style */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(notification.slot_start), 'MMM dd, yyyy')}
                </div>
                <div className="text-[10px] text-gray-300 italic">
                    ID: {notification.id.slice(0, 8)}
                </div>
            </div>
        </div>
    );
};

export default WaitlistTrackerCard;
