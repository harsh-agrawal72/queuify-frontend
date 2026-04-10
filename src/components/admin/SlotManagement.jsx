import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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
    Pencil,
    Copy,
    Search,
    Sparkles,
    Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO, addDays, addWeeks } from 'date-fns';
import InfoTooltip from '../common/InfoTooltip';
import { useTranslation } from 'react-i18next';

const SlotManagement = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const planFeatures = user?.plan_features || {};

    // ─── Data ───
    const [services, setServices] = useState([]);
    const [allResources, setAllResources] = useState([]);
    const [slots, setSlots] = useState([]);

    // ─── Filters ───
    const [filterService, setFilterService] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // ─── Loading States ───
    const [loadingData, setLoadingData] = useState(true);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // ─── Create Modal ───
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalStep, setModalStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [selectedModalResource, setSelectedModalResource] = useState(null);
    const [slotDate, setSlotDate] = useState('');
    const [slotTime, setSlotTime] = useState('');
    const [slotEndTime, setSlotEndTime] = useState('');
    const [slotCapacity, setSlotCapacity] = useState(1);
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [resourceSearch, setResourceSearch] = useState('');
    const [wasCapacityManuallySet, setWasCapacityManuallySet] = useState(false);

    // ─── Bulk Copy Modal ───
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [copySourceDate, setCopySourceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [copyTargetDates, setCopyTargetDates] = useState([]);
    const [copyResourceId, setCopyResourceId] = useState('');
    const [copyOverwrite, setCopyOverwrite] = useState(false);
    const [copying, setCopying] = useState(false);
    const [copyMode, setCopyMode] = useState('manual');

    // ─── AI Capacity Stats ───
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [resourcePerformance, setResourcePerformance] = useState(null);

    // ═══════════════════════════════════════════
    // FETCH INITIAL DATA
    // ═══════════════════════════════════════════
    useEffect(() => {
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [servicesRes, resourcesRes] = await Promise.all([
                    api.get('/services'),
                    api.get('/resources')
                ]);
                setServices(servicesRes.data);
                setAllResources(resourcesRes.data);
            } catch {
                toast.error(t('service.load_failed', 'Failed to load data'));
            } finally {
                setLoadingData(false);
            }
        };
        fetchData();
    }, [t]);

    // Fetch AI performance when resource is selected
    useEffect(() => {
        if (selectedModalResource?.id && modalStep === 2) {
            const fetchPerformance = async () => {
                setPerformanceLoading(true);
                try {
                    const res = await api.get(`/admin/resources/${selectedModalResource.id}/performance`);
                    setResourcePerformance(res.data);
                } catch (e) {
                    console.error('Failed to fetch performance:', e);
                } finally {
                    setPerformanceLoading(false);
                }
            };
            fetchPerformance();
        } else {
            setResourcePerformance(null);
        }
    }, [selectedModalResource, modalStep]);

    // Handle Auto-Capacity Suggestion
    useEffect(() => {
        if (!wasCapacityManuallySet && slotTime && slotEndTime && resourcePerformance?.avg_service_time) {
            const suggested = getAiSuggestedCapacity();
            if (suggested !== slotCapacity) {
                setSlotCapacity(suggested);
            }
        }
    }, [slotTime, slotEndTime, resourcePerformance, wasCapacityManuallySet, slotCapacity]);

    // ═══════════════════════════════════════════
    // FETCH SLOTS
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
            toast.error(t('admin.slots.load_failed', 'Failed to load slots'));
        } finally {
            setLoadingSlots(false);
        }
    }, [filterService, filterResource, filterDate, t]);

    useEffect(() => {
        fetchSlots();
    }, [fetchSlots]);

    // ═══════════════════════════════════════════
    // CREATE / UPDATE SLOT
    // ═══════════════════════════════════════════
    const handleSaveSlot = async () => {
        if (!selectedModalResource || !slotDate || !slotTime || !slotEndTime) {
            toast.error(t('common.complete_fields', 'Please complete all fields'));
            return;
        }

        setSubmitting(true);
        try {
            const start = new Date(`${slotDate}T${slotTime}`);
            const end = new Date(`${slotDate}T${slotEndTime}`);

            const payload = {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                max_capacity: slotCapacity,
                resource_id: selectedModalResource.id
            };

            if (editingSlotId) {
                await api.patch(`/admin/slots/${editingSlotId}`, payload);
                toast.success(t('admin.slots.updated', 'Slot updated successfully'));
            } else {
                await api.post('/admin/slots', payload);
                toast.success(t('admin.slots.created', 'Slot created successfully'));
            }

            closeModal();
            fetchSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.slots.save_failed', 'Failed to save slot'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditSlot = (slot) => {
        const isPast = new Date(slot.end_time) < new Date();
        if (isPast) {
            toast.error(t('admin.slots.past_edit_denied', "Cannot edit past slots."));
            return;
        }
        setEditingSlotId(slot.id);
        const resource = allResources.find(r => r.id === slot.resource_id);
        setSelectedModalResource(resource);

        const start = new Date(slot.start_time);
        const end = new Date(slot.end_time);
        setSlotDate(format(start, 'yyyy-MM-dd'));
        setSlotTime(format(start, 'HH:mm'));
        setSlotEndTime(format(end, 'HH:mm'));
        setSlotCapacity(slot.max_capacity);

        setIsModalOpen(true);
        setModalStep(2); // Jump to Time step
    };

    const handleDeleteSlot = async (slotId) => {
        const slot = slots.find(s => s.id === slotId);
        const isPast = slot && new Date(slot.end_time) < new Date();

        if (isPast) {
            if (!confirm(t('admin.slots.delete_past_confirm', 'This is a past slot. Deleting it will remove historical data from reports. Continue?'))) return;
        } else {
            if (!confirm(t('admin.slots.delete_confirm', 'Delete this slot?'))) return;
        }
        try {
            await api.delete(`/slots/${slotId}`);
            setSlots(prev => prev.filter(s => s.id !== slotId));
            toast.success(t('admin.slots.deleted', 'Slot deleted'));
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.slots.delete_failed', 'Failed to delete slot'));
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
        setModalStep(1);
        setSelectedModalResource(null);
        setSlotDate(filterDate || format(new Date(), 'yyyy-MM-dd'));
        setSlotTime('');
        setSlotEndTime('');
        setSlotCapacity(1);
        setResourceSearch('');
        setWasCapacityManuallySet(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSlotId(null);
    };

    // ═══════════════════════════════════════════
    // SMART HELPERS (Rounding & End Time)
    // ═══════════════════════════════════════════
    const updateEndTimeSuggestion = (newStartTime) => {
        if (!newStartTime) return;
        try {
            const [h, m] = newStartTime.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);

            // Use 30 min as default if no service selected, or pick the first assigned service's time
            const duration = 30;
            const end = new Date(date.getTime() + duration * 60 * 1000);
            setSlotEndTime(format(end, 'HH:mm'));
        } catch (e) {
            console.error("End time calc failed", e);
        }
    };

    const roundToNearest5 = (timeStr) => {
        if (!timeStr) return '';
        try {
            const [h, m] = timeStr.split(':').map(Number);
            const date = new Date();
            date.setHours(h, m, 0, 0);
            const coeff = 1000 * 60 * 5; // 5 mins
            const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
            return format(rounded, 'HH:mm');
        } catch (e) {
            return timeStr;
        }
    };

    const getAiSuggestedCapacity = () => {
        if (!slotTime || !slotEndTime || !resourcePerformance?.avg_service_time) return 1;

        try {
            const start = new Date(`2000-01-01T${slotTime}`);
            const end = new Date(`2000-01-01T${slotEndTime}`);
            let diffMins = (end - start) / 60000;
            if (diffMins < 0) diffMins += 24 * 60; // Handle overnight slots

            const capacity = Math.floor(diffMins / resourcePerformance.avg_service_time);
            return capacity > 0 ? capacity : 1;
        } catch (e) {
            return 1;
        }
    };

    // ═══════════════════════════════════════════
    // BULK COPY LOGIC
    // ═══════════════════════════════════════════
    const handleCopyModeChange = (mode) => {
        setCopyMode(mode);
        const source = new Date(copySourceDate);
        let targets = [];

        if (mode === 'next_7_days') {
            for (let i = 1; i <= 7; i++) {
                targets.push(format(addDays(source, i), 'yyyy-MM-dd'));
            }
        } else if (mode === 'next_4_weeks') {
            // Same day of the week for next 4 weeks
            for (let i = 1; i <= 4; i++) {
                targets.push(format(addWeeks(source, i), 'yyyy-MM-dd'));
            }
        }
        setCopyTargetDates(targets);
    };

    const handleBulkCopy = async () => {
        if (copyTargetDates.length === 0) {
            toast.error(t('admin.slots.select_target_dates', 'Please select target dates'));
            return;
        }

        setCopying(true);
        try {
            const payload = {
                sourceDate: copySourceDate,
                targetDates: copyTargetDates,
                resourceId: copyResourceId || null,
                overwrite: copyOverwrite
            };

            await api.post('/slots/bulk-copy', payload);
            toast.success(t('admin.slots.bulk_success', 'Slots copied successfully'));
            setIsCopyModalOpen(false);
            fetchSlots();
        } catch (error) {
            toast.error(error.response?.data?.message || t('admin.slots.bulk_failed', 'Bulk copy failed'));
        } finally {
            setCopying(false);
        }
    };

    // Filter resources for step 1
    const filteredModalResources = allResources.filter(r =>
        r.name.toLowerCase().includes(resourceSearch.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        {t('navigation.manage_slots', 'Manage Slots')}
                        <InfoTooltip text={t('admin.slots.resource_centric_hint', 'Slots are now linked to a Resource (Doctor/Staff). A single slot will be bookable across all services assigned to that resource.')} />
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{t('admin.slots.mgmt_subtitle', 'Create and manage time slots for your resources.')}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            if (!planFeatures.has_slot_copy) {
                                toast.error(t('membership.upgrade_required', 'This feature requires a plan upgrade.'));
                                return;
                            }
                            setIsCopyModalOpen(true);
                        }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all shadow-sm font-medium border ${
                            !planFeatures.has_slot_copy 
                            ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed' 
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                        title={!planFeatures.has_slot_copy ? t('membership.premium_feature', 'Premium Feature') : ''}
                    >
                        <Copy className="h-4 w-4" /> {t('admin.slots.copy_day', 'Copy Schedule')}
                    </button>
                    <button
                        onClick={openModal}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-medium"
                    >
                        <Plus className="h-4 w-4" /> {t('admin.slots.create_slot_btn', 'Create Slot')}
                    </button>
                </div>
            </div>

            {/* ═══ FILTERS ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        <Filter className="h-4 w-4" /> {t('common.filters', 'Filters')}
                    </div>
                    {(filterService || filterResource || filterDate !== format(new Date(), 'yyyy-MM-dd')) && (
                        <button
                            onClick={() => {
                                setFilterService('');
                                setFilterResource('');
                                setFilterDate(format(new Date(), 'yyyy-MM-dd'));
                                toast.success(t('common.filters_cleared', 'Filters cleared'));
                            }}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1"
                        >
                            <X className="h-3 w-3" />
                            {t('common.clear_filters', 'Clear Filters')}
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.service', 'Provider of Service')}</label>
                        <select
                            value={filterService}
                            onChange={e => setFilterService(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                        >
                            <option value="">{t('service.all_services', 'All Services')}</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.resource', 'Resource (Doctor/Staff)')}</label>
                        <select
                            value={filterResource}
                            onChange={e => setFilterResource(e.target.value)}
                            className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                        >
                            <option value="">{t('resource_mgmt.all_resources', 'All Resources')}</option>
                            {allResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('common.date', 'Date')}</label>
                        <div className="relative group">
                            <input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                            />
                            {filterDate && (
                                <button
                                    onClick={() => setFilterDate('')}
                                    className="absolute right-10 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-md"
                                    title={t('common.clear', 'Clear')}
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ SLOTS TABLE ═══ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[300px]">
                {loadingSlots ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-400 h-7 w-7" /></div>
                ) : slots.length === 0 ? (
                    <div className="text-center py-16">
                        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">{t('admin.slots.no_slots', 'No slots found')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                                    <th className="px-5 py-4 text-left">{t('common.date', 'Date')}</th>
                                    <th className="px-5 py-4 text-left">{t('common.resource', 'Resource')}</th>
                                    <th className="px-5 py-4 text-left">{t('admin.slots.linked_services', 'Linked Services')}</th>
                                    <th className="px-5 py-4 text-left">{t('admin.slots.time_range', 'Time')}</th>
                                    <th className="px-5 py-4 text-center">{t('admin.slots.availability', 'Booked/Total')}</th>
                                    <th className="px-5 py-4 text-right">{t('common.actions', 'Actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {slots.map(slot => {
                                    const start = parseISO(slot.start_time);
                                    const end = parseISO(slot.end_time);
                                    const isPast = end < new Date();

                                    return (
                                        <tr key={slot.id} className={`hover:bg-gray-50/50 transition-colors ${isPast ? 'bg-slate-50/50 grayscale-[0.3]' : ''}`}>
                                            <td className="px-5 py-4 font-medium flex items-center gap-2">
                                                {format(start, 'MMM d, yyyy')}
                                                {isPast && (
                                                    <span className="inline-flex items-center gap-1 bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-300">
                                                        {t('common.past', 'Past')}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${slot.resource_type === 'staff' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {slot.resource_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{slot.resource_name}</p>
                                                        <p className="text-[10px] text-gray-400 capitalize">{slot.resource_type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {(slot.service_names || []).map(name => (
                                                        <span key={name} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-medium border border-indigo-100">
                                                            {name}
                                                        </span>
                                                    ))}
                                                    {(!slot.service_names || slot.service_names.length === 0) && (
                                                        <span className="text-[10px] text-gray-400 italic">No assigned services</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-gray-600 font-medium">
                                                <div className="flex items-center gap-2">
                                                    {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                                                    {isPast && <AlertCircle className="h-3 w-3 text-amber-500" title="This slot time has passed" />}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                                    <span className={`font-bold ${slot.booked_count > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>{slot.booked_count}</span>
                                                    <span className="text-gray-300">/</span>
                                                    <span className="font-medium text-gray-600">{slot.max_capacity}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right space-x-2">
                                                <button onClick={() => handleEditSlot(slot)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDeleteSlot(slot.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <Trash2 className="h-4 w-4" />
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

            {/* ═══ CREATE/EDIT MODAL ═══ */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-bold text-gray-900">{editingSlotId ? 'Update Availability' : 'New Availability Slot'}</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        {/* Steps */}
                        {!editingSlotId && (
                            <div className="px-8 pt-6 flex justify-between relative">
                                <div className="absolute top-[38px] left-12 right-12 h-0.5 bg-gray-100" />
                                <div className={`absolute top-[38px] left-12 h-0.5 bg-indigo-600 transition-all duration-300 ${modalStep === 1 ? 'w-0' : 'w-[75%]'}`} />
                                {[1, 2].map(s => (
                                    <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${modalStep >= s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}>
                                            {s}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${modalStep >= s ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {s === 1 ? 'Resource' : 'Time Slot'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-8 space-y-6">
                            {modalStep === 1 && (
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Doctor/Staff..."
                                            value={resourceSearch}
                                            onChange={e => setResourceSearch(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                                        {filteredModalResources.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => { setSelectedModalResource(r); setModalStep(2); }}
                                                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedModalResource?.id === r.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${r.type === 'staff' ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {r.name.charAt(0)}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="font-bold text-gray-900 text-sm">{r.name}</p>
                                                        <p className="text-[10px] text-gray-400 capitalize">{r.type}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-gray-300" />
                                            </button>
                                        ))}
                                        {filteredModalResources.length === 0 && (
                                            <div className="text-center py-8">
                                                <Users className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400">No resources found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {modalStep === 2 && selectedModalResource && (
                                <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                                <Users className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest">Availability for</p>
                                                <p className="font-bold text-gray-900">{selectedModalResource.name}</p>
                                            </div>
                                        </div>
                                        {!editingSlotId && (
                                            <button onClick={() => setModalStep(1)} className="text-xs font-bold text-indigo-600 hover:underline">Change</button>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Date</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input type="date" value={slotDate} onChange={e => setSlotDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Start Time</label>
                                                <input
                                                    type="time"
                                                    value={slotTime}
                                                    onChange={e => {
                                                        setSlotTime(e.target.value);
                                                        updateEndTimeSuggestion(e.target.value);
                                                    }}
                                                    onBlur={e => {
                                                        const rounded = roundToNearest5(e.target.value);
                                                        if (rounded && rounded !== e.target.value) {
                                                            setSlotTime(rounded);
                                                            updateEndTimeSuggestion(rounded);
                                                            toast(t('slot.time_rounded', 'Time rounded to nearest 5 minutes'), { icon: 'ℹ️' });
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">End Time</label>
                                                <input
                                                    type="time"
                                                    value={slotEndTime}
                                                    onChange={e => setSlotEndTime(e.target.value)}
                                                    onBlur={e => {
                                                        const rounded = roundToNearest5(e.target.value);
                                                        if (rounded && rounded !== e.target.value) {
                                                            setSlotEndTime(rounded);
                                                            toast(t('slot.time_rounded', 'Time rounded to nearest 5 minutes'), { icon: 'ℹ️' });
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    Slot Capacity
                                                    <InfoTooltip text="Maximum number of simultaneous bookings for this time slot." />
                                                </label>

                                                {/* AI Suggestion Badge */}
                                                {!performanceLoading && resourcePerformance?.avg_service_time && slotTime && slotEndTime && (
                                                    <div
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-right-2"
                                                        title={resourcePerformance.isHistorical ? "Based on historical average speed" : "Based on service time estimates"}
                                                    >
                                                        <Sparkles className="h-3 w-3 fill-indigo-500 text-indigo-500" />
                                                        <span className="text-[10px] font-black tracking-tight">{resourcePerformance.isHistorical ? 'Historical' : 'Estimated'} Suggestions: {getAiSuggestedCapacity()}</span>
                                                    </div>
                                                )}
                                                {performanceLoading && (
                                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-400 rounded-lg animate-pulse">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        <span className="text-[10px] font-bold">Smart Calc...</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={slotCapacity}
                                                    onChange={e => {
                                                        setSlotCapacity(parseInt(e.target.value) || 1);
                                                        setWasCapacityManuallySet(true);
                                                    }}
                                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium pr-10"
                                                />
                                                {slotCapacity === getAiSuggestedCapacity() && !wasCapacityManuallySet && resourcePerformance?.avg_service_time && (
                                                    <Sparkles className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400 pointer-events-none" />
                                                )}
                                            </div>

                                            {resourcePerformance?.avg_service_time && (
                                                <p className="text-[9px] text-gray-400 mt-1.5 flex items-center gap-1">
                                                    <Info className="h-2.5 w-2.5" />
                                                    {resourcePerformance.isHistorical ? 'Recorded' : 'Expected'} speed: <span className="font-bold text-gray-500">{resourcePerformance.avg_service_time} mins</span> / patient
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveSlot}
                                        disabled={submitting}
                                        className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100 disabled:opacity-50"
                                    >
                                        {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                        {editingSlotId ? 'Update Schedule' : 'Create Availability'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ BULK COPY MODAL ═══ */}
            {isCopyModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="font-bold text-gray-900">{t('admin.slots.copy_schedule', 'Copy Schedule')}</h2>
                            <button onClick={() => setIsCopyModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.slots.source_date', 'Source Date')}</label>
                                    <input
                                        type="date"
                                        value={copySourceDate}
                                        onChange={e => setCopySourceDate(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{t('admin.slots.copy_for', 'Copy For')}</label>
                                    <select
                                        value={copyResourceId}
                                        onChange={e => setCopyResourceId(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-medium"
                                    >
                                        <option value="">{t('resource_mgmt.all_resources', 'All Resources')}</option>
                                        {allResources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('admin.slots.target_date_mode', 'Select Target Dates')}</label>
                                <div className="grid grid-cols-3 gap-2 mb-4">
                                    <button
                                        onClick={() => handleCopyModeChange('next_7_days')}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${copyMode === 'next_7_days' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-indigo-200'}`}
                                    >
                                        Next 7 Days
                                    </button>
                                    <button
                                        onClick={() => handleCopyModeChange('next_4_weeks')}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${copyMode === 'next_4_weeks' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-indigo-200'}`}
                                    >
                                        Weekly (4w)
                                    </button>
                                    <button
                                        onClick={() => setCopyMode('manual')}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${copyMode === 'manual' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-indigo-200'}`}
                                    >
                                        Manual
                                    </button>
                                </div>

                                {copyMode === 'manual' ? (
                                    <div className="space-y-2">
                                        <label className="block text-[10px] text-gray-400 font-bold uppercase">Add Specific Date</label>
                                        <input
                                            type="date"
                                            onChange={e => {
                                                if (e.target.value && !copyTargetDates.includes(e.target.value)) {
                                                    setCopyTargetDates([...copyTargetDates, e.target.value]);
                                                }
                                                e.target.value = '';
                                            }}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                        />
                                    </div>
                                ) : null}

                                <div className="mt-4 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 font-mono text-[11px]">
                                    {copyTargetDates.map(date => (
                                        <span key={date} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                            {format(parseISO(date), 'EEE, MMM d')}
                                            <button onClick={() => setCopyTargetDates(copyTargetDates.filter(d => d !== date))} className="hover:text-red-500"><X className="h-3 w-3" /></button>
                                        </span>
                                    ))}
                                    {copyTargetDates.length === 0 && (
                                        <span className="text-gray-300 italic text-sm">No target dates selected</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                                <div className="flex-1">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={copyOverwrite}
                                            onChange={e => setCopyOverwrite(e.target.checked)}
                                            className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                        />
                                        <span className="text-xs font-bold text-amber-900">{t('admin.slots.overwrite_existing', 'Overwrite existing slots')}</span>
                                    </label>
                                    <p className="text-[10px] text-amber-700 mt-0.5">If checked, target dates will be cleared before copying.</p>
                                </div>
                            </div>

                            <button
                                onClick={handleBulkCopy}
                                disabled={copying || copyTargetDates.length === 0}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-100 disabled:opacity-50"
                            >
                                {copying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Copy className="h-5 w-5" />}
                                {t('admin.slots.confirm_copy', 'Copy Schedule Now')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon for card view
const ChevronRight = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
);

export default SlotManagement;
