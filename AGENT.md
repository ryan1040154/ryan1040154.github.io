# AGENT.md

本文件提供在此儲存庫工作的 AI Agent 與協作者使用。除非更深層目錄另有指引，本文件適用於整個儲存庫。

## 專案概覽

- 這是部署於 GitHub Pages 的 Ryan Chuang 個人作品集網站。
- 網站是純靜態 HTML、CSS 與原生 JavaScript，沒有套件管理器、框架、編譯步驟或後端服務。
- 根目錄的 `index.html` 是英文版主頁。
- `aboutme/index.html` 是舊網址的相容轉址頁；`aboutme/zh/index.html` 是繁體中文版。
- 兩個語言版本共用 `aboutme/css/style.css`、`aboutme/js/script.js` 與 `aboutme/images/`。
- Font Awesome 6.4.0 由 cdnjs 載入；不要假設本機已有該套件。

## 重要檔案

```text
index.html                  # GitHub Pages 入口與英文版主頁
aboutme/index.html          # 舊英文網址的相容轉址頁
aboutme/zh/index.html       # 繁體中文版主頁
aboutme/css/style.css       # 兩個語言版本共用的樣式與響應式規則
aboutme/js/script.js        # 打字動畫、行動選單、回頂端與背景動畫
aboutme/images/             # 個人照、favicon、學校與經歷單位標誌
```

## 修改原則

- 保持網站可直接由靜態檔案伺服器提供，不要在沒有明確需求時引入框架、建置工具或依賴。
- 修改履歷內容、章節、導覽或連結時，同步檢查英文與繁體中文頁面；若內容刻意只屬於單一語言，需在交付說明中指出。
- 保留目前的語意化 HTML、標題層級及 section `id`。調整 `id` 時必須同步修改導覽錨點。
- 英文頁從儲存庫根目錄載入 `aboutme/` 下的共用資源，中文版則位於 `aboutme/zh/`；新增或修改連結時留意兩者相對路徑層級不同。
- 共用的視覺與互動修改應優先放在現有 CSS 或 JavaScript 檔案，避免在兩份 HTML 中複製 inline style 或 script。
- 若 CSS 或 JavaScript 的變更需要讓 GitHub Pages 使用者立即取得新版，請同步更新兩份 HTML 中相對應的 `?v=` 快取版本字串，且兩頁保持一致。
- 新增圖片時使用適合網頁的尺寸與格式、具描述性的檔名及正確 `alt`；避免提交不必要的大型原始素材。
- 外部連結若使用 `target="_blank"`，同時保留 `rel="noopener"`。
- 互動元件須可由鍵盤操作，並維護 `aria-label`、`aria-expanded`、`aria-controls` 等狀態。裝飾性 canvas 或圖示應維持對輔助科技隱藏。
- JavaScript 應在元素不存在時安全退出，避免讓共用腳本因單一缺少的 DOM 節點而中斷。
- 延續現有風格：HTML/CSS/JavaScript 使用 2 個空格縮排；JavaScript 使用雙引號與分號；避免只為格式化而重寫整個檔案。

## 本機預覽

請從儲存庫根目錄啟動靜態伺服器，不要只用 `file://` 開啟頁面：

```powershell
python -m http.server 8000
```

然後檢查：

- `http://localhost:8000/` 直接顯示英文版。
- `http://localhost:8000/aboutme/` 會導向根目錄，以相容既有網址。
- `http://localhost:8000/aboutme/zh/` 顯示繁體中文版。

## 驗證清單

本專案目前沒有自動化測試。每次修改至少進行與變更範圍相符的手動驗證：

- 確認瀏覽器主控台沒有 JavaScript 錯誤或遺失資源（404）。
- 測試英文／中文切換、頁內導覽、外部連結與電子郵件連結。
- 在桌面寬度與 760px 以下視窗檢查版面；行動版需測試選單開關、選單連結關閉行為及 body 捲動鎖定。
- 確認回頂端按鈕、姓名打字效果、地點淡入與三角形 canvas 動畫仍正常。
- 若修改圖片，檢查裁切、比例、清晰度、替代文字與載入時間。
- 若修改文字或結構，檢查兩種語言的對應內容、標題層級與導覽錨點。
- 若修改 SEO 或入口行為，檢查 `<title>`、description、favicon、canonical 與根頁重新導向。

## 版本控制注意事項

- 修改範圍保持聚焦，不要提交作業系統產生的檔案、編輯器設定、暫存檔或本機伺服器輸出。
- 不要覆蓋與目前任務無關的既有變更。
- 提交前檢視 diff，特別留意中英文頁是否同步，以及是否誤改個人資料、聯絡資訊或外部網址。
