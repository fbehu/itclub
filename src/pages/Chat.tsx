import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Send, Paperclip, X, ArrowLeft } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

export default function Chat() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedUser, setSelectedUser] = useState<Admin | Student | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showChat, setShowChat] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user?.role === 'student') {
      loadAdmins();
    } else if (user?.role === 'admin') {
      loadStudents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const loadAdmins = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.GET_ADMINS);
      if (response.ok) {
        const data = await response.json();
        setAdmins(data);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.USERS_LIST);
      if (response.ok) {
        const data = await response.json();
        const studentUsers = data.results?.filter((u: any) => u.role === 'student') || [];
        setStudents(studentUsers);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadMessages = async () => {
    if (!selectedUser) return;
    
    try {
      const userId = user?.role === 'student' 
        ? (selectedUser as Admin).id 
        : (selectedUser as Student).id;
      const response = await authFetch(`${API_ENDPOINTS.MESSAGES}?${user?.role === 'student' ? 'admin_id' : 'student_id'}=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
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
      formData.append('admin_id', (selectedUser as Admin).id);
    } else {
      formData.append('student_id', (selectedUser as Student).id);
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

  const handleUserSelect = (user: Admin | Student) => {
    setSelectedUser(user);
    if (isMobile) {
      setShowChat(true);
    }
  };

  const handleBackToList = () => {
    setShowChat(false);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-6rem)] gap-4">
        {/* Users List */}
        <Card className={`flex flex-col ${isMobile ? (showChat ? 'hidden' : 'w-full') : 'w-80'}`}>
          <div className="p-4 border-b">
            <h2 className="font-semibold text-lg">
              {user?.role === 'student' ? 'Adminlar' : 'Studentlar'}
            </h2>
          </div>
          <ScrollArea className="flex-1">
            {user?.role === 'student' ? (
              <div className="p-2">
                {admins.map((admin) => (
                  <Button
                    key={admin.id}
                    variant="ghost"
                    className={`w-full justify-start mb-2 h-auto p-3 ${
                      (selectedUser as Admin)?.id === admin.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleUserSelect(admin)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={admin.photo} />
                      <AvatarFallback>
                        {admin.first_name[0]}{admin.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{admin.first_name} {admin.last_name}</p>
                      <p className="text-sm text-muted-foreground">Admin</p>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {students.map((student) => (
                  <Button
                    key={student.id}
                    variant="ghost"
                    className={`w-full justify-start mb-2 h-auto p-3 ${
                      (selectedUser as Student)?.id === student.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleUserSelect(student)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={student.photo} />
                      <AvatarFallback>
                        {student.first_name[0]}{student.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left flex-1">
                      <p className="font-medium">{student.first_name} {student.last_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.direction || 'Yo\'nalish ko\'rsatilmagan'} • {student.course || 'Kurs ko\'rsatilmagan'}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className={`flex flex-col ${isMobile ? (showChat ? 'w-full' : 'hidden') : 'flex-1'}`}>
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToList}
                    className="mr-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.role === 'student' ? (selectedUser as Admin).photo : (selectedUser as Student).photo} />
                  <AvatarFallback>
                    {user?.role === 'student' 
                      ? `${(selectedUser as Admin).first_name[0]}${(selectedUser as Admin).last_name[0]}`
                      : `${(selectedUser as Student).first_name[0]}${(selectedUser as Student).last_name[0]}`
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {user?.role === 'student' 
                      ? `${(selectedUser as Admin).first_name} ${(selectedUser as Admin).last_name}`
                      : `${(selectedUser as Student).first_name} ${(selectedUser as Student).last_name}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user?.role === 'student' ? 'Admin' : 'Student'}
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
                          className={`max-w-[70%] rounded-lg p-3 ${
                            isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.text && <p className="break-words">{msg.text}</p>}
                          {msg.file_url && (
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
    </DashboardLayout>
  );
}
