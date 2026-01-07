// ===== DOM Elements =====
const bsodScreen = document.getElementById('bsod-screen');
const prankScreen = document.getElementById('prank-screen');
const prankCard = document.querySelector('.prank-card');
const resultCard = document.getElementById('result-card');
const punishmentSelect = document.getElementById('punishment-select');
const confirmBtn = document.getElementById('confirm-btn');
const backBtn = document.getElementById('back-btn');
const resultEmoji = document.getElementById('result-emoji');
const resultTitle = document.getElementById('result-title');
const resultMessage = document.getElementById('result-message');
const currentDate = document.getElementById('current-date');
const progressPercent = document.getElementById('progress-percent');
const escapeHint = document.getElementById('escape-hint');
const resolveBtn = document.getElementById('resolve-btn');
const confettiCanvas = document.getElementById('confetti-canvas');

let ctx = null;
let confettiParticles = [];
let isAnimating = false;
let bsodRevealed = false;
let isFullscreen = false;

// ===== Fullscreen Management =====
function enterFullscreen() {
    const elem = document.documentElement;

    const requestFS = elem.requestFullscreen ||
        elem.webkitRequestFullscreen ||
        elem.msRequestFullscreen;

    if (requestFS) {
        requestFS.call(elem).then(() => {
            isFullscreen = true;
        }).catch(err => {
            console.log('Fullscreen request failed:', err);
        });
    }
}

// Track fullscreen changes
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;

    // If we exited fullscreen but haven't finished the prank, re-enter
    if (!isFullscreen && !bsodRevealed) {
        // Show hint that they need to click first
        setTimeout(enterFullscreen, 100);
    }
});

// ===== BSOD Progress Animation =====
function animateProgress() {
    let progress = 0;
    const targetProgress = 100;
    const duration = 8000;
    const startTime = Date.now();

    function updateProgress() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(Math.floor((elapsed / duration) * targetProgress), targetProgress);
        if (progressPercent) progressPercent.textContent = progress;

        if (progress < targetProgress) {
            const delay = Math.random() > 0.9 ? 500 : 50;
            setTimeout(updateProgress, delay);
        } else {
            // Show resolve button at 100%
            if (resolveBtn) resolveBtn.classList.remove('hidden');
        }
    }

    updateProgress();
}

// ===== Reveal Prank =====
function revealPrank() {
    if (bsodRevealed) return;
    bsodRevealed = true;

    bsodScreen.classList.add('hidden');
    prankScreen.classList.remove('hidden');

    // Re-enter fullscreen immediately for the prank screen
    setTimeout(() => {
        enterFullscreen();
    }, 50);

    // Initialize confetti canvas after prank screen is visible
    if (confettiCanvas) {
        ctx = confettiCanvas.getContext('2d');
        resizeCanvas();
    }

    // Play reveal sound
    playRevealSound();

    // Launch confetti
    setTimeout(launchConfetti, 300);
}

// ===== Confetti System =====
class ConfettiParticle {
    constructor() {
        this.x = Math.random() * confettiCanvas.width;
        this.y = Math.random() * confettiCanvas.height - confettiCanvas.height;
        this.size = Math.random() * 10 + 5;
        this.speedY = Math.random() * 3 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 10 - 5;
        this.color = this.getRandomColor();
        this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    }

    getRandomColor() {
        const colors = [
            '#ff6b6b', '#ff8e53', '#ffd93d', '#4ade80',
            '#4d79ff', '#c44dff', '#ff6b9d', '#00d4ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        this.speedX += Math.random() * 0.2 - 0.1;
        this.speedX = Math.max(-2, Math.min(2, this.speedX));
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.fillStyle = this.color;

        if (this.shape === 'rect') {
            ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    isOffScreen() {
        return this.y > confettiCanvas.height + 20;
    }
}

function resizeCanvas() {
    if (confettiCanvas) {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
}

function launchConfetti() {
    if (!ctx) return;

    for (let i = 0; i < 150; i++) {
        confettiParticles.push(new ConfettiParticle());
    }

    if (!isAnimating) {
        isAnimating = true;
        animateConfetti();
    }
}

function animateConfetti() {
    if (!ctx) return;

    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiParticles.forEach((particle, index) => {
        particle.update();
        particle.draw();

        if (particle.isOffScreen()) {
            confettiParticles.splice(index, 1);
        }
    });

    if (confettiParticles.length > 0) {
        requestAnimationFrame(animateConfetti);
    } else {
        isAnimating = false;
    }
}

// ===== Sound Effects =====
function playRevealSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [523.25, 659.25, 783.99, 1046.50];

        notes.forEach((freq, i) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + i * 0.1);
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + i * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.1 + 0.3);

            oscillator.start(audioContext.currentTime + i * 0.1);
            oscillator.stop(audioContext.currentTime + i * 0.1 + 0.3);
        });
    } catch (e) { }
}

function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) { }
}

// ===== Event Handlers =====
function handleConfirm() {
    const selectedValue = punishmentSelect.value;
    const [emoji, title, message] = selectedValue.split('|');

    resultEmoji.textContent = emoji;
    resultTitle.textContent = title;
    resultMessage.textContent = message;

    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    currentDate.textContent = now.toLocaleDateString('fr-FR', options);

    prankCard.classList.add('hidden');
    resultCard.classList.remove('hidden');

    setTimeout(() => {
        launchConfetti();
        playSuccessSound();
    }, 300);
}

function handleBack() {
    resultCard.classList.add('hidden');
    prankCard.classList.remove('hidden');
}

// ===== BSOD Interaction =====
// Click anywhere on BSOD to reveal (after entering fullscreen)
function handleBsodClick(e) {
    // Ignore clicks on the prank screen controls
    if (bsodRevealed) return;

    if (bsodScreen && !bsodScreen.classList.contains('hidden')) {
        if (!isFullscreen) {
            // First click: enter fullscreen
            enterFullscreen();
        } else {
            // Already in fullscreen: reveal the prank
            revealPrank();
        }
    }
}

function handleKeydown(e) {
    // On BSOD screen
    if (!bsodRevealed && bsodScreen && !bsodScreen.classList.contains('hidden')) {
        // Space or Enter to reveal (if in fullscreen)
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (isFullscreen) {
                revealPrank();
            } else {
                enterFullscreen();
            }
        }

        // Block F keys, Alt, Ctrl
        if (e.key.startsWith('F') || e.altKey || e.ctrlKey) {
            e.preventDefault();
        }
    }

    // After reveal: Enter to confirm punishment
    if (bsodRevealed && prankCard && !prankCard.classList.contains('hidden')) {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    }
}

// ===== Initialize =====
function init() {
    // Update hint text
    if (escapeHint) {
        escapeHint.innerHTML = 'Cliquez n\'importe où ou appuyez sur <kbd>Espace</kbd> pour continuer...';
    }

    // Click to enter fullscreen and then reveal
    document.addEventListener('click', handleBsodClick);
    document.addEventListener('keydown', handleKeydown);

    // Try to auto-enter fullscreen (may need user gesture)
    setTimeout(enterFullscreen, 500);

    // Setup canvas resize
    window.addEventListener('resize', resizeCanvas);

    // Prank screen event listeners
    if (confirmBtn) confirmBtn.addEventListener('click', handleConfirm);
    if (backBtn) backBtn.addEventListener('click', handleBack);
    if (resolveBtn) resolveBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering bsodClick
        revealPrank();
    });

    // Start progress animation
    animateProgress();

    // Prevent right-click context menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
