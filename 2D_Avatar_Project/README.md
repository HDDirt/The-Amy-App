2D Avatar Project

Quick start

1. Add avatar images
   - Place PNG/JPG/WebP images in the `avatars/` directory.
   - Default filenames expected by `script.js` (change `defaultAvatars` in `script.js` if you rename files):
     - professional-1.png
     - professional-2.png
     - professional-3.png
     - professional-4.png

2. Serve locally
   - From project root:

```bash
cd 2D_Avatar_Project
python3 -m http.server 8001
```

   - Open http://localhost:8001 in your browser.

3. Use the UI
   - Click an avatar to select it. The selected avatar is highlighted.
   - Click "Save Selection" to persist the selection in `localStorage` (key: `selectedAvatar`).

Debugging & notes
- If avatars show broken images, confirm filenames and that `avatars/` contains the files.
- Use DevTools Console to see logs for image load failures.
- To change avatars, edit `defaultAvatars` in `script.js`.

Integration ideas
- Copy selected avatar to the main app's `assets/amy.png` to use it as the app avatar.
- Expose a simple endpoint or postMessage to notify other pages of the new selection.