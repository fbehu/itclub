import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2, Trash2, Plus, Home } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from '@/lib/authFetch';
import { API_ENDPOINTS } from '@/config/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CreateRoomDialog } from './rooms/CreateRoomDialog';
import { EditRoomDialog } from './rooms/EditRoomDialog';

interface Room {
  id: string;
  name: string;
  room_number?: string;
  description?: string;
  floor?: number;
  capacity?: number;
  is_active?: boolean;
  created_at?: string;
}

export default function RoomsManagement() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.ROOMS);
      if (response.ok) {
        const data = await response.json();
        setRooms(data.results || data);
      } else {
        throw new Error('Xonalarni yuklashda xatolik');
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: 'Xato',
        description: 'Xonalarni yuklashda xatolik yuz berdi',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoomId) return;

    try {
      const response = await authFetch(API_ENDPOINTS.ROOM_DETAIL(deletingRoomId), {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Muvaffaqiyatli',
          description: 'Xona o\'chirildi',
        });
        setRooms(rooms.filter(r => r.id !== deletingRoomId));
      } else {
        throw new Error('O\'chirishda xatolik');
      }
    } catch (error) {
      toast({
        title: 'Xato',
        description: error instanceof Error ? error.message : 'Xonani o\'chirishda xatolik',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingRoomId(null);
    }
  };

  const handleEditOpen = (room: Room) => {
    setEditingRoom(room);
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (roomId: string) => {
    setDeletingRoomId(roomId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
              <Home className="w-8 h-8" />
              Xonalar
            </h1>
            <p className="text-muted-foreground mt-1">O'quv xonalarini boshqarish</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Yangi xona
          </Button>
        </div>

        {/* Rooms Table */}
        <Card>
          <CardHeader>
            <CardTitle>Barcha xonalar ({rooms.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {rooms.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Home className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Hozircha xonalar yo'q</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">Xona nomi</TableHead>
                      <TableHead className="font-semibold">Qavat</TableHead>
                      <TableHead className="font-semibold">Sig'imi</TableHead>
                      <TableHead className="font-semibold">Holat</TableHead>
                      <TableHead className="text-right font-semibold">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{room.name}</TableCell>
                        
                        <TableCell>
                          {room.floor ? (
                            <Badge variant="secondary">{room.floor}-qavat</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {room.capacity ? (
                            <span className="text-sm font-medium">{room.capacity} ta</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={room.is_active ? "default" : "destructive"}>
                            {room.is_active ? "Faol" : "O'chiq"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditOpen(room)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteOpen(room.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogs */}
        <CreateRoomDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            fetchRooms();
            setCreateDialogOpen(false);
          }}
        />

        {editingRoom && (
          <EditRoomDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            room={editingRoom}
            onSuccess={() => {
              fetchRooms();
              setEditDialogOpen(false);
              setEditingRoom(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xonani o'chirish</AlertDialogTitle>
              <AlertDialogDescription>
                Bu xonani o'chirishga ishonchingiz komilmi? Bu amalni bekor qilib bo'lmaydi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Bekor qilish</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                O'chirish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
