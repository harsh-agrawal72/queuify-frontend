import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600 font-medium transition-colors";
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
        { name: "Contact", path: "/contact" }
    ];

    return (
        <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <Logo iconSize="w-8 h-8" />
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link key={link.name} to={link.path} className={isActive(link.path)}>
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center space-x-6 border-l border-gray-200 pl-6">
                        {user ? (
                            <Link to="/dashboard" className="flex items-center gap-3 group">
                                <div className="text-right hidden lg:block">
                                    <p className="text-xs font-bold text-gray-900 leading-none">{user.name}</p>
                                    <p className="text-[10px] text-gray-500 font-medium">View Dashboard</p>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-sm overflow-hidden group-hover:border-indigo-100 transition-all">
                                    {user.profile_picture_url ? (
                                        <img src={user.profile_picture_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name?.[0] || 'U'
                                    )}
                                </div>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">Login</Link>
                                <Link
                                    to="/register"
                                    className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/20"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="md:hidden">
                        <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 shadow-lg absolute w-full left-0 top-16">
                    <div className="flex flex-col space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`${isActive(link.path)} block py-2 border-b border-gray-50`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <Link to="/dashboard" className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl" onClick={() => setIsOpen(false)}>
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                    {user.profile_picture_url ? (
                                        <img src={user.profile_picture_url} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        user.name?.[0] || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{user.name}</p>
                                    <p className="text-xs text-gray-500">Go to Dashboard</p>
                                </div>
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-gray-600 font-medium pt-2" onClick={() => setIsOpen(false)}>Login</Link>
                                <Link to="/register" className="bg-gray-900 text-white px-5 py-3 rounded-lg font-medium text-center" onClick={() => setIsOpen(false)}>Get Started</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
