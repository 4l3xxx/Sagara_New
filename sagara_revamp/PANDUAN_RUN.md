# 🚀 Panduan Deployment Sagara Revamp (VPS Production)

Dokumen ini berisi panduan lengkap untuk melakukan deploy sistem Sagara Revamp ke Virtual Private Server (VPS) produksi (seperti DigitalOcean, AWS, Linode, atau VPS Linux lainnya).

Sistem ini dirancang 100% menggunakan **Docker** sehingga *environment* akan seragam dan terisolasi dari sistem utama VPS.

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
Masuk ke terminal VPS (via SSH), dan *clone* repository ini:

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

## 🚀 Langkah 2: Menjalankan Aplikasi (Deployment)

Untuk lingkungan Production, kita akan menggunakan file konfigurasi khusus (`docker-compose.prod.yml`). 
File ini telah dimodifikasi agar **Node.js berjalan di Port 80** (Port standar internet), sehingga web Anda bisa langsung diakses tanpa mengetik `:3000`. Selain itu, kebijakan `restart: always` sudah diterapkan agar server otomatis hidup ulang ketika VPS di-restart.

Jalankan perintah ini untuk melakukan Build dan Run secara *background* (Detached Mode):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Docker akan mengunduh dan membangun (*build*) *image* PostgreSQL, Python NLP, dan Node.js. Tunggu beberapa menit hingga proses selesai.

---

## 🌍 Langkah 3: Pengujian Akses Web

Setelah semua kontainer menyala, Anda bisa langsung mengakses aplikasi Anda:

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
