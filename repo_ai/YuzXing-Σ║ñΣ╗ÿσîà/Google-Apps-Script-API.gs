/**
 * YuzXing 個人戰情室系統 - Google Apps Script API
 * 
 * 部署方式：
 * 1. 開啟 Google Sheets
 * 2. 工具 > 指令碼編輯器
 * 3. 貼上此程式碼
 * 4. 部署 > 新增部署作業 > 類型：網頁應用程式
 * 5. 執行身分：我
 * 6. 存取權：任何人
 * 7. 複製網頁應用程式 URL
 */

// ==================== 設定 ====================

// 試算表 ID（請替換為您的試算表 ID）
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID';

// 工作表名稱
const SHEETS = {
  NOTES: '筆記資料庫',
  ETF: 'ETF投資追蹤',
  ACCOUNTING: '每日記帳',
  LEARNING: '學習紀錄',
  LEGAL: '法律資料庫',
};

// ==================== 主要處理函數 ====================

/**
 * 處理 GET 請求
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = e.parameter.sheet;
    
    if (!action || !sheet) {
      return createResponse({ error: '缺少必要參數' }, 400);
    }
    
    switch (action) {
      case 'getAll':
        return getAllData(sheet);
      case 'getById':
        return getDataById(sheet, e.parameter.id);
      default:
        return createResponse({ error: '無效的操作' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

/**
 * 處理 POST 請求
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const sheet = data.sheet;
    
    if (!action || !sheet) {
      return createResponse({ error: '缺少必要參數' }, 400);
    }
    
    switch (action) {
      case 'create':
        return createData(sheet, data.record);
      case 'update':
        return updateData(sheet, data.id, data.record);
      case 'delete':
        return deleteData(sheet, data.id);
      case 'updateETFPrices':
        return updateETFPrices();
      default:
        return createResponse({ error: '無效的操作' }, 400);
    }
  } catch (error) {
    return createResponse({ error: error.toString() }, 500);
  }
}

// ==================== 資料操作函數 ====================

/**
 * 取得所有資料
 */
function getAllData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return createResponse({ error: '工作表不存在' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  }).filter(record => record.ID); // 過濾空白行
  
  return createResponse({ data: records });
}

/**
 * 根據 ID 取得資料
 */
function getDataById(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return createResponse({ error: '工作表不存在' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('ID');
  
  if (idIndex === -1) {
    return createResponse({ error: 'ID 欄位不存在' }, 400);
  }
  
  const rowIndex = data.findIndex((row, index) => index > 0 && row[idIndex] == id);
  
  if (rowIndex === -1) {
    return createResponse({ error: '找不到資料' }, 404);
  }
  
  const record = {};
  headers.forEach((header, index) => {
    record[header] = data[rowIndex][index];
  });
  
  return createResponse({ data: record });
}

/**
 * 新增資料
 */
function createData(sheetName, record) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return createResponse({ error: '工作表不存在' }, 404);
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastRow = sheet.getLastRow();
  
  // 自動生成 ID
  const newId = lastRow; // 簡單使用行號作為 ID
  record.ID = newId;
  
  // 自動設定時間
  const now = new Date();
  if (headers.includes('建立時間')) record['建立時間'] = now;
  if (headers.includes('更新時間')) record['更新時間'] = now;
  
  // 準備新行資料
  const newRow = headers.map(header => record[header] || '');
  
  // 新增到試算表
  sheet.appendRow(newRow);
  
  return createResponse({ 
    success: true, 
    id: newId,
    data: record 
  });
}

/**
 * 更新資料
 */
function updateData(sheetName, id, record) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return createResponse({ error: '工作表不存在' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('ID');
  
  if (idIndex === -1) {
    return createResponse({ error: 'ID 欄位不存在' }, 400);
  }
  
  const rowIndex = data.findIndex((row, index) => index > 0 && row[idIndex] == id);
  
  if (rowIndex === -1) {
    return createResponse({ error: '找不到資料' }, 404);
  }
  
  // 自動更新時間
  const now = new Date();
  if (headers.includes('更新時間')) record['更新時間'] = now;
  
  // 更新資料
  headers.forEach((header, colIndex) => {
    if (record.hasOwnProperty(header) && header !== 'ID') {
      sheet.getRange(rowIndex + 1, colIndex + 1).setValue(record[header]);
    }
  });
  
  return createResponse({ 
    success: true,
    data: record 
  });
}

/**
 * 刪除資料
 */
function deleteData(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return createResponse({ error: '工作表不存在' }, 404);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf('ID');
  
  if (idIndex === -1) {
    return createResponse({ error: 'ID 欄位不存在' }, 400);
  }
  
  const rowIndex = data.findIndex((row, index) => index > 0 && row[idIndex] == id);
  
  if (rowIndex === -1) {
    return createResponse({ error: '找不到資料' }, 404);
  }
  
  // 刪除該行
  sheet.deleteRow(rowIndex + 1);
  
  return createResponse({ success: true });
}

// ==================== ETF 專用函數 ====================

/**
 * 更新所有 ETF 價格
 * 使用 GOOGLEFINANCE 函數自動更新
 */
function updateETFPrices() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEETS.ETF);
  
  if (!sheet) {
    return createResponse({ error: 'ETF 工作表不存在' }, 404);
  }
  
  // GOOGLEFINANCE 函數會自動更新，這裡只需要觸發重新計算
  SpreadsheetApp.flush();
  
  // 取得更新後的資料
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const records = rows.map(row => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index];
    });
    return record;
  }).filter(record => record['ETF代號']);
  
  return createResponse({ 
    success: true,
    data: records,
    updatedAt: new Date()
  });
}

// ==================== 輔助函數 ====================

/**
 * 建立回應
 */
function createResponse(data, statusCode = 200) {
  const response = {
    statusCode: statusCode,
    ...data
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 定時觸發器 ====================

/**
 * 每日自動更新 ETF 價格
 * 設定方式：觸發條件 > 新增觸發條件 > 選擇函數：dailyUpdateETF
 * 選擇時間：每日上午 9:00-10:00
 */
function dailyUpdateETF() {
  updateETFPrices();
  Logger.log('ETF 價格已更新：' + new Date());
}

/**
 * 每小時更新 ETF 價格（選用）
 */
function hourlyUpdateETF() {
  updateETFPrices();
  Logger.log('ETF 價格已更新：' + new Date());
}
