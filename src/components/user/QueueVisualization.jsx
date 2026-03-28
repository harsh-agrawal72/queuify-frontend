import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Play, CheckCircle2, Clock, Sparkles, ChevronRight } from 'lucide-react';

const QueueVisualization = ({ appointment }) => {
    const { 
        live_queue_number, 
        myRank,
        people_ahead: ahead, 
        serving_token: serving, 
        status,
        estimated_service_time: svcTime,
        time_drift_minutes: driftMins
    } = appointment;

    const myToken = live_queue_number || myRank;
    const avgTime = svcTime || 15;
    const waitMins = appointment.estimated_wait_time ?? (ahead * avgTime);

    if (['completed', 'cancelled'].includes(status)) return null;

    // Progress calculation for the track
    const progress = serving ? Math.min(Math.round((serving / myToken) * 100), 100) : 0;
    const isServing = status === 'serving';

    return (
        <div className="mt-8 p-5 sm:p-8 bg-white rounded-[2rem] border border-slate-100 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
            {/* Ambient Background Glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-100/30 rounded-full blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-100/30 rounded-full blur-[100px]" />

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sm:gap-4 mb-10 sm:mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                                Live Queue Status
                            </h4>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded-full border border-green-100">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-black text-green-600 uppercase">Live</span>
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                            {isServing ? "It's your turn now!" : (ahead === 0 ? "You're next in line" : `${ahead} people ahead`)}
                        </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-center min-w-[120px] w-full sm:w-auto shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Your Token</span>
                        <span className="text-3xl font-black text-indigo-600">#{myToken}</span>
                    </div>
                </div>

                {/* Main Queue Track */}
                <div className="relative py-12">
                    {/* Track Background */}
                    <div className="absolute top-1/2 left-0 w-full h-3 bg-slate-100 rounded-full -translate-y-1/2 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 relative"
                        >
                            <div className="absolute top-0 right-0 w-8 h-full bg-white/30 skew-x-[30deg] animate-pulse" />
                        </motion.div>
                    </div>

                    {/* Checkpoints & Icons */}
                    <div className="relative flex justify-between items-center px-2">
                        {/* 1. START / SERVING */}
                        <div className="relative">
                            <motion.div 
                                animate={{ 
                                    boxShadow: isServing ? "0 0 20px rgba(34, 197, 94, 0.4)" : "0 0 0px rgba(0,0,0,0)",
                                    scale: isServing ? 1.1 : 1
                                }}
                                className={`w-14 h-14 rounded-2xl flex items-center justify-center relative z-20 transition-colors duration-500 ${isServing ? 'bg-green-500 text-white' : 'bg-white text-slate-400 border-2 border-slate-100 shadow-sm'}`}
                            >
                                {isServing ? <Play className="h-6 w-6 fill-current" /> : <Users className="h-6 w-6" />}
                                
                                {isServing && (
                                    <motion.div 
                                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="absolute inset-0 rounded-2xl bg-green-400 -z-10"
                                    />
                                )}
                            </motion.div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase whitespace-nowrap tracking-wider">
                                {isServing ? 'Current' : `Serving #${serving || '...'}`}
                            </div>
                        </div>

                        {/* 2. PROGRESS NODES (Visual Filler) */}
                        <div className="flex-1 flex justify-evenly items-center mx-4 group">
                            {[1, 2, 3].map((i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0.2 }}
                                    animate={{ opacity: ahead > i ? 0.4 : 0.1 }}
                                    className="w-2 h-2 rounded-full bg-slate-300"
                                />
                            ))}
                        </div>

                        {/* 3. YOU */}
                        <AnimatePresence mode="wait">
                            {!isServing && (
                                <motion.div 
                                    initial={{ scale: 0, opacity: 0, y: 20 }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                    exit={{ scale: 0, opacity: 0, y: -20 }}
                                    className="relative z-30"
                                >
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                        <motion.div 
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-indigo-200 uppercase"
                                        >
                                            You
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 rotate-45" />
                                        </motion.div>
                                    </div>
                                    <div className="w-14 h-14 sm:w-18 sm:h-18 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-300 ring-4 sm:ring-8 ring-white">
                                        <div className="relative">
                                            <User className="h-6 w-6 sm:h-8 sm:w-8" />
                                            {ahead > 0 && (
                                                <div className="absolute -right-1 -top-1 w-5 h-5 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-black">
                                                    {ahead}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-indigo-600 uppercase whitespace-nowrap tracking-wider">
                                        Ticket #{myToken}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex-1 flex justify-center items-center">
                             <ChevronRight className="h-4 w-4 text-slate-200 animate-pulse" />
                        </div>

                        {/* 4. GOAL */}
                        <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-300 uppercase whitespace-nowrap tracking-wider">
                                Finish
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wait Time Sentiment Card */}
                <div className="mt-12 p-5 sm:p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
                            <Clock className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Estimated Arrival</p>
                            <p className="text-lg sm:text-xl font-black text-slate-900">
                                {isServing ? 'Ready for Service' : (waitMins > 60 ? `${Math.floor(waitMins/60)}h ${waitMins%60}m` : `${waitMins} mins`)}
                            </p>
                        </div>
                    </div>
                    {driftMins !== 0 && (
                        <div className={`px-4 py-2 rounded-2xl flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start ${driftMins > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                            {driftMins > 0 ? <Sparkles className="h-4 w-4" /> : <Play className="h-4 w-4 rotate-90" />}
                            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                                {driftMins > 0 ? 'AI: Moving Slower' : 'AI: Moving Faster'}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueVisualization;
