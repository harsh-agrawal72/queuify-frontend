import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Mail, MapPin, Phone } from 'lucide-react';
import Logo from '../common/Logo';

const Footer = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 mt-auto text-slate-300 relative overflow-hidden">
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
            <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-indigo-500/5 blur-3xl opacity-50 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 px-2">
                    {/* Brand Section */}
                    <div className="md:col-span-5 pr-4 lg:pr-12">
                        <div className="mb-6 inline-block bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-sm shadow-xl">
                            <Logo iconSize="w-10 h-10" textClass="text-2xl text-white drop-shadow-sm" />
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm">
                            Revolutionizing queue management with intelligent routing and seamless booking experiences. Making waiting productive for everyone.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg" aria-label="Twitter">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-slate-700 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg" aria-label="GitHub">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white hover:-translate-y-1 transition-all duration-300 shadow-lg" aria-label="LinkedIn">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Links - Company */}
                    <div className="md:col-span-2 md:col-start-7">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Platform</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>Home</Link></li>
                            <li><Link to="/about" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>About Us</Link></li>
                            <li><Link to="/contact" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>Contact</Link></li>
                        </ul>
                    </div>

                    {/* Links - Legal */}
                    <div className="md:col-span-2">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Legal</h4>
                        <ul className="space-y-4 text-sm font-medium">
                            <li><Link to="/privacy-policy" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>Privacy</Link></li>
                            <li><Link to="/terms-of-service" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>Terms</Link></li>
                            <li><Link to="/cookie-policy" className="text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500/0 group-hover:bg-indigo-500 transition-colors"></span>Cookies</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="md:col-span-3">
                        <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-xs">Reach Us</h4>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-start gap-3 text-slate-400">
                                <MapPin className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>123 Tech Boulevard,<br />Innovation District, CA 94105</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <Mail className="w-5 h-5 text-indigo-400 shrink-0" />
                                <a href="mailto:hello@queuify.com" className="hover:text-indigo-300 transition-colors">hello@queuify.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-4 px-2">
                    <div className="text-sm text-slate-500 font-medium">
                        © {new Date().getFullYear()} Queuify Inc. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 relative flex"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span></span>
                            All Systems Operational
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
