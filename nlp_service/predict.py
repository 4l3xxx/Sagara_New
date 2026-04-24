import joblib
import os
import re

# Configuration
MODEL_PATH = 'models/model_pipeline.pkl'

class NLPPredictor:
    def __init__(self):
        self.model = None
        self.load_model()
        
        # Rule-based keywords for scoring boost
        self.urgency_keywords = ['urgent', 'segera', 'asap', 'penting', 'cepat', 'immediately', 'secepatnya', 'mendesak', 'deadline', 'buruan']
        
        # Service mapping for classification boost (optional)
        # If service contains these words, we might nudge the category or score
        self.corporate_services = ['enterprise', 'transformation', 'consulting', 'integration']
        self.sme_services = ['small', 'umkm', 'ukm', 'simple', 'startup']
        self.gov_services = ['government', 'pemerintah', 'dinas', 'kementerian', 'nasional']

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            self.model = joblib.load(MODEL_PATH)
        else:
            print(f"Warning: Model file not found at {MODEL_PATH}")

    def predict(self, message, service=""):
        if self.model is None:
            return {"error": "Model not trained or loaded"}, 500

        # Combine text and service for better context (matching training format)
        combined_input = f"{message} {service}"

        # 1. NLP Classification
        prediction = self.model.predict([combined_input])[0]
        # Get probability (confidence score)
        probs = self.model.predict_proba([combined_input])[0]
        # Map class name to index
        classes = self.model.classes_.tolist()
        class_idx = classes.index(prediction)
        base_score = probs[class_idx]

        # 2. Rule-based Scoring (Urgency)
        # Check if message contains urgency keywords
        urgency_boost = 0
        message_lower = message.lower()
        for word in self.urgency_keywords:
            if re.search(r'\b' + word + r'\b', message_lower):
                urgency_boost += 0.15 # Increased boost from 0.1 to 0.15
                break 

        # 3. Power Keywords Boost (Corporate/Gov Specialization)
        power_boost = 0
        power_keywords = ['tbk', 'lembaga', 'instansi', 'kementerian', 'dinas', 'infrastruktur', 'audit', 'evaluasi', 'roadmap']
        if prediction in ['Corporate', 'Government']:
            for kw in power_keywords:
                if kw in message_lower:
                    power_boost += 0.1 # Extra 10% for professional terms
                    break

        # 4. Service-based Logic (Optional Boost)
        service_boost = 0
        service_lower = service.lower()
        if (prediction == "Corporate" and any(w in service_lower for w in self.corporate_services)) or \
           (prediction == "SME" and any(w in service_lower for w in self.sme_services)) or \
           (prediction == "Government" and any(w in service_lower for w in self.gov_services)):
            service_boost = 0.1 # Increased from 0.05

        # 5. Calculate Final Lead Score
        final_score = base_score + urgency_boost + service_boost + power_boost
        
        # Calibration: If it's a strongly identified Corporate/SME, ensure a professional score
        if base_score > 0.5:
             final_score = max(final_score, 0.85 if urgency_boost > 0 else 0.75)

        final_score = min(max(final_score, 0.0), 1.0) 

        return {
            "category": str(prediction),
            "score": round(float(final_score), 2),
            "confidence": round(float(base_score), 2),
            "urgency_detected": urgency_boost > 0
        }

# Singleton instance
predictor = NLPPredictor()

if __name__ == "__main__":
    # Test script
    test_msg = "Kami butuh ERP system segera untuk perusahaan cabang kami."
    test_svc = "Enterprise Resource Planning"
    print(predictor.predict(test_msg, test_svc))
