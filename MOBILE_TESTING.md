# Mobile Testing Guide

## Running the Mobile App

### Option 1: Local Development
```bash
npm run dev
```
Then open `http://localhost:5173` in your mobile browser or use browser dev tools to simulate mobile.

### Option 2: Network Access (for testing on physical devices)
```bash
npm run dev:mobile
```
This will make the app accessible on your local network. You can then access it from any device on the same network.

### Option 3: Using ngrok (for external access)
1. Install ngrok: `npm install -g ngrok`
2. Start the dev server: `npm run dev`
3. In another terminal: `ngrok http 5173`
4. Use the provided URL to access the app from anywhere

## Mobile Features

### PWA Capabilities
- Add to home screen
- Offline functionality (coming soon)
- Native app-like experience

### Mobile Optimizations
- Touch-friendly interface
- Responsive design
- Mobile-specific navigation
- Safe area support for notched devices
- Optimized scrolling performance

### Testing Checklist
- [ ] App loads correctly on mobile devices
- [ ] Navigation works smoothly
- [ ] Touch interactions are responsive
- [ ] Text is readable on small screens
- [ ] Images scale properly
- [ ] Forms are easy to use on mobile
- [ ] Bottom navigation is accessible
- [ ] App works in both portrait and landscape
- [ ] Performance is smooth on mobile devices

## Browser Dev Tools Mobile Simulation

### Chrome/Edge
1. Open DevTools (F12)
2. Click the device icon (Toggle device toolbar)
3. Select a mobile device from the dropdown
4. Test touch interactions and responsive design

### Firefox
1. Open DevTools (F12)
2. Click the responsive design mode icon
3. Select a mobile device or set custom dimensions

## Common Mobile Issues to Check
- Font sizes too small
- Buttons too close together
- Horizontal scrolling
- Slow performance
- Touch targets too small
- Keyboard covers input fields 