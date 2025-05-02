export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const chatId = 1476658503; // ganti dengan hasil dari ctx.chat.id kamu
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!result.ok) {
      console.error('Telegram error:', result);
      return res.status(500).json({ error: result.description });
    }

    return res.status(200).json({ status: 'OK', telegram: result });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Gagal kirim' });
  }
}
