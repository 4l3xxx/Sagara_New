import pandas as pd
import joblib
import os
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import classification_report
from sklearn.base import BaseEstimator, TransformerMixin

# Configuration
DATA_PATH = 'data/dataset_augmented.csv'
FALLBACK_DATA_PATH = 'data/dataset.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'model_pipeline.pkl')

class KeywordFeatureExtractor(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.gov_keywords = ['kementerian', 'dinas', 'pemerintah', 'pemprov', 'pemda', 'desa', 'apbd', 'apbn', 'instansi', 'lpse', 'puskesmas', 'kecamatan', 'kelurahan']
        self.corp_keywords = ['holding', 'patungan', 'pt', 'enterprise', 'cloud', 'erp', 'sla', 'korporasi', 'swasta', 'manufaktur', 'tender']
        self.umkm_keywords = ['startup', 'koperasi', 'bumdes', 'komunitas', 'yayasan', 'warung', 'toko', 'laundry', 'bengkel', 'rintisan', 'umkm', 'ukm']
        
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

def train():
    # 1. Load Data
    path_to_use = DATA_PATH if os.path.exists(DATA_PATH) else FALLBACK_DATA_PATH
    if not os.path.exists(path_to_use):
        print(f"Error: Dataset not found at {path_to_use}")
        return

    df = pd.read_csv(path_to_use)
    
    if 'text' not in df.columns or 'label' not in df.columns:
        print("Error: Dataset must have 'text' and 'label' columns.")
        return

    print(f"Loaded {len(df)} samples from {path_to_use}.")

    # 2. Prepare Features and Label
    # Combine text and service for better context
    df['combined_text'] = df['text'] + " " + df['service']
    X = df['combined_text']
    y = df['label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 3. Create Pipeline
    pipeline = Pipeline([
        ('features', FeatureUnion([
            ('tfidf', TfidfVectorizer(
                ngram_range=(1, 3), 
                min_df=2, 
                sublinear_tf=True,
                stop_words=None
            )),
            ('keywords', KeywordFeatureExtractor())
        ])),
        ('clf', LogisticRegression(
            solver='lbfgs', 
            penalty='l2',
            max_iter=1000,
            class_weight='balanced',
            C=0.8,
            random_state=42
        ))
    ])

    # 4. Cross Validation Evaluation
    print("Running Cross-Validation...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X, y, cv=skf, scoring='f1_macro')
    print(f"CV F1-Macro: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")

    # 5. Train Final Model
    print("\nTraining final model...")
    pipeline.fit(X_train, y_train)

    # 6. Evaluate on Test Set
    y_pred = pipeline.predict(X_test)
    print("\nModel Evaluation on Test Set:")
    print(classification_report(y_test, y_pred))

    # 7. Save Model
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    train()
