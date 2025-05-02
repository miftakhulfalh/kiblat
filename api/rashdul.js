export default async function handler(req, res) {
  console.log('🔔 Endpoint /api/rashdul dipanggil');

  const chatId = 1476658503;
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  const token = process.env.BOT_TOKEN;

  if (!token) {
    console.error('❌ BOT_TOKEN tidak tersedia');
    return res.status(500).send('Token tidak tersedia');
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const telegramRes = await fetch(url, {
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

    const result = await telegramRes.json();

    console.log('✅ Respons dari Telegram:', result);

    if (!result.ok) {
      console.error('❌ Telegram error:', result.description);
      return res.status(500).send('Gagal kirim ke Telegram');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('❌ Gagal kirim request ke Telegram:', err);
    return res.status(500).send('Gagal kirim');
  }
}
