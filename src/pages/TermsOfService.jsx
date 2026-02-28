import React from 'react';
import { FileText } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const TermsOfService = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex-grow pt-24 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
                        <div className="prose prose-purple max-w-none text-gray-600 space-y-6">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
                            <p>By accessing or using Queuify, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Use License</h2>
                            <p>Permission is granted to temporarily use the Queuify platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Disclaimer</h2>
                            <p>The materials on Queuify are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Limitations</h2>
                            <p>In no event shall Queuify or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Queuify.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
