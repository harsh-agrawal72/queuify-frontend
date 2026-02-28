import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';

const Footer = () => {
    const handleComingSoon = (e) => {
        e.preventDefault();
        toast('Coming soon!', { icon: '🚀' });
    };

    return (
        <footer className="bg-gray-50 border-t border-gray-100 pt-16 pb-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                    <div className="md:col-span-1 pr-4 lg:pr-12">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold">S</div>
                            <span className="font-bold text-lg text-gray-900">Queuify</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                            Making waiting productive for everyone. The modern standard for queue management.
                        </p>
                    </div>

                    <div className="md:col-span-1 flex justify-center">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/" className="hover:text-blue-600 transition-colors">Home</Link></li>
                                <li><Link to="/about" className="hover:text-blue-600 transition-colors">About</Link></li>
                                <li><Link to="/contact" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="md:col-span-1 flex justify-center">
                        <div>
                            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><Link to="/privacy-policy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
                                <li><Link to="/terms-of-service" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                                <li><Link to="/cookie-policy" className="hover:text-blue-600 transition-colors">Cookie Policy</Link></li>
                                <li><Link to="/security" className="hover:text-blue-600 transition-colors">Security</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-200">
                    <div className="text-sm text-gray-400 text-center">
                        © {new Date().getFullYear()} Queuify Inc. All rights reserved.
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
