import React, { useState } from 'react';
import { Mail, MapPin, Phone, Send, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post('/contact', formData);
            toast.success('Message sent successfully! We will get back to you soon.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (error) {
            console.error('Failed to send message:', error);
            toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50/50">
            <Navbar />

            {/* Premium Header Section */}
            <div className="relative bg-white pt-32 pb-24 overflow-hidden border-b border-gray-100">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-gradient-to-bl from-blue-50 to-indigo-50/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-purple-50 to-blue-50/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center justify-center p-2 bg-blue-50 rounded-2xl mb-8 border border-blue-100/50 shadow-sm relative group">
                        <div className="absolute inset-0 bg-blue-400 opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300"></div>
                        <div className="relative w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                            <MessageSquare className="h-6 w-6" />
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
                        Let's connect & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">collaborate.</span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Whether you have a strategic question or just want to say hello, our team in India is ready to support you.
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-grow py-20 relative z-10 -mt-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-5 gap-12 items-start">

                        {/* Contact Information Cards (Left Column) */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Email Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Email us</h3>
                                        <p className="mt-1 text-sm text-gray-500 font-medium">Direct line to our support team.</p>
                                        <a href="mailto:harsagrawal7270@gmail.com" className="mt-3 inline-flex text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors border-b border-blue-200 hover:border-blue-600 pb-0.5 break-all">
                                            harsagrawal7270@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Phone Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Call us</h3>
                                        <p className="mt-1 text-sm text-gray-500 font-medium">Mon-Sat from 9am to 6pm IST.</p>
                                        <a href="tel:+917668418353" className="mt-3 inline-block text-gray-900 hover:text-emerald-600 font-semibold text-lg transition-colors">
                                            +91 7668418353
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Location Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 group">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shadow-sm">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Visit us</h3>
                                        <p className="mt-1 text-sm text-gray-500 font-medium">Our India headquarters.</p>
                                        <p className="mt-3 text-gray-700 font-medium leading-relaxed">
                                            14 Chhipi Gali<br />
                                            Vrindavan, Mathura<br />
                                            Uttar Pradesh, 281121
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Premium Contact Form (Right Column) */}
                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 p-8 sm:p-10 border border-gray-100/60 relative overflow-hidden">
                                {/* Form Top Accent */}
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                                <h2 className="text-2xl font-bold text-gray-900 mb-8 tracking-tight">Send us a Message</h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                                                Full Name
                                            </label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                            placeholder="How can we help you?"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows={5}
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                            placeholder="Write your message here..."
                                        />
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-900/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:-translate-y-0.5"
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Sending...
                                                </span>
                                            ) : (
                                                <>
                                                    Send Message
                                                    <Send className="h-4 w-4 ml-1" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center sm:text-left mt-4">
                                        By submitting this form, you agree to our <a href="/privacy-policy" className="underline hover:text-gray-900">Privacy Policy</a>.
                                    </p>
                                </form>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Contact;
