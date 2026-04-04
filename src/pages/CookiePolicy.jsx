import React from 'react';
import { Cookie } from 'lucide-react';
import Footer from '../components/layout/Footer';
import Navbar from '../components/layout/Navbar';
import { useTranslation } from 'react-i18next';

const CookiePolicy = () => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex-grow pt-24 pb-12">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6">
                            <Cookie className="h-6 w-6" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('policies.cookie.title', 'Cookie Policy')}</h1>
                        <div className="prose prose-amber max-w-none text-gray-600 space-y-6">
                            <p>{t('policies.cookie.last_updated', 'Last updated: {{date}}', { date: new Date().toLocaleDateString() })}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.cookie.sec1_title', '1. What are cookies?')}</h2>
                            <p>{t('policies.cookie.sec1_desc', 'Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.')}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.cookie.sec2_title', '2. How we use cookies')}</h2>
                            <p>{t('policies.cookie.sec2_desc', 'We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. Essential cookies are required for basic site functionality, while analytical cookies help us understand how you use our platform.')}</p>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.cookie.sec3_title', '3. Types of cookies we use')}</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>{t('common.essential', 'Essential Cookies')}:</strong> {t('policies.cookie.sec3_list.essential', 'Necessary for the website to function properly.')}</li>
                                <li><strong>{t('common.analytical', 'Analytical/Performance Cookies')}:</strong> {t('policies.cookie.sec3_list.analytical', 'Allow us to recognize and count the number of visitors and see how visitors move around our website.')}</li>
                                <li><strong>{t('common.functionality', 'Functionality Cookies')}:</strong> {t('policies.cookie.sec3_list.functionality', 'Used to recognize you when you return to our website.')}</li>
                            </ul>

                            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{t('policies.cookie.sec4_title', '4. Managing cookies')}</h2>
                            <p>{t('policies.cookie.sec4_desc', 'Most web browsers allow some control of most cookies through the browser settings. To find out more about cookies, including how to see what cookies have been set, visit www.aboutcookies.org or www.allaboutcookies.org.')}</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default CookiePolicy;
