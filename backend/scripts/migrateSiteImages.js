const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
require('dotenv').config();
const cloudinary = require('../config/cloudinary');

const ROOT = path.join(__dirname, '..', '..');
const JSON_OUT = path.join(__dirname, 'site-image-map.json');

const localFiles = [
  { path: 'frontend/src/assets/skin-stories/skin-story-1.jpg', publicId: 'skin-story-1' },
  { path: 'frontend/src/assets/skin-stories/skin-story-2.jpeg', publicId: 'skin-story-2' },
  { path: 'frontend/src/assets/skin-stories/skin-story-3.jpeg', publicId: 'skin-story-3' },
  { path: 'frontend/public/logo.png', publicId: 'logo' },
  { path: 'frontend/public/WhatsApp Image 2026-09-15 at 12.10.53 PM.jpeg', publicId: 'whatsapp-12-10-53' },
  { path: 'frontend/public/WhatsApp Image 2026-09-15 at 12.10.22 PM.jpeg', publicId: 'whatsapp-12-10-22' },
  { path: 'frontend/public/ChatGPT Image Sep 15, 2026, 08_22_07 PM.png', publicId: 'chatgpt-0822' },
];

const remoteUrls = [
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-1.jpg', publicId: 'gallery-img-1' },
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-2.jpg', publicId: 'gallery-img-2' },
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-3.jpg', publicId: 'gallery-img-3' },
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-4.jpg', publicId: 'gallery-img-4' },
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-5.jpg', publicId: 'gallery-img-5' },
  { url: 'https://bareaya.in/wp-content/uploads/2021/08/skin-cleanser-template-gallery-img-6.jpg', publicId: 'gallery-img-6' },
  { url: 'https://bareaya.in/wp-content/uploads/2026/01/WhatsApp-Image-2026-01-22-at-1.59.22-PM.jpeg', publicId: 'founder-image' },
];

function download(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function uploadBuffer(buffer, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'bareaya/site', public_id: publicId, resource_type: 'auto', overwrite: true },
      (err, result) => (err ? reject(err) : resolve(result)),
    ).end(buffer);
  });
}

(async () => {
  const map = {};
  for (const item of localFiles) {
    const abs = path.join(ROOT, item.path);
    if (!fs.existsSync(abs)) {
      console.error(`MISSING local: ${item.path}`);
      continue;
    }
    try {
      const res = await uploadBuffer(fs.readFileSync(abs), item.publicId);
      map[item.path] = res.secure_url;
      console.log(`UPLOADED (local) ${item.path} -> ${res.secure_url}`);
    } catch (err) {
      console.error(`FAILED (local) ${item.path}: ${err.message}`);
    }
  }

  for (const item of remoteUrls) {
    try {
      const buf = await download(item.url);
      const res = await uploadBuffer(buf, item.publicId);
      map[item.url] = res.secure_url;
      console.log(`UPLOADED (remote) ${item.url} -> ${res.secure_url}`);
    } catch (err) {
      console.error(`FAILED (remote) ${item.url}: ${err.message}`);
    }
  }

  fs.writeFileSync(JSON_OUT, JSON.stringify(map, null, 2));
  console.log('MAP SAVED:', JSON_OUT);
})();