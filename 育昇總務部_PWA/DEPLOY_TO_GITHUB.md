# 用 PR 方式部署到 GitHub Pages（白話版）

這份文件的目標很單純：
- 你把程式放到 GitHub
- 之後你只要「開 PR → 合併到 main」
- GitHub 就會自動幫你更新網站（免費）

---

## 0) 這個專案會部署什麼？

- 部署的是 **純前端 PWA**（不需要伺服器）
- GitHub Actions 會自動執行：
  1) 安裝依賴（npm）
  2) 建置（Vite，並自動套用 GitHub Pages 的子路徑）
  3) 上傳到 GitHub Pages

---

## 1) 第一次上架（只做一次）

1. 在 GitHub 建一個新的 Repository（repo 名稱隨你）
2. 把這個專案推上去（main 分支）
3. 進入 Repo → Settings → Pages
4. Source 選 **GitHub Actions**

第一次跑完之後，你會拿到一個 Pages 網址。

---

## 2) 以後更新：用 PR 流程（推薦）

### 2.1 建一個分支
- 例如：`功能/新增AI摘要` 或 `修正/理財輸入`（隨你）

### 2.2 改程式、提交、推上去
- 改完後 commit
- push 到你的分支

### 2.3 開 PR 並合併
- 在 GitHub 介面開 Pull Request
- 檢查內容 OK 後合併進 main

✅ 合併後，GitHub Actions 會自動重新部署（不用你手動上傳檔案）。

---

## 3) iPhone 安裝（像 App 一樣）

1. iPhone 用 Safari 打開你的 Pages 網址
2. 點分享按鈕
3. 點「加入主畫面」

---

## 4) 小提醒

- **同步版**：路徑在 `/sync`（需要你在「同步版設定」填 Google Script URL）
- **AI 摘要／潤飾**：在「設定 → OpenAI 設定」填你的 API Key 即可
- **成本低**：預設模型是 `gpt-4o-mini`（你也可以在設定改）
