// Avatar editor for 2D_Avatar_Project
const config = {
    avatarPath: 'avatars/',
    defaultAvatars: [
        { id: 1, filename: 'professional-1.png', alt: 'Professional Avatar 1' },
        { id: 2, filename: 'professional-2.png', alt: 'Professional Avatar 2' },
        { id: 3, filename: 'professional-3.png', alt: 'Professional Avatar 3' },
        { id: 4, filename: 'professional-4.png', alt: 'Professional Avatar 4' }
    ],
    storageKey: 'selectedAvatar',
    maxImageSize: 1200,
    imageQuality: 0.9,
    compressFormat: 'image/png'
};

// Elements
const container = document.getElementById('avatar-container');
const canvas = document.getElementById('editor-canvas');
const ctx = canvas.getContext('2d');
const filterSelect = document.getElementById('filter-select');
const zoomRange = document.getElementById('zoom-range');
const saveButton = document.getElementById('save-selection');
const saveAsAmyButton = document.getElementById('save-as-amy');
const shareButton = document.getElementById('share-avatar');
const cameraInput = document.getElementById('camera-input');
const fileInput = document.getElementById('file-input');
const selectedLabel = document.getElementById('selected-avatar');
const installPrompt = document.getElementById('install-prompt');
const installButton = document.getElementById('install-button');

// State
let state = {
    images: [], // { id, blob, url }
    selected: null, // { id, url }
    zoom: 1,
    filter: 'none',
    offsetX: 0,
    offsetY: 0
};

// initialize
function init() {
    renderDefaultAvatars();
    setupEvents();
    drawPlaceholder();
    loadSavedSelection();
}

function drawPlaceholder() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#f5cc42';
    ctx.beginPath();
    ctx.arc(canvas.width/2, canvas.height*0.35, 70, 0, Math.PI*2);
    ctx.fill();
}

function renderDefaultAvatars() {
    config.defaultAvatars.forEach(a => {
        const div = document.createElement('div');
        div.className = 'avatar-item';
        div.tabIndex = 0;

        const img = document.createElement('img');
        img.src = `${config.avatarPath}${a.filename}`;
        img.alt = a.alt;
        img.dataset.id = a.id;

        img.onload = () => {
            // keep small cache of default avatars as URLs
            state.images.push({ id: a.id, url: img.src });
        };

        img.onerror = () => {
            img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="100%" height="100%" fill="%23ddd"/%3E%3Ctext x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23666">Avatar</text%3E%3C/svg%3E';
            state.images.push({ id: a.id, url: img.src });
        };

        div.appendChild(img);
        container.appendChild(div);

        div.addEventListener('click', () => selectAvatar(a.id, img.src));
        div.addEventListener('keydown', (e) => { if (e.key === 'Enter') selectAvatar(a.id, img.src); });
    });
}

function setupEvents() {
    fileInput?.addEventListener('change', handleFileSelect);
    cameraInput?.addEventListener('change', handleFileSelect);
    filterSelect?.addEventListener('change', (e) => { state.filter = e.target.value; drawSelected(); });
    zoomRange?.addEventListener('input', (e) => { state.zoom = parseFloat(e.target.value); drawSelected(); });
    saveButton?.addEventListener('click', saveSelection);
    saveAsAmyButton?.addEventListener('click', downloadPNG);
    shareButton?.addEventListener('click', shareAvatar);

    // PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        state.deferredPrompt = e;
        if (installPrompt) installPrompt.style.display = 'block';
    });
    installButton?.addEventListener('click', async () => {
        if (!state.deferredPrompt) return;
        state.deferredPrompt.prompt();
        const { outcome } = await state.deferredPrompt.userChoice;
        if (outcome === 'accepted') installPrompt.style.display = 'none';
        state.deferredPrompt = null;
    });
}

function loadSavedSelection() {
    try {
        const saved = localStorage.getItem(config.storageKey);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.url) selectAvatar(parsed.id || 'saved', parsed.url, true);
        }
    } catch (e) { /* ignore */ }
}

