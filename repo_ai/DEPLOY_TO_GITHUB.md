# 部署到 GitHub Pages 教學

這個文件說明如何將 育昇總務部｜備忘錄 PWA 部署到 GitHub Pages，讓你可以免費託管並從任何裝置存取。

## 前置準備

1. 一個 GitHub 帳號
2. Git 已安裝在你的電腦上
3. 專案的原始碼

## 步驟 1：準備專案

由於這個專案是用 Vite 建立的，我們需要先建置靜態檔案。

### 1.1 修改 vite.config.ts

在專案根目錄找到 `vite.config.ts`，確保有設定正確的 base path：

```typescript
export default defineConfig({
  base: '/iphone-notes-pwa/', // 改成你的 repo 名稱
  // ... 其他設定
});
```

### 1.2 建置專案

在終端機執行：

```bash
npm run build
# 或
pnpm build
```

這會在 `dist` 資料夾產生靜態檔案。

## 步驟 2：建立 GitHub Repository

1. 前往 [GitHub](https://github.com)
2. 點擊右上角的「+」→「New repository」
3. 填寫資訊：
   - Repository name: `iphone-notes-pwa`（或你喜歡的名稱）
   - Description: iPhone 風格的電子記事本 PWA
   - Public（公開）或 Private（私人）都可以
4. 點擊「Create repository」

## 步驟 3：上傳程式碼

### 方法 A：使用 GitHub Desktop（推薦給新手）

1. 下載並安裝 [GitHub Desktop](https://desktop.github.com/)
2. 開啟 GitHub Desktop，登入你的帳號
3. 點擊「File」→「Add local repository」
4. 選擇你的專案資料夾
5. 點擊「Publish repository」

### 方法 B：使用命令列

在專案根目錄執行：

```bash
# 初始化 git（如果還沒有的話）
git init

# 加入所有檔案
git add .

# 提交變更
git commit -m "Initial commit"

# 連結到 GitHub repository
git remote add origin https://github.com/你的使用者名稱/iphone-notes-pwa.git

# 推送到 GitHub
git push -u origin main
```

## 步驟 4：設定 GitHub Pages

### 4.1 使用 GitHub Actions 自動部署（推薦）

1. 在專案根目錄建立 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build
        run: pnpm build
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. 提交並推送這個檔案：

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deploy workflow"
git push
```

3. 在 GitHub repository 頁面：
   - 點擊「Settings」
   - 左側選單點擊「Pages」
   - Source 選擇「GitHub Actions」
   - 儲存

### 4.2 手動部署（簡單但需要每次手動執行）

1. 安裝 `gh-pages` 套件：

```bash
pnpm add -D gh-pages
```

2. 在 `package.json` 加入部署腳本：

```json
{
  "scripts": {
    "deploy": "pnpm build && gh-pages -d dist"
  }
}
```

3. 執行部署：

```bash
pnpm deploy
```

4. 在 GitHub repository 設定：
   - Settings → Pages
   - Source 選擇「Deploy from a branch」
   - Branch 選擇「gh-pages」
   - 資料夾選擇「/ (root)」
   - 儲存

## 步驟 5：存取你的 PWA

部署完成後，你的 PWA 會在以下網址：

```
https://你的使用者名稱.github.io/iphone-notes-pwa/
```

例如：`https://john.github.io/iphone-notes-pwa/`

## 步驟 6：安裝到手機

### iOS (iPhone/iPad)

1. 用 Safari 開啟你的 PWA 網址
2. 點擊底部的「分享」按鈕
3. 向下滾動，點擊「加入主畫面」
4. 輸入名稱（例如：備忘錄）
5. 點擊「新增」

### Android

1. 用 Chrome 開啟你的 PWA 網址
2. 點擊右上角的「⋮」選單
3. 點擊「安裝應用程式」或「加到主畫面」
4. 確認安裝

## 更新部署

### 如果使用 GitHub Actions

每次推送到 main 分支都會自動部署：

```bash
git add .
git commit -m "Update notes"
git push
```

### 如果使用手動部署

每次更新後執行：

```bash
pnpm deploy
```

## 疑難排解

### 問題：頁面顯示 404

**解決方法**：
- 確認 `vite.config.ts` 的 `base` 設定正確
- 確認 GitHub Pages 的 Source 設定正確
- 等待 5-10 分鐘讓 GitHub Pages 完成部署

### 問題：CSS 或 JS 檔案載入失敗

**解決方法**：
- 檢查 `vite.config.ts` 的 `base` 路徑
- 重新建置並部署

### 問題：PWA 無法安裝

**解決方法**：
- 確認 `manifest.json` 存在且正確
- 確認使用 HTTPS（GitHub Pages 預設就是）
- 確認 Service Worker 正常運作

## 自訂網域（選用）

如果你有自己的網域，可以：

1. 在 repository 根目錄建立 `CNAME` 檔案
2. 內容填入你的網域，例如：`notes.yourdomain.com`
3. 在你的網域 DNS 設定中加入 CNAME 記錄指向 `你的使用者名稱.github.io`

## 注意事項

- GitHub Pages 是靜態託管，所以這個專案只能使用前端功能（IndexedDB 本地儲存）
- 所有資料都儲存在瀏覽器本地，不會上傳到 GitHub
- 定期使用「匯出到 Google Sheets」功能備份你的筆記
- 免費版 GitHub Pages 有流量限制（每月 100GB），一般個人使用綽綽有餘

## 進階：使用 Cloudflare Pages（更快的替代方案）

Cloudflare Pages 提供更快的全球 CDN，而且同樣免費：

1. 前往 [Cloudflare Pages](https://pages.cloudflare.com/)
2. 連結你的 GitHub 帳號
3. 選擇 repository
4. 建置設定：
   - Build command: `pnpm build`
   - Build output directory: `dist`
5. 部署

優點：
- 更快的全球 CDN
- 自動 HTTPS
- 無限流量
- 更快的建置速度
