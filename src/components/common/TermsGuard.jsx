import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import TermsModal from './TermsModal';
import api from '../../services/api';
import toast from 'react-hot-toast';

/**
 * TermsGuard
 * wraps application content and ensures that if a user has not accepted terms
 * (common for Google Login users), they are prompted immediately.
 */
const TermsGuard = ({ children }) => {
    const { user, updateUser } = useAuth();
    const [showTerms, setShowTerms] = useState(user && user.terms_accepted === false);

    const handleAgree = async () => {
        try {
            // Update on backend
            await api.patch('/users/me', { terms_accepted: true });
            
            // Update local state
            updateUser({ terms_accepted: true });
            
            setShowTerms(false);
            toast.success('Thank you for accepting our Terms of Service!');
        } catch (error) {
            toast.error('Failed to save agreement. Please try again.');
        }
    };

    // If no user or already accepted, just render children
    // Exception: If user role is admin/superadmin, we might assume they accepted during org signup,
    // but the DB column is the source of truth.
    if (!user || user.terms_accepted !== false) {
        return children;
    }

    return (
        <>
            {/* 
                We render children but they are covered by the modal. 
                The modal isOpen={true} and ideally onClose is disabled or 
                just re-opens it to force acceptance.
            */}
            {children}
            
            <TermsModal 
                isOpen={showTerms}
                onClose={() => {
                    // Prevent closing for mandatory agreement
                    toast('Please accept the terms to continue using Queuify', { icon: 'ℹ️' });
                }}
                onAgree={handleAgree}
            />
            
            {/* Semi-transparent backdrop to block interaction while modal is open */}
            {showTerms && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9998]" />
            )}
        </>
    );
};

export default TermsGuard;
