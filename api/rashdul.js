export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  const chatId = 1476658503; // ganti dengan chat ID kamu

  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data);
      return res.status(500).send('Gagal mengirim ke Telegram');
    }

    return res.status(200).send('Pesan Rashdul Kiblat terkirim');
  } catch (error) {
    console.error('Gagal kirim:', error);
    return res.status(500).send('Internal error');
  }
}
