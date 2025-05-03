import { createCanvas } from '@napi-rs/canvas';

export function generateQiblaVisualization(azimuthDeg) {
    const canvas = createCanvas(400, 460); // Tambahkan tinggi untuk keterangan
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 400, 460);

    // Lingkaran kompas
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(200, 200, 150, 0, Math.PI * 2);
    ctx.stroke();

    // Garis arah kiblat
    const radians = (azimuthDeg - 90) * Math.PI / 180;
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(200, 200);
    ctx.lineTo(
        200 + Math.cos(radians) * 140,
        200 + Math.sin(radians) * 140
    );
    ctx.stroke();

    // Label arah mata angin
    ctx.fillStyle = '#000000';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    const directions = ['Utara', 'Timur', 'Selatan', 'Barat'];
    directions.forEach((label, i) => {
        const angle = (i * Math.PI / 2) - Math.PI / 2;
        ctx.fillText(
            label,
            200 + Math.cos(angle) * 170,
            200 + Math.sin(angle) * 170 + 6
        );
    });

    // Garis merah mini (legenda) di bawah
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(130, 430);
    ctx.lineTo(170, 430);
    ctx.stroke();

    // Teks "Arah Kiblat Anda"
    ctx.fillStyle = '#000000';
    ctx.font = '16px sans-serif'; // Pastikan font dikenali
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Arah Kiblat Anda', 180, 430);

    return canvas.toBuffer('image/png');
}
