import pandas as pd
import os

new_corporate_procurement_samples = [
    # Corporate samples specifically focusing on pengadaan, rencana strategis, manajemen aset, procurement
    ("Kami ingin membangun sistem manajemen aset terintegrasi dengan pengadaan barang. Ini proyek strategis perusahaan 5 tahun ke depan.", "Corporate", "Custom Software Development"),
    ("Perusahaan kami sedang menyusun rencana strategis untuk pengadaan sistem ERP.", "Corporate", "Custom Software Development"),
    ("Kami butuh sistem pengadaan barang internal yang terintegrasi dengan keuangan.", "Corporate", "Custom Software Development"),
    ("Kami perusahaan manufaktur, perlu sistem manajemen aset terintegrasi", "Corporate", "Custom Software Development"),
    ("Rencana strategis perusahaan 5 tahun ke depan mencakup digitalisasi pengadaan", "Corporate", "IT Strategy Consulting"),
    ("Perusahaan kami ingin meng-upgrade sistem procurement dengan modul inventory", "Corporate", "Custom Software Development"),
    ("Kami mencari solusi enterprise untuk manajemen aset dan pengadaan", "Corporate", "Custom Software Development"),
    ("Tim internal kami sedang menyusun roadmap pengadaan barang nasional untuk anak perusahaan", "Corporate", "IT Strategy Consulting"),
    ("Pengadaan sistem IT internal perusahaan berskala enterprise dan integrasi supply chain.", "Corporate", "Custom Software Development"),
    ("Rencana strategis bisnis korporasi untuk efisiensi pengadaan dan peningkatan profit perusahaan.", "Corporate", "IT Strategy Consulting"),
    ("Pengembangan modul e-procurement swasta untuk holding company serta manajemen vendor internal.", "Corporate", "Custom Software Development"),
    ("Sistem pengadaan barang internal dan manajemen inventaris untuk 20 pabrik manufaktur perusahaan kami.", "Corporate", "Custom Software Development"),
    ("Kami butuh integrasi sistem SAP Procurement dengan portal vendor swasta milik perusahaan.", "Corporate", "Custom Software Development"),
    ("Optimalisasi proses pengadaan internal dan efisiensi biaya operasional bisnis perseroan swasta.", "Corporate", "IT Strategy Consulting"),
    ("Rencana strategis pemegang saham (shareholder & stakeholder) untuk transformasi sistem pengadaan perusahaan.", "Corporate", "IT Strategy Consulting"),
    
    # Balance with explicit Government samples for pengadaan & rencana strategis instansi
    ("Rencana strategis instansi pemerintah dalam digitalisasi pelayanan publik lima tahun ke depan.", "Government", "Government Solutions"),
    ("Pengadaan negara dan tender elektronik LPSE sesuai APBN untuk sistem informasi kementerian.", "Government", "Government Solutions"),
    ("Penyusunan rencana strategis dinas daerah untuk transparansi pengadaan barang dan jasa publik.", "Government", "IT Strategy Consulting"),
    ("Sistem pengadaan barang instansi pemerintahan daerah menggunakan APBD kabupaten.", "Government", "Government Solutions"),
    ("Audit akuntabilitas dan transparansi pengadaan proyek SPBE pada organisasi perangkat daerah (OPD).", "Government", "Cybersecurity Audit")
]

def append_samples():
    csv_path = os.path.join('data', 'dataset.csv')
    df_existing = pd.read_csv(csv_path)
    
    df_new = pd.DataFrame(new_corporate_procurement_samples, columns=['text', 'label', 'service'])
    
    existing_texts = set(df_existing['text'].str.strip())
    df_new_filtered = df_new[~df_new['text'].str.strip().isin(existing_texts)]
    
    df_combined = pd.concat([df_existing, df_new_filtered], ignore_index=True)
    df_combined.to_csv(csv_path, index=False)
    print(f"Added {len(df_new_filtered)} new corporate procurement & strategic samples. Total dataset size: {len(df_combined)} samples.")
    print(df_combined['label'].value_counts())

if __name__ == '__main__':
    append_samples()
