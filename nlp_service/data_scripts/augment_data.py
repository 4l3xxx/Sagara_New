import pandas as pd
import random
import os

def augment_text(text):
    """Buat variasi kalimat biar model lebih robust"""
    # 1. Ganti kata dengan sinonim
    sinonim = {
        'bikin': ['buat', 'membuat', 'mengembangkan', 'membangun', 'bikin'],
        'aplikasi': ['app', 'software', 'sistem', 'platform', 'aplikasi'],
        'perusahaan': ['kantor', 'usaha', 'bisnis', 'institusi', 'perusahaan'],
        'pemerintah': ['pemerintahan', 'pemda', 'instansi', 'dinas', 'pemerintah'],
        'umkm': ['ukm', 'usaha kecil', 'toko', 'warung', 'umkm'],
        'murah': ['terjangkau', 'hemat budget', 'ekonomis', 'murah'],
        'segera': ['secepatnya', 'urgent', 'asap', 'buru-buru', 'segera'],
        'kami': ['kita', 'saya', 'perusahaan kami', 'instansi kami', 'kami'],
        'ingin': ['mau', 'butuh', 'perlu', 'bermaksud', 'ingin']
    }
    
    text_lower = text.lower()
    for kata, sinonim_list in sinonim.items():
        if kata in text_lower:
            # Case insensitive replacement
            import re
            text = re.sub(r'\b' + kata + r'\b', random.choice(sinonim_list), text, flags=re.IGNORECASE)
    
    # 2. Tambahkan noise (typo, singkatan)
    typo_variants = {
        'aplikasi': ['aplkasi', 'apk', 'app', 'aplikasi'],
        'dengan': ['dgn', 'pake', 'pakai', 'dengan'],
        'yang': ['yg', 'yng', 'yang'],
        'untuk': ['utk', 'buat', 'untuk'],
        'dan': ['dn', '&', 'dan']
    }
    
    for kata, typo_list in typo_variants.items():
        if kata in text_lower:
            import re
            # 20% chance to apply typo
            if random.random() < 0.2:
                text = re.sub(r'\b' + kata + r'\b', random.choice(typo_list), text, flags=re.IGNORECASE)
    
    # 3. Ubah struktur kalimat (menambahkan prefix)
    templates = [
        f"{text}",
        f"{text}",  # weight original more
        f"Kami ingin {text[:1].lower()}{text[1:]}",
        f"Butuh bantuan untuk {text[:1].lower()}{text[1:]}",
        f"Halo, {text[:1].lower()}{text[1:]}",
        f"Mohon info, {text[:1].lower()}{text[1:]}",
        f"Apakah bisa {text[:1].lower()}{text[1:]}"
    ]
    
    # Apply prefix only if it doesn't already start with these words
    if not text.lower().startswith(('kami', 'butuh', 'halo', 'mohon', 'apakah')):
        text = random.choice(templates)
        
    return text

def run_augmentation():
    input_path = 'data/dataset.csv'
    output_path = 'data/dataset_augmented.csv'
    
    if not os.path.exists(input_path):
        print(f"File not found: {input_path}")
        return
        
    df = pd.read_csv(input_path)
    print(f"Original dataset size: {len(df)}")
    
    augmented_records = []
    
    # Target 5 variations per row (original + 4 augmented)
    for _, row in df.iterrows():
        # Keep original
        augmented_records.append({
            'text': row['text'],
            'service': row['service'],
            'label': row['label']
        })
        
        # Generate 4 variations
        for _ in range(4):
            augmented_records.append({
                'text': augment_text(row['text']),
                'service': row['service'],
                'label': row['label']
            })
            
    df_augmented = pd.DataFrame(augmented_records)
    
    # Remove duplicates if any
    df_augmented = df_augmented.drop_duplicates(subset=['text', 'service'])
    
    df_augmented.to_csv(output_path, index=False)
    print(f"Augmented dataset saved to {output_path}")
    print(f"New dataset size: {len(df_augmented)}")
    
    print(df_augmented['label'].value_counts())

if __name__ == '__main__':
    run_augmentation()
