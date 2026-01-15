育升總務部｜iPhone 風格 PWA（本機／同步）
這是一個「像 iPhone 一樣」的筆記工具，主打快、乾淨、離線可用。
你可以把它部署到GitHub Pages，然後在 iPhone Safari 開啟→「分享」→「加入主畫面」，就能像 App 一樣使用。

你可以做什麼（白話版）
✅新增／修改／刪除筆記
✅ 以「第一行自動當標題」的方式記錄（很像）
✅ 罰單（避免誤刪）
✅（同步版）可選：使用 Google Apps 腳本將資料備份到 Google 試算表
✅（AI功能）選擇性：用你自己的OpenAI API Key做「抽象/潤飾」（完全用你自己的Key）
使用PR部署到GitHub Pages（最省錢）
把專案push到GitHub（main分支）
到 GitHub Repo → 設定 → 頁面 → 來源選“GitHub Actions”
後續你只要開 PR → 合併進 main，就會自動設定
這個 repo 已包含.github/workflows/.github/workflows/部署到GitHubPages.yml。
會自動把vite build基礎設定成/<repo>/，避免 GitHub Pages 子路徑爆炸。

iPhone安裝方式（超短）
iPhone 使用 Safari 開啟您的頁面 網址
點「分享」
點「加入主畫面」
同步（Google 試算表）怎麼開
如果你要「多人分享／備份」：
請看GOOGLE_SCRIPT_SETUP.md，請依照步驟設定Apps Script，然後在設定頁貼上Script URL。

