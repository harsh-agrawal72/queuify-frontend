import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import {
    Plus,
    Trash2,
    Loader2,
    X,
    Save,
    Calendar,
    Clock,
    Filter,
    AlertCircle,
    AlertTriangle,
    Users,
    Pencil,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import InfoTooltip from '../common/InfoTooltip';
import { useTranslation } from 'react-i18next';

const SlotManagement = () => {
    const { t } = useTranslation();
    // ─── Data ───
    const [services, setServices] = useState([]);
    const [resources, setResources] = useState([]);
    const [slots, setSlots] = useState([]);

    // ─── Filters ───
    const [filterService, setFilterService] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const [filterDate, setFilterDate] = useState('');

    // ─── Loading States ───
    const [loadingServices, setLoadingServices] = useState(true);
    const [loadingResources, setLoadingResources] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ─── Create Modal ───
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [modalServices, setModalServices] = useState([]);
    const [modalResources, setModalResources] = useState([]);
    const [loadingModalResources, setLoadingModalResources] = useState(false);
    const [selectedModalService, setSelectedModalService] = useState('');
    const [selectedModalResource, setSelectedModalResource] = useState(null);
    const [slotDate, setSlotDate] = useState('');
    const [slotTime, setSlotTime] = useState('');
    const [slotEndTime, setSlotEndTime] = useState('');
    const [slotCapacity, setSlotCapacity] = useState(1);
    const [editingSlotId, setEditingSlotId] = useState(null);

    // ═══════════════════════════════════════════
    // FETCH SERVICES ON MOUNT
    // ═══════════════════════════════════════════
    useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/services');
                setServices(res.data);
                setModalServices(res.data);
            } catch {
                toast.error(t('service.load_failed', 'Failed to load services'));
            } finally {
                setLoadingServices(false);
            }
        };
        fetchServices();
    }, []);

    // ═══════════════════════════════════════════
    // FETCH RESOURCES WHEN FILTER SERVICE CHANGES
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!filterService) {
            setResources([]);
            setFilterResource('');
            return;
        }
        const fetchResources = async () => {
            setLoadingResources(true);
            try {
                const res = await api.get(`/resources/by-service/${filterService}`);
                setResources(res.data);
            } catch {
                toast.error(t('service.resource_load_failed', 'Failed to load resources'));
            } finally {
                setLoadingResources(false);
            }
        };
        fetchResources();
    }, [filterService]);

    // ═══════════════════════════════════════════
    // FETCH SLOTS (triggered by filter changes + on mount)
    // ═══════════════════════════════════════════
    const fetchSlots = useCallback(async () => {
        setLoadingSlots(true);
        try {
            const params = {};
            if (filterService) params.serviceId = filterService;
            if (filterResource) params.resourceId = filterResource;
            if (filterDate) params.date = filterDate;
            const res = await api.get('/slots', { params });
            setSlots(res.data);
        } catch {
            toast.error(t('slot.load_failed', 'Failed to load slots'));
        } finally {
            setLoadingSlots(false);
        }
    }, [filterService, filterResource, filterDate]);

    // Fetch on mount (all org slots) and when filters change
    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    // ═══════════════════════════════════════════
    // MODAL: FETCH RESOURCES FOR SELECTED SERVICE
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!selectedModalService) {
            setModalResources([]);
            setSelectedModalResource(null);
            return;
        }
        const fetchModalResources = async () => {
            setLoadingModalResources(true);
            try {
                const res = await api.get(`/resources/by-service/${selectedModalService}`);
                setModalResources(res.data);
            } catch {
                toast.error(t('resource.load_failed', 'Failed to load resources'));
            } finally {
                setLoadingModalResources(false);
            }
        };
        fetchModalResources();
    }, [selectedModalService]);

    // ═══════════════════════════════════════════
    // SMART CAPACITY CALCULATION
    // ═══════════════════════════════════════════
    useEffect(() => {
        if (!isModalOpen || !slotTime || !slotEndTime || !selectedModalResource || !selectedModalService) return;

        try {
            const [startH, startM] = slotTime.split(':').map(Number);
            const [endH, endM] = slotEndTime.split(':').map(Number);
            
            const start = new Date();
            start.setHours(startH, startM, 0, 0);
            
            const end = new Date();
            end.setHours(endH, endM, 0, 0);

            let durationMinutes = (end - start) / (1000 * 60);
            // Handle cross-day slots (though unlikely for admin slots, safety first)
            if (durationMinutes < 0) durationMinutes += 24 * 60;

            const service = modalServices.find(s => s.id === selectedModalService);
            // Use resource inherent duration if exists, otherwise service estimated time
            const serviceTime = selectedModalResource.duration_minutes || service?.estimated_service_time || 30;
            const resourceCapacity = selectedModalResource.concurrent_capacity || 1;

            if (durationMinutes > 0) {
                const calculatedCapacity = Math.max(1, Math.floor((durationMinutes / serviceTime) * resourceCapacity));
                
                // Only auto-update if it's a new slot (to avoid overwriting manual edits on existing slots)
                if (!editingSlotId) {
                    setSlotCapacity(calculatedCapacity);
                }
            }
        } catch (e) {
            console.error("Capacity calculation failed", e);
        }
    }, [slotTime, slotEndTime, selectedModalResource, selectedModalService, isModalOpen]);

    // When resource is selected in modal, set base capacity
    const handleSelectResource = (resourceId) => {
        const res = modalResources.find(r => r.id === resourceId);
        setSelectedModalResource(res);
        // Initial set - will be refined by the useEffect above
        if (res) {
            setSlotCapacity(res.concurrent_capacity || 1);
        }
    };

    // ═══════════════════════════════════════════
    // CREATE SLOT
    // ═══════════════════════════════════════════
    // ═══════════════════════════════════════════
    // CREATE / UPDATE SLOT
    // ═══════════════════════════════════════════
    const handleSaveSlot = async () => {
        if (!selectedModalResource || !slotDate || !slotTime) {
            toast.error(t('common.complete_fields', 'Please complete all fields'));
            return;
        }

        // Client-side capacity check removed as per user request
    /*
        if (slotCapacity > (selectedModalResource.concurrent_capacity || 1)) {
            toast.error(`Capacity cannot exceed resource limit of ${selectedModalResource.concurrent_capacity}`);
            return;
        }
    */

        setSubmitting(true);
        try {
            const start = new Date(`${slotDate}T${slotTime}`);
            const startTime = start.toISOString();

            const end = new Date(`${slotDate}T${slotEndTime}`);
            const endTime = end.toISOString();

            const payload = {
                start_time: startTime,
                end_time: endTime,
                max_capacity: slotCapacity,
                resource_id: selectedModalResource.id
            };

            if (editingSlotId) {
                await api.patch(`/admin/slots/${editingSlotId}`, payload);
                toast.success(t('slot.updated', 'Slot updated successfully'));
            } else {
                // Use /admin/slots for consistency and validation
                await api.post('/admin/slots', payload);
                toast.success(t('slot.created', 'Slot created successfully'));
            }

            closeModal();
            fetchSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || t('slot.save_failed', 'Failed to save slot'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSlot = async (slot) => {
        setEditingSlotId(slot.id);

        // In decoupled model, we don't strictly need a service context for a slot,
        // but we can try to pre-select it for the UI filter.
        let serviceId = slot.service_id || (slot.service_ids?.[0]) || (slot.service_names?.[0] ? services.find(s => s.name === slot.service_names[0])?.id : '');

        setSelectedModalService(serviceId);

        setLoadingModalResources(true);
        // Open modal immediately to show loading state
        setIsModalOpen(true);
        setModalStep(3); // Jump to last step? Or load resources first?

        try {
            // Fetch resources for this service
            if (serviceId) {
                const res = await api.get(`/resources/by-service/${serviceId}`);
                setModalResources(res.data);

                // Find specific resource
                const resource = res.data.find(r => r.id === slot.resource_id);
                if (resource) {
                    setSelectedModalResource(resource);
                }
            } else {
                // If no serviceId, we still need the resource info if possible
                // For now, let's just use what we have in slot
                setModalResources([]);
            }

            // Set Time/Date
            // slot.start_time is ISO string
            const start = new Date(slot.start_time);
            const end = new Date(slot.end_time);
            setSlotDate(format(start, 'yyyy-MM-dd'));
            setSlotTime(format(start, 'HH:mm'));
            setSlotEndTime(format(end, 'HH:mm'));
            setSlotCapacity(slot.max_capacity);

        } catch (error) {
            console.error(error);
            toast.error(t('slot.load_details_failed', "Failed to load slot details"));
            closeModal();
        } finally {
            setLoadingModalResources(false);
        }
    };

    // ═══════════════════════════════════════════
    // DELETE SLOT
    // ═══════════════════════════════════════════
    const handleDeleteSlot = async (slotId) => {
        if (!confirm(t('slot.delete_confirm', 'Delete this slot?'))) return;
        try {
            await api.delete(`/slots/${slotId}`);
            setSlots(prev => prev.filter(s => s.id !== slotId));
            toast.success(t('slot.deleted', 'Slot deleted'));
        } catch (error) {
            if (error.response?.status === 404) {
                setSlots(prev => prev.filter(s => s.id !== slotId));
                toast.error(t('slot.already_deleted', 'Slot already deleted'));
            } else {
                toast.error(error.response?.data?.message || t('slot.delete_failed', 'Failed to delete slot'));
            }
        }
    };

    // ═══════════════════════════════════════════
    // MODAL HELPERS
    // ═══════════════════════════════════════════
    const openModal = () => {
        setIsModalOpen(true);
        setModalStep(1);
        setSelectedModalService('');
        setSelectedModalResource(null);
        setSlotDate('');
        setSlotTime('');
        setSlotEndTime('');
        setSlotCapacity(1);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalStep(1);
        setSelectedModalService('');
        setSelectedModalResource(null);
        setSlotDate('');
        setSlotTime('');
        setSlotEndTime('');
        setSlotCapacity(1);
        setEditingSlotId(null);
    };

    // Computed end time suggestion
    const updateEndTimeSuggestion = (newStartTime) => {
        if (!newStartTime) return;
        try {
            const [h, m] = newStartTime.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            const selectedService = modalServices.find(s => s.id === selectedModalService);
            const duration = selectedService?.estimated_service_time || 30;
            const end = new Date(date.getTime() + duration * 60 * 1000);
            setSlotEndTime(format(end, 'HH:mm'));
        } catch (e) {
            console.error("End time calc failed", e);
        }
    };

    // ═══════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {t('navigation.manage_slots', 'Manage Slots')}
                        <InfoTooltip text={t('slot.mgmt_tooltip', 'Slots are the specific time periods when a Resource is available for a Service. Select a Service and then a Resource to create a slot.')} />
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{t('slot.mgmt_subtitle', 'Create and manage time slots for your resources.')}</p>
                </div>
                <button
                    onClick={openModal}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="h-4 w-4" /> {t('slot.create_slot', 'Create Slot')}
                </button>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    <Filter className="h-4 w-4" /> {t('common.filters', 'Filters')}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Service</label>
                        <select
                            value={filterService}
                            onChange={e => { setFilterService(e.target.value); setFilterResource(''); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white"
                        >
                            <option value="">{t('service.all_services', 'All Services')}</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Resource</label>
                        <select
                            value={filterResource}
                            onChange={e => setFilterResource(e.target.value)}
                            disabled={!filterService}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white disabled:bg-gray-50 disabled:text-gray-400"
                        >
                            <option value="">{filterService ? t('resource.all_resources', 'All Resources') : t('service.select_first', 'Select service first')}</option>
                            {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                    {(filterService || filterResource || filterDate) ? (
                        <button
                            onClick={() => { setFilterService(''); setFilterResource(''); setFilterDate(''); }}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {t('common.clear_all_filters', 'Clear all filters')}
                        </button>
                    ) : <div />}
                </div>
            </div>

            {/* ═══ SLOTS TABLE ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
                {loadingSlots ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-400 h-7 w-7" /></div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-16">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{t('slot.no_slots', 'No slots found')}</p>
                        <p className="text-xs text-gray-400 mt-1">{t('slot.adjust_filters', 'Create a slot or adjust your filters.')}</p>
                    </div>
                ) : (
                    <>
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                                    <th className="px-5 py-3 text-left font-semibold">{t('common.date', 'Date')}</th>
                                    <th className="px-5 py-3 text-left font-semibold">{t('common.service', 'Service')}</th>
                                    <th className="px-5 py-3 text-left font-semibold">{t('common.resource', 'Resource')}</th>
                                    <th className="px-5 py-3 text-left font-semibold">{t('slot.time_range', 'Time Range')}</th>
                                    <th className="px-5 py-3 text-center font-semibold">{t('slot.capacity', 'Capacity')}</th>
                                    <th className="px-5 py-3 text-center font-semibold">{t('common.booked', 'Booked')}</th>
                                    <th className="px-5 py-3 text-center font-semibold">{t('slot.remaining', 'Remaining')}</th>
                                    <th className="px-5 py-3 text-center font-semibold">{t('common.status', 'Status')}</th>
                                    <th className="px-5 py-3 text-right font-semibold">{t('common.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {slots.map(slot => {
                                    const remaining = slot.max_capacity - slot.booked_count;
                                    const isFull = remaining <= 0;
                                    const isAlmostFull = !isFull && remaining <= Math.ceil(slot.max_capacity * 0.3);
                                    const isPast = new Date(slot.end_time) < new Date();

                                    return (
                                        <tr key={slot.id} className={`hover:bg-gray-50 transition-colors ${isPast ? 'opacity-50' : ''}`}>
                                            <td className="px-5 py-3.5 font-medium text-gray-800">
                                                {format(parseISO(slot.start_time), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">
                                                <div className="flex flex-wrap gap-1">
                                                    {slot.service_names?.length > 0 ? (
                                                        slot.service_names.map(name => (
                                                            <span key={name} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] whitespace-nowrap">
                                                                {name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-gray-400">{t('service.no_services', 'No Services')}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div>
                                                    <span className="text-gray-800 font-medium">{slot.resource_name || '—'}</span>
                                                    {slot.resource_type && (
                                                        <span className="ml-1.5 text-xs text-gray-400 capitalize">({slot.resource_type})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">
                                                {format(parseISO(slot.start_time), 'h:mm a')} – {format(parseISO(slot.end_time), 'h:mm a')}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium text-xs">{slot.max_capacity}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="font-medium text-gray-700">{slot.booked_count}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${isFull ? 'bg-red-100 text-red-700' :
                                                    isAlmostFull ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-green-100 text-green-700'
                                                    }`}>{remaining}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full font-medium text-xs ${isPast ? 'bg-gray-100 text-gray-500' :
                                                    isFull ? 'bg-red-50 text-red-600' :
                                                        isAlmostFull ? 'bg-yellow-50 text-yellow-600' :
                                                            'bg-emerald-50 text-emerald-600'
                                                    }`}>
                                                    {isPast ? t('status.past', 'Past') : isFull ? t('status.full', 'Full') : isAlmostFull ? t('status.almost_full', 'Almost Full') : t('status.available', 'Available')}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('slot.delete', 'Delete slot')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSlot(slot)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                                                    title={t('slot.edit', 'Edit slot')}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-50">
                        {slots.map(slot => {
                            const remaining = slot.max_capacity - slot.booked_count;
                            const isPast = new Date(slot.end_time) < new Date();
                            const isFull = remaining <= 0;

                            return (
                                <div key={slot.id} className={`p-5 space-y-4 ${isPast ? 'opacity-60 bg-gray-50/50' : ''}`}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{format(parseISO(slot.start_time), 'EEEE, MMM d')}</p>
                                            <p className="text-xs text-indigo-600 font-medium mt-1">
                                                {format(parseISO(slot.start_time), 'h:mm a')} – {format(parseISO(slot.end_time), 'h:mm a')}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditSlot(slot)} className="p-2 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded-lg"><Pencil className="h-4 w-4" /></button>
                                            <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <div className="flex-1 min-w-[120px]">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Resource</p>
                                            <p className="text-xs font-semibold text-gray-800">{slot.resource_name}</p>
                                            <p className="text-[10px] text-gray-400 capitalize">{slot.resource_type}</p>
                                        </div>
                                        <div className="flex-1 min-w-[80px] text-right">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Availability</p>
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {t('slot.left_count', '{{count}} Left', { count: remaining })} / {slot.max_capacity}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-50">
                                        <div className="flex flex-wrap gap-1">
                                            {slot.service_names?.map(name => (
                                                <span key={name} className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[10px] font-medium uppercase">{name}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    </>
                )}
            </div>

            {/* ═══ CREATE SLOT MODAL ═══ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-semibold text-gray-900">{editingSlotId ? t('slot.update_slot', 'Update Time Slot') : t('slot.create_slot_title', 'Create Time Slot')}</h2>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><X className="h-4 w-4 text-gray-400" /></button>
                        </div>

                        {/* Step indicator */}
                        <div className="px-6 pt-4 flex gap-1">
                            {[t('common.service', 'Service'), t('common.resource', 'Resource'), t('slot.date_time', 'Date & Time')].map((label, i) => (
                                <div key={`${label}-${i}`} className="flex-1">
                                    <div className={`h-1 rounded-full transition-all ${i + 1 <= modalStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                    <p className={`text-[10px] mt-1 text-center ${i + 1 <= modalStep ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 space-y-5 min-h-[250px]">
                            {/* Step 1: Select Service */}
                            {modalStep === 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('service.select_service', 'Select Service')}</label>
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {modalServices.map(s => (
                                            <button
                                                key={s.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedModalService(s.id);
                                                    setSelectedModalResource(null);
                                                    setModalStep(2);
                                                }}
                                                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedModalService === s.id
                                                    ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{s.description || t('service.no_description', 'No description')}</p>
                                            </button>
                                        ))}
                                        {modalServices.length === 0 && (
                                            <div className="text-center py-8">
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">{t('service.none_found', 'No services found. Create a service first.')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Select Resource */}
                            {modalStep === 2 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('resource.select_resource', 'Select Resource')}</label>
                                    {loadingModalResources ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-400 h-5 w-5" /></div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {modalResources.map(r => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleSelectResource(r.id);
                                                        setModalStep(3);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-xl border transition-all ${selectedModalResource?.id === r.id
                                                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                                                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                                                            <p className="text-xs text-gray-400 capitalize">{r.type}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-blue-600">Selected</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            {modalResources.length === 0 && (
                                                <div className="text-center py-8">
                                                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">{t('service.no_resources_hint', 'No resources for this service. Add resources first.')}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => setModalStep(1)} className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">{t('common.back_to_services', '← Back to services')}</button>
                                </div>
                            )}

                            {/* Step 3: Date, Time, Capacity */}
                            {modalStep === 3 && selectedModalResource && (
                                <div className="space-y-4">
                                    {/* Resource info banner */}
                                    <div className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-indigo-900 text-sm">{selectedModalResource.name}</p>
                                        </div>
                                        <button onClick={() => setModalStep(2)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">{t('common.change', 'Change')}</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.date', 'Date')}</label>
                                            <input
                                                type="date"
                                                required
                                                value={slotDate}
                                                onChange={e => setSlotDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.slots.start_time', 'Start Time')}</label>
                                            <input
                                                type="time"
                                                required
                                                step="300"
                                                value={slotTime}
                                                onChange={e => {
                                                    setSlotTime(e.target.value);
                                                    updateEndTimeSuggestion(e.target.value);
                                                }}
                                                onBlur={e => {
                                                    if (!e.target.value) return;
                                                    const [h, m] = e.target.value.split(':').map(Number);
                                                    const date = new Date();
                                                    date.setHours(h, m, 0, 0);
                                                    const coeff = 1000 * 60 * 5;
                                                    const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
                                                    const formatted = format(rounded, 'HH:mm');
                                                    if (formatted !== e.target.value) {
                                                        setSlotTime(formatted);
                                                        updateEndTimeSuggestion(formatted);
                                                        toast(t('slot.time_rounded', 'Time rounded to nearest 5 minutes'), { icon: 'ℹ️' });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{t('admin.slots.interval_hint', '5 min intervals')}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.slots.end_time', 'End Time')}</label>
                                            <input
                                                type="time"
                                                required
                                                step="300"
                                                value={slotEndTime}
                                                onChange={e => setSlotEndTime(e.target.value)}
                                                onBlur={e => {
                                                    if (!e.target.value) return;
                                                    const [h, m] = e.target.value.split(':').map(Number);
                                                    const date = new Date();
                                                    date.setHours(h, m, 0, 0);
                                                    const coeff = 1000 * 60 * 5;
                                                    const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
                                                    const formatted = format(rounded, 'HH:mm');
                                                    if (formatted !== e.target.value) {
                                                        setSlotEndTime(formatted);
                                                        toast(t('slot.time_rounded', 'Time rounded to nearest 5 minutes'), { icon: 'ℹ️' });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">{t('admin.slots.interval_hint', '5 min intervals')}</p>
                                        </div>
                                    </div>

                                    {/* Guidance message */}
                                    {slotDate && slotTime && slotEndTime && selectedModalResource && (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                                            <div className="flex items-start gap-2 text-xs text-indigo-700">
                                                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                <span>{t('admin.slots.end_time_hint', 'The end time is pre-filled based on your service duration ({{duration}} mins).', { duration: modalServices.find(s => s.id === selectedModalService)?.estimated_service_time || 30 })}</span>
                                            </div>
                                            <div className="flex items-start gap-2 text-[11px] text-indigo-600 bg-white/50 p-2 rounded-lg">
                                                <div className="font-bold py-0.5 px-1.5 bg-indigo-600 text-white rounded mr-1">Smart Logic</div>
                                                <span>
                                                    {(() => {
                                                        const start = new Date(`${slotDate}T${slotTime}`);
                                                        const end = new Date(`${slotDate}T${slotEndTime}`);
                                                        const duration = (end - start) / (1000 * 60);
                                                        const service = modalServices.find(s => s.id === selectedModalService);
                                                        const sTime = selectedModalResource.duration_minutes || service?.estimated_service_time || 30;
                                                        const cap = selectedModalResource.concurrent_capacity || 1;
                                                        return `(${duration}m duration / ${sTime}m service) × ${cap} staff = ${Math.floor((duration / sTime) * cap)} total capacity.`;
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            {t('admin.slots.max_capacity', 'Capacity')}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={slotCapacity}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 1;
                                                setSlotCapacity(val);
                                            }}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setModalStep(2)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                            {t('common.back', 'Back')}
                                        </button>
                                        <button
                                            onClick={handleSaveSlot}
                                            disabled={submitting || !slotDate || !slotTime}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                            {submitting ? t('common.saving', 'Saving...') : (editingSlotId ? t('slot.update_slot_btn', 'Update Slot') : t('slot.create_slot_btn', 'Create Slot'))}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlotManagement;
