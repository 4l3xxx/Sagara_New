// ============================================
// FACE RECOGNITION MODULE
// ============================================

let faceModelsLoaded = false;
let currentStream = null;
let knownFaces = [];

// Load model face-api.js
async function loadFaceModels() {
    const MODEL_URL = '/models';
    
    try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        
        console.log('✅ Face models loaded');
        faceModelsLoaded = true;
        
        // Load known faces dari server
        await loadKnownFaces();
        return true;
    } catch (err) {
        console.error('❌ Failed to load face models:', err);
        return false;
    }
}

// Load semua descriptor wajah yang tersimpan
async function loadKnownFaces() {
    try {
        const res = await fetch('/api/face/descriptors');
        const users = await res.json();
        
        knownFaces = users.map(user => ({
            name: user.name,
            descriptor: new Float32Array(user.descriptor)
        }));
        
        console.log(`📁 Loaded ${knownFaces.length} registered faces`);
    } catch (err) {
        console.error('Failed to load known faces:', err);
        knownFaces = [];
    }
}

// Start webcam
async function startWebcam(videoElement) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        currentStream = stream;
        
        return new Promise((resolve) => {
            videoElement.onloadedmetadata = () => {
                videoElement.play();
                resolve(true);
            };
        });
    } catch (err) {
        console.error('Webcam error:', err);
        alert('Tidak bisa akses webcam. Pastikan izin diberikan.');
        return false;
    }
}

// Stop webcam
function stopWebcam(videoElement) {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    if (videoElement) {
        videoElement.srcObject = null;
    }
}

// Capture dan detect wajah
async function detectFace(videoElement) {
    if (!faceModelsLoaded) {
        alert('Face models masih loading, tunggu sebentar...');
        return null;
    }
    
    const detection = await faceapi
        .detectSingleFace(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptor();
    
    return detection;
}

// Registrasi wajah baru
async function registerFace(name, videoElement) {
    if (!name || name.trim() === '') {
        alert('Masukkan nama terlebih dahulu!');
        return false;
    }
    
    const detection = await detectFace(videoElement);
    if (!detection) {
        alert('Wajah tidak terdeteksi! Pastikan wajah terlihat jelas.');
        return false;
    }
    
    // Ambil beberapa frame untuk konfirmasi
    const descriptor = Array.from(detection.descriptor);
    
    try {
        const res = await fetch('/api/face/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), descriptor })
        });
        
        const data = await res.json();
        if (data.success) {
            alert(`✅ Berhasil registrasi untuk ${name}!`);
            await loadKnownFaces(); // Reload known faces
            return true;
        } else {
            alert('Gagal registrasi: ' + (data.error || 'Unknown error'));
            return false;
        }
    } catch (err) {
        alert('Error koneksi ke server');
        return false;
    }
}

// Recognisi wajah (cocokkan dengan database)
async function recognizeFace(videoElement) {
    if (!faceModelsLoaded || knownFaces.length === 0) {
        console.log('Models not ready or no faces registered');
        return null;
    }
    
    const detection = await detectFace(videoElement);
    if (!detection) return null;
    
    // Bandingkan dengan semua wajah yang dikenal
    let bestMatch = { name: 'unknown', distance: 0.6 }; // threshold 0.6
    
    for (const face of knownFaces) {
        const distance = faceapi.euclideanDistance(detection.descriptor, face.descriptor);
        if (distance < bestMatch.distance) {
            bestMatch = { name: face.name, distance: distance };
        }
    }
    
    if (bestMatch.name !== 'unknown') {
        return { name: bestMatch.name, confidence: 1 - bestMatch.distance };
    }
    return null;
}

