// visualisasiKiblat.js
import canvas from '@napi-rs/canvas';
const { createCanvas, registerFont } = canvas;

registerFont('./fonts/arial.ttf', { family: 'Arial' });

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

    // Label arah mata angin
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px "Arial", sans-serif'; // Gunakan fallback font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const directions = ['Utara', 'Timur', 'Selatan', 'Barat'];
    directions.forEach((label, i) => {
        const angle = (i * Math.PI/2) - Math.PI/2; // Sudut untuk 4 arah
        const x = 200 + Math.cos(angle) * 160; // Radius diperkecil
        const y = 200 + Math.sin(angle) * 160;
        
        // Tambah rotasi teks sesuai arah
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI/2); // Rotasi teks menghadap keluar
        ctx.fillText(label, 0, 0);
        ctx.restore();
    });

    return canvas.toBuffer('image/png');
}
