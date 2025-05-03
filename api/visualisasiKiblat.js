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

    // Garis arah kiblat/azimuth
    const radians = (azimuthDeg - 90) * Math.PI / 180; // Sesuaikan sudut untuk sistem koordinat canvas
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(
        200 + Math.cos(radians) * 140,
        200 + Math.sin(radians) * 140
    );
    ctx.stroke();

    // Label arah
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ['Utara', 'Timur', 'Selatan', 'Barat'].forEach((label, i) => {
        const angle = (i * Math.PI/2) - Math.PI/2;
        ctx.fillText(
            label,
            200 + Math.cos(angle) * 170,
            200 + Math.sin(angle) * 170 + 7
        );
    });

    return canvas.toBuffer('image/png');
}
