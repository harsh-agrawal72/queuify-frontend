import axios from 'axios';

// Ensure the API URL is defined
let API_URL = import.meta.env.VITE_API_URL;

// Important: Ensure VITE_API_URL ends with /v1 for API calls
if (API_URL && !API_URL.endsWith('/v1')) {
    API_URL = `${API_URL.replace(/\/$/, '')}/v1`;
}

const api = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true 
});

// In-flight GET request deduplication — prevents duplicate network calls
// If two components request the same URL simultaneously, only one HTTP call fires
const inFlightRequests = new Map();

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Deduplicate concurrent GET requests to the same URL
        if (config.method === 'get') {
            const key = config.url + JSON.stringify(config.params || {});
            if (inFlightRequests.has(key)) {
                // Return a special cancel token that resolves with the existing promise
                config._dedupeKey = key;
                config._dedupePromise = inFlightRequests.get(key);
            } else {
                config._dedupeKey = key;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => {
        // Clean up deduplication tracking on success
        if (response.config._dedupeKey) {
            inFlightRequests.delete(response.config._dedupeKey);
        }
        return response;
    },
    async (error) => {
        const { config, response } = error;

        // Clean up deduplication on error
        if (config?._dedupeKey) {
            inFlightRequests.delete(config._dedupeKey);
        }
        
        // 1. Handle 401 Unauthorized (Auth expiration)
        if (response && response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }

        // 2. Handle Transient Errors with Retry (Timeout, Network, 502/503/504)
        if (!config || config._retry) {
            return Promise.reject(error);
        }

        const isNetworkError = !response && error.code !== 'ERR_CANCELED';
        const isTimeout = error.code === 'ECONNABORTED';
        const isRetryableStatus = response && [500, 502, 503, 504].includes(response.status);

        if (isNetworkError || isTimeout || isRetryableStatus) {
            config._retryCount = (config._retryCount || 0) + 1;
            
            if (config._retryCount <= 2) {
                console.warn(`[API] Transient error (${error.code || response?.status}). Retrying attempt ${config._retryCount}...`);
                const delay = 1000 * config._retryCount;
                await new Promise(resolve => setTimeout(resolve, delay));
                return api(config);
            }
        }

        return Promise.reject(error);
    }
);

const apiService = {
    // Organization endpoints
    createOrganization: (data) => api.post('/organizations', data),
    getOrganizations: (params) => api.get('/organizations', { params }),
    getOrganization: (id) => api.get(`/organizations/${id}`),
    updateOrganizationStatus: (id, status) => api.patch(`/organizations/${id}`, { status }),

    // Service endpoints (admin)
    createService: (data) => api.post('/services', data),
    getServices: () => api.get('/services'),
    updateService: (id, data) => api.patch(`/services/${id}`, data),
    deleteService: (id) => api.delete(`/services/${id}`),

    // Resource endpoints (admin)
    createResource: (data) => api.post('/resources', data),
    getResources: () => api.get('/resources'),
    getResourcesByService: (serviceId) => api.get(`/resources/by-service/${serviceId}`),
    updateResource: (id, data) => api.patch(`/resources/${id}`, data),
    deleteResource: (id) => api.delete(`/resources/${id}`),

    // Slot endpoints (admin)
    createSlot: (data) => api.post('/slots', data),
    getSlots: (params) => api.get('/slots', { params }),
    deleteSlot: (id) => api.delete(`/slots/${id}`),

    // Appointment endpoints
    bookAppointment: (data) => api.post('/appointments', data),
    myAppointments: () => api.get('/appointments/my'),
    cancelAppointment: (id) => api.post(`/appointments/${id}/cancel`),
    cancelPendingPayment: (id) => api.delete(`/appointments/${id}/cancel-pending`),

    // Analytics
    getAnalytics: () => api.get('/admin/analytics'),

    // Booking Flow (user-facing, org-scoped)
    getOrgServices: (orgId) => api.get(`/organizations/${orgId}/services`),
    getResourcesForService: (orgId, serviceId) => api.get(`/organizations/${orgId}/services/${serviceId}/resources`),
    getSlotsForResource: (orgId, resourceId, serviceId) => api.get(`/organizations/${orgId}/resources/${resourceId}/slots`, { 
        params: serviceId ? { serviceId } : {} 
    }),
    requestSlotNotification: (slotId, data) => api.post(`/slots/${slotId}/notify`, data),

    // Notifications
    getNotifications: () => api.get('/notifications'),
    markNotificationAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllNotificationsAsRead: () => api.patch('/notifications/read-all'),

    // User Profile & Favorites
    getUserProfile: () => api.get('/user/profile'),
    updateUserProfile: (data) => api.patch('/user/profile', data),
    getFavorites: () => api.get('/user/favorites'),
    toggleFavorite: (orgId) => api.post(`/user/favorites/${orgId}`),

    // Reviews
    submitReview: (data) => api.post('/reviews', data),
    getOrgReviews: (orgId) => api.get(`/reviews/organization/${orgId}`),

    // Rescheduling Proposal
    proposeReschedule: (appointmentId, data) => api.patch(`/appointments/${appointmentId}/propose-reschedule`, data),
    respondToReschedule: (appointmentId, data) => api.patch(`/appointments/${appointmentId}/respond-reschedule`, data),
    flagDispute: (id, reason) => api.post(`/appointments/${id}/dispute`, { reason }),
    
    // Admin Direct Move / Status Update
    adminUpdateAppointment: (appointmentId, data) => api.patch(`/admin/appointments/${appointmentId}`, data),

    // User Presence & Disputes
    markArrived: (id) => api.post(`/appointments/${id}/arrive`),
    markDelayed: (id) => api.post(`/appointments/${id}/delay`),
    flagDispute: (id, reason) => api.post(`/appointments/${id}/dispute`, { reason }),

    // Slot Notifications Tracker
    getMyNotifications: () => api.get('/slots/notifications/my'),
    cancelNotification: (id) => api.delete(`/slots/notifications/${id}`),

    // Payment Gateway
    createPaymentOrder: (appointmentId) => api.post('/payments/create-order', { appointmentId }),
    verifyPayment: (data) => api.post('/payments/verify-payment', data),

    // Membership Plans
    getPlans: (params) => api.get('/plans', { params }),
    assignUserPlan: (planId) => api.post('/plans/assign', { planId }),
    createPlanPaymentOrder: (planId, couponCode, duration = 1) => api.post('/payments/create-plan-order', { planId, couponCode, duration }),
    verifyPlanPayment: (data) => api.post('/payments/verify-plan-payment', data),
    validateCoupon: (code, planId, duration = 1) => api.post('/payments/validate-coupon', { code, planId, duration }),
    claimFreePlan: (planId, couponCode, duration = 1) => api.post('/payments/claim-free-plan', { planId, couponCode, duration }),
    claimRestoration: (planId) => api.post('/payments/claim-restoration', { planId }),
    markAsOnboarded: () => api.post('/admin/onboard'),
    getMembershipStats: () => api.get('/admin/membership-stats'),
};

export { api, apiService };
export default api;
