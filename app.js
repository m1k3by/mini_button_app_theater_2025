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
    const defaultUrls = defaultConfig.sounds.map(s => s.url);
    const fresh = () => ({ sounds: structuredClone(defaultConfig.sounds), seen: defaultUrls });
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return fresh();
        const parsed = JSON.parse(saved);
        // Default songs added to the app after the user saved show up once.
        // `seen` stops deleted default songs from coming back.
        // Configs from before `seen` knew the defaults up to their own length.
        const seen = parsed.seen || defaultUrls.slice(0, parsed.sounds.length);
        parsed.sounds.push(...structuredClone(defaultConfig.sounds.filter(s => !seen.includes(s.url))));
        parsed.seen = defaultUrls;
        return parsed;
    } catch (e) {
        console.error('Error loading config:', e);
        return fresh();
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

// Uploaded songs live on this device only (IndexedDB, there is no server).
// In the config they appear as url 'upload:<id>'.
const uploadDB = new Promise((resolve, reject) => {
    const req = indexedDB.open('theater_uploads', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('files');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
});

function uploads(mode, fn) {
    return uploadDB.then(db => new Promise((resolve, reject) => {
        const tx = db.transaction('files', mode);
        const req = fn(tx.objectStore('files'));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
    }));
}

const isUpload = (url) => (url || '').startsWith('upload:');
const blobUrls = {}; // id -> Promise<object URL>

function uploadSrc(url) {
    const id = url.slice(7);
    return blobUrls[id] ||= uploads('readonly', s => s.get(id)).then(blob => blob ? URL.createObjectURL(blob) : '');
}

// Delete stored files no song refers to anymore (deleted songs)
function dropUnusedUploads() {
    const used = config.sounds.filter(s => isUpload(s.url)).map(s => s.url.slice(7));
    uploads('readonly', s => s.getAllKeys()).then(keys => {
        keys.filter(k => !used.includes(k)).forEach(k => {
            uploads('readwrite', s => s.delete(k));
            delete blobUrls[k];
        });
    }).catch(e => console.error('Upload cleanup failed:', e));
}

// One button per song
function renderButtons() {
    document.getElementById('buttonsGrid').replaceChildren(...config.sounds.map((sound, index) => {
        const btn = document.createElement('button');
        btn.className = 'sound-btn';
        const label = document.createElement('span');
        label.className = 'btn-label';
        label.textContent = sound.name || `Sound ${index + 1}`;
        btn.append(label);
        // Must be 'click'. A touch 'pointerdown' is not a user activation,
        // so mobile browsers block play() on it.
        btn.addEventListener('click', () => playSound(index));
        return btn;
    }));
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
        if (isUpload(sound.url)) {
            uploadSrc(sound.url).then(src => { audio.src = src; audio.load(); });
        } else if (sound.url) {
            audio.src = sound.url;
            audio.load();
        }
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

// One settings card per song. Rebuilt on every open, which also undoes unsaved drags.
function renderCards() {
    document.getElementById('cardList').replaceChildren(...config.sounds.map((sound, index) => {
        const n = index + 1;
        const card = document.createElement('div');
        card.className = 'setting-group';
        card.innerHTML = `
            <div class="drag-head">
                <span class="drag-handle" title="Ziehen zum Verschieben">⠿</span>
                <span class="drag-num">${n}</span>
                <button type="button" class="delete-btn">Löschen</button>
            </div>
            <label for="sound${n}-name">Name:</label>
            <input type="text" id="sound${n}-name" placeholder="Sound ${n}">
            <label for="sound${n}-url">URL:</label>
            <input type="url" id="sound${n}-url" placeholder="https://...">
            <label for="sound${n}-start">Startzeit: <span class="start-time">0:00</span></label>
            <input type="range" id="sound${n}-start" min="0" step="0.5">`;
        card.querySelector('[type=text]').value = sound.name || '';

        const url = card.querySelector('[type=url]');
        if (isUpload(sound.url)) {
            card.dataset.upload = sound.url;
            url.value = 'Hochgeladene Datei';
            url.disabled = true;
        } else {
            url.value = sound.url || '';
        }

        // Max before value, or the value gets clamped
        const slider = card.querySelector('[type=range]');
        const duration = audios[index] && audios[index].duration;
        slider.max = isFinite(duration) ? Math.floor(duration) : Math.max(300, sound.startTime || 0);
        slider.value = sound.startTime || 0;
        card.querySelector('.start-time').textContent = formatTime(sound.startTime || 0);
        return card;
    }));
}

// Cards in their on-screen order: that order becomes the button order
function readCards() {
    return [...document.querySelectorAll('#cardList .setting-group')].map((group, index) => ({
        name: group.querySelector('[type=text]').value || `Sound ${index + 1}`,
        url: group.dataset.upload || group.querySelector('[type=url]').value || '',
        startTime: parseFloat(group.querySelector('[type=range]').value) || 0
    }));
}

// Store a new song list and rebuild everything that depends on it
function applySounds(sounds) {
    config.sounds = sounds;
    if (!saveConfig(config)) {
        alert('Fehler beim Speichern der Einstellungen!');
        return false;
    }
    stopSound();
    renderButtons();
    preloadAudios(); // URLs may have changed
    dropUnusedUploads();
    return true;
}

// Open settings modal
function openSettings() {
    renderCards();
    document.getElementById('settingsModal').classList.add('active');
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

// Delete needs two taps: the first arms the button, the second deletes for real
function handleDelete(btn) {
    if (!btn.classList.contains('confirm')) {
        btn.classList.add('confirm');
        btn.textContent = 'Wirklich löschen?';
        setTimeout(() => {
            btn.classList.remove('confirm');
            btn.textContent = 'Löschen';
        }, 3000);
        return;
    }
    btn.closest('.setting-group').remove();
    applySounds(readCards()); // saved right away, together with the other card edits
    renderCards();
}

// Upload: file picker or drag and drop. Each file becomes a new song at the end.
async function addFiles(files) {
    files = [...files];
    if (!files.length) return;
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();

    const settingsOpen = document.getElementById('settingsModal').classList.contains('active');
    const sounds = settingsOpen ? readCards() : config.sounds;
    try {
        // One after another: cleanup must never see a stored file before its song
        for (const file of files) {
            const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
            await uploads('readwrite', s => s.put(file, id));
            sounds.push({ name: file.name.replace(/\.[^.]+$/, ''), url: 'upload:' + id, startTime: 0 });
        }
    } catch (e) {
        console.error('Upload failed:', e);
        alert('Fehler beim Hochladen: ' + e.message);
    }
    applySounds(sounds);
    renderCards();
    if (settingsOpen) document.getElementById('cardList').lastElementChild.scrollIntoView({ block: 'center' });
}

// Drag a settings card by its handle (touch for fingers, pointer events for the mouse)
function initCardDrag() {
    const list = document.getElementById('cardList');
    const scroller = document.getElementById('settingsModal');

    // The DOM stays untouched while dragging: the card follows the finger via
    // transform, the others slide aside (CSS transition). The DOM is reordered
    // only once, after the card has glided into its slot.
    let card = null, byMouse = false, cards, from, to, step, startY, startScroll, settling = false;

    const start = (handle, clientY) => {
        if (settling) return;
        cards = [...list.children];
        if (cards.length < 2) return;
        card = handle.closest('.setting-group');
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
            list.classList.add('no-anim');
            order.forEach(c => { list.append(c); c.style.transform = ''; });
            list.offsetHeight; // apply without transition
            list.classList.remove('no-anim');
            renumberCards();
            settling = false;
        }, 250);
    };

    // Delegated on the list: cards are re-rendered, the list stays.
    // Finger: iOS Safari ignores touch-action:none, so only preventDefault on a
    // non-passive touchstart stops the page from scrolling (which would cancel
    // the drag). Touch events keep their target when the card moves in the DOM.
    list.addEventListener('touchstart', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle) return;
        e.preventDefault();
        byMouse = false;
        start(handle, e.touches[0].clientY);
    }, { passive: false });
    list.addEventListener('touchmove', (e) => {
        if (!card || byMouse) return;
        e.preventDefault();
        move(e.touches[0].clientY);
    }, { passive: false });
    list.addEventListener('touchend', () => { if (!byMouse) drop(); });
    list.addEventListener('touchcancel', () => { if (!byMouse) drop(); });

    // Mouse: pointer events (touch already handled above)
    list.addEventListener('pointerdown', (e) => {
        const handle = e.target.closest('.drag-handle');
        if (!handle || e.pointerType !== 'mouse') return;
        e.preventDefault();
        byMouse = true;
        start(handle, e.clientY);
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
    if (applySounds(readCards())) {
        closeSettings();
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    renderButtons();
    preloadAudios();

    // Settings button
    document.getElementById('settingsBtn').addEventListener('click', openSettings);

    // Close button
    document.getElementById('closeBtn').addEventListener('click', closeSettings);

    // Save button
    document.getElementById('saveBtn').addEventListener('click', saveSettings);

    const list = document.getElementById('cardList');

    // Time sliders - update display in real-time
    list.addEventListener('input', (e) => {
        if (e.target.type !== 'range') return;
        e.target.closest('.setting-group').querySelector('.start-time').textContent = formatTime(parseFloat(e.target.value));
    });

    // Delete buttons
    list.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-btn');
        if (btn) handleDelete(btn);
    });

    // Upload via file picker (on the phone this opens its file browser)
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', () => {
        addFiles(fileInput.files);
        fileInput.value = '';
    });

    // Upload via drag and drop: files can be dropped anywhere on the page
    const zone = document.getElementById('uploadZone');
    window.addEventListener('dragover', (e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault(); // otherwise the browser opens the file itself
        zone.classList.add('dragover');
    });
    window.addEventListener('dragleave', (e) => {
        if (!e.relatedTarget) zone.classList.remove('dragover');
    });
    window.addEventListener('drop', (e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        zone.classList.remove('dragover');
        addFiles(e.dataTransfer.files);
    });

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
