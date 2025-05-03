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

    // Garis kiblat
    const radians = (azimuthDeg - 90) * Math.PI / 180;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(200 + Math.cos(radians) * 140, 200 + Math.sin(radians) * 140);
    ctx.stroke();

    // Label arah mata angin (tanpa rotasi)
    ctx.fillStyle = '#000000';
    ctx.font = '18px sans-serif'; // Gunakan font generik
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Posisi teks manual untuk 4 arah
    const directions = [
        { label: 'Utara', x: 200, y: 40 },   // Atas
        { label: 'Timur', x: 360, y: 200 },  // Kanan
        { label: 'Selatan', x: 200, y: 360 }, // Bawah
        { label: 'Barat', x: 40, y: 200 }    // Kiri
    ];
    
    directions.forEach(dir => {
        ctx.fillText(dir.label, dir.x, dir.y);
    });

    return canvas.toBuffer('image/png');
}
