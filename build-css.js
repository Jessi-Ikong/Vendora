#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

const inputPath = path.join(__dirname, 'frontend/css/input.css');
const outputPath = path.join(__dirname, 'frontend/css/tailwind.css');

try {
  const css = fs.readFileSync(inputPath, 'utf8');

  postcss([tailwindcss, autoprefixer])
    .process(css, { from: inputPath, to: outputPath })
    .then(result => {
      fs.writeFileSync(outputPath, result.css);
      console.log('✓ Tailwind CSS built successfully');
      console.log(`  Output: ${outputPath}`);
      console.log(`  Size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    })
    .catch(err => {
      console.error('✗ Build failed:', err);
      process.exit(1);
    });
} catch (err) {
  console.error('✗ Build script error:', err);
  process.exit(1);
}
