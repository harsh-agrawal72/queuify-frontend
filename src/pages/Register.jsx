import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail,
    Lock,
    User,
    Loader2,
    ArrowRight,
    Building2,
    Briefcase,
    Phone,
    MapPin,
    CheckCircle2,
    ChevronLeft,
    Landmark,
    Scissors,
    Wrench,
    Stethoscope,
    Building,
    GraduationCap,
    Box
} from 'lucide-react';
import toast from 'react-hot-toast';

const businessTemplates = [
    {
        id: 'Clinic',
        title: 'Clinic',
        desc: 'Book appointments for specific doctors.',
        icon: Stethoscope,
        color: 'blue'
    },
    {
        id: 'Hospital',
        title: 'Hospital',
        desc: 'Multi-department healthcare facility.',
        icon: Building2,
        color: 'rose'
    },
    {
        id: 'Salon',
        title: 'Salon & Spa',
        desc: 'Schedule sessions with specific stylists.',
        icon: Scissors,
        color: 'pink'
    },
    {
        id: 'Bank',
        title: 'Bank',
        desc: 'General queue for banking services.',
        icon: Landmark,
        color: 'emerald'
    },
    {
        id: 'Government Office',
        title: 'Govt Office',
        desc: 'Manage public queues and services.',
        icon: Building,
        color: 'slate'
    },
    {
        id: 'Consultancy',
        title: 'Consultancy',
        desc: 'Schedule professional consultations.',
        icon: Briefcase,
        color: 'indigo'
    },
    {
        id: 'Coaching Institute',
        title: 'Coaching',
        desc: 'Manage student sessions and batches.',
        icon: GraduationCap,
        color: 'violet'
    },
    {
        id: 'Service Center',
        title: 'Service Center',
        desc: 'Walk-in appointments or service ticketing.',
        icon: Wrench,
        color: 'amber'
    },
    {
        id: 'Other',
        title: 'Other Business',
        desc: 'A flexible queue for any business.',
        icon: Box,
        color: 'gray'
    }
];
import { GoogleLogin } from '@react-oauth/google';
import Logo from '../components/common/Logo';

