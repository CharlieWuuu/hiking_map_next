import 'server-only';

// 用 Resend 的 HTTP API 寄信，而不是 SMTP。
//
// 舊的 NestJS 用 nodemailer 走 Gmail SMTP，那套搬不到這裡：
// Vercel 的 Serverless Function 不開放對外的 TCP 連線，SMTP 是 TCP，
// 連線只會逾時。HTTP API 型的服務就沒有這個限制。
//
// 沒設定 RESEND_API_KEY 時不會失敗，而是把整封信印在 log 裡，
// 本機因此不必真的寄信也能測完整的忘記密碼流程。

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[mail] 沒有設定 RESEND_API_KEY / MAIL_FROM，以下是原本要寄給 ${to} 的信：\n${subject}\n${html}`);
    return;
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!response.ok) {
    // 內容帶出來，否則只看到 4xx 很難查是網域沒驗證還是 key 不對
    throw new Error(`寄信失敗（${response.status}）：${await response.text()}`);
  }
}
