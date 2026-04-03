import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useUserSocket } from '../hooks/useUserSocket';
import { MessageCircle } from 'lucide-react';
import OrganizationCard from '../components/OrganizationCard';
import SlotList from '../components/SlotList';
import BookingWizard from '../components/user/BookingWizard';
import { api } from '../services/api';
import { LayoutDashboard, Calendar, History, Search, TrendingUp } from 'lucide-react';
import UserPayments from '../components/user/UserPayments';
import MyBookings from '../components/MyBookings';
import WaitlistTrackerCard from '../components/user/WaitlistTrackerCard';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import BroadcastBanner from '../components/common/BroadcastBanner';
import { Bell } from 'lucide-react';

const UserDashboard = () => {
    const { user } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState('All');
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [bookingSlot, setBookingSlot] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'bookings', 'payments'
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);
    const { t } = useTranslation();

    const { update, broadcast } = useUserSocket(user?.id);

    // Fetch initial data
    useEffect(() => {
        fetchOrganizations();
        fetchMyBookings();
        fetchNotifications();
    }, []);

    // Refresh on socket update
    useEffect(() => {
        if (update || broadcast) {
            console.log('[Dashboard] Refreshing due to real-time update/broadcast');
            fetchMyBookings();
            fetchNotifications();
            if (update?.type === 'reassignment' || (broadcast && !update)) {
                toast(t('dashboard.new_msg', 'New system message received'), { icon: '🔔' });
            }
            if (selectedOrg) {
                handleViewSlots(selectedOrg);
            }
        }
    }, [update, broadcast]);

    const fetchOrganizations = async (query = '', type = 'All') => {
        try {
            const params = { search: query };
            if (type !== 'All') params.type = type;
            const response = await apiService.getOrganizations(params);
            setOrganizations(response.data);
        } catch (error) {
            console.error('Error fetching organizations:', error);
        }
    };

    const fetchMyBookings = async () => {
        try {
            const response = await apiService.myAppointments();
            setMyBookings(response.data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    const fetchNotifications = async () => {
        setLoadingNotifications(true);
        try {
            const [trackers, general] = await Promise.all([
                apiService.getMyNotifications(),
                apiService.getNotifications()
            ]);
            // Ensure slot notifications are typed as 'waitlist'
            const trackerData = (trackers.data || []).map(n => ({ ...n, type: 'waitlist' }));
            setNotifications([...trackerData, ...(general.data || [])]);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoadingNotifications(false);
        }
    };

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
        fetchOrganizations(e.target.value, selectedType);
    };

    const handleTypeChange = (e) => {
        setSelectedType(e.target.value);
        fetchOrganizations(searchQuery, e.target.value);
    };

    const handleViewSlots = async (org) => {
        setSelectedOrg(org);
        setSlots([]); // Clear previous
        setLoadingSlots(true);
        try {
            const response = await apiService.getAvailableSlots(org.id);
            setSlots(response.data);
        } catch (error) {
            console.error('Error fetching slots:', error);
            alert('Failed to load slots');
        } finally {
            setLoadingSlots(false);
        }
    };

    const initiateBooking = (slot) => {
        setBookingSlot(slot);
        setConfirmedBooking(null);
        setShowBookingModal(true);
    };

    const confirmBooking = async (prefResource, prefTime, bypassDuplicate = false) => {
        try {
            const response = await apiService.bookAppointment({
                orgId: selectedOrg.id,
                slotId: bookingSlot.slot_id,
                pref_resource: prefResource,
                pref_time: prefTime,
                bypassDuplicate
            });

            // Assume response.data contains the booking details including token
            setConfirmedBooking({
                tokenNumber: response.data.tokenNumber,
                ...response.data
            });

            // Refresh slots and bookings
            handleViewSlots(selectedOrg);
            fetchMyBookings();

        } catch (error) {
            console.error('Booking failed:', error);
            if (error.response?.status === 409 && error.response?.data?.message === 'DUPLICATE_BOOKING_WARNING') {
                const proceed = window.confirm("You have already booked this slot. Do you want to book it again?");
                if (proceed) {
                    confirmBooking(prefResource, prefTime, true);
                }
            } else {
                alert(error.response?.data?.message || 'Booking failed');
                setShowBookingModal(false);
            }
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await apiService.cancelAppointment(bookingId);
            fetchMyBookings();
            // If viewing slots for the same org, refresh them too
            if (selectedOrg) {
                handleViewSlots(selectedOrg);
            }
        } catch (error) {
            console.error('Cancellation failed:', error);
            alert('Failed to cancel booking');
        }
    };

    const handleCancelNotification = async (notificationId) => {
        if (!window.confirm(t('common.confirm_cancel', 'Stop tracking this slot?'))) return;
        try {
            await apiService.cancelNotification(notificationId);
            toast.success(t('common.success', 'Tracker removed'));
            fetchNotifications();
        } catch (error) {
            toast.error(t('common.error', 'Failed to remove tracker'));
        }
    };

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setBookingSlot(null);
        setConfirmedBooking(null);
    };

    return (
        <div className="w-full">
            <BroadcastBanner 
                notifications={notifications} 
                onDismiss={async (id) => {
                    await apiService.markNotificationAsRead(id);
                    fetchNotifications();
                }} 
            />
            <div className="px-4 py-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <h1 className="text-3xl font-black mb-0 text-gray-900 tracking-tight">{t('user_dashboard.title', 'User Dashboard')}</h1>
                
                {/* Modern Navigation Tabs */}
                <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-2xl border border-gray-200 backdrop-blur-sm self-stretch md:self-auto">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: t('user_dashboard.tabs.overview', 'Overview') },
                        { id: 'bookings', icon: Calendar, label: t('user_dashboard.tabs.bookings', 'My Bookings') },
                        { id: 'payments', icon: History, label: t('user_dashboard.tabs.payments', 'Payment History') }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300",
                                activeTab === tab.id 
                                    ? "bg-white text-indigo-600 shadow-sm" 
                                    : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overviews (Counts & Quick Action) if on Overview tab */}
            {activeTab === 'overview' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
                            <p className="text-xs text-indigo-100 font-black uppercase tracking-widest opacity-80 mb-1">{t('user_dashboard.stats.active_bookings', 'Active Bookings')}</p>
                            <div className="flex justify-between items-end">
                                <h3 className="text-4xl font-black">{myBookings.filter(b => ['pending', 'confirmed', 'serving'].includes(b.status)).length}</h3>
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                                    <Calendar className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                            <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-1">{t('user_dashboard.stats.lifetime_spent', 'Lifetime Spent')}</p>
                            <div className="flex justify-between items-end">
                                <h3 className="text-4xl font-black text-gray-900">₹{myBookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + parseFloat(b.price || 0), 0).toLocaleString()}</h3>
                                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                                    <TrendingUp className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center">
                            <button 
                                onClick={() => setActiveTab('bookings')}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                            >
                                <History className="h-5 w-5" /> {t('dashboard.manage_calendar', 'Manage Calendar')}
                            </button>
                        </div>
                    </div>

                    {/* Waitlist Trackers Section */}
                    {notifications.filter(n => n.type === 'waitlist').length > 0 && (
                        <div className="mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                                    <Bell className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('user_dashboard.tracker.title', 'Waitlist Trackers')}</h2>
                                    <p className="text-sm text-gray-500 font-medium">{t('user_dashboard.tracker.subtitle', 'Live status of your requested slots.')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {notifications.filter(n => n.type === 'waitlist').map(sn => (
                                    <WaitlistTrackerCard 
                                        key={sn.id} 
                                        notification={sn} 
                                        onCancel={handleCancelNotification}
                                        onRefresh={fetchNotifications}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('user_dashboard.find_orgs', 'Find Organizations')}</h2>
                        <div className="hidden sm:flex items-center gap-3">
                            <select
                                value={selectedType}
                                onChange={handleTypeChange}
                                className="bg-white border-none rounded-xl px-4 py-2 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                            >
                                <option value="All">{t('user_dashboard.filters.all_types', 'All Types')}</option>
                                <option value="Clinic">{t('templates.clinic.title', 'Clinic')}</option>
                                <option value="Hospital">{t('templates.hospital.title', 'Hospital')}</option>
                                <option value="Salon">{t('templates.salon.title', 'Salon')}</option>
                                <option value="Bank">{t('templates.bank.title', 'Bank')}</option>
                                <option value="Government Office">{t('templates.govt.title', 'Government Office')}</option>
                                <option value="Consultancy">{t('templates.consultancy.title', 'Consultancy')}</option>
                                <option value="Coaching Institute">{t('templates.coaching.title', 'Coaching Institute')}</option>
                                <option value="Service Center">{t('templates.service_center.title', 'Service Center')}</option>
                                <option value="Other">{t('templates.other.title', 'Other')}</option>
                            </select>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder={t('user_dashboard.filters.search_placeholder', 'Search...')}
                                    value={searchQuery}
                                    onChange={handleSearch}
                                    className="pl-10 pr-4 py-2 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {organizations.map(org => (
                            <OrganizationCard
                                key={org.id}
                                org={org}
                                onViewSlots={handleViewSlots}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* My Bookings Tab */}
            {activeTab === 'bookings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">{t('appointments.title', 'My Recent Appointments')}</h2>
                    </div>
                    <MyBookings bookings={myBookings} onCancel={handleCancelBooking} />
                </div>
            )}

            {/* Payment History Tab (Analytical) */}
            {activeTab === 'payments' && (
                <UserPayments bookings={myBookings} />
            )}


            {/* Slots Modal/Section */}

            {/* Slots Modal/Section (Displaying as a modal or separate section? Requirement said "View available slots". Let's use a modal or expand the card. 
               The design was "Sections: ... Org cards grid". 
               Let's make a "Selected Organization" section appearing below if one is selected, or a modal. 
               Let's go with a Modal for slots to keep UI clean, or scroll to section. 
               Let's use a Modal for slots for better UX on mobile too.
            */}

            {selectedOrg && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-40">
                    <div className="relative p-6 border w-11/12 md:w-3/4 lg:w-1/2 shadow-xl rounded-lg bg-white max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-900">Slots at {selectedOrg.name}</h3>
                            <div className="flex items-center gap-4">
                                {selectedOrg.contact_phone && (
                                    <a
                                        href={`https://wa.me/${selectedOrg.contact_phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-emerald-100"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                        <span>WhatsApp Chat</span>
                                    </a>
                                )}
                                <button onClick={() => setSelectedOrg(null)} className="text-gray-500 hover:text-gray-700">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-grow">
                            <SlotList slots={slots} loading={loadingSlots} onBook={initiateBooking} />
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Wizard (Advanced Pay-to-Book Flow) */}
            {showBookingModal && (
                <BookingWizard
                    orgId={selectedOrg?.id}
                    service={bookingSlot ? { id: bookingSlot.service_id, name: bookingSlot.service_name } : null}
                    initialResource={bookingSlot ? { id: bookingSlot.resource_id, name: bookingSlot.resource_name, type: bookingSlot.resource_type } : null}
                    initialSlot={bookingSlot ? { id: bookingSlot.slot_id, ...bookingSlot } : null}
                    onClose={closeBookingModal}
                />
            )}

        </div>
        </div>
    );
};

export default UserDashboard;
