# Panduan Deploy Warung Techno

Proyek ini telah dipisahkan menjadi file-file modular:
1. `index.html` - Tampilan toko online & panel admin.
2. `style.css` - Lembar gaya CSS custom (scrollbar, glassmorphism, animasi).
3. `script.js` - Logika interaktif, checkout WA cepat, manajemen produk, stok & sinkronisasi data.
4. `api.php` - Backend endpoint untuk cPanel yang menyimpan perubahan langsung ke `data.json`.
5. `data.json` - Basis data awal (produk, kategori, setting, pesanan, password admin).
6. `.htaccess` - Konfigurasi server Apache / cPanel.
7. `vercel.json` - Konfigurasi hosting Vercel.

---

## 1. Panduan Upload ke cPanel
1. Masuk ke **cPanel** akun hosting Anda.
2. Buka menu **File Manager**, lalu masuk ke folder **`public_html`** (atau folder subdomain Anda).
3. Klik tombol **Upload**, pilih file **`warung-techno.zip`**.
4. Setelah proses upload selesai, klik kanan file `warung-techno.zip` dan pilih **Extract**.
5. Pastikan izin akses (permission) file `data.json` disetel ke **644** atau **666** agar PHP dapat menyimpan perubahan data dari panel admin.
6. Selesai! Buka domain Anda di browser.

---

## 2. Panduan Deploy ke Vercel
1. Upload folder proyek ini ke repositori **GitHub** Anda (misalnya `warung-techno`).
2. Masuk ke [vercel.com](https://vercel.com) dan hubungkan akun GitHub Anda.
3. Klik **Add New Project**, lalu pilih repositori tersebut.
4. Pada Framework Preset pilih **Other**, lalu klik tombol **Deploy**.
5. Website langsung aktif dalam beberapa detik. Di Vercel, semua perubahan data toko disimpan menggunakan browser `localStorage` dan langsung berfungsi penuh!

---

## 3. Panduan Deploy ke GitHub Pages
1. Buat repositori baru di GitHub (misal: `warung-techno`).
2. Upload semua file (`index.html`, `style.css`, `script.js`, `data.json`).
3. Buka menu **Settings** > **Pages** di repositori GitHub Anda.
4. Pada bagian **Branch**, pilih `main` (atau `master`) dan folder `/ (root)`, lalu klik **Save**.
5. Tunggu sekitar 1 menit hingga tautan GitHub Pages aktif.

---

## Informasi Admin Default
- **Password Default Admin**: `admin123`
- Anda dapat mengubah password ini kapan saja melalui menu **Panel Web > Password Admin**.
