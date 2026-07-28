import pandas as pd
import os

new_samples = [
    # SME / UMKM samples
    ("Saya butuh aplikasi kasir sederhana untuk warung bakso saya yang baru buka.", "SME", "Custom Software Development"),
    ("Bagaimana cara membuat katalog produk online untuk toko baju rumahan?", "SME", "Custom Software Development"),
    ("Usaha dagang kecil saya ingin punya website sendiri biar kelihatan profesional.", "SME", "Custom Software Development"),
    ("Apakah ada paket pembuatan website yang murah dan terjangkau untuk pemula?", "SME", "Custom Software Development"),
    ("Saya masih gaptek tentang internet, mau belajar cara jualan online dan kelola stok usaha.", "SME", "IT Strategy Consulting"),
    ("Butuh landing page sederhana untuk promosi kerajinan tangan UKM di Instagram.", "SME", "Custom Software Development"),
    ("Konsultasi budget hemat untuk usaha rintisan kuliner yang ingin pindah ke digital.", "SME", "IT Strategy Consulting"),
    ("Mau buat toko online sendiri tanpa ribet karena saya cuma sendiri kelola warung.", "SME", "Custom Software Development"),
    ("Bisa bikinin aplikasi kasir yang gampang dipakai untuk toko kelontong kecil?", "SME", "Custom Software Development"),
    ("Berapa biaya pembuatan web sederhana untuk usaha laundry kiloan saya?", "SME", "Custom Software Development"),
    ("Pengen konsul cara optimasi penjualan di marketplace dan website untuk bisnis kecil.", "SME", "IT Strategy Consulting"),
    ("Saya punya bengkel motor kecil, butuh aplikasi catat servis dan pembukuan harian.", "SME", "Custom Software Development"),
    ("Apakah bisa buatkan website profil toko furniture rumahan dengan harga bersahabat?", "SME", "Custom Software Development"),
    ("Usaha kecil saya sering kehilangan data catatan kertas, mau pindah ke sistem digital sederhana.", "SME", "Cloud Infrastructure & Migration"),
    ("Butuh bantuan setting email bisnis dan domain untuk toko online rintisan.", "SME", "Cloud Infrastructure & Migration"),
    ("Kami adalah komunitas pengrajin batik lokal yang butuh website promosi wisata dan produk.", "SME", "Custom Software Development"),
    ("Toko roti saya mau pasang sistem pesanan online lewat whatsapp dan website kecil.", "SME", "Custom Software Development"),
    ("Mau tanya jasa bikin web e-commerce sederhana dengan budget maksimal 5 juta.", "SME", "Custom Software Development"),
    ("Bagaimana cara mengamankan data pelanggan di website toko kecil saya agar tidak diretas?", "SME", "Cybersecurity Audit"),
    ("Saya pemula di bisnis kopi susu, butuh sistem POS yang simpel dan hemat.", "SME", "Custom Software Development"),
    ("Pelatihan dan pendampingan IT untuk pelaku UMKM daerah agar bisa go digital.", "SME", "IT Strategy Consulting"),
    ("Pembuatan website katalog murah untuk promosi produk camilan tradisional ukm.", "SME", "Custom Software Development"),
    ("Aplikasi pencatatan keuangan harian untuk pedagang pasar tradisional.", "SME", "Custom Software Development"),
    ("Kami dari koperasi ukm membutuhkan sistem informasi anggota yang sederhana.", "SME", "Custom Software Development"),
    ("Bisnis warung kopi saya mau upgrade punya sistem membership sederhana digital.", "SME", "Custom Software Development"),
    ("Konsultasi digital marketing dan pembuatan landing page promo diskon toko saya.", "SME", "IT Strategy Consulting"),
    ("Butuh pembenahan website ukm saya yang sering error saat dibuka dari hp.", "SME", "Custom Software Development"),
    ("Aplikasi inventaris barang ringan untuk gudang toko bangunan kecil.", "SME", "Custom Software Development"),
    ("Cara mudah simpan foto produk dan katalog usaha kecil ke cloud agar tidak penuh di hp.", "SME", "Cloud Infrastructure & Migration"),
    ("Jasa pembuatan web instan untuk toko bunga rumahan dengan desain menarik.", "SME", "Custom Software Development"),
    ("Saya baru merintis usaha katering, butuh website pemesanan menu harian simpel.", "SME", "Custom Software Development"),
    ("Apakah ada program khusus pengembangan teknologi untuk pelaku ukm dan wirausaha mikro?", "SME", "IT Strategy Consulting"),
    ("Sistem kasir berbasis tablet untuk warung makan lesehan keluarga.", "SME", "Custom Software Development"),
    ("Pembuatan aplikasi pengingat tagihan untuk toko pulsa dan kuota kecil.", "SME", "Custom Software Development"),
    ("Ingin migrasi data pembukuan excel toko ke sistem cloud murah dan mudah.", "SME", "Cloud Infrastructure & Migration"),
    ("Audit keamanan dasar untuk web toko online ukm supaya terhindar dari penipuan.", "SME", "Cybersecurity Audit"),
    ("Bagaimana cara membuat sistem reservasi meja sederhana untuk kedai kopi kecil?", "SME", "Custom Software Development"),
    ("Kami ukm produsen sepatu lokal butuh website profil dan toko resmi terintegrasi.", "SME", "Custom Software Development"),
    ("Jasa setting server cloud murah untuk website toko pakaian online saya.", "SME", "Cloud Infrastructure & Migration"),
    ("Bimbingan IT untuk bisnis rumahan supaya bisa bersaing dengan toko modern.", "SME", "IT Strategy Consulting"),
    
    # Corporate samples
    ("Perusahaan kami membutuhkan implementasi sistem SAP ERP untuk 500 karyawan di 10 cabang.", "Corporate", "Custom Software Development"),
    ("Permintaan pengiriman dokumen RFP (Request for Proposal) untuk pengembangan core banking system.", "Corporate", "Custom Software Development"),
    ("Kami mencari vendor IT bersertifikasi ISO 27001 untuk integrasi sistem Oracle dengan portal enterprise.", "Corporate", "Custom Software Development"),
    ("Butuh audit keamanan siber menyeluruh (penetration testing & vulnerability assessment) sesuai standar SLA korporasi.", "Corporate", "Cybersecurity Audit"),
    ("Migrasi infrastruktur data center berskala besar ke hybrid cloud AWS/Azure dengan zero downtime.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Konsultasi IT roadmap 5 tahun dan digital transformation strategy untuk perusahaan multinasional Tbk.", "Corporate", "IT Strategy Consulting"),
    ("Pengembangan aplikasi microservices berkinerja tinggi untuk memproses 1 juta transaksi harian korporasi.", "Corporate", "Custom Software Development"),
    ("Kami ingin melakukan perombakan total (revamp) sistem HRIS dan payroll untuk holding company.", "Corporate", "Custom Software Development"),
    ("Permintaan tender proyek pengadaan dan maintenance infrastruktur jaringan enterprise skala nasional.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Audit kepatuhan regulasi keamanan informasi perusahaan keuangan dan perbankan sebelum evaluasi OJK.", "Corporate", "Cybersecurity Audit"),
    ("Implementasi Enterprise Resource Planning untuk otomatisasi supply chain dan logistik pabrik manufaktur.", "Corporate", "Custom Software Development"),
    ("Kami memerlukan tim dedikasi (dedicated engineering team) sebanyak 20 developer untuk proyek jangka panjang korporat.", "Corporate", "Custom Software Development"),
    ("Perusahaan ingin menerapkan arsitektur cloud native dan Kubernetes untuk scaling otomatis layanan e-commerce.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Analisis ROI dan feasibilitas teknologi sebelum adopsi sistem AI dan Big Data di lingkungan korporat.", "Corporate", "IT Strategy Consulting"),
    ("Pengembangan portal kemitraan B2B terintegrasi dengan API gateway dan standar keamanan OAuth2 enterprise.", "Corporate", "Custom Software Development"),
    ("Assessment kesiapan Disaster Recovery Plan (DRP) dan Business Continuity Management (BCM) korporasi.", "Corporate", "Cybersecurity Audit"),
    ("Integrasi sistem CRM Salesforce dengan database internal perusahaan ritel dengan 200 outlet.", "Corporate", "Custom Software Development"),
    ("Implementasi solusi SIEM (Security Information and Event Management) 24/7 untuk SOC perusahaan.", "Corporate", "Cybersecurity Audit"),
    ("Konsultasi re-engineering proses bisnis operasional pertambangan menggunakan IoT dan automasi cloud.", "Corporate", "IT Strategy Consulting"),
    ("Kami dari grup konglomerasi ingin mengundang tim Sagara untuk presentasi solusi enterprise digital portal.", "Corporate", "IT Strategy Consulting"),
    ("Pengembangan sistem manajemen aset korporat terpusat berstandar internasional dengan audit trail.", "Corporate", "Custom Software Development"),
    ("Migrasi database terdistribusi antar benua untuk mendukung ekspansi pasar global perusahaan kami.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Evaluasi kerentanan aplikasi web dan mobile korporat melalui red teaming dan blue teaming simulation.", "Corporate", "Cybersecurity Audit"),
    ("Konsultasi arsitektur Enterprise Architecture (TOGAF) untuk penyelarasan strategi IT dan bisnis korporat.", "Corporate", "IT Strategy Consulting"),
    ("Pembangunan platform analitik data dashboard eksekutif untuk board of directors perusahaan Tbk.", "Corporate", "Custom Software Development"),
    ("Pengadaan lisensi enterprise dan integrasi Microsoft 365 serta SharePoint untuk 1500 staf kantor pusat.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Optimalisasi kinerja dan reduksi latensi server cloud korporasi dengan penerapan CDN global.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Kajian teknis dan pengujian beban (load testing) sistem transaksi saham sebelum initial public offering (IPO).", "Corporate", "Cybersecurity Audit"),
    ("Pengembangan sistem otomasi alur kerja approval direksi berbasis web dengan digital signature standar korporat.", "Corporate", "Custom Software Development"),
    ("Kami butuh SLA jaminan uptime 99.99% untuk pemeliharaan infrastruktur cloud kritikal perusahaan.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Penerapan Zero Trust Network Access (ZTNA) untuk pengamanan akses karyawan remote holding company.", "Corporate", "Cybersecurity Audit"),
    ("Konsultasi strategi tata kelola IT (COBIT) dan manajemen risiko teknologi informasi korporasi.", "Corporate", "IT Strategy Consulting"),
    ("Pengembangan sistem portal komunikasi internal (intranet) enterprise dengan fitur kolaborasi dokumen.", "Corporate", "Custom Software Development"),
    ("Automasi pelaporan keuangan konsolidasi antar anak perusahaan dalam satu platform ERP terpadu.", "Corporate", "Custom Software Development"),
    ("Audit forensik digital dan analisis insiden siber pasca serangan ransomware pada jaringan korporat.", "Corporate", "Cybersecurity Audit"),
    ("Penyusunan blueprint transformasi digital untuk divisi ritel dan distribusi berskala nasional.", "Corporate", "IT Strategy Consulting"),
    ("Penyediaan dedicated cloud private cluster dengan tingkat isolasi data maksimum untuk industri asuransi.", "Corporate", "Cloud Infrastructure & Migration"),
    ("Pengembangan aplikasi manajemen armada logistik korporasi terintegrasi GPS tracking real-time.", "Corporate", "Custom Software Development"),
    ("Konsultasi pembentukan pusat unggulan teknologi (Center of Excellence) di internal korporasi besar.", "Corporate", "IT Strategy Consulting"),
    ("Optimasi pipeline CI/CD dan penerapan praktik DevSecOps dalam siklus pengembangan software korporat.", "Corporate", "Cloud Infrastructure & Migration"),

    # Government samples
    ("Kami dari Dinas Kominfo Provinsi membutuhkan pengembangan aplikasi pelayanan publik terintegrasi SPBE.", "Government", "Government Solutions"),
    ("Pengadaan sistem informasi manajemen keuangan daerah (SIMDA) sesuai regulasi Kementerian Dalam Negeri.", "Government", "Government Solutions"),
    ("Kajian dan implementasi arsitektur Sistem Pemerintahan Berbasis Elektronik (SPBE) untuk Pemerintah Kabupaten.", "Government", "Government Solutions"),
    ("Audit keamanan siber aplikasi layanan masyarakat berdasarkan standar dan rekomendasi BSSN.", "Government", "Cybersecurity Audit"),
    ("Pengembangan portal transparansi anggaran APBN/APBD dan pemantauan proyek pembangunan daerah.", "Government", "Government Solutions"),
    ("Konsultasi teknis dan pendampingan migrasi pusat data nasional instansi pemerintah ke Cloud Pemerintahan.", "Government", "Cloud Infrastructure & Migration"),
    ("Pembuatan dashboard executive summary untuk Gubernur dan Bupati dalam monitoring inflasi dan pangan.", "Government", "Government Solutions"),
    ("Pengembangan aplikasi kependudukan dan pencatatan sipil tingkat kelurahan dan kecamatan secara digital.", "Government", "Government Solutions"),
    ("Kami dari Badan Pusat Statistik daerah membutuhkan sistem pengolahan dan visualisasi data sensus.", "Government", "Government Solutions"),
    ("Sistem pendaftaran dan perizinan online terpadu satu pintu (PTSP) untuk dinas penanaman modal daerah.", "Government", "Government Solutions"),
    ("Penerapan standar perlindungan data pribadi sesuai PP 71 dan UU PDP pada sistem informasi kementerian.", "Government", "Cybersecurity Audit"),
    ("Pengembangan aplikasi pemantauan penyaluran bantuan sosial (Bansos) agar tepat sasaran dan transparan.", "Government", "Government Solutions"),
    ("Penyusunan Rencana Kerja dan Anggaran (RKA) IT serta blueprint transformasi digital dinas pendidikan provinsi.", "Government", "IT Strategy Consulting"),
    ("Sistem informasi manajemen kepegawaian (SIMPEG) untuk pemantauan kinerja ASN dan PNS di lingkungan pemda.", "Government", "Government Solutions"),
    ("Pengembangan platform Smart Village dan digitalisasi layanan administrasi desa binaan pemerintah daerah.", "Government", "Government Solutions"),
    ("Audit kerentanan situs web dinas pemerintahan daerah pasca insiden peretasan judi online.", "Government", "Cybersecurity Audit"),
    ("Pengadaan jasa konsultasi pengawasan dan manajemen proyek pembangunan infrastruktur jaringan Command Center.", "Government", "IT Strategy Consulting"),
    ("Sistem manajemen persediaan obat dan rekam medis digital terpadu untuk Puskesmas dan RSUD Kabupaten.", "Government", "Government Solutions"),
    ("Pengembangan aplikasi pelaporan pengaduan masyarakat berbasis mobile android dan iOS untuk dinas sosial.", "Government", "Government Solutions"),
    ("Konsultasi dan assessment kesiapan kota pintar (Smart City Masterplan) untuk kota madya.", "Government", "IT Strategy Consulting"),
    ("Integrasi data antar organisasi perangkat daerah (OPD) menggunakan government service bus nasional.", "Government", "Government Solutions"),
    ("Migrasi server aplikasi perpajakan daerah (E-Samsat & PBB) ke infrastruktur cloud berkeamanan tinggi.", "Government", "Cloud Infrastructure & Migration"),
    ("Pengembangan sistem informasi pemantauan kualitas udara dan lingkungan hidup untuk Dinas Lingkungan Hidup.", "Government", "Government Solutions"),
    ("Penyediaan sistem informasi pengadaan barang dan jasa secara elektronik (LPSE) tingkat instansi.", "Government", "Government Solutions"),
    ("Pengujian penetrasi eksternal (pen-test) pada portal resmi pemerintah provinsi sebelum launching publik.", "Government", "Cybersecurity Audit"),
    ("Pengembangan sistem monitoring retribusi pasar tradisional dan parkir untuk peningkatan PAD dinas.", "Government", "Government Solutions"),
    ("Konsultasi tata kelola teknologi informasi pemerintahan daerah sesuai pedoman dari Kementerian PANRB.", "Government", "IT Strategy Consulting"),
    ("Aplikasi pemetaan batas wilayah dan tata ruang daerah berbasis GIS (Geographic Information System) untuk Bappeda.", "Government", "Government Solutions"),
    ("Sistem informasi manajemen penanggulangan bencana dan peringatan dini Badan Penanggulangan Bencana Daerah (BPBD).", "Government", "Government Solutions"),
    ("Penyusunan pedoman keamanan informasi dan ISO 27001 untuk lingkungan kementerian lembaga negara.", "Government", "Cybersecurity Audit"),
    ("Pengembangan portal informasi pariwisata daerah dan direktori budaya untuk Dinas Pariwisata dan Kebudayaan.", "Government", "Government Solutions"),
    ("Sistem perpustakaan digital terpadu dan arsip elektronik untuk Dinas Perpustakaan dan Kearsipan Daerah.", "Government", "Government Solutions"),
    ("Optimalisasi jaringan fiber optik antar gedung dinas dalam satu kompleks perkantoran pemerintah kota.", "Government", "Cloud Infrastructure & Migration"),
    ("Konsultasi perancangan pusat pemulihan bencana (Disaster Recovery Center) untuk data kependudukan nasional.", "Government", "IT Strategy Consulting"),
    ("Pengembangan sistem pendataan pertanian dan subsidi pupuk untuk Dinas Pertanian Kabupaten.", "Government", "Government Solutions"),
    ("Aplikasi manajemen lalu lintas kota dan pemantauan CCTV terpadu untuk Dinas Perhubungan.", "Government", "Government Solutions"),
    ("Audit kepatuhan arsitektur keamanan jaringan command center kepolisian dan instansi keamanan publik.", "Government", "Cybersecurity Audit"),
    ("Pengembangan sistem pendataan atlet dan fasilitas olahraga untuk Dinas Pemuda dan Olahraga daerah.", "Government", "Government Solutions"),
    ("Pelatihan peningkatkan kapasitas literasi digital dan keamanan siber bagi aparatur sipil negara (ASN).", "Government", "IT Strategy Consulting"),
    ("Sistem informasi ketersediaan tempat tidur dan antrian online terpadu seluruh RSUD di wilayah provinsi.", "Government", "Government Solutions")
]

def append_new_data():
    csv_path = os.path.join('data', 'dataset.csv')
    df_existing = pd.read_csv(csv_path)
    
    df_new = pd.DataFrame(new_samples, columns=['text', 'label', 'service'])
    
    # Check if existing already contains these text samples to avoid duplicate running
    existing_texts = set(df_existing['text'].str.strip())
    df_new_filtered = df_new[~df_new['text'].str.strip().isin(existing_texts)]
    
    df_combined = pd.concat([df_existing, df_new_filtered], ignore_index=True)
    df_combined.to_csv(csv_path, index=False)
    print(f"Added {len(df_new_filtered)} new high-quality samples. Total dataset size is now {len(df_combined)} samples.")
    print(df_combined['label'].value_counts())

if __name__ == '__main__':
    append_new_data()
