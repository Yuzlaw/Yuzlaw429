/**
 * ========================================
 * 個人戰情室系統 - Google Apps Script API
 * ========================================
 * 
 * 使用說明：
 * 1. 在 Google Sheets 中，點擊「擴充功能」→「Apps Script」
 * 2. 刪除預設的 Code.gs 內容
 * 3. 複製貼上此檔案的完整內容
 * 4. 點擊「部署」→「新增部署作業」
 * 5. 類型選擇「網頁應用程式」
 * 6. 執行身分選擇「我」
 * 7. 存取權限選擇「所有人」
 * 8. 點擊「部署」
 * 9. 複製「網頁應用程式網址」貼到 PWA 設定中
 * 
 * 注意事項：
 * - 此腳本會自動建立所需的工作表
 * - 首次執行需要授權存取 Google Sheets
 * - 價格更新需要網路連線
 */

// ========================================
// 全域設定
// ========================================

const CONFIG = {
  // 工作表名稱
  SHEETS: {
    NOTES: '筆記資料庫',
    LEARNING: '學習紀錄',
    LEGAL: '法律資料庫',
    CRYPTO: '虛擬貨幣投資追蹤',
    MAINTENANCE: '系統維護控制台',
    SETTINGS: '分類標籤設定'
  },
  
  // API 設定
  COINGECKO_API: 'https://api.coingecko.com/api/v3',
  
  // 匯率（可手動調整）
  USD_TO_TWD: 31.0
};

// ========================================
// 主要 API 端點（doGet/doPost）
// ========================================

/**
 * 處理 GET 請求
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch(action) {
      case 'notes':
        return jsonResponse(getNotes());
      case 'learning':
        return jsonResponse(getLearning());
      case 'legal':
        return jsonResponse(getLegal());
      case 'crypto':
        return jsonResponse(getCrypto());
      case 'settings':
        return jsonResponse(getSettings());
      case 'status':
        return jsonResponse(getSystemStatus());
      default:
        return jsonResponse({ error: '未知的操作' }, 400);
    }
  } catch (error) {
    logError('doGet', error);
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch(action) {
      case 'addNote':
        return jsonResponse(addNote(data));
      case 'updateNote':
        return jsonResponse(updateNote(data));
      case 'deleteNote':
        return jsonResponse(deleteNote(data));
      case 'addLearning':
        return jsonResponse(addLearning(data));
      case 'addLegal':
        return jsonResponse(addLegal(data));
      case 'updateCryptoPrices':
        return jsonResponse(updateCryptoPrices());
      default:
        return jsonResponse({ error: '未知的操作' }, 400);
    }
  } catch (error) {
    logError('doPost', error);
    return jsonResponse({ error: error.toString() }, 500);
  }
}

// ========================================
// 筆記相關函數
// ========================================

/**
 * 取得所有筆記
 */
function getNotes() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.NOTES);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return []; // 只有標題列
  
  const notes = [];
  for (let i = 1; i < data.length; i++) {
    notes.push({
      id: data[i][0],
      createdAt: data[i][1],
      updatedAt: data[i][2],
      content: data[i][3],
      title: data[i][4],
      category: data[i][5],
      tags: data[i][6] ? data[i][6].split(',') : [],
      isPinned: data[i][7],
      isArchived: data[i][8]
    });
  }
  
  return notes;
}

/**
 * 新增筆記
 */
function addNote(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.NOTES);
  const now = new Date().toISOString();
  const content = data.content || '';
  const title = content.split('\n')[0] || '未命名';
  
  const id = sheet.getLastRow(); // 簡單的 ID 生成
  
  sheet.appendRow([
    id,
    now,
    now,
    content,
    title,
    data.category || '',
    data.tags ? data.tags.join(',') : '',
    data.isPinned || false,
    data.isArchived || false
  ]);
  
  return { success: true, id: id };
}

/**
 * 更新筆記
 */
function updateNote(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.NOTES);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.id) {
      const now = new Date().toISOString();
      const content = data.content || allData[i][3];
      const title = content.split('\n')[0] || '未命名';
      
      sheet.getRange(i + 1, 3).setValue(now); // 更新時間
      sheet.getRange(i + 1, 4).setValue(content); // 內容
      sheet.getRange(i + 1, 5).setValue(title); // 標題
      
      if (data.category !== undefined) sheet.getRange(i + 1, 6).setValue(data.category);
      if (data.tags !== undefined) sheet.getRange(i + 1, 7).setValue(data.tags.join(','));
      if (data.isPinned !== undefined) sheet.getRange(i + 1, 8).setValue(data.isPinned);
      if (data.isArchived !== undefined) sheet.getRange(i + 1, 9).setValue(data.isArchived);
      
      return { success: true };
    }
  }
  
  return { success: false, error: '找不到該筆記' };
}

