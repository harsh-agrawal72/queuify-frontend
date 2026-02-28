import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Plus,
    Edit2,
    Trash2,
    Loader2,
    X,
    Save,
    Users,
    Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';

const ResourceManager = () => {
    const [resources, setResources] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'staff',
        description: '',
        concurrent_capacity: 1,
        serviceIds: []
    });

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await api.get('/resources');
            setResources(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchResources();
        fetchServices();
    }, []);

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({
            name: '',
            type: 'staff',
            description: '',
            concurrent_capacity: 1,
            serviceIds: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = (res) => {
        setIsEditMode(true);
        setCurrentId(res.id);
        setFormData({
            name: res.name,
            type: res.type,
            description: res.description || '',
            concurrent_capacity: res.concurrent_capacity || 1,
            serviceIds: res.service_ids || []
        });
        setIsModalOpen(true);
    };

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.includes(serviceId)
                ? prev.serviceIds.filter(id => id !== serviceId)
                : [...prev.serviceIds, serviceId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                // Explicitly pick only editable fields to avoid 400 validation errors
                const updatePayload = {
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    concurrent_capacity: formData.concurrent_capacity,
                    serviceIds: formData.serviceIds
                };
                await api.patch(`/resources/${currentId}`, updatePayload);
                toast.success("Resource updated");
            } else {
                await api.post('/resources', formData);
                toast.success("Resource created");
            }
            setIsModalOpen(false);
            fetchResources();
        } catch (error) {
            console.error(error);
            toast.error("Operation failed");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/resources/${id}`);
            toast.success("Resource deleted");
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete resource");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Resources</h1>
                    <p className="text-sm text-gray-500">Manage staff, rooms, or equipment.</p>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                    <Plus className="h-4 w-4" /> Add Resource
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map(resource => (
                        <div key={resource.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(resource)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDelete(resource.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${resource.type === 'staff' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {resource.type === 'staff' ? <Users className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{resource.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[2.5em]">{resource.description || 'No description'}</p>
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-lg capitalize">
                                            {resource.type}
                                        </span>
                                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-700 rounded-lg">
                                            Cap: {resource.concurrent_capacity}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {services.filter(s => resource.service_ids?.includes(s.id)).map(s => (
                                            <span key={s.id} className="text-[10px] px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                                                {s.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-semibold text-gray-900">{isEditMode ? 'Edit Resource' : 'New Resource'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Basic Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Resource Name</label>
                                        <input type="text" required placeholder="e.g. Counter 1, Dr. Smith" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all">
                                                <option value="staff">Staff</option>
                                                <option value="room">Room</option>
                                                <option value="equipment">Equipment</option>
                                                <option value="counter">Counter</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Concurrent Capacity</label>
                                            <input type="number" required min="1" value={formData.concurrent_capacity} onChange={e => setFormData({ ...formData, concurrent_capacity: parseInt(e.target.value) })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea placeholder="e.g. Senior expert in dermatology..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" rows="2" />
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Assigned Services</h3>
                                <p className="text-xs text-gray-500">Pick the services this resource can provide.</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded-2xl border border-gray-100 custom-scrollbar">
                                    {services.map(service => (
                                        <label key={service.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group ${formData.serviceIds.includes(service.id) ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent hover:bg-white'}`}>
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${formData.serviceIds.includes(service.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                                                {formData.serviceIds.includes(service.id) && <Plus className="h-3 w-3 text-white rotate-45" style={{ transform: 'rotate(0deg)' }} />}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={formData.serviceIds.includes(service.id)}
                                                onChange={() => handleServiceToggle(service.id)}
                                            />
                                            <span className="text-sm font-medium text-gray-700">{service.name}</span>
                                        </label>
                                    ))}
                                    {services.length === 0 && <p className="text-center py-4 text-sm text-gray-400">No services found. Create some first.</p>}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
                                    <Save className="h-5 w-5" /> {isEditMode ? 'Update Resource' : 'Create Resource'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResourceManager;
