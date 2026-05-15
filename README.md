# ⛅ Weather Dashboard

Aplikasi web cuaca real-time yang menampilkan informasi cuaca dari berbagai kota di seluruh dunia. Dibangun menggunakan **Vanilla JavaScript**, **HTML5**, dan **CSS3** dengan data dari [WeatherAPI.com](https://www.weatherapi.com).

---

## ✨ Fitur

- 🌍 **Multi-kota** — tambah dan pantau beberapa kota sekaligus dalam satu dashboard
- 🕐 **Jam real-time** — jam setiap kota bergerak sesuai zona waktu lokal kota tersebut
- ➕ **Tambah kota** — cari kota manapun di dunia lewat input pencarian
- 🗑️ **Hapus kota** — hapus kota dari dashboard dengan animasi keluar yang halus
- 💾 **Penyimpanan otomatis** — daftar kota tersimpan di `localStorage`, tetap ada saat halaman di-refresh atau browser ditutup
- 🔄 **Auto-refresh data** — data cuaca diperbarui otomatis setiap 5 menit di background
- 💀 **Loading skeleton** — animasi placeholder saat data sedang dimuat
- ❌ **Error handling** — notifikasi toast jika kota tidak ditemukan atau koneksi bermasalah
- 📱 **Responsive** — tampilan menyesuaikan di desktop maupun mobile

---

---

## 🚀 Cara Menjalankan

### 1. Clone repositori

```bash
git clone https://github.com/username/weather-dashboard.git
cd weather-dashboard
```

### 2. Dapatkan API Key gratis

1. Buka [https://www.weatherapi.com](https://www.weatherapi.com)
2. Daftar akun gratis
3. Salin **API Key** dari dashboard

### 3. Masukkan API Key

Buka file `script.js`, lalu ganti nilai `YOUR_API_KEY` di baris paling atas:

```js
const API_KEY = 'YOUR_API_KEY'; // ← ganti ini
```

### 4. Buka di browser

Buka file `index.html` langsung di browser, atau gunakan ekstensi **Live Server** di VS Code untuk pengalaman terbaik.

---