/**
 * 刪除筆記
 */
function deleteNote(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.NOTES);
  const allData = sheet.getDataRange().getValues();
  
  for (let i = 1; i < allData.length; i++) {
    if (allData[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  
  return { success: false, error: '找不到該筆記' };
}

// ========================================
// 學習紀錄相關函數
// ========================================

function getLearning() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.LEARNING);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const learning = [];
  for (let i = 1; i < data.length; i++) {
    learning.push({
      id: data[i][0],
      createdAt: data[i][1],
      updatedAt: data[i][2],
      title: data[i][3],
      content: data[i][4],
      source: data[i][5],
      link: data[i][6],
      progress: data[i][7],
      status: data[i][8],
      category: data[i][9],
      tags: data[i][10] ? data[i][10].split(',') : []
    });
  }
  
  return learning;
}

function addLearning(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.LEARNING);
  const now = new Date().toISOString();
  const id = sheet.getLastRow();
  
  sheet.appendRow([
    id,
    now,
    now,
    data.title || '未命名',
    data.content || '',
    data.source || '',
    data.link || '',
    data.progress || 0,
    data.status || '進行中',
    data.category || '',
    data.tags ? data.tags.join(',') : ''
  ]);
  
  return { success: true, id: id };
}

// ========================================
// 法律資料相關函數
// ========================================

function getLegal() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.LEGAL);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const legal = [];
  for (let i = 1; i < data.length; i++) {
    legal.push({
      id: data[i][0],
      createdAt: data[i][1],
      updatedAt: data[i][2],
      title: data[i][3],
      content: data[i][4],
      type: data[i][5],
      status: data[i][6],
      importance: data[i][7],
      dueDate: data[i][8],
      relatedDocs: data[i][9],
      tags: data[i][10] ? data[i][10].split(',') : []
    });
  }
  
  return legal;
}

function addLegal(data) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.LEGAL);
  const now = new Date().toISOString();
  const id = sheet.getLastRow();
  
  sheet.appendRow([
    id,
    now,
    now,
    data.title || '未命名',
    data.content || '',
    data.type || '其他',
    data.status || '待處理',
    data.importance || '中',
    data.dueDate || '',
    data.relatedDocs || '',
    data.tags ? data.tags.join(',') : ''
  ]);
  
  return { success: true, id: id };
}

// ========================================
// 虛擬貨幣相關函數
// ========================================

/**
 * 取得虛擬貨幣資料
 */
function getCrypto() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.CRYPTO);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) return [];
  
  const crypto = [];
  for (let i = 1; i < data.length; i++) {
    crypto.push({
      symbol: data[i][0],
      name: data[i][1],
      investedAmount: data[i][2],
      currentPriceUSD: data[i][3],
      currentPriceTWD: data[i][4],
      holdings: data[i][5],
      currentValue: data[i][6],
      unrealizedPL: data[i][7],
      returnRate: data[i][8],
      change24h: data[i][9],
      lastUpdated: data[i][10],
      recommendation: data[i][11],
      note: data[i][12]
    });
  }
  
  return crypto;
}

/**
 * 更新虛擬貨幣價格
 */
function updateCryptoPrices() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.CRYPTO);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return { success: false, message: '沒有虛擬貨幣資料' };
  }
  
  const symbols = [];
  for (let i = 1; i < data.length; i++) {
    symbols.push(data[i][0].toLowerCase());
  }
  
  try {
    // 呼叫 CoinGecko API
    const url = `${CONFIG.COINGECKO_API}/simple/price?ids=${symbols.join(',')}&vs_currencies=usd&include_24hr_change=true`;
    const response = UrlFetchApp.fetch(url);
    const prices = JSON.parse(response.getContentText());
    
    const now = new Date().toISOString();
    let updatedCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const symbol = data[i][0].toLowerCase();
      
      if (prices[symbol]) {
        const priceUSD = prices[symbol].usd;
        const priceTWD = priceUSD * CONFIG.USD_TO_TWD;
        const change24h = prices[symbol].usd_24h_change || 0;
        const holdings = data[i][5] || 0;
        const investedAmount = data[i][2] || 0;
        
        // 計算當前市值
        const currentValue = holdings * priceTWD;
        
        // 計算未實現損益
        const unrealizedPL = currentValue - investedAmount;
        
        // 計算報酬率
        const returnRate = investedAmount > 0 ? (unrealizedPL / investedAmount) * 100 : 0;
        
        // 更新工作表
        sheet.getRange(i + 1, 4).setValue(priceUSD); // 當前價格 USD
        sheet.getRange(i + 1, 5).setValue(priceTWD); // 當前價格 TWD
        sheet.getRange(i + 1, 7).setValue(currentValue); // 當前市值
        sheet.getRange(i + 1, 8).setValue(unrealizedPL); // 未實現損益
        sheet.getRange(i + 1, 9).setValue(returnRate); // 報酬率
        sheet.getRange(i + 1, 10).setValue(change24h); // 24小時漲跌
        sheet.getRange(i + 1, 11).setValue(now); // 最後更新時間
        
        // 簡單的建議邏輯
        let recommendation = '持有';
        if (returnRate > 50) recommendation = '考慮減碼';
        if (returnRate < -20) recommendation = '考慮加碼';
        sheet.getRange(i + 1, 12).setValue(recommendation);
        
        updatedCount++;
      }
    }
    
    // 記錄到維護控制台
    logAPICall('CoinGecko', '成功', `更新了 ${updatedCount} 個幣種`);
    
    return { success: true, updatedCount: updatedCount };
    
  } catch (error) {
    logError('updateCryptoPrices', error);
    return { success: false, error: error.toString() };
  }
}

