// Storage key
const STORAGE_KEY = 'theater_sounds_config';

// Audio element
let currentAudio = null;

// Default configuration
const defaultConfig = {
    sounds: [
        { name: 'Theatergong', url: 'Theatergong.mp3', startTime: 0 },
        { name: 'Klingelton', url: 'Klingelton.mp3', startTime: 0 },
        { name: 'Magic Mike', url: 'magic_mike.mp3', startTime: 0 },
        { name: 'Sexbomb', url: 'sexbomb.mp3', startTime: 0 }
    ]
};

// Load configuration from localStorage
function loadConfig() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : defaultConfig;
    } catch (e) {
        console.error('Error loading config:', e);
        return defaultConfig;
    }
}

// Save configuration to localStorage
function saveConfig(config) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        return true;
    } catch (e) {
        console.error('Error saving config:', e);
        return false;
    }
}

// Initialize app
let config = loadConfig();

// Update button labels
function updateButtonLabels() {
    config.sounds.forEach((sound, index) => {
        const label = document.getElementById(`label${index + 1}`);
        if (label) {
            label.textContent = sound.name || `Sound ${index + 1}`;
        }
    });
}

// Play/Stop sound (Toggle)
function playSound(index) {
    const sound = config.sounds[index];
    const buttons = document.querySelectorAll('.sound-btn');
    const button = buttons[index];
    
    // If this button is already playing, stop it
    if (button.classList.contains('playing')) {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        removePlayingState();
        return;
    }
    
    if (!sound.url) {
        alert('Bitte zuerst eine Sound-URL in den Einstellungen konfigurieren!');
        return;
    }

    // Stop any currently playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        removePlayingState();
    }

    // Create new audio element
    currentAudio = new Audio(sound.url);
    const startTime = sound.startTime || 0;
    
    // Add playing state to button
    button.classList.add('playing');

    // Remove playing state when audio ends
    currentAudio.addEventListener('ended', () => {
        removePlayingState();
        currentAudio = null;
    });

    // Handle errors
    currentAudio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        alert('Fehler beim Laden des Sounds!');
        removePlayingState();
        currentAudio = null;
    });

    // Play and seek when ready
    currentAudio.addEventListener('loadedmetadata', () => {
        try {
            console.log(`Audio duration: ${currentAudio.duration}, Start time: ${startTime}`);
            if (startTime > 0 && startTime < currentAudio.duration) {
                currentAudio.currentTime = startTime;
                console.log(`Seeked to ${startTime}s`);
            } else if (startTime >= currentAudio.duration) {
                console.warn(`Start time ${startTime}s exceeds duration ${currentAudio.duration}s`);
            }
        } catch (e) {
            console.error('Could not seek:', e);
        }
    }, { once: true });

    // Fallback: try to seek after a short delay if metadata doesn't load
    setTimeout(() => {
        if (currentAudio && !currentAudio.paused) {
            try {
                if (startTime > 0 && currentAudio.currentTime < 1) {
                    currentAudio.currentTime = startTime;
                    console.log(`Fallback seek to ${startTime}s`);
                }
            } catch (e) {
                console.error('Fallback seek failed:', e);
            }
        }
    }, 200);

    // Start playing
    currentAudio.play().catch(error => {
        console.error('Play error:', error);
        alert('Fehler beim Abspielen: ' + error.message);
        removePlayingState();
        currentAudio = null;
    });
}

// Stop sound
function stopSound() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
        removePlayingState();
    }
}

// Remove playing state from all buttons
function removePlayingState() {
    document.querySelectorAll('.sound-btn').forEach(btn => {
        btn.classList.remove('playing');
    });
}

// Format seconds to MM:SS
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Update time display for slider
function updateTimeDisplay(index, value) {
    const display = document.getElementById(`sound${index + 1}-time`);
    if (display) {
        display.textContent = formatTime(value);
    }
}

// Open settings modal
function openSettings() {
    const modal = document.getElementById('settingsModal');
    
    // Populate fields with current config
    config.sounds.forEach((sound, index) => {
        document.getElementById(`sound${index + 1}-name`).value = sound.name || '';
        document.getElementById(`sound${index + 1}-url`).value = sound.url || '';
        document.getElementById(`sound${index + 1}-start`).value = sound.startTime || 0;
        updateTimeDisplay(index, sound.startTime || 0);
    });
    
    modal.classList.add('active');
}

// Close settings modal
function closeSettings() {
    const modal = document.getElementById('settingsModal');
    modal.classList.remove('active');
}

// Save settings
function saveSettings() {
    // Update config with form values
    config.sounds = config.sounds.map((sound, index) => ({
        name: document.getElementById(`sound${index + 1}-name`).value || `Sound ${index + 1}`,
        url: document.getElementById(`sound${index + 1}-url`).value || '',
        startTime: parseFloat(document.getElementById(`sound${index + 1}-start`).value) || 0
    }));

    // Save to localStorage
    if (saveConfig(config)) {
        updateButtonLabels();
        closeSettings();
        
        // Show brief success feedback
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Gespeichert!';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 1500);
    } else {
        alert('Fehler beim Speichern der Einstellungen!');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update button labels on load
    updateButtonLabels();

    // Sound buttons
    document.querySelectorAll('.sound-btn').forEach((btn, index) => {
        btn.addEventListener('click', () => playSound(index));
    });

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);

    // Close button
    document.getElementById('closeBtn').addEventListener('click', closeSettings);

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    // Time sliders - update display in real-time
    for (let i = 1; i <= 4; i++) {
        const slider = document.getElementById(`sound${i}-start`);
        slider.addEventListener('input', (e) => {
            updateTimeDisplay(i - 1, parseFloat(e.target.value));
        });
    }

    // Close modal when clicking outside
    document.getElementById('settingsModal').addEventListener('click', (e) => {
        if (e.target.id === 'settingsModal') {
            closeSettings();
        }
    });

    // Prevent scrolling issues on iOS
    document.body.addEventListener('touchmove', (e) => {
        if (e.target.closest('.modal-content')) {
            e.stopPropagation();
        }
    }, { passive: true });
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (currentAudio) {
        currentAudio.pause();
    }
});
