/**
 * iPhone 備忘錄 PWA - Google Apps Script 完整程式碼
 * 
 * 使用說明：
 * 1. 開啟 Google Sheets（建立一個新的試算表）
 * 2. 點選「擴充功能」→「Apps Script」
 * 3. 把這整份程式碼貼上（取代原本的內容）
 * 4. 點選「部署」→「新增部署作業」
 * 5. 類型選「網頁應用程式」
 * 6. 執行身分選「我」
 * 7. 存取權選「所有人」
 * 8. 點選「部署」
 * 9. 複製「網頁應用程式 URL」
 * 10. 在 PWA 的「設定」→「匯出」中貼上這個 URL
 */

// ==================== 主要函數 ====================

/**
 * 處理 POST 請求（從 PWA 接收筆記資料）
 */
function doPost(e) {
  try {
    // 解析 JSON 資料
    const data = JSON.parse(e.postData.contents);
    const notes = data.notes;
    
    if (!notes || !Array.isArray(notes)) {
      return createResponse(false, '資料格式錯誤');
    }
    
    // 取得或建立工作表
    const sheet = getOrCreateSheet('備忘錄');
    
    // 清空現有資料（保留標題列）
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    }
    
    // 設定標題列（如果是空的）
    if (sheet.getLastRow() === 0) {
      const headers = ['標題', '內容', '資料夾', '標籤', '釘選', '建立時間', '更新時間'];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      
      // 美化標題列
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
    }
    
    // 寫入筆記資料
    if (notes.length > 0) {
      const rows = notes.map(note => [
        note.title || '',
        note.content || '',
        note.folderName || '',
        Array.isArray(note.tags) ? note.tags.join(', ') : '',
        note.isPinned ? '是' : '否',
        note.createdAt || '',
        note.updatedAt || ''
      ]);
      
      sheet.getRange(2, 1, rows.length, 7).setValues(rows);
      
      // 自動調整欄寬
      for (let i = 1; i <= 7; i++) {
        sheet.autoResizeColumn(i);
      }
      
      // 凍結標題列
      sheet.setFrozenRows(1);
    }
    
    return createResponse(true, `成功同步 ${notes.length} 則筆記`);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, '同步失敗：' + error.toString());
  }
}

/**
 * 處理 GET 請求（測試用）
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: 'Google Apps Script 運作正常！',
      timestamp: new Date().toISOString()
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ==================== 輔助函數 ====================

/**
 * 取得或建立工作表
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  
  return sheet;
}

/**
 * 建立回應
 */
function createResponse(success, message) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==================== 進階功能（選用）====================

/**
 * 定期備份到另一個工作表（每天執行一次）
 * 
 * 設定方式：
 * 1. 在 Apps Script 編輯器中，點選左側的「觸發條件」（時鐘圖示）
 * 2. 點選「新增觸發條件」
 * 3. 選擇函式：dailyBackup
 * 4. 選擇事件來源：時間驅動
 * 5. 選擇時間型觸發條件類型：日計時器
 * 6. 選擇時段：凌晨 0 時至 1 時
 * 7. 儲存
 */
function dailyBackup() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sourceSheet = ss.getSheetByName('備忘錄');
    
    if (!sourceSheet) {
      Logger.log('找不到「備忘錄」工作表');
      return;
    }
    
    // 建立備份工作表名稱（格式：備份_2024-01-01）
    const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const backupSheetName = '備份_' + today;
    
    // 檢查是否已有今天的備份
    let backupSheet = ss.getSheetByName(backupSheetName);
    if (backupSheet) {
      ss.deleteSheet(backupSheet);
    }
    
    // 複製工作表
    backupSheet = sourceSheet.copyTo(ss);
    backupSheet.setName(backupSheetName);
    
    Logger.log('備份完成：' + backupSheetName);
    
    // 刪除超過 30 天的備份
    deleteOldBackups(30);
    
  } catch (error) {
    Logger.log('備份失敗：' + error.toString());
  }
}

/**
 * 刪除超過指定天數的備份
 */
function deleteOldBackups(days) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  sheets.forEach(sheet => {
    const name = sheet.getName();
    if (name.startsWith('備份_')) {
      try {
        const dateStr = name.replace('備份_', '');
        const sheetDate = new Date(dateStr);
        
        if (sheetDate < cutoffDate) {
          ss.deleteSheet(sheet);
          Logger.log('已刪除舊備份：' + name);
        }
      } catch (error) {
        // 忽略無效的日期格式
      }
    }
  });
}

/**
 * 匯出為 CSV 檔案（手動執行）
 * 
 * 執行後會在你的 Google Drive 根目錄建立 CSV 檔案
 */
function exportToCSV() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('備忘錄');
  
  if (!sheet) {
    Logger.log('找不到「備忘錄」工作表');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  let csv = '';
  
  data.forEach(row => {
    csv += row.map(cell => {
      // 處理包含逗號或換行的內容
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',') + '\n';
  });
  
  // 建立 CSV 檔案
  const fileName = '備忘錄_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.csv';
  const file = DriveApp.createFile(fileName, csv, MimeType.CSV);
  
  Logger.log('CSV 檔案已建立：' + file.getUrl());
}

/**
 * 統計資訊（手動執行）
 * 
 * 在試算表中建立一個「統計」工作表，顯示筆記的統計資訊
 */
function createStatistics() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const notesSheet = ss.getSheetByName('備忘錄');
  
  if (!notesSheet) {
    Logger.log('找不到「備忘錄」工作表');
    return;
  }
  
  // 取得或建立統計工作表
  let statsSheet = ss.getSheetByName('統計');
  if (statsSheet) {
    ss.deleteSheet(statsSheet);
  }
  statsSheet = ss.insertSheet('統計');
  
  // 取得資料
  const data = notesSheet.getDataRange().getValues();
  const headers = data[0];
  const notes = data.slice(1);
  
  // 計算統計
  const totalNotes = notes.length;
  const pinnedNotes = notes.filter(row => row[4] === '是').length;
  const foldersCount = new Set(notes.map(row => row[2]).filter(f => f)).size;
  const tagsCount = new Set(
    notes.flatMap(row => String(row[3]).split(',').map(t => t.trim()).filter(t => t))
  ).size;
  
  // 寫入統計資料
  const stats = [
    ['統計項目', '數值'],
    ['總筆記數', totalNotes],
    ['釘選筆記數', pinnedNotes],
    ['資料夾數', foldersCount],
    ['標籤數', tagsCount],
    ['最後更新', new Date().toLocaleString('zh-TW')]
  ];
  
  statsSheet.getRange(1, 1, stats.length, 2).setValues(stats);
  
  // 美化
  const headerRange = statsSheet.getRange(1, 1, 1, 2);
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  
  statsSheet.autoResizeColumns(1, 2);
  
  Logger.log('統計資訊已建立');
}
