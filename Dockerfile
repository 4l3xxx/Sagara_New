# Gunakan image Node.js versi 18
FROM node:18-alpine

# Set direktori kerja di dalam container
WORKDIR /usr/src/app

# Copy package.json dan package-lock.json (jika ada)
COPY package*.json ./

# Install dependensi
RUN npm install

# Copy seluruh file proyek ke dalam container
COPY . .

# Expose port yang digunakan aplikasi
EXPOSE 3000

# Jalankan server
CMD ["npm", "start"]
