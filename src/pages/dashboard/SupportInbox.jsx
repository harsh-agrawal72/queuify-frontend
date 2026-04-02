import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Send, Check, CheckCircle2 } from 'lucide-react';
import { io } from 'socket.io-client';

export default function SupportInbox() {
    const { t } = useTranslation();
    const { user } = useAuth(); // admin user
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            // Join org room for notifications
            newSocket.emit('join_org', user.org_id);
        });

        newSocket.on('chat_notification', () => {
            fetchConversations();
        });

        return () => newSocket.close();
    }, [user]);

    useEffect(() => {
        if (!socket || !activeChat) return;

        const handleNewMessage = (msg) => {
            if (msg.conversation_id === activeChat.id) {
                setMessages(prev => [...prev, msg]);
                scrollToBottom();
                
                // Mark as read if user sent it
                if (msg.sender_type === 'user') {
                    api.patch(`/chat/${activeChat.id}/read`, { readerType: 'admin' })
                       .then(() => fetchConversations())
                       .catch(console.error);
                }
            } else {
                fetchConversations();
            }
        };

        socket.on('new_message', handleNewMessage);
        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, activeChat]);

    const fetchConversations = async () => {
        try {
            const res = await api.get('/chat/admin');
            setConversations(res.data);
        } catch (error) {
            console.error('Failed to fetch org conversations', error);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSelectChat = async (conv) => {
        if (activeChat) {
            socket?.emit('leave_chat', activeChat.id);
        }

        setActiveChat(conv);
        setMessages([]);
        try {
            socket?.emit('join_chat', conv.id);
            await api.patch(`/chat/${conv.id}/read`, { readerType: 'admin' });
            
            const res = await api.get(`/chat/${conv.id}/messages`);
            setMessages(res.data);
            scrollToBottom();
            
            // Refresh list to clear unread counts matching this conv
            fetchConversations();
        } catch (error) {
            console.error('Failed to fetch messages', error);
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
                sender_type: 'admin',
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, tempMsg]);
            scrollToBottom();

            const res = await api.post(`/chat/${activeChat.id}/messages`, {
                content,
                senderType: 'admin'
            });
            
            // Replace optimistic with real
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? res.data : m));
            fetchConversations(); // Update Last Message
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const filteredConversations = conversations.filter(c => 
        c.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user_email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-100px)] bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Left Sidebar - Chat List */}
            <div className="w-80 md:w-96 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-100 bg-white">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                        <MessageCircle className="h-6 w-6 text-indigo-600" />
                        {t('navigation.support_inbox', 'Support Inbox')}
                    </h2>
                    <div className="relative">
                        <input
                            type="text"
                            placeholder={t('common.search_users', 'Search users...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 bg-gray-50 transition"
                        />
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {filteredConversations.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm mt-10">
                            {t('common.no_conversations', 'No conversations found.')}
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const unread = Number(conv.unread_count) > 0;
                            const isActive = activeChat?.id === conv.id;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectChat(conv)}
                                    className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 border ${
                                        isActive 
                                            ? 'bg-indigo-50 border-indigo-100 ring-1 ring-indigo-500/20' 
                                            : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                                    }`}
                                >
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                                            {conv.user_name?.[0]?.toUpperCase()}
                                        </div>
                                        {unread && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={`font-bold text-sm truncate ${unread ? 'text-gray-900' : 'text-gray-700'}`}>
                                                {conv.user_name}
                                            </h4>
                                            <span className="text-[10px] text-gray-400 font-medium tracking-wide">
                                                {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                            </span>
                                        </div>
                                        <p className={`text-xs truncate ${unread ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                            {conv.last_message || t('common.no_messages', 'No messages yet')}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right Side - Chat Panel */}
            <div className="flex-1 flex flex-col bg-white">
                {activeChat ? (
                    <>
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                                    {activeChat.user_name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{activeChat.user_name}</h3>
                                    <p className="text-xs text-gray-500">{activeChat.user_email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {messages.map((msg, i) => {
                                const isMe = msg.sender_type === 'admin';
                                return (
                                    <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] lg:max-w-[60%] rounded-2xl px-5 py-3 text-[15px] shadow-sm ${
                                            isMe 
                                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                        }`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                <span className="text-[11px] font-medium">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {isMe && (
                                                    msg.is_read ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" /> : <Check className="h-3.5 w-3.5 opacity-70" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100">
                            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                <textarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('common.type_reply_placeholder', 'Type your reply...')}
                                    className="flex-1 bg-transparent border-none px-3 py-2 text-sm focus:outline-none resize-none max-h-32 min-h-[44px]"
                                    rows="1"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex-shrink-0 shadow-md shadow-indigo-200 mb-0.5"
                                >
                                    <Send className="h-5 w-5 ml-0.5" />
                                </button>
                            </form>
                            <p className="text-center text-[11px] text-gray-400 mt-2">{t('common.chat_hint', 'Press Enter to send, Shift + Enter for new line')}</p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
                            <MessageCircle className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{t('common.select_conversation_title', 'Select a Conversation')}</h3>
                        <p className="text-gray-500 max-w-sm">{t('common.select_conversation_desc', 'Choose a user from the left panel to start messaging or reply to their queries in real-time.')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
