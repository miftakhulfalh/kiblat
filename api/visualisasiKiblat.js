// visualisasiKiblat.js
import { createCanvas, registerFont } from '@napi-rs/canvas';
import path from 'path';
import fs from 'fs';

export function generateQiblaVisualization(azimuthDeg) {
    // Coba register font jika ada
    try {
        // Cek apakah file font ada
        const fontPath = path.join(process.cwd(), 'fonts', 'arial.ttf');
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: 'Arial' });
            console.log('Font Arial berhasil diregistrasi');
        } else {
            console.log('File font tidak ditemukan di:', fontPath);
        }
    } catch (error) {
        console.error('Gagal meregistrasi font:', error);
    }

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

    // Gambar arah mata angin dengan metode alternatif
    drawCompassDirections(ctx);
    
    // Label sudut azimuth
    drawAzimuthText(ctx, azimuthDeg);

    return canvas.toBuffer('image/png');
}

function drawCompassDirections(ctx) {
    // Warna untuk titik dan teks arah mata angin
    const markerRadius = 4;
    const markerDist = 170;
    ctx.fillStyle = '#0000FF';
    
    // Posisi-posisi titik arah mata angin
    const directions = [
        { x: 200, y: 30, letter: 'U' },   // Utara
        { x: 370, y: 200, letter: 'T' },  // Timur
        { x: 200, y: 370, letter: 'S' },  // Selatan
        { x: 30, y: 200, letter: 'B' }    // Barat
    ];
    
    // Gambar titik biru untuk setiap arah
    directions.forEach(dir => {
        // Gambar titik
        ctx.beginPath();
        ctx.arc(dir.x, dir.y, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Gambar teks dengan metode kedua (langsung stroke teks)
        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#0000FF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Posisikan teks sedikit lebih jauh dari titik
        const textOffsetX = dir.x === 30 ? -12 : (dir.x === 370 ? 12 : 0);
        const textOffsetY = dir.y === 30 ? -12 : (dir.y === 370 ? 12 : 0);
        
        ctx.fillText(dir.letter, dir.x + textOffsetX, dir.y + textOffsetY);
    });
}

function drawAzimuthText(ctx, azimuthDeg) {
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Arah Kiblat: ${Math.round(azimuthDeg)}°`, 200, 380);
}
