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
    const handleAgree = async () => {
        try {
            // Update on backend
            await api.patch('/user/profile', { terms_accepted: true });
            
            // Update local state in context (this will trigger re-render and hide guard)
            updateUser({ terms_accepted: true });
            
            toast.success('Thank you for accepting our Terms of Service!');
        } catch (error) {
            console.error('[TermsGuard] Agreement failed:', error);
            toast.error('Failed to save agreement. Please try again.');
        }
    };

    const handleReject = () => {
        logout();
        toast('Terms rejected. You have been logged out.', { icon: '🚫' });
    };

    // If no user or already accepted, just render children
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
                isOpen={true}
                onClose={handleReject}
                onAgree={handleAgree}
            />
            
            {/* Semi-transparent backdrop to block interaction while modal is open */}
            <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[9998]" />
        </>
    );
};

export default TermsGuard;
