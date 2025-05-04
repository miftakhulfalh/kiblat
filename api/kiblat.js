import { Telegraf } from 'telegraf';
import { Markup } from 'telegraf';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { generateQiblaVisualization } from './visualisasiKiblat.js';

// Load environment variables if running locally
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Config dari environment variables
const {
  BOT_TOKEN, 
  OPENCAGE_API_KEY,
  SPREADSHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY
} = process.env;

// Inisialisasi bot Telegram
const bot = new Telegraf(BOT_TOKEN);


// Koordinat Ka'bah dalam format DMS
const kaabahCoordinates = {
  lat: { d: 21, m: 25, s: 21.04 },  // Updated to more precise coordinates
  lon: { d: 39, m: 49, s: 34.25 }   // Updated to more precise coordinates
};

// Koordinat Ka'bah dalam desimal
const latKabah = 21.422511;  // Updated to more precise value
const lonKabah = 39.826181;  // Updated to more precise value

// Ganti inisialisasi doc dengan:
const serviceAccountAuth = new JWT({
  email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?key=${OPENCAGE_API_KEY}&q=${lat},${lon}&pretty=1&no_annotations=1`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      const city = components.county || components.city || "Tidak Diketahui";
      const state = components.state || components.country || "Tidak Diketahui";
      return { city, state };
    }
    return { city: "Tidak Diketahui", state: "Tidak Diketahui" };
  } catch (error) {
    console.error("Error fetching location: " + error);
    return { city: "Error", state: "Error" };
  }
}

function dmsToDecimal(degree, minute, second, direction) {
  let decimal = degree + minute / 60 + second / 3600;
  
  // Jika arah S atau W, kalikan dengan -1
  if (direction === 'S' || direction === 'W') {
    decimal *= -1;
  }
  
  return decimal;
}

function toDMS(decimal) {
  const absDecimal = Math.abs(decimal);
  const d = Math.floor(absDecimal);
  const m = Math.floor((absDecimal - d) * 60);
  const s = Math.round(((absDecimal - d) * 60 - m) * 60);
  return { d, m, s };
}

function getQiblaBaseDirection(BkiblatDeg) {
  return BkiblatDeg >= 0 ? 'Utara' : 'Selatan';
}

function getQiblaDirection(lon) {
  return lon > lonKabah ? 'Barat' : 'Timur';
}

function calculateC(lon) {
  // Normalisasi longitude ke range -180 to +180
  let adjustedLon = lon;
  while (adjustedLon > 180) adjustedLon -= 360;
  while (adjustedLon < -180) adjustedLon += 360;
  
  // Hitung selisih longitude dengan Ka'bah (SBMD - Selisih Bujur Mekkah Daerah)
  let c = Math.abs(adjustedLon - lonKabah);
  
  // Jika selisih > 180, gunakan complementary angle
  if (c > 180) {
    c = 360 - c;
  }

  console.log(`Original longitude: ${lon}`);
  console.log(`Adjusted longitude: ${adjustedLon}`);
  console.log(`Calculated c value: ${c}`);

  return c;
}

// Fungsi untuk menghitung arah kiblat
function arahKiblat(lat, lon) {
  // Mencari nilai a, b, c
  const a = 90 - lat;
  const b = 90 - latKabah;
  const c = Math.abs(lon - lonKabah);

  // Konversi derajat ke radian
  const aRad = a * (Math.PI / 180);
  const bRad = b * (Math.PI / 180);
  const cRad = c * (Math.PI / 180);

  // Menghitung cotangent b
  const cotanB = 1 / Math.tan(bRad);
  const sinA = Math.sin(aRad);
  const sinC = Math.sin(cRad);
  const cosA = Math.cos(aRad);
  const cotanC = 1 / Math.tan(cRad);

  // Rumus perhitungan arah kiblat
  const cotanBkiblat = ((cotanB * sinA) / sinC) - (cosA * cotanC);
  
  // Menghitung Bkiblat (dalam radian)
  const BkiblatRad = Math.atan(1 / cotanBkiblat);
  
  // Mengubah hasil dari radian ke derajat
  const BkiblatDeg = BkiblatRad * (180 / Math.PI);

  return {
    dms: toDMS(Math.abs(BkiblatDeg)),
    decimal: BkiblatDeg
  };
}

function calculateAzimuth(kiblatDecimal, baseDirection, qiblaDirection) {
  let azimuthDeg;
  
  // Take absolute value of kiblatDecimal for calculations
  const absKiblat = Math.abs(kiblatDecimal);
  
  if (baseDirection === 'Utara') {
    if (qiblaDirection === 'Timur') {
      azimuthDeg = absKiblat;
    } else { // Barat
      azimuthDeg = 360 - absKiblat;
    }
  } else { // Selatan
    if (qiblaDirection === 'Timur') {
      azimuthDeg = 180 - absKiblat;
    } else { // Barat
      azimuthDeg = 180 + absKiblat;
    }
  }

  return toDMS(azimuthDeg);
}

function getQiblaDeviation(azimuthDeg) {
  // Normalize azimuth to 0-360 range
  while (azimuthDeg >= 360) azimuthDeg -= 360;
  while (azimuthDeg < 0) azimuthDeg += 360;
  
  let baseDirection = '';
  let deviation = 0;
  
  // Calculate deviation from nearest cardinal direction
  if (azimuthDeg > 315 || azimuthDeg <= 45) {
    baseDirection = 'Utara';
    deviation = azimuthDeg > 315 ? azimuthDeg - 360 : azimuthDeg;
  } else if (azimuthDeg > 45 && azimuthDeg <= 135) {
    baseDirection = 'Timur';
    deviation = azimuthDeg - 90;
  } else if (azimuthDeg > 135 && azimuthDeg <= 225) {
    baseDirection = 'Selatan';
    deviation = azimuthDeg - 180;
  } else {
    baseDirection = 'Barat';
    deviation = azimuthDeg - 270;
  }
  
  // Format the deviation text
  const absDeviation = Math.abs(deviation);
  const deviationDMS = toDMS(absDeviation);
  const direction = deviation >= 0 ? 'kanan' : 'kiri';
  
  return {
    baseDirection,
    deviationDMS,
    direction
  };
}

// Fungsi untuk menyimpan ke spreadsheet
async function saveToSheet(rowData) {
  try {
   
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    
    await sheet.addRow({
      'Chat ID': rowData.chatId,
      'Username': rowData.username,
      'First Name': rowData.firstName,
      'Last Name': rowData.lastName,
      'Latitude': rowData.lat,
      'Longitude': rowData.lon,
      'Latitude DMS': rowData.latDMS,
      'Longitude DMS': rowData.lonDMS,
      'Kota': rowData.city,
      'Provinsi': rowData.state,
      'Arah Kiblat': rowData.kiblatDMS,
      'Base Direction': rowData.baseDirection,
      'Qibla Direction': rowData.qiblaDirection,
      'Azimuth': rowData.azimuthDMS
    });
    
    console.log('Data saved to spreadsheet successfully');
  } catch (error) {
    console.error('Error saving to spreadsheet:', error);
  }
}

async function handleKiblatCalculation(ctx, lat, lon) {
  try {
    const { message } = ctx;
    const chatId = message.chat.id;
    const username = message.from.username || "Tidak Ada";
    const firstName = message.from.first_name || "Tidak Ada";
    const lastName = message.from.last_name || "Tidak Ada";
    
    const kiblatResult = arahKiblat(lat, lon);
    const locationInfo = await getLocationName(lat, lon);
    const latDMS = toDMS(Math.abs(lat));
    const lonDMS = toDMS(Math.abs(lon));
    
    // Tentukan arah mata angin
    const latDirection = lat >= 0 ? 'N' : 'S';
    const lonDirection = lon >= 0 ? 'E' : 'W';
    
    // Tentukan arah kiblat
    const qiblaDirection = getQiblaDirection(lon);
    const baseDirection = getQiblaBaseDirection(kiblatResult.decimal);

    // Menghitung azimuth
    const azimuthResult = calculateAzimuth(
      kiblatResult.decimal,
      baseDirection,
      qiblaDirection
    );

    // Menghitung deviasi
    const azimuthDecimal = azimuthResult.d + (azimuthResult.m / 60) + (azimuthResult.s / 3600);
    const deviation = getQiblaDeviation(azimuthDecimal);

    // Nilai absolut untuk DMS kiblat
    const kiblatDMS = toDMS(Math.abs(kiblatResult.decimal));

    // Format hasil perhitungan untuk pesan
    const messageReply = `
<b>PERHITUNGAN ARAH KIBLAT</b>

Latitude
------------------   ${lat.toFixed(6)} (${latDMS.d}° ${latDMS.m}' ${latDMS.s}" ${latDirection})
Longitude
------------------   ${lon.toFixed(6)} (${lonDMS.d}° ${lonDMS.m}' ${lonDMS.s}" ${lonDirection})
Lokasi Anda
------------------   ${locationInfo.city}, ${locationInfo.state}
Latitude Ka'bah
------------------   ${kaabahCoordinates.lat.d}° ${kaabahCoordinates.lat.m}' ${kaabahCoordinates.lat.s}" N
Longitude Ka'bah
------------------   ${kaabahCoordinates.lon.d}° ${kaabahCoordinates.lon.m}' ${kaabahCoordinates.lon.s}" E
Arah Kiblat
------------------   ${kiblatDMS.d}° ${kiblatDMS.m}' ${kiblatDMS.s}" dari ${baseDirection} ke ${qiblaDirection}
Azimuth Kiblat
------------------   ${azimuthResult.d}° ${azimuthResult.m}' ${azimuthResult.s}"
Kecondongan
------------------   ${deviation.deviationDMS.d}° ${deviation.deviationDMS.m}' ${deviation.deviationDMS.s}" ke ${deviation.direction} dari arah ${deviation.baseDirection}`;

    // Kirim pesan balasan
    await ctx.replyWithHTML(messageReply.trim());
    console.log('Calculation completed and message sent for coordinates: ' + lat + ', ' + lon);

  // Setelah ctx.replyWithHTML(messageReply.trim());
  const imageBuffer = generateQiblaVisualization(azimuthDecimal);
  await ctx.replyWithPhoto({ source: imageBuffer }, {
      caption: `🕋 Visualisasi Arah Kiblat\nAzimuth: ${azimuthResult.d}° ${azimuthResult.m}' ${azimuthResult.s}"`,
      parse_mode: 'HTML'
  });
    
    // Simpan data ke spreadsheet
    try {
      await saveToSheet({
        chatId,
        username,
        firstName,
        lastName,
        lat,
        lon,
        latDMS: `${latDMS.d}° ${latDMS.m}' ${latDMS.s}" ${latDirection}`,
        lonDMS: `${lonDMS.d}° ${lonDMS.m}' ${lonDMS.s}" ${lonDirection}`,
        city: locationInfo.city,
        state: locationInfo.state,
        kiblatDMS: `${kiblatDMS.d}° ${kiblatDMS.m}' ${kiblatDMS.s}"`,
        baseDirection,
        qiblaDirection,
        azimuthDMS: `${azimuthResult.d}° ${azimuthResult.m}' ${azimuthResult.s}"`
      });
    } catch (error) {
      console.error('Failed to save data to spreadsheet:', error);
    }
    
  } catch (error) {
    console.error('Error in handleKiblatCalculation:', error);
    await ctx.reply('Maaf, terjadi kesalahan dalam perhitungan. Silakan coba lagi.');
  }
}

// Set up bot commands and handlers
bot.start((ctx) => {
  const welcomeMessage = `
Selamat datang di Perhitungan Arah Kiblat.

Anda memiliki dua pilihan:
1. Kirim lokasi Anda (gunakan tombol attachment/share location)
2. Ketik koordinat manual dalam format:
   • DMS: <code>6°59'30.8" S, 110°20'57.4" E</code>
   • Desimal: <code>-6.9919, 110.3493</code>`;
    const keyboard = Markup.inlineKeyboard([
    [
      Markup.button.callback('🕋 Hitung Kiblat', 'hitung_kiblat'),
    ],
    [
      Markup.button.callback('📚 Tentang Bot', 'about'),
      Markup.button.callback('📞 Kontak', 'contact')
    ]
  ]);
      
  // Reply keyboard (custom keyboard)
  const replyKeyboard = Markup.keyboard([
    ['Hitung Kiblat'], ['Tentang Bot','Kontak'],
    [Markup.button.locationRequest('📍 Kirim Lokasi')]
  ])
  .resize(true)
  .oneTime(false); // ditampilkan terus

  return ctx.replyWithHTML(welcomeMessage, keyboard).then(() => {
    return ctx.reply('Menu utama:', replyKeyboard);
  });
});

// Tambahkan handler untuk callback queries
bot.action('hitung_kiblat', async (ctx) => {
  await ctx.replyWithHTML(`Silakan pilih metode input:
1. Kirim lokasi Anda (gunakan tombol attachment/share location)
2. Ketik koordinat manual dalam format:
   • DMS: <code>6°59'30.8" S, 110°20'57.4" E</code>
   • Desimal: <code>-6.9919, 110.3493</code>`);
});

// Definisikan pesan di luar agar bisa digunakan di banyak handler
const aboutMessage = `
🤖 <b>Tentang Bot Kiblat</b>

Perhitungan arah kiblat ini menggunakan rumus 
cotan B = tan latitude Ka'bah + sin latitude tempat  / sin C - sin latitude tempat / tan C
Terima kasih telah menggunakan bot ini.`;

const contactMessage = `
📬 <b>Kontak Pengembang</b>

Untuk pertanyaan atau masukan:
🌐 Twitter: x.com/miftahelfalh
🛠 Github: https://github.com/miftakhulfalh`;


bot.action('about', (ctx) => { 
  ctx.replyWithHTML(aboutMessage);
});

bot.command('about', (ctx) => {
     
  ctx.replyWithHTML(aboutMessage);
});

bot.action('contact', (ctx) => { 
  ctx.replyWithHTML(contactMessage);
});

bot.hears('Hitung Kiblat', (ctx) => {
  ctx.replyWithHTML(`Silakan pilih metode input:
1. Kirim lokasi Anda (gunakan tombol attachment/share location)
2. Ketik koordinat manual dalam format:
   • DMS: <code>6°59'30.8" S, 110°20'57.4" E</code>
   • Desimal: <code>-6.9919, 110.3493</code>`);
});
bot.hears('Tentang Bot', (ctx) => {
  ctx.replyWithHTML(aboutMessage);
});
bot.hears('Kontak', (ctx) => {
  ctx.replyWithHTML(contactMessage);
});

// Handler untuk lokasi dan koordinat
bot.on('location', async (ctx) => {
  const location = ctx.message.location;
  await handleKiblatCalculation(ctx, location.latitude, location.longitude);
});

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  console.log('Processing text message:', message);
  
  // Pattern untuk format DMS
  const dmsPattern = /(\d+)\s*°\s*(\d+)\s*'\s*(\d+(?:\.\d+)?)\s*"\s*([NSns])\s*,\s*(\d+)\s*°\s*(\d+)\s*'\s*(\d+(?:\.\d+)?)\s*"\s*([EWew])/i;
  
  // Pattern untuk format desimal
  const decimalPattern = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;

  if (dmsPattern.test(message)) {
    const match = message.match(dmsPattern);
    console.log('DMS format match:', match);

    const lat = dmsToDecimal(
      parseFloat(match[1]), 
      parseFloat(match[2]), 
      parseFloat(match[3]), 
      match[4].toUpperCase()
    );
    const lon = dmsToDecimal(
      parseFloat(match[5]), 
      parseFloat(match[6]), 
      parseFloat(match[7]), 
      match[8].toUpperCase()
    );

    console.log('Converted DMS coordinates:', lat, lon);
    await handleKiblatCalculation(ctx, lat, lon);
    return;
  }
  
  if (decimalPattern.test(message)) {
    const match = message.match(decimalPattern);
    console.log('Decimal format match:', match);
    
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    
    console.log('Parsed decimal coordinates:', lat, lon);
    await handleKiblatCalculation(ctx, lat, lon);
    return;
  }
  
  // Jika format tidak valid
  await ctx.replyWithHTML(`
Format koordinat tidak valid. Silakan kirim lokasi atau koordinat dengan salah satu format berikut:

1. Format DMS:
   <code>6°59'30.8" S, 110°20'57.4" E</code>
   Pastikan menggunakan:
   - Simbol derajat (°)
   - Tanda petik satu (')
   - Tanda petik dua (")
   - Arah mata angin (N/S untuk latitude, E/W untuk longitude)

2. Format Desimal:
   <code>-6.9919, 110.3493</code>
   Pastikan menggunakan:
   - Gunakan tanda minus (-) untuk latitude Selatan atau longitude Barat
   - Gunakan tanda koma (,) sebagai pemisah antara latitude dan longitude`);
});

