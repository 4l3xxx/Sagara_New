# 🚀 Panduan Deployment Sagara Revamp (VPS Production)

Dokumen ini berisi panduan lengkap untuk menjalankan sistem Sagara Revamp, baik untuk tahap pengembangan di **Local/Komputer Sendiri** maupun *deploy* ke **Virtual Private Server (VPS)** produksi (seperti DigitalOcean, AWS, dll).

Sistem ini dirancang 100% menggunakan **Docker** sehingga *environment* akan seragam dan terisolasi.

## 📋 Prasyarat Server (VPS)
Pastikan VPS Anda (disarankan berbasis **Ubuntu 20.04 / 22.04**) sudah terinstal perangkat lunak berikut:
1. **Docker Engine**
2. **Docker Compose**
3. **Git** (Untuk mem-pull source code)

*(Jika Anda belum menginstal Docker, jalankan perintah ini di VPS:)*
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

---

## ⚙️ Langkah 1: Persiapan Repository & .env
Jika di VPS, masuk via SSH lalu *clone* repositori. Jika di lokal, buka terminal Anda:

```bash
git clone <URL_REPOSITORY_ANDA>
cd sagara_revamp
```

Buat file `.env` di dalam folder `sagara_revamp`:
```bash
nano .env
```
Isi dengan konfigurasi rahasia Anda (Pastikan password DB diganti untuk keamanan):
```env
GROQ_API_KEY=gsk_masukkan_api_key_disini_milik_anda

ADMIN_1_USER=samuel
# Password bcrypt hash yang dibungkus dengan kutip tunggal ('')
ADMIN_1_PASS='$2b$10$g8C53ttQKIXE/O85x5l9MusmBPpkenTipvSPzjBIWsKdhinZV/LDq'
```
*Gunakan `CTRL+X`, lalu tekan `Y` dan `Enter` untuk menyimpan (nano).*

---

## 🚀 Langkah 2: Menjalankan Aplikasi

Anda memiliki dua opsi untuk menjalankan aplikasi, tergantung lingkungannya:

### Opsi A: Menjalankan di Lokal (Local Terminal)
Gunakan perintah ini jika Anda sedang mengembangkan atau mengetes aplikasi di komputer sendiri (PC/Laptop). File ini akan menggunakan port `3000`.

```bash
docker-compose up -d --build
```

### Opsi B: Menjalankan di VPS (Production)
Untuk Production, gunakan file konfigurasi khusus (`docker-compose.prod.yml`). File ini mem-binding **Node.js ke Port 80** (Port standar internet), sehingga web Anda bisa langsung diakses tanpa mengetik `:3000`.

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Docker akan mengunduh dan membangun (*build*) *image* PostgreSQL, Python NLP, dan Node.js. Tunggu beberapa menit hingga selesai.

---

## 🌍 Langkah 3: Pengujian Akses Web

Setelah semua kontainer menyala, Anda bisa langsung mengakses aplikasi Anda:

**Bila di Lokal (PC/Laptop):**
- **Halaman Utama Publik:** `http://localhost:3000/`
- **Dashboard Admin:** `http://localhost:3000/admin/login`

**Bila di VPS Production:**
- **Halaman Utama Publik:** `http://<ALAMAT_IP_VPS_ANDA>/`
- **Dashboard Admin:** `http://<ALAMAT_IP_VPS_ANDA>/admin/login`

**Catatan Login Admin Default:**
- **Username:** `samuel`
- **Password:** `samuel123`

---

## 🛠️ Manajemen & Maintenance VPS

Berikut adalah beberapa perintah penting untuk merawat server Sagara Revamp Anda:

**1. Melihat Status Kontainer:**
```bash
docker compose -f docker-compose.prod.yml ps
```

**2. Melihat Log Error (Real-time):**
```bash
docker compose -f docker-compose.prod.yml logs -f
```

**3. Mematikan Seluruh Sistem:**
```bash
docker compose -f docker-compose.prod.yml down
```

**4. Update Kode Baru (Bila ada perubahan dari Git):**
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

**5. Membersihkan Data & Image Lama (Meringankan Storage VPS):**
```bash
docker system prune -f
```
