// visualisasiKiblat.js
import { createCanvas } from '@napi-rs/canvas';

export function generateQiblaVisualization(azimuthDeg) {
    const canvas = createCanvas(400, 400);
    const ctx = canvas.getContext('2d');
    
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

    // Teks arah mata angin dengan metode yang lebih kompatibel
    drawCompassText(ctx);
    
    // Label sudut azimuth
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Arah Kiblat: ${Math.round(azimuthDeg)}°`, 200, 380);

    return canvas.toBuffer('image/png');
}

function drawCompassText(ctx) {
    // Atur font dan gaya
    ctx.fillStyle = '#000000';
    ctx.font = '18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Arah mata angin utama
    ctx.fillText('U', 200, 35);
    ctx.fillText('T', 365, 200);
    ctx.fillText('S', 200, 365);
    ctx.fillText('B', 35, 200);
    
    // Arah mata angin tambahan (opsional)
    ctx.font = '14px Arial, sans-serif';
    ctx.fillText('TL', 305, 95);
    ctx.fillText('TG', 305, 305);
    ctx.fillText('BD', 95, 305);
    ctx.fillText('BL', 95, 95);
    
    // Lingkaran kecil untuk penanda arah utama
    const dirMarkerRadius = 3;
    const markerDist = 170;
    
    // Utara
    ctx.beginPath();
    ctx.arc(200, 200 - markerDist, dirMarkerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0000FF';
    ctx.fill();
    
    // Timur
    ctx.beginPath();
    ctx.arc(200 + markerDist, 200, dirMarkerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Selatan
    ctx.beginPath();
    ctx.arc(200, 200 + markerDist, dirMarkerRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Barat
    ctx.beginPath();
    ctx.arc(200 - markerDist, 200, dirMarkerRadius, 0, Math.PI * 2);
    ctx.fill();
}
