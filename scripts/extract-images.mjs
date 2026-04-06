import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIREBASE_URL = 'https://vuro-louay-default-rtdb.firebaseio.com/products.json';
const IMAGES_DIR = path.join(__dirname, '..', 'public', 'products');
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'products.json');

function parsePrice(price) {
  if (typeof price === 'number') return price;
  const cleaned = String(price).replace(/[R$\s.,]/g, '').trim();
  return parseInt(cleaned, 10) || 0;
}

function saveBase64Image(base64String, filename) {
  const match = base64String.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const data = Buffer.from(match[2], 'base64');
  const filePath = path.join(IMAGES_DIR, `${filename}.${ext}`);
  fs.writeFileSync(filePath, data);
  return `/products/${filename}.${ext}`;
}

function processImageUrl(url, prefix) {
  if (!url) return '';
  if (url.startsWith('data:image/')) {
    return saveBase64Image(url, prefix) || '/placeholder.svg';
  }
  return url;
}

async function extract() {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

  console.log('Fetching products from Firebase RTDB...');
  const res = await fetch(FIREBASE_URL);
  if (!res.ok) throw new Error(`Firebase request failed: ${res.status}`);
  const data = await res.json();

  if (!data || typeof data !== 'object') {
    console.log('No products found.');
    return;
  }

  let imageCount = 0;
  const products = Object.entries(data).map(([id, value]) => {
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '_');

    const mainImage = processImageUrl(value.image, `${safeId}_main`);
    if (mainImage.startsWith('/products/')) imageCount++;

    const rawImages = Array.isArray(value.images) ? value.images : (value.image ? [value.image] : []);
    const images = rawImages.map((img, i) => {
      const result = processImageUrl(img, `${safeId}_${i}`);
      if (result.startsWith('/products/')) imageCount++;
      return result;
    }).filter(Boolean);

    const rawVariants = Array.isArray(value.variants) ? value.variants : [];
    const variants = rawVariants.map((v, vi) => ({
      ...v,
      image: processImageUrl(v.image, `${safeId}_v${vi}`),
      images: Array.isArray(v.images)
        ? v.images.map((img, i) => processImageUrl(img, `${safeId}_v${vi}_${i}`))
        : undefined,
    }));

    return {
      id,
      name: value.name || '',
      brand: value.brand || 'VURO',
      price: parsePrice(value.price),
      image: mainImage,
      images,
      sizes: Array.isArray(value.sizes) ? value.sizes : [],
      colors: Array.isArray(value.colors) ? value.colors : [],
      variants,
      category: value.category || '',
      description: value.description || '',
      isNew: value.isNew || false,
      sold: value.sold || false,
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(products, null, 2), 'utf-8');

  const jsonSize = fs.statSync(OUTPUT_FILE).size;
  console.log(`Done!`);
  console.log(`  ${products.length} products saved`);
  console.log(`  ${imageCount} images extracted to public/products/`);
  console.log(`  products.json size: ${(jsonSize / 1024).toFixed(0)} KB (was ~45 MB)`);
}

extract().catch(err => {
  console.error('Extraction failed:', err.message);
  process.exit(1);
});
