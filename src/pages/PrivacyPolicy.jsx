import React from 'react';
import { Shield } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const PrivacyPolicy = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex-grow pt-24 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                            <Shield className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                        <div className="prose prose-blue max-w-none text-gray-600 space-y-6">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                            <p>We collect information you provide directly to us when you create an account, update your profile, use our services, or communicate with us. This may include your name, email address, phone number, and any other information you choose to provide.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                            <p>We use the information we collect to operate, maintain, and improve our services, communicate with you, process your transactions, and provide customer support.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Data Security</h2>
                            <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please note that no method of transmission over the Internet or method of electronic storage is 100% secure.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Contact Us</h2>
                            <p>If you have any questions about this Privacy Policy, please contact us at support@Queuify.com.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
