# Kiblat Bot

**Kiblat Bot** adalah bot Telegram yang dirancang untuk membantu pengguna menentukan arah kiblat berdasarkan lokasi mereka. Bot ini dapat menghitung arah kiblat dari koordinat geografis dan menampilkan informasi arah dalam format azimuth serta penyimpangan dari arah mata angin utama.

🔗 Demo: [ArahKiblat_bot](https://t.me/ArahKiblat_bot)

---

## ✨ Fitur

- Menghitung arah kiblat berdasarkan lokasi pengguna saat ini.
- Mendukung input koordinat dalam format desimal dan DMS (Derajat, Menit, Detik).
- Menampilkan informasi lokasi (kota, provinsi).
- Menyediakan arah kiblat dalam format azimuth dan relatif terhadap arah mata angin.
- Menunjukkan penyimpangan/kecondongan dari arah mata angin utama.
- Notifikasi otomatis rashdul kiblat global. 

---

## 🚀 Teknologi yang Digunakan

- **Node.js** (versi 18 atau lebih baru)
- **Telegraf** - Framework untuk membangun bot Telegram.
- **Google Spreadsheet API** - Untuk menyimpan dan mengelola data.
- **OpenCage Geocoding API** - Untuk konversi koordinat ke nama lokasi.
- **node-schedule** - Untuk penjadwalan tugas.
- **@napi-rs/canvas** - Untuk pembuatan grafik arah kiblat.
- **node-fetch** - Untuk melakukan permintaan HTTP.

---

