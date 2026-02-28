import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';

const ManageSlots = () => {
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({
        startTime: '',
        endTime: '',
        maxCapacity: 5
    });

    const fetchSlots = async () => {
        try {
            const res = await api.get('/admin/slots');
            setSlots(res.data);
        } catch (err) {
            toast.error('Failed to load slots');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlots();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/slots', {
                start_time: new Date(newSlot.startTime).toISOString(),
                end_time: new Date(newSlot.endTime).toISOString(),
                max_capacity: parseInt(newSlot.maxCapacity)
            });
            toast.success('Slot created');
            setNewSlot({ startTime: '', endTime: '', maxCapacity: 5 });
            fetchSlots();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create slot');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this slot?')) return;
        try {
            await api.delete(`/admin/slots/${id}`);
            toast.success('Slot deleted');
            fetchSlots();
        } catch (err) {
            toast.error('Failed to delete slot');
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Manage Slots</h2>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8">
                <h3 className="text-lg font-semibold mb-4">Create New Slot</h3>
                <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full border-gray-300 rounded-lg"
                            value={newSlot.startTime}
                            onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <input
                            type="datetime-local"
                            required
                            className="w-full border-gray-300 rounded-lg"
                            value={newSlot.endTime}
                            onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                            type="number"
                            min="1"
                            required
                            className="w-full border-gray-300 rounded-lg"
                            value={newSlot.maxCapacity}
                            onChange={e => setNewSlot({ ...newSlot, maxCapacity: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 flex items-center justify-center">
                        <Plus className="h-5 w-5 mr-1" /> Create
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booked</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {slots.map(slot => (
                            <tr key={slot.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {format(new Date(slot.start_time), 'PPp')} - {format(new Date(slot.end_time), 'p')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {slot.max_capacity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {slot.booked_count}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDelete(slot.id)} className="text-red-600 hover:text-red-900">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {slots.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No slots created.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageSlots;
