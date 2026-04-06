import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/hooks/use-products';

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface StoreContextType {
  cart: CartItem[];
  favorites: string[];
  addToCart: (product: Product, quantity: number, size?: string, color?: string) => void;
  removeFromCart: (productId: string | number, size?: string, color?: string) => void;
  updateQuantity: (productId: string | number, quantity: number, size?: string, color?: string) => void;
  toggleFavorite: (productId: string | number) => void;
  isFavorite: (productId: string | number) => boolean;
  clearCart: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('vuro-cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('vuro-favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vuro-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vuro-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addToCart = (product: Product, quantity: number, size?: string, color?: string) => {
    setCart(prev => {
      const existingItemIndex = prev.findIndex(item => 
        item.id === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingItemIndex > -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [...prev, { ...product, quantity, selectedSize: size, selectedColor: color }];
    });
  };

  const removeFromCart = (productId: string | number, size?: string, color?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedSize === size && item.selectedColor === color)
    ));
  };

  const updateQuantity = (productId: string | number, quantity: number, size?: string, color?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedSize === size && item.selectedColor === color)
        ? { ...item, quantity }
        : item
    ));
  };

  const toggleFavorite = (productId: string | number) => {
    const idStr = String(productId);
    setFavorites(prev => 
      prev.includes(idStr) ? prev.filter(id => id !== idStr) : [...prev, idStr]
    );
  };

  const isFavorite = (productId: string | number) => favorites.includes(String(productId));

  const clearCart = () => setCart([]);

  return (
    <StoreContext.Provider value={{ 
      cart, favorites, addToCart, removeFromCart, updateQuantity, toggleFavorite, isFavorite, clearCart 
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
