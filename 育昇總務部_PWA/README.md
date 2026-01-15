# 育昇總務部｜iPhone 備忘錄風格 PWA（本機／同步）

這是一個「像 iPhone 備忘錄一樣」的筆記工具，主打 **快、乾淨、離線可用**。  
你可以把它部署到 **GitHub Pages**，然後在 iPhone Safari 打開 →「分享」→「加入主畫面」，就會像 App 一樣使用。

---

## 你可以做什麼（白話版）
- ✅ 新增／修改／刪除筆記
- ✅ 以「第一行自動當標題」的方式記錄（很像備忘錄）
- ✅ 垃圾桶（避免誤刪）
- ✅（同步版）可選：用 Google Apps Script 把資料備份到 Google 試算表
- ✅（AI 功能）可選：用你自己的 OpenAI API Key 做「摘要／潤飾」（完全用你自己的 Key）

---

## 用 PR 部署到 GitHub Pages（最省錢）
1. 把專案 push 到 GitHub（main 分支）
2. 到 GitHub Repo → Settings → Pages → Source 選「GitHub Actions」
3. 後續你只要 **開 PR → merge 進 main**，就會自動部署

> 這個 repo 已包含 `.github/workflows/.github/workflows/部署到GitHubPages.yml`。  
> 會自動把 `vite build` 的 base 設成 `/<repo>/`，避免 GitHub Pages 子路徑爆炸。

---

## iPhone 安裝方式（超短）
1. iPhone 用 Safari 打開你的 Pages 網址
2. 點「分享」
3. 點「加入主畫面」

---

## 同步（Google 試算表）怎麼開
如果你要「兩個人共用／備份」：  
請看 `GOOGLE_SCRIPT_SETUP.md`，照步驟部署 Apps Script，然後在設定頁貼上 Script URL。

---

## 安全提醒（很重要但不恐嚇）
- 你如果把 OpenAI API Key 存在 iPhone 裡，理論上就是「存在裝置本機」。  
- 只有你們兩個用、手機不越獄、不要亂裝可疑 App：風險通常可控。  
- 若未來要給多人用，建議改成「自己架一個後端 proxy」，把 Key 放後端。

