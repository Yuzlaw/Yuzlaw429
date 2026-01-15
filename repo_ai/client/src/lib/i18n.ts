/**
 * 介面文字設定檔
 * 所有顯示在介面上的文字都可以在這裡自訂
 */

export interface UITexts {
  // 主要標題
  appTitle: string;
  
  // 側邊欄
  allNotes: string;
  folders: string;
  tags: string;
  trash: string;
  dashboard: string;
  settings: string;
  
  // 四大領域分類
  categoryNotes: string;
  categoryInvestment: string;
  categoryLearning: string;
  categoryLegal: string;
  
  // 主題切換
  darkMode: string;
  lightMode: string;
  
  // 筆記列表
  noNotes: string;
  createFirstNote: string;
  searchPlaceholder: string;
  
  // 編輯器
  titlePlaceholder: string;
  contentPlaceholder: string;
  saveButton: string;
  saved: string;
  
  // 設定頁面
  settingsTitle: string;
  importTab: string;
  exportTab: string;
  foldersTab: string;
  tagsTab: string;
  uiTextsTab: string;
  
  // 匯入
  importTitle: string;
  importDescription: string;
  uploadPrompt: string;
  
  // 匯出
  exportTitle: string;
  exportDescription: string;
  exportJSON: string;
  syncToSheets: string;
  setScriptURL: string;
  
  // 資料夾
  foldersTitle: string;
  addFolder: string;
  folderNamePlaceholder: string;
  
  // 標籤
  tagsTitle: string;
  addTag: string;
  tagNamePlaceholder: string;
  
  // 介面文字設定
  uiTextsTitle: string;
  uiTextsDescription: string;
  resetToDefault: string;
}

// 預設文字（繁體中文）
export const defaultTexts: UITexts = {
  appTitle: 'YuzXing',
  
  allNotes: '所有筆記',
  folders: '資料夾',
  tags: '標籤',
  trash: '最近刪除',
  dashboard: '控制台',
  settings: '設定',
  
  categoryNotes: '筆記',
  categoryInvestment: '投資',
  categoryLearning: '學習',
  categoryLegal: '法律',
  
  darkMode: '深色模式',
  lightMode: '淺色模式',
  
  noNotes: '尚無筆記',
  createFirstNote: '建立第一則筆記',
  searchPlaceholder: '搜尋',
  
  titlePlaceholder: '標題',
  contentPlaceholder: '開始輸入...',
  saveButton: '儲存',
  saved: '已儲存',
  
  settingsTitle: '設定',
  importTab: '匯入',
  exportTab: '匯出',
  foldersTab: '資料夾',
  tagsTab: '標籤',
  uiTextsTab: '介面文字',
  
  importTitle: '批次匯入 TXT 檔案',
  importDescription: '從 iPhone 備忘錄匯出的 TXT 檔案可以一次上傳多個，系統會自動建立對應的筆記。',
  uploadPrompt: '點擊選擇檔案或拖曳到此處',
  
  exportTitle: '匯出筆記',
  exportDescription: '將所有筆記匯出為 JSON 檔案或同步到 Google Sheets',
  exportJSON: '匯出為 JSON 檔案',
  syncToSheets: '同步到 Google Sheets',
  setScriptURL: '設定 Google Script URL',
  
  foldersTitle: '管理資料夾',
  addFolder: '新增資料夾',
  folderNamePlaceholder: '資料夾名稱',
  
  tagsTitle: '管理標籤',
  addTag: '新增標籤',
  tagNamePlaceholder: '標籤名稱',
  
  uiTextsTitle: '自訂介面文字',
  uiTextsDescription: '在這裡可以修改所有介面上顯示的文字',
  resetToDefault: '恢復預設值',
};

// 從 localStorage 讀取自訂文字
export function getUITexts(): UITexts {
  try {
    const stored = localStorage.getItem('ui-texts');
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultTexts, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load UI texts:', error);
  }
  return defaultTexts;
}

// 儲存自訂文字到 localStorage
export function saveUITexts(texts: Partial<UITexts>): void {
  try {
    const current = getUITexts();
    const updated = { ...current, ...texts };
    localStorage.setItem('ui-texts', JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save UI texts:', error);
  }
}

// 重置為預設值
export function resetUITexts(): void {
  try {
    localStorage.removeItem('ui-texts');
  } catch (error) {
    console.error('Failed to reset UI texts:', error);
  }
}
