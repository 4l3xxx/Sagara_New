from flask import Flask, request, jsonify
from train import KeywordFeatureExtractor
from predict import predictor
import os
import uuid
import datetime
import csv

app = Flask(__name__)

# File paths for logging
LOG_DIR = 'data'
PREDICT_LOG_FILE = os.path.join(LOG_DIR, 'model_logs.csv')
FEEDBACK_LOG_FILE = os.path.join(LOG_DIR, 'feedback_logs.csv')

# Ensure log directory exists
os.makedirs(LOG_DIR, exist_ok=True)

# Initialize CSV headers if files do not exist
if not os.path.exists(PREDICT_LOG_FILE):
    with open(PREDICT_LOG_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['prediction_id', 'timestamp', 'message', 'service', 'category', 'score', 'confidence', 'urgency_detected'])

if not os.path.exists(FEEDBACK_LOG_FILE):
    with open(FEEDBACK_LOG_FILE, mode='w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['prediction_id', 'timestamp', 'correct_label', 'comments'])

@app.route('/api/nlp/predict', methods=['POST'])
def handle_predict():
    data = request.get_json()
    
    if not data or 'message' not in data:
        return jsonify({"error": "Missing 'message' field"}), 400
    
    message = data.get('message', '')
    service = data.get('service', '')
    
    result = predictor.predict(message, service)
    
    if "error" in result:
        return jsonify(result), 500
        
    # Generate unique ID for this prediction
    prediction_id = str(uuid.uuid4())
    result['prediction_id'] = prediction_id
    
    # Log the prediction
    timestamp = datetime.datetime.now().isoformat()
    with open(PREDICT_LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([
            prediction_id, 
            timestamp, 
            message, 
            service, 
            result.get('category'), 
            result.get('score'), 
            result.get('confidence'), 
            result.get('urgency_detected')
        ])
        
    return jsonify(result)

@app.route('/api/nlp/feedback', methods=['POST'])
def handle_feedback():
    data = request.get_json()
    
    if not data or 'prediction_id' not in data or 'correct_label' not in data:
        return jsonify({"error": "Missing 'prediction_id' or 'correct_label'"}), 400
        
    prediction_id = data['prediction_id']
    correct_label = data['correct_label']
    comments = data.get('comments', '')
    timestamp = datetime.datetime.now().isoformat()
    
    # Log the feedback
    with open(FEEDBACK_LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow([prediction_id, timestamp, correct_label, comments])
        
    return jsonify({"status": "success", "message": "Feedback recorded successfully"})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "model_loaded": predictor.model is not None})

if __name__ == '__main__':
    # Run Flask app
    # Default port 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"NLP Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
