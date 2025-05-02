export default async function handler(req, res) {
  const chatId = 1476658503;
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  const url = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

  try {
    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    });

    const json = await result.json();
    console.log('Telegram API response:', json);
    return res.status(200).send('Pesan dikirim');
  } catch (error) {
    console.error('Gagal kirim pesan:', error);
    return res.status(500).send('Gagal kirim');
  }
}
