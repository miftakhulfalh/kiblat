// visualisasiKiblat.js yang diperbaiki
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

    // Gambar arah mata angin dengan huruf Indonesia (U, T, S, B)
    drawCompassDirections(ctx);
    
    // Label sudut azimuth
    drawAzimuthText(ctx, azimuthDeg);

    return canvas.toBuffer('image/png');
}

function drawCompassDirections(ctx) {
    // Warna untuk titik dan teks arah mata angin
    const markerRadius = 4;
    ctx.fillStyle = '#0000FF';
    
    // Posisi-posisi titik arah mata angin
    const directions = [
        { x: 200, y: 30, letter: 'U' },   // Utara (bukan N)
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
        
        // Gambar teks
        ctx.fillStyle = '#0000FF';
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Offset teks untuk memastikan tidak terlalu dekat dengan titik
        let textX = dir.x;
        let textY = dir.y;
        
        // Sesuaikan posisi teks berdasarkan arah
        if (dir.letter === 'U') textY -= 15;      // Utara: offset ke atas
        else if (dir.letter === 'T') textX += 15; // Timur: offset ke kanan
        else if (dir.letter === 'S') textY += 15; // Selatan: offset ke bawah
        else if (dir.letter === 'B') textX -= 15; // Barat: offset ke kiri
        
        ctx.fillText(dir.letter, textX, textY);
    });
}

function drawAzimuthText(ctx, azimuthDeg) {
    // Menggambar teks azimuth
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const text = `ARAH KIBLAT: ${Math.round(azimuthDeg)}°`;
    ctx.fillText(text, 200, 380);
}
