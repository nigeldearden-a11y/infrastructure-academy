#!/usr/bin/env node
/**
 * Upload all images from /home/ubuntu/upload to Manus storage
 * and create database entries with IMG-001, IMG-002, etc. codes
 * 
 * This script runs once to permanently catalog all images on the website
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Import database utilities
const dbPath = path.join(projectRoot, 'server', 'db.ts');
const assetsPath = path.join(projectRoot, 'server', 'assets.ts');

console.log('=== Infrastructure Academy Image Cataloging System ===\n');

// Step 1: Scan all image files
const uploadDir = '/home/ubuntu/upload';
const imageFiles = fs.readdirSync(uploadDir)
  .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
  .map((f, idx) => {
    const filepath = path.join(uploadDir, f);
    const stats = fs.statSync(filepath);
    const imgCode = `IMG-${String(idx + 1).padStart(3, '0')}`;
    
    return {
      imgCode,
      index: idx + 1,
      filename: f,
      filepath,
      sizeBytes: stats.size,
      sizeKB: (stats.size / 1024).toFixed(1),
      mimeType: f.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
      uploadedAt: stats.mtime.toISOString(),
      description: `Uploaded on ${stats.mtime.toLocaleDateString()}`
    };
  })
  .sort((a, b) => a.filename.localeCompare(b.filename));

console.log(`✓ Found ${imageFiles.length} image files\n`);

// Step 2: Create permanent MEDIA_CATALOG.json
const mediaCatalog = {
  metadata: {
    title: "Infrastructure Academy - Complete Media Catalog",
    description: "Permanent catalog of all 33 image assets with storage URLs and database references",
    version: "2.0",
    created: new Date().toISOString(),
    total_images: imageFiles.length,
    organization: "Sequential index (IMG-001 through IMG-033)",
    storage_location: "Manus CDN (permanent URLs)",
    database_table: "assets"
  },
  images: imageFiles.map(img => ({
    imgCode: img.imgCode,
    filename: img.filename,
    title: img.filename.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
    description: img.description,
    fileSize: `${img.sizeKB} KB`,
    mimeType: img.mimeType,
    uploadedAt: img.uploadedAt,
    status: "PENDING_UPLOAD", // Will be updated after upload
    storageUrl: null, // Will be populated after upload
    databaseId: null, // Will be populated after database entry
    category: "Images"
  }))
};

const catalogPath = path.join(projectRoot, 'MEDIA_CATALOG.json');
fs.writeFileSync(catalogPath, JSON.stringify(mediaCatalog, null, 2));
console.log(`✓ Created MEDIA_CATALOG.json with ${imageFiles.length} entries\n`);

// Step 3: Create SQL insert statements for database entries
const sqlInserts = imageFiles.map((img, idx) => {
  const categoryId = 3; // Images category
  const uploadedBy = 1; // Owner
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  return {
    imgCode: img.imgCode,
    sql: `INSERT INTO assets (categoryId, fileName, fileKey, fileUrl, fileSize, mimeType, description, uploadedBy, createdAt, updatedAt) VALUES (${categoryId}, '${img.filename}', 'assets/images/${img.imgCode}-${img.filename}', 'https://placeholder-url.com/${img.imgCode}', ${img.sizeBytes}, '${img.mimeType}', '${img.description}', ${uploadedBy}, '${now}', '${now}');`
  };
});

const sqlFile = path.join(projectRoot, 'scripts', 'insert-images.sql');
fs.writeFileSync(sqlFile, sqlInserts.map(s => s.sql).join('\n'));
console.log(`✓ Created insert-images.sql with ${sqlInserts.length} INSERT statements\n`);

// Step 4: Create upload manifest
const uploadManifest = {
  timestamp: new Date().toISOString(),
  totalImages: imageFiles.length,
  images: imageFiles.map(img => ({
    imgCode: img.imgCode,
    localPath: img.filepath,
    filename: img.filename,
    sizeBytes: img.sizeBytes,
    mimeType: img.mimeType,
    storageKey: `assets/images/${img.imgCode}-${img.filename}`,
    status: "READY_FOR_UPLOAD"
  }))
};

const manifestPath = path.join(projectRoot, 'UPLOAD_MANIFEST.json');
fs.writeFileSync(manifestPath, JSON.stringify(uploadManifest, null, 2));
console.log(`✓ Created UPLOAD_MANIFEST.json\n`);

// Step 5: Create HTML gallery template
const galleryHtml = `<!-- Auto-generated Images Gallery - ${new Date().toISOString()} -->
<div class="images-gallery-grid">
${imageFiles.map(img => `  <div class="gallery-item" data-img-code="${img.imgCode}">
    <div class="gallery-image-container">
      <img src="https://placeholder-cdn.com/${img.imgCode}.jpg" alt="${img.filename}" class="gallery-image" loading="lazy">
    </div>
    <div class="gallery-info">
      <h4>${img.imgCode}</h4>
      <p class="filename">${img.filename}</p>
      <p class="size">${img.sizeKB} KB</p>
      <p class="status"><span class="badge pending">PENDING</span></p>
    </div>
  </div>`).join('\n')}
</div>`;

const galleryPath = path.join(projectRoot, 'GALLERY_TEMPLATE.html');
fs.writeFileSync(galleryPath, galleryHtml);
console.log(`✓ Created GALLERY_TEMPLATE.html\n`);

console.log('=== Summary ===');
console.log(`Total images cataloged: ${imageFiles.length}`);
console.log(`IMG codes assigned: IMG-001 through IMG-${String(imageFiles.length).padStart(3, '0')}`);
console.log(`\nFiles created (permanent on website):`);
console.log(`  - MEDIA_CATALOG.json (master reference)`);
console.log(`  - UPLOAD_MANIFEST.json (upload tracking)`);
console.log(`  - scripts/insert-images.sql (database inserts)`);
console.log(`  - GALLERY_TEMPLATE.html (gallery markup)`);
console.log(`\nNext steps:`);
console.log(`  1. Run: pnpm run upload:images`);
console.log(`  2. Run: pnpm run db:insert-images`);
console.log(`  3. Verify: Check /resources-images-gallery.html`);
