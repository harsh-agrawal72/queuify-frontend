import React from 'react';
import { FileText } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex-grow pt-24 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                            <FileText className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('policies.terms.title', 'Terms of Service')}</h1>
                        <div className="prose prose-purple max-w-none text-gray-600 space-y-6">
                            <p>{t('policies.terms.last_updated', 'Last updated: {{date}}', { date: new Date().toLocaleDateString() })}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec1_title', '1. Acceptance of Terms')}</h2>
                            <p>{t('policies.terms.sec1_desc', 'By accessing or using Queuify, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.')}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec2_title', '2. Use License')}</h2>
                            <p>{t('policies.terms.sec2_desc', 'Permission is granted to temporarily use the Queuify platform for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.')}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec3_title', '3. Disclaimer')}</h2>
                            <p>{t('policies.terms.sec3_desc', "The materials on Queuify are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.")}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec4_title', '4. Limitations')}</h2>
                            <p>{t('policies.terms.sec4_desc', 'In no event shall Queuify or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Queuify.')}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec5_title', '5. Payment & Escrow Service')}</h2>
                            <p>{t('policies.terms.sec5_desc', "Queuify uses a secure escrow system for paid bookings. Funds are held by Queuify and only released to the Organization's wallet after the user verifies their physical presence via a mandatory QR scan at the location.")}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec6_title', '6. Refund & Cancellation Policy')}</h2>
                            <p>{t('policies.terms.sec6_desc', "Full refunds are issued if an organization cancels your appointment. For user cancellations, refunds are processed based on the organization's timing policy. No refunds are provided for 'No Show' statuses.")}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec7_title', '7. Settlements & Payouts (for Businesses)')}</h2>
                            <p>{t('policies.terms.sec7_desc', "Organizations can withdraw their Available Balance to verified bank accounts or UPI IDs. Payout requests are typically processed within 1-3 business days.")}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.terms.sec8_title', '8. User Responsibilities')}</h2>
                            <p>{t('policies.terms.sec8_desc', "Users are responsible for scanning the organization's official QR code upon arrival. Failure to scan may prevent the completion of the service and the release of escrowed funds.")}</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
