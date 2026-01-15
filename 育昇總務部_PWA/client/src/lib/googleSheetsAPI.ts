/**
 * Google Sheets API 客戶端
 * 用於與 Google Apps Script 通訊
 */

// Google Apps Script 部署的網址（需要使用者設定）
let SCRIPT_URL = localStorage.getItem('googleScriptURL') || '';

/**
 * 設定 Google Apps Script URL
 */
export function setScriptURL(url: string) {
  SCRIPT_URL = url;
  localStorage.setItem('googleScriptURL', url);
}

/**
 * 取得當前設定的 Script URL
 */
export function getScriptURL(): string {
  return SCRIPT_URL;
}

/**
 * 檢查是否已設定 Script URL
 */
export function isScriptURLConfigured(): boolean {
  return SCRIPT_URL.length > 0;
}

/**
 * 通用的 API 呼叫函數
 */
async function callAPI(action: string, method: 'GET' | 'POST' = 'GET', data?: any) {
  if (!SCRIPT_URL) {
    throw new Error('請先在設定中配置 Google Apps Script URL');
  }

  try {
    let url = SCRIPT_URL;
    let options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'GET') {
      url += `?action=${action}`;
    } else {
      options.body = JSON.stringify({ action, ...data });
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API 錯誤: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API 呼叫失敗:', error);
    throw error;
  }
}

// ========================================
// 筆記相關 API
// ========================================

export interface Note {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  content: string;
  title?: string;
  category?: string;
  tags?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
}

export async function getNotes(): Promise<Note[]> {
  return await callAPI('notes', 'GET');
}

export async function addNote(note: Note): Promise<{ success: boolean; id: number }> {
  return await callAPI('addNote', 'POST', note);
}

export async function updateNote(id: number, note: Partial<Note>): Promise<{ success: boolean }> {
  return await callAPI('updateNote', 'POST', { id, ...note });
}

export async function deleteNote(id: number): Promise<{ success: boolean }> {
  return await callAPI('deleteNote', 'POST', { id });
}

// ========================================
// 學習紀錄相關 API
// ========================================

export interface Learning {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  content: string;
  source?: string;
  link?: string;
  progress?: number;
  status?: string;
  category?: string;
  tags?: string[];
}

export async function getLearning(): Promise<Learning[]> {
  return await callAPI('learning', 'GET');
}

export async function addLearning(learning: Learning): Promise<{ success: boolean; id: number }> {
  return await callAPI('addLearning', 'POST', learning);
}

// ========================================
// 法律資料相關 API
// ========================================

export interface Legal {
  id?: number;
  createdAt?: string;
  updatedAt?: string;
  title: string;
  content: string;
  type?: string;
  status?: string;
  importance?: string;
  dueDate?: string;
  relatedDocs?: string;
  tags?: string[];
}

export async function getLegal(): Promise<Legal[]> {
  return await callAPI('legal', 'GET');
}

export async function addLegal(legal: Legal): Promise<{ success: boolean; id: number }> {
  return await callAPI('addLegal', 'POST', legal);
}

// ========================================
// 虛擬貨幣相關 API
// ========================================

export interface Crypto {
  symbol: string;
  name: string;
  investedAmount: number;
  currentPriceUSD: number;
  currentPriceTWD: number;
  holdings: number;
  currentValue: number;
  unrealizedPL: number;
  returnRate: number;
  change24h: number;
  lastUpdated: string;
  recommendation: string;
  note: string;
}

export async function getCrypto(): Promise<Crypto[]> {
  return await callAPI('crypto', 'GET');
}

export async function updateCryptoPrices(): Promise<{ success: boolean; updatedCount: number }> {
  return await callAPI('updateCryptoPrices', 'POST');
}

// ========================================
// 設定相關 API
// ========================================

export interface Settings {
  noteCategories: string[];
  commonTags: string[];
  learningCategories: string[];
  legalTypes: string[];
}

export async function getSettings(): Promise<Settings> {
  return await callAPI('settings', 'GET');
}

// ========================================
// 系統狀態相關 API
// ========================================

export interface SystemStatus {
  etfUpdate: { status: string; lastUpdate: string };
  cryptoUpdate: { status: string; lastUpdate: string };
  apiConnection: { status: string };
  backup: { status: string; lastBackup: string };
}

export async function getSystemStatus(): Promise<SystemStatus> {
  return await callAPI('status', 'GET');
}

// ========================================
// 資料同步功能
// ========================================

/**
 * 同步本地資料到 Google Sheets
 */
export async function syncToGoogleSheets(localNotes: Note[]): Promise<{ success: boolean; syncedCount: number }> {
  if (!isScriptURLConfigured()) {
    throw new Error('請先設定 Google Apps Script URL');
  }

  let syncedCount = 0;
  
  for (const note of localNotes) {
    try {
      if (note.id) {
        // 更新現有筆記
        await updateNote(note.id, note);
      } else {
        // 新增筆記
        await addNote(note);
      }
      syncedCount++;
    } catch (error) {
      console.error('同步筆記失敗:', note, error);
    }
  }

  return { success: true, syncedCount };
}

/**
 * 從 Google Sheets 同步資料到本地
 */
export async function syncFromGoogleSheets(): Promise<Note[]> {
  if (!isScriptURLConfigured()) {
    throw new Error('請先設定 Google Apps Script URL');
  }

  return await getNotes();
}
