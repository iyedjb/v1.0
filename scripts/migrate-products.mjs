import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIREBASE_URL = 'https://vuro-louay-default-rtdb.firebaseio.com/products.json';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'products.json');

function parsePrice(price) {
  if (typeof price === 'number') return price;
  const cleaned = String(price).replace(/[R$\s.,]/g, '').trim();
  return parseInt(cleaned, 10) || 0;
}

function cleanImageUrl(url) {
  if (!url) return '';
  return url;
}

async function migrate() {
  console.log('Fetching products from Firebase RTDB...');

  const res = await fetch(FIREBASE_URL);
  if (!res.ok) {
    throw new Error(`Firebase request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!data || typeof data !== 'object') {
    console.log('No products found in Firebase.');
    return;
  }

  const products = Object.entries(data).map(([id, value]) => {
    const rawImages = Array.isArray(value.images) ? value.images : (value.image ? [value.image] : []);

    return {
      id,
      name: value.name || '',
      brand: value.brand || 'VURO',
      price: typeof value.price === 'number' ? value.price : parsePrice(value.price),
      image: cleanImageUrl(value.image),
      images: rawImages.map(cleanImageUrl).filter(Boolean),
      sizes: Array.isArray(value.sizes) ? value.sizes : [],
      colors: Array.isArray(value.colors) ? value.colors : [],
      variants: Array.isArray(value.variants)
        ? value.variants.map(v => ({
            ...v,
            image: cleanImageUrl(v.image),
            images: Array.isArray(v.images) ? v.images.map(cleanImageUrl) : undefined,
          }))
        : [],
      category: value.category || '',
      description: value.description || '',
      isNew: value.isNew || false,
      sold: value.sold || false,
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2), 'utf-8');

  console.log(`Done! ${products.length} products saved to data/products.json`);
}

migrate().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
