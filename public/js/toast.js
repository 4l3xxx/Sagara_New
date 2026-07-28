/**
 * SagaraToast - Premium Glassmorphic Notification System
 * Position: Top Center
 * Created for Sagara Technology Solutions (Global Use)
 */

(function () {
    // 1. Inject CSS Styles for SagaraToast Dynamically
    const styles = `
        #sagara-toast-container {
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            width: 100%;
            max-width: 420px;
            pointer-events: none;
            align-items: center;
        }

        .sagara-toast {
            pointer-events: auto;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 14px 20px;
            border-radius: 16px;
            background: rgba(16, 25, 34, 0.88);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #ffffff;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            font-family: 'Inter', sans-serif;
            position: relative;
            overflow: hidden;
            transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-origin: top center;
        }

        /* Slide-in & Slide-out animations */
        @keyframes toastSlideDown {
            from {
                transform: translateY(-40px) scale(0.9);
                opacity: 0;
            }
            to {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
        }

        @keyframes toastSlideUp {
            from {
                transform: translateY(0) scale(1);
                opacity: 1;
            }
            to {
                transform: translateY(-20px) scale(0.9);
                opacity: 0;
            }
        }

        .sagara-toast.show {
            animation: toastSlideDown 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .sagara-toast.hide {
            animation: toastSlideUp 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        /* Type styling with left border & shadow glow */
        .sagara-toast-success {
            border-left: 4px solid #10b981 !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(16, 185, 129, 0.15);
        }

        .sagara-toast-error {
            border-left: 4px solid #ef4444 !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(239, 68, 68, 0.15);
        }

        .sagara-toast-warning {
            border-left: 4px solid #f59e0b !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(245, 158, 11, 0.15);
        }

        .sagara-toast-info {
            border-left: 4px solid #137fec !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 0 15px rgba(19, 127, 236, 0.15);
        }

        /* Icons styling */
        .sagara-toast-icon-wrap {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .sagara-toast-icon {
            font-family: 'Material Symbols Outlined';
            font-size: 24px;
            user-select: none;
        }

        .sagara-toast-success .sagara-toast-icon { color: #10b981; }
        .sagara-toast-error .sagara-toast-icon { color: #ef4444; }
        .sagara-toast-warning .sagara-toast-icon { color: #f59e0b; }
        .sagara-toast-info .sagara-toast-icon { color: #137fec; }

        /* Content styling */
        .sagara-toast-content {
            flex-grow: 1;
            font-size: 13.5px;
            font-weight: 500;
            line-height: 1.5;
            color: #f1f5f9;
        }

        /* Close button styling */
        .sagara-toast-close {
            background: transparent;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 6px;
            transition: all 0.15s;
            flex-shrink: 0;
        }

        .sagara-toast-close:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
        }

        /* Progress Bar Animation */
        .sagara-toast-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            width: 100%;
            transform-origin: left;
        }

        .sagara-toast-success .sagara-toast-progress { background: #10b981; }
        .sagara-toast-error .sagara-toast-progress { background: #ef4444; }
        .sagara-toast-warning .sagara-toast-progress { background: #f59e0b; }
        .sagara-toast-info .sagara-toast-progress { background: #137fec; }

        @keyframes toastProgress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // 2. Synthesize Premium Soft Chime Sound using Web Audio API
    function playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;

            // Pure smooth notification tone
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(784, now); // G5 note
            oscillator.frequency.exponentialRampToValueAtTime(1046.5, now + 0.12); // Cascading upward to C6 note

            // Soft non-intrusive volume
            gainNode.gain.setValueAtTime(0.06, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35); // Smooth decay

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start(now);
            oscillator.stop(now + 0.35);
        } catch (e) {
            console.warn("Soft chime sound could not play:", e);
        }
    }

    // 3. Main Toast System Object
    window.SagaraToast = {
        container: null,

        initContainer() {
            if (!this.container) {
                this.container = document.createElement('div');
                this.container.id = 'sagara-toast-container';
                document.body.appendChild(this.container);
            }
        },

        show(message, type = 'info', duration = 4500) {
            this.initContainer();

            // Create toast wrapper element
            const toast = document.createElement('div');
            toast.className = `sagara-toast sagara-toast-${type} show`;

            // Define icons based on type
            let iconName = 'info';
            if (type === 'success') iconName = 'check_circle';
            else if (type === 'error') iconName = 'error';
            else if (type === 'warning') iconName = 'warning';

            // HTML Structure of Toast
            toast.innerHTML = `
                <div class="sagara-toast-icon-wrap">
                    <span class="sagara-toast-icon">${iconName}</span>
                </div>
                <div class="sagara-toast-content">${message}</div>
                <button class="sagara-toast-close">
                    <span class="sagara-toast-icon text-[18px]" style="font-size: 18px;">close</span>
                </button>
                <div class="sagara-toast-progress" style="animation: toastProgress ${duration}ms linear forwards;"></div>
            `;

            // Append to top center container
            this.container.appendChild(toast);
            
            // Play our synthesized premium sound
            playNotificationSound();

            // Function to dismiss toast with animation
            const dismissToast = () => {
                if (toast.classList.contains('hide')) return;
                toast.classList.remove('show');
                toast.classList.add('hide');
                toast.addEventListener('animationend', () => {
                    toast.remove();
                });
            };

            // Setup close button click
            toast.querySelector('.sagara-toast-close').addEventListener('click', dismissToast);

            // Auto-dismiss timeout
            const timeoutId = setTimeout(dismissToast, duration);

            // Optional: Pause auto-dismiss on hover
            toast.addEventListener('mouseenter', () => {
                clearTimeout(timeoutId);
                const progressBar = toast.querySelector('.sagara-toast-progress');
                if (progressBar) progressBar.style.animationPlayState = 'paused';
            });
        },

        success(message, duration) { this.show(message, 'success', duration); },
        error(message, duration) { this.show(message, 'error', duration); },
        warning(message, duration) { this.show(message, 'warning', duration); },
        info(message, duration) { this.show(message, 'info', duration); }
    };
})();
