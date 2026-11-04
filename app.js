// Storage key
const STORAGE_KEY = 'theater_sounds_config_v2'; // v2: neue Songs, alte gespeicherte Konfig ignorieren

// Audio element
let currentAudio = null;

// Default configuration
const defaultConfig = {
    sounds: [
        { name: 'Crash', url: 'crash.mp3', startTime: 0 },
        { name: 'Traumschiff', url: 'traumschiff.mp3', startTime: 0 },
        { name: 'Airhorn', url: 'airhorn.mp3', startTime: 0 },
        { name: 'Shiphorn', url: 'shiphorn.mp3', startTime: 0 },
        { name: 'Time to say goodbye', url: 'time_to_say_goodbye.mp3', startTime: 0 },
        { name: 'Seemann lass träumen', url: 'seemann_lass_traeumen.mp3', startTime: 0 },
        { name: 'Pfurz', url: 'pfurz.mp3', startTime: 0 },
        { name: 'Kack', url: 'kack.mp3', startTime: 0 },
        { name: 'Secret Song', url: 'secret_song.mp3', startTime: 0 }
    ]
};

// Load configuration from localStorage
function loadConfig() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return defaultConfig;
        const parsed = JSON.parse(saved);
        // Buttons added after the user saved: fill them from the defaults
        parsed.sounds.push(...defaultConfig.sounds.slice(parsed.sounds.length));
        return parsed;
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

    // Reuse the preloaded element: no new download, no new decode
    const audio = audios[index];
    currentAudio = audio;
    button.classList.add('playing');

    // Seeking before play() works once metadata is loaded (it is, after preload).
    // If not loaded yet, the browser applies currentTime as soon as it can.
    try {
        audio.currentTime = sound.startTime || 0;
    } catch (e) {
        console.error('Could not seek:', e);
    }

    audio.play().catch(error => {
        if (currentAudio !== audio) return; // already switched to another sound
        console.error('Play error:', error);
        alert('Fehler beim Abspielen: ' + error.message);
        removePlayingState();
        currentAudio = null;
    });
}

// Preloaded audio elements, one per button
let audios = [];

function preloadAudios() {
    audios.forEach(a => a.pause());
    audios = config.sounds.map((sound) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = sound.url || '';
        audio.addEventListener('ended', () => {
            if (currentAudio === audio) {
                removePlayingState();
                currentAudio = null;
            }
        });
        audio.addEventListener('error', (e) => {
            if (!sound.url || currentAudio !== audio) return; // only complain when the user is waiting for it
            console.error('Audio error:', e);
            alert('Fehler beim Laden des Sounds!');
            removePlayingState();
            currentAudio = null;
        });
        if (sound.url) audio.load();
        return audio;
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
        stopSound();
        preloadAudios(); // URLs may have changed
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
    preloadAudios();

    // Sound buttons: must be 'click'. A touch 'pointerdown' is not a user
    // activation, so mobile browsers block play() on it.
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
    for (let i = 1; i <= config.sounds.length; i++) {
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
