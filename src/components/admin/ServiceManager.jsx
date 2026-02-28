import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    X,
    Save,
    Briefcase,
    Link2,
    Unlink
} from 'lucide-react';
import toast from 'react-hot-toast';

const ServiceManager = () => {
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [linkingService, setLinkingService] = useState(null);
    const [linkedResourceIds, setLinkedResourceIds] = useState([]);
    const [savingLink, setSavingLink] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        queue_scope: 'CENTRAL',
        estimated_service_time: 30
    });

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    };

    const fetchResources = async () => {
        try {
            const res = await api.get('/resources');
            setResources(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchServices();
        fetchResources();
    }, []);

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({
            name: '',
            description: '',
            queue_scope: 'CENTRAL',
            estimated_service_time: 30
        });
        setIsModalOpen(true);
    };

    const openEditModal = (service) => {
        setIsEditMode(true);
        setCurrentId(service.id);
        setFormData({
            name: service.name,
            description: service.description || '',
            queue_scope: service.queue_scope,
            estimated_service_time: service.estimated_service_time
        });
        setIsModalOpen(true);
    };

    const openLinkModal = async (service) => {
        setLinkingService(service);
        // Fetch currently linked resources for this service
        try {
            const res = await api.get(`/resources/by-service/${service.id}`);
            setLinkedResourceIds(res.data.map(r => r.id));
        } catch {
            setLinkedResourceIds([]);
        }
        setIsLinkModalOpen(true);
    };

    const toggleResourceLink = async (resourceId) => {
        if (!linkingService) return;
        setSavingLink(true);
        try {
            const isLinked = linkedResourceIds.includes(resourceId);
            const newServiceIds = isLinked
                ? linkingService.service_ids?.filter(id => id !== linkingService.id) || []
                : [...(linkingService.service_ids || []), linkingService.id];

            // In the new model, we update the resource with the new set of service IDs
            await api.patch(`/resources/${resourceId}`, {
                serviceIds: isLinked
                    ? resources.find(r => r.id === resourceId).service_ids.filter(id => id !== linkingService.id)
                    : [...(resources.find(r => r.id === resourceId).service_ids || []), linkingService.id]
            });

            setLinkedResourceIds(prev => isLinked ? prev.filter(id => id !== resourceId) : [...prev, resourceId]);
            toast.success(isLinked ? "Resource unlinked" : "Resource linked");
            fetchResources(); // Refresh resource list to get updated service_ids
        } catch (error) {
            console.error(error);
            toast.error("Failed to update link");
        } finally {
            setSavingLink(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                // Explicitly pick only editable fields to avoid 400 validation errors
                const updatePayload = {
                    name: formData.name,
                    description: formData.description,
                    queue_scope: formData.queue_scope,
                    estimated_service_time: formData.estimated_service_time
                };
                await api.patch(`/services/${currentId}`, updatePayload);
                toast.success("Service updated");
            } else {
                await api.post('/services', formData);
                toast.success("Service created");
            }
            setIsModalOpen(false);
            fetchServices();
        } catch (error) {
            console.error(error);
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/services/${id}`);
            toast.success("Service deleted");
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete service");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Services</h1>
                    <p className="text-sm text-gray-500">Manage the services you offer and link them to resources.</p>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="h-4 w-4" /> Add Service
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(service => (
                        <div key={service.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openLinkModal(service)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Link Resources">
                                    <Link2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => openEditModal(service)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(service.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Briefcase className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{service.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[2.5em]">{service.description || 'No description'}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                            {service.estimated_service_time} mins
                                        </span>
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-50 text-gray-700 rounded-lg">
                                            {service.queue_scope.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Service Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-semibold text-gray-900">{isEditMode ? 'Edit Service' : 'New Service'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            {/* Basic Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                                        <input type="text" required placeholder="e.g. Consultation" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea placeholder="Describe the service..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" rows="2" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            {/* Queue Settings Section */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Queue & Time Settings</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Queue Scope</label>
                                        <select value={formData.queue_scope} onChange={e => setFormData({ ...formData, queue_scope: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                                            <option value="CENTRAL">Centralized</option>
                                            <option value="PER_RESOURCE">Per Resource</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (mins)</label>
                                        <input type="number" required min="1" value={formData.estimated_service_time} onChange={e => setFormData({ ...formData, estimated_service_time: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 disabled:opacity-50">
                                    <Save className="h-5 w-5" /> {isEditMode ? 'Update Service' : 'Create Service'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Link Resources Modal */}
            {isLinkModalOpen && linkingService && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <div>
                                <h2 className="font-semibold text-gray-900">Link Resources</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Service: {linkingService.name}</p>
                            </div>
                            <button onClick={() => setIsLinkModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
                            {resources.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No resources created yet. Create resources first.</p>
                            ) : (
                                resources.map(resource => {
                                    const isLinked = linkedResourceIds.includes(resource.id);
                                    return (
                                        <button
                                            key={resource.id}
                                            onClick={() => toggleResourceLink(resource.id)}
                                            disabled={savingLink}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${isLinked
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                } ${savingLink ? 'opacity-50' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${isLinked ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                    {isLinked ? <Link2 className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{resource.name}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{resource.type}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-medium px-2 py-1 rounded-lg ${isLinked ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {isLinked ? 'Linked' : 'Not Linked'}
                                            </span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                            <button onClick={() => setIsLinkModalOpen(false)} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceManager;
