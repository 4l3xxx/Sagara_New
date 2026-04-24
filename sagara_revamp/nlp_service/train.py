import pandas as pd
import joblib
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

# Configuration
DATA_PATH = 'data/dataset.csv'
MODEL_DIR = 'models'
MODEL_PATH = os.path.join(MODEL_DIR, 'model_pipeline.pkl')

def train():
    # 1. Load Data
    if not os.path.exists(DATA_PATH):
        print(f"Error: Dataset not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    
    if 'text' not in df.columns or 'label' not in df.columns:
        print("Error: Dataset must have 'text' and 'label' columns.")
        return

    print(f"Loaded {len(df)} samples.")

    # 2. Prepare Features and Label
    # Combine text and service for better context
    df['combined_text'] = df['text'] + " " + df['service']
    X = df['combined_text']
    y = df['label']
    
    # Optional: If dataset is too small, skip split and train on all
    if len(df) > 10:
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    else:
        X_train, X_test, y_train, y_test = X, X, y, y

    # 3. Create Pipeline
    # Improved parameters for better context capturing
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            ngram_range=(1, 3), 
            min_df=2, 
            sublinear_tf=True,
            stop_words=None
        )),
        ('clf', LogisticRegression(
            solver='liblinear', 
            multi_class='auto',
            class_weight='balanced',
            C=10.0 # Increase strength of classification
        ))
    ])

    # 4. Train
    print("Training model...")
    pipeline.fit(X_train, y_train)

    # 5. Evaluate
    y_pred = pipeline.predict(X_test)
    print("\nModel Evaluation:")
    print(classification_report(y_test, y_pred))

    # 6. Save Model
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
        
    joblib.dump(pipeline, MODEL_PATH)
    print(f"\nModel saved successfully to {MODEL_PATH}")

if __name__ == "__main__":
    train()
