import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
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
    Users,
    AlertCircle,
    Layers,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import InfoTooltip from '../common/InfoTooltip';
import { useTranslation } from 'react-i18next';

// ──────────────────────────────────────────────
// UNIFIED SERVICE MANAGEMENT (Read-only Resources)
// Services are managed here.
// Resources (Doctors/Staff) are managed in the Resource Management tab.
// ──────────────────────────────────────────────

const ServiceManagement = () => {
    const { t } = useTranslation();
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedService, setExpandedService] = useState(null);

    // Resources keyed by serviceId
    const [resourcesByService, setResourcesByService] = useState({});
    const [loadingResources, setLoadingResources] = useState({});

    // Modals
    const [serviceModal, setServiceModal] = useState({ open: false, edit: false, data: null });

    // ─── Fetch Services ───
    const fetchServices = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch {
            toast.error(t('service.load_failed', "Failed to load services"));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => { fetchServices(); }, [fetchServices]);

    // ─── Fetch Resources for a Service ───
    const fetchResourcesForService = async (serviceId) => {
        setLoadingResources(prev => ({ ...prev, [serviceId]: true }));
        try {
            const res = await api.get(`/resources/by-service/${serviceId}`);
            setResourcesByService(prev => ({ ...prev, [serviceId]: res.data }));
        } catch {
            toast.error(t('resource.load_failed', "Failed to load resources"));
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

    // ─── Service CRUD ───
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
                toast.success(t('service.updated', "Service updated"));
            } else {
                await api.post('/services', {
                    name: formData.name,
                    description: formData.description,
                    queue_scope: formData.queue_scope,
                    estimated_service_time: formData.estimated_service_time
                });
                toast.success(t('service.created', "Service created"));
            }
            setServiceModal({ open: false, edit: false, data: null });
            fetchServices();
        } catch (error) {
            toast.error(error.response?.data?.message || t('common.operation_failed', "Operation failed"));
        }
    };

    const handleDeleteService = async (id) => {
        if (!confirm(t('service.delete_confirm', "Delete this service? This will not delete the doctors/resources linked to it, only the service itself."))) return;
        try {
            await api.delete(`/services/${id}`);
            setServices(prev => prev.filter(s => s.id !== id));
            toast.success(t('service.deleted', "Service deleted"));
        } catch (error) {
            toast.error(error.response?.data?.message || t('service.delete_failed', "Failed to delete service"));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {t('navigation.service_management', 'Service Management')}
                        <InfoTooltip align="start" text={t('service.mgmt_tooltip', 'Services are the categories of what you offer. Resources (like doctors) are managed in their own tab and then linked to these services.')} />
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{t('service.mgmt_subtitle', 'Create and manage the types of services your organization provides.')}</p>
                </div>
                <button
                    onClick={() => setServiceModal({ open: true, edit: false, data: null })}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="h-4 w-4" /> {t('service.create_service', 'Create Service')}
                </button>
            </div>

            {/* Loading */}
            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>
            ) : services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                    <Layers className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600">{t('service.no_services', 'No services yet')}</h3>
                    <p className="text-sm text-gray-400 mt-1">{t('service.create_first', 'Create your first service to get started.')}</p>
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
                                            <p className="text-xs text-gray-500 mt-0.5">{service.description || t('service.no_description', 'No description')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setServiceModal({ open: true, edit: true, data: service }); }}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title={t('common.edit', 'Edit')}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title={t('common.delete', 'Delete')}
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
                                                <Users className="h-4 w-4" /> {t('service.resources', 'Linked Resources')}
                                                <InfoTooltip align="start" text={t('service.resources_tooltip', "These are the doctors or staff currently assigned to this service. Manage them in the 'Resources' tab.")} />
                                            </h4>
                                            <Link
                                                to="/admin/resources"
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 border border-indigo-200 rounded-lg text-xs font-medium hover:bg-indigo-50 transition-colors shadow-sm"
                                            >
                                                <Edit2 className="h-3 w-3" /> {t('service.manage_resources', 'Manage Mappings')}
                                            </Link>
                                        </div>

                                        {isLoadingRes ? (
                                            <div className="flex justify-center p-6"><Loader2 className="animate-spin text-indigo-400 h-5 w-5" /></div>
                                        ) : resources.length === 0 ? (
                                            <div className="text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">{t('service.no_resources', 'No resources linked.')}</p>
                                                <p className="text-xs text-gray-400 mt-1">{t('service.add_resource_hint', "Go to 'Resources' tab to link a doctor/staff to this service.")}</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {resources.map(resource => (
                                                    <div key={resource.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-lg ${resource.type === 'staff' ? 'bg-purple-50 text-purple-500' : 'bg-blue-50 text-blue-500'}`}>
                                                                <User className="h-4 w-4" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                                                                <p className="text-[10px] text-gray-400 capitalize">{t(`resource_type.${resource.type}`, resource.type)}</p>
                                                            </div>
                                                        </div>
                                                        <Link to="/admin/resources" className="p-1.5 text-gray-400 hover:text-indigo-600">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Link>
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
                title={serviceModal.edit ? t('admin.services.edit', 'Edit Service') : t('admin.services.create', 'New Service')}
                onClose={() => setServiceModal({ open: false, edit: false, data: null })}
                onSubmit={handleServiceSubmit}
                fields={[
                    { name: 'name', label: t('admin.services.service_name', 'Service Name'), type: 'text', required: true },
                    { name: 'description', label: t('common.description', 'Description'), type: 'textarea' },
                    {
                        name: 'queue_scope',
                        label: t('admin.services.queue_scope', 'Queue Scope'),
                        type: 'select',
                        options: ['PER_RESOURCE', 'CENTRAL'],
                        required: true,
                        help: t('admin.services.queue_scope_help', 'CENTRAL: One shared queue for all resources. PER_RESOURCE: Separate queue for each staff/doctor (best for specific bookings).')
                    },
                    { 
                        name: 'estimated_service_time', 
                        label: t('admin.services.estimated_duration', 'Estimated Duration (min)'), 
                        type: 'number', 
                        min: 1, 
                        required: true,
                        help: t('admin.services.estimated_duration_help', 'Average time per appointment. This is used for wait-time estimates and as a default timing for new slots.')
                    },
                ]}
                defaults={serviceModal.edit ? serviceModal.data : {
                    name: '',
                    description: '',
                    queue_scope: 'PER_RESOURCE',
                    estimated_service_time: 30
                }}
            />
        </div>
    );
};

// ═══════════════════════════════════════════
// REUSABLE FORM MODAL
// ═══════════════════════════════════════════
const FormModal = ({ open, title, onClose, onSubmit, fields, defaults }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState(defaults || {});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) setFormData(defaults || {});
    }, [open, defaults]);

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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="font-bold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
                    {fields.map(field => (
                        <div key={field.name}>
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
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>
                                            {t(`option.${opt}`, opt.charAt(0).toUpperCase() + opt.slice(1))}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={field.type}
                                    required={field.required}
                                    min={field.min}
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
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                        {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                        {submitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ServiceManagement;
