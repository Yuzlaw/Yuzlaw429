import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Plus, Upload, FolderPlus, Tag as TagIcon, Trash2, Download } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { notesDB, type Folder, type Tag } from '@/lib/db';
import { useUITexts } from '@/contexts/UITextsContext';
import { type UITexts } from '@/lib/i18n';

export default function SettingsLocal() {
  const [location, navigate] = useLocation();
  const isSyncMode = location.startsWith('/sync');
  const basePath = isSyncMode ? '/sync' : '';

  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false);
  const [newTagDialogOpen, setNewTagDialogOpen] = useState(false);
  const [googleScriptDialogOpen, setGoogleScriptDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [googleScriptUrl, setGoogleScriptUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { texts, updateTexts, resetUITexts } = useUITexts();
  const [editingTexts, setEditingTexts] = useState<Partial<UITexts>>({});

  useEffect(() => {
    fetchFolders();
    fetchTags();
    // 從 localStorage 讀取 Google Script URL
    const savedUrl = localStorage.getItem('googleScriptUrl');
    if (savedUrl) setGoogleScriptUrl(savedUrl);
  }, []);

  const fetchFolders = async () => {
    try {
      const data = await notesDB.getAllFolders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await notesDB.getAllTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await notesDB.addFolder({
        name: newFolderName,
        icon: '📁',
        createdAt: new Date().toISOString(),
      });
      toast.success('已建立資料夾');
      setNewFolderName('');
      setNewFolderDialogOpen(false);
      fetchFolders();
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('建立失敗');
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;

    try {
      await notesDB.addTag({
        name: newTagName,
        color: '#007AFF',
        createdAt: new Date().toISOString(),
      });
      toast.success('已建立標籤');
      setNewTagName('');
      setNewTagDialogOpen(false);
      fetchTags();
    } catch (error) {
      console.error('Failed to create tag:', error);
      toast.error('建立失敗');
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      await notesDB.deleteFolder(id);
      toast.success('已刪除資料夾');
      fetchFolders();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('刪除失敗');
    }
  };

  const deleteTag = async (id: number) => {
    try {
      await notesDB.deleteTag(id);
      toast.success('已刪除標籤');
      fetchTags();
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
          importedNotes.push({
            title,
            content,
            folderId: undefined,
            isPinned: false,
            tags: [],
            isDeleted: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

      if (importedNotes.length > 0) {
        await notesDB.importNotes(importedNotes);
        toast.success(`成功匯入 ${importedNotes.length} 則筆記`);
        navigate(`${basePath}/notes`);
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

  const exportToJSON = async () => {
    try {
      const json = await notesDB.exportToJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('已匯出 JSON 檔案');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('匯出失敗');
    }
  };

  const exportToGoogleSheets = async () => {
    if (!googleScriptUrl.trim()) {
      toast.error('請先設定 Google Apps Script URL');
      setGoogleScriptDialogOpen(true);
      return;
    }

    setExporting(true);
    try {
      const data = await notesDB.exportNotesToArray();
      
      const response = await fetch(googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: data }),
      });

      // 因為 no-cors 模式無法讀取回應，所以假設成功
      toast.success(`已發送 ${data.length} 則筆記到 Google Sheets`);
    } catch (error) {
      console.error('Failed to export to Google Sheets:', error);
      toast.error('匯出失敗，請檢查 Google Script URL');
    } finally {
      setExporting(false);
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

  const saveGoogleScriptUrl = () => {
    localStorage.setItem('googleScriptUrl', googleScriptUrl);
    toast.success('已儲存 Google Script URL');
    setGoogleScriptDialogOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(`${basePath}/notes`)}>
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
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="import">匯入</TabsTrigger>
              <TabsTrigger value="export">匯出</TabsTrigger>
              <TabsTrigger value="folders">資料夾</TabsTrigger>
              <TabsTrigger value="tags">標籤</TabsTrigger>
              <TabsTrigger value="ui-texts">介面文字</TabsTrigger>
              <TabsTrigger value="ai">AI 設定</TabsTrigger>
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
              </div>
            </TabsContent>

            {/* 匯出 Tab */}
            <TabsContent value="export" className="space-y-4 mt-4">
              <div className="rounded-lg border p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">匯出筆記</h3>
                  <p className="text-sm text-muted-foreground">
                    將所有筆記匯出為 JSON 檔案或同步到 Google Sheets
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={exportToJSON} className="w-full" variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    匯出為 JSON 檔案
                  </Button>
                  <Button 
                    onClick={exportToGoogleSheets} 
                    className="w-full"
                    disabled={exporting}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {exporting ? '匯出中...' : '同步到 Google Sheets'}
                  </Button>
                  <Button 
                    onClick={() => setGoogleScriptDialogOpen(true)} 
                    className="w-full"
                    variant="ghost"
                    size="sm"
                  >
                    設定 Google Script URL
                  </Button>
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
                        onClick={() => deleteFolder(folder.id!)}
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
                        onClick={() => deleteTag(tag.id!)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* 介面文字 Tab */}
            <TabsContent value="ui-texts" className="space-y-4 mt-4">
              <div className="rounded-lg border p-6 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">自訂介面文字</h3>
                  <p className="text-sm text-muted-foreground">
                    在這裡可以修改所有介面上顯示的文字，修改後會立即生效。
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="appTitle">應用程式標題</Label>
                      <Input
                        id="appTitle"
                        value={editingTexts.appTitle ?? texts.appTitle}
                        onChange={(e) => setEditingTexts({ ...editingTexts, appTitle: e.target.value })}
                        placeholder={texts.appTitle}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="allNotes">「所有筆記」按鈕</Label>
                      <Input
                        id="allNotes"
                        value={editingTexts.allNotes ?? texts.allNotes}
                        onChange={(e) => setEditingTexts({ ...editingTexts, allNotes: e.target.value })}
                        placeholder={texts.allNotes}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="createFirstNote">「建立第一則筆記」按鈕</Label>
                      <Input
                        id="createFirstNote"
                        value={editingTexts.createFirstNote ?? texts.createFirstNote}
                        onChange={(e) => setEditingTexts({ ...editingTexts, createFirstNote: e.target.value })}
                        placeholder={texts.createFirstNote}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="searchPlaceholder">搜尋框提示</Label>
                      <Input
                        id="searchPlaceholder"
                        value={editingTexts.searchPlaceholder ?? texts.searchPlaceholder}
                        onChange={(e) => setEditingTexts({ ...editingTexts, searchPlaceholder: e.target.value })}
                        placeholder={texts.searchPlaceholder}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="saveButton">「儲存」按鈕</Label>
                      <Input
                        id="saveButton"
                        value={editingTexts.saveButton ?? texts.saveButton}
                        onChange={(e) => setEditingTexts({ ...editingTexts, saveButton: e.target.value })}
                        placeholder={texts.saveButton}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={() => {
                        updateTexts(editingTexts);
                        setEditingTexts({});
                        toast.success('已儲存介面文字設定');
                      }}
                      className="flex-1"
                    >
                      儲存變更
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (confirm('確定要恢復為預設值嗎？')) {
                          resetUITexts();
                          setEditingTexts({});
                          toast.success('已恢復為預設值');
                        }
                      }}
                    >
                      恢復預設
                    </Button>
                  </div>
                </div>
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
        type={showApiKey ? "text" : "password"}
        placeholder="sk-..."
        value={openaiApiKey}
        onChange={(e) => setOpenaiApiKey(e.target.value)}
      />
            <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowApiKey(!showApiKey)}
        >
          {showApiKey ? '隱藏金鑰' : '顯示金鑰'}
        </Button>
      </div>
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

      {/* Dialogs */}
      <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增資料夾</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="資料夾名稱"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createFolder()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderDialogOpen(false)}>取消</Button>
            <Button onClick={createFolder}>建立</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={newTagDialogOpen} onOpenChange={setNewTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增標籤</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="標籤名稱"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && createTag()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagDialogOpen(false)}>取消</Button>
            <Button onClick={createTag}>建立</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={googleScriptDialogOpen} onOpenChange={setGoogleScriptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>設定 Google Apps Script URL</DialogTitle>
            <DialogDescription>
              請輸入你的 Google Apps Script Web App URL
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
            value={googleScriptUrl}
            onChange={(e) => setGoogleScriptUrl(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoogleScriptDialogOpen(false)}>取消</Button>
            <Button onClick={saveGoogleScriptUrl}>儲存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
