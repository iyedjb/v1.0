import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';
import * as fs from 'fs';
import * as path from 'path';

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  price: number;
  image: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  variants?: any[];
  category?: string;
  description?: string;
  isNew?: boolean;
  sold?: boolean;
  featured?: boolean;
}

const firebaseConfig = {
  apiKey: "AIzaSyDtvwvN6iZzmkx7gLE7PUrzhY4hp-Aeq_0",
  authDomain: "vuro-1efe4.firebaseapp.com",
  databaseURL: "https://vuro-1efe4-default-rtdb.firebaseio.com",
  projectId: "vuro-1efe4",
  storageBucket: "vuro-1efe4.firebasestorage.app",
  messagingSenderId: "744316137588",
  appId: "1:744316137588:web:43e1bd0b2bfc1cca8e6121"
};

const app = initializeApp(firebaseConfig, 'server');
const db = getDatabase(app);

// Product cache for faster lookups
const productCache = new Map<string, { product: Product; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// All products cache for listing
let allProductsCache: { products: Product[]; timestamp: number } | null = null;
const ALL_PRODUCTS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes for all products

export function invalidateProductsCache(): void {
  allProductsCache = null;
  productCache.clear();
}

function parsePrice(priceStr: string): number {
  const cleaned = String(priceStr).replace(/[^\d,.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

export async function getProductById(id: string | number): Promise<Product | undefined> {
  const cacheKey = String(id);
  const cached = productCache.get(cacheKey);
  
  // Return cached product if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.product;
  }

  // Check local products first (covers all migrated Firebase products)
  const localProducts = readLocalProducts();
  const localProduct = localProducts.find(p => String(p.id) === String(id));
  if (localProduct) {
    productCache.set(cacheKey, { product: localProduct, timestamp: Date.now() });
    return localProduct;
  }

  // Try Firebase as fallback
  try {
    const productRef = ref(db, `products/${id}`);
    const snapshot = await get(productRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      const product: Product = {
        id: id,
        name: data.name,
        brand: data.brand || 'VURO',
        price: parsePrice(data.price),
        image: data.image,
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        colors: Array.isArray(data.colors) ? data.colors : [],
      };
      
      // Cache the product
      productCache.set(cacheKey, { product, timestamp: Date.now() });
      return product;
    }
  } catch (error) {
    console.error('Error fetching product from Firebase:', error);
  }

  // Fallback: search in all products cache
  const allProducts = await getAllProducts();
  const foundProduct = allProducts.find(p => String(p.id) === String(id));
  if (foundProduct) {
    productCache.set(cacheKey, { product: foundProduct, timestamp: Date.now() });
    return foundProduct;
  }

  return undefined;
}

export function validateProductVariant(product: Product, size?: string, color?: string): boolean {
  if (size && product.sizes && product.sizes.length > 0 && !product.sizes.includes(size)) {
    return false;
  }
  if (color && product.colors && product.colors.length > 0 && !product.colors.includes(color)) {
    return false;
  }
  return true;
}

function cleanImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('data:image/')) {
    return '/placeholder-product.jpg';
  }
  return url;
}

function cleanVariant(variant: any): any {
  if (!variant) return variant;
  return {
    ...variant,
    image: cleanImageUrl(variant.image),
    images: Array.isArray(variant.images) 
      ? variant.images.map((img: string) => cleanImageUrl(img))
      : undefined
  };
}

function readLocalProducts(): Product[] {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'products.json');
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const products = JSON.parse(data);
      return Array.isArray(products) ? products.map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand || 'VURO',
        price: typeof p.price === 'number' ? p.price : parsePrice(p.price),
        image: cleanImageUrl(p.image),
        images: Array.isArray(p.images) ? p.images.map((img: string) => cleanImageUrl(img)) : [],
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        colors: Array.isArray(p.colors) ? p.colors : [],
        variants: Array.isArray(p.variants) ? p.variants.map(cleanVariant) : [],
        category: p.category,
        description: p.description,
        isNew: p.isNew,
        sold: p.sold || false,
        featured: p.featured || false,
      })) : [];
    }
  } catch (error) {
    console.error('Error reading local products:', error);
  }
  return [];
}

export async function getAllProducts(): Promise<Product[]> {
  const localProducts = readLocalProducts();

  // Return cache if still fresh
  if (allProductsCache && Date.now() - allProductsCache.timestamp < ALL_PRODUCTS_CACHE_TTL) {
    // Always merge local on top of cache so edits appear immediately
    if (localProducts.length > 0) {
      const map = new Map(allProductsCache.products.map(p => [String(p.id), p]));
      localProducts.forEach(p => map.set(String(p.id), p));
      return Array.from(map.values());
    }
    return allProductsCache.products;
  }

  // Fetch from Firebase and merge with local (5s timeout to avoid hangs)
  try {
    const productsRef = ref(db, 'products');
    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase timeout')), 5000)
    );
    const snapshot = await Promise.race([get(productsRef), timeoutPromise]) as any;

    let firebaseProducts: Product[] = [];
    if (snapshot && snapshot.exists()) {
      const data = snapshot.val();
      firebaseProducts = Object.entries(data).map(([key, value]: [string, any]) => {
        const rawImages = Array.isArray(value.images) ? value.images : [value.image];
        const cleanedImages = rawImages.map((img: string) => cleanImageUrl(img));
        const rawVariants = Array.isArray(value.variants) ? value.variants : [];

        const product: Product = {
          id: key,
          name: value.name,
          brand: value.brand || 'VURO',
          price: parsePrice(value.price),
          image: cleanImageUrl(value.image),
          images: cleanedImages,
          sizes: Array.isArray(value.sizes) ? value.sizes : [],
          colors: Array.isArray(value.colors) ? value.colors : [],
          variants: rawVariants.map(cleanVariant),
          category: value.category,
          description: value.description,
          isNew: value.isNew,
          sold: value.sold || false,
        };

        productCache.set(key, { product, timestamp: Date.now() });
        return product;
      });
    }

    // Merge: local products override Firebase products with same ID
    const map = new Map(firebaseProducts.map(p => [String(p.id), p]));
    localProducts.forEach(p => map.set(String(p.id), p));
    const merged = Array.from(map.values());

    allProductsCache = { products: merged, timestamp: Date.now() };
    return merged;
  } catch (error) {
    console.error('Error fetching products from Firebase:', error);
  }

  // Fallback to local only
  if (localProducts.length > 0) return localProducts;
  return allProductsCache?.products || [];
}

// Pre-warm cache on startup
getAllProducts().then(products => {
  console.log(`Pre-cached ${products.length} products`);
}).catch(() => {});
