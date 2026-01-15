import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Upload, FolderPlus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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

export default function Settings() {
  const [, navigate] = useLocation();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [importing, setImporting] = useState(false);

// OpenAI（本機保存）
const [openaiApiKey, setOpenaiApiKey] = useState(localStorage.getItem('openaiApiKey') || '');
const [openaiBaseUrl, setOpenaiBaseUrl] = useState(localStorage.getItem('openaiBaseUrl') || 'https://api.openai.com/v1');
const [openaiModel, setOpenaiModel] = useState(localStorage.getItem('openaiModel') || 'gpt-4o-mini');
const [openaiMaxTokens, setOpenaiMaxTokens] = useState(localStorage.getItem('openaiMaxTokens') || '800');
const [openaiTemperature, setOpenaiTemperature] = useState(localStorage.getItem('openaiTemperature') || '0.3');
const [openaiTimeoutSec, setOpenaiTimeoutSec] = useState(localStorage.getItem('openaiTimeoutSec') || '20');


  useEffect(() => {
    fetchFolders();
    fetchTags();
  }, []);

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

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });

      if (response.ok) {
        toast.success('已建立資料夾');
        setNewFolderName('');
        setNewFolderDialogOpen(false);
        fetchFolders();
      } else {
        toast.error('建立失敗');
      }
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('建立失敗');
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName }),
      });

      if (response.ok) {
        toast.success('已建立標籤');
        setNewTagName('');
        setNewTagDialogOpen(false);
        fetchTags();
      } else {
        toast.error('建立失敗');
      }
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('建立失敗');
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('已刪除資料夾');
        fetchFolders();
      } else {
        toast.error('刪除失敗');
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('刪除失敗');
    }
  };

  const deleteTag = async (id: number) => {
    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('已刪除標籤');
        fetchTags();
      } else {
        toast.error('刪除失敗');
      }
    } catch (error) {
      console.error('Failed to delete tag:', error);
      toast.error('刪除失敗');
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);
    const importedNotes = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
          const content = await file.text();
          const title = file.name.replace('.txt', '');
          importedNotes.push({ title, content });
        }
      }

      if (importedNotes.length > 0) {
        const response = await fetch('/api/notes/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: importedNotes }),
        });

        if (response.ok) {
          toast.success(`成功匯入 ${importedNotes.length} 則筆記`);
          navigate('/notes');
        } else {
          toast.error('匯入失敗');
        }
      } else {
        toast.error('沒有找到有效的 TXT 檔案');
      }
    } catch (error) {
      console.error('Failed to import notes:', error);
      toast.error('匯入失敗');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

const saveOpenAISettings = () => {
  localStorage.setItem('openaiApiKey', openaiApiKey.trim());
  localStorage.setItem('openaiBaseUrl', openaiBaseUrl.trim());
  localStorage.setItem('openaiModel', openaiModel.trim() || 'gpt-4o-mini');
  localStorage.setItem('openaiMaxTokens', String(openaiMaxTokens || '800'));
  localStorage.setItem('openaiTemperature', String(openaiTemperature || '0.3'));
  localStorage.setItem('openaiTimeoutSec', String(openaiTimeoutSec || '20'));
  toast.success('已儲存 AI 設定');
};

const resetOpenAISettings = () => {
  setOpenaiBaseUrl('https://api.openai.com/v1');
  setOpenaiModel('gpt-4o-mini');
  setOpenaiMaxTokens('800');
  setOpenaiTemperature('0.3');
  setOpenaiTimeoutSec('20');
  toast.success('已重置 AI 設定（API 金鑰不會自動清空）');
};

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/notes')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">設定</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">匯入</TabsTrigger>
              <TabsTrigger value="folders">資料夾</TabsTrigger>
              <TabsTrigger value="tags">標籤</TabsTrigger>
            </TabsList>

            {/* 匯入 Tab */}
            <TabsContent value="import" className="space-y-4 mt-4">
              <div className="rounded-lg border p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">批次匯入 TXT 檔案</h3>
                  <p className="text-sm text-muted-foreground">
                    從 iPhone 備忘錄匯出的 TXT 檔案可以一次上傳多個，系統會自動建立對應的筆記。
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg hover:bg-accent transition-colors">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {importing ? '匯入中...' : '點擊選擇檔案或拖曳到此處'}
                        </p>
                      </div>
                    </div>
                  </Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt"
                    multiple
                    onChange={handleFileImport}
                    disabled={importing}
                    className="hidden"
                  />
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>💡 使用提示：</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>支援同時選擇多個 TXT 檔案</li>
                    <li>檔案名稱會自動成為筆記標題</li>
                    <li>檔案內容會成為筆記內容</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            {/* 資料夾 Tab */}
            <TabsContent value="folders" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">我的資料夾</h3>
                <Button onClick={() => setNewFolderDialogOpen(true)} size="sm">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  新增
                </Button>
              </div>
              <div className="space-y-2">
                {folders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">尚無資料夾</p>
                ) : (
                  folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <span>{folder.icon}</span>
                        <span>{folder.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFolder(folder.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 標籤 Tab */}
            <TabsContent value="tags" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">我的標籤</h3>
                <Button onClick={() => setNewTagDialogOpen(true)} size="sm">
                  <TagIcon className="mr-2 h-4 w-4" />
                  新增
                </Button>
              </div>
              <div className="space-y-2">
                {tags.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">尚無標籤</p>
                ) : (
                  tags.map((tag) => (
                    <div
                      key={tag.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTag(tag.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          
{/* AI 設定 Tab */}
<TabsContent value="ai" className="space-y-4 mt-4">
  <div className="rounded-lg border p-6 space-y-4">
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">OpenAI 設定（成本低預設：gpt-4o-mini）</h3>
      <p className="text-sm text-muted-foreground">
        這裡只會把設定存到你的裝置本機（localStorage）。只有你們兩個人用、手機不越獄的情況下，風險通常可控。
      </p>
    </div>

    <div className="space-y-2">
      <Label>API 金鑰</Label>
      <Input
        type="password"
        placeholder="sk-..."
        value={openaiApiKey}
        onChange={(e) => setOpenaiApiKey(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">提示：如果要顯示明碼，先複製貼上再改 type（我們可以下一版加「顯示/隱藏」）。</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Base URL</Label>
        <Input
          placeholder="https://api.openai.com/v1"
          value={openaiBaseUrl}
          onChange={(e) => setOpenaiBaseUrl(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>模型</Label>
        <Input
          placeholder="gpt-4o-mini"
          value={openaiModel}
          onChange={(e) => setOpenaiModel(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>最大輸出長度（max_tokens）</Label>
        <Input
          type="number"
          value={openaiMaxTokens}
          onChange={(e) => setOpenaiMaxTokens(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>溫度（temperature）</Label>
        <Input
          type="number"
          step="0.1"
          value={openaiTemperature}
          onChange={(e) => setOpenaiTemperature(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>逾時（秒）</Label>
        <Input
          type="number"
          value={openaiTimeoutSec}
          onChange={(e) => setOpenaiTimeoutSec(e.target.value)}
        />
      </div>
    </div>

    <div className="flex gap-2">
      <Button onClick={saveOpenAISettings}>儲存 AI 設定</Button>
      <Button variant="outline" onClick={resetOpenAISettings}>重置為預設</Button>
    </div>
  </div>
</TabsContent>

          </Tabs>
        </div>
      </ScrollArea>

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增資料夾</DialogTitle>
            <DialogDescription>為你的筆記建立新的資料夾</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">資料夾名稱</Label>
              <Input
                id="folder-name"
                placeholder="輸入資料夾名稱"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>
              建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Dialog */}
      <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增標籤</DialogTitle>
            <DialogDescription>為你的筆記建立新的標籤</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">標籤名稱</Label>
              <Input
                id="tag-name"
                placeholder="輸入標籤名稱"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createTag()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={createTag} disabled={!newTagName.trim()}>
              建立
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
