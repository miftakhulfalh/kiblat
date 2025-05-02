export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const token = process.env.BOT_TOKEN;
  
  // Validasi environment variable
  if (!token) {
    console.error('BOT_TOKEN tidak terdefinisi');
    return new Response('Server Error: Token tidak tersedia', { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Dapatkan chat_id dari database (contoh sederhana)
  const chatId = 1476658503; // Implementasi fungsi ini
  
  const message = `
🌞 *Rashdul Kiblat Hari Ini*

🔍 *Instruksi:*
1. Cari tempat datar dan terbuka
2. Tancapkan benda tegak lurus
3. Arah bayangan = arah kiblat`;

  try {
    const telegramRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Edge-Function'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_notification: false
      }),
    });

    const result = await telegramRes.json();
    
    // Logging detail untuk debug
    console.log('Telegram API Response:', JSON.stringify(result));

    if (!result.ok) {
      return new Response(JSON.stringify({
        status: 'error',
        error_code: result.error_code,
        description: result.description
      }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: 'success',
      message_id: result.result.message_id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Fatal Error:', error);
    return new Response(JSON.stringify({
      status: 'error',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

