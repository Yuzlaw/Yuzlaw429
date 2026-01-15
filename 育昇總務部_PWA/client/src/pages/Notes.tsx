import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Plus, Search, Folder, Tag, Menu, Moon, Sun, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface Note {
  id: number;
  title: string;
  content: string;
  folderId: number | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
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

export default function Notes() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
    fetchFolders();
    fetchTags();
  }, []);

  const fetchNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedFolder) params.append('folderId', selectedFolder.toString());
      if (selectedTag) params.append('tagId', selectedTag.toString());

      const response = await fetch(`/api/notes?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
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

  useEffect(() => {
    fetchNotes();
  }, [searchQuery, selectedFolder, selectedTag]);

  const createNewNote = () => {
    navigate('/notes/new');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' });
    }
  };

  const getPreviewText = (content: string) => {
    return content.substring(0, 100);
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">資料夾</h2>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Button
            variant={selectedFolder === null && selectedTag === null ? 'secondary' : 'ghost'}
            className="w-full justify-start mb-1"
            onClick={() => {
              setSelectedFolder(null);
              setSelectedTag(null);
            }}
          >
            <Folder className="mr-2 h-4 w-4" />
            所有筆記
          </Button>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant={selectedFolder === folder.id ? 'secondary' : 'ghost'}
              className="w-full justify-start mb-1"
              onClick={() => {
                setSelectedFolder(folder.id);
                setSelectedTag(null);
              }}
            >
              <span className="mr-2">{folder.icon}</span>
              {folder.name}
            </Button>
          ))}
        </div>
        <div className="p-2 border-t mt-2">
          <h3 className="text-sm font-semibold mb-2 px-2">標籤</h3>
          {tags.map((tag) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.id ? 'secondary' : 'ghost'}
              className="w-full justify-start mb-1"
              onClick={() => {
                setSelectedTag(tag.id);
                setSelectedFolder(null);
              }}
            >
              <Tag className="mr-2 h-4 w-4" style={{ color: tag.color }} />
              {tag.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate('/notes')}
        >
          切換到本機版（離線）
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate('/sync/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          設定
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {theme === 'dark' ? '淺色模式' : '深色模式'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 border-r">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <Sidebar />
                </SheetContent>
              </Sheet>
              <h1 className="text-xl font-semibold">同步筆記（Google 備份）</h1>
            </div>
            <Button onClick={createNewNote} size="icon">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜尋"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Notes List */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">載入中...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <p className="text-muted-foreground mb-4">尚無筆記</p>
              <Button onClick={createNewNote}>
                <Plus className="mr-2 h-4 w-4" />
                建立第一則筆記
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className={cn(
                    'p-4 cursor-pointer hover:bg-accent transition-colors',
                    note.isPinned && 'bg-accent/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">{note.title || '未命名'}</h3>
                    <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {getPreviewText(note.content) || '無內容'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
