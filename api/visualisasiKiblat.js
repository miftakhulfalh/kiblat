// visualisasiKiblat.js
import pkg from '@napi-rs/canvas';
const { createCanvas } = pkg;
import path from 'path';
import fs from 'fs';

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

    // Gambar arah mata angin dengan metode alternatif
    drawCompassDirections(ctx);
    
    // Label sudut azimuth
    drawAzimuthText(ctx, azimuthDeg);

    return canvas.toBuffer('image/png');
}

function drawCompassDirections(ctx) {
    // Warna untuk titik dan teks arah mata angin
    const markerRadius = 4;
    ctx.fillStyle = '#0000FF';
    
    // Posisi-posisi titik arah mata angin (dalam Bahasa Inggris)
    const directions = [
        { x: 200, y: 30, letter: 'N' },   // North (Utara)
        { x: 370, y: 200, letter: 'E' },  // East (Timur)
        { x: 200, y: 370, letter: 'S' },  // South (Selatan)
        { x: 30, y: 200, letter: 'W' }    // West (Barat)
    ];
    
    // Gambar titik biru untuk setiap arah
    directions.forEach(dir => {
        // Gambar titik
        ctx.beginPath();
        ctx.arc(dir.x, dir.y, markerRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Metode alternatif untuk menggambar teks tanpa bergantung pada font spesifik
        drawTextManually(ctx, dir.letter, dir.x, dir.y);
    });
}

function drawTextManually(ctx, letter, x, y) {
    // Buat teks dengan garis (line drawing) agar tidak bergantung pada font
    ctx.strokeStyle = '#0000FF';
    ctx.lineWidth = 2;
    
    // Offset untuk menempatkan teks di luar titik
    const offsetX = (x === 30) ? -15 : ((x === 370) ? 15 : 0);
    const offsetY = (y === 30) ? -15 : ((y === 370) ? 15 : 0);
    
    // Posisi teks yang sudah di-offset
    const textX = x + offsetX;
    const textY = y + offsetY;
    
    // Gambar huruf berdasarkan kasus
    switch(letter) {
        case 'U': // Sekarang diganti untuk huruf U
            // Garis vertikal kiri
            ctx.beginPath();
            ctx.moveTo(textX - 5, textY - 8);
            ctx.lineTo(textX - 5, textY + 5);
            ctx.stroke();
        
            // Garis vertikal kanan
            ctx.beginPath();
            ctx.moveTo(textX + 5, textY - 8);
            ctx.lineTo(textX + 5, textY + 5);
            ctx.stroke();
        
            // Garis bawah penghubung
            ctx.beginPath();
            ctx.moveTo(textX - 5, textY + 5);
            ctx.lineTo(textX + 5, textY + 5);
            ctx.stroke();
            break;

            
        case 'T': // Sekarang diganti untuk huruf T
            // Garis horizontal atas
            ctx.beginPath();
            ctx.moveTo(textX - 5, textY - 8);
            ctx.lineTo(textX + 5, textY - 8);
            ctx.stroke();
        
            // Garis vertikal tengah
            ctx.beginPath();
            ctx.moveTo(textX, textY - 8);
            ctx.lineTo(textX, textY + 8);
            ctx.stroke();
            break;

            
        case 'S': // SOUTH (SELATAN)
            // Kurva S
            ctx.beginPath();
            ctx.moveTo(textX + 5, textY - 8);
            ctx.lineTo(textX - 3, textY - 8);
            ctx.lineTo(textX - 5, textY - 4);
            ctx.lineTo(textX - 3, textY);
            ctx.lineTo(textX + 5, textY);
            ctx.lineTo(textX + 7, textY + 4);
            ctx.lineTo(textX + 5, textY + 8);
            ctx.lineTo(textX - 5, textY + 8);
            ctx.stroke();
            break;
            
        case 'B': // BARAT
            // Garis vertikal kiri
            ctx.beginPath();
            ctx.moveTo(textX - 4, textY - 8);
            ctx.lineTo(textX - 4, textY + 8);
            ctx.stroke();
            
            // Lengkungan atas
            ctx.beginPath();
            ctx.moveTo(textX - 4, textY - 8);
            ctx.lineTo(textX + 3, textY - 8);
            ctx.lineTo(textX + 5, textY - 6);
            ctx.lineTo(textX + 5, textY - 2);
            ctx.lineTo(textX + 3, textY);
            ctx.lineTo(textX - 4, textY);
            ctx.stroke();
            
            // Lengkungan bawah
            ctx.beginPath();
            ctx.moveTo(textX - 4, textY);
            ctx.lineTo(textX + 3, textY);
            ctx.lineTo(textX + 5, textY + 2);
            ctx.lineTo(textX + 5, textY + 6);
            ctx.lineTo(textX + 3, textY + 8);
            ctx.lineTo(textX - 4, textY + 8);
            ctx.stroke();
            break;



    }
}

function drawAzimuthText(ctx, azimuthDeg) {
    // Menggambar teks azimuth secara manual
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    
    const text = `ARAH KIBLAT: ${Math.round(azimuthDeg)}°`;
    const x = 200;
    const y = 380;
    
    // Menggunakan fillText sebagai alternatif jika registerFont tidak berhasil
    ctx.fillStyle = '#000000';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
}
