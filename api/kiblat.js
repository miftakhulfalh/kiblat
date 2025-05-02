import { Telegraf } from 'telegraf';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { sheets } from '@googleapis/sheets';

// Config dari environment variables
const {
  BOT_TOKEN, 
  OPENCAGE_API_KEY,
  SPREADSHEET_ID,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_PRIVATE_KEY
} = process.env;

// Inisialisasi Google Sheets
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);
const sheetsClient = sheets('v4');
// Koordinat Ka'bah dalam format DMS
const kaabahCoordinates = {
  lat: { d: 21, m: 25, s: 21.04 },  // Updated to more precise coordinates
  lon: { d: 39, m: 49, s: 34.25 }   // Updated to more precise coordinates
};

// Koordinat Ka'bah dalam desimal
const latKabah = 21.422511;  // Updated to more precise value
const lonKabah = 39.826181;  // Updated to more precise value

async function getLocationName(lat, lon) {
  try {
    const response = await fetch(
      `https://api.opencagedata.com/geocode/v1/json?key=${OPENCAGE_API_KEY}&q=${lat},${lon}&pretty=1&no_annotations=1`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      const components = data.results[0].components;
      const city = components.county || components.city || "Tidak Diketahui";
      const state = components.state || "Tidak Diketahui";
      return { city, state };
    }
    return { city: "Tidak Diketahui", state: "Tidak Diketahui" };
  } catch (error) {
    console.error("Error fetching location: " + error);
    return { city: "Error", state: "Error" };
  }
}

