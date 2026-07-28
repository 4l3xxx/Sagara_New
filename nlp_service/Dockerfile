# Gunakan image Python versi ringan
FROM python:3.9-slim

# Set direktori kerja di dalam container
WORKDIR /app

# Copy requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy seluruh script Python NLP
COPY . .

# Expose port NLP Service
EXPOSE 5000

# Jalankan Flask app
CMD ["python", "app.py"]
