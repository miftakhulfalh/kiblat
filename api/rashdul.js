// api/rashdul.js
import schedule from 'node-schedule';

export function jadwalkanRashdul(bot, chatId) {
  // Tanggal Rashdul Kiblat uji coba: 2 Mei 2025 pukul 13:55 WIB (UTC = 06:55)
  const targetDate = new Date('2025-05-02T07:08:00.000Z');

  schedule.scheduleJob(targetDate, () => {
    bot.telegram.sendMessage(chatId, `🧭 *Rashdul Kiblat Hari Ini!*

Tepat pukul 13:55 WIB, matahari berada di atas Ka'bah.
Letakkan benda tegak dan arah bayangan menunjukkan arah kiblat.

Selamat mengamati!`, { parse_mode: 'Markdown' });
  });
}
