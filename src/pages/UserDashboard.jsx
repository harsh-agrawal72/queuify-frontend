import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import OrganizationCard from '../components/OrganizationCard';
import SlotList from '../components/SlotList';
import BookingModal from '../components/BookingModal';
import MyBookings from '../components/MyBookings';

const UserDashboard = () => {
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

    // Fetch initial data
    useEffect(() => {
        fetchOrganizations();
        fetchMyBookings();
    }, []);

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

    const confirmBooking = async () => {
        try {
            const response = await apiService.bookAppointment({
                orgId: selectedOrg.id,
                slotId: bookingSlot.slot_id
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
            alert(error.response?.data?.message || 'Booking failed');
            setShowBookingModal(false);
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

    const closeBookingModal = () => {
        setShowBookingModal(false);
        setBookingSlot(null);
        setConfirmedBooking(null);
    };

    return (
        <div className="w-full px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">User Dashboard</h1>

            {/* My Bookings Section */}
            <section className="mb-12">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700">My Bookings</h2>
                <MyBookings bookings={myBookings} onCancel={handleCancelBooking} />
            </section>

            {/* Organization Search & List */}
            <section>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Find Organizations</h2>
                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            value={selectedType}
                            onChange={handleTypeChange}
                            className="p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            <option value="All">All Types</option>
                            <option value="Clinic">Clinic</option>
                            <option value="Hospital">Hospital</option>
                            <option value="Salon">Salon</option>
                            <option value="Bank">Bank</option>
                            <option value="Government Office">Government Office</option>
                            <option value="Consultancy">Consultancy</option>
                            <option value="Coaching Institute">Coaching Institute</option>
                            <option value="Service Center">Service Center</option>
                            <option value="Other">Other</option>
                        </select>
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="p-2 border border-gray-300 rounded-md flex-grow md:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
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
                    {organizations.length === 0 && (
                        <p className="col-span-full text-center text-gray-500">No organizations found.</p>
                    )}
                </div>
            </section>

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
                            <button onClick={() => setSelectedOrg(null)} className="text-gray-500 hover:text-gray-700">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-grow">
                            <SlotList slots={slots} loading={loadingSlots} onBook={initiateBooking} />
                        </div>
                    </div>
                </div>
            )}

            {/* Booking Confirmation Modal */}
            <BookingModal
                isOpen={showBookingModal}
                onClose={closeBookingModal}
                onConfirm={confirmBooking}
                slot={bookingSlot}
                orgName={selectedOrg?.name}
                orgType={selectedOrg?.type}
                bookingData={confirmedBooking}
            />

        </div>
    );
};

export default UserDashboard;
