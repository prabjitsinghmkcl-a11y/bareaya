// One-off: upload the media that is still served from frontend/public to
// Cloudinary, so nothing ships as a local asset any more.
// Run from the backend root:  node scripts/uploadRemainingMedia.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const cloudinary = require('../config/cloudinary');

const ROOT = path.join(__dirname, '..', '..');
const JSON_OUT = path.join(__dirname, 'media-map.json');

const targets = [
  { path: 'frontend/public/videos/hero-video.mp4', folder: 'bareaya/videos', publicId: 'hero-video' },
  { path: 'frontend/public/ChatGPT Image Sep 17, 2026, 11_46_08 AM.png', folder: 'bareaya/site', publicId: 'chatgpt-1146' },
  { path: 'frontend/src/assets/skin-stories/skin-story-1.jpg', folder: 'bareaya/site', publicId: 'skin-story-1' },
  { path: 'frontend/src/assets/skin-stories/skin-story-2.jpeg', folder: 'bareaya/site', publicId: 'skin-story-2' },
  { path: 'frontend/src/assets/skin-stories/skin-story-3.jpeg', folder: 'bareaya/site', publicId: 'skin-story-3' },
  { path: 'frontend/public/logo.png', folder: 'bareaya/site', publicId: 'logo' },
  {
    path: 'frontend/public/WhatsApp Image 2026-09-15 at 12.10.53 PM.jpeg',
    folder: 'bareaya/site',
    publicId: 'whatsapp-12-10-53',
  },
  {
    path: 'frontend/public/WhatsApp Image 2026-09-15 at 12.10.22 PM.jpeg',
    folder: 'bareaya/site',
    publicId: 'whatsapp-12-10-22',
  },
  {
    path: 'frontend/public/ChatGPT Image Sep 15, 2026, 08_22_07 PM.png',
    folder: 'bareaya/site',
    publicId: 'chatgpt-0822',
  },
];

// Only upload what is not already on Cloudinary, so the URLs hard-coded in the
// frontend keep working and their asset versions are not needlessly bumped.
const ALREADY_MIGRATED = new Set([
  'frontend/src/assets/skin-stories/skin-story-1.jpg',
  'frontend/src/assets/skin-stories/skin-story-2.jpeg',
  'frontend/src/assets/skin-stories/skin-story-3.jpeg',
  'frontend/public/logo.png',
  'frontend/public/WhatsApp Image 2026-09-15 at 12.10.53 PM.jpeg',
  'frontend/public/WhatsApp Image 2026-09-15 at 12.10.22 PM.jpeg',
  'frontend/public/ChatGPT Image Sep 15, 2026, 08_22_07 PM.png',
]);

const upload = (abs, folder, publicId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: 'auto', overwrite: true },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    fs.createReadStream(abs).on('error', reject).pipe(stream);
  });

(async () => {
  const map = {};
  for (const target of targets) {
    if (ALREADY_MIGRATED.has(target.path)) {
      console.log(`SKIP (already on Cloudinary) ${target.path}`);
      continue;
    }
    const abs = path.join(ROOT, target.path);
    if (!fs.existsSync(abs)) {
      console.error(`MISSING local file: ${target.path}`);
      continue;
    }
    try {
      const res = await upload(abs, target.folder, target.publicId);
      map[target.path] = res.secure_url;
      console.log(
        `UPLOADED ${target.path} -> ${res.secure_url} (${res.resource_type}, ${Math.round(
          res.bytes / 1024,
        )} KB)`,
      );
    } catch (err) {
      console.error(`FAILED ${target.path}: ${err.message}`);
    }
  }

  const previous = fs.existsSync(JSON_OUT) ? JSON.parse(fs.readFileSync(JSON_OUT, 'utf8')) : {};
  fs.writeFileSync(JSON_OUT, JSON.stringify({ ...previous, ...map }, null, 2));
  console.log('MAP SAVED:', JSON_OUT);
})();
