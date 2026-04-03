# PE Return Machine — Setup Guide

A step-by-step guide to run this project on your laptop. Written for someone who hasn't done this before.

---

## What You're Building

A local React web app that runs in your browser at `localhost:5173`. It's not "installed" like a regular app — it runs a tiny development server on your machine and you open it in Chrome/Edge/Brave like a normal website.

**Stack explained:**
- **React** — A JavaScript library for building interactive UIs. Your sliders, charts, and tabs are all React components.
- **Vite** — A build tool that serves your code locally and hot-reloads when you make changes. Think of it as a "live preview server."
- **Recharts** — A charting library built on top of D3.js. Powers all the bar charts, line charts, and area charts.
- **Node.js** — A JavaScript runtime that lets you run JavaScript outside the browser. Needed to run Vite and install packages.
- **npm** — Node Package Manager. Downloads and manages all the libraries your project depends on.

---

## Step 0: Check if Node.js is Installed

Open **Terminal** (Mac) or **Command Prompt / PowerShell** (Windows) and type:

```bash
node -v
```

If you see something like `v18.17.0` or `v20.x.x`, you're good. Skip to Step 1.

**If you get "command not found":**

1. Go to [https://nodejs.org](https://nodejs.org)
2. Download the **LTS** version (green button)
3. Run the installer — accept all defaults
4. Close and reopen your terminal
5. Run `node -v` again to confirm

**Why Node.js?** Your React code is written in JSX (a mix of JavaScript and HTML-like syntax). Browsers don't understand JSX directly. Node.js + Vite compile it into regular JavaScript that browsers can run. Node.js also runs the `npm` tool that downloads libraries.

---

## Step 1: Download the Project

You have the full project folder. Place it somewhere convenient:

```
pe-return-machine/
├── index.html          ← Entry point (loads the React app)
├── package.json        ← Lists all dependencies + scripts
├── vite.config.js      ← Vite configuration
├── src/
│   ├── main.jsx        ← React bootstrap (mounts App into the page)
│   ├── index.css       ← Global CSS reset
│   └── App.jsx         ← THE ENTIRE APP (600+ lines of React)
```

**What each file does:**

| File | Purpose |
|------|---------|
| `index.html` | The only HTML file. Has a single `<div id="root">` where React renders everything. |
| `package.json` | Tells npm which libraries to download. Lists `react`, `react-dom`, and `recharts` as dependencies. Also defines the `dev`, `build`, and `preview` scripts. |
| `vite.config.js` | Tells Vite to use the React plugin (so it can understand JSX syntax). |
| `src/main.jsx` | The "glue" — imports your App component and renders it into the `#root` div. |
| `src/index.css` | Minimal global styles (resets margin/padding, sets dark background). |
| `src/App.jsx` | **Your entire application.** All components, math, charts, sliders — everything lives here. |

---

## Step 2: Open Terminal in the Project Folder

### On Mac:
1. Open **Terminal** (search Spotlight for "Terminal")
2. Type `cd ` (with a space after cd)
3. Drag the `pe-return-machine` folder from Finder into the Terminal window — it auto-fills the path
4. Press Enter

### On Windows:
1. Open the `pe-return-machine` folder in File Explorer
2. Click the address bar at the top
3. Type `cmd` and press Enter — this opens Command Prompt in that folder

**Or just type the full path:**
```bash
cd /Users/tusshar/Desktop/pe-return-machine    # Mac example
cd C:\Users\Tusshar\Desktop\pe-return-machine   # Windows example
```

**Verify you're in the right place:**
```bash
ls          # Mac/Linux — should show package.json, src/, etc.
dir         # Windows — same thing
```

---

## Step 3: Install Dependencies

```bash
npm install
```

**What this does:** Reads `package.json`, downloads React, Recharts, Vite, and all their sub-dependencies from the npm registry (npmjs.com) into a new `node_modules/` folder. This folder will be ~100MB — that's normal. It also creates a `package-lock.json` file that locks exact versions.

**This takes 30–90 seconds** depending on your internet. You'll see a progress bar.

**If you see "WARN" messages** — those are fine. Warnings are not errors. Only red "ERR!" messages are problems.

**Common issues:**
- `EACCES permission denied` → On Mac, try `sudo npm install` (enter your password)
- `network error` → Check your internet connection
- `engine` warnings → Ignore these, they're about recommended Node versions

---

## Step 4: Start the Dev Server

```bash
npm run dev
```

**What this does:** Starts Vite's development server. It:
1. Compiles your JSX into browser-ready JavaScript
2. Starts a local HTTP server (usually at port 5173)
3. Watches all files for changes — if you edit `App.jsx` and save, the browser auto-refreshes

**You should see:**
```
  VITE v5.4.2  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
```

---

## Step 5: Open in Browser

Open your browser and go to:

```
http://localhost:5173
```

**That's it.** The PE Return Machine should be running.

**What's "localhost"?** It means "this computer." The `:5173` is the port number. Your machine is acting as both the server and the client.

**The Network URL** (192.168.x.x) lets you open the app on your phone if both devices are on the same WiFi — handy for testing the mobile layout.

---

## Step 6: Stop the Server

When you're done, go back to the terminal and press:

```
Ctrl + C
```

This stops the Vite dev server. The app will no longer be accessible at localhost:5173.

---

## Making Changes

The beauty of Vite is **hot module replacement (HMR)**. While the dev server is running:

1. Open `src/App.jsx` in any text editor (VS Code recommended)
2. Make a change — e.g., edit a preset label, change a color, adjust a slider range
3. Save the file (Ctrl+S / Cmd+S)
4. The browser auto-updates instantly — no manual refresh needed

**Recommended editor:** VS Code (free, from [https://code.visualstudio.com](https://code.visualstudio.com))

---

## Building for Production (Deploy to GitHub Pages)

When you want to share this as a live website:

### 1. Set the base path

Edit `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/pe-return-machine/',   // ← add this (must match your repo name)
})
```

**Why?** GitHub Pages serves your site at `username.github.io/repo-name/`. Without `base`, all asset paths would be wrong.

### 2. Build

```bash
npm run build
```

This creates a `dist/` folder with optimized, minified HTML/CSS/JS. The entire app compiles down to ~200KB.

### 3. Deploy to GitHub Pages

```bash
# Initialize git if not already done
git init
git add .
git commit -m "PE Return Machine v1"

# Create repo on GitHub (name it pe-return-machine)
git remote add origin https://github.com/YOUR_USERNAME/pe-return-machine.git
git branch -M main
git push -u origin main
```

Then deploy the `dist` folder. Easiest method — use the `gh-pages` package:

```bash
npm install --save-dev gh-pages
```

Add to `package.json` scripts:
```json
"deploy": "gh-pages -d dist"
```

Then:
```bash
npm run build
npm run deploy
```

Your app will be live at: `https://YOUR_USERNAME.github.io/pe-return-machine/`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `command not found: npm` | Install Node.js (Step 0) |
| `npm install` hangs | Kill with Ctrl+C, delete `node_modules` folder, try again |
| White screen in browser | Open browser DevTools (F12) → Console tab → read the red error |
| Port 5173 already in use | Another Vite server is running. Kill it or use `npx vite --port 3000` |
| Fonts not loading | You need internet — Google Fonts are loaded via CDN |
| Charts not rendering | Make sure `npm install` completed successfully (recharts must be installed) |

---

## Project Structure Recap

```
pe-return-machine/
├── index.html              ← Browser loads this first
├── package.json            ← Dependency list + scripts
├── package-lock.json       ← Auto-generated version lock (don't edit)
├── vite.config.js          ← Build tool config
├── node_modules/           ← Auto-generated (all downloaded libraries)
├── dist/                   ← Auto-generated after `npm run build`
└── src/
    ├── main.jsx            ← Mounts React into the DOM
    ├── index.css           ← Global styles
    └── App.jsx             ← Your entire application
```

The only file you'll ever need to edit is `src/App.jsx`.
