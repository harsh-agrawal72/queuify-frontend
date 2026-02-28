import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    X,
    Save,
    Briefcase,
    User,
    ChevronDown,
    ChevronRight,
    Clock,
    DollarSign,
    Users,
    AlertCircle,
    Layers,
    Info,
    AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// ──────────────────────────────────────────────
// UNIFIED SERVICE MANAGEMENT
// Service → Resources (nested accordion)
// Slots managed via separate Slot Management page
// ──────────────────────────────────────────────

const ServiceManagement = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedService, setExpandedService] = useState(null);

    // Resources keyed by serviceId
    const [resourcesByService, setResourcesByService] = useState({});
    const [loadingResources, setLoadingResources] = useState({});

    // Modals
    const [serviceModal, setServiceModal] = useState({ open: false, edit: false, data: null });
    const [resourceModal, setResourceModal] = useState({ open: false, edit: false, data: null, serviceId: null });

    // ─── Fetch Services ───
    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    // ─── Fetch Resources for a Service ───
    const fetchResourcesForService = async (serviceId) => {
        setLoadingResources(prev => ({ ...prev, [serviceId]: true }));
        try {
            const res = await api.get(`/resources/by-service/${serviceId}`);
            setResourcesByService(prev => ({ ...prev, [serviceId]: res.data }));
        } catch {
            toast.error("Failed to load resources");
        } finally {
            setLoadingResources(prev => ({ ...prev, [serviceId]: false }));
        }
    };

    // ─── Toggle Service Expand ───
    const toggleService = (serviceId) => {
        if (expandedService === serviceId) {
            setExpandedService(null);
        } else {
            setExpandedService(serviceId);
            fetchResourcesForService(serviceId);
        }
    };

    // ═══════════════════════════════════════════
    // SERVICE CRUD
    // ═══════════════════════════════════════════
    const handleServiceSubmit = async (formData) => {
        try {
            if (serviceModal.edit) {
                const updatePayload = {
                    name: formData.name,
                    description: formData.description,
                    queue_scope: formData.queue_scope,
                    estimated_service_time: formData.estimated_service_time
                };
                await api.patch(`/services/${serviceModal.data.id}`, updatePayload);
                toast.success("Service updated");
            } else {
                await api.post('/services', {
                    name: formData.name,
                    description: formData.description,
                    queue_scope: formData.queue_scope,
                    estimated_service_time: formData.estimated_service_time
                });
                toast.success("Service created");
            }
            setServiceModal({ open: false, edit: false, data: null });
            fetchServices();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteService = async (id) => {
        if (!confirm("Delete this service and all its resources?")) return;
        try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success("Service deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete service");
        }
    };

    // ═══════════════════════════════════════════
    // RESOURCE CRUD (belongs to service)
    // ═══════════════════════════════════════════
    const handleResourceSubmit = async (formData) => {
        const { serviceId } = resourceModal;
        try {
            if (resourceModal.edit) {
                const updatePayload = {
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    concurrent_capacity: formData.concurrent_capacity
                };
                await api.patch(`/resources/${resourceModal.data.id}`, updatePayload);
                toast.success("Resource updated");
            } else {
                await api.post('/resources', {
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    concurrent_capacity: formData.concurrent_capacity,
                    serviceIds: [serviceId]
                });
                toast.success("Resource created");
            }
            setResourceModal({ open: false, edit: false, data: null, serviceId: null });
            fetchResourcesForService(serviceId);
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDeleteResource = async (resourceId, serviceId) => {
        if (!confirm("Delete this resource and its slots?")) return;
        try {
            await api.delete(`/resources/${resourceId}`);
            setResourcesByService(prev => ({
                ...prev,
                [serviceId]: prev[serviceId]?.filter(r => r.id !== resourceId)
            }));
            toast.success("Resource deleted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete resource");
        }
    };

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Create services and assign resources (staff, rooms, equipment) to them.</p>
                </div>
                <button
                    onClick={() => setServiceModal({ open: true, edit: false, data: null })}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="h-4 w-4" /> Create Service
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>
            ) : services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">No services yet</h3>
                    <p className="text-sm text-gray-400 mt-1">Create your first service to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {services.map(service => {
                        const isExpanded = expandedService === service.id;
                        const resources = resourcesByService[service.id] || [];
                        const isLoadingRes = loadingResources[service.id];

                        return (
                            <div key={service.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all">
                                {/* Service Header */}
                                <div
                                    className={`flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'border-b border-gray-100 bg-gray-50/50' : ''}`}
                                    onClick={() => toggleService(service.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl transition-colors ${isExpanded ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <Briefcase className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 text-base">{service.name}</h3>
                                            <p className="text-xs text-gray-500 mt-0.5">{service.description || 'No description'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {resources.length > 0 && (
                                            <span className="text-xs font-medium px-2.5 py-1 bg-purple-50 text-purple-600 rounded-full">
                                                {resources.length} resource{resources.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setServiceModal({ open: true, edit: true, data: service }); }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        <div className={`p-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                            <ChevronDown className="h-4 w-4 text-gray-400" />
                                        </div>
                                    </div>
                                </div>

                                {/* Resources Panel (expanded) */}
                                {isExpanded && (
                                    <div className="p-5 bg-gray-50/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2">
                                                <Users className="h-4 w-4" /> Resources
                                            </h4>
                                            <button
                                                onClick={() => setResourceModal({ open: true, edit: false, data: null, serviceId: service.id })}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" /> Add Resource
                                            </button>
                                        </div>

                                        {isLoadingRes ? (
                                            <div className="flex justify-center p-6"><Loader2 className="animate-spin text-indigo-400 h-5 w-5" /></div>
                                        ) : resources.length === 0 ? (
                                            <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No resources for this service.</p>
                                                <p className="text-xs text-gray-400 mt-1">Add a resource to start creating time slots.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {resources.map(resource => (
                                                    <div key={resource.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${resource.type === 'staff' ? 'bg-purple-50 text-purple-500' :
                                                                resource.type === 'room' ? 'bg-blue-50 text-blue-500' :
                                                                    resource.type === 'counter' ? 'bg-teal-50 text-teal-500' :
                                                                        'bg-orange-50 text-orange-500'
                                                                }`}>
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-xs text-gray-400 capitalize">{resource.type}</span>
                                                                    <span className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
                                                                        <Users className="h-3 w-3" /> Cap: {resource.concurrent_capacity}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => setResourceModal({ open: true, edit: true, data: resource, serviceId: service.id })}
                                                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteResource(resource.id, service.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══ SERVICE MODAL ═══ */}
            <FormModal
                open={serviceModal.open}
                title={serviceModal.edit ? 'Edit Service' : 'New Service'}
                onClose={() => setServiceModal({ open: false, edit: false, data: null })}
                onSubmit={handleServiceSubmit}
                fields={[
                    { name: 'name', label: 'Service Name', type: 'text', required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                    {
                        name: 'queue_scope',
                        label: 'Queue Scope',
                        type: 'select',
                        options: ['PER_RESOURCE', 'CENTRAL'],
                        required: true,
                        help: 'CENTRAL: One shared queue for all resources. PER_RESOURCE: Separate queue for each staff/doctor (best for specific bookings).'
                    },
                    { name: 'estimated_service_time', label: 'Est. Duration (min)', type: 'number', min: 1, required: true },
                ]}
                defaults={serviceModal.edit ? serviceModal.data : {
                    name: '',
                    description: '',
                    queue_scope: 'PER_RESOURCE',
                    estimated_service_time: 30
                }}
            />

            {/* ═══ RESOURCE MODAL ═══ */}
            <FormModal
                open={resourceModal.open}
                title={resourceModal.edit ? 'Edit Resource' : 'New Resource'}
                onClose={() => setResourceModal({ open: false, edit: false, data: null, serviceId: null })}
                onSubmit={handleResourceSubmit}
                fields={[
                    { name: 'name', label: 'Resource Name', type: 'text', required: true },
                    { name: 'type', label: 'Type', type: 'select', options: ['staff', 'room', 'equipment', 'counter', 'machine'], required: true },
                    { name: 'concurrent_capacity', label: 'Concurrent Capacity', type: 'number', min: 1, required: true },
                    { name: 'description', label: 'Description', type: 'textarea' },
                ]}
                defaults={resourceModal.edit ? resourceModal.data : { name: '', type: 'staff', description: '', concurrent_capacity: 1 }}
            />
        </div>
    );
};

// ═══════════════════════════════════════════
// REUSABLE FORM MODAL
// ═══════════════════════════════════════════
const FormModal = ({ open, title, onClose, onSubmit, fields, defaults }) => {
    const [formData, setFormData] = useState(defaults || {});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setFormData(defaults || {});
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><X className="h-4 w-4 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {fields.map(field => (
                        <div key={field.name} className={`${field.dependsOn && !formData[field.dependsOn] ? 'hidden' : 'block'}`}>
                            {field.type === 'checkbox' ? (
                                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData[field.name] || false}
                                        onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.checked }))}
                                        className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-gray-700">{field.label}</span>
                                </label>
                            ) : (
                                <>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                                    {field.type === 'textarea' ? (
                                        <textarea
                                            value={formData[field.name] || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm resize-none"
                                            rows="3"
                                        />
                                    ) : field.type === 'select' ? (
                                        <select
                                            value={formData[field.name] || ''}
                                            onChange={e => setFormData(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white"
                                        >
                                            {field.options.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            min={field.min}
                                            step={field.step}
                                            value={formData[field.name] ?? ''}
                                            onChange={e => setFormData(prev => ({ ...prev, [field.name]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                        />
                                    )}
                                    {field.help && (
                                        <p className="mt-1.5 text-[11px] text-gray-400 flex items-start gap-1 px-1">
                                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                            {field.help}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {submitting ? 'Saving...' : 'Save'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServiceManagement;