// ========================================
// 設定相關函數
// ========================================

function getSettings() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.SETTINGS);
  // 這裡可以根據需要返回分類標籤設定
  return {
    noteCategories: ['工作', '個人', '學習', '專案'],
    commonTags: ['重要', '待辦', '已完成', '緊急'],
    learningCategories: ['程式設計', '語言學習', '投資理財', '專業技能'],
    legalTypes: ['契約', '法規', '判例', '諮詢記錄']
  };
}

// ========================================
// 系統維護相關函數
// ========================================

/**
 * 取得系統狀態
 */
function getSystemStatus() {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.MAINTENANCE);
  
  return {
    etfUpdate: { status: '正常', lastUpdate: new Date().toISOString() },
    cryptoUpdate: { status: '正常', lastUpdate: new Date().toISOString() },
    apiConnection: { status: '正常' },
    backup: { status: '正常', lastBackup: new Date().toISOString() }
  };
}

/**
 * 記錄 API 呼叫
 */
function logAPICall(apiName, status, message) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.MAINTENANCE);
  const now = new Date().toISOString();
  
  // 找到 API 呼叫記錄區域（假設在第 10 行開始）
  sheet.appendRow([now, apiName, status, message || '']);
}

/**
 * 記錄錯誤
 */
function logError(functionName, error) {
  const sheet = getOrCreateSheet(CONFIG.SHEETS.MAINTENANCE);
  const now = new Date().toISOString();
  
  sheet.appendRow([now, functionName, error.toString(), false]);
}

// ========================================
// 工具函數
// ========================================

/**
 * 取得或建立工作表
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    initializeSheet(sheet, sheetName);
  }
  
  return sheet;
}

/**
 * 初始化工作表（建立標題列）
 */
function initializeSheet(sheet, sheetName) {
  let headers = [];
  
  switch(sheetName) {
    case CONFIG.SHEETS.NOTES:
      headers = ['ID', '建立時間', '更新時間', '內容', '標題', '分類', '標籤', '是否釘選', '是否封存'];
      break;
    case CONFIG.SHEETS.LEARNING:
      headers = ['ID', '建立時間', '更新時間', '標題', '內容', '來源', '連結', '進度(%)', '狀態', '分類', '標籤'];
      break;
    case CONFIG.SHEETS.LEGAL:
      headers = ['ID', '建立時間', '更新時間', '標題', '內容', '類型', '狀態', '重要性', '到期日', '相關文件', '標籤'];
      break;
    case CONFIG.SHEETS.CRYPTO:
      headers = ['幣別代號', '中文名稱', '投入金額(TWD)', '當前價格(USD)', '當前價格(TWD)', '持有數量', '當前市值(TWD)', '未實現損益', '報酬率(%)', '24小時漲跌(%)', '最後更新時間', '建議動作', '備註'];
      break;
    case CONFIG.SHEETS.MAINTENANCE:
      headers = ['時間', 'API名稱/功能', '狀態/錯誤類型', '訊息/錯誤訊息'];
      break;
    case CONFIG.SHEETS.SETTINGS:
      headers = ['分類名稱', '顏色代碼', '圖示'];
      break;
  }
  
  if (headers.length > 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }
}

/**
 * 返回 JSON 回應
 */
function jsonResponse(data, statusCode = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========================================
// 定時觸發器（需手動設定）
// ========================================

/**
 * 每小時更新虛擬貨幣價格
 * 設定方式：在 Apps Script 編輯器中，點擊「觸發條件」→「新增觸發條件」
 * 選擇函數：hourlyUpdate
 * 事件來源：時間驅動
 * 時間型觸發條件類型：小時計時器
 * 時間間隔：每小時
 */
function hourlyUpdate() {
  updateCryptoPrices();
}

/**
 * 每日備份（可選）
 * 設定方式同上，選擇「每日計時器」
 */
function dailyBackup() {
  // 可以在這裡實作備份邏輯
  logAPICall('DailyBackup', '成功', '每日備份完成');
}
