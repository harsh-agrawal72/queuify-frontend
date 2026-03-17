import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const VerifyOrgEmail = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState('verifying'); // verifying, success, error

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                return;
            }
            try {
                await api.get(`/organizations/verify-email?token=${token}`);
                setStatus('success');
            } catch (error) {
                console.error('Verification failed', error);
                setStatus('error');
            }
        };

        verifyToken();
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center"
            >
                {status === 'verifying' && (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Verifying Email</h2>
                        <p className="text-gray-500">Please wait while we verify your organization's email address...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-emerald-100 p-3 rounded-full">
                                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
                        <p className="text-gray-500">Your organization's contact email has been successfully verified. You can now return to your dashboard.</p>
                        <Link 
                            to="/admin/about" 
                            className="inline-flex items-center justify-center gap-2 w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        >
                            Go to Dashboard <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <div className="bg-red-100 p-3 rounded-full">
                                <XCircle className="h-12 w-12 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                        <p className="text-gray-500">The verification link is invalid or has expired. Please request a new link from your dashboard.</p>
                        <Link 
                            to="/login" 
                            className="inline-flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                        >
                            Return to Login
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyOrgEmail;
