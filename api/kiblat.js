import { Telegraf } from 'telegraf';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

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

// Inisialisasi Google Sheets
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

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
      'Negara': rowData.state,
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

Anda memiliki tiga pilihan:
1. Kirim lokasi Anda (gunakan fitur share location)
2. Kirim koordinat manual dalam format DMS:
   10° 30' 45" N, 20° 15' 30" E
   (pastikan menggunakan simbol ° untuk derajat)
3. Kirim koordinat dalam format desimal:
   -0.022892, 109.338894`;
      
  return ctx.replyWithHTML(welcomeMessage);
});

bot.command('about', (ctx) => {
  const aboutMessage = `
Perhitungan arah kiblat ini menggunakan rumus 
cotan B = tan latitude Ka'bah + sin latitude tempat  / sin C - sin latitude tempat / tan C
Terima kasih telah menggunakan bot ini.
Contact x.com/miftahelfalh`;
      
  return ctx.reply(aboutMessage);
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
   10° 30' 45.5" N, 20° 15' 30.0" E
   Pastikan menggunakan:
   - Simbol derajat (°)
   - Tanda petik satu (')
   - Tanda petik dua (")
   - Arah mata angin (N/S untuk latitude, E/W untuk longitude)

2. Format Desimal:
   -0.022892, 109.338894
   - Gunakan tanda minus (-) untuk latitude Selatan atau longitude Barat
   - Gunakan tanda koma (,) sebagai pemisah antara latitude dan longitude`);
});

// Handler untuk webhook Vercel
export default async (req, res) => {
  try {
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
