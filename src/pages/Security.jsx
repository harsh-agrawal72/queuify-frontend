import React from 'react';
import { Lock } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';

const Security = () => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex-grow pt-24 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Security</h1>
                        <div className="prose prose-emerald max-w-none text-gray-600 space-y-6">
                            <p>Last updated: {new Date().toLocaleDateString()}</p>

                            <p>At Queuify, we take the security of your data seriously. We implement enterprise-grade security measures to protect your information and ensure our services are always available.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Data Encryption</h2>
                            <p>All data transmitted to and from our platform is encrypted in transit using TLS. Data at rest is encrypted using AES-256 standards, ensuring that your sensitive information remains secure.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Infrastructure Security</h2>
                            <p>Our platform is hosted on secure, compliant cloud infrastructure. We employ firewalls, intrusion detection systems, and regular security audits to monitor and protect against unauthorized access.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Access Controls</h2>
                            <p>We use role-based access control (RBAC) to ensure that users only have access to the data they need to perform their duties. Multi-factor authentication (MFA) is recommended for all user accounts.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Incident Response</h2>
                            <p>In the unlikely event of a security breach, we have a comprehensive incident response plan in place to contain and mitigate the issue, and to notify affected users promptly in accordance with applicable laws.</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Report a Vulnerability</h2>
                            <p>If you believe you have discovered a security vulnerability in our platform, please report it to our security team immediately at security@Queuify.com. We appreciate the efforts of security researchers and will investigate all legitimate reports.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Security;
