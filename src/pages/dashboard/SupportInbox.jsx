import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search, Send, Check, CheckCheck, Smile, CornerUpLeft, X, Paperclip, FileText, Download, Clock, Copy, Star, Info, Trash2, Ban, Flag, PanelRightClose, PanelRightOpen, Mic, Square } from 'lucide-react';
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
    const [typingUsers, setTypingUsers] = useState({}); // { conversationId: boolean }
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    
    // UI States
    const [showRightPane, setShowRightPane] = useState(false);
    const [activeReactionMenuMessageId, setActiveReactionMenuMessageId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [activeLightboxImage, setActiveLightboxImage] = useState(null);
    const fileInputRef = useRef(null);
    const [infoMessage, setInfoMessage] = useState(null);
    
    // Context Menu State
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
    
    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Modals
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
    const [showBlockConfirmModal, setShowBlockConfirmModal] = useState(false);
    const [showReportConfirmModal, setShowReportConfirmModal] = useState(false);

    const [starredMessages, setStarredMessages] = useState([]);
    const [loadingStarred, setLoadingStarred] = useState(false);

    // --- Helpers ---
    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return \`\${m}:\${s}\`;
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const getDateLabel = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (isSameDay(date, today)) return t('common.today', 'Today');
        if (isSameDay(date, yesterday)) return t('common.yesterday', 'Yesterday');
        
        return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Prepare message groups by date and find unread divider
    let firstUnreadFound = false;
    const groupedMessages = [];
    let currentGroup = null;

    messages.forEach((msg, index) => {
        const dateLabel = getDateLabel(msg.created_at);
        
        if (!currentGroup || currentGroup.dateLabel !== dateLabel) {
            if (currentGroup) groupedMessages.push(currentGroup);
            currentGroup = { dateLabel, messages: [] };
        }
        
        // Unread divider logic
        if (!firstUnreadFound && msg.sender_type === 'user' && !msg.is_read) {
            msg.isFirstUnread = true;
            firstUnreadFound = true;
        }

        // Tail logic (first message in a sequence by same sender)
        const prevMsg = index > 0 ? messages[index - 1] : null;
        msg.showTail = !prevMsg || prevMsg.sender_type !== msg.sender_type || getDateLabel(prevMsg.created_at) !== dateLabel;

        currentGroup.messages.push(msg);
    });
    if (currentGroup) groupedMessages.push(currentGroup);

    // --- Audio Recording ---
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const file = new File([audioBlob], \`voice_message_\${Date.now()}.webm\`, { type: 'audio/webm' });
                setSelectedFile(file);
                // Can create object URL for preview if we want a custom audio player, for now we treat as file
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Microphone access denied:', error);
            toast.error(t('common.mic_access_denied', 'Microphone access denied'));
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            audioChunksRef.current = []; // discard
            setIsRecording(false);
            clearInterval(recordingTimerRef.current);
        }
    };

    // --- API Calls ---
    const fetchStarredMessages = async (convId) => {
        if (!convId) return;
        setLoadingStarred(true);
        try {
            const res = await api.get(\`/chat/\${convId}/starred\`);
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
            const res = await api.post(\`/chat/\${activeChat.id}/flag\`, {
                flagType,
                senderType: 'admin'
            });
            const column = \`is_\${flagType}_by_admin\`;
            const newValue = res.data[column];
            setActiveChat(prev => ({
                ...prev,
                [column]: newValue
            }));

            if (flagType === 'deleted' && newValue === true) {
                setActiveChat(null);
                setShowRightPane(false);
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
            console.error(\`Failed to toggle conversation flag \${flagType}:\`, error);
            toast.error(t('common.error_updating_flag', 'Failed to update flag settings'));
        }
    };

    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketUrl = rawUrl.replace(/\\/v1\\/?$/, '');
        const newSocket = io(socketUrl);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            newSocket.emit('join_org', user.org_id);
        });

        newSocket.on('chat_notification', () => {
            fetchConversations();
        });

        return () => newSocket.close();
    }, [user]);

    // Handle Context Menu clicks away
    useEffect(() => {
        const handleClick = () => {
            if (contextMenu.visible) setContextMenu({ ...contextMenu, visible: false });
            setActiveReactionMenuMessageId(null);
        };
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [contextMenu]);

    const onEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji);
    };

    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (msg) => {
            if (activeChat && msg.conversation_id === activeChat.id) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
                scrollToBottom();
                
                if (msg.sender_type === 'user') {
                    api.patch(\`/chat/\${activeChat.id}/read\`, { readerType: 'admin' })
                       .then(() => fetchConversations())
                       .catch(console.error);
                }
            } else {
                fetchConversations();
            }
        };

        const handleMessagesRead = (data) => {
            if (activeChat && data.conversationId === activeChat.id && data.readerType === 'user') {
                setMessages(prev => prev.map(m => {
                    if (m.sender_type === 'admin' && !m.is_read) {
                        return { ...m, is_read: true, read_at: data.readAt };
                    }
                    return m;
                }));
            }
            fetchConversations(); // update list read receipts
        };

        const handlePresenceChange = (data) => {
            if (activeChat && data.id === activeChat.user_id) {
                setPartnerPresence({
                    online: data.status === 'online',
                    lastSeen: data.status === 'online' ? null : data.lastSeen
                });
            }
        };

        const handleTypingUpdate = (data) => {
            if (data.senderType === 'user') {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.conversationId]: data.isTyping
                }));
            }
        };

        const handleReactionUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        };

        const handleDisappearingUpdate = (data) => {
            if (activeChat && data.conversationId === activeChat.id) {
                setActiveChat(prev => ({ ...prev, disappearing_duration: data.disappearing_duration }));
                setMessages(prev => [...prev, data.systemMessage]);
                scrollToBottom();
            }
            fetchConversations();
        };

        const handleStarUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_starred: data.is_starred } : m));
            if (showRightPane && activeChat && data.conversationId === activeChat.id) {
                fetchStarredMessages(activeChat.id);
            }
        };

        const handleChatCleared = (data) => {
            if (activeChat && data.conversationId === activeChat.id) {
                setMessages([]);
            }
            fetchConversations();
        };

        const handleConvFlagUpdate = (data) => {
            if (activeChat && data.conversationId === activeChat.id) {
                const column = \`is_\${data.flagType}_by_\${data.senderType}\`;
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
                setShowRightPane(false);
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
    }, [socket, activeChat, showRightPane]);

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
        setStarredMessages([]);
        setPartnerPresence({ online: false, lastSeen: null });
        setTypingUsers(prev => ({ ...prev, [conv.id]: false }));
        setContextMenu({ visible: false, x: 0, y: 0, msg: null });
        
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        api.get(\`/chat/presence/\${conv.user_id}\`).then(res => {
            setPartnerPresence(res.data);
        }).catch(console.error);

        try {
            socket?.emit('join_chat', conv.id);
            await api.patch(\`/chat/\${conv.id}/read\`, { readerType: 'admin' });
            
            const res = await api.get(\`/chat/\${conv.id}/messages\`);
            setMessages(res.data);
            scrollToBottom();
            
            fetchConversations();
            if (showRightPane) {
                fetchStarredMessages(conv.id);
            }
        } catch (error) {
            console.error('Failed to fetch messages', error);
        }
    };

    useEffect(() => {
        if (showRightPane && activeChat) {
            fetchStarredMessages(activeChat.id);
        }
    }, [showRightPane, activeChat]);

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

    const handleRightClickMessage = (e, msg) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.pageX,
            y: e.pageY,
            msg: msg
        });
    };

    const handleReactMessage = async (messageId, emoji) => {
        setActiveReactionMenuMessageId(null);
        try {
            const res = await api.post(\`/chat/messages/\${messageId}/react\`, { emoji });
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
            const res = await api.post(\`/chat/messages/\${messageId}/star\`);
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
            await api.delete(\`/chat/\${activeChat.id}/clear\`, {
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
        try {
            const res = await api.patch(\`/chat/\${activeChat.id}/disappearing\`, {
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
        e?.preventDefault();
        if ((!input.trim() && !selectedFile) || !activeChat) return;

        const content = input;
        const fileToSend = selectedFile;

        setInput('');
        setSelectedFile(null);
        setFilePreview(null);
        setShowEmojiPicker(false);
        const replyMsg = replyingTo;
        setReplyingTo(null);

        const tempId = \`temp-\${Date.now()}\`;

        try {
            let res;
            if (fileToSend) {
                const isAudio = fileToSend.type.startsWith('audio/');
                const tempMsg = {
                    id: tempId,
                    content: isAudio ? '[Voice Message]' : \`[Media] \${fileToSend.name}\`,
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

                res = await api.post(\`/chat/\${activeChat.id}/messages/attachment\`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
            } else {
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

                res = await api.post(\`/chat/\${activeChat.id}/messages\`, {
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
        <div className="flex h-[calc(100vh-100px)] bg-gray-50/50 rounded-3xl shadow-sm border border-gray-200/60 overflow-hidden font-sans">
            
            {/* 1. LEFT PANE - Conversation List */}
            <div className="w-80 md:w-[380px] border-r border-gray-200/60 flex flex-col bg-white">
                <div className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2 mb-4 tracking-tight">
                        <MessageCircle className="h-6 w-6 text-indigo-600 fill-indigo-100" />
                        {t('navigation.support_inbox', 'Support Inbox')}
                    </h2>
                    <div className="relative group">
                        <input
                            type="text"
                            placeholder={t('common.search_users', 'Search users...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 transition-all text-gray-800 placeholder-gray-400"
                        />
                        <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
                    {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400 space-y-3">
                            <div className="bg-gray-50 p-3 rounded-full">
                                <MessageCircle className="w-6 h-6 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">{t('common.no_conversations', 'No conversations found.')}</span>
                        </div>
                    ) : (
                        filteredConversations.map(conv => {
                            const unread = Number(conv.unread_count) > 0;
                            const isActive = activeChat?.id === conv.id;
                            const isTyping = typingUsers[conv.id];
                            
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => handleSelectChat(conv)}
                                    className={\`w-full text-left p-3.5 rounded-2xl transition-all duration-200 flex items-center gap-3 border \${
                                        isActive 
                                            ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-200' 
                                            : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'
                                    }\`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className={\`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg \${isActive ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-700 shadow-inner border border-white'}\`}>
                                            {conv.user_name?.[0]?.toUpperCase()}
                                        </div>
                                        {Number(conv.disappearing_duration) > 0 && (
                                            <span className={\`absolute -bottom-1 -right-1 p-1 rounded-full shadow-sm border \${isActive ? 'bg-white border-indigo-600 text-indigo-600' : 'bg-indigo-600 border-white text-white'}\`} title="Disappearing messages active">
                                                <Clock className="w-2.5 h-2.5" />
                                            </span>
                                        )}
                                        {unread && (
                                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                                {conv.unread_count > 99 ? '99+' : conv.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className={\`font-bold text-sm truncate flex items-center gap-1.5 \${isActive ? 'text-white' : unread ? 'text-gray-900' : 'text-gray-700'}\`}>
                                                {conv.user_name}
                                                {conv.is_starred_by_admin && (
                                                    <Star className={\`w-3.5 h-3.5 \${isActive ? 'text-white fill-white' : 'text-amber-500 fill-amber-500'} flex-shrink-0\`} />
                                                )}
                                            </h4>
                                            <span className={\`text-[10px] font-semibold tracking-wide \${isActive ? 'text-indigo-100' : 'text-gray-400'}\`}>
                                                {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                                            </span>
                                        </div>
                                        <p className={\`text-xs truncate flex items-center gap-1 \${isActive ? 'text-indigo-100' : unread ? 'text-gray-900 font-bold' : 'text-gray-500'}\`}>
                                            {isTyping ? (
                                                <span className="text-emerald-500 font-bold italic">typing...</span>
                                            ) : (
                                                <>
                                                    {conv.last_message_sender === 'admin' && (
                                                        conv.last_message_read 
                                                            ? <CheckCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                            : <Check className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                                                    )}
                                                    <span className="truncate">{conv.last_message || t('common.no_messages', 'No messages yet')}</span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 2. CENTER PANE - Main Chat */}
            {/* Added a subtle WhatsApp style doodle pattern in background */}
            <div 
                className="flex-1 flex flex-col relative bg-[#e5e5e5]" 
                style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
                    backgroundBlendMode: 'overlay',
                    opacity: 0.97
                }}
            >
                {activeChat ? (
                    <>
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200/60 flex items-center justify-between bg-white/95 backdrop-blur-md z-10 sticky top-0 shadow-sm">
                            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setShowRightPane(!showRightPane)}>
                                <div className="relative">
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold shadow-inner border border-white">
                                        {activeChat.user_name?.[0]?.toUpperCase()}
                                    </div>
                                    {partnerPresence.online && (
                                        <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 leading-tight text-[15px]">{activeChat.user_name}</h3>
                                    <p className="text-xs mt-0.5">
                                        {typingUsers[activeChat.id] ? (
                                            <span className="text-emerald-600 font-bold italic animate-pulse">typing...</span>
                                        ) : partnerPresence.online ? (
                                            <span className="text-emerald-600 font-semibold">Online</span>
                                        ) : partnerPresence.lastSeen ? (
                                            <span className="text-gray-500 font-medium">Last seen {new Date(partnerPresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        ) : (
                                            <span className="text-gray-400 font-medium">Offline</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowRightPane(!showRightPane)}
                                    className={\`p-2.5 rounded-xl transition-all \${showRightPane ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}\`}
                                    title="Contact Info"
                                >
                                    {showRightPane ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Messages Feed */}
                        <div className="flex-1 flex overflow-hidden">
                            <div className="flex-1 flex flex-col min-w-0 relative">
                                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2 custom-scrollbar pb-36">
                                    {Number(activeChat.disappearing_duration) > 0 && (
                                        <div className="flex items-center justify-center w-full mb-6 select-none">
                                            <div className="flex items-center gap-2 bg-yellow-100/90 backdrop-blur-sm border border-yellow-200 rounded-xl px-4 py-2 text-xs text-yellow-800 shadow-sm">
                                                <Clock className="h-4 w-4 text-yellow-700 animate-pulse" />
                                                <span className="font-semibold">
                                                    Disappearing messages active ({activeChat.disappearing_duration === 86400 ? '24 hours' : activeChat.disappearing_duration === 604800 ? '7 days' : '90 days'})
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {groupedMessages.map((group, groupIndex) => (
                                        <div key={\`group-\${groupIndex}\`} className="space-y-1.5 relative">
                                            
                                            {/* Date Separator Pill */}
                                            <div className="flex justify-center my-4 sticky top-2 z-20">
                                                <div className="bg-white/80 backdrop-blur-md shadow-sm border border-gray-100/50 text-gray-600 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    {group.dateLabel}
                                                </div>
                                            </div>

                                            {group.messages.map((msg) => {
                                                if (msg.content && msg.content.startsWith('$$SYSTEM$$:')) {
                                                    const systemText = msg.content.replace('$$SYSTEM$$:', '');
                                                    return (
                                                        <div key={msg.id} className="flex justify-center my-2 w-full select-none">
                                                            <div className="bg-yellow-50 text-yellow-800 border border-yellow-100 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm select-none text-center max-w-sm">
                                                                {systemText}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                const isMe = msg.sender_type === 'admin';
                                                
                                                return (
                                                    <div key={msg.id} className="w-full">
                                                        
                                                        {/* Unread Divider */}
                                                        {msg.isFirstUnread && (
                                                            <div className="flex items-center justify-center my-4 relative">
                                                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-emerald-500/30"></div></div>
                                                                <div className="relative bg-[#e5e5e5] px-4">
                                                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                                                                        Unread Messages
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div id={\`msg-\${msg.id}\`} className={\`flex w-full group/row \${isMe ? 'justify-end' : 'justify-start'} \${msg.showTail ? 'mt-2' : 'mt-[2px]'}\`}>
                                                            <div className={\`flex max-w-[75%] lg:max-w-[65%] \${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-1.5\`}>
                                                                
                                                                <motion.div
                                                                    drag="x"
                                                                    dragConstraints={isMe ? { left: -80, right: 0 } : { left: 0, right: 80 }}
                                                                    dragElastic={0.2}
                                                                    dragSnapToOrigin={true}
                                                                    onDragEnd={(e, info) => {
                                                                        if ((!isMe && info.offset.x > 45) || (isMe && info.offset.x < -45)) setReplyingTo(msg);
                                                                    }}
                                                                    className="relative z-10 flex flex-col group/bubble"
                                                                >
                                                                    <div 
                                                                        onContextMenu={(e) => handleRightClickMessage(e, msg)}
                                                                        className={\`relative px-3.5 py-2 text-[14px] shadow-sm transition-all \${
                                                                        isMe 
                                                                            ? 'bg-[#dcf8c6] text-gray-900 border border-green-200/50' 
                                                                            : 'bg-white text-gray-900 border border-gray-100'
                                                                        } \${
                                                                            msg.showTail 
                                                                                ? (isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm')
                                                                                : 'rounded-2xl'
                                                                        }\`}
                                                                    >
                                                                        {/* WhatsApp-style Tail */}
                                                                        {msg.showTail && (
                                                                            <svg viewBox="0 0 8 13" width="8" height="13" className={\`absolute top-0 \${isMe ? '-right-1.5 text-[#dcf8c6]' : '-left-1.5 text-white'}\`} style={{ filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.05))' }}>
                                                                                <path fill="currentColor" d={isMe ? "M8 0L0 0L0 13C0 13 4.2 8.7 8 0Z" : "M0 0L8 0L8 13C8 13 3.8 8.7 0 0Z"} />
                                                                            </svg>
                                                                        )}

                                                                        {msg.reply_to_id && (
                                                                            <div 
                                                                                onClick={() => {
                                                                                    const el = document.getElementById(\`msg-\${msg.reply_to_id}\`);
                                                                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                }}
                                                                                className="mb-1 p-2 rounded-lg text-xs cursor-pointer border-l-4 select-none bg-black/5 hover:bg-black/10 transition-colors"
                                                                                style={{ borderColor: isMe ? '#128C7E' : '#34B7F1' }}
                                                                            >
                                                                                <div className="font-extrabold mb-0.5" style={{ color: isMe ? '#128C7E' : '#34B7F1' }}>
                                                                                    {msg.reply_to_sender_type === 'admin' ? t('common.support', 'You') : activeChat?.user_name || 'User'}
                                                                                </div>
                                                                                <p className="truncate opacity-80 text-gray-700">{msg.reply_to_content}</p>
                                                                            </div>
                                                                        )}

                                                                        {/* Hover Actions */}
                                                                        <div className={\`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity \${isMe ? '-left-[40px]' : '-right-[40px]'}\`}>
                                                                            <button onClick={(e) => { e.stopPropagation(); setActiveReactionMenuMessageId(activeReactionMenuMessageId === msg.id ? null : msg.id); }} className="p-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-full text-gray-500 hover:text-yellow-500 shadow-sm" title="React">
                                                                                <Smile className="h-4 w-4" />
                                                                            </button>
                                                                        </div>

                                                                        {/* Reactions Menu Popover */}
                                                                        {activeReactionMenuMessageId === msg.id && (
                                                                            <div className={\`absolute bottom-full mb-2 bg-white border border-gray-200 rounded-full px-2 py-1.5 shadow-xl flex gap-2 z-50 animate-in zoom-in-95 duration-100 \${isMe ? 'right-0' : 'left-0'}\`}>
                                                                                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                    <button key={emoji} onClick={() => handleReactMessage(msg.id, emoji)} className="hover:scale-125 transition-transform text-xl px-1">
                                                                                        {emoji}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Attachments (Including Audio) */}
                                                                        {msg.attachments?.length > 0 && (
                                                                            <div className="space-y-1.5 mb-1.5 select-none mt-1">
                                                                                {msg.attachments.map((att) => {
                                                                                    const isImg = att.mime_type?.startsWith('image/');
                                                                                    const isAudio = att.mime_type?.startsWith('audio/');
                                                                                    const attachmentUrl = \`\${api.defaults.baseURL}/chat/messages/attachment/\${att.id}\`;
                                                                                    
                                                                                    if (isImg) {
                                                                                        return (
                                                                                            <div key={att.id} className="relative group/attachment overflow-hidden rounded-xl border border-black/10">
                                                                                                <img src={attachmentUrl} alt="attachment" className="w-[280px] max-h-60 object-cover cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setActiveLightboxImage(attachmentUrl)} />
                                                                                                <a href={attachmentUrl} download={att.file_name} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover/attachment:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                                                                    <Download className="h-4 w-4" />
                                                                                                </a>
                                                                                            </div>
                                                                                        );
                                                                                    } else if (isAudio) {
                                                                                        return (
                                                                                            <div key={att.id} className="w-[280px] pt-1">
                                                                                                <audio controls src={attachmentUrl} className="w-full h-10 outline-none" controlsList="nodownload"></audio>
                                                                                            </div>
                                                                                        );
                                                                                    } else {
                                                                                        return (
                                                                                            <div key={att.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/5 w-[280px]">
                                                                                                <FileText className="h-8 w-8 text-indigo-500 opacity-80" />
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="font-semibold text-xs truncate text-gray-800">{att.file_name}</p>
                                                                                                </div>
                                                                                                <a href={attachmentUrl} download={att.file_name} target="_blank" rel="noreferrer" className="p-1.5 bg-white rounded-full shadow-sm hover:text-indigo-600 transition-colors">
                                                                                                    <Download className="h-4 w-4" />
                                                                                                </a>
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                })}
                                                                            </div>
                                                                        )}

                                                                        <div className="flex gap-4">
                                                                            <p className="whitespace-pre-wrap leading-snug break-words pb-3 pt-1">
                                                                                {msg.content === '[Voice Message]' && !msg.attachments?.length ? <span className="italic text-gray-500">Audio message</span> : msg.content}
                                                                            </p>
                                                                            
                                                                            {/* Floating Meta data (Time & Ticks) inside the bubble bottom right */}
                                                                            <div className={\`float-right flex items-center justify-end gap-1 mt-auto pt-2 -mr-1 -mb-1 \${isMe ? 'text-gray-500' : 'text-gray-400'}\`}>
                                                                                {msg.is_starred && <Star className="h-3 w-3 text-amber-500 fill-amber-500 mr-0.5" />}
                                                                                <span className="text-[10px] font-semibold tracking-tight whitespace-nowrap">
                                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                {isMe && (
                                                                                    msg.is_read ? (
                                                                                        <CheckCheck className="h-4 w-4 text-[#53bdeb] ml-0.5" title="Read" />
                                                                                    ) : (
                                                                                        <Check className="h-4 w-4 opacity-70 ml-0.5" title="Sent" />
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </div>

                                                                        {msg.reactions?.length > 0 && (
                                                                            <div className="absolute -bottom-3 left-4 flex items-center bg-white border border-gray-200 rounded-full px-1.5 py-0.5 shadow-sm text-xs gap-1 z-20 cursor-pointer text-gray-800 scale-90 origin-left">
                                                                                {[...new Set(msg.reactions.map(r => r.emoji))].map(emoji => (
                                                                                    <span key={emoji}>{emoji}</span>
                                                                                ))}
                                                                                {msg.reactions.length > 1 && <span className="text-[10px] font-bold ml-0.5">{msg.reactions.length}</span>}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </motion.div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}

                                    {typingUsers[activeChat.id] && (
                                        <div className="flex justify-start ml-2 mt-2">
                                            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                                
                                {/* Input Area (Floating) */}
                                <div className="absolute bottom-6 left-6 right-6 z-30">
                                    <div className="bg-white rounded-3xl shadow-xl border border-gray-200/60 overflow-hidden flex flex-col transition-all">
                                        {/* Reply Preview */}
                                        {replyingTo && (
                                            <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center relative">
                                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-tl-xl" />
                                                <div className="pl-3">
                                                    <div className="text-[11px] font-extrabold text-indigo-600 mb-0.5 uppercase tracking-wide">
                                                        Replying to {replyingTo.sender_type === 'admin' ? 'Yourself' : activeChat?.user_name}
                                                    </div>
                                                    <div className="text-sm text-gray-700 truncate max-w-lg font-medium">{replyingTo.content}</div>
                                                </div>
                                                <button onClick={() => setReplyingTo(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500 transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}

                                        {/* File Preview */}
                                        {selectedFile && !isRecording && (
                                            <div className="bg-gray-50 border-b border-gray-100 p-3 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {filePreview ? (
                                                        <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded-lg border border-gray-200 shadow-sm" />
                                                    ) : (
                                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center border border-indigo-100">
                                                            {selectedFile.type.startsWith('audio/') ? <Mic className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800 truncate max-w-[200px]">{selectedFile.name}</p>
                                                        <p className="text-[11px] text-gray-500 font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}

                                        {activeChat.is_blocked_by_admin || activeChat.is_blocked_by_user ? (
                                            <div className="p-5 flex flex-col items-center justify-center text-center bg-gray-50">
                                                <Ban className="h-6 w-6 text-rose-500 mb-2" />
                                                <p className="text-sm font-semibold text-gray-700">
                                                    {activeChat.is_blocked_by_admin ? 'You blocked this contact.' : 'You have been blocked.'}
                                                </p>
                                                {activeChat.is_blocked_by_admin && (
                                                    <button onClick={() => handleToggleConversationFlag('blocked')} className="mt-2 text-indigo-600 text-sm font-bold hover:underline">
                                                        Unblock to send messages
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <form onSubmit={handleSendMessage} className="flex items-end gap-2 p-2 relative bg-white">
                                                
                                                {isRecording ? (
                                                    // Recording State UI
                                                    <div className="flex-1 flex items-center gap-4 px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm shadow-red-200"></div>
                                                            <span className="text-red-500 font-bold text-sm tracking-wide font-mono">{formatDuration(recordingDuration)}</span>
                                                        </div>
                                                        <div className="flex-1"></div>
                                                        <button type="button" onClick={cancelRecording} className="text-gray-400 hover:text-red-500 text-sm font-semibold transition px-2">
                                                            Cancel
                                                        </button>
                                                        <button type="button" onClick={stopRecording} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition shadow-sm border border-red-100" title="Stop & Use">
                                                            <Square className="h-5 w-5 fill-current" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    // Default Input State UI
                                                    <>
                                                        <div className="flex gap-1.5 pl-1.5 pb-0.5">
                                                            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={\`p-2.5 rounded-full transition-colors \${showEmojiPicker ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}\`}>
                                                                <Smile className="h-6 w-6" />
                                                            </button>
                                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                                                                <Paperclip className="h-6 w-6" />
                                                            </button>
                                                        </div>
                                                        
                                                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />

                                                        <textarea
                                                            value={input}
                                                            onChange={handleTyping}
                                                            placeholder={t('common.type_reply_placeholder', 'Type a message...')}
                                                            className="flex-1 bg-transparent border-none py-3.5 text-[15px] focus:outline-none resize-none max-h-32 min-h-[48px] text-gray-800 placeholder-gray-400 font-medium leading-relaxed"
                                                            rows="1"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }
                                                            }}
                                                        />

                                                        {input.trim() || selectedFile ? (
                                                            <button type="submit" className="bg-[#128C7E] text-white p-3 rounded-full hover:bg-[#075E54] transition shadow-md mb-1 mr-1 flex-shrink-0">
                                                                <Send className="h-5 w-5 ml-0.5" />
                                                            </button>
                                                        ) : (
                                                            <button type="button" onClick={startRecording} className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 transition shadow-md mb-1 mr-1 flex-shrink-0 group">
                                                                <Mic className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                                            </button>
                                                        )}

                                                        {showEmojiPicker && (
                                                            <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-3xl overflow-hidden border border-gray-100" ref={emojiPickerRef}>
                                                                <EmojiPicker onEmojiClick={onEmojiClick} width={340} height={400} lazyLoadEmojis={true} skinTonesDisabled={true} previewConfig={{ showPreview: false }} />
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Click Context Menu */}
                        <AnimatePresence>
                            {contextMenu.visible && contextMenu.msg && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.1 }}
                                    style={{ top: contextMenu.y, left: contextMenu.x }}
                                    className="fixed bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl z-[999] py-1.5 w-48 overflow-hidden text-gray-800"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button onClick={() => { setReplyingTo(contextMenu.msg); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-100 flex items-center gap-3">
                                        <CornerUpLeft className="h-4 w-4 text-gray-500" /> Reply
                                    </button>
                                    <button onClick={() => { handleCopyMessage(contextMenu.msg.content); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-100 flex items-center gap-3">
                                        <Copy className="h-4 w-4 text-gray-500" /> Copy
                                    </button>
                                    <button onClick={() => { handleToggleStar(contextMenu.msg.id); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-100 flex items-center gap-3">
                                        <Star className={\`h-4 w-4 \${contextMenu.msg.is_starred ? 'text-amber-500 fill-amber-500' : 'text-gray-500'}\`} /> {contextMenu.msg.is_starred ? 'Unstar' : 'Star'}
                                    </button>
                                    <hr className="my-1 border-gray-200/60" />
                                    <button onClick={() => { setInfoMessage(contextMenu.msg); setContextMenu({ ...contextMenu, visible: false }); }} className="w-full text-left px-4 py-2 text-sm font-semibold hover:bg-gray-100 flex items-center gap-3">
                                        <Info className="h-4 w-4 text-gray-500" /> Message Info
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white/50 backdrop-blur-sm">
                        <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-md border border-gray-100">
                            <MessageCircle className="h-14 w-14 text-indigo-200" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-gray-900 mb-3 tracking-tight">Queuify Support</h3>
                        <p className="text-gray-500 max-w-md font-medium leading-relaxed">Select a conversation from the left sidebar to start messaging, reply to queries, and provide excellent support in real-time.</p>
                    </div>
                )}
            </div>

            {/* 3. RIGHT PANE - Contact Details & Actions */}
            <AnimatePresence>
                {showRightPane && activeChat && (
                    <motion.div 
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 360, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="border-l border-gray-200/60 bg-white flex flex-col overflow-hidden"
                    >
                        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10 flex items-center gap-4">
                            <button onClick={() => setShowRightPane(false)} className="p-1.5 hover:bg-white rounded-full text-gray-600 transition shadow-sm border border-transparent hover:border-gray-200">
                                <X className="w-5 h-5" />
                            </button>
                            <h3 className="font-extrabold text-gray-900 tracking-tight">Contact Info</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {/* Profile Header */}
                            <div className="p-8 flex flex-col items-center bg-white border-b border-gray-100">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-4xl shadow-inner border-4 border-white mb-5 relative">
                                    {activeChat.user_name?.[0]?.toUpperCase()}
                                </div>
                                <h2 className="text-xl font-extrabold text-gray-900">{activeChat.user_name}</h2>
                                <p className="text-sm text-gray-500 mt-1.5 font-medium">{activeChat.user_email || 'No email provided'}</p>
                            </div>

                            {/* Settings / Actions */}
                            <div className="p-5 space-y-6 bg-gray-50/30">
                                
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 overflow-hidden">
                                    <div className="w-full text-left px-5 py-4 text-[15px] hover:bg-gray-50 flex items-center justify-between transition cursor-pointer border-b border-gray-100" onClick={() => handleToggleConversationFlag('starred')}>
                                        <div className="flex items-center gap-4 text-gray-800 font-bold">
                                            <Star className={\`w-5 h-5 \${activeChat.is_starred_by_admin ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}\`} />
                                            Star Contact
                                        </div>
                                    </div>
                                    
                                    <div className="w-full text-left px-5 py-4 text-[15px] hover:bg-gray-50 flex flex-col transition cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-gray-800 font-bold">
                                                <Clock className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                                Disappearing Messages
                                            </div>
                                            <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                {activeChat.disappearing_duration === 86400 ? '24h' : activeChat.disappearing_duration === 604800 ? '7d' : activeChat.disappearing_duration === 7776000 ? '90d' : 'Off'}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex gap-2 w-full">
                                            {[{l:'Off',v:0},{l:'24h',v:86400},{l:'7d',v:604800},{l:'90d',v:7776000}].map(opt => (
                                                <button 
                                                    key={opt.v} 
                                                    onClick={(e) => { e.stopPropagation(); handleSetDisappearing(opt.v); }}
                                                    className={\`flex-1 py-2 text-xs font-bold rounded-xl border transition-all \${Number(activeChat.disappearing_duration) === opt.v ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50'}\`}
                                                >
                                                    {opt.l}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Starred Messages Preview */}
                                <div className="bg-white rounded-3xl shadow-sm border border-gray-100/50 p-5">
                                    <h4 className="text-sm font-extrabold text-gray-900 mb-4 flex items-center justify-between">
                                        Starred Messages
                                        <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{starredMessages.length}</span>
                                    </h4>
                                    <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2 -mr-2">
                                        {loadingStarred ? (
                                            <div className="text-center text-xs font-bold text-gray-400 py-6">Loading...</div>
                                        ) : starredMessages.length === 0 ? (
                                            <div className="text-center text-sm font-medium text-gray-400 py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">No starred messages.</div>
                                        ) : (
                                            starredMessages.map((msg) => (
                                                <div key={msg.id} className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 relative group">
                                                    <p className="text-xs text-gray-800 font-medium line-clamp-3 leading-relaxed">{msg.content}</p>
                                                    <button onClick={() => handleToggleStar(msg.id)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-gray-200 rounded-full shadow-sm text-gray-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden">
                                    <button onClick={() => setShowClearConfirmModal(true)} className="w-full text-left px-5 py-4 text-[15px] hover:bg-rose-50 flex items-center gap-4 transition text-gray-700 hover:text-rose-700 font-bold border-b border-rose-50">
                                        <Trash2 className="w-5 h-5 text-rose-400" />
                                        Clear Chat History
                                    </button>
                                    <button onClick={() => { activeChat.is_blocked_by_admin ? handleToggleConversationFlag('blocked') : setShowBlockConfirmModal(true) }} className="w-full text-left px-5 py-4 text-[15px] hover:bg-rose-50 flex items-center gap-4 transition text-rose-600 font-bold border-b border-rose-50">
                                        <Ban className="w-5 h-5" />
                                        {activeChat.is_blocked_by_admin ? 'Unblock Contact' : 'Block Contact'}
                                    </button>
                                    <button onClick={() => { activeChat.is_reported_by_admin ? handleToggleConversationFlag('reported') : setShowReportConfirmModal(true) }} className="w-full text-left px-5 py-4 text-[15px] hover:bg-amber-50 flex items-center gap-4 transition text-amber-600 font-bold">
                                        <Flag className="w-5 h-5" />
                                        {activeChat.is_reported_by_admin ? 'Cancel Report' : 'Report Contact'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {activeLightboxImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-[999] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setActiveLightboxImage(null)}>
                        <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition backdrop-blur-md" onClick={() => setActiveLightboxImage(null)}>
                            <X className="h-6 w-6" />
                        </button>
                        <img src={activeLightboxImage} alt="Preview" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Clear Chat Confirmation Modal */}
            <AnimatePresence>
                {showClearConfirmModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4" onClick={() => setShowClearConfirmModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Clear chat history?</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">This will permanently delete all messages and files in this conversation for you. This action cannot be undone.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowClearConfirmModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                                <button onClick={handleClearChat} className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200">Clear Chat</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Block Contact Modal */}
            <AnimatePresence>
                {showBlockConfirmModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4" onClick={() => setShowBlockConfirmModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4"><Ban className="w-6 h-6" /></div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Block this contact?</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">They won't be able to send you messages until you unblock them.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowBlockConfirmModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                                <button onClick={() => { handleToggleConversationFlag('blocked'); setShowBlockConfirmModal(false); }} className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200">Block</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Report Contact Modal */}
            <AnimatePresence>
                {showReportConfirmModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4" onClick={() => setShowReportConfirmModal(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4"><Flag className="w-6 h-6" /></div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Report this contact?</h3>
                            <p className="text-sm text-gray-500 mb-6 font-medium">This contact will be flagged for inappropriate behavior.</p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setShowReportConfirmModal(false)} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition">Cancel</button>
                                <button onClick={() => { handleToggleConversationFlag('reported'); setShowReportConfirmModal(false); }} className="px-5 py-2.5 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-md shadow-amber-200">Report</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Message Info Modal */}
            <AnimatePresence>
                {infoMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4" onClick={() => setInfoMessage(null)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-extrabold text-gray-900">Message Info</h3>
                                <button onClick={() => setInfoMessage(null)} className="p-1.5 hover:bg-gray-100 rounded-full transition text-gray-500">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-2xl mb-5 border border-gray-100 text-sm max-h-40 overflow-y-auto break-words whitespace-pre-wrap font-medium text-gray-800">
                                {infoMessage.content}
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-4 p-3 bg-white border border-gray-100 shadow-sm rounded-2xl">
                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><Send className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sent / Delivered</p>
                                        <p className="text-sm text-gray-900 font-extrabold mt-0.5">{new Date(infoMessage.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 p-3 bg-white border border-gray-100 shadow-sm rounded-2xl">
                                    <div className="p-2.5 bg-[#dcf8c6] text-[#128C7E] rounded-xl"><CheckCheck className="h-5 w-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Read By User</p>
                                        <p className="text-sm text-gray-900 font-extrabold mt-0.5">{infoMessage.is_read && infoMessage.read_at ? new Date(infoMessage.read_at).toLocaleString() : 'Not yet read'}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
