// api/rashdul-trigger.js
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  const chatId = 1476658503; // Ganti dengan chat ID kamu
  await bot.telegram.sendMessage(chatId, `🧭 *Rashdul Kiblat Hari Ini!*

Tepat pukul 14:05 WIB, matahari berada di atas Ka'bah.
Letakkan benda tegak dan arah bayangan menunjukkan arah kiblat.

Selamat mengamati!`, { parse_mode: 'Markdown' });

  res.status(200).send('Pesan Rashdul Kiblat dikirim.');
} catch (error) {
   console.error('Gagal mengirim pesan:', error);
   res.status(500).send('Gagal mengirim');
 }
