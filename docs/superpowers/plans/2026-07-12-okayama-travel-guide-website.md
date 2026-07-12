# 岡山親子行旅遊指南網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `岡山行程.md` 轉換成一個可離線使用、手機優先的旅遊指南靜態網站（PWA），部署到 GitHub Pages。

**Architecture:** 純前端 SPA（vanilla HTML/CSS/JS，無框架、無 build 工具）。單一資料檔 `js/data.js` 存放結構化行程內容，`js/app.js` 依 URL hash 做路由與畫面渲染（首頁選單 vs 單日視圖，單日視圖內有今日／交通／餐廳／總覽四個分頁）。畫面渲染一律使用安全的 DOM API（`createElement`／`textContent`／`replaceChildren`），不使用 `innerHTML`，避免字串拼接 HTML 帶來的風險。透過 `sw.js` + `manifest.json` 提供離線快取與加入主畫面能力。

**Tech Stack:** HTML5、CSS3、原生 JavaScript（ES2017+）、Service Worker API、Web App Manifest、GitHub Pages。

---

## 依據設計文件

`docs/superpowers/specs/2026-07-12-okayama-travel-guide-website-design.md`（已核准）

## 測試策略說明（偏離預設 TDD 樣板的原因）

設計文件的「測試／驗證方式」章節已明確決定：**此網站是純展示型網站，不建立自動化測試框架，改用手動核對清單驗證**（逐天比對資料、切換畫面、離線模式、PWA 安裝）。因此以下每個任務的「驗證」步驟是**手動操作 + 預期結果**，而非自動化測試指令。這是依照已核准設計文件的明確決定，非遺漏。

## 檔案結構

```
japan_travel/
├── index.html              # App shell：header（選單鈕＋日期切換器）、main、底部分頁列、選單面板
├── css/
│   └── style.css           # 溫馨手帳／桃太郎風視覺樣式
├── js/
│   ├── data.js              # window.TRIP：8 天行程 + overview + todo + souvenirs
│   └── app.js                # 路由（hash-based）、DOM 渲染、事件綁定、Service Worker 註冊
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker：cache-first 離線快取
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── scripts/
    └── generate_icons.py     # 產生上述兩張 PWA 圖示（純 stdlib，無外部依賴）
```

---

## Task 1: 專案骨架（index.html + css/style.css）

**Files:**
- Create: `index.html`
- Create: `css/style.css`

- [ ] **Step 1: 建立資料夾**

```bash
mkdir -p css js icons scripts
```

- [ ] **Step 2: 建立 `index.html`**

```html
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>岡山親子行</title>
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<meta name="theme-color" content="#c9915d">
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<header id="app-header">
  <button id="menu-btn" aria-label="選單">☰</button>
  <div id="day-switcher">
    <button id="prev-day" aria-label="前一天">‹</button>
    <span id="day-title"></span>
    <button id="next-day" aria-label="後一天">›</button>
  </div>
</header>

<main id="app-main"></main>

<nav id="tab-bar">
  <button class="tab-btn" data-tab="today">今日</button>
  <button class="tab-btn" data-tab="transport">交通</button>
  <button class="tab-btn" data-tab="restaurants">餐廳</button>
  <button class="tab-btn" data-tab="summary">總覽</button>
</nav>

<div id="menu-panel" class="hidden"></div>

<script src="js/data.js"></script>
<script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 3: 建立 `css/style.css`**

```css
:root {
  --bg: #fdf6ec;
  --accent: #c9915d;
  --accent-light: #e8c4a2;
  --accent-dark: #5c3a21;
  --text: #4a3323;
  --tab-active-bg: #f3d9bd;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: "Noto Serif TC", Georgia, serif;
  background: var(--bg);
  color: var(--text);
  padding-bottom: 56px;
}

#app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--accent-light);
  color: var(--accent-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
}

#menu-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--accent-dark);
}

#day-switcher {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
}

#day-switcher button {
  background: none;
  border: none;
  font-size: 20px;
  color: var(--accent-dark);
  padding: 0 6px;
}

#day-switcher button:disabled {
  opacity: 0.3;
}

#app-main {
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

.day-title-main {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 12px;
}

.timeline-item {
  border-left: 3px dashed var(--accent);
  padding-left: 10px;
  margin-bottom: 12px;
}

.timeline-item .time {
  font-weight: 700;
  color: var(--accent-dark);
  display: block;
}

.timeline-item .note {
  color: #7a6249;
  font-size: 14px;
  white-space: pre-line;
}

.info-block {
  margin-bottom: 14px;
}

.info-block h3 {
  margin: 0 0 4px;
  font-size: 15px;
  color: var(--accent-dark);
}

.info-block .note {
  font-size: 14px;
  color: #7a6249;
  white-space: pre-line;
}

.tip-list {
  background: var(--tab-active-bg);
  border-radius: 8px;
  padding: 10px 14px;
  margin-top: 16px;
}

.tip-list li { margin-bottom: 6px; }

.alt-plan {
  border: 1px solid var(--accent-light);
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 14px;
}

.alt-plan.recommended {
  border-color: var(--accent);
  background: #fffaf3;
}

.alt-plan h4 {
  margin: 0 0 8px;
  color: var(--accent-dark);
}

.alt-plan .note {
  white-space: pre-line;
}

#tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fffaf3;
  border-top: 1px solid var(--accent-light);
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  background: none;
  border: none;
  color: #9c7355;
  font-family: inherit;
  font-size: 14px;
}

.tab-btn.active {
  background: var(--tab-active-bg);
  color: var(--accent-dark);
  font-weight: 700;
}

#menu-panel {
  position: fixed;
  inset: 0;
  background: var(--bg);
  z-index: 20;
  padding: 16px;
  overflow-y: auto;
}

#menu-panel.hidden { display: none; }

#menu-close {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--accent-dark);
  float: right;
}

.menu-link {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  border-bottom: 1px solid var(--accent-light);
  padding: 14px 4px;
  font-size: 16px;
  color: var(--text);
  font-family: inherit;
}

table.overview-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  clear: both;
}

table.overview-table th, table.overview-table td {
  border: 1px solid var(--accent-light);
  padding: 6px 8px;
  font-size: 13px;
  text-align: left;
}

ul.todo-list, ul.souvenir-list {
  padding-left: 20px;
}

ul.todo-list li, ul.souvenir-list li {
  margin-bottom: 8px;
}
```

- [ ] **Step 4: 手動驗證**

啟動本地伺服器：

```bash
python3 -m http.server 8000
```

用瀏覽器開啟 `http://localhost:8000/index.html`。

