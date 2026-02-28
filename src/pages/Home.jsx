import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import {
    ArrowRight,
    CheckCircle,
    Clock,
    Users,
    Shield,
    Zap,
    Layout,
    BarChart,
    Globe,
    Smartphone,
    Calendar,
    CreditCard,
    Building,
    Activity,
    ChevronRight,
    Star,
    Menu,
    X,
    Twitter,
    Linkedin,
    Github
} from 'lucide-react';
import toast from 'react-hot-toast';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';



const HeroSection = () => (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -z-10 animate-pulse-slow"></div>
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-indigo-50/60 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="max-w-4xl mx-auto"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    v2.0 Now Available
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                    Turn Waiting Time Into
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 pb-2">
                        Productive Time
                    </span>
                </h1>

                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Queuify helps clinics, salons, banks, and service businesses eliminate physical queues with real-time virtual line management.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                    <Link
                        to="/register"
                        className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-all hover:shadow-xl hover:shadow-gray-900/20 flex items-center justify-center gap-2"
                    >
                        Get Started <ArrowRight className="h-5 w-5" />
                    </Link>
                    <Link
                        to="/organizations"
                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    >
                        Find an Organization
                    </Link>
                </div>

                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> No setup fee
                    </div>
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" /> Cancel anytime
                    </div>
                </div>
            </motion.div>

            {/* Dashboard Preview Mockup */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-20 relative mx-auto max-w-5xl"
            >
                <div className="rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden p-2">
                    <div className="rounded-xl overflow-hidden bg-gray-50 border border-gray-100 aspect-[16/9] relative group">
                        {/* Realistic Mock UI Elements simulating the Admin dashboard */}
                        <div className="absolute top-0 left-0 w-full h-full bg-white flex">
                            {/* Sidebar */}
                            <div className="w-14 md:w-56 border-r border-gray-100 bg-gray-50/80 hidden sm:flex flex-col p-4 space-y-6 shrink-0">
                                <div className="flex items-center gap-2 mb-4 md:px-2">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0"><Layout className="h-4 w-4" /></div>
                                    <div className="hidden md:block font-bold text-gray-900 truncate">City Hospital</div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium md:px-3">
                                        <Activity className="h-5 w-5 shrink-0" /> <span className="hidden md:block text-sm">Live Queue</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 md:px-3">
                                        <Calendar className="h-5 w-5 shrink-0" /> <span className="hidden md:block text-sm">Appointments</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 md:px-3">
                                        <Users className="h-5 w-5 shrink-0" /> <span className="hidden md:block text-sm">Resources</span>
                                    </div>
                                    <div className="flex items-center gap-3 p-2.5 rounded-lg text-gray-500 hover:bg-gray-100 md:px-3">
                                        <BarChart className="h-5 w-5 shrink-0" /> <span className="hidden md:block text-sm">Analytics</span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 p-4 md:p-8 space-y-6 flex flex-col h-full bg-[#f8fafc] overflow-hidden">

                                {/* Header */}
                                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Dr. Sarah Connor</h3>
                                        <p className="text-xs text-gray-500">General Consultation Room • Token #45</p>
                                    </div>
                                    <button className="hidden sm:flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                                        <Users className="h-4 w-4" /> Call Next Person
                                    </button>
                                </div>

                                {/* Active Token Display */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-20"><Activity className="h-16 w-16" /></div>
                                        <p className="text-blue-100 text-sm font-medium mb-1">Currently Serving</p>
                                        <h2 className="text-4xl font-bold mb-2">A-045</h2>
                                        <p className="text-xs text-blue-200">Patient: John Doe</p>
                                    </div>

                                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Clock className="h-5 w-5" /></div>
                                            <p className="font-semibold text-gray-900">Avg Wait Time</p>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">14 <span className="text-sm font-medium text-gray-500">mins</span></h3>
                                    </div>

                                    <div className="hidden md:flex bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex-col justify-center">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-green-50 rounded-lg text-green-600"><Users className="h-5 w-5" /></div>
                                            <p className="font-semibold text-gray-900">People Waiting</p>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900">8 <span className="text-sm font-medium text-gray-500">tokens</span></h3>
                                    </div>
                                </div>

                                {/* Queue List */}
                                <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
                                        <h4 className="font-bold text-sm text-gray-900">Up Next</h4>
                                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">8 Waiting</span>
                                    </div>
                                    <div className="p-2 space-y-2 overflow-hidden">
                                        {[
                                            { token: 'A-046', name: 'Emily R.', time: '10:15 AM', status: 'ready', eta: 'Next' },
                                            { token: 'A-047', name: 'Michael C.', time: '10:30 AM', status: 'waiting', eta: 'in 15m' },
                                            { token: 'A-048', name: 'Wait-in Client', time: '10:35 AM', status: 'waiting', eta: 'in 25m' },
                                        ].map((item, i) => (
                                            <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${item.status === 'ready' ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-gray-100'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${item.status === 'ready' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {item.token}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.time}</div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-xs font-bold ${item.status === 'ready' ? 'text-green-600' : 'text-gray-500'}`}>{item.eta}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* Live Overlay Badge */}
                        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 bg-white/95 backdrop-blur shadow-xl border border-gray-100 rounded-xl p-3 flex items-center gap-3 transform hover:scale-105 transition-transform cursor-default z-20">
                            <div className="relative">
                                <span className="flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div className="pr-2">
                                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Live Sync active</div>
                                <div className="text-sm font-bold text-gray-900 leading-tight">Zero Refresh Required</div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    </section>
);

const SectionHeading = ({ children, title }) => (
    <div className="text-center mb-16 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">{title}</h2>
        <p className="text-xl text-gray-500 leading-relaxed">{children}</p>
    </div>
);

const ProblemSection = () => (
    <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Long Queues Are Killing Customer Experience">
                Inefficient queue management leads to lost revenue, frustrated customers, and operational chaos.
            </SectionHeading>

            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { icon: Clock, title: "Lost Productivity", desc: "Customers waste hours standing in line, leading to drop-offs and negative reviews." },
                    { icon: Users, title: "Frustrated Customers", desc: "Uncertainty about wait times creates anxiety and poor service perception." },
                    { icon: Activity, title: "Manual Chaos", desc: "Pen-and-paper systems are error-prone and provide no data insights." }
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-6">
                            <item.icon className="h-7 w-7" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const HowItWorksSection = () => (
    <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading title="How It Works">
                Three simple steps to modernize your queue management.
            </SectionHeading>

            <div className="relative mt-20">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 hidden md:block"></div>

                <div className="grid md:grid-cols-3 gap-12 relative z-10">
                    {[
                        { step: "01", title: "Create Services", desc: "Set up your organizations, services, and available time slots in minutes." },
                        { step: "02", title: "Book Online", desc: "Customers book slots easily via a simple, branded link." },
                        { step: "03", title: "Track Live", desc: "Everyone tracks the queue in real-time. Automated notifications properly pace arrivals." }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.2 }}
                            className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300 text-center relative"
                        >
                            <div className="w-16 h-16 mx-auto bg-white border-4 border-gray-50 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                {item.step}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                            <p className="text-gray-600">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

const TargetIndustries = () => (
    <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/20 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Built for Modern Service Businesses</h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">Scalable solutions for high-traffic environments.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { icon: Activity, label: "Clinics", sub: "Patient Flow" },
                    { icon: Zap, label: "Salons", sub: "Appointment" },
                    { icon: Building, label: "Govt Offices", sub: "Citizen Services" },
                    { icon: Building, label: "Banks", sub: "Teller Queues" },
                    { icon: Users, label: "Coaching", sub: "Student Batches" },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl text-center hover:bg-white/10 transition-colors cursor-default"
                    >
                        <item.icon className="h-8 w-8 mx-auto mb-4 text-blue-400" />
                        <div className="font-semibold text-lg">{item.label}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">{item.sub}</div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const FeaturesGrid = () => (
    <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeading title="Everything You Need to Scale">
                Powerful features packed into a simple, intuitive interface.
            </SectionHeading>

            <div className="grid md:grid-cols-4 gap-x-8 gap-y-12">
                {[
                    { icon: Globe, title: "Real-time Queue", desc: "Live position updates via WebSockets." },
                    { icon: Layout, title: "Slot Management", desc: "Flexible capacity planning per slot." },
                    { icon: Smartphone, title: "Live Notifications", desc: "SMS & Email alerts for customers." },
                    { icon: BarChart, title: "Analytics", desc: "Data on wait times and peak hours." },
                    { icon: Shield, title: "Admin Dashboard", desc: "Full control over bookings & staff." },
                    { icon: Building, title: "Multi-Org SaaS", desc: "Manage multiple branches easily." },
                    { icon: Zap, title: "Super Admin", desc: "Complete platform oversight." },
                ].map((feature, i) => (
                    <div key={i} className="group">
                        <div className="mb-4 inline-flex p-3 rounded-lg bg-gray-50 text-gray-900 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <feature.icon className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const LiveDemoPreview = () => (
    <section className="py-24 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-sm font-medium mb-6">
                        <Star className="h-3 w-3 fill-current" /> Admin Experience
                    </div>
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">Control Traffic Like a Pro</h2>
                    <p className="text-lg text-gray-600 mb-8">
                        The admin dashboard gives you a bird's-eye view of your entire operation.
                        Manage bookings and move queues forward with a single click.
                    </p>

                    <ul className="space-y-4 mb-8">
                        {['Live Queue Controls', 'Instant Booking Verification', 'Staff Management'].map(item => (
                            <li key={item} className="flex items-center gap-3 text-gray-700 font-medium">
                                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-purple-600" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Simulated Admin UI */}
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl blur-xl opacity-70"></div>
                    <div className="relative bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-100 p-4 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <div className="ml-4 text-xs text-gray-400 font-mono">admin.Queuify.com</div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="font-bold text-gray-900">Queue Management</h4>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Active</span>
                            </div>

                            <div className="space-y-3">
                                {[
                                    { name: "Sarah J.", id: "#A001", status: "In Progress", time: "10:00 AM" },
                                    { name: "Mike R.", id: "#A002", status: "Waiting", time: "10:15 AM" },
                                    { name: "Emily W.", id: "#A003", status: "Waiting", time: "10:30 AM" },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                {row.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{row.name}</div>
                                                <div className="text-xs text-gray-500">{row.id}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xs font-bold ${i === 0 ? 'text-blue-600' : 'text-gray-500'}`}>{row.status}</div>
                                            <div className="text-xs text-gray-400">{row.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);



const CallToAction = () => (
    <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-600"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-800 opacity-90"></div>

        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">Ready to eliminate waiting?</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
                Join thousands of businesses bringing their queues into the modern era. Setup takes less than 5 minutes.
            </p>
            <Link
                to="/register"
                className="inline-flex items-center justify-center px-10 py-5 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
            >
                Get Started Free
            </Link>
        </div>
    </section>
);



const Home = () => {
    return (
        <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Navbar />
            <main>
                <HeroSection />
                <ProblemSection />
                <HowItWorksSection />
                <TargetIndustries />
                <FeaturesGrid />
                <LiveDemoPreview />
                <CallToAction />
            </main>
            <Footer />
        </div>
    );
};

export default Home;
