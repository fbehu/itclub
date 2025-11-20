import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Paperclip, X, ArrowLeft, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';

interface Message {
  id: string;
  text: string;
  admin_id?: string;
  student_id?: string;
  sender_name?: string;
  created_at: string;
  file_url?: string;
  file_name?: string;
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
  course?: string;
  role?: string;
}

interface ChatUser {
  id: string;
  first_name: string;
  last_name: string;
  photo?: string;
  role: 'admin' | 'student';
  unread_count?: number;
  direction?: string;
  course?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUsers(1);
  }, [user]);

  useEffect(() => {
    // Check if we navigated from notifications with a selected user
    const state = location.state as { selectedUserId?: number };
    if (state?.selectedUserId && chatUsers.length > 0) {
      const userToSelect = chatUsers.find(u => u.id === state.selectedUserId.toString());
      if (userToSelect) {
        setSelectedUser(userToSelect);
        setShowChat(true);
      }
    }
  }, [location.state, chatUsers]);

  useEffect(() => {
    if (selectedUser) {
      markAsRead();
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const loadUsers = async (pageNum: number) => {
    if (isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      
      if (user?.role === 'student') {
        const response = await authFetch(API_ENDPOINTS.GET_ADMINS);
        if (response.ok) {
          const data = await response.json();
          const adminsWithRole = data.map((admin: Admin) => ({
            ...admin,
            role: 'admin' as const,
            unread_count: 0
          }));
          
          if (pageNum === 1) {
            setChatUsers(adminsWithRole);
          } else {
            setChatUsers(prev => [...prev, ...adminsWithRole]);
          }
          setHasMore(false);
        }
      } else if (user?.role === 'admin') {
        const response = await authFetch(`${API_ENDPOINTS.GET_CONVERSATIONS}?page=${pageNum}`);
        if (response.ok) {
          const data = await response.json();
          const users = data.results || [];
          
          if (pageNum === 1) {
            setChatUsers(users);
          } else {
            setChatUsers(prev => [...prev, ...users]);
          }
          
          setHasMore(data.next !== null);
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    if (scrollPercentage > 0.8 && hasMore && !isLoadingMore) {
      loadUsers(page + 1);
    }
  };

  const markAsRead = async () => {
    if (!selectedUser) return;
    
    try {
      await authFetch(API_ENDPOINTS.MARK_AS_READ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id
        })
      });
      
      // Update local state
      setChatUsers(prev => 
        prev.map(u => 
          u.id === selectedUser.id 
            ? { ...u, unread_count: 0 }
            : u
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;

    try {
      const response = await authFetch(`${API_ENDPOINTS.MESSAGES}?${user?.role === 'student' ? 'admin_id' : 'student_id'}=${selectedUser.id}`);

      if (response.ok) {
        const data = await response.json();
        setMessages(data.reverse());
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const isImageFile = (url: string) => {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (file.size > maxSize) {
      toast.error('Fayl hajmi 50MB dan oshmasligi kerak');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Noto\'g\'ri fayl turi');
      return;
    }

    setSelectedFile(file);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;
    if (!selectedUser) return;

    const formData = new FormData();
    formData.append('text', newMessage);

    if (user?.role === 'student') {
      formData.append('admin_id', selectedUser.id);
    } else {
      formData.append('student_id', selectedUser.id);
    }

    if (selectedFile) {
      formData.append('file', selectedFile);
    }

    try {
      const response = await authFetch(`${API_ENDPOINTS.MESSAGES}add/`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setNewMessage('');
        setSelectedFile(null);
        loadMessages();
      } else {
        toast.error('Xabar yuborishda xatolik');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Xabar yuborishda xatolik');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleUserSelect = (chatUser: ChatUser) => {
    setSelectedUser(chatUser);
    setShowChat(true);
  };

  const handleBackToList = () => {
    setShowChat(false);
    setSelectedUser(null);
  };


  const handleBack = () => {
    navigate(-1); // 1 sahifa orqaga qaytadi
  };

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Users List Sidebar */}
      <Card className={`flex flex-col border-0 rounded-none ${showChat ? 'hidden' : 'w-full md:w-80'}`}>
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
    
          <h2 className="font-semibold text-lg">
            {user?.role === 'student' ? 'Adminlar' : 'Studentlar'}
          </h2>
        </div>
        <ScrollArea className="flex-1" onScroll={handleScroll}>
          <div className="p-2">
            {chatUsers.map((chatUser) => (
              <Button
                key={chatUser.id}
                variant="ghost"
                className={`w-full justify-start mb-2 h-auto p-3 relative ${
                  selectedUser?.id === chatUser.id ? 'bg-accent' : ''
                } ${chatUser.role === 'admin' ? 'bg-red-500/10 hover:bg-red-500/20' : ''}`}
                onClick={() => handleUserSelect(chatUser)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={chatUser.photo} />
                  <AvatarFallback>
                    {chatUser.first_name[0]}{chatUser.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left flex-1">
                  <p className="font-medium">{chatUser.first_name} {chatUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {chatUser.role === 'admin' ? 'Admin' : 
                      `${chatUser.direction || 'Yo\'nalish'} • ${chatUser.course || 'Kurs'}`}
                  </p>
                </div>
                {chatUser.unread_count && chatUser.unread_count > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {chatUser.unread_count > 99 ? '99+' : chatUser.unread_count}
                  </Badge>
                )}
              </Button>
            ))}
            {isLoadingMore && (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className={`flex flex-col border-0 rounded-none ${showChat ? 'w-full' : 'hidden md:flex md:flex-1'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToList}
                className="mr-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser.photo} />
                <AvatarFallback>
                  {selectedUser.first_name[0]}{selectedUser.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.role === 'admin' ? 'Admin' : 'Student'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => {
                  const currentUserName = `${user?.first_name} ${user?.last_name}`;
                  const isOwn = msg.sender_name === currentUserName;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                          }`}
                      >
                        {msg.text && <p className="break-words">{msg.text}</p>}
                        {msg.file_url && (
                          <>
                            {isImageFile(msg.file_url) ? (
                              <img
                                src={msg.file_url}
                                alt={msg.file_name || 'Image'}
                                className="mt-2 rounded-lg max-w-full max-h-64 object-cover"
                              />
                            ) : (
                              <a
                                href={msg.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 mt-2 text-sm underline"
                              >
                                <Paperclip className="h-4 w-4" />
                                {msg.file_name}
                              </a>
                            )}
                          </>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.created_at).toLocaleTimeString('uz-UZ', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              {selectedFile && (
                <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded">
                  <Paperclip className="h-4 w-4" />
                  <span className="text-sm flex-1">{selectedFile.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Xabar yozing..."
                  className="flex-1"
                />
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>Suhbat boshlash uchun foydalanuvchini tanlang</p>
          </div>
        )}
      </Card>
    </div>
  );
}
