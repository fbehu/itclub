import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Trash2, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import { format } from 'date-fns';
import { uz } from 'date-fns/locale';

interface Notification {
  id: string;
  sender_name: string;
  sender_photo?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

// // Polling interval reference (disabled - can be enabled later)
// let pollIntervalRef: NodeJS.Timeout | null = null;

export default function Notifications() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);

  // Load initial notifications from REST API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await authFetch('/notifications/');
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: 'Xatolik',
        description: 'Bildirishnomalarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // // Connect to WebSocket (disabled - using REST API only)
  // const connectWebSocket = () => {
  //   try {
  //     const token = localStorage.getItem('access_token');
  //     if (!token) {
  //       console.warn('No token found for WebSocket connection');
  //       return;
  //     }

  //     const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  //     const wsUrl = `${wsProtocol}//${window.location.host}/ws/notifications/?token=${token}`;
      
  //     wsRef.current = new WebSocket(wsUrl);

  //     wsRef.current.onopen = () => {
  //       console.log('WebSocket connected');
  //     };

  //     wsRef.current.onmessage = (event) => {
  //       try {
  //         const data = JSON.parse(event.data);
          
  //         if (data.type === 'notification') {
  //           // New notification received
  //           const newNotification: Notification = {
  //             id: data.id,
  //             sender_name: data.sender_name,
  //             sender_photo: data.sender_photo,
  //             message: data.message,
  //             is_read: data.is_read || false,
  //             created_at: data.created_at,
  //           };
            
  //           setNotifications(prev => [newNotification, ...prev]);
  //           toast({
  //             title: 'Yangi bildirishnoma',
  //             description: data.message,
  //           });
  //         }
  //       } catch (error) {
  //         console.error('Error parsing WebSocket message:', error);
  //       }
  //     };

  //     wsRef.current.onerror = (error) => {
  //       console.error('WebSocket error:', error);
  //     };

  //     wsRef.current.onclose = () => {
  //       console.log('WebSocket disconnected');
  //       // Attempt to reconnect after 5 seconds
  //       setTimeout(() => {
  //         connectWebSocket();
  //       }, 5000);
  //     };
  //   } catch (error) {
  //     console.error('Error connecting to WebSocket:', error);
  //   }
  // };

  // // Start polling for unread count (disabled - can be enabled later)
  // const startUnreadCountPolling = () => {
  //   // Poll unread count every 5 seconds
  //   pollIntervalRef = setInterval(async () => {
  //     try {
  //       const response = await authFetch('/notifications/unread-count/');
  //       if (response.ok) {
  //         const data = await response.json();
  //         console.log('Unread count:', data.unread_count);
  //         // Update UI with unread count if needed
  //       }
  //     } catch (error) {
  //       console.error('Error fetching unread count:', error);
  //     }
  //   }, 5000); // Poll every 5 seconds
  // };

  // // Stop polling
  // const stopUnreadCountPolling = () => {
  //   if (pollIntervalRef) {
  //     clearInterval(pollIntervalRef);
  //     pollIntervalRef = null;
  //   }
  // };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      setMarking(prev => new Set([...prev, notificationId]));
      
      const response = await authFetch('/notifications/mark-read/', {
        method: 'POST',
        body: JSON.stringify({ notification_id: notificationId }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        
        // // Send mark_read through WebSocket if connected (disabled - using REST API only)
        // if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        //   wsRef.current.send(JSON.stringify({
        //     type: 'mark_read',
        //     notification_id: notificationId,
        //   }));
        // }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: 'Xatolik',
        description: 'Bildirishnomani o\'qilgan deb belgilashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setMarking(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setMarking(prev => new Set([...prev, notificationId]));
      
      const response = await authFetch(`/notifications/${notificationId}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        toast({
          title: 'Muvaffaqiyatli',
          description: 'Bildirishnoma o\'chirildi',
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Xatolik',
        description: 'Bildirishnomani o\'chirishda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setMarking(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    loadNotifications();
    // connectWebSocket(); // Disabled - using REST API only

    return () => {
      // Cleanup WebSocket connection if enabled
      // if (wsRef.current) {
      //   wsRef.current.close();
      // }
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Bildirishnomalar yuklanmoqda...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Bildirishnomalar</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} ta o'qilmagan bildirishnoma` : 'Barcha bildirishnomalar o\'qilgan'}
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-500 text-white rounded-full px-3 py-1 font-semibold text-sm">
              {unreadCount}
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Bildirishnomalar yo'q</h2>
                <p className="text-muted-foreground">
                  Hozircha sizga bildirishnomalar yuborilmagan. Yangi bildirishnomalar bu yerda ko'rsatiladi.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border-l-4 transition-all ${
                  notification.is_read
                    ? 'border-l-slate-300 bg-slate-50 dark:bg-slate-800/30 opacity-75'
                    : 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={notification.sender_photo} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {(notification.sender_name[0] || '?').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {notification.sender_name}
                          </p>
                          <p className="text-sm text-foreground mt-1 break-words">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(notification.created_at), 'd MMMM, HH:mm', {
                              locale: uz,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={marking.has(notification.id)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="O'qilgan deb belgilash"
                        >
                          {marking.has(notification.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                        </Button>
                      ) : (
                        <Circle className="h-4 w-4 text-slate-400" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteNotification(notification.id)}
                        disabled={marking.has(notification.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                        title="O'chirish"
                      >
                        {marking.has(notification.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}