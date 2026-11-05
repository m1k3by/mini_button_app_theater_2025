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
        { name: 'Secret Song', url: 'secret_song.mp3', startTime: 0 },
        { name: 'Französische Musik', url: 'franzoesische_musik.mp3', startTime: 0 },
        { name: 'Theatergong', url: 'theatergong.mp3', startTime: 0 },
        { name: 'Meer & Möwen', url: 'meer_moewen.mp3', startTime: 0 },
        { name: 'Yoga Musik', url: 'yoga_musik.mp3', startTime: 0 },
        { name: 'Rückwärts-Piepen Truck', url: 'rueckwaerts_piepen.mp3', startTime: 0 },
        { name: 'Zuckerpuppe', url: 'zuckerpuppe.mp3', startTime: 0 },
        { name: 'Love to Love You Baby', url: 'love_to_love_you_baby.mp3', startTime: 0 },
        { name: 'Warnsignal', url: 'warnsignal.mp3', startTime: 0 },
        { name: 'Dinner-Marsch', url: 'dinner_marsch.mp3', startTime: 0 }
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
    audios = config.sounds.map((sound, index) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.src = sound.url || '';
        // Start-time slider reaches exactly to the end of the song
        audio.addEventListener('loadedmetadata', () => {
            const slider = document.getElementById(`sound${index + 1}-start`);
            if (slider && isFinite(audio.duration)) slider.max = Math.floor(audio.duration);
        });
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

    // Undo any unsaved drag: card N (by its input ids) back to position N
    const body = document.querySelector('.modal-body');
    const saveBtn = document.getElementById('saveBtn');
    config.sounds.forEach((_, index) => {
        body.insertBefore(document.getElementById(`sound${index + 1}-name`).closest('.setting-group'), saveBtn);
    });
    renumberCards();

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

// Position number on each settings card
function renumberCards() {
    document.querySelectorAll('.setting-group .drag-num').forEach((num, i) => {
        num.textContent = i + 1;
    });
}

// Drag a settings card by its handle (pointer events: works for finger and mouse)
function initCardDrag() {
    const body = document.querySelector('.modal-body');
    const scroller = document.getElementById('settingsModal');

    // The DOM stays untouched while dragging: the card follows the finger via
    // transform, the others slide aside (CSS transition). The DOM is reordered
    // only once, after the card has glided into its slot.
    let card = null, byMouse = false, cards, from, to, step, startY, startScroll, settling = false;

    const start = (handle, clientY) => {
        if (settling) return;
        card = handle.closest('.setting-group');
        cards = [...body.querySelectorAll('.setting-group')];
        from = to = cards.indexOf(card);
        step = cards[1].offsetTop - cards[0].offsetTop; // all cards are the same height
        startY = clientY;
        startScroll = scroller.scrollTop;
        card.classList.add('dragging');
    };

    const move = (clientY) => {
        if (!card) return;

        // Scroll the modal when dragging near the top/bottom edge
        if (clientY < 60) scroller.scrollBy(0, -15);
        else if (clientY > window.innerHeight - 60) scroller.scrollBy(0, 15);

        const dy = clientY - startY + scroller.scrollTop - startScroll;
        card.style.transform = `translateY(${dy}px) scale(1.03)`;

        // Neighbour gives way once the card covers more than half of it
        to = Math.max(0, Math.min(cards.length - 1, from + Math.round(dy / step)));
        cards.forEach((c, i) => {
            if (c === card) return;
            const shift = (from < to && i > from && i <= to) ? -step
                        : (from > to && i < from && i >= to) ? step : 0;
            c.style.transform = shift ? `translateY(${shift}px)` : '';
        });

        // Numbers show the position the cards would get on drop
        const order = cards.filter(c => c !== card);
        order.splice(to, 0, card);
        order.forEach((c, i) => { c.querySelector('.drag-num').textContent = i + 1; });
    };

    const drop = () => {
        if (!card) return;
        const done = card;
        card = null;
        settling = true;

        // Glide into the free slot, then commit the new order to the DOM
        done.classList.remove('dragging');
        done.style.transform = `translateY(${(to - from) * step}px)`;
        setTimeout(() => {
            const order = cards.filter(c => c !== done);
            order.splice(to, 0, done);
            body.classList.add('no-anim');
            order.forEach(c => { body.insertBefore(c, document.getElementById('saveBtn')); c.style.transform = ''; });
            body.offsetHeight; // apply without transition
            body.classList.remove('no-anim');
            renumberCards();
            settling = false;
        }, 250);
    };

    document.querySelectorAll('.drag-handle').forEach(handle => {
        // Finger: touch events. iOS Safari ignores touch-action:none, so only
        // preventDefault on a non-passive touchstart stops the page from scrolling
        // (which would cancel the drag). Touch events also keep their target when
        // the card is moved in the DOM.
        handle.addEventListener('touchstart', (e) => {
            e.preventDefault();
            start(handle, e.touches[0].clientY);
            byMouse = false;
        }, { passive: false });
        handle.addEventListener('touchmove', (e) => {
            e.preventDefault();
            move(e.touches[0].clientY);
        }, { passive: false });
        handle.addEventListener('touchend', drop);
        handle.addEventListener('touchcancel', drop);

        // Mouse: pointer events (touch already handled above)
        handle.addEventListener('pointerdown', (e) => {
            if (e.pointerType !== 'mouse') return;
            e.preventDefault();
            start(handle, e.clientY);
            byMouse = true;
        });
    });

    // On document, not the handle: moving the card in the DOM drops pointer capture
    document.addEventListener('pointermove', (e) => {
        if (e.pointerType === 'mouse' && byMouse) move(e.clientY);
    });
    document.addEventListener('pointerup', (e) => {
        if (e.pointerType === 'mouse' && byMouse) drop();
    });
}

// Save settings
function saveSettings() {
    // Update config with form values
    // Read cards in their on-screen order: that order becomes the button order
    config.sounds = [...document.querySelectorAll('.setting-group')].map((group, index) => ({
        name: group.querySelector('input[type="text"]').value || `Sound ${index + 1}`,
        url: group.querySelector('input[type="url"]').value || '',
        startTime: parseFloat(group.querySelector('input[type="range"]').value) || 0
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

    initCardDrag();

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
