import { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MessageCircle, X, Send, ChevronLeft, Smile, CornerUpLeft, Check, CheckCheck, Paperclip, FileText, Download, Clock, Maximize2, ChevronDown, Copy, Star, Info, Trash2, MoreVertical, Ban, Flag, Mic, Square, Edit2, Play, Pause, CheckSquare, Pin, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker from 'emoji-picker-react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [partnerPresence, setPartnerPresence] = useState({ online: false, lastSeen: null });
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);

    // WhatsApp features states
    const [activeReactionMenuMessageId, setActiveReactionMenuMessageId] = useState(null);
    const [showFullReactionPicker, setShowFullReactionPicker] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [showDisappearingModal, setShowDisappearingModal] = useState(false);
    const [activeLightboxImage, setActiveLightboxImage] = useState(null);
    const fileInputRef = useRef(null);
    const disappearingMenuRef = useRef(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState(null);
    const [infoMessage, setInfoMessage] = useState(null);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

    // Advanced Chat Features
    const [editingMessage, setEditingMessage] = useState(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, msg: null });
    const [deleteConfirmModal, setDeleteConfirmModal] = useState({ visible: false, messageId: null });    // UI States
    const [showRightPane, setShowRightPane] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);

    // Voice Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    // Format duration helper
    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Starred messages & contact settings states
    const [showStarredOverlay, setShowStarredOverlay] = useState(false);
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
                senderType: 'user'
            });
            const column = `is_${flagType}_by_user`;
            const newValue = res.data[column];
            setActiveChat(prev => ({
                ...prev,
                [column]: newValue
            }));

            if (flagType === 'deleted' && newValue === true) {
                handleCloseChat();
                toast.success('Chat deleted successfully');
            } else if (flagType === 'blocked') {
                toast.success(newValue ? 'Contact blocked' : 'Contact unblocked');
            } else if (flagType === 'reported') {
                toast.success(newValue ? 'Contact reported' : 'Report status updated');
            } else if (flagType === 'starred') {
                toast.success(newValue ? 'Contact added to favorites' : 'Contact removed from favorites');
            }
            fetchConversations();
        } catch (error) {
            console.error(`Failed to toggle conversation flag ${flagType}:`, error);
            toast.error('Failed to update flag settings');
        }
    };

    // Initialize Socket
    useEffect(() => {
        if (!user) return;

        const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketUrl = rawUrl.replace(/\/v1\/?$/, '');
        const newSocket = io(socketUrl);
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
                setMessages(prev => {
                    // Deduplicate: check if message ID already exists
                    if (prev.some(m => m.id === msg.id)) return prev;

                    // Also check for matching content from same sender in last 10 seconds (for non-ID matches)
                    const isDuplicateContent = prev.some(m =>
                        m.content === msg.content &&
                        m.sender_type === msg.sender_type &&
                        (new Date(msg.created_at) - new Date(m.created_at)) < 10000 &&
                        (m.id && isNaN(m.id)) // temporary ID check
                    );
                    if (isDuplicateContent) return prev;

                    return [...prev, msg];
                });
                scrollToBottom();

                // If it's from admin, mark as read
                if (msg.sender_type === 'admin') {
                    api.patch(`/chat/${activeChat.id}/read`, { readerType: 'user' })
                        .catch(console.error);
                }
            }
        };

        const handleMessagesRead = (data) => {
            if (data.conversationId === activeChat.id && data.readerType === 'admin') {
                setMessages(prev => prev.map(m => {
                    if (m.sender_type === 'user' && !m.is_read) {
                        return { ...m, is_read: true, read_at: data.readAt };
                    }
                    return m;
                }));
            }
        };

        const handlePresenceChange = (data) => {
            if (data.id === activeChat.org_id) {
                setPartnerPresence({
                    online: data.status === 'online',
                    lastSeen: data.status === 'online' ? null : data.lastSeen
                });
            }
        };

        const handleTypingUpdate = (data) => {
            if (data.conversationId === activeChat.id && data.senderType === 'admin') {
                setIsPartnerTyping(data.isTyping);
            }
        };

        const handleReactionUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, reactions: data.reactions } : m));
        };

        const handleDisappearingUpdate = (data) => {
            if (data.conversationId === activeChat.id) {
                setActiveChat(prev => ({ ...prev, disappearing_duration: data.disappearing_duration }));
                setMessages(prev => {
                    if (!data.systemMessage) return prev;
                    if (prev.some(m => m.id === data.systemMessage.id)) return prev;
                    return [...prev, data.systemMessage];
                });
                scrollToBottom();
            }
            fetchConversations();
        };

        const handleStarUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_starred: data.is_starred } : m));
            if (showStarredOverlay && activeChat && data.conversationId === activeChat.id) {
                fetchStarredMessages(activeChat.id);
            }
        };

        const handlePinUpdate = (data) => {
            setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_pinned: data.is_pinned } : m));
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
            if (data.flagType === 'deleted' && data.senderType === 'user' && activeChat && data.conversationId === activeChat.id && data.value === true) {
                handleCloseChat();
            }
        };

        const handleMessageEdited = (data) => {
            if (activeChat && data.conversation_id === activeChat.id) {
                setMessages(prev => prev.map(m => m.id === data.id ? data : m));
            }
        };

        const handleMessageDeleted = (data) => {
            if (activeChat && data.conversationId === activeChat.id) {
                setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
            }
        };

        socket.on('new_message', handleNewMessage);
        socket.on('messages_read', handleMessagesRead);
        socket.on('presence_change', handlePresenceChange);
        socket.on('chat_typing_update', handleTypingUpdate);
        socket.on('message_reaction_update', handleReactionUpdate);
        socket.on('disappearing_update', handleDisappearingUpdate);
        socket.on('message_star_update', handleStarUpdate);
        socket.on('message_pin_update', handlePinUpdate);
        socket.on('chat_cleared', handleChatCleared);
        socket.on('conversation_flag_update', handleConvFlagUpdate);
        socket.on('conversation_list_flag_update', handleConvListFlagUpdate);
        socket.on('message_edited', handleMessageEdited);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            socket.off('presence_change', handlePresenceChange);
            socket.off('chat_typing_update', handleTypingUpdate);
            socket.off('message_reaction_update', handleReactionUpdate);
            socket.off('disappearing_update', handleDisappearingUpdate);
            socket.off('message_star_update', handleStarUpdate);
            socket.off('message_pin_update', handlePinUpdate);
            socket.off('chat_cleared', handleChatCleared);
            socket.off('conversation_flag_update', handleConvFlagUpdate);
            socket.off('conversation_list_flag_update', handleConvListFlagUpdate);
            socket.off('message_edited', handleMessageEdited);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [socket, activeChat, showStarredOverlay]);

    const scrollToBottom = (behavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
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

    // Real-time cleanup for disappearing messages
    useEffect(() => {
        if (!activeChat || !activeChat.disappearing_duration || activeChat.disappearing_duration === 0) return;
        
        const intervalId = setInterval(() => {
            const now = new Date();
            setMessages(prev => {
                const filtered = prev.filter(m => {
                    // Always keep system messages or non-timed messages
                    if (m.sender_type === 'system') return true;
                    // Calculate age in seconds
                    const ageInSeconds = (now - new Date(m.created_at)) / 1000;
                    return ageInSeconds < activeChat.disappearing_duration;
                });
                return filtered.length !== prev.length ? filtered : prev;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [activeChat]);

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
        window.addEventListener('contextmenu', handleClickAway);
        return () => {
            window.removeEventListener('click', handleClickAway);
            window.removeEventListener('contextmenu', handleClickAway);
        };
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

    // Handle global open-chat events
    useEffect(() => {
        const handleGlobalOpen = async (event) => {
            setIsOpen(true);
            const { orgId, orgName, orgAvatar } = event.detail || {};
            if (!orgId) return;

            try {
                // Initiate or get existing conversation
                const res = await api.post('/chat/initiate', { orgId });
                const conv = res.data;

                // Build a minimal conversation object so we can open chat immediately
                // without waiting for a full list refresh
                const chatObject = {
                    ...conv,
                    org_name: conv.org_name || orgName || 'Organization',
                    org_avatar: conv.org_avatar || orgAvatar || null,
                };

                // Also refresh the list in background so it stays up to date
                fetchConversations();

                handleOpenChat(chatObject);
            } catch (error) {
                console.error('Failed to initiate chat via event', error);
            }
        };

        window.addEventListener('openChat', handleGlobalOpen);
        return () => window.removeEventListener('openChat', handleGlobalOpen);
    }, [socket]);

    const handleOpenChat = async (conv) => {
        setActiveChat(conv);
        setMessages([]);
        setShowStarredOverlay(false);
        setStarredMessages([]);
        setShowMoreMenu(false);
        setLoadingMessages(true);
        setPartnerPresence({ online: false, lastSeen: null });
        setIsPartnerTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Fetch initial presence status
        api.get(`/chat/presence/${conv.org_id}`).then(res => {
            setPartnerPresence(res.data);
        }).catch(console.error);

        try {
            // Join chat room
            socket?.emit('join_chat', conv.id);

            // Mark read
            api.patch(`/chat/${conv.id}/read`, { readerType: 'user' }).catch(console.error);

            // Fetch messages
            const res = await api.get(`/chat/${conv.id}/messages`);
            setMessages(res.data);
            setTimeout(() => scrollToBottom('auto'), 50);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleTyping = (e) => {
        setInput(e.target.value);
        if (!socket || !activeChat) return;

        socket.emit('chat_typing', {
            conversationId: activeChat.id,
            senderType: 'user',
            isTyping: true
        });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('chat_typing', {
                conversationId: activeChat.id,
                senderType: 'user',
                isTyping: false
            });
        }, 1500);
    };

    const handleCloseChat = () => {
        if (activeChat) {
            socket?.emit('leave_chat', activeChat.id);
            setActiveChat(null);
            setShowStarredOverlay(false);
            setStarredMessages([]);
            setShowMoreMenu(false);
            fetchConversations();
        } else {
            setIsOpen(false);
        }
    };

    const handleReactMessage = async (messageId, emoji) => {
        setActiveReactionMenuMessageId(null);
        
        // Optimistic update
        const currentUserId = user?.id; // from useAuth
        setMessages(prev => prev.map(m => {
            if (m.id === messageId) {
                const reactions = [...(m.reactions || [])];
                const existingIndex = reactions.findIndex(r => r.emoji === emoji && r.user_id === currentUserId);
                if (existingIndex > -1) {
                    reactions.splice(existingIndex, 1);
                } else {
                    reactions.push({ emoji, user_id: currentUserId, user_name: user?.name || 'You' });
                }
                return { ...m, reactions };
            }
            return m;
        }));

        try {
            const res = await api.post(`/chat/messages/${messageId}/react`, { emoji });
            setMessages(prev => prev.map(m => m.id === messageId ? res.data : m));
        } catch (error) {
            console.error('Failed to react to message:', error);
        }
    };

    const handlePinMessage = async (messageId) => {
        setActiveMessageMenuId(null);
        try {
            const res = await api.post(`/chat/messages/${messageId}/pin`);
            setMessages(prev => prev.map(m => m.id === messageId ? res.data : m));
        } catch (error) {
            console.error('Failed to pin message:', error);
            toast.error('Failed to pin message');
        }
    };

    const handleCopyMessage = (content) => {
        navigator.clipboard.writeText(content);
        toast.success('Copied to clipboard!');
    };

    const handleToggleStar = async (messageId) => {
        try {
            const res = await api.post(`/chat/messages/${messageId}/star`);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: res.data.is_starred } : m));
            setStarredMessages(prev => {
                if (res.data.is_starred) {
                    fetchStarredMessages(activeChat.id);
                    return prev;
                } else {
                    return prev.filter(m => m.id !== messageId);
                }
            });
            toast.success(res.data.is_starred ? 'Message starred' : 'Message unstarred');
        } catch (error) {
            console.error('Failed to star message:', error);
            toast.error('Failed to update star status');
        }
    };

    const handleClearChat = async () => {
        setShowClearConfirmModal(false);
        try {
            await api.delete(`/chat/${activeChat.id}/clear?senderType=user`);


            toast.success('Chat history cleared.');
        } catch (error) {
            console.error('Failed to clear chat:', error);
            toast.error('Failed to clear chat history.');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.');
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
                senderType: 'user'
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
                    sender_type: 'user',
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
                formData.append('senderType', 'user');

                res = await api.post(`/chat/${activeChat.id}/messages/attachment`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                setMessages(prev => {
                    if (prev.some(m => m.id === res.data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
                    return prev.map(m => m.id === tempId ? res.data : m);
                });
            } else {
                // Optimistic text message
                const tempMsg = {
                    id: tempId,
                    content,
                    sender_type: 'user',
                    created_at: new Date().toISOString(),
                    reply_to_id: replyMsg ? replyMsg.id : null,
                    reply_to_content: replyMsg ? replyMsg.content : null,
                    reply_to_sender_type: replyMsg ? replyMsg.sender_type : null
                };
                setMessages(prev => [...prev, tempMsg]);
                scrollToBottom();

                res = await api.post(`/chat/${activeChat.id}/messages`, {
                    content,
                    senderType: 'user',
                    replyToId: replyMsg ? replyMsg.id : null
                });

                setMessages(prev => {
                    if (prev.some(m => m.id === res.data.id && m.id !== tempId)) return prev.filter(m => m.id !== tempId);
                    return prev.map(m => m.id === tempId ? res.data : m);
                });
            }
            fetchConversations();
        } catch (error) {
            console.error('Failed to send message', error);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const onEmojiClick = (emojiData) => {
        setInput(prev => prev + emojiData.emoji);
    };

    // Advanced Handlers
    const handleContextMenu = (e, msg) => {
        e.preventDefault();
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            msg
        });
    };

    const handleEditMessage = async () => {
        if (!input.trim() || !editingMessage) return;
        try {
            const res = await api.patch(`/chat/messages/${editingMessage.id}/edit`, {
                newContent: input.trim(),
                senderType: 'user'
            });
            setMessages(prev => prev.map(m => m.id === editingMessage.id ? res.data : m));
            setEditingMessage(null);
            setInput('');
        } catch (error) {
            console.error('Failed to edit message', error);
            toast.error(error.response?.data?.message || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (messageId, deleteType) => {
        // Optimistic UI update
        const previousMessages = [...messages];
        if (deleteType === 'for_me') {
            setMessages(prev => prev.filter(m => m.id !== messageId));
        } else {
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
        }
        setDeleteConfirmModal({ visible: false, messageId: null });
        
        try {
            await api.delete(`/chat/messages/${messageId}`, { data: { senderType: 'user', deleteType } });
        } catch (error) {
            console.error('Failed to delete message', error);
            setMessages(previousMessages);
            toast.error(error.response?.data?.message || 'Failed to delete message');
        }
    };

    const handleBulkDelete = async (deleteType) => {
        // Optimistic UI update
        const previousMessages = [...messages];
        if (deleteType === 'for_me') {
            setMessages(prev => prev.filter(m => !selectedMessageIds.includes(m.id)));
        } else {
            setMessages(prev => prev.map(m => selectedMessageIds.includes(m.id) ? { ...m, is_deleted: true, content: 'This message was deleted' } : m));
        }
        setDeleteConfirmModal({ visible: false, messageId: null });
        setSelectedMessageIds([]);
        setSelectionMode(false);

        try {
            await Promise.all(selectedMessageIds.map(id => 
                api.delete(`/chat/messages/${id}`, { data: { senderType: 'user', deleteType } })
                   .catch(err => console.error(`Failed to delete message ${id}`, err))
            ));
        } catch (error) {
            console.error('Failed to perform bulk delete', error);
            setMessages(previousMessages);
            toast.error('Failed to delete some messages');
        }
    };

    const openDeleteModal = (messageId) => {
        setDeleteConfirmModal({ visible: true, messageId });
        setActiveMessageMenuId(null);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsRecording(false);
                setRecordingDuration(0);
                clearInterval(recordingTimerRef.current);

                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                stream.getTracks().forEach(track => track.stop());

                const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

                // Send file directly
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('senderType', 'user');

                    const tempId = `temp-${Date.now()}`;
                    const tempMsg = {
                        id: tempId,
                        content: `[Voice Note]`,
                        sender_type: 'user',
                        created_at: new Date().toISOString(),
                        attachments: [{
                            id: tempId,
                            file_name: file.name,
                            mime_type: file.type
                        }]
                    };
                    setMessages(prev => [...prev, tempMsg]);
                    scrollToBottom();

                    const res = await api.post(`/chat/${activeChat.id}/messages/attachment`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setMessages(prev => {
                        const exists = prev.some(m => m.id === res.data.id && m.id !== tempId);
                        if (exists) return prev.filter(m => m.id !== tempId);
                        return prev.map(m => m.id === tempId ? res.data : m);
                    });
                } catch (error) {
                    console.error('Failed to send voice note:', error);
                    toast.error('Failed to send voice note');
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Failed to start recording:', err);
            toast.error('Could not access microphone');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = null; // Prevent sending
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
        setRecordingDuration(0);
        clearInterval(recordingTimerRef.current);
    };

    // Calculate total unread
    const totalUnread = conversations.reduce((acc, c) => acc + Number(c.unread_count), 0);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-8"
                        onClick={() => setIsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row w-full max-w-6xl origin-center relative border border-gray-200"
                            style={{ height: '100dvh', maxHeight: '900px' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Left Pane */}
                            <div className={`w-full md:w-[340px] lg:w-[400px] flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                                <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-md">
                                            <MessageCircle className="h-5 w-5" />
                                        </div>
                                        <h3 className="font-extrabold text-gray-900 text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">Queuify</h3>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-gray-150 rounded-full text-gray-400 hover:text-gray-700 transition" title="Close Chat">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-3">
                                    {conversations.length === 0 ? (
                                        <div className="text-center text-gray-500 text-sm mt-20 px-8">
                                            <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                            <p>You have no active conversations.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            {conversations.map(conv => (
                                                <button
                                                    key={conv.id}
                                                    onClick={() => handleOpenChat(conv)}
                                                    className={`w-full text-left p-3 rounded-2xl transition flex items-center gap-3 border ${activeChat?.id === conv.id ? 'bg-white border-gray-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-gray-100 hover:shadow-sm'}`}
                                                >
                                                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex-shrink-0 flex items-center justify-center text-indigo-700 font-bold overflow-hidden relative border border-indigo-100">
                                                        {conv.org_avatar ? <img src={conv.org_avatar} alt="Logo" className="w-full h-full object-cover" /> : conv.org_name[0]}
                                                        {Number(conv.disappearing_duration) > 0 && (
                                                            <span className="absolute -bottom-0.5 -right-0.5 bg-indigo-600 border border-white p-0.5 rounded-full shadow text-white">
                                                                <Clock className="w-2.5 h-2.5" />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <h4 className="font-bold text-gray-900 text-[13px] truncate pr-2 flex items-center gap-1">
                                                                {conv.org_name}
                                                                {conv.is_starred_by_user && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />}
                                                            </h4>
                                                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">
                                                                {new Date(conv.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <p className={`text-xs truncate ${Number(conv.unread_count) > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                                                                {conv.last_message?.startsWith('[Media]') 
                                                                    ? (conv.last_message.includes('.webm') ? '🎤 Voice Note' : '📎 Attachment')
                                                                    : (conv.last_message?.startsWith('$$SYSTEM$$:') ? conv.last_message.replace('$$SYSTEM$$:', '') : (conv.last_message || 'Draft'))}
                                                            </p>
                                                            {Number(conv.unread_count) > 0 && (
                                                                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
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
                            </div>

                            {/* Right Pane */}
                            <div className={`flex-1 flex flex-col bg-white relative ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                                {activeChat ? (
                                    <div className="flex flex-col h-full relative z-10 w-full">
                                        {/* Header */}
                                        <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 p-3 sm:p-4 text-gray-900 flex justify-between items-center shadow-sm z-20 sticky top-0">
                                            {selectionMode ? (
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-3">
                                                        <button onClick={() => { setSelectionMode(false); setSelectedMessageIds([]); }} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-600">
                                                            <X className="h-5 w-5" />
                                                        </button>
                                                        <span className="font-semibold text-lg">{selectedMessageIds.length} Selected</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => {
                                                            if (selectedMessageIds.length > 0) {
                                                                setDeleteConfirmModal({ visible: true, messageId: 'bulk' });
                                                            }
                                                        }}
                                                        disabled={selectedMessageIds.length === 0}
                                                        className="px-4 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-semibold text-sm transition disabled:opacity-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <button onClick={handleCloseChat} className="md:hidden p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-gray-600 border border-gray-200">
                                                        <ChevronLeft className="h-5 w-5" />
                                                    </button>
                                                    <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setShowRightPane(!showRightPane)}>
                                                        <div className="relative">
                                                            {activeChat.org_avatar ? (
                                                                <img src={activeChat.org_avatar.startsWith('http') ? activeChat.org_avatar : `http://localhost:5000${activeChat.org_avatar}`} alt={activeChat.org_name} className="w-10 h-10 rounded-full object-cover shadow-sm group-hover:ring-2 group-hover:ring-indigo-300 transition" />
                                                            ) : (
                                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-lg shadow-sm group-hover:ring-2 group-hover:ring-indigo-300 transition">
                                                                    {activeChat.org_name.charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            {partnerPresence.online && (
                                                                <span className="absolute bottom-0 right-0 block h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-white" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-sm truncate max-w-[120px] sm:max-w-[150px] leading-tight group-hover:underline decoration-gray-300">{activeChat.org_name}</h3>
                                                            <p className="text-[11px] text-gray-500 mt-0.5 font-medium leading-none">
                                                                {isPartnerTyping ? (
                                                                    <span className="text-indigo-600 font-bold animate-pulse">typing...</span>
                                                                ) : partnerPresence.online ? (
                                                                    <span className="text-emerald-300 font-medium">Online</span>
                                                                ) : partnerPresence.lastSeen ? (
                                                                    <span>Last seen at {new Date(partnerPresence.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                ) : (
                                                                    <span>Offline</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <div className="relative" ref={disappearingMenuRef}>
                                                        <button
                                                            onClick={() => setShowDisappearingModal(!showDisappearingModal)}
                                                            className={`p-2 rounded-full hover:bg-gray-100 border transition ${Number(activeChat.disappearing_duration) > 0 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-gray-500 border-transparent'}`}
                                                            title="Disappearing Messages"
                                                        >
                                                            <Clock className="h-4.5 w-4.5" />
                                                        </button>
                                                        {showDisappearingModal && (
                                                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-150 rounded-xl shadow-xl z-[9999] overflow-hidden text-gray-800">
                                                                <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                                                                    <p className="text-[10px] font-bold text-gray-505">Disappearing Messages</p>
                                                                </div>
                                                                <div className="p-1">
                                                                    {[
                                                                        { label: 'Off', value: 0 },
                                                                        { label: '24 Hours', value: 86400 },
                                                                        { label: '7 Days', value: 604800 },
                                                                        { label: '90 Days', value: 7776000 }
                                                                    ].map(opt => (
                                                                        <button
                                                                            key={opt.value}
                                                                            onClick={() => handleSetDisappearing(opt.value)}
                                                                            className={`w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg hover:bg-gray-50 transition flex items-center justify-between ${Number(activeChat.disappearing_duration) === opt.value ? 'text-indigo-600 font-bold bg-indigo-50/30' : 'text-gray-700'
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
                                                            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition border border-transparent"
                                                            title="More Options"
                                                        >
                                                            <MoreVertical className="h-4.5 w-4.5" />
                                                        </button>
                                                        {showMoreMenu && (
                                                            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-150 rounded-xl shadow-xl z-60 overflow-hidden text-gray-800 py-1 animate-in fade-in slide-in-from-top-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        handleToggleConversationFlag('starred');
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition text-gray-750"
                                                                >
                                                                    <Star className={`h-3.5 w-3.5 ${activeChat.is_starred_by_user ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                                                    <span>{activeChat.is_starred_by_user ? 'Unstar Org' : 'Star Org'}</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        fetchStarredMessages(activeChat.id);
                                                                        setShowStarredOverlay(true);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition text-gray-755"
                                                                >
                                                                    <Star className="h-3.5 w-3.5 text-indigo-500 fill-indigo-100" />
                                                                    <span>Starred Msgs</span>
                                                                </button>

                                                                <hr className="border-gray-100 my-0.5" />

                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        setShowClearConfirmModal(true);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5 transition text-gray-750"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                                                                    <span>Clear Chat</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        setShowDeleteConfirmModal(true);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 hover:text-rose-600 flex items-center gap-1.5 transition text-gray-750"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-rose-550" />
                                                                    <span>Delete Chat</span>
                                                                </button>

                                                                <hr className="border-gray-100 my-0.5" />

                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        if (activeChat.is_blocked_by_user) {
                                                                            handleToggleConversationFlag('blocked');
                                                                        } else {
                                                                            setShowBlockConfirmModal(true);
                                                                        }
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1.5 transition text-rose-605"
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                    <span>{activeChat.is_blocked_by_user ? 'Unblock Org' : 'Block Org'}</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setShowMoreMenu(false);
                                                                        if (activeChat.is_reported_by_user) {
                                                                            handleToggleConversationFlag('reported');
                                                                        } else {
                                                                            setShowReportConfirmModal(true);
                                                                        }
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-50 hover:text-amber-700 flex items-center gap-1.5 transition text-amber-605"
                                                                >
                                                                    <Flag className="h-3.5 w-3.5" />
                                                                    <span>{activeChat.is_reported_by_user ? 'Cancel Report' : 'Report Org'}</span>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 bg-gray-50 overflow-hidden flex flex-col relative">
                                            {showStarredOverlay ? (
                                                /* Starred Messages Overlay */
                                                <div className="flex-1 flex flex-col bg-white overflow-hidden animate-in fade-in duration-200">
                                                    <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-indigo-50">
                                                        <button
                                                            onClick={() => setShowStarredOverlay(false)}
                                                            className="p-1 hover:bg-indigo-100 rounded-full text-indigo-700 transition"
                                                        >
                                                            <ChevronLeft className="h-4.5 w-4.5" />
                                                        </button>
                                                        <h4 className="font-bold text-gray-900 text-xs flex items-center gap-1">
                                                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                                                            Starred Messages
                                                        </h4>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                                                        {loadingStarred ? (
                                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                                                <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Loading...</span>
                                                            </div>
                                                        ) : starredMessages.length === 0 ? (
                                                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-4">
                                                                <Star className="h-7 w-7 text-gray-200 mb-2" />
                                                                <p className="text-xs">No starred messages yet.</p>
                                                                <p className="text-[10px] text-gray-400 mt-1 max-w-[180px]">Star messages in your chat to see them listed here.</p>
                                                            </div>
                                                        ) : (
                                                            starredMessages.map((msg) => {
                                                                const isStarredMe = msg.sender_type === 'user';
                                                                return (
                                                                    <div key={msg.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm relative group/starredMsg">
                                                                        <div className="flex justify-between items-center mb-1">
                                                                            <span className="text-[10px] font-bold text-indigo-600">
                                                                                {isStarredMe ? 'You' : activeChat.org_name}
                                                                            </span>
                                                                            <span className="text-[9px] text-gray-400">
                                                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                                                                        <button
                                                                            onClick={() => handleToggleStar(msg.id)}
                                                                            className="absolute top-2 right-2 p-1 rounded-full bg-gray-50 hover:bg-rose-50 text-amber-500 hover:text-rose-650 opacity-0 group-hover/starredMsg:opacity-100 transition-all border border-gray-100 shadow-sm"
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
                                            ) : (
                                                /* Active Chat View */
                                                <>
                                                    {messages.filter(m => m.is_pinned).length > 0 && (
                                                        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm z-30 cursor-pointer hover:bg-gray-50 transition-colors"
                                                             onClick={() => {
                                                                 const pinnedMsg = messages.filter(m => m.is_pinned).pop();
                                                                 const el = document.getElementById(`msg-${pinnedMsg.id}`);
                                                                 if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                             }}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Pin className="h-4 w-4 text-indigo-500" />
                                                                <div className="flex flex-col">
                                                                    <span className="text-[11px] font-semibold text-indigo-600">Pinned Message</span>
                                                                    <span className="text-[13px] text-gray-700 line-clamp-1">{messages.filter(m => m.is_pinned).pop().content}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-4 space-y-3 scroll-smooth bg-[#e5e5e5]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundBlendMode: 'overlay', opacity: 0.97 }}>
                                                        {loadingMessages ? (
                                                            <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Loading...</span>
                                                            </div>
                                                        ) : messages.length === 0 ? (
                                                            <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi!</div>
                                                        ) : null}

                                                        {Number(activeChat.disappearing_duration) > 0 && (
                                                            <div className="flex items-center justify-center w-full mb-3 px-2 select-none">
                                                                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-[11px] text-amber-800 shadow-sm text-center">
                                                                    <Clock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 animate-pulse" />
                                                                    <span>
                                                                        Disappearing messages are on. New messages will disappear after {activeChat.disappearing_duration === 86400 ? '24h' : activeChat.disappearing_duration === 604800 ? '7d' : '90d'}.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {!loadingMessages && messages.map((msg, i) => {
                                                            // System message rendering
                                                            if (msg.content && msg.content.startsWith('$$SYSTEM$$:')) {
                                                                const systemText = msg.content.replace('$$SYSTEM$$:', '');
                                                                return (
                                                                    <div key={msg.id || i} className="flex justify-center my-2 w-full select-none">
                                                                        <div className="bg-gray-200/80 text-gray-650 text-[10px] font-semibold px-4 py-1 rounded-full shadow-inner text-center max-w-[280px]">
                                                                            {systemText}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            const isMe = msg.sender_type === 'user';
                                                            return (
                                                                <div
                                                                    key={msg.id || i}
                                                                    id={`msg-${msg.id}`}
                                                                    className={`relative flex items-center w-full group transition-all duration-300 p-0.5 rounded-2xl ${isMe ? 'justify-end' : 'justify-start'} ${(activeMessageMenuId === msg.id || activeReactionMenuMessageId === msg.id) ? 'z-[100]' : 'z-10'}`}
                                                                    onClick={() => {
                                                                        if (selectionMode) {
                                                                            setSelectedMessageIds(prev => 
                                                                                prev.includes(msg.id) ? prev.filter(id => id !== msg.id) : [...prev, msg.id]
                                                                            );
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* Checkbox for Selection Mode */}
                                                                    {selectionMode && (
                                                                        <div className={`flex items-center justify-center cursor-pointer mr-2 ml-2 ${isMe ? 'order-first' : 'order-last'}`}>
                                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedMessageIds.includes(msg.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                                                {selectedMessageIds.includes(msg.id) && <Check className="w-3.5 h-3.5" />}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    {/* Message Bubble Container */}
                                                                    <div className={`flex items-end gap-2 max-w-[95%] sm:max-w-[90%] ${isMe ? 'flex-row-reverse' : 'flex-row'} ${selectionMode ? 'pointer-events-none' : ''}`}>
                                                                    {/* Reply Icon Indicator behind the bubble */}
                                                                    {!isMe && (
                                                                        <div className="absolute left-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
                                                                            <CornerUpLeft className="h-4 w-4 text-indigo-600" />
                                                                        </div>
                                                                    )}
                                                                    {isMe && (
                                                                        <div className="absolute right-2 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity">
                                                                            <CornerUpLeft className="h-4 w-4 text-indigo-600" />
                                                                        </div>
                                                                    )}

                                                                    <motion.div
                                                                        drag="x"
                                                                        dragConstraints={isMe ? { left: -60, right: 0 } : { left: 0, right: 60 }}
                                                                        dragElastic={0.4}
                                                                        dragSnapToOrigin={true}
                                                                        onDragEnd={(e, info) => {
                                                                            const threshold = 35;
                                                                            if (!isMe && info.offset.x > threshold) {
                                                                                setReplyingTo(msg);
                                                                            } else if (isMe && info.offset.x < -threshold) {
                                                                                setReplyingTo(msg);
                                                                            }
                                                                        }}
                                                                        className="relative z-10 max-w-[95%] sm:max-w-[90%]"
                                                                    >
                                                                        {/* Quoted Reply Box inside bubble */}
                                                                        {msg.reply_to_id && (
                                                                            <div
                                                                                onClick={() => {
                                                                                    const el = document.getElementById(`msg-${msg.reply_to_id}`);
                                                                                    if (el) {
                                                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                                        el.classList.add('bg-indigo-100/50', 'ring-2', 'ring-indigo-500');
                                                                                        setTimeout(() => {
                                                                                            el.classList.remove('bg-indigo-100/50', 'ring-2', 'ring-indigo-500');
                                                                                        }, 1500);
                                                                                    }
                                                                                }}
                                                                                className={`mb-1 p-2 rounded-lg text-[11px] cursor-pointer border-l-4 select-none ${isMe
                                                                                        ? 'bg-indigo-700/50 border-white text-indigo-100'
                                                                                        : 'bg-gray-100 border-indigo-500 text-gray-600'
                                                                                    }`}
                                                                            >
                                                                                <div className="font-bold mb-0.5">
                                                                                    {msg.reply_to_sender_type === 'user' ? 'You' : activeChat?.org_name || 'Support'}
                                                                                </div>
                                                                                <p className="truncate max-w-[200px]">{msg.reply_to_content}</p>
                                                                            </div>
                                                                        )}
                                                                        <div 
                                                                            onContextMenu={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id);
                                                                            }}
                                                                            className={`relative px-3 py-2 text-[15px] shadow-sm transition-all ${isMe
                                                                                ? 'bg-[#dcf8c6] text-gray-900 border border-green-200/50'
                                                                                : 'bg-white text-gray-900 border border-gray-100'
                                                                                } ${msg.showTail
                                                                                    ? (isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm')
                                                                                    : 'rounded-2xl'
                                                                                }`}
                                                                        >
                                                                            {/* Pinned Indicator on Message */}
                                                                            {msg.is_pinned && (
                                                                                <div className={`absolute top-0 flex items-center ${isMe ? '-left-5' : '-right-5'} text-gray-400`} title="Pinned">
                                                                                    <Pin size={13} className="rotate-45" />
                                                                                </div>
                                                                            )}
                                                                            {/* WhatsApp-style Tail */}
                                                                            {msg.showTail && (
                                                                                <svg viewBox="0 0 8 13" width="8" height="13" className={`absolute top-0 ${isMe ? "-right-1.5 text-[#dcf8c6]" : "-left-1.5 text-white"}`} style={{ filter: "drop-shadow(0px 1px 1px rgba(0,0,0,0.05))" }}>
                                                                                    <path fill="currentColor" d={isMe ? "M8 0L0 0L0 13C0 13 4.2 8.7 8 0Z" : "M0 0L8 0L8 13C8 13 3.8 8.7 0 0Z"} />
                                                                                </svg>
                                                                            )}

                                                                            {/* Hover Reply Button */}
                                                                            <button
                                                                                onClick={() => setReplyingTo(msg)}
                                                                                className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm ${isMe ? '-left-8 text-gray-500 hover:text-indigo-600' : '-right-8 text-gray-500 hover:text-indigo-600'
                                                                                    }`}
                                                                                title="Reply"
                                                                            >
                                                                                <CornerUpLeft className="h-3 w-3" />
                                                                            </button>

                                                                            {/* Hover Reaction Button */}
                                                                            <button

                                                                                type="button"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setActiveReactionMenuMessageId(activeReactionMenuMessageId === msg.id ? null : msg.id);
                                                                                }}
                                                                                className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-full shadow-sm text-gray-500 hover:text-yellow-500 ${isMe ? '-left-16' : '-right-16'
                                                                                    }`}
                                                                                title="React"
                                                                            >
                                                                                <Smile className="h-3 w-3" />
                                                                            </button>


                                                                            {/* Dropdown Options Menu */}
                                                                            {activeMessageMenuId === msg.id && (
                                                                                <>
                                                                                    <div className="fixed inset-0 z-[99998]" onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(null); }}></div>
                                                                                    <div
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className={`absolute top-2 ${isMe ? 'right-2' : 'left-2'} w-36 bg-white border border-gray-150 rounded-xl shadow-2xl z-[99999] py-1 text-gray-800 animate-in fade-in slide-in-from-top-1`}
                                                                                    >
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setSelectionMode(true);
                                                                                            setSelectedMessageIds([msg.id]);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-indigo-50 flex items-center gap-1.5 transition text-indigo-700 font-medium"
                                                                                    >
                                                                                        <CheckSquare className="h-3 w-3" />
                                                                                        <span>Select</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setReplyingTo(msg);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition"
                                                                                    >
                                                                                        <CornerUpLeft className="h-3 w-3 text-gray-400" />
                                                                                        <span>Reply</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handlePinMessage(msg.id);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition"
                                                                                    >
                                                                                        {msg.is_pinned ? <PinOff className="h-3 w-3 text-gray-400" /> : <Pin className="h-3 w-3 text-gray-400" />}
                                                                                        <span>{msg.is_pinned ? 'Unpin' : 'Pin'}</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleCopyMessage(msg.content);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition"
                                                                                    >
                                                                                        <Copy className="h-3 w-3 text-gray-400" />
                                                                                        <span>Copy</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            handleToggleStar(msg.id);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition"
                                                                                    >
                                                                                        <Star className={`h-3 w-3 ${msg.is_starred ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                                                                        <span>{msg.is_starred ? 'Unstar' : 'Star'}</span>
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            setInfoMessage(msg);
                                                                                            setActiveMessageMenuId(null);
                                                                                        }}
                                                                                        className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition"
                                                                                    >
                                                                                        <Info className="h-3 w-3 text-gray-400" />
                                                                                        <span>Info</span>
                                                                                    </button>
                                                                                    {isMe && (
                                                                                        <>
                                                                                            {!msg.is_deleted && (
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setEditingMessage(msg);
                                                                                                        setInput(msg.content);
                                                                                                        setActiveMessageMenuId(null);
                                                                                                    }}
                                                                                                    className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-1.5 transition text-gray-700"
                                                                                                >
                                                                                                    <Edit2 className="h-3 w-3 text-gray-400" />
                                                                                                    <span>Edit</span>
                                                                                                </button>
                                                                                            )}
                                                                                            <button
                                                                                                onClick={() => openDeleteModal(msg.id)}
                                                                                                className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-rose-50 flex items-center gap-1.5 transition text-rose-600"
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3" />
                                                                                                <span>Delete</span>
                                                                                            </button>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                                </>
                                                                            )}

                                                                            {/* Reactions Popover Menu */}
                                                                            {activeReactionMenuMessageId === msg.id && !showFullReactionPicker && (
                                                                                <div className={`absolute bottom-full mb-1 bg-white border border-gray-150 rounded-full px-1.5 py-1 shadow-lg flex gap-0.5 z-30 animate-in fade-in slide-in-from-bottom-1 ${isMe ? 'right-0' : 'left-0'
                                                                                    }`}>
                                                                                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                                                                                        <button
                                                                                            key={emoji}
                                                                                            type="button"
                                                                                            onClick={() => handleReactMessage(msg.id, emoji)}
                                                                                            className="hover:scale-125 transition-transform px-0.5 text-base duration-150"
                                                                                        >
                                                                                            {emoji}
                                                                                        </button>
                                                                                    ))}
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={(e) => { e.stopPropagation(); setShowFullReactionPicker(msg.id); }}
                                                                                        className="hover:scale-125 transition-transform px-1 text-base duration-150 text-gray-500 font-bold ml-1 flex items-center justify-center"
                                                                                        title="More Emojis"
                                                                                    >
                                                                                        +
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                            {showFullReactionPicker === msg.id && (
                                                                                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20" onClick={(e) => { e.stopPropagation(); setShowFullReactionPicker(null); setActiveReactionMenuMessageId(null); }}>
                                                                                    <div onClick={(e) => e.stopPropagation()} className="shadow-2xl rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                                                                                        <EmojiPicker
                                                                                            onEmojiClick={(e) => { handleReactMessage(msg.id, e.emoji); setShowFullReactionPicker(null); setActiveReactionMenuMessageId(null); }}
                                                                                            width={280}
                                                                                            height={300}
                                                                                            lazyLoadEmojis={true}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Render Attachments */}
                                                                            {msg.attachments && msg.attachments.length > 0 && (
                                                                                <div className="space-y-1.5 mb-1.5 select-none">
                                                                                    {msg.attachments.map((att) => {
                                                                                        const isImg = att.mime_type?.startsWith('image/');
                                                                                        const attachmentUrl = `${api.defaults.baseURL}/chat/messages/attachment/${att.id}`;
                                                                                        if (isImg) {
                                                                                            return (
                                                                                                <div key={att.id} className="relative group/attachment overflow-hidden rounded-lg border border-gray-100 shadow-inner">
                                                                                                    <img
                                                                                                        src={attachmentUrl}
                                                                                                        alt={att.file_name}
                                                                                                        className="max-w-[280px] sm:max-w-[450px] md:max-w-[500px] max-h-96 object-contain bg-white rounded-lg cursor-pointer transition hover:scale-[1.02] duration-200"
                                                                                                        onClick={() => setActiveLightboxImage(attachmentUrl)}
                                                                                                    />
                                                                                                    <div className="absolute top-1 right-1 opacity-0 group-hover/attachment:opacity-100 transition-opacity">
                                                                                                        <a
                                                                                                            href={attachmentUrl}
                                                                                                            download={att.file_name}
                                                                                                            target="_blank"
                                                                                                            rel="noreferrer"
                                                                                                            className="p-1 bg-black/60 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition shadow"
                                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                                        >
                                                                                                            <Download className="w-3.5 h-3.5" />
                                                                                                        </a>
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        } else if (att.mime_type?.startsWith('audio/')) {
                                                                                            return (
                                                                                                <div key={att.id} className="my-1 rounded-xl overflow-hidden shadow-sm">
                                                                                                    <audio src={attachmentUrl} controls controlsList="nodownload noplaybackrate" className="h-10 w-[240px] [&::-webkit-media-controls-volume-slider]:hidden [&::-webkit-media-controls-mute-button]:hidden [&::-webkit-media-controls-playback-rate-button]:hidden" />
                                                                                                </div>
                                                                                            );
                                                                                        } else {
                                                                                            return (
                                                                                                <div key={att.id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl max-w-[200px] text-gray-800 animate-in fade-in">
                                                                                                    <FileText className="h-6 w-6 text-indigo-600 flex-shrink-0 animate-pulse" />
                                                                                                    <div className="flex-1 min-w-0">
                                                                                                        <p className="font-semibold text-[11px] truncate">{att.file_name}</p>
                                                                                                        <p className="text-[8px] text-gray-400 uppercase font-medium">{att.mime_type?.split('/')[1] || 'FILE'}</p>
                                                                                                    </div>
                                                                                                    <a
                                                                                                        href={attachmentUrl}
                                                                                                        download={att.file_name}
                                                                                                        target="_blank"
                                                                                                        rel="noreferrer"
                                                                                                        className="p-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-600 flex items-center justify-center transition flex-shrink-0"
                                                                                                    >
                                                                                                        <Download className="w-3 h-3" />
                                                                                                    </a>
                                                                                                </div>
                                                                                            );
                                                                                        }
                                                                                    })}
                                                                                </div>
                                                                            )}

                                                                            <div className={`whitespace-pre-wrap ${msg.is_deleted ? (isMe ? 'italic text-indigo-200' : 'italic text-gray-400') : ''}`}>
                                                                                {msg.is_deleted ? (
                                                                                    <span className="flex items-center gap-1.5 text-sm"><Ban className="h-3.5 w-3.5" /> This message was deleted</span>
                                                                                ) : (
                                                                                    <p>
                                                                                        {!(msg.content?.startsWith('[Media]') || msg.content === '[Voice Note]') && msg.content}
                                                                                        {msg.is_edited && <span className="text-[10px] opacity-70 ml-1.5 font-medium">(edited)</span>}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                            <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                                                {msg.is_starred && (
                                                                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-0.5 flex-shrink-0" />
                                                                                )}
                                                                                <span className="text-[10px]">
                                                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                                {isMe && (
                                                                                    msg.is_read ? (
                                                                                        <CheckCheck
                                                                                            className="h-3.5 w-3.5 text-emerald-300"
                                                                                            title={msg.read_at ? `Seen at ${new Date(msg.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Seen'}
                                                                                        />
                                                                                    ) : (
                                                                                        <Check className="h-3.5 w-3.5 text-indigo-200 opacity-70" title="Sent" />
                                                                                    )
                                                                                )}
                                                                            </div>

                                                                            {/* Reactions Badge */}
                                                                            {msg.reactions && msg.reactions.length > 0 && (
                                                                                <div className="absolute -bottom-3 right-2 flex items-center bg-white border border-gray-150 rounded-full px-1.5 py-1 shadow-sm text-[13px] gap-0.5 select-none z-20 hover:scale-105 transition-transform duration-200 cursor-pointer text-gray-800">
                                                                                    <span className="flex items-center gap-0.5">
                                                                                        {[...new Set(msg.reactions.map(r => r.emoji))].map(emoji => (
                                                                                            <span 
                                                                                                key={emoji} 
                                                                                                title={msg.reactions.filter(r => r.emoji === emoji).map(r => r.user_name).join(', ')}
                                                                                                onClick={(e) => { e.stopPropagation(); handleReactMessage(msg.id, emoji); }}
                                                                                                className="hover:scale-110 transition-transform cursor-pointer"
                                                                                            >
                                                                                                {emoji}
                                                                                            </span>
                                                                                        ))}
                                                                                    </span>
                                                                                    {msg.reactions.length > 1 && (
                                                                                        <span className="text-[9px] text-gray-500 font-bold ml-0.5">{msg.reactions.length}</span>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {isPartnerTyping && (
                                                            <div className="flex justify-start">
                                                                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2 text-xs shadow-sm max-w-[80%] flex items-center gap-1.5">
                                                                    <span className="font-semibold mr-1">Support typing</span>
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                                                        <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                                                        <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div ref={messagesEndRef} />
                                                    </div>
                                                    <div className="p-3 bg-white border-t border-gray-100 relative">
                                                        {/* Reply Preview Banner */}
                                                        {replyingTo && (
                                                            <div className="mb-2 bg-indigo-50/80 border border-indigo-100 rounded-xl p-2 flex justify-between items-center text-xs shadow-sm">
                                                                <div className="flex-1 min-w-0 border-l-4 border-indigo-600 pl-2">
                                                                    <div className="font-bold text-indigo-700 text-[10px]">
                                                                        Replying to {replyingTo.sender_type === 'user' ? 'You' : activeChat?.org_name || 'Support'}
                                                                    </div>
                                                                    <p className="text-gray-600 truncate text-[11px] mt-0.5">{replyingTo.content}</p>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReplyingTo(null)}
                                                                    className="p-1 hover:bg-indigo-100 rounded-full text-indigo-650 transition ml-2"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedFile && (
                                                            <div className="mb-2 bg-gray-50 border border-gray-200 rounded-xl p-2 flex justify-between items-center text-xs shadow-sm select-none">
                                                                <div className="flex items-center gap-2">
                                                                    {filePreview ? (
                                                                        <img src={filePreview} alt="Preview" className="w-8 h-8 object-cover rounded border border-gray-150" />
                                                                    ) : (
                                                                        <div className="w-8 h-8 bg-indigo-50 text-indigo-650 rounded flex items-center justify-center border border-indigo-100">
                                                                            <FileText className="h-4 w-4 animate-pulse" />
                                                                        </div>
                                                                    )}
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-[10px] truncate max-w-[120px]">{selectedFile.name}</p>
                                                                        <p className="text-[8px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedFile(null);
                                                                        if (filePreview) URL.revokeObjectURL(filePreview);
                                                                        setFilePreview(null);
                                                                    }}
                                                                    className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition ml-2"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        )}

                                                        {showEmojiPicker && (
                                                            <div className="absolute bottom-full left-0 mb-2 z-[150] shadow-2xl" ref={emojiPickerRef}>
                                                                <EmojiPicker
                                                                    onEmojiClick={onEmojiClick}
                                                                    width={300}
                                                                    height={350}
                                                                    lazyLoadEmojis={true}
                                                                />
                                                            </div>
                                                        )}

                                                        {activeChat.is_blocked_by_admin || activeChat.is_blocked_by_user ? (
                                                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm select-none">
                                                                <Ban className="h-6 w-6 text-rose-500 mb-1.5 animate-pulse" />
                                                                <p className="text-gray-700 font-semibold text-xs">
                                                                    {activeChat.is_blocked_by_user
                                                                        ? 'You blocked this organization. Unblock to send messages.'
                                                                        : 'You have been blocked by this organization.'}
                                                                </p>
                                                                {activeChat.is_blocked_by_user && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleToggleConversationFlag('blocked')}
                                                                        className="mt-2 px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-semibold shadow-sm transition"
                                                                    >
                                                                        Unblock
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <>
                                                                {editingMessage && (
                                                                    <div className="mb-2 bg-amber-50 border border-amber-200 rounded-xl p-2 flex justify-between items-center text-xs shadow-sm">
                                                                        <div className="flex-1 min-w-0 border-l-4 border-amber-500 pl-2">
                                                                            <div className="font-bold text-amber-700 text-[10px]">
                                                                                Editing Message
                                                                            </div>
                                                                            <p className="text-gray-600 truncate text-[11px] mt-0.5">{editingMessage.content}</p>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => { setEditingMessage(null); setInput(''); }}
                                                                            className="p-1 hover:bg-amber-100 rounded-full text-amber-600 transition ml-2"
                                                                        >
                                                                            <X className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    </div>
                                                                )}

                                                                {isRecording ? (
                                                                    <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-full px-4 py-2 text-sm shadow-inner w-full">
                                                                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
                                                                        <span className="text-red-600 font-medium font-mono text-xs flex-1">
                                                                            {formatDuration(recordingDuration)}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={cancelRecording}
                                                                            className="text-gray-400 hover:text-red-500 transition p-1.5 hover:bg-red-100 rounded-full"
                                                                            title="Cancel"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={stopRecording}
                                                                            className="bg-red-500 text-white p-2 rounded-full shadow-md hover:bg-red-600 transition"
                                                                            title="Send Voice Note"
                                                                        >
                                                                            <Send className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <form onSubmit={editingMessage ? (e) => { e.preventDefault(); handleEditMessage(); } : handleSendMessage} className="flex items-end gap-2 p-2 relative bg-white border-t border-gray-200 shadow-sm">
                                                                        {!editingMessage && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => fileInputRef.current?.click()}
                                                                                className="p-2 rounded-full transition text-gray-400 hover:bg-gray-100"
                                                                                title="Attach File"
                                                                            >
                                                                                <Paperclip className="h-5 w-5" />
                                                                            </button>
                                                                        )}
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
                                                                            className={`p-2 rounded-full transition flex-shrink-0 ${showEmojiPicker ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                                                        >
                                                                            <Smile className="h-5 w-5" />
                                                                        </button>
                                                                        <input
                                                                            type="text"
                                                                            value={input}
                                                                            onChange={handleTyping}
                                                                            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                                                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 min-w-0"
                                                                        />

                                                                        {input.trim() || selectedFile || editingMessage ? (
                                                                            <button
                                                                                type="submit"
                                                                                className="bg-indigo-600 text-white p-2.5 rounded-full hover:bg-indigo-700 transition flex-shrink-0 shadow-sm"
                                                                                title={editingMessage ? "Save Edit" : "Send"}
                                                                            >
                                                                                {editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                                                                            </button>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={startRecording}
                                                                                className="bg-indigo-100 text-indigo-600 p-2.5 rounded-full hover:bg-indigo-200 transition flex-shrink-0 text-center"
                                                                                title="Hold to Record"
                                                                            >
                                                                                <Mic className="h-4 w-4" />
                                                                            </button>
                                                                        )}
                                                                    </form>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 relative z-10 w-full h-full">
                                        <div className="w-24 h-24 bg-white rounded-full shadow-sm flex items-center justify-center mb-6 border border-gray-100">
                                            <MessageCircle className="h-10 w-10 text-indigo-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Your Messages</h3>
                                        <p className="text-sm text-gray-500 max-w-sm text-center">Select a conversation from the sidebar to view your messages and chat with organizations.</p>
                                    </div>
                                )}

                                {/* Right Pane Close Button */}
                                {!activeChat && (
                                    <button onClick={() => setIsOpen(false)} className="absolute top-6 right-6 p-2 bg-white hover:bg-gray-100 rounded-full text-gray-600 shadow-md border border-gray-200 z-50 hidden md:flex transition hover:scale-105">
                                        <X className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                            
                            {/* NEW: Info Sidebar (Right Pane) */}
                            {activeChat && showRightPane && (
                                <div className="w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex flex-col border-l border-gray-200 bg-white absolute inset-0 z-30 md:relative md:z-auto animate-in slide-in-from-right-8 duration-300">
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 sticky top-0 z-10">
                                        <h3 className="font-bold text-gray-900">Contact Info</h3>
                                        <button onClick={() => setShowRightPane(false)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        <div className="p-6 flex flex-col items-center border-b border-gray-100">
                                            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-100 to-indigo-50 flex items-center justify-center text-indigo-700 font-bold text-3xl shadow-sm border border-indigo-200/50 mb-4">
                                                {activeChat.org_name.charAt(0).toUpperCase()}
                                            </div>
                                            <h2 className="text-xl font-bold text-gray-900 text-center">{activeChat.org_name}</h2>
                                            {activeChat.org_category && <p className="text-sm text-gray-500 mt-1 capitalize font-medium">{activeChat.org_category}</p>}
                                        </div>
                                        
                                        <div className="p-5 border-b border-gray-100 space-y-4 text-sm">
                                            {activeChat.org_phone && (
                                                <div className="flex items-start gap-3 text-gray-700">
                                                    <div className="mt-0.5 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Phone</p>
                                                        <p>{activeChat.org_phone}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activeChat.org_email && (
                                                <div className="flex items-start gap-3 text-gray-700">
                                                    <div className="mt-0.5 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Email</p>
                                                        <p>{activeChat.org_email}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {activeChat.org_address && (
                                                <div className="flex items-start gap-3 text-gray-700">
                                                    <div className="mt-0.5 text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">Address</p>
                                                        <p>{activeChat.org_address}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-4 space-y-2">
                                            <button onClick={() => { setShowRightPane(false); setShowDisappearingModal(true); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left transition text-gray-700 font-medium">
                                                <Clock className="h-5 w-5 text-emerald-500" />
                                                <span>Disappearing Messages</span>
                                            </button>
                                            <button onClick={() => { setShowRightPane(false); setShowClearConfirmModal(true); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-left transition text-gray-700 font-medium">
                                                <Trash2 className="h-5 w-5 text-gray-400" />
                                                <span>Clear Chat</span>
                                            </button>
                                            <button onClick={() => { setShowRightPane(false); setShowBlockConfirmModal(true); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-left transition text-rose-600 font-medium">
                                                <Ban className="h-5 w-5" />
                                                <span>{activeChat.is_blocked_by_user ? 'Unblock Organization' : 'Block Organization'}</span>
                                            </button>
                                            <button onClick={() => { setShowRightPane(false); setShowReportConfirmModal(true); }} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-left transition text-rose-600 font-medium">
                                                <Flag className="h-5 w-5" />
                                                <span>{activeChat.is_reported_by_user ? 'Cancel Report' : 'Report Organization'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <div className="fixed bottom-6 right-6 z-50">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl shadow-indigo-200 hover:bg-indigo-700 transition relative border-2 border-white"
                    >
                        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                        {!isOpen && totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {totalUnread}
                            </span>
                        )}
                    </motion.button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmModal.visible && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-end sm:items-center justify-center p-4"
                        onClick={() => setDeleteConfirmModal({ visible: false, messageId: null })}
                    >
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                                        <Trash2 className="h-5 w-5 text-rose-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-base">Delete Message</h3>
                                        <p className="text-xs text-gray-500">Choose who you want to delete this for</p>
                                    </div>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="p-4 flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        if (deleteConfirmModal.messageId === 'bulk') {
                                            handleBulkDelete('for_me');
                                        } else {
                                            handleDeleteMessage(deleteConfirmModal.messageId, 'for_me');
                                        }
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition text-left group"
                                >
                                    <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition">
                                        <span className="text-base">👤</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-800 text-sm group-hover:text-indigo-700 transition">Delete for Me</div>
                                        <div className="text-xs text-gray-400 mt-0.5">This message will be removed only from your view</div>
                                    </div>
                                </button>

                                {(deleteConfirmModal.messageId === 'bulk' 
                                    ? selectedMessageIds.every(id => { const m = messages.find(msg => msg.id === id); return m && !m.is_deleted && m.sender_type === 'user'; })
                                    : (messages.find(m => m.id === deleteConfirmModal.messageId) && !messages.find(m => m.id === deleteConfirmModal.messageId).is_deleted)) && (
                                    <button
                                        onClick={() => {
                                            if (deleteConfirmModal.messageId === 'bulk') {
                                                handleBulkDelete('for_everyone');
                                            } else {
                                                handleDeleteMessage(deleteConfirmModal.messageId, 'for_everyone');
                                            }
                                        }}
                                        className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-gray-100 hover:border-rose-200 hover:bg-rose-50 transition text-left group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gray-100 group-hover:bg-rose-100 flex items-center justify-center flex-shrink-0 transition">
                                            <span className="text-base">🌐</span>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-800 text-sm group-hover:text-rose-600 transition">Delete for Everyone</div>
                                            <div className="text-xs text-gray-400 mt-0.5">This message will be removed for all participants</div>
                                        </div>
                                    </button>
                                )}
                            </div>

                            {/* Cancel */}
                            <div className="px-4 pb-4">
                                <button
                                    onClick={() => setDeleteConfirmModal({ visible: false, messageId: null })}
                                    className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Lightbox Modal */}
            <AnimatePresence>
                {activeLightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                        onClick={() => setShowClearConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Clear chat history?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This will permanently delete all messages and files in this conversation. This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowClearConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearChat}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    Clear Chat
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
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
                                <h3 className="text-lg font-bold text-gray-900">Message Info</h3>
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
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sent / Delivered</p>
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
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Read / Seen</p>
                                        <p className="text-sm text-gray-800 font-semibold mt-0.5">
                                            {infoMessage.is_read && infoMessage.read_at ? (
                                                new Date(infoMessage.read_at).toLocaleString()
                                            ) : infoMessage.is_read ? (
                                                'Seen'
                                            ) : (
                                                'Not seen yet'
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                        onClick={() => setShowDeleteConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete chat?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Are you sure you want to delete this chat? This will remove the conversation from your inbox.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDeleteConfirmModal(false);
                                        handleToggleConversationFlag('deleted');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    Delete
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                        onClick={() => setShowBlockConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Block organization?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Blocked organizations cannot message you. You can unblock them at any time.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowBlockConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowBlockConfirmModal(false);
                                        handleToggleConversationFlag('blocked');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-200"
                                >
                                    Block
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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                        onClick={() => setShowReportConfirmModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-gray-800"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Report organization?</h3>
                            <p className="text-sm text-gray-500 mb-6">
                                This organization will be reported for review. Your recent message history with them may be analyzed.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowReportConfirmModal(false)}
                                    className="px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowReportConfirmModal(false);
                                        handleToggleConversationFlag('reported');
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-md shadow-amber-200"
                                >
                                    Report
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
