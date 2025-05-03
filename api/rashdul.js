export const config = {
  runtime: 'nodejs' // 👈 pastikan ini ditulis
};

export default async function handler(req, res) {
  console.log('🟡 Rashdul endpoint triggered');

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const CHAT_ID = '1476658503'; // Ganti dengan chat ID kamu

  if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN not found');
    return res.status(500).send('Missing bot token');
  }

  const message = `
🧭 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
  `;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const telegramRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const result = await telegramRes.json();
    console.log('🟢 Telegram API response:', result);

    if (!result.ok) {
      console.error('❌ Telegram error:', result.description);
      return res.status(500).send('Telegram API error');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Telegram fetch failed:', err);
    return res.status(500).send('Fetch failed');
  }
}
