from flask import Flask, request, jsonify
from predict import predictor
import os

app = Flask(__name__)

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
        
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ready", "model_loaded": predictor.model is not None})

if __name__ == '__main__':
    # Run Flask app
    # Default port 5000
    port = int(os.environ.get('PORT', 5000))
    print(f"NLP Service running on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
