#!/usr/bin/env node
/**
 * Script to replace CDN Tailwind CSS with compiled CSS in all HTML files
 * Run: node update-html-css.js
 */

const fs = require('fs');
const path = require('path');

const frontendDir = path.join(__dirname, 'frontend');
const cdnLink = '<script src="https://cdn.tailwindcss.com"><\/script>';
const compiledLink = '<link rel="stylesheet" href="css/tailwind.css">';

function findHtmlFiles(dir) {
  let files = [];
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files = [...files, ...findHtmlFiles(fullPath)];
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  });
  
  return files;
}

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Calculate relative path from file to css directory
  const dir = path.dirname(filePath);
  const relativeToCss = path.relative(dir, path.join(frontendDir, 'css/tailwind.css'));
  const cssLink = `<link rel="stylesheet" href="${relativeToCss}">`;
  
  // Replace CDN link with local CSS
  content = content.replace(/<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/g, cssLink);
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

const htmlFiles = findHtmlFiles(frontendDir);
let updated = 0;

htmlFiles.forEach(file => {
  if (updateFile(file)) {
    updated++;
    console.log(`✓ Updated: ${path.relative(frontendDir, file)}`);
  }
});

console.log(`\n✓ Successfully updated ${updated} HTML files`);
console.log('Next step: Run "npm run build:css" to generate tailwind.css');