預期結果：看到米杏底色的頁面，頂部有 ☰ 選單鈕與「‹ ›」日期切換器（目前文字為空，因為 `js/app.js` 還沒建立），底部有四個分頁按鈕（今日／交通／餐廳／總覽），畫面主體是空白（尚無資料渲染）。Console 會出現 404（`js/data.js`、`js/app.js` 尚未建立），這是預期的，下一個任務會補上。

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css
git commit -m "feat: add app shell and warm journal visual style"
```

---

## Task 2: 行程資料 `js/data.js`

**Files:**
- Create: `js/data.js`

- [ ] **Step 1: 建立 `js/data.js`**

```js
window.TRIP = {
  days: [
    {
      id: "day0",
      date: "2026-07-19",
      weekday: "日",
      title: "抵達岡山",
      timeline: [
        { time: "08:30", activity: "機場接送", note: "" },
        { time: "11:30", activity: "台北桃園出發", note: "每日航班" },
        { time: "15:05", activity: "抵達岡山機場", note: "" },
        { time: "16:55", activity: "岡山站方向巴士（官方列班次）", note: "" },
        { time: "約 17:25", activity: "抵達岡山站", note: "" },
        { time: "18:45", activity: "晚餐：町屋やきにく密陽家", note: "食べログ百名店" }
      ],
      transport: [
        { label: "台北桃園 → 岡山機場", detail: "11:30 起飛，15:05 抵達，每日航班" },
        { label: "岡山機場 → 岡山站", detail: "官方列的岡山站方向巴士 16:55 發車，約 17:25 抵達岡山站" }
      ],
      restaurants: [
        { name: "町屋やきにく密陽家", time: "18:45", note: "食べログ百名店" }
      ],
      tips: ["貴賓室可換餐點：homee KITCHEN"],
      alternatives: []
    },
    {
      id: "day1",
      date: "2026-07-20",
      weekday: "一",
      title: "岡山自由行",
      timeline: [
        { time: "09:30", activity: "岡山後樂飯店出門", note: "步行到岡山站，飯店官方寫到岡山站東口約 5 分鐘" },
        { time: "09:45–10:15", activity: "JR 岡山站 → 備前一宮站", note: "搭 JR 桃太郎線／吉備線" },
        { time: "10:15–11:00", activity: "吉備津彥神社", note: "備前一宮站下車後步行約 3 分鐘" },
        { time: "11:00–11:30", activity: "備前一宮站 → 吉備津站", note: "搭 JR 桃太郎線往總社方向，一站到吉備津站" },
        { time: "11:30–12:30", activity: "吉備津神社", note: "吉備津站下車後步行約 10 分鐘；岡山站到吉備津站約 30 分鐘" },
        { time: "12:30–13:30", activity: "回岡山站", note: "JR 吉備津站 → 岡山站" },
        { time: "13:30–15:30", activity: "飯店／岡山站午餐、嬰兒休息", note: "400℃ mori no machi（需現場排隊）" },
        { time: "15:30–18:30", activity: "AEON Mall 岡山", note: "從岡山站步行約 5 分鐘" },
        { time: "晚上", activity: "AEON Mall 晚餐／採買", note: "19:00 Shabu-shabu Sukiyaki Hitorinabe Megu；專門店多為 10:00–21:00，餐廳多為 11:00–22:00" }
      ],
      transport: [
        { label: "岡山後樂飯店 → 岡山站", detail: "直接走路約 5 分鐘，不用搭車" },
        { label: "岡山站 → 吉備津彥神社", detail: "搭 JR 桃太郎線／吉備線到備前一宮站，下車後走約 3 分鐘。這間比較靠近車站，適合先去" },
        { label: "吉備津彥神社 → 吉備津神社", detail: "建議搭 JR 一站到吉備津站，再走約 10 分鐘。吉備津神社的長廊從本殿延伸約 360 公尺，很值得看。\n帶嬰兒不建議用走的：夏天太熱，且路上不是每段都適合推嬰兒車，建議搭 JR 或叫計程車。" },
        { label: "吉備津神社 → AEON Mall 岡山", detail: "從吉備津站搭 JR 回岡山站，再走到 AEON Mall，官方寫步行約 5 分鐘" }
      ],
      restaurants: [
        { name: "400℃ mori no machi", time: "13:30–15:30", note: "需現場排隊，岡山站／飯店周邊午餐" },
        { name: "Shabu-shabu Sukiyaki Hitorinabe Megu", time: "19:00", note: "AEON Mall 內晚餐" }
      ],
      tips: [
        "取捨建議：如果 7/20 天氣很熱或嬰兒狀況普通，只保留「吉備津神社 → AEON Mall」，因為吉備津神社比吉備津彥神社更值得停留（長廊、桃太郎傳說、國寶建築），吉備津彥神社是順路加分點。",
        "最舒服版本：09:30 出門 → 吉備津彥神社 → 吉備津神社 → 回飯店休息 → 傍晚 AEON Mall 岡山"
      ],
      alternatives: []
    },
    {
      id: "day2",
      date: "2026-07-21",
      weekday: "二",
      title: "倉敷美觀地區",
      timeline: [
        { time: "09:30", activity: "岡山站出發", note: "" },
        { time: "10:00 左右", activity: "抵達倉敷站，步行前往美觀地區", note: "" },
        { time: "10:15–12:00", activity: "倉敷美觀地區", note: "運河、白壁街景、老街散步" },
        { time: "12:00–13:00", activity: "午餐／咖啡／甜點", note: "" },
        { time: "13:00–17:00", activity: "Ivy Square、倉敷帆布、倉敷丹寧小店、博物館", note: "" },
        { time: "17:00–17:30", activity: "回岡山", note: "" },
        { time: "18:00 後", activity: "飯店休息，晚上岡山站附近吃飯", note: "" }
      ],
      transport: [
        { label: "岡山站 → 倉敷站", detail: "JR 常見車程約 16–17 分鐘，適合當天來回" },
        { label: "倉敷站 → 美觀地區", detail: "步行約 13 分鐘" }
      ],
      restaurants: [],
      tips: [
        "這天很適合帶嬰兒，因為移動短、節奏慢",
        "如果天氣太熱，這天可以改成倉敷半日就好；帶嬰兒不需要硬待到下午很晚"
      ],
      alternatives: []
    },
    {
      id: "day3",
      date: "2026-07-22",
      weekday: "三",
      title: "岡山 → 小豆島，租車跑遠一點：寒霞溪＋橄欖公園",
      timeline: [
        { time: "09:10", activity: "請岡山後樂飯店櫃檯協助叫計程車", note: "" },
        { time: "09:15–09:20", activity: "從岡山後樂飯店搭計程車出發", note: "" },
        { time: "09:45–09:55", activity: "抵達新岡山港，買票、上廁所、換尿布", note: "" },
        { time: "10:10–11:20", activity: "新岡山港 → 小豆島土庄港", note: "船程約 70 分鐘" },
        { time: "11:20–12:00", activity: "抵達土庄港、取租車", note: "" },
        { time: "12:00–13:00", activity: "土庄港附近午餐，或先買簡單餐點", note: "" },
        { time: "13:00–14:00", activity: "開車前往寒霞溪", note: "" },
        { time: "14:00–15:30", activity: "寒霞溪山頂展望／視狀況搭纜車", note: "" },
        { time: "15:30–16:10", activity: "開車前往小豆島橄欖公園", note: "" },
        { time: "16:10–17:00", activity: "小豆島橄欖公園（Optional：丸金醬油紀念館／二十四の瞳）", note: "" },
        { time: "17:00–17:30", activity: "開車前往小豆島 夕陽ヶ丘ホテル", note: "" },
        { time: "17:30 後", activity: "Check-in、晚餐、休息", note: "" }
      ],
      transport: [
        { label: "岡山後樂飯店 → 新岡山港", detail: "計程車估約 22 分鐘、4,000 日圓；飯店直接叫車保守抓 4,000～4,500 日圓" },
        { label: "新岡山港 → 小豆島土庄港", detail: "10:10 船班，11:20 抵達，船程約 70 分鐘" },
        { label: "備案：岡電巴士", detail: "8:54 柳川西站牌（飯店對面）→ 9:33 新岡山港；海鷗套票 1,500 日圓（https://ticket.jorudan.co.jp/okaden/kamome/zh-tw/）" }
      ],
      restaurants: [
        { name: "土庄港附近午餐", time: "12:00–13:00", note: "或先買簡單餐點" }
      ],
      tips: [
        "原本考慮搭 11:40 新岡山港 → 12:50 土庄港的較穩班次（成人單程 1,200 日圓，小學生以下 1 名陪同免費，船上有無障礙廁所與尿布更換設備），後來改為提早搭計程車趕 10:10 船班，讓小豆島第一天可以更完整玩到寒霞溪＋橄欖公園。",
        "寒霞溪如果要搭纜車，建議開車到山頂站，再從山頂站搭往返纜車，不要從山麓站進出：山麓紅雲亭站從停車場到乘車處有階梯，對輪椅較困難。",
        "寒霞溪沒有哺乳室，但山頂多功能廁所有尿布台。",
        "寒霞溪纜車 3/21–10/20 營業時間 8:30–17:00，約每 12 分鐘一班，單程約 5 分鐘。",
        "小豆島橄欖公園營業時間 8:30–17:00，全年無休，有希臘風車、橄欖園與《魔女宅急便》相關場景。",
        "這天不排天使之路，因為 7/24 的潮汐時間更適合。"
      ],
      alternatives: []
    },
    {
      id: "day4",
      date: "2026-07-23",
      weekday: "四",
      title: "豐島一日遊",
      timeline: [],
      transport: [
        { label: "租車安排", detail: "住小豆島兩晚，不用拖行李。建議租車停在土庄港，不要把車開去豐島；豐島當天用島內巴士、計程車或步行＋短程移動即可。" },
        {
          label: "去程船班：小豆島土庄港 → 豐島家浦港",
          detail: "目的地選家浦港（要到豊島PP租車）\n07:35 土庄港發 → 07:55 唐櫃港 → 08:10 家浦港（旅客船，到太早，要等豊島PP 08:30 開）\n08:40 土庄港發 → 09:10 唐櫃港 → 09:30 家浦港（渡輪，最推薦）\n10:30 土庄港發 → 10:50 唐櫃港 → 11:05 家浦港（旅客船，晚出發備案）\n13:10 土庄港發 → 13:40 唐櫃港 → 14:00 家浦港（渡輪，太晚，不適合租腳踏車）\n15:50 土庄港發 → 16:10 唐櫃港 → 16:25 家浦港（旅客船，不適合，快到還車時間）\n17:50 土庄港發 → 18:20 唐櫃港 → 18:40 家浦港（渡輪，不適合）\n現行表為令和 7 年 12 月 1 日改訂版"
        },
        {
          label: "回程船班：豐島家浦港 → 小豆島土庄港",
          detail: "要在家浦港還豊島PP腳踏車，回程建議從家浦港搭\n06:55 家浦港發 → 07:10 唐櫃港 → 07:30 土庄港（旅客船，太早不適用）\n07:25 家浦港發 → 07:45 唐櫃港 → 08:14 土庄港（渡輪，太早不適用）\n09:05 家浦港發 → 09:20 唐櫃港 → 09:40 土庄港（旅客船，太早不適用）\n11:50 家浦港發 → 12:10 唐櫃港 → 12:39 土庄港（渡輪，只適合超短行程）\n13:50 家浦港發 → 14:05 唐櫃港 → 14:25 土庄港（旅客船，如果寶寶累、只看美術館可提早走）\n16:05 家浦港發 → 16:25 唐櫃港 → 16:54 土庄港（渡輪，穩妥早回，但要 15:40 前還車）\n17:55 家浦港發 → 18:10 唐櫃港 → 18:30 土庄港（旅客船，最推薦，剛好接還車與甜點）\n19:40 家浦港發 → 不停唐櫃 → 20:05 土庄港（旅客船，最後備案，帶寶寶不建議當主計畫）"
        },
        {
          label: "已預約：豊島PP 電動腳踏車",
          detail: "店家：電動レンタサイクル「豊島PP合同会社」（家浦港步行約 3 分鐘）\n預約日：2026/07/24（五）／預約時間：11:00\n車種：チャイルドシート付電動自転車（附兒童座椅）\n數量：6 台／使用方案：1 日方案，到 17:00／預計歸還：17:00\n店家電話：080-2943-7788\n※ 此預約日期為原始紀錄，出發前請再次核對是否為 7/23 當天"
        }
      ],
      restaurants: [
        { name: "豊島美術館カフェ", time: "美術館後", note: "優先順序 1：最順、最不繞，適合帶寶寶休息；3～9 月營業 10:00～17:00，L.O.16:30" },
        { name: "いちご家", time: "回家浦港還車前後", note: "優先順序 2：草莓甜點首選，平日 12:00～17:00，17:00 關門" },
        { name: "島キッチン", time: "美術館後、唐櫃岡周邊", note: "優先順序 3：有開且訂得到就排；食事 L.O.14:00、飲料 L.O.15:30，預約到前 2 天 17:30" },
        { name: "食堂101号室／Commune／とのわ", time: "唐櫃岡或唐櫃港周邊", note: "優先順序 4：當天營業與座位不穩，當備案" },
        { name: "Tea オリーブ", time: "家浦往唐櫃中間", note: "優先順序 5：騎車途中休息備案" },
        { name: "海のレストラン", time: "家浦港附近", note: "優先順序 6：這天不主排，官方頁面顯示週四午餐不營業" }
      ],
      tips: [
        "豐島美術館 3/1–9/30 開館時間 10:00–17:00，最後入館 16:30；3/1–11/30 通常週二休館。星期四時間上可行，仍建議出發前確認開館日並先預約。",
        "飯店餐期：早餐自助餐 07:00–09:30；晚餐自助餐 17:30–21:00，最後取餐 20:30。",
        "帶嬰兒提醒：豐島美術館敷地內可使用自己的嬰兒車，館內沒有哺乳室，但有一間附尿布台的廁所；館內部分空間需脫鞋，也不能帶大型行李進入。",
        "最終定案（首選 Plan A）：08:40 土庄港 → 09:30 家浦港 → 豊島PP取車 → 家浦周邊 → 12:00/12:30 豊島美術館 → 豊島美術館カフェ → 島キッチン／唐櫃岡周邊備案 → 唐櫃港短停 → 回家浦 → いちご家 → 還車 → 17:55 家浦港回土庄港。"
      ],
      alternatives: [
        {
          label: "Plan A：08:40 去、17:55 回，餐廳完整版本",
          recommended: true,
          timeline: [
            { time: "07:00～07:40", activity: "夕陽ヶ丘ホテル早餐", note: "飯店先吃一點，避免上島後餐廳不穩" },
            { time: "08:10", activity: "抵達土庄港買票", note: "準備現金" },
            { time: "08:40", activity: "土庄港 → 家浦港", note: "09:30 到家浦港；這班會先停唐櫃，坐到家浦" },
            { time: "09:30", activity: "抵達家浦港", note: "" },
            { time: "09:35～09:55", activity: "豊島PP 取附兒童座椅電動腳踏車", note: "" },
            { time: "10:00～10:30", activity: "豊島橫尾館", note: "家浦港附近" },
            { time: "10:30～10:55", activity: "針工場", note: "家浦港附近" },
            { time: "10:55～11:40", activity: "騎往唐櫃岡／豊島美術館方向", note: "主要爬坡段，帶寶寶抓寬一點" },
            { time: "12:00 或 12:30", activity: "豊島美術館", note: "建議預約 12:00 或 12:30" },
            { time: "13:00～13:40", activity: "豊島美術館カフェ", note: "最穩午餐點心；有米粉貝果、棚田 gelato" },
            { time: "13:40～14:20", activity: "唐櫃岡周邊", note: "棚田、青木野枝「空の粒子／唐櫃」、島キッチン外觀周邊" },
            { time: "14:20～15:00", activity: "餐廳備案：島キッチン／食堂101号室／Commune", note: "如果當天有開、還有座位可補正餐或咖啡" },
            { time: "15:00～15:30", activity: "唐櫃港方向", note: "可去心臓音のアーカイブ或 No one wins - Multibasket" },
            { time: "15:30～16:05", activity: "慢慢騎回家浦港方向", note: "不要壓太緊" },
            { time: "16:05～16:30", activity: "いちご家", note: "家浦港步行約 5 分鐘；草莓可麗餅、草莓聖代、草莓冰、霜淇淋" },
            { time: "16:30～16:45", activity: "豊島PP 還車", note: "17:00 前還車" },
            { time: "17:00～17:40", activity: "家浦港休息、買票、整理寶寶", note: "" },
            { time: "17:55", activity: "家浦港 → 土庄港", note: "18:30 抵達土庄" },
            { time: "18:30～19:00", activity: "回飯店", note: "接飯店晚餐" }
          ],
          note: "甲生（Optional）判斷：15:50～16:00 已回到家浦港附近可考慮短騎去甲生；16:15 之後才回到不建議去，直接還車；天氣熱、寶寶累、大人覺得下坡累就不去甲生；甲生和いちご家二選一，不要都硬排。若要去甲生：15:45 回家浦附近 → 16:00～16:25 甲生短停 → 16:40 前還車。いちご家甜點優先於甲生，帶寶寶回程前休息比多衝景點更實際。"
        },
        {
          label: "Plan B：10:30 去、17:55 回，晚出發精簡餐廳版",
          recommended: false,
          timeline: [
            { time: "07:30～08:30", activity: "飯店早餐", note: "建議早餐吃飽一點" },
            { time: "10:00", activity: "抵達土庄港買票", note: "" },
            { time: "10:30", activity: "土庄港 → 家浦港", note: "11:05 到家浦港" },
            { time: "11:05", activity: "抵達家浦港", note: "" },
            { time: "11:10～11:30", activity: "豊島PP 取車", note: "" },
            { time: "11:30～11:55", activity: "家浦港周邊二選一", note: "豊島橫尾館或針工場，不要兩個都硬排" },
            { time: "11:55～12:45", activity: "騎往豊島美術館", note: "帶寶寶抓 45～50 分鐘" },
            { time: "13:00 或 13:30", activity: "豊島美術館", note: "建議預約 13:00 或 13:30" },
            { time: "14:00～14:40", activity: "豊島美術館カフェ", note: "吃米粉貝果、gelato、喝飲料；這版是午餐主力" },
            { time: "14:40～15:20", activity: "唐櫃岡周邊短停", note: "島キッチン外觀、棚田、戶外作品" },
            { time: "15:20～16:00", activity: "騎回家浦港", note: "" },
            { time: "16:05～16:30", activity: "いちご家", note: "如果寶寶還有精神就吃草莓甜點，累了就略過" },
            { time: "16:30～16:45", activity: "豊島PP 還車", note: "" },
            { time: "17:55", activity: "家浦港 → 土庄港", note: "18:30 抵達土庄" }
          ],
          note: "不建議排甲生，也不建議特地繞去餐廳吃正式午餐，因為 11:05 才到島上，實際可騎車時間有限。"
        }
      ]
    },
    {
      id: "day5",
      date: "2026-07-24",
      weekday: "五",
      title: "小豆島近港行程，下午回岡山",
      timeline: [
        { time: "09:30", activity: "夕陽ヶ丘ホテル出門", note: "" },
        { time: "10:00–11:00", activity: "天使之路", note: "" },
        { time: "11:10–12:00", activity: "迷路之町、土渕海峽、妖怪美術館周邊", note: "" },
        { time: "12:00–13:00", activity: "土庄港附近午餐", note: "" },
        { time: "13:00–13:40", activity: "還車、買小豆島伴手禮、準備搭船", note: "" },
        { time: "14:00", activity: "土庄港搭船", note: "" },
        { time: "15:10", activity: "抵達新岡山港", note: "" },
        { time: "15:20", activity: "接巴士", note: "" },
        { time: "15:59", activity: "抵達岡山站", note: "" },
        { time: "18:00", activity: "晚餐：Yakinukuhidaya Honmachiten", note: "" }
      ],
      transport: [
        { label: "土庄港 → 岡山（平日）", detail: "14:00 土庄港搭船 → 15:10 新岡山港 → 15:20 接巴士 → 15:59 岡山站" }
      ],
      restaurants: [
        { name: "Yakinukuhidaya Honmachiten", time: "18:00", note: "晚餐" }
      ],
      tips: [
        "這天不要跑遠，因為要還車、拿行李、搭船回岡山。原則：離土庄港近、不要跑遠、方便還車和搭船。",
        "2026/7/24 天使之路可通行時間是 10:14–16:14，很適合 9:30 出門後去；官方提醒實際時間可能因天氣與潮位有誤差。",
        "妖怪美術館在土庄町，從土庄港步行約 15 分鐘、從天使之路步行約 7 分鐘，小學生以下免費；2026/7/24 是星期五，出發前建議再確認當週營業時間。"
      ],
      alternatives: []
    },
    {
      id: "day6",
      date: "2026-07-25",
      weekday: "六",
      title: "岡山市區：後樂園、岡山城、表町／AEON",
      timeline: [
        { time: "09:30", activity: "岡山後樂飯店出門", note: "" },
        { time: "10:00–11:30", activity: "岡山後樂園", note: "" },
        { time: "11:30–12:30", activity: "岡山城", note: "看體力決定是否進天守" },
        { time: "12:30–13:30", activity: "表町商店街午餐／逛街／999.9 selected by KAIROS", note: "" },
        { time: "13:30–15:30", activity: "回飯店休息／嬰兒午睡", note: "" },
        { time: "15:30–17:30", activity: "AEON Mall 岡山", note: "補買零食、藥妝、嬰兒用品／西川綠道公園短散步" },
        { time: "晚上", activity: "岡山站附近晚餐，整理行李", note: "" }
      ],
      transport: [],
      restaurants: [
        { name: "表町商店街", time: "12:30–13:30", note: "午餐／逛街，後樂園步行 15 分鐘" }
      ],
      tips: [
        "7 月岡山後樂園開園時間 7:30–18:00，最後入園 17:45；岡山城天守 9:00–17:30，最後入場 17:00，帶嬰兒建議早上去，不要下午最熱時段。",
        "這天是採買主日。建議把岡山伴手禮集中買：吉備糰子、白桃／麝香葡萄甜點、大手饅頭、岡山限定餅乾。生鮮水果和含肉製品不要帶回台灣。"
      ],
      alternatives: []
    },
    {
      id: "day7",
      date: "2026-07-26",
      weekday: "日",
      title: "17:55 岡山 → 台北",
      timeline: [
        { time: "09:30", activity: "起床後慢慢吃早餐、退房前整理行李", note: "" },
        { time: "10:30–12:00", activity: "岡山站さんすて／岡山一番街最後補買", note: "" },
        { time: "12:00–13:00", activity: "岡山站午餐", note: "" },
        { time: "13:00–14:20", activity: "回飯店拿行李、休息、上廁所、換尿布", note: "" },
        { time: "14:50", activity: "岡山站搭機場巴士", note: "" },
        { time: "15:20 左右", activity: "抵達岡山機場", note: "" },
        { time: "17:55", activity: "岡山 → 台北", note: "20:00 抵達台北桃園" }
      ],
      transport: [
        { label: "岡山站 → 岡山機場", detail: "官方推薦機場巴士 14:50 發車；17:55 岡山出發、20:00 抵達台北桃園航班為週四、週日班，7/26 日剛好符合" }
      ],
      restaurants: [],
      tips: [
        "帶回台灣的伴手禮建議避開新鮮水果、生鮮蔬果、含肉製品、半熟蛋類食品；不確定的商品，回台前用防檢署官方管道查詢或入境時主動詢問檢疫櫃檯。",
        "搭 17:55 岡山回台北時，官方推薦岡山站 14:50 機場巴士，比較能完成站內＋AEON 的採買。"
      ],
      alternatives: []
    }
  ],
  overview: [
    { date: "7/19 日", plan: "11:30 AM ~ 15:05 PM 台北 -> 岡山，晚上到岡山", hotel: "岡山後樂飯店" },
    { date: "7/20 一", plan: "自由行", hotel: "岡山後樂飯店" },
    { date: "7/21 二", plan: "倉敷美觀地區", hotel: "岡山後樂飯店" },
    { date: "7/22 三", plan: "岡山 → 小豆島，租車跑遠一點：寒霞溪＋橄欖公園", hotel: "小豆島 夕陽ヶ丘ホテル" },
    { date: "7/23 四", plan: "豐島", hotel: "小豆島 夕陽ヶ丘ホテル" },
    { date: "7/24 五", plan: "小豆島近港行程：天使之路、迷路之町、土庄港，下午分流", hotel: "岡山後樂飯店" },
    { date: "7/25 六", plan: "岡山市區：後樂園、岡山城、表町／AEON", hotel: "岡山後樂飯店" },
    { date: "7/26 日", plan: "17:55 PM 飛機回台北", hotel: "岡山後樂飯店" }
  ],
  todo: [
    { item: "機場接送", done: true },
    { item: "貴賓室", done: true },
    { item: "豐島美術館門票", done: false },
    { item: "購買 esim（https://povo.jp/japan-sim/online/）", done: false },
    { item: "保險", done: false },
    { item: "餐廳", done: false }
  ],
  souvenirs: [
    { category: "岡山代表伴手禮", items: "吉備糰子：原味、白桃、麝香葡萄" },
    { category: "水果甜點", items: "白桃果凍、白桃餅乾、麝香葡萄甜點" },
    { category: "長輩／正式送禮", items: "大手饅頭、調布、村雀" },
    { category: "同事分享", items: "桃太郎包裝零食、岡山限定餅乾" },
    { category: "自用", items: "蒜山 Jersey 牛乳甜點、咖啡、茶點" }
  ]
};
```

- [ ] **Step 2: 手動驗證**

重新整理 `http://localhost:8000/index.html`，打開瀏覽器 DevTools Console，輸入：

