// One-off: pull the "Shop by Ingredients" images down from the letshyphen CDN
// and re-host them on our own Cloudinary account, so we stop depending on a
// third-party CDN for assets we ship on the homepage.
// Run from the backend root:  node scripts/uploadIngredientImages.js
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
require('dotenv').config();
const cloudinary = require('../config/cloudinary');

const ROOT = path.join(__dirname, '..', '..');
const JSON_OUT = path.join(__dirname, 'ingredient-image-map.json');

// public_id is derived from the ingredient name, so the URLs stay predictable.
const ingredients = [
  { name: 'Niacinamide', source: 'https://letshyphen.com/cdn/shop/files/Niacinamide_504b5e47-202d-4cf6-a80d-7514b02f87ad.jpg?v=1775733698&width=450' },
  { name: 'Vitamin C', source: 'https://letshyphen.com/cdn/shop/files/Vitamin_C_-_Mandarin_Extract.jpg?v=1780911070&width=450' },
  { name: 'Vitamin E', source: 'https://letshyphen.com/cdn/shop/files/vitamin_E_e53963a4-92eb-48fa-b036-b1574bfe95a2.jpg?v=1775733698&width=450' },
  { name: 'Peptides', source: 'https://letshyphen.com/cdn/shop/files/Peptides_07fcbc00-d8d2-4c45-b4aa-a24ef25ea2a8.jpg?v=1775733698&width=450' },
  { name: 'Kojic Acid', source: 'https://letshyphen.com/cdn/shop/files/Kojic_Acid_95074bab-b99b-40f7-ba4f-284dd35926ac.jpg?v=1775733698&width=450' },
  { name: 'Tranexamic Acid', source: 'https://letshyphen.com/cdn/shop/files/4_Tranexamic_Acid_TXA.jpg?v=1780911070&width=450' },
  { name: 'Liquorice Oil', source: 'https://letshyphen.com/cdn/shop/files/Liquorice_Oil.jpg?v=1780911070&width=450' },
  { name: 'Vitamin B12', source: 'https://letshyphen.com/cdn/shop/files/Vit_B-12.jpg?v=1784885884&width=450' },
  { name: 'Seabuckthorn', source: 'https://letshyphen.com/cdn/shop/files/Seabuckthorn.jpg?v=1784885884&width=450' },
  { name: 'Mandarin Extract', source: 'https://letshyphen.com/cdn/shop/files/Mandarin_Extract_b5f75982-c520-4655-aafe-8f8b165af8e8.jpg?v=1784885884&width=450' },
];

const slug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

function download(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod
      .get(url, (res) => {
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
      })
      .on('error', reject);
  });
}

const uploadBuffer = (buffer, publicId) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: 'bareaya/ingredients', public_id: publicId, resource_type: 'image', overwrite: true },
      (err, result) => (err ? reject(err) : resolve(result)),
    ).end(buffer);
  });

(async () => {
  const map = {};
  let ok = 0;
  for (const item of ingredients) {
    try {
      const buf = await download(item.source);
      const res = await uploadBuffer(buf, slug(item.name));
      map[item.name] = res.secure_url;
      ok += 1;
      console.log(
        `UPLOADED ${item.name.padEnd(18)} ${String(Math.round(res.bytes / 1024)).padStart(5)} KB  ${res.width}x${res.height}  ${res.secure_url}`,
      );
    } catch (err) {
      console.error(`FAILED ${item.name}: ${err.message}`);
    }
  }

  fs.writeFileSync(JSON_OUT, JSON.stringify(map, null, 2));
  console.log(`\n${ok}/${ingredients.length} uploaded. Map saved: ${path.relative(ROOT, JSON_OUT)}`);
})();