async function getChatIdsFromDedicatedSheet() {
  try {
    await doc.loadInfo();
    
    // 1. Cari sheet dengan nama "ChatIds"
    const chatIdSheet = doc.sheetsByTitle['ChatIds'] || doc.sheetsByIndex[1];
    console.log(`Menggunakan sheet: "${chatIdSheet.title}"`);

    // 2. Muat header dan data
    await chatIdSheet.loadHeaderRow();
    const header = chatIdSheet.headerValues;
    console.log('Header:', header);

    // 3. Ambil semua baris DATA (skip header)
    const rows = await chatIdSheet.getRows();
    console.log(`Jumlah baris data: ${rows.length}`);

    // 4. Ekstrak Chat ID
    const chatIds = [];
    
    for (const row of rows) {
      // Gunakan nama kolom header pertama (misal: "Chat ID")
      const chatId = row.get(header[0]);
      
      // Validasi
      if (chatId && !isNaN(chatId) && chatId.toString().trim() !== '') {
        console.log(`✅ Valid Chat ID: ${chatId}`);
        chatIds.push(chatId.toString().trim());
      } else {
        console.log(`❌ Invalid Chat ID: '${chatId}' di baris ${row.rowNumber}`);
      }
    }

    console.log(`Total Chat ID valid: ${chatIds.length}`);
    return chatIds;
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}
// Fungsi untuk mengirim notifikasi Rashdul Kiblat ke semua ChatID di Sheet "ChatIds"
async function sendRashdulKiblatNotifications() {
  const chatIds = await getChatIdsFromDedicatedSheet();
  
  if (chatIds.length === 0) {
    console.log('Tidak ada ChatID untuk dikirim notifikasi');
    return {
      success: false,
      message: 'Tidak ada ChatID untuk dikirim notifikasi'
    };
  }
  
  // Tanggal saat ini untuk pesan
  const today = new Date();
  const formattedDate = today.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  
  const message = `
🧭 *Rashdul Kiblat ${formattedDate}*

Rashdul Kiblat (atau Istiwa A'zham) terjadi ketika matahari tepat berada di atas Ka'bah, sehingga bayangan benda tegak di tempat lain akan langsung mengarah ke Ka'bah. Ini adalah waktu terbaik untuk mengoreksi arah kiblat secara visual.

Setiap tahun terjadi dua kali, yaitu:
🔸 1. Tanggal 27-28 Mei
Waktu: pukul 12:18 waktu Arab Saudi (UTC+3)
→ pukul 16:18 WIB (UTC+7)

🔸 2. Tanggal 15-16 Juli
Waktu: pukul 12:27 waktu Arab Saudi (UTC+3)
→ pukul 16:27 WIB (UTC+7)

Letakkan benda tegak lurus dan lihat arah bayangannya. Gunakan ini untuk kalibrasi arah kiblat Anda.

⏰ Waktu terbaik untuk pengukuran berkisar antara 5-10 menit setelah notifikasi ini.

_Notifikasi otomatis dari Bot Arah Kiblat_
  `;
  
  const results = {
    success: 0,
    failed: 0,
    total: chatIds.length
  };
  
  // Mengirim pesan ke setiap ChatID
  for (const chatId of chatIds) {
    try {
      await bot.telegram.sendMessage(chatId, message, { 
        parse_mode: 'Markdown',
      });
      console.log(`✅ Sukses mengirim ke ChatID: ${chatId}`);
      results.success++;
    } catch (error) {
      console.error(`❌ Gagal mengirim ke ChatID: ${chatId}`, error.message);
      results.failed++;
    }
    
    // Delay sedikit untuk menghindari rate limit API Telegram
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return {
    ...results,
    message: `Berhasil mengirim ${results.success} dari ${results.total} notifikasi.`
  };
}

async function sendUpdateBotNotifications() {
  const chatIds = await getChatIdsFromDedicatedSheet();
  
  if (chatIds.length === 0) {
    console.log('Tidak ada ChatID untuk dikirim notifikasi pembaruan');
    return {
      success: false,
      message: 'Tidak ada ChatID untuk dikirim notifikasi pembaruan'
    };
  }

const message = `
<b>🔄 Pembaruan Bot Arah Kiblat</b>

Kami telah melakukan pembaruan pada bot, termasuk:

• Penyempurnaan tampilan arah kiblat dengan Custom Reply
• Notifikasi Rashdul Kiblat Global otomatis
• Visualisasi sederhana arah kiblat Anda
• Perbaikan bug dan peningkatan performa  

Terima kasih telah menggunakan bot ini 🙏  
Silakan ketik /start jika menu tidak muncul.  
_________________________________

<b>We’ve made several improvements to the bot, including:</b>

• Enhanced Qibla direction interface with custom reply menu  
• Automatic Global Rashdul Qiblat notifications  
• Simple visual representation of your Qibla direction  
• Bug fixes and performance improvements  

Thank you for using this bot 🙏  
Type /start again if the menu does not appear.

<i>-- Tim Pengembang Bot Arah Kiblat</i>
`;

  const results = {
    success: 0,
    failed: 0,
    total: chatIds.length
  };

  for (const chatId of chatIds) {
    try {
      await bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'HTML',
      });
      console.log(`✅ Notifikasi update terkirim ke ChatID: ${chatId}`);
      results.success++;
    } catch (error) {
      console.error(`❌ Gagal kirim update ke ChatID: ${chatId}`, error.message);
      results.failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    ...results,
    message: `Update bot terkirim ke ${results.success} dari ${results.total} chat ID.`
  };
}


// Handler untuk webhook Vercel - Gunakan fungsi yang sudah dimodifikasi
export default async (req, res) => {
  try {
    // Cek jika ini adalah request untuk rashdul kiblat dari cronjob
    if (req.query && req.query.rashdul === '1') {
      console.log('🟢 Menjalankan Rashdul Kiblat dari cron');
      
      let result;
      
      // Jika ada parameter chat_id, gunakan itu
      if (req.query.chat_id) {
        console.log(`Using chat_id from query parameter: ${req.query.chat_id}`);
        
        const chatId = req.query.chat_id;
        const message = `
🧭 *Rashdul Kiblat ${new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}*

Rashdul Kiblat (atau Istiwa A'zham) terjadi ketika matahari tepat berada di atas Ka'bah, sehingga bayangan benda tegak di tempat lain akan langsung mengarah ke Ka'bah. Ini adalah waktu terbaik untuk mengoreksi arah kiblat secara visual.

Setiap tahun terjadi dua kali, yaitu:
🔸 1. Tanggal 27-28 Mei
Waktu: pukul 12:18 waktu Arab Saudi (UTC+3)
→ pukul 16:18 WIB (UTC+7)

🔸 2. Tanggal 15-16 Juli
Waktu: pukul 12:27 waktu Arab Saudi (UTC+3)
→ pukul 16:27 WIB (UTC+7)

Letakkan benda tegak lurus dan lihat arah bayangannya. Gunakan ini untuk kalibrasi arah kiblat Anda.

⏰ Waktu terbaik untuk pengukuran berkisar antara 5-10 menit setelah notifikasi ini.

_Notifikasi otomatis dari Bot Arah Kiblat_
        `;
        
        try {
          await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          result = {
            success: 1,
            failed: 0,
            total: 1,
            message: `Berhasil mengirim notifikasi ke chat ID: ${chatId}`
          };
        } catch (error) {
          console.error(`Error sending to chat ID ${chatId}:`, error);
          result = {
            success: 0,
            failed: 1,
            total: 1,
            message: `Gagal mengirim: ${error.message}`
          };
        }
      } else {
        // Gunakan fungsi yang mengambil dari sheet "ChatIds"
        result = await sendRashdulKiblatNotifications();
      }
      
      // Kirim response berdasarkan hasil
      if (result.success > 0) {
        return res.status(200).json({
          status: 'success',
          ...result
        });
      } else {
        return res.status(400).json({
          status: 'failed',
          ...result
        });
      }
    }

    // Tambahan endpoint untuk update bot
    if (req.query && req.query.update === '1') {
      console.log('🟢 Menjalankan notifikasi pembaruan bot dari endpoint');
    
      const result = await sendUpdateBotNotifications();
    
      if (result.success > 0) {
        return res.status(200).json({
          status: 'success',
          ...result
        });
      } else {
        return res.status(400).json({
          status: 'failed',
          ...result
        });
      }
    }


    // Jika bukan request rashdul, proses sebagai webhook normal
    if (req.method === 'POST') {
      const update = req.body;
      await bot.handleUpdate(update);
    }
    res.status(200).end('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).end('Internal Server Error');
  }
};

// Jika dijalankan di luar Vercel (development)
if (process.env.NODE_ENV !== 'production') {
  bot.launch().then(() => {
    console.log('Bot started in polling mode');
  }).catch(err => {
    console.error('Failed to start bot:', err);
  });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