```js
TRIP.days.length
```

預期結果：回傳 `8`。再輸入 `TRIP.days[4].alternatives.length`，預期回傳 `2`（Day4 豐島有 Plan A / Plan B 兩個方案）。畫面本身還不會變化（`js/app.js` 尚未建立），這是預期的。

- [ ] **Step 3: Commit**

```bash
git add js/data.js
git commit -m "feat: add structured trip data for all 8 days"
```

---

## Task 3: 路由與畫面渲染邏輯 `js/app.js`

畫面渲染全程使用 `createElement`／`textContent`／`replaceChildren` 建構 DOM，不使用 `innerHTML`，避免任何字串拼接 HTML 的風險（即使目前所有資料都是我們自己寫死的靜態內容）。

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: 建立 `js/app.js`**

```js
(function () {
  const TABS = ["today", "transport", "restaurants", "summary"];

  const els = {
    main: document.getElementById("app-main"),
    dayTitle: document.getElementById("day-title"),
    prevBtn: document.getElementById("prev-day"),
    nextBtn: document.getElementById("next-day"),
    tabBar: document.getElementById("tab-bar"),
    menuBtn: document.getElementById("menu-btn"),
    menuPanel: document.getElementById("menu-panel"),
  };

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function todayDateString(now) {
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function getDayIndexForDate(days, dateStr) {
    return days.findIndex((d) => d.date === dateStr);
  }

  function resolveInitialDayIndex(days, now) {
    const idx = getDayIndexForDate(days, todayDateString(now));
    return idx === -1 ? 0 : idx;
  }

  function parseHash(hash) {
    const clean = hash.replace(/^#\/?/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts[0] === "day" && parts[1]) {
      return { view: "day", date: parts[1], tab: TABS.includes(parts[2]) ? parts[2] : "today" };
    }
    if (parts[0] === "menu" && parts[1]) {
      return { view: "menu", section: parts[1] };
    }
    return null;
  }

  function buildDayHash(date, tab) {
    return `#/day/${date}/${tab}`;
  }

  function buildMenuHash(section) {
    return `#/menu/${section}`;
  }

  function el(tag, options = {}, children = []) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.attrs) {
      Object.keys(options.attrs).forEach((key) => node.setAttribute(key, options.attrs[key]));
    }
    children.forEach((child) => {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function textEl(tag, text, className) {
    return el(tag, { text, className });
  }

  function renderTimelineNodes(items) {
    if (!items || items.length === 0) return [];
    return items.map((item) => {
      const children = [textEl("span", item.time, "time"), textEl("span", item.activity, "activity")];
      if (item.note) children.push(textEl("div", item.note, "note"));
      return el("div", { className: "timeline-item" }, children);
    });
  }

  function renderAlternativesNodes(alternatives) {
    return alternatives.map((alt) => {
      const className = "alt-plan" + (alt.recommended ? " recommended" : "");
      const heading = textEl("h4", alt.label + (alt.recommended ? "（推薦）" : ""));
      const children = [heading, ...renderTimelineNodes(alt.timeline)];
      if (alt.note) children.push(textEl("div", alt.note, "note"));
      return el("div", { className }, children);
    });
  }

  function renderInfoBlockNodes(items, primaryKey, secondaryKey, noteKey) {
    if (!items || items.length === 0) {
      return [textEl("p", "本日無特別資訊", "note")];
    }
    return items.map((item) => {
      const heading = el("h3");
      heading.appendChild(document.createTextNode(item[primaryKey]));
      if (secondaryKey && item[secondaryKey]) {
        heading.appendChild(document.createTextNode("　"));
        heading.appendChild(textEl("span", item[secondaryKey], "note"));
      }
      const blockChildren = [heading];
      if (item[noteKey]) blockChildren.push(textEl("div", item[noteKey], "note"));
      return el("div", { className: "info-block" }, blockChildren);
    });
  }

  function renderTransportNodes(items) {
    return renderInfoBlockNodes(items, "label", null, "detail");
  }

  function renderRestaurantNodes(items) {
    return renderInfoBlockNodes(items, "name", "time", "note");
  }

  function renderTipsNode(tips) {
    if (!tips || tips.length === 0) return null;
    return el("ul", { className: "tip-list" }, tips.map((t) => textEl("li", t)));
  }

  function renderSummaryNodes(day) {
    const nodes = [textEl("div", day.title, "day-title-main"), textEl("h3", "今日行程")];
    if (day.alternatives.length) {
      nodes.push(...renderAlternativesNodes(day.alternatives));
    } else {
      nodes.push(...renderTimelineNodes(day.timeline));
    }
    nodes.push(textEl("h3", "交通"), ...renderTransportNodes(day.transport));
    nodes.push(textEl("h3", "餐廳"), ...renderRestaurantNodes(day.restaurants));
    const tipsNode = renderTipsNode(day.tips);
    if (tipsNode) nodes.push(tipsNode);
    return nodes;
  }

  function renderDayView(dayIndex, tab) {
    const day = TRIP.days[dayIndex];
    els.dayTitle.textContent = `${day.date.slice(5).replace("-", "/")}（${day.weekday}）`;
    els.prevBtn.disabled = dayIndex === 0;
    els.nextBtn.disabled = dayIndex === TRIP.days.length - 1;

    let nodes = [];
    if (tab === "today") {
      nodes.push(textEl("div", day.title, "day-title-main"));
      if (day.alternatives.length) {
        nodes.push(...renderAlternativesNodes(day.alternatives));
      } else {
        nodes.push(...renderTimelineNodes(day.timeline));
      }
      const tipsNode = renderTipsNode(day.tips);
      if (tipsNode) nodes.push(tipsNode);
    } else if (tab === "transport") {
      nodes.push(textEl("div", `${day.title}｜交通`, "day-title-main"), ...renderTransportNodes(day.transport));
    } else if (tab === "restaurants") {
      nodes.push(textEl("div", `${day.title}｜餐廳`, "day-title-main"), ...renderRestaurantNodes(day.restaurants));
    } else if (tab === "summary") {
      nodes = renderSummaryNodes(day);
    }
    els.main.replaceChildren(...nodes);

    Array.from(els.tabBar.children).forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    els.menuPanel.classList.add("hidden");
  }

  function renderOverviewTableNode(rows) {
    const thead = el("thead", {}, [
      el("tr", {}, [textEl("th", "日期"), textEl("th", "行程主軸"), textEl("th", "住宿")]),
    ]);
    const tbody = el(
      "tbody",
      {},
      rows.map((r) => el("tr", {}, [textEl("td", r.date), textEl("td", r.plan), textEl("td", r.hotel)]))
    );
    return el("table", { className: "overview-table" }, [thead, tbody]);
  }

  function renderTodoListNode(items) {
    return el(
      "ul",
      { className: "todo-list" },
      items.map((t) => textEl("li", `${t.done ? "✅" : "⬜️"} ${t.item}`))
    );
  }

  function renderSouvenirListNode(items) {
    return el(
      "ul",
      { className: "souvenir-list" },
      items.map((s) => {
        const li = el("li");
        li.appendChild(textEl("strong", `${s.category}：`));
        li.appendChild(document.createTextNode(s.items));
        return li;
      })
    );
  }

  function renderMenuContentNodes(section) {
    if (section === "overview") return [textEl("h2", "行程總表"), renderOverviewTableNode(TRIP.overview)];
    if (section === "todo") return [textEl("h2", "TODO 清單"), renderTodoListNode(TRIP.todo)];
    if (section === "souvenirs") return [textEl("h2", "伴手禮建議"), renderSouvenirListNode(TRIP.souvenirs)];
    return [];
  }

  function openMenu(section) {
    const closeBtn = el("button", { attrs: { id: "menu-close", "aria-label": "關閉選單" }, text: "×" });
    const nav = el("nav", { attrs: { id: "menu-nav" } }, [
      el("button", { className: "menu-link", attrs: { "data-section": "overview" }, text: "行程總表" }),
      el("button", { className: "menu-link", attrs: { "data-section": "todo" }, text: "TODO 清單" }),
      el("button", { className: "menu-link", attrs: { "data-section": "souvenirs" }, text: "伴手禮建議" }),
    ]);
    const content = el("div", { attrs: { id: "menu-content" } }, renderMenuContentNodes(section));

    els.menuPanel.replaceChildren(closeBtn, nav, content);
    els.menuPanel.classList.remove("hidden");

    closeBtn.addEventListener("click", () => {
      els.menuPanel.classList.add("hidden");
    });
    nav.querySelectorAll(".menu-link").forEach((btn) => {
      btn.addEventListener("click", () => {
        location.hash = buildMenuHash(btn.dataset.section);
      });
    });
  }

  const state = { dayIndex: resolveInitialDayIndex(TRIP.days, new Date()), tab: "today" };

  function render() {
    const parsed = parseHash(location.hash);
    if (parsed && parsed.view === "menu") {
      openMenu(parsed.section);
      return;
    }
    if (parsed && parsed.view === "day") {
      const idx = getDayIndexForDate(TRIP.days, parsed.date);
      state.dayIndex = idx === -1 ? state.dayIndex : idx;
      state.tab = parsed.tab;
    }
    renderDayView(state.dayIndex, state.tab);
  }

  els.prevBtn.addEventListener("click", () => {
    if (state.dayIndex > 0) {
      state.dayIndex -= 1;
      location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
    }
  });

  els.nextBtn.addEventListener("click", () => {
    if (state.dayIndex < TRIP.days.length - 1) {
      state.dayIndex += 1;
      location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
    }
  });

  els.tabBar.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    state.tab = btn.dataset.tab;
    location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
  });

  els.menuBtn.addEventListener("click", () => {
    location.hash = buildMenuHash("overview");
  });

  window.addEventListener("hashchange", render);

  if (!location.hash) {
    location.hash = buildDayHash(TRIP.days[state.dayIndex].date, state.tab);
  } else {
    render();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    });
  }

  window.__TRIP_APP__ = { parseHash, buildDayHash, buildMenuHash, resolveInitialDayIndex, getDayIndexForDate };
})();
```

- [ ] **Step 2: 手動驗證 — 基本渲染**

重新整理 `http://localhost:8000/index.html`。

