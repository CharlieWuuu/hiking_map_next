import { neon } from '@neondatabase/serverless';

// 資料存取直接在 Next.js 的 server 端進行，不再經過另一台 NestJS。
// Server Component 本來就跑在伺服器上，為了執行 SQL 而多打一次 HTTP 是純粹的開銷，
// 也是 CORS、API base URL、後端另外部署這些問題的來源。
//
// 這個檔案只能被 server 端的程式碼 import（Server Component、Route Handler、Server Action）。
// 'server-only' 會讓不小心從 client component import 時直接在編譯期報錯，
// 而不是把資料庫連線字串打包進瀏覽器。
import 'server-only';

if (!process.env.DATABASE_URL) {
  // 缺連線字串就讓它在啟動時直接失敗，而不是每次查詢才出現難懂的錯誤
  throw new Error('DATABASE_URL is not set');
}

// neon() 走 HTTP，適合 serverless：不需要維護連線池，每次查詢獨立，
// 冷啟動也不會卡在建立 TCP 連線。用法是 tagged template，
// 帶入的變數會自動變成參數化查詢（$1, $2...），不會有 SQL injection。
//
//   const rows = await sql`SELECT * FROM trails WHERE slug = ${slug}`;
//
// PostGIS 函式照常寫，跟原本 NestJS 裡的 SQL 完全一樣。
export const sql = neon(process.env.DATABASE_URL);
