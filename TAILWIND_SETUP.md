# Tailwind CSS Setup Guide

## Overview
This project uses Tailwind CSS for styling. The Tailwind CSS output is built from `frontend/css/input.css` using a Node.js build script.

## Building Tailwind CSS

### First Time Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build Tailwind CSS:
   ```bash
   npm run build:css
   ```

### Watch Mode (Development)
To automatically rebuild CSS when you make changes:
```bash
npm run watch:css
```

### Manual Build
To build CSS once:
```bash
npm run build:css
```

## File Structure
- `frontend/css/input.css` - Tailwind directives (source file)
- `frontend/css/tailwind.css` - Generated CSS output (DO NOT EDIT MANUALLY)
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration
- `build-css.js` - Custom build script using Node.js

## In Production (Vercel)
Vercel automatically runs `npm run build:css` during deployment as configured in `vercel.json`.

## Updating Tailwind
The Tailwind version is defined in `package.json`. To upgrade:
```bash
npm install -D tailwindcss@latest postcss autoprefixer
npm run build:css
```

## Troubleshooting
- If `npm run build:css` fails, ensure `node_modules` is installed: `npm install`
- If CSS changes don't apply, delete `frontend/css/tailwind.css` and rebuild
- Check `frontend/css/input.css` only contains Tailwind directives (@tailwind base, components, utilities)
