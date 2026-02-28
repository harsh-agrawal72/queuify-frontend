import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
    Plus,
    Trash2,
    Calendar,
    Clock,
    Users,
    Loader2,
    Edit2,
    X,
    Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const SlotManager = () => {
    const [slots, setSlots] = useState([]);
    const [resources, setResources] = useState([]);
    const [selectedResource, setSelectedResource] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentSlotId, setCurrentSlotId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        start_time: '',
        end_time: '',
        max_capacity: 1,
        resource_id: ''
    });

    // Fetch Resources
    const fetchResources = async () => {
        try {
            const res = await api.get('/resources');
            setResources(res.data);
            if (res.data.length > 0 && !selectedResource) {
                setSelectedResource(res.data[0].id); // Default to first resource
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load resources");
        }
    };

    // Fetch Slots (filtered by resource)
    const fetchSlots = async () => {
        if (!selectedResource) return;
        setLoading(true);
        try {
            // Updated API call to support resource filtering if backend supports it
            // Backend `admin.service.js` was updated to accept `resourceId`
            const res = await api.get(`/slots?resource_id=${selectedResource}`);
            setSlots(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load slots");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        if (selectedResource) {
            fetchSlots();
        }
    }, [selectedResource]);

    const handleCreateSlot = () => {
        setIsEditMode(false);
        setFormData({
            start_time: '',
            end_time: '',
            max_capacity: 1,
            resource_id: selectedResource
        });
        setIsModalOpen(true);
    };

    const handleEditSlot = (slot) => {
        setIsEditMode(true);
        setCurrentSlotId(slot.id);
        setFormData({
            start_time: format(parseISO(slot.start_time), "yyyy-MM-dd'T'HH:mm"),
            end_time: format(parseISO(slot.end_time), "yyyy-MM-dd'T'HH:mm"),
            max_capacity: slot.max_capacity,
            resource_id: slot.resource_id || selectedResource
        });
        setIsModalOpen(true);
    };

    const handleDeleteSlot = async (id) => {
        if (!confirm("Are you sure you want to delete this slot?")) return;
        try {
            await api.delete(`/slots/${id}`);
            toast.success("Slot deleted");
            setSlots(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete slot");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString(),
                resource_id: selectedResource
            };

            if (isEditMode) {
                await api.patch(`/slots/${currentSlotId}`, payload);
                toast.success("Slot updated successfully");
            } else {
                await api.post('/slots', payload);
                toast.success("Slot created successfully");
            }
            setIsModalOpen(false);
            fetchSlots();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Slot Management</h1>
                    <p className="text-sm text-gray-500">Manage availability for your resources.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Resource Selector */}
                    <div className="relative flex-1 md:w-64">
                        <select
                            value={selectedResource}
                            onChange={(e) => setSelectedResource(e.target.value)}
                            className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                        >
                            {resources.map(res => (
                                <option key={res.id} value={res.id}>{res.name} ({res.type})</option>
                            ))}
                            {resources.length === 0 && <option value="">No resources found</option>}
                        </select>
                        <Filter className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <button
                        onClick={handleCreateSlot}
                        disabled={!selectedResource}
                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        <Plus className="h-4 w-4" /> Add Slot
                    </button>
                </div>
            </div>

            {/* Slots Grid */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>
            ) : slots.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">No slots found for this resource.</p>
                    <p className="text-sm text-gray-400">Create a new slot to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slots.map(slot => (
                        <div key={slot.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditSlot(slot)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors" title="Edit Slot">
                                    <Edit2 className="h-4 w-4" />
                                </button>
                                <button onClick={() => handleDeleteSlot(slot.id)} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="Delete Slot">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {format(parseISO(slot.start_time), 'MMM d, yyyy')}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {format(parseISO(slot.start_time), 'h:mm a')} - {format(parseISO(slot.end_time), 'h:mm a')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>Capacity: {slot.max_capacity}</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-md font-medium ${slot.booked_count >= slot.max_capacity
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-green-50 text-green-600'
                                    }`}>
                                    {slot.booked_count} Booked
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h2 className="font-semibold text-gray-900">{isEditMode ? 'Edit Slot' : 'New Slot'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        step="300"
                                        value={formData.start_time}
                                        onChange={e => {
                                            setFormData({ ...formData, start_time: e.target.value });
                                        }}
                                        onBlur={e => {
                                            // Enforce 5-minute rounding on blur
                                            if (!e.target.value) return;
                                            const date = new Date(e.target.value);
                                            const coeff = 1000 * 60 * 5;
                                            const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
                                            // Format back to datetime-local string: YYYY-MM-DDTHH:mm
                                            const formatted = rounded.toISOString().slice(0, 16);
                                            if (formatted !== e.target.value) {
                                                setFormData({ ...formData, start_time: formatted });
                                                toast("Time rounded to nearest 5 minutes", { icon: 'ℹ️' });
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Select a time (5 min intervals)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        step="300"
                                        value={formData.end_time}
                                        onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                                        onBlur={e => {
                                            if (!e.target.value) return;
                                            const date = new Date(e.target.value);
                                            const coeff = 1000 * 60 * 5;
                                            const rounded = new Date(Math.round(date.getTime() / coeff) * coeff);
                                            const formatted = rounded.toISOString().slice(0, 16);
                                            if (formatted !== e.target.value) {
                                                setFormData({ ...formData, end_time: formatted });
                                                toast("Time rounded to nearest 5 minutes", { icon: 'ℹ️' });
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Select a time (5 min intervals)</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Max Capacity</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={formData.max_capacity}
                                    onChange={e => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">Maximum number of appointments allowed for this slot.</p>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                                >
                                    {isEditMode ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {isEditMode ? 'Update Slot' : 'Create Slot'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlotManager;
