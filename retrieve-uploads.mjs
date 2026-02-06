#!/usr/bin/env node
/**
 * Retrieve all uploaded files from Manus storage
 * and generate the complete media index
 */

import fs from 'fs';
import path from 'path';

// Get environment variables
const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;

if (!forgeApiUrl || !forgeApiKey) {
  console.error('ERROR: Storage credentials not found');
  console.error('Set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY');
  process.exit(1);
}

async function listStorageFiles() {
  try {
    console.log('Connecting to Manus storage...');
    console.log(`API URL: ${forgeApiUrl}`);
    
    // List files endpoint
    const listUrl = new URL('v1/storage/list', forgeApiUrl.replace(/\/+$/, '') + '/');
    
    const response = await fetch(listUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${forgeApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Storage API error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Response:', text);
      return [];
    }

    const data = await response.json();
    console.log(`Found ${data.files?.length || 0} files in storage`);
    
    return data.files || [];
  } catch (error) {
    console.error('Error retrieving files:', error.message);
    return [];
  }
}

async function generateIndex(files) {
  const index = {
    metadata: {
      title: "Infrastructure Academy - Master Media Index",
      description: "Complete catalog and indexing of all media assets",
      version: "1.0",
      created: new Date().toISOString(),
      total_assets: files.length,
      organization: "Sequential index (IMG-001, IMG-002, VID-001, etc.)"
    },
    assets: []
  };

  files.forEach((file, idx) => {
    const id = `IMG-${String(idx + 1).padStart(3, '0')}`;
    index.assets.push({
      id,
      filename: file.name || file.key,
      path: file.key || file.path,
      size: file.size,
      type: file.mimeType || 'unknown',
      uploaded: file.uploaded || new Date().toISOString(),
      status: "(3) SPARE",
      usage: "Awaiting catalog"
    });
  });

  return index;
}

async function main() {
  console.log('=== Retrieving Uploaded Files ===\n');
  
  const files = await listStorageFiles();
  
  if (files.length === 0) {
    console.log('No files found in storage');
    return;
  }

  const index = await generateIndex(files);
  
  // Save index
  const indexPath = path.join(process.cwd(), 'UPLOADED_FILES_INDEX.json');
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  
  console.log(`\n✅ Index saved to: ${indexPath}`);
  console.log(`Total assets indexed: ${index.assets.length}`);
  console.log('\nFirst 5 assets:');
  index.assets.slice(0, 5).forEach(asset => {
    console.log(`  ${asset.id}: ${asset.filename}`);
  });
}

main().catch(console.error);
