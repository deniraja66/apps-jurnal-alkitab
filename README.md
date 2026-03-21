<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://cdn.phototourl.com/uploads/2026-03-21-78a33fb6-9e38-4523-b06f-82a6ea41d0a5.png" />
</div>

# ✝️ Bible Journal Anak - Petualangan Iman Digital

Bible Journal Anak adalah aplikasi pendamping interaktif yang dirancang khusus untuk anak-anak agar dapat bertumbuh dalam iman melalui pembacaan Alkitab harian dan jurnal S.O.A.P yang menyenangkan.

## 🖥️ Fitur Utama

- **📖 Petualangan 365 Hari**: Rencana pembacaan Alkitab yang terstruktur untuk satu tahun penuh.
- **📝 Jurnal S.O.A.P**: Metode refleksi yang mudah (Scripture, Observation, Application, Prayer) untuk membantu anak merenungkan Firman Tuhan.
- **🎨 Magic Avatar Creator**: Gunakan kekuatan AI (Gemini) untuk membuat karakter petualangan unik pilihanmu sendiri!
- **🏆 Sistem Rewards & Badges**: Dapatkan XP dan koleksi lencana keren setiap kali menyelesaikan pembacaan harian.
- **📊 Progress Tracker**: Pantau seberapa jauh perjalanan imanmu dengan dashboard yang interaktif.

## 🤖 Integrasi AI

Aplikasi ini menggunakan teknologi AI canggih dari **Google Gemini** untuk:
1. **Penciptaan Avatar**: Menghasilkan gambar hewan atau karakter unik dari deskripsi teks.
2. **Ekstraksi Metadata (Upcoming)**: Secara otomatis mengekstrak tema, ayat kunci, dan ringkasan dari catatan jurnal anak untuk membantu pengorganisasian otomatis.

## 🛠️ Cara Menjalankan

**Prasyarat:** Node.js (v18 ke atas)

1. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi API Key:**
   - Buat file `.env.local` di folder root.
   - Tambahkan line berikut: `VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY`

3. **Jalan Aplikasi:**
   ```bash
   npm run dev
   ```

## 📂 Struktur Proyek

- `src/App.tsx`: Pusat logika aplikasi dan antarmuka pengguna.
- `src/data/readingPlan.ts`: Database rencana pembacaan 365 hari.
- `src/constants.ts`: Daftar lencana, hadiah, dan avatar default.
- `src/types.ts`: Definisi tipe data untuk keamanan kode.

---
Dikembangkan dengan ❤️ untuk masa depan generasi yang mencintai Firman Tuhan.
