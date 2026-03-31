import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const ScanRedirect = () => {
    const { slug } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!slug) {
            navigate('/');
            return;
        }

        // Store the referred organization in localStorage for context
        localStorage.setItem('referred_org', slug);

        // Logic:
        // 1. If user is logged in, redirect to org details
        // 2. If user is NOT logged in, redirect to register
        if (user) {
            navigate(`/organizations/${slug}`);
        } else {
            navigate('/register');
        }
    }, [slug, user, navigate]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
                <div className="h-16 w-16 bg-white rounded-3xl shadow-xl shadow-indigo-100 flex items-center justify-center animate-pulse">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                </div>
            </div>
            <div className="flex flex-col items-center animate-pulse text-center px-4">
                <p className="text-xl font-black text-slate-900 tracking-tight">Setting up your experience...</p>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-2">Connecting to Organization</p>
            </div>
        </div>
    );
};

export default ScanRedirect;
