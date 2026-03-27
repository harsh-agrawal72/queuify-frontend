import React from 'react';
import { motion } from 'framer-motion';
import { User, Users, Play, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const QueueVisualization = ({ appointment }) => {
    const { 
        live_queue_number, 
        myRank,
        people_ahead: ahead, 
        serving_token: serving, 
        status,
        total_in_slot: total,
        estimated_service_time: svcTime,
        time_drift_minutes: driftMins
    } = appointment;

    const myToken = live_queue_number || myRank;

    const avgTime = svcTime || 15;
    const waitMins = appointment.estimated_wait_time ?? (ahead * avgTime);

    // If appointment is completed or cancelled, don't show visualization
    if (['completed', 'cancelled'].includes(status)) return null;

    // Calculate progress percentage
    // If serving is 5 and myToken is 10, people ahead is 5.
    // Progress could be (Serving / MyToken) * 100
    const progress = serving ? Math.min(Math.round((serving / myToken) * 100), 100) : 0;

    // Create an array of "people" to show
    // We'll show up to 5 people ahead to keep UI clean
    const displayAhead = Math.min(ahead, 4);
    const hasMoreAhead = ahead > 4;

    return (
        <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm overflow-hidden relative">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-200/20 rounded-full blur-3xl" />
            
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                        Live Queue Status
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    </h4>
                    <p className="text-xs text-indigo-500 font-medium italic">
                        {status === 'serving' ? "You're up! Go to the counter." : `${ahead} people ahead of you`}
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Your Token</span>
                    <p className="text-2xl font-black text-indigo-600 leading-none">#{myToken}</p>
                </div>
            </div>

            {/* The Visualization Track */}
            <div className="relative h-20 flex items-center mb-6">
                {/* Track Line */}
                <div className="absolute inset-x-0 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-indigo-500"
                    />
                </div>

                {/* People Icons */}
                <div className="absolute inset-x-0 flex justify-between items-center px-2">
                    {/* Serving Person */}
                    <div className="relative">
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${status === 'serving' ? 'bg-green-500 text-white' : 'bg-white text-indigo-600 border-2 border-indigo-100'}`}
                        >
                            {status === 'serving' ? <Play className="h-5 w-5 fill-current" /> : <Users className="h-5 w-5" />}
                        </motion.div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-400 uppercase whitespace-nowrap">
                            {status === 'serving' ? 'Serving You' : `Serving #${serving || '...'}`}
                        </span>
                    </div>

                    {/* Intermediate People (Dynamic) */}
                    {displayAhead > 0 && Array.from({ length: displayAhead }).map((_, i) => (
                        <div key={i} className="relative hidden sm:block opacity-40">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-300" />
                            </div>
                        </div>
                    ))}

                    {/* Has More Indicator */}
                    {hasMoreAhead && (
                        <div className="relative group">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                +{ahead - displayAhead}
                            </div>
                        </div>
                    )}

                    {/* YOU */}
                    {status !== 'serving' && (
                        <div className="relative">
                            <motion.div 
                                layoutId="user-icon"
                                className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-200 ring-4 ring-white"
                            >
                                <User className="h-6 w-6" />
                            </motion.div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-700 text-white text-[8px] font-black rounded uppercase whitespace-nowrap">
                                You
                            </div>
                            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-indigo-600 uppercase whitespace-nowrap">
                                Token #{myToken}
                            </span>
                        </div>
                    )}

                    {/* Goal */}
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-300 uppercase whitespace-nowrap">
                            Done
                        </span>
                    </div>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="mt-10 flex items-center gap-4 p-3 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Estimated Wait</p>
                    <p className="text-sm font-bold text-gray-900">
                        {status === 'serving' ? 'Instant Access' : (waitMins !== undefined ? (waitMins > 60 ? `${Math.floor(waitMins/60)}h ${waitMins%60}m` : `${waitMins} mins`) : 'Calculating...')}
                    </p>
                </div>
            </div>

            {/* Smart Drift Alert */}
            {driftMins >= 10 && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3"
                >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-amber-800 uppercase leading-none mb-1">Smart AI Prediction</p>
                        <p className="text-xs text-amber-700 font-medium leading-relaxed">
                            Queue is moving slightly slower. You can arrive **{Math.floor(driftMins/5)*5} mins** later than planned.
                        </p>
                    </div>
                </motion.div>
            )}

            {driftMins <= -7 && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3"
                >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-800 uppercase leading-none mb-1">System Optimization</p>
                        <p className="text-xs text-emerald-700 font-medium leading-relaxed">
                            Queue is moving faster today! Please arrive **{Math.abs(Math.floor(driftMins/5)*5)} mins** earlier than scheduled.
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default QueueVisualization;
