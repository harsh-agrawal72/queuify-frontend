import axios from 'axios';

// Ensure the API URL is defined
let API_URL = import.meta.env.VITE_API_URL;

// Important: Ensure VITE_API_URL ends with /v1 for API calls
if (API_URL && !API_URL.endsWith('/v1')) {
    API_URL = `${API_URL.replace(/\/$/, '')}/v1`;
}

console.log('API URL Configuration:', API_URL);

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true // Ensure cookies/sessions can be passed if needed
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
    cancelAppointment: (id) => api.patch(`/appointments/${id}/cancel`),

    // Analytics
    getAnalytics: () => api.get('/admin/analytics'),

    // Booking Flow (user-facing, org-scoped)
    getOrgServices: (orgId) => api.get(`/organizations/${orgId}/services`),
    getResourcesForService: (orgId, serviceId) => api.get(`/organizations/${orgId}/services/${serviceId}/resources`),
    getSlotsForResource: (orgId, resourceId) => api.get(`/organizations/${orgId}/resources/${resourceId}/slots`),

    // Notifications
    getNotifications: () => api.get('/notifications'),
    markNotificationAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllNotificationsAsRead: () => api.patch('/notifications/read-all'),

    // User Profile
    updateUserProfile: (data) => api.patch('/user/profile', data),

    // Reviews
    submitReview: (data) => api.post('/reviews', data),
    getOrgReviews: (orgId) => api.get(`/reviews/organization/${orgId}`),
};

export { api, apiService };
export default api;