// File handling & optimization
async function optimizeImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                // Resize if necessary
                let { width, height } = img;
                const max = config.maxImageSize;
                if (width > max || height > max) {
                    if (width > height) {
                        height = Math.round((height * max) / width);
                        width = max;
                    } else {
                        width = Math.round((width * max) / height);
                        height = max;
                    }
                }

                const c = document.createElement('canvas');
                c.width = width; c.height = height;
                const cctx = c.getContext('2d');
                cctx.imageSmoothingEnabled = true;
                cctx.imageSmoothingQuality = 'high';
                cctx.drawImage(img, 0, 0, width, height);
                c.toBlob((blob) => resolve({ blob, url: URL.createObjectURL(blob) }), 'image/png');
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleFileSelect(e) {
    const files = e.target.files;
    if (!files || !files.length) return;
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        try {
            const { blob, url } = await optimizeImage(file);
            const id = Date.now() + '-' + Math.random().toString(36).slice(2,9);
            state.images.push({ id, blob, url });

            // add to grid
            const div = document.createElement('div');
            div.className = 'avatar-item';
            const img = document.createElement('img');
            img.src = url; img.alt = file.name; img.dataset.id = id;
            div.appendChild(img);
            container.insertBefore(div, container.firstChild);
            div.addEventListener('click', () => selectAvatar(id, url));

            selectAvatar(id, url);
        } catch (err) {
            console.error('file processing error', err);
            alert('Could not process that image. Try a different one.');
        }
    }
}

function selectAvatar(id, url, skipDraw = false) {
    state.selected = { id, url };
    selectedLabel.textContent = `Selected: ${id}`;
    // highlight selection in grid
    Array.from(container.querySelectorAll('.avatar-item')).forEach(item => item.classList.remove('selected'));
    const imgEl = container.querySelector(`img[data-id='${id}']`);
    if (imgEl && imgEl.parentElement) imgEl.parentElement.classList.add('selected');
    if (!skipDraw) drawSelected();
}

function drawSelected() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // background
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--surface-color') || '#1a1a1a';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    if (!state.selected) { drawPlaceholder(); return; }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        const cx = canvas.width/2, cy = canvas.height/2;
        // compute draw size depending on zoom
        const base = Math.min(canvas.width, canvas.height) * 0.9;
        const drawSize = base * state.zoom;

        ctx.save();
        // draw with filter
        ctx.filter = cssFilterFor(state.filter);

        // draw image centered
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(canvas.width, canvas.height)/2 - 6, 0, Math.PI*2);
        ctx.closePath();
        ctx.clip();

        // compute source draw offsets to center crop
        const sx = Math.max(0, (img.width - drawSize) / 2 - state.offsetX);
        const sy = Math.max(0, (img.height - drawSize) / 2 - state.offsetY);

        ctx.drawImage(img, sx, sy, drawSize, drawSize, cx - drawSize/2, cy - drawSize/2, drawSize, drawSize);

        ctx.restore();

        // draw circular border
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#f5cc42';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.min(canvas.width, canvas.height)/2 - 6, 0, Math.PI*2);
        ctx.stroke();
    };
    img.onerror = () => console.warn('failed to draw selected image');
    img.src = state.selected.url;
}

function cssFilterFor(name) {
    switch(name) {
        case 'grayscale': return 'grayscale(100%)';
        case 'sepia': return 'sepia(100%)';
        case 'blur': return 'blur(2px)';
        case 'brightness': return 'brightness(1.25)';
        default: return 'none';
    }
}

function saveSelection() {
    if (!state.selected) return alert('Select an avatar first');
    localStorage.setItem(config.storageKey, JSON.stringify(state.selected));
    alert('Avatar selection saved!');
}

function downloadPNG() {
    if (!state.selected) return alert('Select an avatar first');
    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'amy.png';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
    }, 'image/png');
}

async function shareAvatar() {
    if (!state.selected) return alert('Select an avatar first');
    canvas.toBlob(async (blob) => {
        try {
            if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'amy.png', { type: blob.type })] })) {
                await navigator.share({ files: [new File([blob], 'amy.png', { type: blob.type })], title: 'Amy Avatar' });
                return;
            }
        } catch (e) {
            console.log('Web share error', e);
        }
        // fallback to download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'amy.png'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    }, 'image/png');
}

// initialize app
init();