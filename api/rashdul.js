export default async function handler(req, res) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  console.log('TOKEN:', process.env.BOT_TOKEN);
  const chatId = 1476658503; // Panggil fungsi getChatId()
  
  const message = `
🌞 *Rashdul Kiblat Hari Ini*\n


🔍 Cara verifikasi:
1. Tancapkan tongkat lurus
2. Amati bayangan saat persis waktu di atas
3. Arah bayangan = arah kiblat

📅 *Jadwal Selanjutnya:*
- 28 Mei 2024 (12:18 WIB)
- 16 Juli 2024 (12:27 WIB)`;

  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{text: '📱 Buka Aplikasi', url: 'https://kiblat-bot.com'}]
        ]
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Error Detail:', {
        status: result.error_code,
        message: result.description,
        parameters: result.parameters
      });
      return res.status(500).json({ 
        error: 'Gagal mengirim notifikasi',
        debug: result 
      });
    }

    return res.status(200).json({ 
      status: 'OK',
      timestamp: new Date().toISOString(),
      chat_info: result.result.chat
    });
    
  } catch (err) {
    console.error('Full Error Stack:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: err.message
    });
  }
}
