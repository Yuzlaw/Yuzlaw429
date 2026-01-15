# 如何下載專案到電腦

有兩種方式可以下載這個專案到你的電腦：

## 方法 1：從 Manus 介面下載（最簡單）

1. 在右側的「Management UI」面板中
2. 點擊「Code」標籤
3. 點擊右上角的「Download All Files」按鈕
4. 會下載一個 ZIP 壓縮檔到你的電腦
5. 解壓縮後就可以使用了

## 方法 2：使用 Git Clone（適合開發者）

如果你已經把專案上傳到 GitHub，可以用以下方式下載：

```bash
# 複製 repository
git clone https://github.com/你的使用者名稱/iphone-notes-pwa.git

# 進入專案資料夾
cd iphone-notes-pwa

# 安裝相依套件
pnpm install
# 或
npm install
```

## 下載後如何使用？

### 在本地執行開發伺服器

```bash
# 安裝相依套件（第一次需要）
pnpm install

# 啟動開發伺服器
pnpm dev
```

然後在瀏覽器開啟 `http://localhost:5173`

### 建置成靜態檔案

如果你想要建置成可以直接開啟的 HTML 檔案：

```bash
# 建置專案
pnpm build
```

建置完成後，所有檔案會在 `dist` 資料夾中。

### 直接在瀏覽器開啟（不需要伺服器）

由於這個專案使用了 ES Modules 和一些現代功能，**無法直接雙擊 HTML 檔案開啟**。

你需要：

1. **使用本地伺服器**（推薦）：
   ```bash
   # 方法 A：使用 Python（如果已安裝）
   cd dist
   python -m http.server 8000
   # 然後開啟 http://localhost:8000
   
   # 方法 B：使用 Node.js serve
   npx serve dist
   ```

2. **或部署到 GitHub Pages**（參考 `DEPLOY_TO_GITHUB.md`）

## 專案結構說明

下載後你會看到這些重要資料夾和檔案：

```
iphone-notes-pwa/
├── client/                    # 前端程式碼
│   ├── src/
│   │   ├── pages/            # 頁面元件
│   │   │   ├── NotesLocal.tsx       # 筆記列表
│   │   │   ├── NoteEditorLocal.tsx  # 筆記編輯器
│   │   │   └── SettingsLocal.tsx    # 設定頁面
│   │   ├── lib/
│   │   │   └── db.ts         # IndexedDB 資料庫管理
│   │   └── App.tsx           # 主要路由
│   └── public/
│       ├── icon-192.png      # PWA icon（黑貓圖示）
│       ├── icon-512.png      # PWA icon（黑貓圖示）
│       └── manifest.json     # PWA 設定檔
├── server/                    # 後端程式碼（本地版本不需要）
├── DEPLOY_TO_GITHUB.md       # GitHub Pages 部署教學
├── GOOGLE_SCRIPT_SETUP.md    # Google Sheets 整合教學
└── package.json              # 專案設定檔
```

## 只想要前端檔案？

如果你只需要前端的 HTML/CSS/JS 檔案（不需要開發環境），可以：

1. 執行 `pnpm build`
2. 複製 `dist` 資料夾的所有內容
3. 這些就是可以部署的靜態檔案

## 修改後如何更新？

如果你修改了程式碼：

1. **本地測試**：`pnpm dev`
2. **建置**：`pnpm build`
3. **部署到 GitHub Pages**：參考 `DEPLOY_TO_GITHUB.md`

## 需要的軟體

- **Node.js**（版本 18 或以上）：https://nodejs.org/
- **pnpm**（套件管理工具）：
  ```bash
  npm install -g pnpm
  ```

## 疑難排解

### 問題：執行 `pnpm dev` 出現錯誤

**解決方法**：
```bash
# 刪除舊的 node_modules
rm -rf node_modules

# 重新安裝
pnpm install
```

### 問題：port 5173 已被佔用

**解決方法**：
```bash
# 使用其他 port
pnpm dev --port 3000
```

### 問題：沒有安裝 pnpm

**解決方法**：
```bash
# 安裝 pnpm
npm install -g pnpm

# 或直接用 npm
npm install
npm run dev
```

## 進階：自訂設定

### 修改 PWA 名稱和顏色

編輯 `client/public/manifest.json`：

```json
{
  "name": "你的 App 名稱",
  "short_name": "簡稱",
  "theme_color": "#你的顏色",
  ...
}
```

### 修改 icon

替換以下檔案：
- `client/public/icon-192.png`
- `client/public/icon-512.png`

建議使用正方形的 PNG 圖片。

## 備份你的筆記

由於資料儲存在瀏覽器的 IndexedDB 中，建議：

1. 定期使用「設定」→「匯出」→「匯出為 JSON 檔案」
2. 或設定 Google Sheets 自動同步
3. 瀏覽器的開發者工具 → Application → IndexedDB 也可以查看資料

## 需要幫助？

- 查看 `DEPLOY_TO_GITHUB.md` 了解如何部署
- 查看 `GOOGLE_SCRIPT_SETUP.md` 了解如何整合 Google Sheets
- 檢查 `todo.md` 了解專案功能清單
