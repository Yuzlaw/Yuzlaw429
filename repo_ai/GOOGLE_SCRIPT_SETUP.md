# Google Apps Script 設定教學

這個文件說明如何設定 Google Apps Script 來接收從 育昇總務部｜備忘錄 PWA 匯出的筆記資料，並自動寫入 Google Sheets。

## 步驟 1：建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立一個新的試算表
3. 將第一個工作表命名為「筆記」
4. 在第一列建立標題欄位：
   - A1: 標題
   - B1: 內容
   - C1: 資料夾
   - D1: 標籤
   - E1: 釘選
   - F1: 建立時間
   - G1: 更新時間

## 步驟 2：建立 Google Apps Script

1. 在你的 Google Sheets 中，點擊「擴充功能」→「Apps Script」
2. 刪除預設的程式碼
3. 複製貼上下方的程式碼：

```javascript
function doPost(e) {
  try {
    // 解析接收到的 JSON 資料
    const data = JSON.parse(e.postData.contents);
    const notes = data.notes;
    
    // 取得試算表
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('筆記');
    
    // 如果工作表不存在，建立一個
    if (!sheet) {
      const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('筆記');
      newSheet.appendRow(['標題', '內容', '資料夾', '標籤', '釘選', '建立時間', '更新時間']);
    }
    
    const targetSheet = sheet || SpreadsheetApp.getActiveSpreadsheet().getSheetByName('筆記');
    
    // 清除舊資料（保留標題列）
    if (targetSheet.getLastRow() > 1) {
      targetSheet.deleteRows(2, targetSheet.getLastRow() - 1);
    }
    
    // 寫入新資料
    notes.forEach(note => {
      targetSheet.appendRow([
        note.標題 || '',
        note.內容 || '',
        note.資料夾 || '',
        note.標籤 || '',
        note.釘選 || '',
        note.建立時間 || '',
        note.更新時間 || ''
      ]);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: `成功匯入 ${notes.length} 則筆記`
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Google Apps Script is running!');
}
```

## 步驟 3：部署 Web App

1. 點擊右上角的「部署」→「新增部署」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - 說明：育昇總務部｜備忘錄 PWA 同步
   - 執行身分：選擇「我」
   - 具有應用程式存取權的使用者：選擇「任何人」
4. 點擊「部署」
5. 複製「網頁應用程式 URL」（格式類似：`https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`）

## 步驟 4：在 PWA 中設定

1. 開啟 育昇總務部｜備忘錄 PWA
2. 前往「設定」頁面
3. 切換到「匯出」分頁
4. 點擊「設定 Google Script URL」
5. 貼上剛才複製的 URL
6. 點擊「儲存」

## 使用方式

設定完成後，你可以：

1. 在 PWA 的「設定」→「匯出」頁面
2. 點擊「同步到 Google Sheets」按鈕
3. 所有筆記會自動上傳到你的 Google Sheets

## 進階功能

### 增量更新（不清除舊資料）

如果你想要保留舊資料，只新增新筆記，可以修改程式碼：

```javascript
// 註解掉清除舊資料的部分
// if (targetSheet.getLastRow() > 1) {
//   targetSheet.deleteRows(2, targetSheet.getLastRow() - 1);
// }

// 改為檢查重複並更新
notes.forEach(note => {
  // 檢查是否已存在（根據標題和建立時間）
  const existingRow = findExistingNote(targetSheet, note.標題, note.建立時間);
  
  if (existingRow) {
    // 更新現有筆記
    targetSheet.getRange(existingRow, 1, 1, 7).setValues([[
      note.標題, note.內容, note.資料夾, note.標籤, note.釘選, note.建立時間, note.更新時間
    ]]);
  } else {
    // 新增筆記
    targetSheet.appendRow([
      note.標題, note.內容, note.資料夾, note.標籤, note.釘選, note.建立時間, note.更新時間
    ]);
  }
});

function findExistingNote(sheet, title, createdAt) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === title && data[i][5] === createdAt) {
      return i + 1; // 回傳列號（1-based）
    }
  }
  return null;
}
```

### 自動備份到其他工作表

```javascript
// 在寫入資料前，先備份到另一個工作表
const backupSheetName = '備份_' + new Date().toISOString().split('T')[0];
const backupSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(backupSheetName);
const sourceData = targetSheet.getDataRange().getValues();
backupSheet.getRange(1, 1, sourceData.length, sourceData[0].length).setValues(sourceData);
```

## 疑難排解

### 錯誤：「未授權」
- 確認部署時選擇「具有應用程式存取權的使用者：任何人」
- 重新部署並使用新的 URL

### 資料沒有出現
- 檢查工作表名稱是否為「筆記」
- 查看 Apps Script 的執行記錄（查看 → 執行記錄）

### CORS 錯誤
- 這是正常的，因為使用 `no-cors` 模式
- 只要 Google Sheets 有收到資料就表示成功

## 注意事項

- Google Apps Script 有每日配額限制
- 建議不要過於頻繁地同步（例如每小時一次即可）
- 大量資料（超過 1000 筆）可能需要較長時間處理
