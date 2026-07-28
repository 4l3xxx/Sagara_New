import pandas as pd
import os

new_data = [
    # UMKM
    {"text": "Mbak, saya mau bikin aplikasi kasir buat warung makan saya biar pesanan nggak berantakan.", "service": "Custom Software Development", "label": "SME"},
    {"text": "Bisa tolong buatkan toko online murah untuk jualan baju rintisan saya?", "service": "Web Development", "label": "SME"},
    {"text": "Saya pemilik bengkel dan butuh sistem kecil untuk mencatat pelanggan yang masuk tiap hari.", "service": "Custom Software Development", "label": "SME"},
    {"text": "Tolong bikinkan sistem POS kasir yang murah untuk usaha kecil mikro milik keluarga saya.", "service": "IT Strategy Consulting", "label": "SME"},
    {"text": "Saya punya usaha jualan online kecil-kecilan, butuh web.", "service": "Web Development", "label": "SME"},
    
    # GOVERNMENT
    {"text": "Instansi kami membutuhkan portal layanan publik yang transparan untuk melayani keluhan masyarakat.", "service": "Government Solutions", "label": "Government"},
    {"text": "Apakah tim Anda bisa mengikuti prosedur lelang pengadaan barang dan jasa dari pemerintah daerah?", "service": "Government Solutions", "label": "Government"},
    {"text": "Kami dari kementerian ingin menstandarisasi tata kota dengan aplikasi pemantau yang terintegrasi secara nasional.", "service": "Government Solutions", "label": "Government"},
    {"text": "Puskesmas dan kelurahan di wilayah kami butuh aplikasi pendataan warga terpusat.", "service": "Custom Software Development", "label": "Government"},
    {"text": "Dinas kependudukan kami butuh aplikasi administrasi birokrasi yang baru.", "service": "Government Solutions", "label": "Government"},
    
    # CORPORATE
    {"text": "Perusahaan kami sedang mencari vendor IT untuk re-platforming sistem logistik lintas 50 cabang.", "service": "Cloud Infrastructure & Migration", "label": "Corporate"},
    {"text": "Kami butuh jaminan SLA tinggi karena ratusan ribu transaksi b2b kami tidak boleh mengalami downtime.", "service": "Custom Software Development", "label": "Corporate"},
    {"text": "Operasional industri manufaktur kami membutuhkan sistem ERP skala besar dengan komputasi cloud.", "service": "Cloud Infrastructure & Migration", "label": "Corporate"},
    {"text": "Tolong sediakan tim developer dedicated untuk menunjang kebutuhan korporasi kami yang terus berkembang.", "service": "IT Outsourcing", "label": "Corporate"},
    {"text": "Kantor pusat PT kami butuh sistem manajemen logistik lintas cabang skala nasional.", "service": "Custom Software Development", "label": "Corporate"}
]

df_new = pd.DataFrame(new_data)

target = 'data/dataset_augmented.csv'
if os.path.exists(target):
    df_existing = pd.read_csv(target)
    df_combined = pd.concat([df_existing, df_new], ignore_index=True)
    df_combined.to_csv(target, index=False)
    print(f"Added {len(new_data)} new Indonesian rows. Total: {len(df_combined)}")
else:
    print("Dataset not found")
