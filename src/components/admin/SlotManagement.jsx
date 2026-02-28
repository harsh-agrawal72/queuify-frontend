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
    Users,
    Pencil
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const SlotManagement = () => {
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
                toast.error('Failed to load services');
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
                toast.error('Failed to load resources');
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
            toast.error('Failed to load slots');
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
                toast.error('Failed to load resources');
            } finally {
                setLoadingModalResources(false);
            }
        };
        fetchModalResources();
    }, [selectedModalService]);

    // When resource is selected in modal, set default capacity
    const handleSelectResource = (resourceId) => {
        const res = modalResources.find(r => r.id === resourceId);
        setSelectedModalResource(res);
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
            toast.error('Please complete all fields');
            return;
        }

        // Client-side capacity check
        if (slotCapacity > (selectedModalResource.concurrent_capacity || 1)) {
            toast.error(`Capacity cannot exceed resource limit of ${selectedModalResource.concurrent_capacity}`);
            return;
        }

        setSubmitting(true);
        try {
            const start = new Date(`${slotDate}T${slotTime}`);
            const startTime = start.toISOString();

            // Calculate end time from service estimated_service_time
            const selectedService = modalServices.find(s => s.id === selectedModalService);
            const duration = selectedService?.estimated_service_time || 30;
            const end = new Date(start.getTime() + duration * 60 * 1000);
            const endTime = end.toISOString();

            const payload = {
                start_time: startTime,
                end_time: endTime,
                max_capacity: slotCapacity,
                resource_id: selectedModalResource.id
            };

            if (editingSlotId) {
                await api.patch(`/admin/slots/${editingSlotId}`, payload);
                toast.success('Slot updated successfully');
            } else {
                // Use /admin/slots for consistency and validation
                await api.post('/admin/slots', payload);
                toast.success('Slot created successfully');
            }

            closeModal();
            fetchSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save slot');
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
            setSlotDate(format(start, 'yyyy-MM-dd'));
            setSlotTime(format(start, 'HH:mm'));
            setSlotCapacity(slot.max_capacity);

        } catch (error) {
            console.error(error);
            toast.error("Failed to load slot details");
            closeModal();
        } finally {
            setLoadingModalResources(false);
        }
    };

    // ═══════════════════════════════════════════
    // DELETE SLOT
    // ═══════════════════════════════════════════
    const handleDeleteSlot = async (slotId) => {
        if (!confirm('Delete this slot?')) return;
        try {
            await api.delete(`/slots/${slotId}`);
            setSlots(prev => prev.filter(s => s.id !== slotId));
            toast.success('Slot deleted');
        } catch (error) {
            if (error.response?.status === 404) {
                setSlots(prev => prev.filter(s => s.id !== slotId));
                toast.error('Slot already deleted');
            } else {
                toast.error(error.response?.data?.message || 'Failed to delete slot');
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
        setSlotCapacity(1);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalStep(1);
        setSelectedModalService('');
        setSelectedModalResource(null);
        setSlotDate('');
        setSlotTime('');
        setSlotCapacity(1);
        setEditingSlotId(null);
    };

    // Computed end time preview
    const getEndTimePreview = () => {
        if (!slotDate || !slotTime || !selectedModalResource) return null;
        try {
            const start = new Date(`${slotDate}T${slotTime}`);
            const selectedService = modalServices.find(s => s.id === selectedModalService);
            const duration = selectedService?.estimated_service_time || 30;
            const end = new Date(start.getTime() + duration * 60 * 1000);
            return format(end, 'h:mm a');
        } catch {
            return null;
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
                    <h1 className="text-2xl font-bold text-gray-900">Manage Slots</h1>
                    <p className="text-sm text-gray-500 mt-1">Create and manage time slots for your resources.</p>
                </div>
                <button
                    onClick={openModal}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Plus className="h-4 w-4" /> Create Slot
                </button>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                    <Filter className="h-4 w-4" /> Filters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Service</label>
                        <select
                            value={filterService}
                            onChange={e => { setFilterService(e.target.value); setFilterResource(''); }}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm bg-white"
                        >
                            <option value="">All Services</option>
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
                            <option value="">{filterService ? 'All Resources' : 'Select service first'}</option>
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

                {(filterService || filterResource || filterDate) && (
                    <button
                        onClick={() => { setFilterService(''); setFilterResource(''); setFilterDate(''); }}
                        className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* ═══ SLOTS TABLE ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loadingSlots ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-400 h-7 w-7" /></div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-16">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No slots found</p>
                        <p className="text-xs text-gray-400 mt-1">Create a slot or adjust your filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-xs">
                                    <th className="px-5 py-3 text-left font-semibold">Date</th>
                                    <th className="px-5 py-3 text-left font-semibold">Service</th>
                                    <th className="px-5 py-3 text-left font-semibold">Resource</th>
                                    <th className="px-5 py-3 text-left font-semibold">Time Range</th>
                                    <th className="px-5 py-3 text-center font-semibold">Capacity</th>
                                    <th className="px-5 py-3 text-center font-semibold">Booked</th>
                                    <th className="px-5 py-3 text-center font-semibold">Remaining</th>
                                    <th className="px-5 py-3 text-center font-semibold">Status</th>
                                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
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
                                                        <span className="text-gray-400">No Services</span>
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
                                                    {isPast ? 'Past' : isFull ? 'Full' : isAlmostFull ? 'Almost Full' : 'Available'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete slot"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditSlot(slot)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                                                    title="Edit slot"
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
                )}
            </div>

            {/* ═══ CREATE SLOT MODAL ═══ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-semibold text-gray-900">{editingSlotId ? 'Update Time Slot' : 'Create Time Slot'}</h2>
                            <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-lg transition-colors"><X className="h-4 w-4 text-gray-400" /></button>
                        </div>

                        {/* Step indicator */}
                        <div className="px-6 pt-4 flex gap-1">
                            {['Service', 'Resource', 'Date & Time'].map((label, i) => (
                                <div key={label} className="flex-1">
                                    <div className={`h-1 rounded-full transition-all ${i + 1 <= modalStep ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                    <p className={`text-[10px] mt-1 text-center ${i + 1 <= modalStep ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>{label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 space-y-5 min-h-[250px]">
                            {/* Step 1: Select Service */}
                            {modalStep === 1 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Service</label>
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
                                                <p className="text-xs text-gray-500 mt-0.5">{s.description || 'No description'}</p>
                                            </button>
                                        ))}
                                        {modalServices.length === 0 && (
                                            <div className="text-center py-8">
                                                <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                <p className="text-sm text-gray-500">No services found. Create a service first.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Select Resource */}
                            {modalStep === 2 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Resource</label>
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
                                                            <p className="text-xs font-medium text-blue-600">Capacity</p>
                                                            <p className="text-xs text-gray-500">Max {r.concurrent_capacity}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            {modalResources.length === 0 && (
                                                <div className="text-center py-8">
                                                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                                    <p className="text-sm text-gray-500">No resources for this service. Add resources first.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <button onClick={() => setModalStep(1)} className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium">← Back to services</button>
                                </div>
                            )}

                            {/* Step 3: Date, Time, Capacity */}
                            {modalStep === 3 && selectedModalResource && (
                                <div className="space-y-4">
                                    {/* Resource info banner */}
                                    <div className="bg-indigo-50 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-indigo-900 text-sm">{selectedModalResource.name}</p>
                                            <p className="text-xs text-indigo-600">Max capacity: {selectedModalResource.concurrent_capacity}</p>
                                        </div>
                                        <button onClick={() => setModalStep(2)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">Change</button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={slotDate}
                                                onChange={e => setSlotDate(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                                            <input
                                                type="time"
                                                required
                                                step="300"
                                                value={slotTime}
                                                onChange={e => setSlotTime(e.target.value)}
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
                                                        toast('Time rounded to nearest 5 minutes', { icon: 'ℹ️' });
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">5 min intervals</p>
                                        </div>
                                    </div>

                                    {/* Auto-calculated end time */}
                                    {slotDate && slotTime && (
                                        <div className="bg-green-50 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
                                            <Clock className="h-4 w-4" />
                                            <span>End time: <strong>{getEndTimePreview()}</strong> (auto-calculated from service settings)</span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Capacity <span className="text-gray-400 font-normal">(max {selectedModalResource.concurrent_capacity})</span>
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            max={selectedModalResource.concurrent_capacity}
                                            value={slotCapacity}
                                            onChange={e => {
                                                const val = parseInt(e.target.value) || 1;
                                                setSlotCapacity(val);
                                            }}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm ${slotCapacity > selectedModalResource.concurrent_capacity
                                                ? 'border-red-400 focus:border-red-500 bg-red-50'
                                                : 'border-gray-200 focus:border-indigo-500'
                                                }`}
                                        />
                                        {slotCapacity > selectedModalResource.concurrent_capacity && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Cannot exceed resource capacity of {selectedModalResource.concurrent_capacity}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setModalStep(2)} className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                            Back
                                        </button>
                                        <button
                                            onClick={handleSaveSlot}
                                            disabled={submitting || !slotDate || !slotTime || slotCapacity > selectedModalResource.concurrent_capacity}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                                            {submitting ? 'Saving...' : (editingSlotId ? 'Update Slot' : 'Create Slot')}
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