// Tampilkan modal face recognition
function showFaceModal() {
    // Cek apakah modal udah ada
    let modal = document.getElementById('face-modal');
    if (!modal) {
        createFaceModal();
        modal = document.getElementById('face-modal');
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Init webcam di modal
    const video = document.getElementById('face-video');
    if (video) startWebcam(video);
}

// Hide modal face
function hideFaceModal() {
    const modal = document.getElementById('face-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    const video = document.getElementById('face-video');
    if (video) stopWebcam(video);
}

// Create modal HTML
function createFaceModal() {
    const modalHTML = `
    <div id="face-modal" class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] hidden items-center justify-center" onclick="if(event.target===this) hideFaceModal()">
        <div class="bg-[#0f0f1a] border border-[rgba(255,255,255,0.1)] rounded-2xl w-[500px] max-w-[90vw] p-6 shadow-2xl">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold text-white font-display">🎭 Face Recognition</h3>
                <button onclick="hideFaceModal()" class="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            
            <div class="relative bg-black rounded-xl overflow-hidden mb-4 aspect-video">
                <video id="face-video" autoplay muted playsinline class="w-full h-full object-cover"></video>
                <canvas id="face-canvas" class="absolute top-0 left-0 w-full h-full pointer-events-none"></canvas>
            </div>
            
            <div class="flex gap-3 mb-4">
                <input type="text" id="face-name" placeholder="Nama lengkap" class="flex-1 bg-[#1a1a28] border border-[rgba(255,255,255,0.1)] rounded-lg px-4 py-2 text-white outline-none focus:border-[#4fffb0]">
                <button onclick="registerWithFace()" class="bg-[#4fffb0] text-black font-bold px-4 py-2 rounded-lg hover:scale-105 transition">Register</button>
            </div>
            
            <button onclick="loginWithFace()" class="w-full bg-[#4f8fff] text-white font-bold py-2 rounded-lg hover:scale-105 transition mb-3">
                🔓 Login dengan Wajah
            </button>
            
            <p class="text-xs text-gray-400 text-center">
                Pastikan pencahayaan cukup dan wajah terlihat jelas.
            </p>
        </div>
    </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Tambahkan drawing canvas buat bounding box
    const video = document.getElementById('face-video');
    const canvas = document.getElementById('face-canvas');
    
    if (video && canvas) {
        video.addEventListener('play', () => {
            const displaySize = { width: video.clientWidth, height: video.clientHeight };
            faceapi.matchDimensions(canvas, displaySize);
            
            setInterval(async () => {
                if (video.paused || video.ended) return;
                const detection = await faceapi.detectSingleFace(video);
                if (detection && canvas) {
                    const resized = faceapi.resizeResults(detection, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, [resized]);
                } else if (canvas) {
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                }
            }, 100);
        });
    }
}

// Wrapper functions (dipanggil dari HTML)
async function registerWithFace() {
    const name = document.getElementById('face-name').value;
    const video = document.getElementById('face-video');
    if (!video) return;
    
    const success = await registerFace(name, video);
    if (success) {
        document.getElementById('face-name').value = '';
        // Opsional: hide modal setelah register
        // hideFaceModal();
    }
}

async function loginWithFace() {
    const video = document.getElementById('face-video');
    if (!video) return;
    
    // Tampilkan loading state
    const btn = event?.target;
    const originalText = btn?.innerHTML;
    if (btn) btn.innerHTML = '⏳ Memproses...';
    
    const result = await recognizeFace(video);
    
    if (btn) btn.innerHTML = originalText;
    
    if (result) {
        // Kirim ke backend buat catat login
        await fetch('/api/face/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: result.name, action: 'login' })
        });
        
        alert(`✅ Selamat datang kembali, ${result.name}!`);
        hideFaceModal();
        
        // Optional: redirect atau refresh state user
        // window.location.href = '/dashboard';
    } else {
        alert('❌ Wajah tidak dikenali. Silakan registrasi terlebih dahulu.');
    }
}

// Inisialisasi saat halaman load
document.addEventListener('DOMContentLoaded', async () => {
    await loadFaceModels();
});