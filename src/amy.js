(function () {
  const logEl = id('log');
  const input = id('url-input');
  const openBtn = id('open-btn');
  const nativeBtn = id('preview-native-btn');
  
  // Debug state
  const DEBUG = {
    isEnabled: true,
    startTime: Date.now(),
    events: []
  };
  
  // WebSocket connection for remote control
  let socket = null;
  const SOCKET_URL = window.location.protocol === 'https:' 
    ? `wss://${window.location.host}`
    : `ws://${window.location.host}`;

  function initSocket() {
    if (socket) return;
    try {
      socket = new WebSocket(SOCKET_URL);
      
      socket.onopen = () => {
        log('Remote connection established');
      };
      
      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'open_url' && msg.url) {
            openUrl(msg.url);
          } else if (msg.type === 'native_command') {
            sendNativeMessage('amy_command', msg.payload);
          }
        } catch (e) {
          console.warn('Invalid remote message:', e);
        }
      };
      
      socket.onclose = () => {
        log('Remote connection closed');
        socket = null;
        setTimeout(initSocket, 5000); // Retry connection
      };
    } catch (e) {
      console.warn('WebSocket connection failed:', e);
    }
  }

  // Initialize WebSocket if running in secure context
  if (window.isSecureContext) {
    initSocket();
  }

  // Helpers
  function id(n){ return document.getElementById(n); }
  
  function log(...args){ 
    const timestamp = new Date().toLocaleTimeString();
    const s = args.join(' ');
    
    // Create log entry
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="timestamp">[${timestamp}]</span> ${s}`;
    
    // Add success/error classes
    if(s.toLowerCase().includes('error') || s.toLowerCase().includes('failed')) {
      entry.classList.add('error');
    } else if(s.toLowerCase().includes('success') || s.toLowerCase().includes('opened')) {
      entry.classList.add('success');
    }
    
    // Add to log
    logEl.insertBefore(entry, logEl.firstChild);
    if(logEl.children.length > 50) logEl.removeChild(logEl.lastChild);
    
    // Debug event tracking
    if(DEBUG.isEnabled) {
      DEBUG.events.push({
        timestamp,
        type: 'log',
        message: s,
        time: Date.now() - DEBUG.startTime
      });
      updateDebugPanel();
    }
    
    console.log(s);
  }
  
  // Debug helpers
  function updateDebugPanel() {
    const debugEl = id('debug-panel');
    if(!debugEl) return;
    
    const stats = {
      uptime: Math.floor((Date.now() - DEBUG.startTime) / 1000) + 's',
      events: DEBUG.events.length,
      lastEvent: DEBUG.events[0]?.message || 'None',
      wsStatus: socket ? 'Connected' : 'Disconnected'
    };
    
    debugEl.innerHTML = `
      <h3>Debug Info</h3>
      <div class="debug-item">Uptime: <span>${stats.uptime}</span></div>
      <div class="debug-item">Events: <span>${stats.events}</span></div>
      <div class="debug-item">WebSocket: <span>${stats.wsStatus}</span></div>
      <div class="debug-item">Last Event: <span>${stats.lastEvent}</span></div>
    `;
  }

  // Try to open a URL or custom scheme:
  async function openUrl(url){
    log('Attempting to open:', url);

    // Capacitor App plugin (best-effort detection)
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App && typeof window.Capacitor.Plugins.App.openUrl === 'function') {
        await window.Capacitor.Plugins.App.openUrl({ url });
        log('Opened via Capacitor App.openUrl');
        return;
      }
      // Capacitor v5 exported global (alternative)
      if (window.Capacitor && window.Capacitor.isNative && window.Capacitor.isNative === true && window.Capacitor.Plugins && window.Capacitor.Plugins.Browser && typeof window.Capacitor.Plugins.Browser.open === 'function') {
        await window.Capacitor.Plugins.Browser.open({ url });
        log('Opened via Capacitor Browser.open');
        return;
      }
    } catch (e) {
      console.warn('Capacitor attempt failed', e);
    }

    // Fallback: try window.location and an iframe trick for some URL schemes
    try {
      // First attempt direct navigation
      window.location.href = url;
      log('Opened via window.location.href (fallback)');
    } catch (e) {
      // iframe method (older technique)
      const ifr = document.createElement('iframe');
      ifr.style.display = 'none';
      ifr.src = url;
      document.body.appendChild(ifr);
      setTimeout(()=>{ try{ document.body.removeChild(ifr);}catch(e){} }, 1500);
      log('Tried iframe fallback');
    }
  }

  // Send a structured message that native containers can listen for
  function sendNativeMessage(type, payload){
    const message = { source: 'amy-web', type, payload, ts: Date.now() };
    log('Posting message to host:', JSON.stringify(message));
    try {
      // window.webkit.messageHandlers for iOS WKWebView
      if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.amiHandler && window.webkit.messageHandlers.amiHandler.postMessage) {
        window.webkit.messageHandlers.amiHandler.postMessage(message);
        log('Posted via window.webkit.messageHandlers.amiHandler');
        return;
      }
      // Capacitor bridge: post message to parent
      if (window.Capacitor && window.Capacitor.postMessage) {
        window.Capacitor.postMessage(message);
        log('Posted via window.Capacitor.postMessage');
        return;
      }
      // Generic postMessage
      window.parent.postMessage(message, '*');
      log('Posted via window.parent.postMessage');
    } catch (e) {
      console.warn('Native message post failed', e);
    }
  }

  // UI Feedback helpers
  function setLoading(element, isLoading) {
    element.classList.toggle('loading', isLoading);
  }
  
  function pulseAvatar() {
    const avatar = id('amy-avatar');
    avatar.classList.add('pulse');
    setTimeout(() => avatar.classList.remove('pulse'), 2000);
  }
  
  // Wire UI
  openBtn.addEventListener('click', async ()=> {
    const url = input.value.trim();
    if (!url) { log('Please enter a URL or app scheme'); return; }
    
    setLoading(openBtn, true);
    pulseAvatar();
    
    try {
      await openUrl(url);
      input.value = ''; // Clear on success
    } catch (e) {
      log('Error:', e.message);
    } finally {
      setLoading(openBtn, false);
    }
  });

  nativeBtn.addEventListener('click', ()=> {
    const payload = { cmd: 'user_request', text: input.value || 'hello' };
    
    setLoading(nativeBtn, true);
    pulseAvatar();
    
    try {
      sendNativeMessage('amy_command', payload);
      input.value = ''; // Clear on success
    } catch (e) {
      log('Error:', e.message);
    } finally {
      setLoading(nativeBtn, false);
    }
  });

  // quick buttons
  document.querySelectorAll('.quick button').forEach(b=>{
    b.addEventListener('click', ()=> {
      const url = b.getAttribute('data-url');
      openUrl(url);
    });
  });

  // initial log
  log('Amy UI ready. Replace ../assets/amy.png with your image to customize appearance.');
})();
