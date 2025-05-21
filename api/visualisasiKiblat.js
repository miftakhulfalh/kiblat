// visualisasiKiblat.js
import puppeteer from 'puppeteer';

export async function generateQiblaVisualization(azimuthDeg) {
  // Luncurkan browser Puppeteer dengan mode headless
  const browser = await puppeteer.launch({
    headless: 'new', // Gunakan headless mode baru
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // Argumen penting untuk deployment di Vercel
  });
  
  try {
    const page = await browser.newPage();
    
    // Set ukuran viewport
    await page.setViewport({ width: 400, height: 400 });
    
    // Buat HTML untuk visualisasi
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #FFFFFF;
            font-family: Arial, sans-serif;
          }
          #canvas {
            width: 400px;
            height: 400px;
          }
        </style>
      </head>
      <body>
        <canvas id="canvas" width="400" height="400"></canvas>
        <script>
          // Fungsi untuk menggambar visualisasi
          function drawQiblaDirection() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            const azimuthDeg = ${azimuthDeg};
            
            // Background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, 400, 400);
            
            // Lingkaran utama
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(200, 200, 150, 0, Math.PI * 2);
            ctx.stroke();
            
            // Titik pusat
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(200, 200, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Garis kiblat
            const radians = (azimuthDeg - 90) * Math.PI / 180;
            ctx.strokeStyle = '#FF0000';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(200, 200);
            ctx.lineTo(200 + Math.cos(radians) * 140, 200 + Math.sin(radians) * 140);
            ctx.stroke();
            
            // Tambahkan panah di ujung garis kiblat
            const arrowSize = 15;
            const arrowAngle = Math.PI / 8;
            
            const endX = 200 + Math.cos(radians) * 140;
            const endY = 200 + Math.sin(radians) * 140;
            
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
                endX - arrowSize * Math.cos(radians - arrowAngle),
                endY - arrowSize * Math.sin(radians - arrowAngle)
            );
            ctx.lineTo(
                endX - arrowSize * Math.cos(radians + arrowAngle),
                endY - arrowSize * Math.sin(radians + arrowAngle)
            );
            ctx.closePath();
            ctx.fillStyle = '#FF0000';
            ctx.fill();
            
            // Gambar arah mata angin
            const directions = [
                { x: 200, y: 30, letter: 'U' },   // Utara
                { x: 370, y: 200, letter: 'T' },  // Timur
                { x: 200, y: 370, letter: 'S' },  // Selatan
                { x: 30, y: 200, letter: 'B' }    // Barat
            ];
            
            // Gambar titik biru untuk setiap arah
            ctx.fillStyle = '#0000FF';
            directions.forEach(dir => {
                // Gambar titik
                ctx.beginPath();
                ctx.arc(dir.x, dir.y, 4, 0, Math.PI * 2);
                ctx.fill();
                
                // Gambar huruf arah
                ctx.font = '16px Arial, sans-serif';
                ctx.fillStyle = '#0000FF';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Offset untuk menempatkan teks di luar titik
                const offsetX = (dir.x === 30) ? -15 : ((dir.x === 370) ? 15 : 0);
                const offsetY = (dir.y === 30) ? -15 : ((dir.y === 370) ? 15 : 0);
                
                ctx.fillText(dir.letter, dir.x + offsetX, dir.y + offsetY);
            });
            
            // Label sudut azimuth
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(\`ARAH KIBLAT: \${Math.round(azimuthDeg)}°\`, 200, 380);
          }
          
          // Jalankan fungsi menggambar
          drawQiblaDirection();
        </script>
      </body>
      </html>
    `;
    
    // Muat HTML ke halaman
    await page.setContent(html);
    
    // Tunggu sejenak agar gambar terrender dengan sempurna
    await page.waitForTimeout(500);
    
    // Ambil screenshot
    const imageBuffer = await page.screenshot({
      type: 'png',
      omitBackground: true
    });
    
    return imageBuffer;
  } finally {
    // Tutup browser
    await browser.close();
  }
}
