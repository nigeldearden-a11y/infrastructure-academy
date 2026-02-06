#!/usr/bin/env node
/**
 * Upload all images to Manus storage and update MEDIA_CATALOG.json with CDN URLs
 * Run this after cataloging: node scripts/upload-images-to-storage.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error('❌ Error: BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY environment variables required');
  process.exit(1);
}

console.log('=== Uploading Images to Manus Storage ===\n');

// Load manifest
const manifestPath = path.join(projectRoot, 'UPLOAD_MANIFEST.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

console.log(`Uploading ${manifest.images.length} images...\n`);

let successCount = 0;
let failureCount = 0;
const results = [];

// Upload each image
for (const img of manifest.images) {
  try {
    const fileBuffer = fs.readFileSync(img.localPath);
    const uploadUrl = new URL('v1/storage/upload', FORGE_API_URL);
    uploadUrl.searchParams.set('path', img.storageKey);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: img.mimeType });
    formData.append('file', blob, img.filename);

    const response = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FORGE_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const cdnUrl = data.url;

    results.push({
      imgCode: img.imgCode,
      filename: img.filename,
      storageUrl: cdnUrl,
      status: 'SUCCESS'
    });

    console.log(`✓ ${img.imgCode}: ${img.filename} → ${cdnUrl.substring(0, 60)}...`);
    successCount++;

  } catch (error) {
    results.push({
      imgCode: img.imgCode,
      filename: img.filename,
      error: error.message,
      status: 'FAILED'
    });

    console.log(`✗ ${img.imgCode}: ${img.filename} - ${error.message}`);
    failureCount++;
  }
}

console.log(`\n=== Upload Summary ===`);
console.log(`✓ Successful: ${successCount}`);
console.log(`✗ Failed: ${failureCount}`);

// Update MEDIA_CATALOG.json with CDN URLs
const catalogPath = path.join(projectRoot, 'MEDIA_CATALOG.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

results.forEach(result => {
  const imgEntry = catalog.images.find(img => img.imgCode === result.imgCode);
  if (imgEntry && result.status === 'SUCCESS') {
    imgEntry.storageUrl = result.storageUrl;
    imgEntry.status = 'UPLOADED';
  } else if (imgEntry) {
    imgEntry.status = 'UPLOAD_FAILED';
    imgEntry.error = result.error;
  }
});

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
console.log(`\n✓ Updated MEDIA_CATALOG.json with CDN URLs`);

// Save upload results
const resultsPath = path.join(projectRoot, 'UPLOAD_RESULTS.json');
fs.writeFileSync(resultsPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  totalUploaded: successCount,
  totalFailed: failureCount,
  results
}, null, 2));

console.log(`✓ Saved upload results to UPLOAD_RESULTS.json`);
console.log(`\nNext: Run 'pnpm run db:insert-images' to create database entries`);
