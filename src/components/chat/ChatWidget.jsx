import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, X, Send, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize Socket
    useEffect(() => {
        if (!user) return;
        
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            // Join user room for direct notifications
            newSocket.emit('join_user', user.id);
        });

        newSocket.on('chat_notification', (message) => {
            // New message notification when not in active chat view
            fetchConversations();
        });

        return () => newSocket.close();
    }, [user]);

    // Handle Active Chat Socket Events
    useEffect(() => {
        if (!socket || !activeChat) return;

        const handleNewMessage = (msg) => {
            if (msg.conversation_id === activeChat.id) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                
                // If it's from admin, mark as read
                if (msg.sender_type === 'admin') {
                    api.patch(`/chat/${activeChat.id}/read`, { readerType: 'user' })
                       .catch(console.error);
                }
            }
        };

        socket.on('new_message', handleNewMessage);
        
        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, activeChat]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const fetchConversations = async () => {
        if (!user) return;
        try {
            const res = await api.get('/chat/user');
            setConversations(res.data);
        } catch (error) {
            console.error('Failed to fetch conversations', error);
        }
    };

    useEffect(() => {
        if (isOpen && !activeChat) {
            fetchConversations();
        }
    }, [isOpen, activeChat]);

    // Handle global open-chat events
    useEffect(() => {
        const handleGlobalOpen = async (event) => {
            setIsOpen(true);
            const orgId = event.detail?.orgId;
            if (orgId) {
                try {
                    // Initiate or get existing conversation
                    const res = await api.post('/chat/initiate', { orgId });
                    const conv = res.data;
                    
                    // The backend might return a plain conversation object
                    // We need to fetch the full list to get org_name etc but we can just open it
                    // Wait, if we initiate, we get the conversation. Let's fetch conversations to ensure it's in the list
                    await fetchConversations();
                    
                    // We need to construct the full conversation object with org_name from the event detail if missing, 
                    // but fetchConversations will populate it, then we can find it.
                    // For simplicity, handleOpenChat needs org_name, so let's just use the result if possible.
                    // Actually, fetchConversations is async, we can await it, then find the conv by id.
                    const updatedConversations = await api.get('/chat/user');
                    setConversations(updatedConversations.data);
                    const fullConv = updatedConversations.data.find(c => c.id === conv.id);
                    if (fullConv) {
                        handleOpenChat(fullConv);
                    }
                } catch (error) {
                    console.error('Failed to initiate chat via event', error);
                }
            }
        };

        window.addEventListener('openChat', handleGlobalOpen);
        return () => window.removeEventListener('openChat', handleGlobalOpen);
    }, [socket]);

    const handleOpenChat = async (conv) => {
        setActiveChat(conv);
        setMessages([]);
        try {
            // Join chat room
            socket?.emit('join_chat', conv.id);
            
            // Mark read
            await api.patch(`/chat/${conv.id}/read`, { readerType: 'user' });
            
            // Fetch messages
            const res = await api.get(`/chat/${conv.id}/messages`);
            setMessages(res.data);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    const handleCloseChat = () => {
        if (activeChat) {
            socket?.emit('leave_chat', activeChat.id);
            setActiveChat(null);
            fetchConversations();
        } else {
            setIsOpen(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || !activeChat) return;
        
        const content = input;
        setInput('');

        try {
            // Optimistic update
            const tempMsg = {
                id: Date.now(),
                content,
                sender_type: 'user',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);
            scrollToBottom();

            // Actual send (this will also trigger the server to emit 'new_message' to everyone in room,
            // but we might want to deduplicate or just let the server response handle it.
            // For simplicity, we just post it. The socket will broadcast, but we already added optimistic.
            // Wait, if socket broadcasts, we might see it twice. We will rely on REST response here or socket.
            const res = await api.post(`/chat/${activeChat.id}/messages`, {
                content,
                senderType: 'user'
            });
            
            // Replace optimistic with real
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
            
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    // Calculate total unread
    const totalUnread = conversations.reduce((acc, c) => acc + Number(c.unread_count), 0);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 sm:w-96 overflow-hidden flex flex-col mb-4 origin-bottom-right"
                        style={{ height: '500px', maxHeight: 'calc(100vh - 120px)' }}
                    >
                        {/* Header */}
                        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shadow-md z-10">
                            {activeChat ? (
                                <div className="flex items-center gap-3">
                                    <button onClick={handleCloseChat} className="p-1 hover:bg-white/20 rounded-full transition">
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                            {activeChat.org_avatar ? <img src={activeChat.org_avatar} alt="Logo" className="w-full h-full object-cover" /> : activeChat.org_name[0]}
                                        </div>
                                        <h3 className="font-semibold text-sm truncate max-w-[180px]">{activeChat.org_name}</h3>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <MessageCircle className="h-5 w-5" />
                                    <h3 className="font-semibold text-base">Conversations</h3>
                                </div>
                            )}
                            <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-full transition">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
                            {activeChat ? (
                                /* Active Chat View */
                                <>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {messages.length === 0 && (
                                            <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi!</div>
                                        )}
                                        {messages.map((msg, i) => {
                                            const isMe = msg.sender_type === 'user';
                                            return (
                                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                                                        isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
                                                    }`}>
                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        <span className={`text-[10px] mt-1 block ${isMe ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    <div className="p-3 bg-white border-t border-gray-100">
                                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Type a message..."
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={!input.trim()}
                                                className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                            >
                                                <Send className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                /* Conversations List View */
                                <div className="flex-1 overflow-y-auto p-2">
                                    {conversations.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm mt-20 px-8">
                                            <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                            <p>You have no active conversations.</p>
                                            <p className="text-xs mt-2 text-gray-400">Click "Chat" on any appointment to start messaging.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {conversations.map(conv => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => handleOpenChat(conv)}
                                                    className="w-full text-left p-3 hover:bg-white rounded-xl transition flex items-center gap-3 border border-transparent hover:border-gray-100 hover:shadow-sm"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold overflow-hidden">
                                                        {conv.org_avatar ? <img src={conv.org_avatar} alt="Logo" className="w-full h-full object-cover" /> : conv.org_name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <h4 className="font-semibold text-gray-900 text-sm truncate pr-2">{conv.org_name}</h4>
                                                            <span className="text-[10px] text-gray-400 flex-shrink-0">
                                                                {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className={`text-xs truncate ${Number(conv.unread_count) > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                                {conv.last_message || 'Draft'}
                                                            </p>
                                                            {Number(conv.unread_count) > 0 && (
                                                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2">
                                                                    {conv.unread_count}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition relative"
            >
                {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                {!isOpen && totalUnread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                        {totalUnread}
                    </span>
                )}
            </motion.button>
        </div>
    );
};

export default ChatWidget;
