import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: number;
  sender_id: number;
  sender_name: string;
  sender_photo: string;
  sender_role: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.UNREAD_COUNT);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.results || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    try {
      await authFetch(`${API_ENDPOINTS.MARK_AS_READ}${notification.sender_id}/`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }

    // Navigate to chat with this user
    navigate('/dashboard/chat', { state: { selectedUserId: notification.sender_id } });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto mt-6">
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Yuklanmoqda...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Bildirishnomalar mavjud emas
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                        !notification.is_read
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-card border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.sender_photo} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {notification.sender_name[0]}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-foreground">
                              {notification.sender_name}
                            </p>
                            {notification.sender_role === 'admin' && (
                              <Badge variant="destructive" className="text-xs">
                                Admin
                              </Badge>
                            )}
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs">
                                Yangi
                              </Badge>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {notification.message}
                          </p>

                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
