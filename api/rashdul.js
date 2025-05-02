export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const chatId = 1476658503;
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  const token = process.env.BOT_TOKEN;

  if (!token) {
    return new Response('Token tidak tersedia', { status: 500 });
  }

  const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });

  const result = await telegramRes.json();

  if (!result.ok) {
    return new Response('Gagal kirim ke Telegram', { status: 500 });
  }

  return new Response('OK', { status: 200 });
}
