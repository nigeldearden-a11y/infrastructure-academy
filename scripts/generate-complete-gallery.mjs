#!/usr/bin/env node
/**
 * Generate complete gallery page with all 150 assets from database
 * This creates a permanent HTML page displaying all uploaded files
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

console.log('Fetching all assets from database...\n');

const apiUrl = 'https://3000-i6f3ipcoraja4tkvrofmy-9f8e6720.sg1.manus.computer/api/trpc/assets.getAll';

try {
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  const assets = data.result.data.json || data.result.data || [];
  console.log(`✓ Retrieved ${assets.length} assets from database\n`);

  // Separate images and documents
  const images = assets.filter(a => a.mimeType?.startsWith('image/'));
  const documents = assets.filter(a => !a.mimeType?.startsWith('image/'));

  console.log(`  Images: ${images.length}`);
  console.log(`  Documents: ${documents.length}`);
  console.log(`  Total: ${assets.length}\n`);

  // Create IMG codes
  const assetsWithCodes = assets.map((asset, idx) => ({
    ...asset,
    imgCode: `AST-${String(idx + 1).padStart(3, '0')}`,
    type: asset.mimeType?.startsWith('image/') ? 'image' : 'document',
    category: asset.categoryId === 3 ? 'Images' : 'Documents'
  }));

  // Generate HTML gallery
  const galleryHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Complete Asset Gallery | Infrastructure Academy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a1628;
      color: #ffffff;
      font-family: Georgia, serif;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { color: #ffd700; text-align: center; margin: 30px 0; font-size: 2.5em; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 30px 0;
    }
    .stat-card {
      background: #1a2f4a;
      border: 2px solid #ffd700;
      padding: 20px;
      text-align: center;
      border-radius: 5px;
    }
    .stat-card .number { font-size: 2em; color: #ffd700; font-weight: bold; }
    .stat-card .label { font-size: 0.9em; color: #aaa; margin-top: 10px; }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      margin: 40px 0;
    }
    .gallery-item {
      background: #1a2f4a;
      border: 2px solid #ffd700;
      border-radius: 5px;
      overflow: hidden;
      transition: transform 0.3s;
    }
    .gallery-item:hover { transform: translateY(-5px); }
    .gallery-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
      background: #0a1628;
    }
    .gallery-item .info {
      padding: 15px;
      background: #0a1628;
    }
    .gallery-item .code {
      color: #ffd700;
      font-weight: bold;
      font-size: 0.9em;
    }
    .gallery-item .name {
      font-size: 0.85em;
      color: #ccc;
      margin: 8px 0;
      word-break: break-word;
    }
    .gallery-item .size {
      font-size: 0.75em;
      color: #999;
    }
    .gallery-item .type {
      display: inline-block;
      margin-top: 8px;
      padding: 3px 8px;
      background: #ffd700;
      color: #0a1628;
      border-radius: 3px;
      font-size: 0.7em;
      font-weight: bold;
    }
    .section-title {
      color: #ffd700;
      font-size: 1.5em;
      margin: 40px 0 20px 0;
      border-bottom: 2px solid #ffd700;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    th {
      background: #1a2f4a;
      color: #ffd700;
      padding: 12px;
      text-align: left;
      border: 1px solid #ffd700;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #333;
    }
    tr:hover { background: #1a2f4a; }
    .url-cell {
      font-size: 0.8em;
      word-break: break-all;
      max-width: 300px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>COMPLETE ASSET LIBRARY</h1>
    <p style="text-align: center; color: #aaa; margin-bottom: 30px;">
      All ${assets.length} files uploaded to Infrastructure Academy
    </p>

    <div class="stats">
      <div class="stat-card">
        <div class="number">${assets.length}</div>
        <div class="label">Total Assets</div>
      </div>
      <div class="stat-card">
        <div class="number">${images.length}</div>
        <div class="label">Images</div>
      </div>
      <div class="stat-card">
        <div class="number">${documents.length}</div>
        <div class="label">Documents</div>
      </div>
    </div>

    <div class="section-title">📋 Complete Asset Index</div>
    <table>
      <thead>
        <tr>
          <th>CODE</th>
          <th>FILENAME</th>
          <th>TYPE</th>
          <th>SIZE</th>
          <th>UPLOADED</th>
          <th>CDN URL</th>
        </tr>
      </thead>
      <tbody>
        ${assetsWithCodes.map(asset => `
        <tr>
          <td><strong>${asset.imgCode}</strong></td>
          <td>${asset.fileName}</td>
          <td>${asset.type}</td>
          <td>${(asset.fileSize / 1024).toFixed(1)} KB</td>
          <td>${new Date(asset.createdAt).toLocaleDateString()}</td>
          <td class="url-cell"><a href="${asset.fileUrl}" target="_blank" style="color: #ffd700;">View →</a></td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">🖼️ Image Gallery (${images.length} images)</div>
    <div class="gallery">
      ${images.slice(0, 50).map(asset => {
        const assetWithCode = assetsWithCodes.find(a => a.id === asset.id);
        return `
        <div class="gallery-item">
          <img src="${asset.fileUrl}" alt="${asset.fileName}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22150%22%3E%3Crect fill=%22%231a2f4a%22 width=%22200%22 height=%22150%22/%3E%3C/svg%3E'">
          <div class="info">
            <div class="code">${assetWithCode.imgCode}</div>
            <div class="name">${asset.fileName}</div>
            <div class="size">${(asset.fileSize / 1024).toFixed(1)} KB</div>
            <div class="type">${asset.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'}</div>
          </div>
        </div>
        `;
      }).join('')}
    </div>

    <p style="text-align: center; color: #999; margin-top: 40px; padding: 20px;">
      © 2026 Infrastructure Academy. All assets permanently indexed and stored.
    </p>
  </div>
</body>
</html>`;

  const galleryPath = path.join(projectRoot, 'public', 'complete-asset-gallery.html');
  fs.writeFileSync(galleryPath, galleryHTML);
  console.log(`\n✓ Created complete-asset-gallery.html`);
  console.log(`  URL: https://3000-i6f3ipcoraja4tkvrofmy-9f8e6720.sg1.manus.computer/complete-asset-gallery.html`);

  // Create COMPLETE_ASSET_INDEX.json
  const indexJson = {
    metadata: {
      title: "Infrastructure Academy - Complete Asset Index",
      created: new Date().toISOString(),
      total_assets: assets.length,
      total_images: images.length,
      total_documents: documents.length
    },
    assets: assetsWithCodes
  };

  const indexPath = path.join(projectRoot, 'COMPLETE_ASSET_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify(indexJson, null, 2));
  console.log(`✓ Created COMPLETE_ASSET_INDEX.json`);

  console.log(`\n✓ All ${assets.length} assets are now permanently indexed and accessible!`);

} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