預期結果：頂部日期切換器顯示今天對應的日期（若今天不在 7/19～7/26 範圍內，會顯示 `07/19（日）`）；主畫面顯示該天標題與時間軸；底部「今日」分頁反白。

- [ ] **Step 3: 手動驗證 — 日期切換**

點擊頂部 `‹` `›` 箭頭。

預期結果：日期文字與畫面內容跟著切換；在 Day0（7/19）時 `‹` 變灰不可點，在 Day7（7/26）時 `›` 變灰不可點；瀏覽器網址列的 hash 會跟著變化（例如 `#/day/2026-07-20/today`）。

- [ ] **Step 4: 手動驗證 — 分頁切換**

點擊底部「交通」「餐廳」「總覽」分頁。

預期結果：畫面內容切換為對應分頁的內容；再切回「今日」時間軸正常顯示。切到 Day4（7/23）的「今日」分頁時，應該看到 Plan A 與 Plan B 兩張並列卡片，Plan A 卡片有「（推薦）」標記與淺色底。

- [ ] **Step 5: 手動驗證 — 選單**

點擊左上角 ☰。

預期結果：全螢幕選單面板打開，預設顯示「行程總表」內容（8 天一覽表格）；點擊「TODO 清單」「伴手禮建議」可切換內容；點擊 × 可關閉選單並回到原本的日期視圖。

