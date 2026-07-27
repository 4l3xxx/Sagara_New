// ============================================
// FACE RECOGNITION MODULE WITH PREMIUM SAGARATOAST
// ============================================

let faceModelsLoaded = false;
let currentStream = null;
let knownFaces = [];

// Safe helper to trigger premium SagaraToast or fallback to alert
function showNotification(message, type = 'info') {
    if (window.SagaraToast) {
        window.SagaraToast.show(message, type);
    } else {
        alert(message);
    }
}

// --- LIVENESS HELPERS ---
function calculateDistance(pt1, pt2) {
    return Math.sqrt(Math.pow(pt1.x - pt2.x, 2) + Math.pow(pt1.y - pt2.y, 2));
}

function getLivenessFeatures(landmarks) {
    const positions = landmarks.positions;
    
    const calculateEAR = (indices) => {
        const p = indices.map(i => positions[i]);
        const v1 = calculateDistance(p[1], p[5]);
        const v2 = calculateDistance(p[2], p[4]);
        const h = calculateDistance(p[0], p[3]);
        return (v1 + v2) / (2.0 * h);
    };
    
    const rightEAR = calculateEAR([36, 37, 38, 39, 40, 41]); 
    const leftEAR = calculateEAR([42, 43, 44, 45, 46, 47]);
    const avgEAR = (leftEAR + rightEAR) / 2.0;
    const isBlink = avgEAR < 0.25;

    const noseTip = positions[30];
    const leftEdge = positions[0];
    const rightEdge = positions[16];
    
    const distLeft = calculateDistance(noseTip, leftEdge);
    const distRight = calculateDistance(noseTip, rightEdge);
    
    let headPose = 'tengah';
    if (distLeft < distRight * 0.5) headPose = 'kanan';
    else if (distRight < distLeft * 0.5) headPose = 'kiri';

    const topLip = positions[62];
    const bottomLip = positions[66];
    const mouthDist = calculateDistance(topLip, bottomLip);
    const faceHeight = calculateDistance(positions[8], positions[27]); 
    const mouthOpen = (mouthDist / faceHeight) > 0.08;
    
    return { isBlink, headPose, mouthOpen };
}
// ------------------------

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
        showNotification('⚠️ Tidak bisa akses webcam. Pastikan izin diberikan.', 'error');
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

// Capture dan detect wajah (Support multi-face rejection)
async function detectFace(videoElement, requireSingle = true) {
    if (!faceModelsLoaded) {
        showNotification('⏳ Face models masih loading, tunggu sebentar...', 'warning');
        return { error: 'loading' };
    }
    
    const detections = await faceapi
        .detectAllFaces(videoElement)
        .withFaceLandmarks()
        .withFaceDescriptors();
    
    if (detections.length === 0) return null;
    
    if (requireSingle && detections.length > 1) {
        return { error: 'multi_face' };
    }
    
    return detections[0];
}

// Registrasi wajah baru
async function registerFace(name, videoElement) {
    if (!name || name.trim() === '') {
        showNotification('⚠️ Masukkan nama terlebih dahulu!', 'warning');
        return false;
    }
    
    const detection = await detectFace(videoElement, true);
    if (!detection || detection.error) {
        if (detection && detection.error === 'multi_face') {
            showNotification('❌ Terdeteksi lebih dari satu wajah! Registrasi dibatalkan.', 'error');
        } else if (detection && detection.error === 'loading') {
            // Already handled
        } else {
            showNotification('❌ Wajah tidak terdeteksi! Pastikan wajah terlihat jelas.', 'error');
        }
        return false;
    }
    
    // Ambil descriptor wajah
    const descriptor = Array.from(detection.descriptor);
    
    try {
        const res = await fetch('/api/face/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), descriptor })
        });
        
        const data = await res.json();
        if (data.success) {
            showNotification(`✅ Berhasil registrasi untuk ${name}!`, 'success');
            await loadKnownFaces(); // Reload known faces
            return true;
        } else {
            showNotification('❌ Gagal registrasi: ' + (data.error || 'Unknown error'), 'error');
            return false;
        }
    } catch (err) {
        showNotification('❌ Error koneksi ke server', 'error');
        return false;
    }
}