function sendTelegramMessage(chatId, messageId, textMessage) {
  const url = `${telegramApiUrl}/sendMessage`;
  const data = {
    chat_id: chatId,
    text: textMessage,
    reply_to_message_id: messageId,
    parse_mode: 'HTML'
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(data),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    
    if (!responseData.ok) {
      Logger.log('Telegram API Error: ' + JSON.stringify(responseData));
      throw new Error(`Telegram API Error: ${responseData.description}`);
    }
    
    return response;
  } catch (error) {
    Logger.log('Error sending message: ' + error);
    throw error;
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

  Logger.log(`Original longitude: ${lon}`);
  Logger.log(`Adjusted longitude: ${adjustedLon}`);
  Logger.log(`Calculated c value: ${c}`);

  return c;
}

// Fungsi untuk menghitung arah kiblat (menggunakan rumus original)
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


function getQiblaBaseDirection(BkiblatDeg) {
  return BkiblatDeg >= 0 ? 'Utara' : 'Selatan';
}

function getQiblaDirection(lon) {
  return lon > lonKabah ? 'Barat' : 'Timur';
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


async function handleKiblatCalculation(ctx, lat, lon, username, firstName, lastName) {
  try {
    const kiblatResult = arahKiblat(lat, lon);
    const { city, state } = getLocationName(lat, lon);
    const latDMS = toDMS(Math.abs(lat));
    const lonDMS = toDMS(Math.abs(lon));
    
    // Tentukan arah kiblat terlebih dahulu
    const qiblaDirection = getQiblaDirection(lon);
    const baseDirection = getQiblaBaseDirection(kiblatResult.decimal);

    // Sekarang kita bisa menghitung azimuth dengan parameter yang benar
    const azimuthResult = calculateAzimuth(
      kiblatResult.decimal,
      baseDirection,
      qiblaDirection
    );


        // Calculate deviation
    const azimuthDecimal = azimuthResult.d + (azimuthResult.m / 60) + (azimuthResult.s / 3600);
    const deviation = getQiblaDeviation(azimuthDecimal);


    // Nilai absolut untuk DMS kiblat
    const kiblatDMS = toDMS(Math.abs(kiblatResult.decimal));

    // Save to spreadsheet
// Fungsi untuk menyimpan ke spreadsheet
async function saveToSheet(rowData) {
  await doc.useServiceAccountAuth({
    client_email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
  
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  
  await sheet.addRow({
    'Chat ID': rowData[0],
    'Username': rowData[1],
    'First Name': rowData[2],
    'Last Name': rowData[3],
      'Latitude': rowData[4],
      'Longitude': rowData[5],
      `${latDMS.d}° ${latDMS.m}' ${latDMS.s}" ${latDirection}`: rowData[6],
      `${lonDMS.d}° ${lonDMS.m}' ${lonDMS.s}" ${lonDirection}`: rowData[7],
      'Kota': rowData[8],
      'Negara': rowData[9],
      `${kiblatDMS.d}° ${kiblatDMS.m}' ${kiblatDMS.s}"`: rowData[10],
       baseDirection,
       qiblaDirection,
      `${azimuthResult.d}° ${azimuthResult.m}' ${azimuthResult.s}"`
  });
}
    const messageReply = `
<b>PERHITUNGAN ARAH KIBLAT</b>

Latitude
------------------   ${lat.toFixed(6)} (${latDMS.d}° ${latDMS.m}' ${latDMS.s}" ${latDirection})
Longitude
------------------   ${lon.toFixed(6)} (${lonDMS.d}° ${lonDMS.m}' ${lonDMS.s}" ${lonDirection})
Lokasi Anda
------------------   ${city}, ${state}
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


    // Send message and log response
    sendTelegramMessage(chatId, messageId, messageReply.trim());
    Logger.log('Calculation completed and message sent for coordinates: ' + lat + ', ' + lon);


    
  } catch (error) {
    Logger.log('Error in handleKiblatCalculation: ' + error);
    sendTelegramMessage(chatId, messageId, 'Maaf, terjadi kesalahan dalam perhitungan. Silakan coba lagi.');
  }
}


function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const chatId = contents.message.chat.id;
    const message = contents.message;
    const messageId = message.message_id;

    const from = message.from || {};
    const username = from.username || "Tidak Ada";
    const firstName = from.first_name || "Tidak Ada";
    const lastName = from.last_name || "Tidak Ada";

    Logger.log('Received message: ' + JSON.stringify(message));

    bot.start((ctx) => {
  const welcomeMessage = `
Selamat datang di Perhitungan Arah Kiblat.

Anda memiliki dua pilihan:
1. Kirim lokasi Anda (gunakan fitur share location)
2. Kirim koordinat manual dalam formatDMS:
   10° 30' 45" N, 20° 15' 30" E
   (pastikan menggunakan simbol ° untuk derajat)
3. Kirim koordinat dalam format desimal:
   -0.022892, 109.338894`;
      
    return ctx.reply(welcomeMessage, { parse_mode: 'HTML' });
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
      console.error('Processing text message: ' + message.text);
      
      // Pattern untuk format DMS
      const dmsPattern = /(\d+)\s*°\s*(\d+)\s*'\s*(\d+(?:\.\d+)?)\s*"\s*([NSns])\s*,\s*(\d+)\s*°\s*(\d+)\s*'\s*(\d+(?:\.\d+)?)\s*"\s*([EWew])/i;
      
      // Pattern untuk format desimal (menerima angka positif/negatif dengan koma atau titik sebagai pemisah)
      const decimalPattern = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;

      if (dmsPattern.test(message.text)) {
        const match = message.text.match(dmsPattern);
        Logger.log('DMS format match: ' + JSON.stringify(match));

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

        Logger.log('Converted DMS coordinates: ' + lat + ', ' + lon);
        handleKiblatCalculation(ctx, lat, lon, username, firstName, lastName);
        });
      
      if (decimalPattern.test(message.text)) {
        const match = message.text.match(decimalPattern);
        Logger.log('Decimal format match: ' + JSON.stringify(match));
        
        const lat = Number(match[1]).toFixed(6);
        const lon = Number(match[2]).toFixed(6);
        
        Logger.log('Rounded decimal coordinates: ' + lat + ', ' + lon);
        handleKiblatCalculation(ctx, parseFloat(lat), parseFloat(lon), username, firstName, lastName);
        return;
      }
    }

    sendTelegramMessage(chatId, messageId, `
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

  } catch (error) {
    Logger.log('Error in doPost: ' + error);
  }
}

// Vercel handler
export default async (req, res) => {
  await bot.handleUpdate(req.body);
  res.status(200).send('OK');
};
