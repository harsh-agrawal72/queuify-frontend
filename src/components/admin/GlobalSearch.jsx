import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Calendar, LayoutGrid, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch(query);
            } else {
                setResults(null);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const performSearch = async (searchQuery) => {
        setIsLoading(true);
        setIsOpen(true);
        try {
            const res = await api.get(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
            setResults(res.data);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
        setQuery('');
    };

    const hasResults = results && (results.services?.length > 0 || results.resources?.length > 0 || results.appointments?.length > 0);

    return (
        <div className="relative w-full max-w-md hidden md:block" ref={wrapperRef}>
            <div className={`flex items-center bg-gray-100 rounded-full px-4 py-2 border transition-all ${isOpen ? 'border-indigo-300 ring-2 ring-indigo-100 bg-white' : 'border-transparent focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 hover:bg-gray-200'}`}>
                {isLoading ? (
                    <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                ) : (
                    <Search className="h-4 w-4 text-gray-500" />
                )}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim().length >= 2) setIsOpen(true);
                    }}
                    placeholder="Search patients, services, or resources..."
                    className="bg-transparent border-none focus:outline-none text-sm ml-2 w-full transition-all text-gray-700 placeholder-gray-400"
                />
            </div>

            {/* Dropdown Results */}
            {isOpen && query.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 flex flex-col max-h-[70vh]">
                    <div className="overflow-y-auto w-full py-2 flex-grow">
                        {isLoading && !results ? (
                            <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                        ) : !hasResults ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center">
                                <Search className="h-8 w-8 text-gray-200 mb-2" />
                                <p className="text-gray-500 font-medium tracking-tight">No results found for "{query}"</p>
                                <p className="text-xs text-gray-400 mt-1">Try checking for typos or using different keywords.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">

                                {/* Services Group */}
                                {results.services?.length > 0 && (
                                    <div className="px-2">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mt-2 mb-1">
                                            <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Services
                                        </div>
                                        {results.services.map(svc => (
                                            <button
                                                key={svc.id}
                                                onClick={() => handleNavigate('/admin/services')}
                                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-indigo-50 group transition-colors"
                                            >
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 group-hover:text-indigo-700">{svc.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{svc.description || 'No description'}</div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Resources Group */}
                                {results.resources?.length > 0 && (
                                    <div className="px-2">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mt-2 mb-1">
                                            <Users className="w-3.5 h-3.5 mr-1" /> Resources
                                        </div>
                                        {results.resources.map(res => (
                                            <button
                                                key={res.id}
                                                onClick={() => handleNavigate('/admin/services')}
                                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-emerald-50 group transition-colors"
                                            >
                                                <div>
                                                    <div className="text-sm font-medium text-gray-800 group-hover:text-emerald-700">{res.name}</div>
                                                    <div className="text-xs text-gray-500 uppercase tracking-wide">{res.type}</div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Appointments Group */}
                                {results.appointments?.length > 0 && (
                                    <div className="px-2">
                                        <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mt-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 mr-1" /> Appointments / Patients
                                        </div>
                                        {results.appointments.map(apt => (
                                            <button
                                                key={apt.id}
                                                onClick={() => handleNavigate(`/admin/appointments?search=${apt.patient_name}`)}
                                                className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 group transition-colors"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-800 group-hover:text-blue-700">{apt.patient_name}</span>
                                                        {apt.token_number && (
                                                            <span className="px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded">
                                                                {apt.token_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                        <span>{apt.patient_email}</span>
                                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                        <span className={`capitalize ${apt.status === 'pending' ? 'text-amber-600' : apt.status === 'confirmed' ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                            {apt.status}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight className="w-4 h-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* Footer */}
                    <div className="bg-gray-50 p-2 border-t border-gray-100 text-[10px] text-gray-400 text-center font-medium">
                        Press ESC to close
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