- [ ] **Step 6: 手動驗證 — 瀏覽器上一頁**

依序點擊：Day1 → Day2 → 交通分頁，然後按瀏覽器上一頁兩次。

預期結果：畫面依序退回 Day1「今日」分頁、Day1 的前一個狀態，網址 hash 與畫面內容同步變化（驗證 hash 路由確實驅動畫面，而非只是內部 state）。

- [ ] **Step 7: Commit**

```bash
git add js/app.js
git commit -m "feat: add hash-based routing and DOM rendering logic"
```

---

## Task 4: PWA 支援（manifest、icons、Service Worker）

**Files:**
- Create: `scripts/generate_icons.py`
- Create: `icons/icon-192.png`（由腳本產生）
- Create: `icons/icon-512.png`（由腳本產生）
- Create: `manifest.json`
- Create: `sw.js`

- [ ] **Step 1: 建立 `scripts/generate_icons.py`**

```python
#!/usr/bin/env python3
"""Generate solid-color placeholder PWA icons (192x192, 512x512).
Uses only the Python standard library (struct + zlib), no extra
dependencies. Re-run this script if the theme color changes.
"""
import struct
import zlib
import pathlib

ACCENT_RGB = (0xC9, 0x91, 0x5D)  # matches --accent in css/style.css
OUTPUT_DIR = pathlib.Path(__file__).resolve().parent.parent / "icons"


def make_png(path, width, height, rgb):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(
            ">I", zlib.crc32(tag + data)
        )

    signature = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    r, g, b = rgb
    row = bytes([r, g, b]) * width
    raw = (b"\x00" + row) * height
    idat = zlib.compress(raw, 9)
    png = signature + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    path.write_bytes(png)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    make_png(OUTPUT_DIR / "icon-192.png", 192, 192, ACCENT_RGB)
    make_png(OUTPUT_DIR / "icon-512.png", 512, 512, ACCENT_RGB)
    print(f"Wrote icon-192.png and icon-512.png to {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: 執行腳本產生圖示**

```bash
python3 scripts/generate_icons.py
```

Expected: 輸出 `Wrote icon-192.png and icon-512.png to .../icons`，且 `icons/icon-192.png`、`icons/icon-512.png` 兩個檔案存在。

- [ ] **Step 3: 建立 `manifest.json`**

```json
{
  "name": "岡山親子行",
  "short_name": "岡山行程",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#fdf6ec",
  "theme_color": "#c9915d",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 4: 建立 `sw.js`**

```js
const CACHE_VERSION = "v1";
const CACHE_NAME = `okayama-trip-${CACHE_VERSION}`;
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
```

- [ ] **Step 5: 手動驗證 — Service Worker 註冊與快取**

重新整理 `http://localhost:8000/index.html`，開啟 DevTools → Application → Service Workers。

預期結果：看到一個 `sw.js` 狀態為 `activated and is running`；Application → Cache Storage 底下有 `okayama-trip-v1`，內含 `index.html`、`css/style.css`、`js/data.js`、`js/app.js`、`manifest.json`、兩張 icon。

- [ ] **Step 6: 手動驗證 — 離線瀏覽**

DevTools → Network → 勾選 `Offline`，然後重新整理頁面，並切換幾個日期／分頁。

預期結果：頁面正常載入、日期切換與分頁切換都正常運作，不會出現網路錯誤。取消勾選 `Offline` 後恢復正常。

- [ ] **Step 7: Commit**

```bash
git add scripts/generate_icons.py icons/icon-192.png icons/icon-512.png manifest.json sw.js
git commit -m "feat: add PWA manifest, icons, and offline service worker"
```

---

## Task 5: 手動驗證與內容核對

**Files:** 無新增檔案，純驗證步驟。

- [ ] **Step 1: 逐天核對 `js/data.js` 與 `岡山行程.md`**

打開 `岡山行程.md`，對照 `js/data.js`，逐天檢查：

| 天數 | 檢查重點 |
| --- | --- |
| Day0 (7/19) | 航班時間 11:30/15:05、巴士 16:55、餐廳 18:45 是否一致 |
| Day1 (7/20) | 吉備津彥神社／吉備津神社時間軸與交通細節是否完整 |
| Day2 (7/21) | 倉敷來回時間、美觀地區行程是否一致 |
| Day3 (7/22) | 計程車與 10:10 船班時間、寒霞溪／橄欖公園營業時間是否正確 |
| Day4 (7/23) | Plan A、Plan B 都能在「今日」分頁看到，且各自時間軸完整；船班附錄與腳踏車預約資訊在「交通」分頁 |
| Day5 (7/24) | 天使之路通行時間、回岡山船班／巴士銜接時間是否一致 |
| Day6 (7/25) | 後樂園／岡山城營業時間、AEON 採買提醒是否一致 |
| Day7 (7/26) | 機場巴士 14:50、航班 17:55、檢疫提醒是否一致 |

Expected: 全部 8 天皆無遺漏、無時間誤植。若發現不一致，回到 Task 2 修正 `js/data.js` 對應欄位。

- [ ] **Step 2: 核對跨天內容**

打開選單，核對「行程總表」8 列是否與 `岡山行程.md` 開頭的表格一致；「TODO 清單」6 項是否一致（機場接送、貴賓室已打勾）；「伴手禮建議」5 個分類是否一致。

- [ ] **Step 3: 實機安裝測試（iOS）**

用 iPhone Safari 開啟本機網址（需與手機同網段，例如 `http://<你的電腦區網 IP>:8000/index.html`），點擊分享 → 加入主畫面。

Expected: 主畫面出現「岡山行程」圖示（棕橘色方塊）；點擊開啟後以全螢幕獨立 App 模式顯示，沒有 Safari 網址列。

- [ ] **Step 4: 實機安裝測試（Android）**

用 Android Chrome 開啟同一個本機網址，點擊右上角選單 → 加到主畫面／安裝應用程式。

Expected: 主畫面出現圖示；開啟後為獨立視窗模式。開啟飛航模式後仍可正常瀏覽已快取過的頁面。

---

## Task 6: 部署到 GitHub Pages

**Files:** 無新增檔案，部署設定與 push。

> ⚠️ 此任務會建立/使用 GitHub repo 並執行 `git push`，屬於會影響共享狀態的操作。**執行前務必先跟使用者確認**：要用哪個 GitHub 帳號、repo 要 public 還是 private、確定要現在 push。取得明確同意後才繼續。

- [ ] **Step 1: 確認 `gh` CLI 已登入**

```bash
gh auth status
```

Expected: 顯示已登入的 GitHub 帳號。若未登入，請使用者自行執行 `gh auth login`。

- [ ] **Step 2:（取得使用者同意後）建立 GitHub repo 並 push**

```bash
gh repo create okayama-family-trip --private --source=. --remote=origin --push
```

Expected: 終端機輸出建立完成的 repo 網址，且 `git remote -v` 可看到 `origin`。

- [ ] **Step 3: 啟用 GitHub Pages**

```bash
gh api -X POST repos/{owner}/okayama-family-trip/pages -f "source[branch]=master" -f "source[path]=/"
```

若上述指令因帳號權限限制失敗，改為手動：到 GitHub repo 頁面 → Settings → Pages → Source 選擇 `master` 分支、`/ (root)` 路徑 → Save。

Expected: Pages 設定頁面顯示網站網址（格式 `https://<username>.github.io/okayama-family-trip/`），等待約 1 分鐘後可開啟。

- [ ] **Step 4: 驗證正式網址**

用手機瀏覽器開啟 Pages 網址，確認畫面與本機測試一致，並重複 Task 4 Step 5～6 的離線測試（Service Worker 在正式網域下需要重新註冊快取一次）。

Expected: 正式網址下 PWA 安裝、離線瀏覽皆正常運作。

---

## 內容更新注意事項（非任務，供未來參考）

之後 `岡山行程.md` 若異動：

1. 修改 `js/data.js` 對應天數／欄位。
2. 修改 `sw.js` 的 `CACHE_VERSION`（例如 `v1` → `v2`），確保使用者下次連網時能抓到新內容，不會被舊的離線快取卡住。
3. Commit 並 push（若已部署到 GitHub Pages，push 到 `master` 即會自動更新）。
