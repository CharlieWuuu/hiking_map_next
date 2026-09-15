# 健行軌跡

用 Next.js 寫的健行紀錄工具。上傳 GPX、把軌跡畫在地圖上、用圖表看累積成果。

資料存取在 Next.js 的 server 端直接進行，沒有另外一台 API server。Server Component 本來就跑在伺服器上，為了執行 SQL 而多打一次 HTTP 是純粹的開銷。

舊版（NestJS 後端 + Vite 前端）留在 [hiking_map](https://github.com/CharlieWuuu/hiking_map)，兩邊的資料庫與儲存空間完全獨立，互不影響。

## 開發

```bash
npm install
npm run dev       # http://localhost:4219
```

需要 `.env.local`，至少要有：

```bash
DATABASE_URL=            # Neon（PostGIS）
JWT_SECRET=              # 缺了會啟動失敗，這是刻意的
R2_ACCOUNT_ID=           # Cloudflare R2：圖片與完整軌跡
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=
R2_ENDPOINT=
R2_PUBLIC_URL=
```

其他指令：

```bash
npm run build
npm run lint
npm run storybook # http://localhost:6006
```

## 目錄

```
src/
├── app/[locale]/     頁面（App Router，路由帶語系前綴）
├── components/       跨頁面共用元件，一個資料夾一個元件
├── features/         特定領域的元件組合
├── lib/
│   ├── db/           直接查資料庫，只能被 server 端 import
│   │   ├── index.ts    neon() 連線，tagged template 自動參數化
│   │   └── *.actions.ts Server Action
│   └── api/          舊的 NestJS client，尚未完全移除
├── styles/           palette.css（原始色票）+ tokens.css（語意化 token）
└── testing/mocks/    Storybook 與測試用假資料
```

## 幾個約定

**資料存取只在 server 端。** `lib/db/` 的檔案都帶 `import 'server-only'`，從 client component import 會在編譯期直接報錯，而不是把連線字串打包進瀏覽器。寫入走 Server Action。

SQL 用 tagged template，帶入的變數會自動變成參數化查詢，不會有 injection：

```ts
const rows = await sql`SELECT * FROM trails WHERE slug = ${slug}`;
```

`lib/api/`（舊的 NestJS client）還有少數地方在用，尚未移除完。

**顏色不要寫死。** `palette.css` 放原始色票，`tokens.css` 把它們映射成語意化的名字（`--color-panel`、`--color-accent`…），元件只用後者。深淺主題靠 `.light` 覆寫同一組 token，所以換主題不需要改任何元件。品牌色目前是單一值，深淺共用。

**版面交給 `PageLayout`。** 標題、副標、返回連結、外層間距都由它決定，頁面只負責內容。最大寬度統一在 `app/[locale]/layout.tsx`。

**雙語。** `zh-TW` 與 `en`，文案放 `messages/`。數字與日期用 ICU 格式（例如距離是 `{distance, number, ::.00}`），不要在元件裡自己 `toFixed`。

## 現況

定位收斂為**個人紀錄工具**——保存自己的健行紀錄、看圖表，不做社群。追蹤功能與即時 GPS 錄製都已移除，紀錄來源改為上傳 GPX。

進行中：GPX 上傳與編輯（裁掉忘記關錄製的路段、把多段軌跡合併）。

## Debug 疊層

開發時按 `Shift+D`，把畫面上的 React 元件直接畫出來。

![debug 疊層](docs/debug-overlay.png)

- **元件框與名稱**，藍色是 server component、粉紅是 client component
- **props、state、全域狀態**，state 會顯示原始碼裡的變數名稱（`query = "12345678"`）
- **render 次數**，剛重畫過的元件會亮綠色，用來確認誰因為什麼而重新渲染
- **由誰渲染**，也就是這個元件是寫在誰的 JSX 裡
- 滑鼠移到標籤上切換元件，`Alt` + 點擊釘選

實作在 `src/lib/debug/`，資料來自 React 的 fiber tree 與 commit 掛鉤，
都不是公開 API，所以只在開發環境載入，讀取全程 try/catch。
