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
        { name: 'Sexbomp', url: 'sexbomp.mp3', startTime: 0 }
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

// Play sound
function playSound(index) {
    const sound = config.sounds[index];
    
    if (!sound.url) {
        alert('Bitte zuerst eine Sound-URL in den Einstellungen konfigurieren!');
        return;
    }

    // Stop current audio if playing
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        removePlayingState();
    }

    // Create new audio element
    currentAudio = new Audio(sound.url);
    currentAudio.currentTime = sound.startTime || 0;
    
    // Add playing state to button
    const buttons = document.querySelectorAll('.sound-btn');
    buttons[index].classList.add('playing');

    // Remove playing state when audio ends
    currentAudio.addEventListener('ended', () => {
        removePlayingState();
        currentAudio = null;
    });

    // Play audio
    currentAudio.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Fehler beim Abspielen des Sounds. Bitte URL überprüfen!');
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

// Open settings modal
function openSettings() {
    const modal = document.getElementById('settingsModal');
    
    // Populate fields with current config
    config.sounds.forEach((sound, index) => {
        document.getElementById(`sound${index + 1}-name`).value = sound.name || '';
        document.getElementById(`sound${index + 1}-url`).value = sound.url || '';
        document.getElementById(`sound${index + 1}-start`).value = sound.startTime || 0;
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
        saveBtn.style.background = '#15803d';
        
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.background = '';
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

    // Stop button
    document.getElementById('stopBtn').addEventListener('click', stopSound);

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);

    // Close button
    document.getElementById('closeBtn').addEventListener('click', closeSettings);

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSettings);

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
