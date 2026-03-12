import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Clock, Shield, Heart, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const About = () => {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"></div>
                {/* Decorative Elements */}
                <div className="absolute top-20 right-0 w-[30rem] h-[30rem] bg-indigo-400/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
                            Reimagining how the <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">world waits.</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Queuify was built with a simple conviction: your time is your most valuable asset.
                            We empower businesses to manage their flow perfectly while giving customers their freedom back.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase mb-3">Our Story</h2>
                            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Born from frustration, built for efficiency.</h3>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                Queuify started in a crowded doctor's waiting room. Our founders realized that while almost every other aspect of our lives had been digitized and optimized, the act of waiting in line had barely evolved since the invention of the "take a ticket" dispenser in the 1960s.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                We saw anxious patients, frustrated staff, and a system that respected no one's time. We knew technology could solve this. What started as a simple SMS notification system for a single clinic quickly expanded into an enterprise-grade appointment and queue management platform capable of handling complex multi-service workflows across thousands of locations.
                            </p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center p-8 text-center">
                                <p className="text-3xl font-light text-white italic">"Time is the one resource you can never get back. We decided it was unacceptable to waste it in waiting rooms."</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* The Problem & Solution Section */}
            <section className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">The Analog Problem in a Digital World</h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                For decades, the standard procedure for appointments and walk-ins has been the same: arrive, write your name on a clipboard, sit in a crowded room, and wait indefinitely.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                This outdated system causes immense friction. Customers feel trapped, staff get overwhelmed managing angry crowds, and businesses lose revenue due to walk-aways and inefficiencies. The physical waiting room is a bottleneck to growth and customer satisfaction.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 relative"
                        >
                            <div className="absolute -top-6 -left-6 w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Zap className="h-6 w-6 text-indigo-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-6 mt-2">The Queuify Solution</h3>
                            <ul className="space-y-5">
                                {[
                                    { title: "Smart Queuing", desc: "Digital walk-ins and real-time status tracking." },
                                    { title: "Freedom to Wait Anywhere", desc: "Customers wait in their cars, at coffee shops, or at home." },
                                    { title: "Accurate Predictions", desc: "ML-driven ETA calculations keep expectations realistic." },
                                    { title: "Operational Control", desc: "Staff gets a birds-eye view of capacity and workflow." }
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-4">
                                        <div className="mt-1 flex-shrink-0 bg-indigo-50 rounded-full p-1.5">
                                            <CheckCircle className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <span className="text-gray-900 font-semibold block">{item.title}</span>
                                            <span className="text-gray-500 text-sm">{item.desc}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Who We Serve */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Industries We Transform</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-16">Queuify is designed to be highly adaptable, handling everything from quick retail checkouts to complex multi-stage medical visits.</p>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { title: "Healthcare", desc: "Clinics, hospitals, and labs where reducing physical congestion is critical for health." },
                            { title: "Retail", desc: "High-volume stores, fitting rooms, and customer service desks." },
                            { title: "Public Sector", desc: "DMVs, government offices, and civic centers handling large daily citizen volumes." },
                            { title: "Education", desc: "University advising, financial aid offices, and student health centers." }
                        ].map((sector, i) => (
                            <div key={i} className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-100 hover:border-indigo-200 transition-colors">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{sector.title}</h3>
                                <p className="text-gray-600">{sector.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-24 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
                        <p className="text-xl text-gray-400">The principles that guide how we build our product and interact with our customers.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Empathy First",
                                desc: "We design for the stressed parent at the clinic and the overwhelmed receptionist at the desk. Compassion drives our UX.",
                                color: "text-rose-400",
                                bg: "bg-rose-500/10"
                            },
                            {
                                icon: Target,
                                title: "Radical Simplicity",
                                desc: "Enterprise software doesn't have to be complicated. We believe in intuitive interfaces that require zero training.",
                                color: "text-blue-400",
                                bg: "bg-blue-500/10"
                            },
                            {
                                icon: Shield,
                                title: "Unwavering Reliability",
                                desc: "If our system goes down, businesses halt. We build with enterprise-grade stability and security from day one.",
                                color: "text-emerald-400",
                                bg: "bg-emerald-500/10"
                            }
                        ].map((val, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-gray-800 p-8 rounded-2xl border border-gray-700"
                            >
                                <div className={`w-14 h-14 ${val.bg} ${val.color} rounded-xl flex items-center justify-center mb-6`}>
                                    <val.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{val.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{val.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats / Impact Section */}
            <section className="py-24 bg-indigo-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { label: "Hours of Waiting Saved", value: "2M+" },
                            { label: "Organizations Powered", value: "500+" },
                            { label: "Queue Sessions Managed", value: "10M+" },
                            { label: "System Uptime", value: "99.99%" }
                        ].map((stat, i) => (
                            <div key={i} className="px-4">
                                <div className="text-4xl md:text-5xl font-extrabold mb-3">{stat.value}</div>
                                <div className="text-indigo-200 font-medium tracking-wide text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-32 bg-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-indigo-50 rounded-full blur-3xl -z-10"></div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Ready to transform your customer experience?</h2>
                    <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">Join hundreds of forward-thinking organizations using Queuify to eliminate lines and boost satisfaction.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-2xl hover:-translate-y-1 hover:shadow-indigo-500/25"
                    >
                        Get Started Free <ChevronRight className="h-6 w-6" />
                    </Link>
                </div>
            </section>

            <Footer />
        </div>
    );
};

// CheckCircle icon component for simple reuse in this file
const CheckCircle = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
)

export default About;
