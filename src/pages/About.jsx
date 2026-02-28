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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50"></div>

                {/* Decorative Elements */}
                <div className="absolute top-20 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 left-20 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl -z-10"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
                            We're on a mission to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">eliminate waiting.</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Queuify was built with a simple belief: time is our most valuable asset.
                            We empower businesses to manage their flow efficiently while giving customers their time back.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* The Problem & Solution Section */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">The Waiting Room Problem</h2>
                            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                                For decades, the standard procedure for appointments and walk-ins has been the same: arrive, take a number or sign your name, sit in a crowded room, and wait indefinitely.
                            </p>
                            <p className="text-lg text-gray-600 leading-relaxed">
                                This outdated analog system causes anxiety for customers, creates chaotic environments for staff, and ultimately hurts the business. We knew there had to be a better way to handle foot traffic in the digital age.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-gray-50 rounded-2xl p-8 border border-gray-100 relative"
                        >
                            <div className="absolute -top-6 -left-6 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Zap className="h-6 w-6 text-blue-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4 mt-2">The Queuify Solution</h3>
                            <ul className="space-y-4">
                                {[
                                    "Real-time visibility into queue status",
                                    "Wait from anywhere, not just the lobby",
                                    "Accurate ETA predictions and notifications",
                                    "Streamlined operations for front-desk staff"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className="mt-1 bg-green-100 rounded-full p-1">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                        </div>
                                        <span className="text-gray-700 font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="py-24 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
                        <p className="text-xl text-gray-600">The principles that guide how we build our product and interact with our customers.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: Heart,
                                title: "Empathy First",
                                desc: "We design for the stressed parent at the clinic and the overwhelmed receptionist at the desk. Compassion drives our UX.",
                                color: "text-rose-500",
                                bg: "bg-rose-50"
                            },
                            {
                                icon: Target,
                                title: "Radical Simplicity",
                                desc: "Enterprise software doesn't have to be complicated. We believe in intuitive interfaces that require zero training.",
                                color: "text-blue-500",
                                bg: "bg-blue-50"
                            },
                            {
                                icon: Shield,
                                title: "Unwavering Reliability",
                                desc: "If our system goes down, businesses halt. We build with enterprise-grade stability and security from day one.",
                                color: "text-emerald-500",
                                bg: "bg-emerald-50"
                            }
                        ].map((val, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
                            >
                                <div className={`w-14 h-14 ${val.bg} ${val.color} rounded-xl flex items-center justify-center mb-6`}>
                                    <val.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{val.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{val.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats / Impact Section */}
            <section className="py-24 bg-blue-600 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-t border-b border-blue-500/30 py-12">
                        {[
                            { label: "Hours Saved", value: "2M+" },
                            { label: "Organizations", value: "500+" },
                            { label: "Queue Sessions", value: "10M+" },
                            { label: "Uptime", value: "99.99%" }
                        ].map((stat, i) => (
                            <div key={i} className="px-4">
                                <div className="text-4xl md:text-5xl font-extrabold mb-2">{stat.value}</div>
                                <div className="text-blue-200 font-medium uppercase tracking-wider text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-white text-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Ready to transform your customer experience?</h2>
                    <p className="text-xl text-gray-600 mb-10">Join the forward-thinking organizations using Queuify today.</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-indigo-600 transition-all shadow-xl hover:-translate-y-1"
                    >
                        Get Started <ChevronRight className="h-5 w-5" />
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
