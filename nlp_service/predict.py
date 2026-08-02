import joblib
import os
import re
import numpy as np
from sklearn.base import BaseEstimator, TransformerMixin

# Configuration
MODEL_PATH = 'models/model_pipeline.pkl'

# Must be defined here so joblib can unpickle the pipeline
class KeywordFeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.gov_keywords = ['kementerian', 'dinas', 'pemerintah', 'pemprov', 'pemda', 'desa', 'apbd', 'apbn', 'instansi', 'lpse', 'puskesmas', 'kecamatan', 'kelurahan', 'tata kota', 'layanan publik', 'warga', 'pengadaan', 'lelang', 'birokrasi', 'masyarakat', 'publik']
        self.corp_keywords = ['holding', 'patungan', 'pt', 'enterprise', 'cloud', 'erp', 'sla', 'korporasi', 'swasta', 'manufaktur', 'tender', 'cabang', 'skala besar', 'transaksi', 'downtime', 'b2b', 'logistik', 'industri', 'operasional']
        self.umkm_keywords = ['startup', 'koperasi', 'bumdes', 'komunitas', 'yayasan', 'warung', 'toko', 'laundry', 'bengkel', 'rintisan', 'umkm', 'ukm', 'jualan', 'kasir', 'murah', 'pesanan', 'pelanggan', 'pos', 'usaha kecil', 'mikro']
        
    def fit(self, X, y=None):
        return self
        
    def transform(self, X):
        features = []
        for text in X:
            text_lower = str(text).lower()
            gov_score = sum(1 for k in self.gov_keywords if k in text_lower)
            corp_score = sum(1 for k in self.corp_keywords if k in text_lower)
            umkm_score = sum(1 for k in self.umkm_keywords if k in text_lower)
            features.append([gov_score, corp_score, umkm_score])
        return np.array(features)

class NLPPredictor:
    def __init__(self):
        self.model = None
        self.load_model()
        
        # Rule-based keywords for urgency
        self.urgency_keywords = ['urgent', 'segera', 'asap', 'penting', 'cepat', 'immediately', 'secepatnya', 'mendesak', 'deadline', 'buruan', 'darurat']

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")

    def predict(self, message, service=""):
        if self.model is None:
            self.load_model()
            if self.model is None:
                return {"error": "Model not trained or loaded"}, 500

        # Combine text and service for better context (matching training format)
        combined_input = f"{message} {service}"

        # 1. NLP ML Classification Pipeline (TF-IDF + Keywords + LogisticRegression)
        prediction = self.model.predict([combined_input])[0]
        probs = self.model.predict_proba([combined_input])[0]
        classes = self.model.classes_.tolist()
        class_idx = classes.index(prediction)
        
        # Confidence score derived purely from ML probabilities
        ml_confidence = probs[class_idx]
        
        message_lower = message.lower()

        # 2. Urgency Detection (Rule-based Scoring Boost)
        urgency_boost = 0
        for word in self.urgency_keywords:
            if re.search(r'\b' + word + r'\b', message_lower):
                urgency_boost += 0.15
                break 

        # 3. Calculate Final Lead Score
        # We don't override the ML prediction class anymore.
        # The base score is the ML confidence.
        final_score = ml_confidence + urgency_boost
        
        # Calibration: Ensure professional score range
        final_score = min(max(final_score, 0.05), 0.99) 
        confidence_out = min(max(ml_confidence, 0.10), 0.99)

        return {
            "category": str(prediction),
            "score": round(float(final_score), 2),
            "confidence": round(float(confidence_out), 2),
            "urgency_detected": urgency_boost > 0
        }

# Singleton instance
predictor = NLPPredictor()

if __name__ == "__main__":
    # Test script
    test_msg = "Kami butuh ERP system segera untuk perusahaan cabang kami."
    test_svc = "Enterprise Resource Planning"
    print(predictor.predict(test_msg, test_svc))

