import { useState, useEffect } from "react";

export interface ProductVariant {
  color: string;
  sizes: string[];
  image?: string;
  images?: string[];
}

export interface Product {
  id: string | number;
  name: string;
  brand: string;
  price: string;
  image: string;
  images?: string[];
  isNew?: boolean;
  category?: string;
  description?: string;
  material?: string;
  dimensions?: string;
  weight?: string;
  editorsNotes?: string;
  productDetails?: string;
  careCleaning?: string;
  sizes?: string[];
  availableSizes?: string[];
  colors?: string[];
  variants?: ProductVariant[];
  sellerId?: string;
  sellerName?: string;
  sold?: boolean;
  featured?: boolean;
  freeShipping?: boolean;
}

const CACHE_KEY = 'vuro_products_cache_v3';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function loadFromCache(): Product[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < CACHE_TTL) {
        return data.products;
      }
    }
  } catch (e) {}
  return null;
}

function saveToCache(products: Product[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ products, timestamp: Date.now() }));
  } catch (e) {}
}

export const staticProducts: Product[] = [];

let memoryCache: Product[] | null = null;

export function clearProductsCache(): void {
  memoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (e) {}
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>(() => {
    if (memoryCache) return memoryCache;
    return loadFromCache() || [];
  });
  const [loading, setLoading] = useState(!memoryCache);

  useEffect(() => {
    if (memoryCache) {
      setProducts(memoryCache);
      setLoading(false);
      return;
    }

    const cached = loadFromCache();
    if (cached && cached.length > 0) {
      memoryCache = cached;
      setProducts(cached);
      setLoading(false);
      return;
    }

    fetch('/api/products')
      .then(r => r.json())
      .then((data: any[]) => {
        const parsed = data.map((p: any) => ({
          ...p,
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          colors: Array.isArray(p.colors) ? p.colors : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
          images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
          sold: p.sold || false,
        }));
        memoryCache = parsed;
        saveToCache(parsed);
        setProducts(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load products:", err);
        setLoading(false);
      });
  }, []);

  return { products, loading };
};
