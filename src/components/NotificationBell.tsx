import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface UnreadMessage {
  id: string;
  sender_id: number;
  sender_name: string;
  sender_photo: string | null;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

// Notification sound - simple beep
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio not supported');
  }
};

export function NotificationBell() {
  const [messages, setMessages] = useState<UnreadMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const previousCountRef = useRef(0);
  const navigate = useNavigate();

  const loadUnreadMessages = useCallback(async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.UNREAD_COUNT);
      if (response.ok) {
        const data = await response.json();
        // API returns array of unread messages
        const messagesList = Array.isArray(data) ? data : [];
        
        // Play sound if new messages arrived
        if (messagesList.length > previousCountRef.current && previousCountRef.current >= 0) {
          playNotificationSound();
        }
        
        previousCountRef.current = messagesList.length;
        setMessages(messagesList);
      }
    } catch (error) {
      console.error('Error loading unread messages:', error);
    }
  }, []);

  useEffect(() => {
    loadUnreadMessages();
    const interval = setInterval(loadUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadUnreadMessages]);

  const handleMessageClick = async (message: UnreadMessage) => {
    try {
      // Mark as read
      await authFetch(API_ENDPOINTS.MARK_AS_READ, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: message.sender_id }),
      });
      
      // Navigate to chat
      navigate('/dashboard/chat', { 
        state: { 
          selectedUser: {
            id: message.sender_id,
            first_name: message.sender_name.split(' ')[0],
            last_name: message.sender_name.split(' ').slice(1).join(' '),
            photo: message.sender_photo,
            role: message.sender_role,
          }
        }
      });
      
      setIsOpen(false);
      loadUnreadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Hozir';
    if (diffMins < 60) return `${diffMins} daqiqa oldin`;
    if (diffHours < 24) return `${diffHours} soat oldin`;
    return date.toLocaleDateString('uz-UZ');
  };

  const getRoleBadge = (role: string) => {
    if (role === 'admin') {
      return <Badge variant="default" className="text-xs bg-primary">Admin</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Talaba</Badge>;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {messages.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
            >
              {messages.length > 99 ? '99+' : messages.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Yangi xabarlar</h4>
          {messages.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {messages.length} ta
            </Badge>
          )}
        </div>
        
        {messages.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Yangi xabarlar yo'q</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {messages.map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => handleMessageClick(msg)}
                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={msg.sender_photo || undefined} />
                    <AvatarFallback className="text-xs">
                      {msg.sender_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm truncate">
                        {msg.sender_name}
                      </span>
                      {getRoleBadge(msg.sender_role)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {msg.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {messages.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                navigate('/dashboard/notifications');
                setIsOpen(false);
              }}
            >
              Barcha xabarlarni ko'rish
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