const Register = () => {
    const [signupType, setSignupType] = useState('user'); // 'user' or 'org'
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Combined form data
    const [formData, setFormData] = useState({
        // Common
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        // Org specific
        orgName: '',
        orgEmail: '',
        orgPhone: '',
        orgAddress: '',
        plan: 'basic',
        type: 'Clinic',
    });

    const { register, registerOrg, googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSuccess = async (user) => {
        toast.success(`Welcome, ${user.name}!`);
        const role = user.role || 'user';
        if (role === 'superadmin') navigate('/superadmin');
        else if (role === 'admin') navigate('/admin');
        else navigate('/dashboard');
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const user = await googleLogin(credentialResponse.credential);
            handleLoginSuccess(user);
        } catch (error) {
            toast.error('Google signup failed');
        }
    };

    const handleUserSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Passwords do not match');
        }

        setSubmitting(true);
        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: 'user'
            });
            toast.success('Account created! Please log in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Signup failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOrgSignup = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return toast.error('Admin passwords do not match');
        }

        setSubmitting(true);
        try {
            const user = await registerOrg({
                orgName: formData.orgName,
                orgEmail: formData.orgEmail,
                orgPhone: formData.orgPhone,
                orgAddress: formData.orgAddress,
                plan: formData.plan,
                type: formData.type,
                adminName: formData.name,
                adminEmail: formData.email,
                password: formData.password
            });
            toast.success(`Organization ${formData.orgName} registered!`);
            navigate('/admin');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Organization registration failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4 py-12 relative">
            {/* Back Button */}
            <Link
                to="/"
                className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 font-semibold transition-all group"
            >
                <div className="p-2 rounded-full group-hover:bg-gray-100 transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </div>
                Back to home
            </Link>
            {/* Background Gradients */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-50 rounded-full blur-[120px] opacity-60"></div>
            </div>

            <div className="w-full max-w-xl">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center mb-6 hover:scale-105 transition-transform origin-center">
                        <Logo iconSize="w-12 h-12" textClass="text-2xl text-gray-900 ml-2" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                    <p className="text-gray-500">Choose how you want to use Queuify today.</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-gray-100/80 p-1 rounded-2xl flex mb-8">
                    <button
                        onClick={() => { setSignupType('user'); setStep(1); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${signupType === 'user' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User className="h-4 w-4" /> I'm a User
                    </button>
                    <button
                        onClick={() => { setSignupType('org'); setStep(1); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${signupType === 'org' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Building2 className="h-4 w-4" /> I'm a Business
                    </button>
                </div>

                <motion.div
                    layout
                    className="bg-white border border-gray-100 shadow-2xl shadow-gray-200/50 rounded-3xl p-8"
                >
                    <AnimatePresence mode="wait">
                        {signupType === 'user' ? (
                            <motion.form
                                key="user-form"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleUserSignup}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="John Doe" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="john@example.com" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                        <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="••••••••" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm</label>
                                        <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="••••••••" />
                                    </div>
                                </div>
                                <button type="submit" disabled={submitting} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50">
                                    {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <>Create Account <ArrowRight className="h-5 w-5" /></>}
                                </button>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-100"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-white text-gray-400 font-medium uppercase tracking-wider">Or continue with</span>
                                    </div>
                                </div>

                                <div className="flex justify-center w-full">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => toast.error('Google Sign Up failed')}
                                        shape="pill"
                                        theme="outline"
                                        width="100%"
                                        size="large"
                                        text="signup_with"
                                    />
                                </div>
                            </motion.form>
                        ) : (
                            <motion.div
                                key="org-form-container"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                {/* Progress Bar */}
                                <div className="flex items-center gap-3 mb-8">
                                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                                    <div className={`h-1 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-blue-600' : 'bg-gray-100'}`}></div>
                                </div>

                                {step === 1 ? (
                                    <div className="space-y-5">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Building2 className="h-5 w-5 text-blue-600" /> Organization Details
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                                                <input type="text" name="orgName" required value={formData.orgName} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Blue Coast Dental" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Phone</label>
                                                <input
                                                    type="tel"
                                                    name="orgPhone"
                                                    required
                                                    pattern="[0-9]{10}"
                                                    title="Please enter a 10-digit phone number"
                                                    value={formData.orgPhone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                                    placeholder="10 digit number"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
                                            <input type="email" name="orgEmail" required value={formData.orgEmail} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="contact@bluecoast.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-4">Select your Business Type</label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {businessTemplates.map((item) => {
                                                    const Icon = item.icon;
                                                    const isSelected = formData.type === item.id;
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, type: item.id })}
                                                            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${isSelected
                                                                ? 'border-blue-600 bg-blue-50/50 shadow-lg shadow-blue-500/10'
                                                                : 'border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-white'
                                                                }`}
                                                        >
                                                            {isSelected && (
                                                                <div className="absolute top-2 right-2">
                                                                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                            )}
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-400 group-hover:text-gray-900 group-hover:border-gray-200 shadow-sm'}`}>
                                                                <Icon className="h-5 w-5" />
                                                            </div>
                                                            <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>{item.title}</h4>
                                                            <p className={`text-xs leading-relaxed ${isSelected ? 'text-blue-700/80' : 'text-gray-500'}`}>{item.desc}</p>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                            <input type="text" name="orgAddress" required value={formData.orgAddress} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="123 Main St, City" />
                                        </div>
                                        <button onClick={() => setStep(2)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 transition-all">
                                            Next Step: Admin Details <ArrowRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleOrgSignup} className="space-y-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <button type="button" onClick={() => setStep(1)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                <Briefcase className="h-5 w-5 text-blue-600" /> Admin Account
                                            </h3>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Name</label>
                                            <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Your Name" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Email</label>
                                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="personal@email.com" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                                            <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                                            <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="••••••••" />
                                        </div>
                                        <button type="submit" disabled={submitting} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">
                                            {submitting ? <Loader2 className="animate-spin h-5 w-5" /> : <>Finalize Registration <CheckCircle2 className="h-5 w-5" /></>}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                <p className="mt-8 text-center text-gray-500 text-sm font-medium">
                    Already have an account?{' '}
                    <Link to="/login" className="text-gray-900 border-b-2 border-transparent hover:border-gray-900 transition-all font-bold">
                        Sign in instead
                    </Link>
                </p>
            </div >
        </div >
    );
};

export default Register;