// Recognisi wajah (cocokkan dengan database)
async function recognizeFace(detection) {
    if (!faceModelsLoaded || knownFaces.length === 0) {
        return null;
    }
    
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
            
            <div id="liveness-instruction" class="text-center font-bold text-[#4fffb0] text-lg mb-4 hidden">
                Instruksi
            </div>
            
            <div class="flex gap-3 mb-4" id="face-register-container">
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
            
            window.faceInterval = setInterval(async () => {
                if (video.paused || video.ended) return;
                const detections = await faceapi.detectAllFaces(video);
                if (detections && canvas) {
                    const resized = faceapi.resizeResults(detections, displaySize);
                    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
                    faceapi.draw.drawDetections(canvas, resized);
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

// State machine untuk Login dengan liveness
let loginActive = false;

async function loginWithFace() {
    if (loginActive) return;
    
    const video = document.getElementById('face-video');
    const instructionEl = document.getElementById('liveness-instruction');
    const btn = event?.target;
    
    if (!video) return;
    
    loginActive = true;
    const originalText = btn?.innerHTML;
    if (btn) btn.innerHTML = '⏳ Menyiapkan Liveness...';
    instructionEl.classList.remove('hidden');
    
    const challenges = [
        { type: 'kiri', text: 'Tengok ke Kiri sedikit' },
        { type: 'kanan', text: 'Tengok ke Kanan sedikit' },
        { type: 'buka_mulut', text: 'Silakan Buka Mulut Anda' }
    ];
    
    // Pilih satu random challenge + blink selalu diminta
    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    const stages = [
        { id: 'blink', text: 'Silakan Kedipkan Mata (Blink)', passed: false },
        { id: randomChallenge.type, text: randomChallenge.text, passed: false }
    ];
    
    let currentStage = 0;
    
    // Loop deteksi liveness
    let lastBlinkState = false; // untuk deteksi transisi melek -> merem -> melek
    let hasBlinked = false;
    
    while (currentStage < stages.length && loginActive) {
        instructionEl.innerText = stages[currentStage].text;
        
        // Wait 100ms
        await new Promise(r => setTimeout(r, 100));
        
        const detection = await detectFace(video, true);
        if (!detection) continue;
        
        if (detection.error === 'multi_face') {
            showNotification('❌ Terdeteksi lebih dari satu wajah! Login dibatalkan.', 'error');
            loginActive = false;
            break;
        }
        if (detection.error) continue; // loading
        
        const features = getLivenessFeatures(detection.landmarks);
        
        if (stages[currentStage].id === 'blink') {
            if (features.isBlink) {
                lastBlinkState = true;
            } else if (lastBlinkState && !features.isBlink) {
                hasBlinked = true;
                stages[currentStage].passed = true;
                currentStage++;
                lastBlinkState = false;
                showNotification('✅ Kedipan terdeteksi!', 'success');
            }
        } else if (stages[currentStage].id === 'kiri') {
            if (features.headPose === 'kiri') {
                stages[currentStage].passed = true;
                currentStage++;
                showNotification('✅ Gerakan terdeteksi!', 'success');
            }
        } else if (stages[currentStage].id === 'kanan') {
            if (features.headPose === 'kanan') {
                stages[currentStage].passed = true;
                currentStage++;
                showNotification('✅ Gerakan terdeteksi!', 'success');
            }
        } else if (stages[currentStage].id === 'buka_mulut') {
            if (features.mouthOpen) {
                stages[currentStage].passed = true;
                currentStage++;
                showNotification('✅ Gerakan terdeteksi!', 'success');
            }
        }
    }
    
    if (!loginActive) {
        if (btn) btn.innerHTML = originalText;
        instructionEl.classList.add('hidden');
        return;
    }
    
    instructionEl.innerText = "Memverifikasi Wajah...";
    
    // Tunggu sedikit agar wajah kembali ke tengah setelah challenge
    await new Promise(r => setTimeout(r, 500));
    
    const finalDetection = await detectFace(video, true);
    let result = null;
    
    if (finalDetection && !finalDetection.error) {
        result = await recognizeFace(finalDetection);
    }
    
    if (btn) btn.innerHTML = originalText;
    instructionEl.classList.add('hidden');
    loginActive = false;
    
    if (finalDetection && finalDetection.error === 'multi_face') {
        showNotification('❌ Terdeteksi lebih dari satu wajah! Login dibatalkan.', 'error');
        return;
    }
    
    if (result) {
        // Kirim ke backend buat catat login
        await fetch('/api/face/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: result.name, action: 'login' })
        });
        
        showNotification(`✅ Selamat datang kembali, ${result.name}!`, 'success');
        hideFaceModal();
    } else {
        showNotification('❌ Wajah tidak dikenali atau belum terdaftar.', 'error');
    }
}

// Inisialisasi saat halaman load
document.addEventListener('DOMContentLoaded', async () => {
    await loadFaceModels();
});