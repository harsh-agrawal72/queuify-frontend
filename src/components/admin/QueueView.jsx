import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Megaphone, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const QueueView = () => {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchQueue = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/today-queue');
            setQueue(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQueue();
        const interval = setInterval(fetchQueue, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, []);

    const callToken = async (id) => {
        try {
            // Ideally we'd have a specific endpoint for 'calling', but updating status works too
            // or maybe a socket event. For now, let's just toast.
            toast.success(`Calling Token...`);
            // await api.post(`/admin/queue/call/${id}`);
        } catch (error) {
            toast.error("Failed to call");
        }
    };

    const currentToken = queue.find(q => q.status === 'booked') || null;
    const upcoming = queue.filter(q => q.status === 'booked' && q.id !== currentToken?.id);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Live Queue</h1>
                <button
                    onClick={fetchQueue}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary-600 px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} /> Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Current Token Display */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-lg border border-primary-100 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                        <h2 className="text-xl text-gray-500 uppercase tracking-widest font-semibold mb-4">Now Serving</h2>

                        {currentToken ? (
                            <div className="py-10">
                                <div className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter mb-4">
                                    {currentToken.token_number}
                                </div>
                                <p className="text-2xl text-gray-600">{currentToken.user_name}</p>
                                <button
                                    onClick={() => callToken(currentToken.id)}
                                    className="mt-8 flex items-center justify-center gap-3 mx-auto bg-primary-600 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-xl shadow-primary-500/30 hover:scale-105 transition-transform"
                                >
                                    <Megaphone className="h-6 w-6" /> Call Again
                                </button>
                            </div>
                        ) : (
                            <div className="py-20 text-gray-400">
                                <p className="text-xl">No active tokens</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upcoming List */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-4 bg-gray-50 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900">Up Next</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {upcoming.length > 0 ? upcoming.map((q, i) => (
                            <div key={q.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="text-gray-500 font-mono text-sm">#{i + 1}</span>
                                <span className="font-bold text-gray-900 text-lg">{q.token_number}</span>
                                <span className="text-sm text-gray-600 truncate max-w-[100px]">{q.user_name}</span>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-gray-400">Queue is empty</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueView;
