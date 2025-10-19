# AI Agent Instructions for The-Amy-App

## Project Overview
The Amy App is a hybrid mobile application using Capacitor to wrap a web interface that can launch URLs and app schemes while communicating with native containers. The app provides a customizable avatar-based UI for triggering external actions.

## Key Architecture Components

### Web Layer (`src/`)
- `amy.html`: Main UI with avatar display and URL/scheme input controls
- `amy.js`: Core functionality for URL handling, native messaging, and WebSocket-based remote control
- `amy.css`: Styling with CSS variables (--bg, --card, --accent, --muted)

### Mobile Integration
- Uses Capacitor v5 for iOS wrapping
- Native messaging through multiple channels:
  ```javascript
  // Priority order for native communication:
  1. Capacitor.Plugins.App.openUrl()
  2. Capacitor.Plugins.Browser.open()
  3. window.webkit.messageHandlers (iOS WKWebView)
  4. window.Capacitor.postMessage
  5. window.parent.postMessage (fallback)
  ```

### Assets
- Avatar image must be placed at `assets/amy.png`
- Recommended: PNG/WebP format, square or 3:4 ratio, 600x600px minimum for retina

## Development Workflow

### Remote Access Support
- HTTPS/WSS enabled for secure remote connections
- Auto-reconnecting WebSocket support:
  ```javascript
  // Remote control message types:
  {
    type: 'open_url',      // For URL/scheme opening
    url: 'https://...'     // The URL to open
  }
  // or
  {
    type: 'native_command',  // For native messaging
    payload: {
      cmd: 'user_request',
      text: 'hello'
    }
  }
  ```
- Run with remote access:
  ```bash
  npm run generate-certs  # First time setup
  npm run start:remote    # Start with HTTPS/WSS
  ```

### Local Development
```bash
# Start web preview
npm run start:web    # Serves src/ on port 3000

# Mobile development
npm run ios:init     # First-time iOS setup
npm run ios:add      # Add iOS platform
npm run ios:sync     # Sync web content to iOS
npm run ios:open     # Open in Xcode (macOS only)
```

### Testing & Debugging
- Run tests: `npm test` or `npm run test:watch`
- Debug tests: `npm run debug` (opens Chrome DevTools)
- Environment check: `./scripts/debug.sh`
- Test suites in `tests/`:
  - `amy.test.js`: Core functionality tests
  - `amy11.ply`: Playwright integration tests

### Build Process
- Set up your web build command in `package.json` under `build:web` script
- Output should go to `dist/` (configured in `capacitor.config.json`)
- Run `npm run clean-space` to clean build artifacts

## Project Conventions

### Debug Mode Features
```javascript
const DEBUG = {
  isEnabled: true,
  startTime: Date.now(),
  events: []
};
// Debug panel tracks events, timing, and performance
// Maximum 50 log entries maintained in UI
```

### URL Handling
- Always use the `openUrl()` function in `amy.js` for external navigation
- Include appropriate error handling and logging:
```javascript
try {
  await openUrl(url);
} catch (e) {
  log('Failed to open:', url, e);
}
```

### Native Communication
- Use `sendNativeMessage()` for all native container interactions
- Message format:
```javascript
{
  source: 'amy-web',
  type: 'amy_command',
  payload: { cmd: string, text: string },
  ts: number
}
```

## Testing Guidelines
- Verify URL schemes work in both web and native contexts
- Test fallback behavior when Capacitor plugins are unavailable
- Check native messaging across all supported channels
- Test WebSocket reconnection with poor connectivity
- Verify debug panel events and logging

## Common Pitfalls
- Don't modify `webDir` in `capacitor.config.json` without updating build output
- Always include error handling for native API calls
- Remember to run `ios:sync` after web changes for mobile testing
- Monitor log entry count (max 50) for UI performance
- Ensure SSL certs are generated before using remote features