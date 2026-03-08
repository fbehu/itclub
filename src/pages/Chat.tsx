import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, ArrowLeft, Loader2, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';

interface Message {
  id: string;
  text: string;
  sender: User;
  receiver: User;
  is_read?: boolean;
  created_at: string;
  file?: string;
  file_name?: string;
}

interface User {
  id: string;
  username?: string;
  first_name: string;
  last_name: string;
  photo?: string;
}

interface Admin {
  id: string;
  first_name: string;
  last_name: string;
  photo?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  photo?: string;
  direction?: string;
  group?: string;
  role?: string;
}

interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  photo?: string;
  role: 'admin' | 'manager' | 'student' | 'sub_teacher' | 'teacher';
  unread_count?: number;
  level?: string | null;
  direction?: string;
  group?: string;
}

export default function Chat() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteIsTyping, setRemoteIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsRetries, setWsRetries] = useState(0);
  const [isFullPage, setIsFullPage] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const typingSocketRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pollIntervalRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    const state = location.state as { selectedUserId?: string };
    if (state?.selectedUserId && chatUsers.length > 0) {
      const userToSelect = chatUsers.find(u => u.id === state.selectedUserId);
      if (userToSelect) {
        setSelectedUser(userToSelect);
        setShowChat(true);
      }
    }
  }, [location.state, chatUsers]);

  useEffect(() => {
    if (selectedUser && user) {
      loadMessages();
      connectWebSockets();
      markAsRead();
      return () => {
        disconnectWebSockets();
      };
    }
  }, [selectedUser, user]);

  const getWebSocketProtocol = () => {
    return window.location.protocol === 'https:' ? 'wss' : 'ws';
  };

  const getWebSocketHost = () => {
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
    if (isDevelopment) return 'localhost:8000';
    return 'admin.onedu.uz';
  };

  const connectWebSockets = () => {
    if (!user?.id || !selectedUser?.id) return;
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️  Autentifikatsiya tokeni topilmadi, polling-dan foydalanilmoqda');
      startPolling();
      return;
    }
    const wsProtocol = getWebSocketProtocol();
    const wsHost = getWebSocketHost();
    const chatWsUrl = `${wsProtocol}://${wsHost}/ws/chat/${user.id}/?token=${token}`;
    console.log('🔗 Connecting to chat WebSocket:', chatWsUrl);
    try {
      chatSocketRef.current = new WebSocket(chatWsUrl);
      let chatConnectTimeout: NodeJS.Timeout;
      chatSocketRef.current.onopen = () => {
        clearTimeout(chatConnectTimeout);
        console.log('✅ Chat WebSocket connected');
        setWsConnected(true);
        setWsRetries(0);
        stopPolling();
        connectTypingWebSocket();
      };
      chatSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.sender_id === selectedUser.id) {
            const newMsg: Message = {
              id: data.message.id, text: data.message.text,
              sender: data.message.sender, receiver: data.message.receiver,
              is_read: false, created_at: data.message.created_at,
              file: data.message.file, file_name: data.message.file_name,
            };
            setMessages(prev => [...prev, newMsg]);
          } else if (data.type === 'message_sent' && data.status === 'success') {
            const newMsg: Message = {
              id: data.message.id, text: data.message.text,
              sender: data.message.sender, receiver: data.message.receiver,
              is_read: true, created_at: data.message.created_at,
              file: data.message.file, file_name: data.message.file_name,
            };
            setMessages(prev => [...prev, newMsg]);
            setNewMessage('');
            setSelectedFile(null);
            setIsSending(false);
            toast.success('Xabar yuborildi');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      chatSocketRef.current.onerror = (error) => {
        clearTimeout(chatConnectTimeout);
        console.error('❌ Chat WebSocket error:', error);
        setWsConnected(false);
        startPolling();
      };
      chatSocketRef.current.onclose = () => {
        clearTimeout(chatConnectTimeout);
        console.log('⚠️  Chat WebSocket disconnected');
        setWsConnected(false);
        if (typingSocketRef.current) {
          typingSocketRef.current.close();
          typingSocketRef.current = null;
        }
        if (wsRetries < 3) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`🔄 Reconnecting WebSocket... (attempt ${wsRetries + 1}/3)`);
            setWsRetries(prev => prev + 1);
            connectWebSockets();
          }, 5000);
        } else {
          console.warn('❌ Max WebSocket reconnection attempts reached, using polling indefinitely');
          startPolling();
        }
      };
      chatConnectTimeout = setTimeout(() => {
        if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.CONNECTING) {
          console.warn('⏱️  Chat WebSocket connection timeout, falling back to polling');
          chatSocketRef.current.close();
          setWsConnected(false);
          startPolling();
        }
      }, 5000);
    } catch (error) {
      console.error('Error creating chat WebSocket:', error);
      setWsConnected(false);
      startPolling();
    }
  };

  const connectTypingWebSocket = () => {
    if (!user?.id || !selectedUser?.id || !wsConnected) return;
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const wsProtocol = getWebSocketProtocol();
    const wsHost = getWebSocketHost();
    const typingWsUrl = `${wsProtocol}://${wsHost}/ws/typing/${user.id}/?token=${token}`;
    try {
      typingSocketRef.current = new WebSocket(typingWsUrl);
      typingSocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'typing_indicator' && data.sender_id === selectedUser.id) {
            setRemoteIsTyping(data.is_typing);
          }
        } catch (err) {
          console.error('Error parsing typing indicator:', err);
        }
      };
      typingSocketRef.current.onerror = () => {};
      typingSocketRef.current.onclose = () => {};
    } catch (error) {
      console.warn('Warning: Could not connect typing WebSocket:', error);
    }
  };

  const startPolling = () => {
    pollIntervalRef.current = setInterval(() => {
      if (selectedUser) loadMessages();
    }, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = undefined;
    }
  };

  const disconnectWebSockets = () => {
    if (chatSocketRef.current) { chatSocketRef.current.close(); chatSocketRef.current = null; }
    if (typingSocketRef.current) { typingSocketRef.current.close(); typingSocketRef.current = null; }
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    stopPolling();
  };

  const loadConversations = async () => {
    try {
      const response = await authFetch('/message/conversations/');
      if (response.ok) {
        const data = await response.json();
        const conversations = Array.isArray(data) ? data : data.results || data.conversations || [];
        setChatUsers(
          conversations
            .filter((conv: any) => conv && conv.id)
            .map((conv: any) => ({
              id: conv.id || '',
              first_name: conv.first_name || conv.user?.first_name || 'Unknown',
              last_name: conv.last_name || conv.user?.last_name || 'User',
              photo: conv.photo || conv.user?.photo || '',
              role: conv.role || conv.user?.role || 'student',
              unread_count: conv.unread_count || conv.unread_message_count || 0,
              level: conv.level || conv.user?.level || null,
              direction: conv.direction || conv.user?.direction || undefined,
              group: conv.group || conv.user?.group || undefined,
            }))
        );
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Suhbatlarni yuklashda xato');
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;
    try {
      setIsLoadingMessages(true);
      const response = await authFetch(`/message/messages/?user_id=${selectedUser.id}`);
      if (response.ok) {
        const data = await response.json();
        const messagesList = Array.isArray(data) ? data : data.results || data.messages || [];
        setMessages(messagesList);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const markAsRead = async () => {
    if (!selectedUser) return;
    try {
      await authFetch('/message/mark-read/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: selectedUser.id }),
      });
      setChatUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, unread_count: 0 } : u));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!selectedUser) { toast.error('Suhbat tanlang'); return; }
    setIsSending(true);
    setIsTyping(false);
    try {
      if (chatSocketRef.current?.readyState === WebSocket.OPEN) {
        chatSocketRef.current.send(JSON.stringify({
          type: 'send_message', receiver_id: selectedUser.id, text: newMessage.trim(),
        }));
      } else {
        const formData = new FormData();
        formData.append('text', newMessage.trim());
        formData.append('receiver_id', selectedUser.id);
        if (selectedFile) formData.append('file', selectedFile);
        const response = await authFetch('/message/add/', { method: 'POST', body: formData });
        if (response.ok) {
          const sentMessage = await response.json();
          const newMsg: Message = {
            id: sentMessage.id, text: sentMessage.text,
            sender: sentMessage.sender, receiver: sentMessage.receiver,
            is_read: true, created_at: sentMessage.created_at,
            file: sentMessage.file, file_name: sentMessage.file_name,
          };
          setMessages(prev => [...prev, newMsg]);
          setNewMessage('');
          setSelectedFile(null);
          toast.success('Xabar yuborildi');
        } else {
          toast.error('Xabar yuborishda xato');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Xabar yuborishda xato');
    } finally {
      setIsSending(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setNewMessage(text);
    if (text.trim() && typingSocketRef.current?.readyState === WebSocket.OPEN) {
      if (!isTyping) {
        setIsTyping(true);
        typingSocketRef.current.send(JSON.stringify({ receiver_id: selectedUser?.id, is_typing: true }));
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        if (typingSocketRef.current?.readyState === WebSocket.OPEN) {
          typingSocketRef.current.send(JSON.stringify({ receiver_id: selectedUser?.id, is_typing: false }));
        }
        setIsTyping(false);
      }, 3000);
    } else if (!text.trim() && isTyping) {
      setIsTyping(false);
      if (typingSocketRef.current?.readyState === WebSocket.OPEN) {
        typingSocketRef.current.send(JSON.stringify({ receiver_id: selectedUser?.id, is_typing: false }));
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 50 * 1024 * 1024;
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (file.size > maxSize) { toast.error('Fayl hajmi 50MB dan oshmasligi kerak'); return; }
    if (!allowedTypes.includes(file.type)) { toast.error('Noto\'g\'ri fayl turi'); return; }
    setSelectedFile(file);
  };

  const handleUserSelect = (chatUser: ChatUser) => {
    setSelectedUser(chatUser);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedUser(null);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (!value) {
      loadConversations();
    } else {
      setChatUsers(prev =>
        prev.filter(u => u && u.first_name && u.last_name && (
          u.first_name.toLowerCase().includes(value.toLowerCase()) ||
          u.last_name.toLowerCase().includes(value.toLowerCase())
        ))
      );
    }
  };

  const toggleFullPage = () => {
    setIsFullPage(prev => !prev);
  };

  const exitFullPage = () => {
    setIsFullPage(false);
  };

  const getRoleLabel = (role: string) => {
    if (role === 'admin') return 'CEO & Asoschi';
    if (role === 'teacher') return 'O\'qituvchi';
    if (role === 'sub_teacher') return 'Yordamchi o\'qituvchi';
    if (role === 'manager') return 'Administrator';
    return 'O\'quvchi';
  };

  // ---- Render: Users List ----
  const renderUsersList = (hideOnMobileChat = true) => (
    <Card className={`flex flex-col rounded-none border-r ${
      hideOnMobileChat && isMobile && showChat ? 'hidden' : ''
    } ${isMobile ? 'w-full' : 'w-80'} ${isFullPage && !isMobile && selectedUser ? 'hidden' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg flex-1">Jonli Chat</h2>
        <Button variant="ghost" size="icon" onClick={toggleFullPage}
          title={isFullPage ? 'Kichraytirish' : 'To\'liq ekran'}>
          {isFullPage ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </Button>
      </div>
      <div className="p-4 border-b">
        <Input placeholder="Qidirish..." value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)} className="w-full" />
      </div>
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-2">
          {chatUsers && chatUsers.length > 0 ? (
            chatUsers.map((chatUser) => {
              if (!chatUser || !chatUser.id || !chatUser.first_name || !chatUser.last_name) return null;
              return (
                <Button key={chatUser.id} variant="ghost"
                  className={`w-full justify-start mb-2 h-auto p-3 relative ${
                    selectedUser?.id === chatUser.id ? 'bg-accent' : ''
                  } ${chatUser.role === 'admin' ? 'bg-red-500/10 hover:bg-red-500/20' : 
                    chatUser.role === 'teacher' ? 'bg-blue-500/10 hover:bg-blue-500/20' : 
                    chatUser.role === 'sub_teacher' ? 'bg-green-500/10 hover:bg-green-500/20' : 
                    chatUser.role === 'manager' ? 'bg-purple-500/10 hover:bg-purple-500/20' : ''}`}
                  onClick={() => handleUserSelect(chatUser)}>
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={chatUser.photo || undefined} />
                    <AvatarFallback>{chatUser.first_name.charAt(0)}{chatUser.last_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="text-left flex-1">
                    <p className="font-medium">{chatUser.first_name} {chatUser.last_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getRoleLabel(chatUser.role)}
                      {chatUser.level && ` • ${chatUser.level}`}
                    </p>
                  </div>
                  {chatUser.unread_count && chatUser.unread_count > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {chatUser.unread_count > 99 ? '99+' : chatUser.unread_count}
                    </Badge>
                  )}
                </Button>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              <p>Suhbatlar topilmadi</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );

  // ---- Render: Chat Area ----
  const renderChatArea = () => (
    <Card className={`flex flex-col border-0 rounded-none flex-1 ${
      !showChat && isMobile ? 'hidden' : ''
    } ${!showChat && !isMobile && !selectedUser ? '' : ''}`}>
      {selectedUser ? (
        <>
          {/* Chat Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Button variant="ghost" size="icon" onClick={() => {
                if (isFullPage && !isMobile) {
                  // In full page desktop with user selected, go back to users list
                  setSelectedUser(null);
                  setShowChat(false);
                } else {
                  handleBackToList();
                }
              }} className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.photo || undefined} />
                <AvatarFallback>{selectedUser.first_name[0]}{selectedUser.last_name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser.first_name} {selectedUser.last_name}</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel(selectedUser.role)}
                  {selectedUser.level && ` • ${selectedUser.level}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {remoteIsTyping && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Zap className="h-3 w-3 animate-pulse" />
                  Yozyapti...
                </div>
              )}
              <Button variant="ghost" size="icon" onClick={toggleFullPage}
                title={isFullPage ? 'Kichraytirish' : 'Kattalashtirish'}>
                {isFullPage ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Xabarlar topilmadi</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender?.id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {msg.text && <p className="break-words">{msg.text}</p>}
                        {msg.file && (
                          <>
                            {isImageFile(msg.file) ? (
                              <img src={msg.file} alt={msg.file_name || 'Image'}
                                className="mt-2 rounded-lg max-w-full max-h-64 object-cover" />
                            ) : (
                              <a href={msg.file} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 mt-2 text-sm underline">
                                <Paperclip className="h-4 w-4" />{msg.file_name}
                              </a>
                            )}
                          </>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="p-4 border-t">
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded">
                <Paperclip className="h-4 w-4" />
                <span className="text-sm flex-1">{selectedFile.name}</span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedFile(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect}
                accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx" />
              <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input value={newMessage} onChange={handleMessageChange} onKeyPress={handleKeyPress}
                placeholder="Xabar yozing..." className="flex-1" />
              <Button onClick={sendMessage} disabled={isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Suhbat boshlash uchun foydalanuchini tanlang</p>
        </div>
      )}
    </Card>
  );

  // ---- Full Page Mode: renders as fixed overlay ----
  if (isFullPage) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {renderUsersList(true)}
          {renderChatArea()}
        </div>
      </div>
    );
  }

  // ---- Normal Mode: inside DashboardLayout ----
  return (
    <DashboardLayout>
      <div className="flex flex-1 w-full h-[calc(100vh-8rem)] md:h-[calc(100vh-5rem)]">
        {renderUsersList(true)}
        {renderChatArea()}
      </div>
    </DashboardLayout>
  );
}
