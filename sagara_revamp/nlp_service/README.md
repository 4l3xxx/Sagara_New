# Sagara NLP Service 🤖

Layanan NLP terpisah untuk mengklasifikasikan pesan konsultasi user dan memberikan lead score otomatis.

## 📂 Struktur Folder

```text
/nlp_service/
├── data/
│   └── dataset.csv         <-- Taruh dataset Anda di sini
├── models/
│   └── model_pipeline.pkl  <-- Model yang sudah dilatih (otomatis tergenerate)
├── app.py                  <-- API Flask (Entry point)
├── train.py                <-- Script untuk melatih ulang model
├── predict.py              <-- Logika inti klasifikasi & scoring
├── requirements.txt        <-- Daftar library yang dibutuhkan
└── README.md               <-- Dokumentasi ini
```

---

## 📊 Dataset (Cara Mempersiapkan)

Taruh file dataset Anda di `nlp_service/data/dataset.csv`.

**Format Kolom:**
*   `text`: Isi pesan atau deskripsi kebutuhan user.
*   `label`: Klasifikasi (harus salah satu dari: `Corporate`, `SME`, atau `Government`).

**Contoh isi `dataset.csv`:**
```csv
text,label
"Digital transformasi untuk perusahaan manufaktur besar.","Corporate"
"Butuh website landing page sederhana untuk UMKM.","SME"
"Sistem manajemen data kementerian pendidikan.","Government"
```

---

## 🚀 Cara Menjalankan

### 1. Install Dependencies
Pastikan Anda sudah menginstall Python, lalu jalankan:
```bash
pip install -r requirements.txt
```

### 2. Training Model (Lakukan setiap kali ada data baru)
Script ini akan membaca `dataset.csv`, melatih model, dan menyimpannya ke folder `models/`.
```bash
python train.py
```

### 3. Jalankan API Service
```bash
python app.py
```
Service akan berjalan di `http://localhost:5000`.

---

## 🧪 Testing API

### Menggunakan cURL:
```bash
curl -X POST http://localhost:5000/api/nlp/predict \
     -H "Content-Type: application/json" \
     -d '{"message": "Butuh sistem ERP untuk perusahaan multinasional segera", "service": "Enterprise Solution"}'
```

### Output yang Diharapkan:
```json
{
  "category": "Corporate",
  "score": 0.95,
  "confidence": 0.85,
  "urgency_detected": true
}
```

---

## 🔗 Integrasi ke Backend Utama

### Jika Menggunakan Django (Python):
Tambahkan code ini di view/controller setelah form submit berhasil disimpan ke DB.

```python
import requests

def handle_consultation_form(request):
    # ... logic simpan form existing ...
    
    # Data dari form
    payload = {
        "message": request.POST.get('message'),
        "service": request.POST.get('service')
    }
    
    try:
        # Panggil API NLP Service
        response = requests.post("http://localhost:5000/api/nlp/predict", json=payload)
        if response.status_code == 200:
            nlp_result = response.json()
            category = nlp_result['category']
            lead_score = nlp_result['score']
            
            # Update data lead di database (Opsional)
            # lead.category = category
            # lead.score = lead_score
            # lead.save()
            print(f"Lead Classified as {category} with score {lead_score}")
    except Exception as e:
        print(f"Failed to call NLP Service: {e}")
        
    return HttpResponse("Success")
```

### Jika Menggunakan Go (Sagara-Backend):
Tambahkan di `internal/handler/consultation.go`:

```go
// Simulasi integrasi di Go
func callNLPService(message string, service string) {
    url := "http://localhost:5000/api/nlp/predict"
    
    payload := map[string]string{
        "message": message,
        "service": service,
    }
    jsonData, _ := json.Marshal(payload)
    
    resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
    if err == nil {
        defer resp.Body.Close()
        var result map[string]interface{}
        json.NewDecoder(resp.Body).Decode(&result)
        fmt.Printf("Category: %v, Score: %v\n", result["category"], result["score"])
    }
}
```

---

## 🛠️ Logika Tambahan
*   **NLP Input**: Menggunakan "message" untuk klasifikasi utama.
*   **Rule-based Scoring**: Jika mengandung kata-kata seperti "urgent", "segera", "asap", skor akan otomatis naik (+10%).
*   **Service Boost**: Jika nama layanan (service) relevan dengan kategori yang terdeteksi, tingkat keyakinan (confidence) akan bertambah.
