import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import UserPayments from '../components/user/UserPayments';
import { CreditCard, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const UserPaymentsPage = () => {
    const { t } = useTranslation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get('/appointments/my');
            setBookings(response.data);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <CreditCard className="h-8 w-8 text-indigo-600" />
                        {t('navigation.payment_history', 'Payment History')}
                    </h1>
                    <p className="text-gray-500 font-medium">Analyze your spending and track transaction history.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {t('common.refresh', 'Refresh')}
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <UserPayments bookings={bookings} />
            )}
        </div>
    );
};

export default UserPaymentsPage;
