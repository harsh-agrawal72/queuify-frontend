import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Send, Check, CheckCheck, CheckCircle2, Smile, CornerUpLeft, X, Paperclip, FileText, Download, Clock, Maximize2, ChevronDown, Copy, Star, Info, Trash2, MoreVertical, Ban, Flag } from 'lucide-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import EmojiPicker from 'emoji-picker-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SupportInbox() {
    const { t } = useTranslation();
    const { user } = useAuth(); // admin user
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [partnerPresence, setPartnerPresence] = useState({ online: false, lastSeen: null });
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    
    // WhatsApp features states
    const [activeReactionMenuMessageId, setActiveReactionMenuMessageId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [activeLightboxImage, setActiveLightboxImage] = useState(null);
    const fileInputRef = useRef(null);
    const disappearingMenuRef = useRef(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

    // Starred messages & Contact options states
    const [showStarredDrawer, setShowStarredDrawer] = useState(false);
    const [starredMessages, setStarredMessages] = useState([]);
    const [showMoreMenu, setShowMoreMenu] = useState(false);
    const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
    const [showReportConfirmModal, setShowReportConfirmModal] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [loadingStarred, setLoadingStarred] = useState(false);
    const moreMenuRef = useRef(null);

    const fetchStarredMessages = async (convId) => {
        if (!convId) return;
        setLoadingStarred(true);
        try {
            const res = await api.get(`/chat/${convId}/starred`);
            setStarredMessages(res.data);
        } catch (error) {
            console.error('Failed to fetch starred messages:', error);
        } finally {
            setLoadingStarred(false);
        }
    };

    const handleToggleConversationFlag = async (flagType) => {
        if (!activeChat) return;
        try {
            const res = await api.post(`/chat/${activeChat.id}/flag`, {
                flagType,
                senderType: 'admin'
            });
            const column = `is_${flagType}_by_admin`;
            const newValue = res.data[column];
            setActiveChat(prev => ({
                ...prev,
                [column]: newValue
            }));

            if (flagType === 'deleted' && newValue === true) {
                setActiveChat(null);
                toast.success(t('common.chat_deleted', 'Chat deleted successfully'));
            } else if (flagType === 'blocked') {
                toast.success(newValue ? t('common.contact_blocked', 'Contact blocked') : t('common.contact_unblocked', 'Contact unblocked'));
            } else if (flagType === 'reported') {
                toast.success(newValue ? t('common.contact_reported', 'Contact reported') : t('common.report_cancelled', 'Report status updated'));
            } else if (flagType === 'starred') {
                toast.success(newValue ? t('common.contact_starred', 'Contact added to favorites') : t('common.contact_unstarred', 'Contact removed from favorites'));
            }
            fetchConversations();
        } catch (error) {
            console.error(`Failed to toggle conversation flag ${flagType}:`, error);
            toast.error(t('common.error_updating_flag', 'Failed to update flag settings'));
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketUrl = rawUrl.replace(/\/v1\/?$/, '');
        const newSocket = io(socketUrl);
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

    // Handle Click Away for Emoji Picker
    useEffect(() => {
        const handleClickAway = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickAway);
        }
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, [showEmojiPicker]);

    // Handle Click Away for Disappearing Dropdown
    useEffect(() => {
        const handleClickAway = (event) => {
            if (disappearingMenuRef.current && !disappearingMenuRef.current.contains(event.target)) {
                setShowDisappearingModal(false);
            }
        };
        if (showDisappearingModal) {
            document.addEventListener('mousedown', handleClickAway);
        }
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, [showDisappearingModal]);

    // Handle Click Away for Message Menu Dropdown
    useEffect(() => {
        const handleClickAway = () => {
            setActiveMessageMenuId(null);
        };
        window.addEventListener('click', handleClickAway);
        return () => window.removeEventListener('click', handleClickAway);
    }, []);

    // Handle Click Away for Header More Dropdown
    useEffect(() => {
        const handleClickAway = (event) => {
            if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
                setShowMoreMenu(false);
            }
        };
        if (showMoreMenu) {
            document.addEventListener('mousedown', handleClickAway);
        }
        return () => document.removeEventListener('mousedown', handleClickAway);
    }, [showMoreMenu]);

    const onEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji);
    };

    useEffect(() => {
        if (!socket || !activeChat) return;

        const handleNewMessage = (msg) => {
            if (msg.conversation_id === activeChat.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
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

        const handleMessagesRead = (data) => {
            if (data.conversationId === activeChat.id && data.readerType === 'user') {
                setMessages(prev => prev.map(m => {
                    if (m.sender_type === 'admin' && !m.is_read) {
                        return { ...m, is_read: true, read_at: data.readAt };
                    }
                    return m;
                }));
            }
        };

        const handlePresenceChange = (data) => {
            if (data.id === activeChat.user_id) {
                setPartnerPresence({
                    online: data.status === 'online',
                    lastSeen: data.status === 'online' ? null : data.lastSeen
                });
            }
        };

        const handleTypingUpdate = (data) => {
            if (data.conversationId === activeChat.id && data.senderType === 'user') {
                setIsPartnerTyping(data.isTyping);
            }
        };

        const handleReactionUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        };

        const handleDisappearingUpdate = (data) => {
            if (data.conversationId === activeChat.id) {
                setActiveChat(prev => ({ ...prev, disappearing_duration: data.disappearing_duration }));
                setMessages(prev => [...prev, data.systemMessage]);
                scrollToBottom();
            }
            fetchConversations();
        };

        const handleStarUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_starred: data.is_starred } : m));
            if (showStarredDrawer && activeChat && data.conversationId === activeChat.id) {
                fetchStarredMessages(activeChat.id);
            }
        };

        const handleChatCleared = (data) => {
            if (data.conversationId === activeChat.id) {
                setMessages([]);
            }
            fetchConversations();
        };

        const handleConvFlagUpdate = (data) => {
            if (activeChat && data.conversationId === activeChat.id) {
                const column = `is_${data.flagType}_by_${data.senderType}`;
                setActiveChat(prev => ({
                    ...prev,
                    [column]: data.value
                }));
            }
        };

        const handleConvListFlagUpdate = (data) => {
            fetchConversations();
            if (data.flagType === 'deleted' && data.senderType === 'admin' && activeChat && data.conversationId === activeChat.id && data.value === true) {
                setActiveChat(null);
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('presence_change', handlePresenceChange);
        socket.on('chat_typing_update', handleTypingUpdate);
        socket.on('message_reaction_update', handleReactionUpdate);
        socket.on('disappearing_update', handleDisappearingUpdate);
        socket.on('message_star_update', handleStarUpdate);
        socket.on('chat_cleared', handleChatCleared);
        socket.on('conversation_flag_update', handleConvFlagUpdate);
        socket.on('conversation_list_flag_update', handleConvListFlagUpdate);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('presence_change', handlePresenceChange);
            socket.off('chat_typing_update', handleTypingUpdate);
            socket.off('message_reaction_update', handleReactionUpdate);
            socket.off('disappearing_update', handleDisappearingUpdate);
            socket.off('message_star_update', handleStarUpdate);
            socket.off('chat_cleared', handleChatCleared);
            socket.off('conversation_flag_update', handleConvFlagUpdate);
            socket.off('conversation_list_flag_update', handleConvListFlagUpdate);
        };
    }, [socket, activeChat, showStarredDrawer]);

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
        setShowStarredDrawer(false);
        setStarredMessages([]);
        setShowMoreMenu(false);
        setPartnerPresence({ online: false, lastSeen: null });
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Fetch initial presence status
        api.get(`/chat/presence/${conv.user_id}`).then(res => {
            setPartnerPresence(res.data);
        }).catch(console.error);

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

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (!socket || !activeChat) return;

        socket.emit('chat_typing', {
            conversationId: activeChat.id,
            senderType: 'admin',
            isTyping: true
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat_typing', {
                conversationId: activeChat.id,
                senderType: 'admin',
                isTyping: false
            });
        }, 1500);
    };

    const handleReactMessage = async (messageId, emoji) => {
        setActiveReactionMenuMessageId(null);
        try {
            const res = await api.post(`/chat/messages/${messageId}/react`, { emoji });
            setMessages(prev => prev.map(m => m.id === messageId ? res.data : m));
        } catch (error) {
            console.error('Failed to react to message:', error);
        }
    };

    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content);
        toast.success(t('common.copied_to_clipboard', 'Copied to clipboard!'));
    };

    const handleToggleStar = async (messageId) => {
        try {
            const res = await api.post(`/chat/messages/${messageId}/star`);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: res.data.is_starred } : m));
            toast.success(res.data.is_starred ? t('common.message_starred', 'Message starred') : t('common.message_unstarred', 'Message unstarred'));
        } catch (error) {
            console.error('Failed to star message:', error);
            toast.error(t('common.error_starring', 'Failed to update star status'));
        }
    };

    const handleClearChat = async () => {
        setShowClearConfirmModal(false);
        try {
            await api.delete(`/chat/${activeChat.id}/clear`, {
                data: { senderType: 'admin' }
            });
            toast.success(t('common.chat_cleared_success', 'Chat history cleared.'));
        } catch (error) {
            console.error('Failed to clear chat:', error);
            toast.error(t('common.error_clearing', 'Failed to clear chat history.'));
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert(t('common.file_too_large', 'File size exceeds 5MB limit.'));
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        } else {
            setFilePreview(null);
        }
    };

    const handleSetDisappearing = async (duration) => {
        setShowDisappearingModal(false);
        try {
            const res = await api.patch(`/chat/${activeChat.id}/disappearing`, {
                duration,
                senderType: 'admin'
            });
            setActiveChat(prev => ({ ...prev, disappearing_duration: duration }));
            setMessages(prev => [...prev, res.data.systemMessage]);
            scrollToBottom();
            fetchConversations();
        } catch (error) {
            console.error('Failed to update disappearing duration:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!input.trim() && !selectedFile) || !activeChat) return;

        const content = input;
        const fileToSend = selectedFile;

        setInput('');
        setSelectedFile(null);
        setFilePreview(null);
        setShowEmojiPicker(false);
        const replyMsg = replyingTo;
        setReplyingTo(null);

        const tempId = `temp-${Date.now()}`;

        try {
            let res;
            if (fileToSend) {
                // Optimistic media message
                const tempMsg = {
                    id: tempId,
                    content: `[Media] ${fileToSend.name}`,
                    sender_type: 'admin',
                    created_at: new Date().toISOString(),
                    attachments: [{
                        id: tempId,
                        file_name: fileToSend.name,
                        mime_type: fileToSend.type
                    }]
                };
                setMessages(prev => [...prev, tempMsg]);
                scrollToBottom();

                const formData = new FormData();
                formData.append('file', fileToSend);
                formData.append('senderType', 'admin');

                res = await api.post(`/chat/${activeChat.id}/messages/attachment`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            } else {
                // Optimistic text message
                const tempMsg = {
                    id: tempId,
                    content,
                    sender_type: 'admin',
                    created_at: new Date().toISOString(),
                    reply_to_id: replyMsg ? replyMsg.id : null,
                    reply_to_content: replyMsg ? replyMsg.content : null,
                    reply_to_sender_type: replyMsg ? replyMsg.sender_type : null
                };
                setMessages(prev => [...prev, tempMsg]);
                scrollToBottom();

                res = await api.post(`/chat/${activeChat.id}/messages`, {
                    content,
                    senderType: 'admin',
                    replyToId: replyMsg ? replyMsg.id : null
                });

                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            }
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
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
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-inner">
                                            {conv.user_name?.[0]?.toUpperCase()}
                                        </div>
                                        {Number(conv.disappearing_duration) > 0 && (
                                            <span className="absolute -bottom-1 -right-1 bg-indigo-600 border border-white p-1 rounded-full shadow text-white" title="Disappearing messages active">
                                                <Clock className="w-3 h-3" />
                                            </span>
                                        )}
                                        {unread && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={`font-bold text-sm truncate ${unread ? 'text-gray-900' : 'text-gray-700'} flex items-center gap-1`}>
                                                {conv.user_name}
                                                {conv.is_starred_by_admin && (
                                                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                                                )}
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
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                                        {activeChat.user_name?.[0]?.toUpperCase()}
                                    </div>
                                    {Number(activeChat.disappearing_duration) > 0 && (
                                        <span className="absolute -bottom-1 -right-1 bg-indigo-600 border border-white p-0.5 rounded-full shadow text-white" title="Disappearing messages active">
                                            <Clock className="w-3.5 h-3.5" />
                                        </span>
                                    )}
                                    {partnerPresence.online && (
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight">{activeChat.user_name}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {isPartnerTyping ? (
                                            <span className="text-indigo-600 font-semibold animate-pulse">typing...</span>
                                        ) : partnerPresence.online ? (
                                            <span className="text-emerald-600 font-semibold">Online</span>
                                        ) : partnerPresence.lastSeen ? (
                                            <span className="text-gray-400">Last seen at {new Date(partnerPresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        ) : (
                                            <span className="text-gray-400">Offline</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                <div className="relative" ref={disappearingMenuRef}>
                                    <button
                                        onClick={() => setShowDisappearingModal(!showDisappearingModal)}
                                        className={`p-2 rounded-full hover:bg-gray-100 transition ${Number(activeChat.disappearing_duration) > 0 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}
                                        title={t('common.disappearing_messages', 'Disappearing Messages')}
                                    >
                                        <Clock className="h-5 w-5" />
                                    </button>
                                    {showDisappearingModal && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-[9999] overflow-hidden text-gray-800">
                                            <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                                                <p className="text-xs font-bold text-gray-700">Disappearing Messages</p>
                                            </div>
                                            <div className="p-1">
                                                {[
                                                    { label: t('common.off', 'Off'), value: 0 },
                                                    { label: t('common.24h', '24 Hours'), value: 86400 },
                                                    { label: t('common.7d', '7 Days'), value: 604800 },
                                                    { label: t('common.90d', '90 Days'), value: 7776000 }
                                                ].map(opt => (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleSetDisappearing(opt.value)}
                                                        className={`w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-gray-50 transition flex items-center justify-between ${
                                                            Number(activeChat.disappearing_duration) === opt.value ? 'text-indigo-600 font-bold bg-indigo-50/30' : 'text-gray-700'
                                                        }`}
                                                    >
                                                        <span>{opt.label}</span>
                                                        {Number(activeChat.disappearing_duration) === opt.value && (
                                                            <span className="w-1.5 h-1.5 bg-indigo-650 rounded-full" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="relative" ref={moreMenuRef}>
                                    <button
                                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                                        title={t('common.more_options', 'More Options')}
                                    >
                                        <MoreVertical className="h-5 w-5" />
                                    </button>
                                    {showMoreMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-60 overflow-hidden text-gray-800 py-1.5 animate-in fade-in slide-in-from-top-2">
                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    handleToggleConversationFlag('starred');
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition text-gray-700"
                                            >
                                                <Star className={`h-4 w-4 ${activeChat.is_starred_by_admin ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                                <span>{activeChat.is_starred_by_admin ? t('common.unstar_contact', 'Unstar Contact') : t('common.star_contact', 'Star Contact')}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    fetchStarredMessages(activeChat.id);
                                                    setShowStarredDrawer(!showStarredDrawer);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 flex items-center gap-2 transition ${showStarredDrawer ? 'text-indigo-650 font-medium bg-indigo-50/30' : 'text-gray-700'}`}
                                            >
                                                <Star className="h-4 w-4 text-indigo-500 fill-indigo-100" />
                                                <span>Starred Messages</span>
                                            </button>

                                            <hr className="border-gray-100 my-1" />

                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    setShowClearConfirmModal(true);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 transition text-gray-700"
                                            >
                                                <Trash2 className="h-4 w-4 text-gray-400" />
                                                <span>{t('common.clear_chat', 'Clear Chat')}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    setShowDeleteConfirmModal(true);
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-rose-50 hover:text-rose-600 flex items-center gap-2 transition text-gray-700"
                                            >
                                                <Trash2 className="h-4 w-4 text-rose-500" />
                                                <span>{t('common.delete_chat', 'Delete Chat')}</span>
                                            </button>

                                            <hr className="border-gray-100 my-1" />

                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    if (activeChat.is_blocked_by_admin) {
                                                        handleToggleConversationFlag('blocked');
                                                    } else {
                                                        setShowBlockConfirmModal(true);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-rose-50 hover:text-rose-700 flex items-center gap-2 transition text-rose-600"
                                            >
                                                <Ban className="h-4 w-4" />
                                                <span>{activeChat.is_blocked_by_admin ? t('common.unblock_contact', 'Unblock Contact') : t('common.block_contact', 'Block Contact')}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setShowMoreMenu(false);
                                                    if (activeChat.is_reported_by_admin) {
                                                        handleToggleConversationFlag('reported');
                                                    } else {
                                                        setShowReportConfirmModal(true);
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-2.5 text-xs hover:bg-amber-50 hover:text-amber-700 flex items-center gap-2 transition text-amber-600"
                                            >
                                                <Flag className="h-4 w-4" />
                                                <span>{activeChat.is_reported_by_admin ? t('common.unreport_contact', 'Cancel Report') : t('common.report_contact', 'Report Contact')}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Messages Feed and Input panel */}
                            <div className="flex-1 flex flex-col min-w-0 bg-white">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {Number(activeChat.disappearing_duration) > 0 && (
                                <div className="flex items-center justify-center w-full mb-4 px-4 select-none">
                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2.5 text-xs text-amber-800 shadow-sm">
                                        <Clock className="h-4 w-4 text-amber-600 flex-shrink-0 animate-pulse" />
                                        <span>
                                            {t('common.disappearing_banner', `Disappearing messages are on. New messages will disappear from this chat after ${activeChat.disappearing_duration === 86400 ? '24 hours' : activeChat.disappearing_duration === 604800 ? '7 days' : '90 days'}.`)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg, i) => {
                                // System message rendering
                                if (msg.content && msg.content.startsWith('$$SYSTEM$$:')) {
                                    const systemText = msg.content.replace('$$SYSTEM$$:', '');
                                    return (
                                        <div key={msg.id || i} className="flex justify-center my-2.5 w-full select-none">
                                            <div className="bg-gray-200/85 text-gray-650 text-xs font-semibold px-4.5 py-1.5 rounded-full shadow-inner select-none max-w-sm text-center">
                                                {systemText}
                                            </div>
                                        </div>
                                    );
                                }

                                const isMe = msg.sender_type === 'admin';
                                return (
                                    <div 
                                        key={msg.id || i} 
                                        id={`msg-${msg.id}`}
                                        className={`relative flex items-center w-full group transition-all duration-300 p-1 rounded-2xl ${isMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        {/* Reply Icon Indicator behind the bubble */}
                                        {!isMe && (
                                            <div className="absolute left-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
                                                <CornerUpLeft className="h-5 w-5 text-indigo-600" />
                                            </div>
                                        )}
                                        {isMe && (
                                            <div className="absolute right-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
                                                <CornerUpLeft className="h-5 w-5 text-indigo-600" />
                                            </div>
                                        )}

                                        <motion.div
                                            drag="x"
                                            dragConstraints={isMe ? { left: -80, right: 0 } : { left: 0, right: 80 }}
                                            dragElastic={0.4}
                                            dragSnapToOrigin={true}
                                            onDragEnd={(e, info) => {
                                                const threshold = 45;
                                                if (!isMe && info.offset.x > threshold) {
                                                    setReplyingTo(msg);
                                                } else if (isMe && info.offset.x < -threshold) {
                                                    setReplyingTo(msg);
                                                }
                                            }}
                                            className="relative z-10 max-w-[70%] lg:max-w-[60%]"
                                        >
                                            {/* Quoted Reply Box inside bubble */}
                                            {msg.reply_to_id && (
                                                <div 
                                                    onClick={() => {
                                                        const el = document.getElementById(`msg-${msg.reply_to_id}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            el.classList.add('bg-indigo-100/50', 'ring-2', 'ring-indigo-50');
                                                            setTimeout(() => {
                                                                el.classList.remove('bg-indigo-100/50', 'ring-2', 'ring-indigo-50');
                                                            }, 1500);
                                                        }
                                                    }}
                                                    className={`mb-1.5 p-2 rounded-lg text-xs cursor-pointer border-l-4 select-none ${
                                                        isMe 
                                                            ? 'bg-indigo-700/50 border-white text-indigo-100' 
                                                            : 'bg-gray-100 border-indigo-500 text-gray-600'
                                                    }`}
                                                >
                                                    <div className="font-bold mb-0.5">
                                                        {msg.reply_to_sender_type === 'admin' ? t('common.support', 'Support') : activeChat?.user_name || 'User'}
                                                    </div>
                                                    <p className="truncate">{msg.reply_to_content}</p>
                                                </div>
                                            )}

                                            <div className={`rounded-2xl px-5 py-3 text-[15px] shadow-sm relative group/bubble ${
                                                isMe 
                                                    ? 'bg-indigo-600 text-white rounded-br-sm' 
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                            }`}>
                                                {/* Hover Reply Button */}
                                                <button
                                                    onClick={() => setReplyingTo(msg)}
                                                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm ${
                                                        isMe ? '-left-10 text-gray-500 hover:text-indigo-600' : '-right-10 text-gray-500 hover:text-indigo-600'
                                                    }`}
                                                    title="Reply"
                                                >
                                                    <CornerUpLeft className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Hover Reaction Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveReactionMenuMessageId(activeReactionMenuMessageId === msg.id ? null : msg.id);
                                                    }}
                                                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm text-gray-500 hover:text-yellow-500 ${
                                                        isMe ? '-left-[74px]' : '-right-[74px]'
                                                    }`}
                                                    title="React"
                                                >
                                                    <Smile className="h-3.5 w-3.5" />
                                                </button>

                                                {/* Chevron Dropdown Trigger */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id);
                                                    }}
                                                    className={`absolute top-2 right-2 p-1 rounded-full shadow-sm opacity-0 group-hover/bubble:opacity-100 transition-opacity z-30 ${
                                                        isMe 
                                                            ? 'bg-indigo-700/80 hover:bg-indigo-800 text-indigo-200 hover:text-white border border-indigo-500' 
                                                            : 'bg-white/85 hover:bg-white text-gray-500 hover:text-gray-800 border border-gray-150'
                                                    }`}
                                                    title={t('common.options', 'Options')}
                                                >
                                                    <ChevronDown className="h-3 w-3" />
                                                </button>

                                                {/* Dropdown Options Menu */}
                                                {activeMessageMenuId === msg.id && (
                                                    <div 
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={`absolute top-8 ${isMe ? 'right-2' : 'left-2'} w-40 bg-white border border-gray-150 rounded-2xl shadow-xl z-40 py-1 text-gray-800 animate-in fade-in slide-in-from-top-1`}
                                                    >
                                                        <button
                                                            onClick={() => {
                                                                setReplyingTo(msg);
                                                                setActiveMessageMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition"
                                                        >
                                                            <CornerUpLeft className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>{t('common.reply', 'Reply')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleCopyMessage(msg.content);
                                                                setActiveMessageMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition"
                                                        >
                                                            <Copy className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>{t('common.copy', 'Copy Message')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleToggleStar(msg.id);
                                                                setActiveMessageMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition"
                                                        >
                                                            <Star className={`h-3.5 w-3.5 ${msg.is_starred ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                                            <span>{msg.is_starred ? t('common.unstar', 'Unstar Message') : t('common.star', 'Star Message')}</span>
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setInfoMessage(msg);
                                                                setActiveMessageMenuId(null);
                                                            }}
                                                            className="w-full text-left px-3.5 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition"
                                                        >
                                                            <Info className="h-3.5 w-3.5 text-gray-400" />
                                                            <span>{t('common.info', 'Message Info')}</span>
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Reactions Popover Menu */}
                                                {activeReactionMenuMessageId === msg.id && (
                                                    <div className={`absolute bottom-full mb-2 bg-white border border-gray-150 rounded-full px-2 py-1.5 shadow-xl flex gap-1 z-30 animate-in fade-in slide-in-from-bottom-2 ${
                                                        isMe ? 'right-0' : 'left-0'
                                                    }`}>
                                                        {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                type="button"
                                                                onClick={() => handleReactMessage(msg.id, emoji)}
                                                                className="hover:scale-130 transition-transform px-1 text-lg duration-150"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Render Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="space-y-2 mb-2 select-none">
                                                        {msg.attachments.map((att) => {
                                                            const isImg = att.mime_type?.startsWith('image/');
                                                            const attachmentUrl = `${api.defaults.baseURL}/chat/messages/attachment/${att.id}`;
                                                            if (isImg) {
                                                                return (
                                                                    <div key={att.id} className="relative group/attachment overflow-hidden rounded-lg border border-gray-150 shadow-inner">
                                                                        <img 
                                                                            src={attachmentUrl} 
                                                                            alt={att.file_name} 
                                                                            className="max-w-xs max-h-48 object-cover cursor-pointer transition hover:scale-[1.02] duration-200 animate-in fade-in"
                                                                            onClick={() => setActiveLightboxImage(attachmentUrl)}
                                                                        />
                                                                        <div className="absolute top-2 right-2 opacity-0 group-hover/attachment:opacity-100 transition-opacity">
                                                                            <a 
                                                                                href={attachmentUrl} 
                                                                                download={att.file_name} 
                                                                                target="_blank"
                                                                                rel="noreferrer"
                                                                                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition shadow"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                            >
                                                                                <Download className="h-4 w-4" />
                                                                            </a>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            } else {
                                                                return (
                                                                    <div key={att.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-150 rounded-xl max-w-xs text-gray-800">
                                                                        <FileText className="h-8 w-8 text-indigo-600 flex-shrink-0 animate-pulse" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-xs truncate">{att.file_name}</p>
                                                                            <p className="text-[10px] text-gray-400 uppercase font-medium">{att.mime_type?.split('/')[1] || 'FILE'}</p>
                                                                        </div>
                                                                        <a 
                                                                            href={attachmentUrl} 
                                                                            download={att.file_name}
                                                                            target="_blank"
                                                                            rel="noreferrer"
                                                                            className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 flex items-center justify-center transition flex-shrink-0"
                                                                        >
                                                                            <Download className="h-4 w-4" />
                                                                        </a>
                                                                    </div>
                                                                );
                                                            }
                                                        })}
                                                    </div>
                                                )}

                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                    {msg.is_starred && (
                                                        <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-0.5 flex-shrink-0" />
                                                    )}
                                                    <span className="text-[11px] font-medium">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isMe && (
                                                        msg.is_read ? (
                                                            <CheckCheck 
                                                                className="h-4 w-4 text-emerald-305" 
                                                                title={msg.read_at ? `Seen at ${new Date(msg.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Seen'} 
                                                            />
                                                        ) : (
                                                            <Check className="h-4 w-4 text-indigo-200 opacity-70" title="Sent" />
                                                        )
                                                    )}
                                                </div>

                                                {/* Emojis Reactions Badges */}
                                                {msg.reactions && msg.reactions.length > 0 && (
                                                    <div className="absolute -bottom-2.5 right-3 flex items-center bg-white border border-gray-100 rounded-full px-1.5 py-0.5 shadow-sm text-xs gap-1 select-none z-20 hover:scale-105 transition-transform duration-200 cursor-pointer text-gray-800">
                                                        <span className="flex items-center gap-0.5">
                                                            {[...new Set(msg.reactions.map(r => r.emoji))].map(emoji => (
                                                                <span key={emoji} title={msg.reactions.filter(r => r.emoji === emoji).map(r => r.user_name).join(', ')}>
                                                                    {emoji}
                                                                </span>
                                                            ))}
                                                        </span>
                                                        {msg.reactions.length > 1 && (
                                                            <span className="text-[10px] text-gray-500 font-bold ml-0.5">{msg.reactions.length}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    </div>
                                );
                            })}
                            {isPartnerTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm max-w-[70%] flex items-center gap-1.5">
                                        <span className="text-xs font-semibold mr-1">{activeChat?.user_name || 'User'} typing</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="relative p-4 bg-white border-t border-gray-100">
                            {/* Reply Preview Banner */}
                            {replyingTo && (
                                <div className="max-w-4xl mx-auto mb-3 bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3 flex justify-between items-center text-sm shadow-sm">
                                    <div className="flex-1 min-w-0 border-l-4 border-indigo-600 pl-3">
                                        <div className="font-bold text-indigo-700 text-[11px]">
                                            {t('common.replying_to', 'Replying to')} {replyingTo.sender_type === 'admin' ? t('common.support', 'Support') : activeChat?.user_name || 'User'}
                                        </div>
                                        <p className="text-gray-600 truncate text-xs mt-0.5">{replyingTo.content}</p>
                                    </div>
                                    <button 
                                        onClick={() => setReplyingTo(null)} 
                                        className="p-1.5 hover:bg-indigo-100 rounded-full text-indigo-600 transition ml-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {/* Emoji Picker Popover */}
                            {showEmojiPicker && (
                                <div className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl" ref={emojiPickerRef}>
                                    <EmojiPicker 
                                        onEmojiClick={onEmojiClick}
                                        width={320}
                                        height={380}
                                        lazyLoadEmojis={true}
                                        searchDisabled={false}
                                        skinTonesDisabled={true}
                                        previewConfig={{ showPreview: false }}
                                    />
                                </div>
                            )}
                            {/* File Upload Preview Banner */}
                            {selectedFile && (
                                <div className="max-w-4xl mx-auto mb-3 bg-gray-50 border border-gray-200 rounded-2xl p-3 flex justify-between items-center text-sm shadow-sm select-none">
                                    <div className="flex items-center gap-3">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-150 shadow-inner" />
                                        ) : (
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-650 rounded-lg flex items-center justify-center border border-indigo-100 shadow-inner">
                                                <FileText className="h-6 w-6 animate-pulse" />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-gray-800 font-semibold text-xs truncate max-w-[200px]">{selectedFile.name}</p>
                                            <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setSelectedFile(null);
                                            if (filePreview) URL.revokeObjectURL(filePreview);
                                            setFilePreview(null);
                                        }} 
                                        className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition ml-2"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            )}

                            {activeChat.is_blocked_by_admin || activeChat.is_blocked_by_user ? (
                                <div className="max-w-4xl mx-auto bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm select-none">
                                    <Ban className="h-8 w-8 text-rose-500 mb-2 animate-pulse" />
                                    <p className="text-gray-705 font-semibold text-sm">
                                        {activeChat.is_blocked_by_admin 
                                            ? t('common.you_blocked_this_contact', 'You blocked this contact. Unblock to send messages.')
                                            : t('common.blocked_by_contact', 'You have been blocked by this contact.')}
                                    </p>
                                    {activeChat.is_blocked_by_admin && (
                                        <button
                                            type="button"
                                            onClick={() => handleToggleConversationFlag('blocked')}
                                            className="mt-2.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                                        >
                                            {t('common.unblock', 'Unblock')}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-end gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2.5 rounded-xl transition flex-shrink-0 mb-0.5 text-gray-400 hover:bg-gray-150"
                                            title="Attach File"
                                        >
                                            <Paperclip className="h-5 w-5" />
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            className="hidden"
                                            accept="image/*,application/pdf"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className={`p-2.5 rounded-xl transition flex-shrink-0 mb-0.5 ${showEmojiPicker ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-150'}`}
                                        >
                                            <Smile className="h-5 w-5" />
                                        </button>
                                        <textarea
                                            value={input}
                                            onChange={handleTyping}
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
                                            disabled={!input.trim() && !selectedFile}
                                            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex-shrink-0 shadow-md shadow-indigo-200 mb-0.5"
                                        >
                                            <Send className="h-5 w-5 ml-0.5" />
                                        </button>
                                    </form>
                                    <p className="text-center text-[11px] text-gray-400 mt-2">{t('common.chat_hint', 'Press Enter to send, Shift + Enter for new line')}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Starred Messages Drawer */}
                    {showStarredDrawer && (
                        <div className="w-80 border-l border-gray-100 bg-white flex flex-col h-full z-20 animate-in slide-in-from-right duration-200">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                    Starred Messages
                                </h3>
                                <button 
                                    onClick={() => setShowStarredDrawer(false)}
                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-800 transition"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/20">
                                {loadingStarred ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Loading...</span>
                                    </div>
                                ) : starredMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
                                        <Star className="h-8 w-8 text-gray-200 mb-2" />
                                        <p className="text-xs">No starred messages yet.</p>
                                        <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">You can star important messages in this chat to see them here.</p>
                                    </div>
                                ) : (
                                    starredMessages.map((msg) => {
                                        const isStarredMe = msg.sender_type === 'admin';
                                        return (
                                            <div key={msg.id} className="bg-white border border-gray-100 rounded-xl p-3.5 shadow-sm relative group/drawerMsg">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[10px] font-bold text-indigo-600">
                                                        {isStarredMe ? t('common.you', 'You') : activeChat.user_name}
                                                    </span>
                                                    <span className="text-[9px] text-gray-400">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                                                <button
                                                    onClick={() => handleToggleStar(msg.id)}
                                                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-50 hover:bg-rose-50 text-amber-500 hover:text-rose-600 opacity-0 group-hover/drawerMsg:opacity-100 transition-all border border-gray-100 shadow-sm"
                                                    title="Unstar Message"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
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

            {/* Lightbox Modal */}
            <AnimatePresence>
                {activeLightboxImage && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setActiveLightboxImage(null)}
                    >
                        <button 
                            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/25 rounded-full text-white transition"
                            onClick={() => setActiveLightboxImage(null)}
                        >
                            <X className="h-6 w-6" />
                        </button>
                        <img 
                            src={activeLightboxImage} 
                            alt="Full screen preview" 
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear Chat Confirmation Modal */}
            <AnimatePresence>
                {showClearConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowClearConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.clear_chat_title', 'Clear chat history?')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('common.clear_chat_desc', 'This will permanently delete all messages and files in this conversation. This action cannot be undone.')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowClearConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    {t('common.clear_chat', 'Clear Chat')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message Info Modal */}
            <AnimatePresence>
                {infoMessage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setInfoMessage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900">{t('common.message_info', 'Message Info')}</h3>
                                <button
                                    onClick={() => setInfoMessage(null)}
                                    className="p-1.5 hover:bg-gray-150 rounded-full transition text-gray-500 hover:text-gray-800"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            
                            {/* Message preview */}
                            <div className="bg-gray-50 p-3.5 rounded-2xl mb-4 border border-gray-100 text-sm max-h-36 overflow-y-auto break-words whitespace-pre-wrap">
                                {infoMessage.content}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Send className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('common.sent_delivered', 'Sent / Delivered')}</p>
                                        <p className="text-sm text-gray-800 font-semibold mt-0.5">
                                            {new Date(infoMessage.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-xl ${infoMessage.is_read ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <CheckCheck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{t('common.read_seen', 'Read / Seen')}</p>
                                        <p className="text-sm text-gray-800 font-semibold mt-0.5">
                                            {infoMessage.is_read && infoMessage.read_at ? (
                                                new Date(infoMessage.read_at).toLocaleString()
                                            ) : infoMessage.is_read ? (
                                                t('common.seen', 'Seen')
                                            ) : (
                                                t('common.not_seen_yet', 'Not seen yet')
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Chat Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.delete_chat_title', 'Delete chat?')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('common.delete_chat_desc', 'Are you sure you want to delete this chat? This will remove the conversation from your inbox.')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        handleToggleConversationFlag('deleted');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    {t('common.delete', 'Delete')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Contact Confirmation Modal */}
            <AnimatePresence>
                {showBlockConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowBlockConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.block_contact_title', 'Block contact?')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('common.block_contact_desc', 'Blocked contacts cannot message you or view your availability. You can unblock them at any time.')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBlockConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBlockConfirmModal(false);
                                        handleToggleConversationFlag('blocked');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    {t('common.block', 'Block')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Contact Confirmation Modal */}
            <AnimatePresence>
                {showReportConfirmModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowReportConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.report_contact_title', 'Report contact?')}</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('common.report_contact_desc', 'This contact will be reported for review. Your recent message history with them may be analyzed.')}
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReportConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReportConfirmModal(false);
                                        handleToggleConversationFlag('reported');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-md shadow-amber-200"
                                >
                                    {t('common.report', 'Report')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
