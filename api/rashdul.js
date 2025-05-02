import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  const chatId = 1476658503; // Ganti dengan chat ID kamu (bukan @username)
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

Sekarang matahari tepat di atas Ka'bah.
Arah bayangan benda tegak lurus menunjukkan arah kiblat.

Gunakan ini untuk kalibrasi arah kiblat Anda.
`;

  try {
    await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    return res.status(200).send('Pesan terkirim');
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
    return res.status(500).send('Gagal mengirim');
  }
}
