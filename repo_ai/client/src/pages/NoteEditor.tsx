import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, MoreVertical, Pin, Trash2, FolderOpen, Tag as TagIcon, Sparkles, Wand2, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { summarizeAndPolishZhTW } from '@/lib/openaiClient';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Note {
  id?: number;
  title: string;
  content: string;
  folderId: number | null;
  isPinned: boolean;
  tags?: Array<{ id: number; name: string; color: string }>;
}

interface Folder {
  id: number;
  name: string;
  color: string;
  icon: string;
}

interface Tag {
  id: number;
  name: string;
  color: string;
}

export default function NoteEditor() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const isNewNote = params.id === 'new';

  const [note, setNote] = useState<Note>({
    title: '',
    content: '',
    folderId: null,
    isPinned: false,
    tags: [],
  });
  
  const [aiWorking, setAiWorking] = useState(false);
  const [aiBackup, setAiBackup] = useState<string | null>(null);
const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(!isNewNote);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!isNewNote) {
      fetchNote();
    }
    fetchFolders();
    fetchTags();
  }, [params.id]);

  useEffect(() => {
    if (!isNewNote && (note.title || note.content)) {
      const timer = setTimeout(() => {
        saveNote();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [note.title, note.content]);

  const fetchNote = async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setNote(data);
      } else {
        toast.error('無法載入筆記');
        navigate('/notes');
      }
    } catch (error) {
      console.error('Failed to fetch note:', error);
      toast.error('載入失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data);
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const saveNote = async () => {
    if (!note.title && !note.content) return;

    setSaving(true);
    try {
      const url = isNewNote ? '/api/notes' : `/api/notes/${params.id}`;
      const method = isNewNote ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: note.title || '未命名',
          content: note.content,
          folderId: note.folderId,
          isPinned: note.isPinned,
          tagIds: note.tags?.map((t) => t.id) || [],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastSaved(new Date());
        if (isNewNote && data.id) {
          navigate(`/notes/${data.id}`, { replace: true });
        }
      } else {
        toast.error('儲存失敗');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      toast.error('儲存失敗');
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    try {
      const response = await fetch(`/api/notes/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('已刪除筆記');
        navigate('/notes');
      } else {
        toast.error('刪除失敗');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      toast.error('刪除失敗');
    }
  };

  const togglePin = async () => {
    const newPinned = !note.isPinned;
    setNote({ ...note, isPinned: newPinned });

    if (!isNewNote) {
      try {
        await fetch(`/api/notes/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...note,
            isPinned: newPinned,
          }),
        });
        toast.success(newPinned ? '已釘選' : '已取消釘選');
      } catch (error) {
        console.error('Failed to toggle pin:', error);
        setNote({ ...note, isPinned: !newPinned });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

const ensureOpenAIReady = () => {
  const key = localStorage.getItem('openaiApiKey')?.trim();
  if (!key) {
    toast.error('請先到「設定 → AI 設定」填入 OpenAI API 金鑰');
    navigate('/settings');
    return false;
  }
  return true;
};

const runAI = async () => {
  if (aiWorking) return;
  if (!note?.content?.trim()) {
    toast.error('目前沒有內容可以處理');
    return;
  }
  if (!ensureOpenAIReady()) return;

  setAiWorking(true);
  setAiBackup(note.content);
  try {
        const result = await summarizeAndPolishZhTW(note.content);

    if (!result) {
      toast.error('AI 沒有回傳內容（可能被截斷或被拒絕）');
      return;
    }

    const firstLine = result.split('\n')[0];
    setNote({
      ...note,
      content: result,
      title: firstLine || note.title || '未命名',
    });
    toast.success('已完成摘要＋潤飾');
  } catch (e: any) {
    console.error(e);
    toast.error(e?.message || 'AI 處理失敗');
  } finally {
    setAiWorking(false);
  }
};

const restoreFromAI = () => {
  if (!aiBackup) return;
  const firstLine = aiBackup.split('\n')[0];
  setNote({
    ...note,
    content: aiBackup,
    title: firstLine || note.title || '未命名',
  });
  toast.success('已復原');
  setAiBackup(null);
};

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/notes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {saving && <span className="text-sm text-muted-foreground">儲存中...</span>}
            {aiWorking && <span className="text-sm text-muted-foreground">AI 處理中...</span>}
<Button
  variant="outline"
  size="sm"
  disabled={aiWorking}
  onClick={() => runAI('summary')}
  className="gap-1"
>
  <Sparkles className="h-4 w-4" />
  AI摘要
</Button>
<Button
  variant="outline"
  size="sm"
  disabled={aiWorking}
  onClick={() => runAI('polish')}
  className="gap-1"
>
  <Wand2 className="h-4 w-4" />
  AI潤飾
</Button>
<Button
  variant="ghost"
  size="sm"
  disabled={!aiBackup || aiWorking}
  onClick={restoreFromAI}
  title="🔙 復原（回到 AI 操作前）"
>
  🔙 復原
</Button>

            {lastSaved && !saving && (
              <span className="text-sm text-muted-foreground">
                已儲存 {lastSaved.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={togglePin}>
                  <Pin className="mr-2 h-4 w-4" />
                  {note.isPinned ? '取消釘選' : '釘選'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  移動到資料夾
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <TagIcon className="mr-2 h-4 w-4" />
                  管理標籤
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {!isNewNote && (
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-4">
          <Input
            placeholder="標題"
            value={note.title}
            onChange={(e) => setNote({ ...note, title: e.target.value })}
            className="text-2xl font-semibold border-0 focus-visible:ring-0 px-0"
          />
          <Textarea
            placeholder="開始輸入..."
            value={note.content}
            onChange={(e) => setNote({ ...note, content: e.target.value })}
            className="min-h-[calc(100vh-200px)] border-0 focus-visible:ring-0 resize-none px-0 text-base"
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>刪除筆記</DialogTitle>
            <DialogDescription>確定要刪除這則筆記嗎？此操作無法復原。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={deleteNote}>
              刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
