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
    Monitor,
    Info,
    IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';
import InfoTooltip from '../common/InfoTooltip';
import { useTranslation } from 'react-i18next';

const ResourceManager = () => {
    const { t } = useTranslation();
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
        is_active: true,
        serviceIds: [] // Array of { id, price }
    });

    const fetchResources = async () => {
        setLoading(true);
        try {
            const res = await api.get('/resources');
            setResources(res.data);
        } catch (error) {
            console.error(error);
            toast.error(t('resource_mgmt.load_failed', 'Failed to load resources'));
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
            is_active: true,
            serviceIds: []
        });
        setIsModalOpen(true);
    };

    const openEditModal = (res) => {
        setIsEditMode(true);
        setCurrentId(res.id);
        
        // Backend now returns service_mappings (array of {id, price})
        setFormData({
            name: res.name,
            type: res.type,
            description: res.description || '',
            concurrent_capacity: res.concurrent_capacity || 1,
            is_active: res.is_active !== false,
            serviceIds: res.service_mappings || []
        });
        setIsModalOpen(true);
    };

    const handleServiceToggle = (serviceId) => {
        setFormData(prev => {
            const exists = prev.serviceIds.some(s => s.id === serviceId);
            if (exists) {
                return {
                    ...prev,
                    serviceIds: prev.serviceIds.filter(s => s.id !== serviceId)
                };
            } else {
                return {
                    ...prev,
                    serviceIds: [...prev.serviceIds, { id: serviceId, price: 0 }]
                };
            }
        });
    };

    const handlePriceChange = (serviceId, price) => {
        setFormData(prev => ({
            ...prev,
            serviceIds: prev.serviceIds.map(s => 
                s.id === serviceId ? { ...s, price: parseFloat(price) || 0 } : s
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                const updatePayload = {
                    name: formData.name,
                    type: formData.type,
                    description: formData.description,
                    concurrent_capacity: formData.concurrent_capacity,
                    is_active: formData.is_active,
                    serviceIds: formData.serviceIds
                };
                await api.patch(`/resources/${currentId}`, updatePayload);
                toast.success(t('resource_mgmt.update_success', 'Resource updated'));
            } else {
                await api.post('/resources', formData);
                toast.success(t('resource_mgmt.create_success', 'Resource created'));
            }
            setIsModalOpen(false);
            fetchResources();
        } catch (error) {
            console.error(error);
            toast.error(t('resource_mgmt.op_failed', 'Operation failed'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('resource_mgmt.delete_confirm', 'Are you sure?'))) return;
        try {
            await api.delete(`/resources/${id}`);
            toast.success(t('resource_mgmt.delete_success', 'Resource deleted'));
            setResources(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            toast.error(t('resource_mgmt.delete_failed', 'Failed to delete resource'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {t('navigation.resource_management', 'Resource Management')}
                        <InfoTooltip text={t('resource_mgmt.mgmt_tooltip', 'Resources are doctors, staff, rooms, or equipment. Create them here and link them to multiple services with specific fees.')} />
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{t('resource_mgmt.mgmt_subtitle', 'Manage independent resources and their service-specific pricing.')}</p>
                </div>
                <button 
                    onClick={openCreateModal} 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="h-4 w-4" /> {t('resource_mgmt.add_resource', 'Add Resource')}
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

                            <div className="absolute bottom-4 right-4">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${resource.is_active !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                    {resource.is_active !== false ? t('resource_mgmt.active', 'Active') : t('resource_mgmt.inactive', 'Inactive')}
                                </span>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${resource.type === 'staff' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {resource.type === 'staff' ? <Users className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{resource.name}</h3>
                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 min-h-[2.5em]">{resource.description || t('resource_mgmt.no_description', 'No description')}</p>
                                    
                                    <div className="mt-3 space-y-1.5">
                                        {(resource.service_mappings || []).slice(0, 3).map(m => {
                                            const s = services.find(serv => serv.id === m.id);
                                            return (
                                                <div key={m.id} className="flex items-center justify-between text-[10px] bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <span className="font-medium text-gray-700 truncate mr-2">{s?.name || t('common.service', 'Service')}</span>
                                                    <span className="text-indigo-600 font-bold shrink-0">₹{m.price || 0}</span>
                                                </div>
                                            );
                                        })}
                                        {resource.service_mappings?.length > 3 && (
                                            <p className="text-[10px] text-gray-400 text-center">{t('resource_mgmt.more_services', '+{{count}} more services', { count: resource.service_mappings.length - 3 })}</p>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mt-3 border-t border-gray-50 pt-3">
                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg capitalize">
                                            {t(`resource_mgmt.${resource.type}`, resource.type)}
                                        </span>
                                        <span className="text-[10px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg">
                                            {t('resource_mgmt.capacity_label', 'Cap')}: {resource.concurrent_capacity}
                                        </span>
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
                            <h2 className="font-semibold text-gray-900">{isEditMode ? t('resource_mgmt.edit_resource', 'Edit Resource') : t('resource_mgmt.new_resource', 'New Resource')}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t('resource_mgmt.basic_info', 'Basic Information')}</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('resource_mgmt.name_label', 'Resource Name')}</label>
                                        <input type="text" required placeholder="e.g. Counter 1, Dr. Smith" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                                                {t('resource_mgmt.type_label', 'Resource Type')}
                                            </label>
                                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm">
                                                <option value="staff">{t('resource_mgmt.staff', 'Staff')}</option>
                                                <option value="room">{t('resource_mgmt.room', 'Room')}</option>
                                                <option value="equipment">{t('resource_mgmt.equipment', 'Equipment')}</option>
                                                <option value="counter">{t('resource_mgmt.counter', 'Counter')}</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                                                {t('resource_mgmt.capacity_label', 'Capacity')}
                                            </label>
                                            <input type="number" required min="1" value={formData.concurrent_capacity} onChange={e => setFormData({ ...formData, concurrent_capacity: parseInt(e.target.value) })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.description', 'Description')}</label>
                                        <textarea placeholder="e.g. Senior expert in dermatology..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none" rows="2" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-900">{t('resource_mgmt.status_label', 'Resource Status')}</p>
                                            <p className="text-[10px] text-gray-400">{t('resource_mgmt.status_hint', 'Enable to make it bookable.')}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                            className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${formData.is_active ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-gray-100" />

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{t('resource_mgmt.services_fees', 'Assigned Services & Fees')}</h3>
                                <p className="text-xs text-gray-500">{t('resource_mgmt.services_fees_hint', 'Select services and set specific fees for this resource.')}</p>
                                
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                    {services.map(service => {
                                        const mapping = formData.serviceIds.find(s => s.id === service.id);
                                        const isSelected = !!mapping;

                                        return (
                                            <div key={service.id} className={`p-3 rounded-2xl border transition-all ${isSelected ? 'bg-indigo-50/30 border-indigo-200 ring-4 ring-indigo-500/5' : 'bg-white border-gray-100 hover:border-indigo-100'}`}>
                                                <div className="flex items-center justify-between gap-3">
                                                    <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300'}`}>
                                                            {isSelected && <Plus className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleServiceToggle(service.id)} />
                                                        <span className="text-sm font-medium text-gray-700 truncate">{service.name}</span>
                                                    </label>
                                                    
                                                    {isSelected && (
                                                        <div className="relative w-24 animate-in fade-in slide-in-from-right-2 duration-200">
                                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                                                                <IndianRupee className="h-3 w-3" />
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                placeholder={t('resource_mgmt.fee_placeholder', 'Fee')}
                                                                value={mapping.price}
                                                                onChange={(e) => handlePriceChange(service.id, e.target.value)}
                                                                className="w-full pl-7 pr-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-600"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {services.length === 0 && <p className="text-center py-4 text-sm text-gray-400">{t('resource_mgmt.no_services_found', 'No services found.')}</p>}
                                </div>
                            </div>

                            <div className="pt-4">
                                <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200 hover:shadow-indigo-300">
                                    <Save className="h-5 w-5" /> {isEditMode ? t('resource_mgmt.save_changes', 'Update Changes') : t('resource_mgmt.create_resource', 'Create Resource')}
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
