import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notesDB, type Note } from '@/lib/db';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Trash() {
  const [, navigate] = useLocation();
  const [deletedNotes, setDeletedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeletedNotes();
  }, []);

  const fetchDeletedNotes = async () => {
    try {
      const notes = await notesDB.getDeletedNotes();
      setDeletedNotes(notes);
    } catch (error) {
      console.error('Failed to fetch deleted notes:', error);
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await notesDB.restoreNote(id);
      toast.success('已還原筆記');
      fetchDeletedNotes();
    } catch (error) {
      console.error('Failed to restore note:', error);
      toast.error('還原失敗');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    try {
      await notesDB.permanentlyDeleteNote(id);
      toast.success('已永久刪除');
      fetchDeletedNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('刪除失敗');
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await notesDB.emptyTrash();
      toast.success('已清空垃圾桶');
      fetchDeletedNotes();
    } catch (error) {
      console.error('Failed to empty trash:', error);
      toast.error('清空失敗');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', { 
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/notes')}>
              <X className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">最近刪除</h1>
          </div>
          {deletedNotes.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  清空垃圾桶
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確定要清空垃圾桶嗎？</AlertDialogTitle>
                  <AlertDialogDescription>
                    這將永久刪除所有已刪除的筆記，此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleEmptyTrash} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    確定清空
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">載入中...</p>
          </div>
        ) : deletedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">垃圾桶是空的</p>
          </div>
        ) : (
          <div className="divide-y">
            {deletedNotes.map((note) => (
              <div key={note.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{note.title || '未命名'}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {note.content.substring(0, 100) || '無內容'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      刪除時間：{note.deletedAt ? formatDate(note.deletedAt) : '未知'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(note.id!)}
                    className="flex-1"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    還原
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="mr-2 h-4 w-4" />
                        永久刪除
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確定要永久刪除嗎？</AlertDialogTitle>
                        <AlertDialogDescription>
                          此操作無法復原，筆記將被永久刪除。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handlePermanentDelete(note.id!)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          確定刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
