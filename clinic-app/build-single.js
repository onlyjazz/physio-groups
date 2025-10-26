import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the built index.html
const htmlPath = path.join(__dirname, 'dist', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf-8');

// Find and inline CSS files
const cssRegex = /<link rel="stylesheet" crossorigin href="(.*?)">/g;
let cssMatch;
while ((cssMatch = cssRegex.exec(html)) !== null) {
  const cssPath = path.join(__dirname, 'dist', cssMatch[1].replace(/^\//, ''));
  if (fs.existsSync(cssPath)) {
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    html = html.replace(
      cssMatch[0],
      `<style>${cssContent}</style>`
    );
  }
}

// Find and inline JavaScript files
const jsRegex = /<script type="module" crossorigin src="(.*?)"><\/script>/g;
let jsMatch;
while ((jsMatch = jsRegex.exec(html)) !== null) {
  const jsPath = path.join(__dirname, 'dist', jsMatch[1].replace(/^\//, ''));
  if (fs.existsSync(jsPath)) {
    const jsContent = fs.readFileSync(jsPath, 'utf-8');
    html = html.replace(
      jsMatch[0],
      `<script type="module">${jsContent}</script>`
    );
  }
}

// Inline the SVG logo
const svgPath = path.join(__dirname, 'dist', 'assets', 'logo-clalit-X0tpJzyB.svg');
if (fs.existsSync(svgPath)) {
  const svgContent = fs.readFileSync(svgPath, 'utf-8');
  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
  html = html.replace(/\/assets\/logo-clalit-[^"]+\.svg/g, svgDataUri);
}

// Also handle the vite.svg
const viteSvgPath = path.join(__dirname, 'dist', 'vite.svg');
if (fs.existsSync(viteSvgPath)) {
  const viteSvgContent = fs.readFileSync(viteSvgPath, 'utf-8');
  const viteSvgDataUri = `data:image/svg+xml;base64,${Buffer.from(viteSvgContent).toString('base64')}`;
  html = html.replace(/\.\/vite\.svg/g, viteSvgDataUri);
}

// Write the single HTML file
const outputPath = path.join(__dirname, 'dist', 'index-single.html');
fs.writeFileSync(outputPath, html);

console.log(`✅ Single HTML file created: ${outputPath}`);
console.log(`📦 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
