import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { ref, onValue, set } from "firebase/database";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  size: string;
  color?: string;
  observation?: string;
  quantity: number;
  freeShipping?: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<Pick<CartItem, 'size' | 'color'>>) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'vuro_cart_v1';

function loadCartFromStorage(): CartItem[] {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveCartToStorage(items: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const { user } = useAuth();

  // Load cart from Firebase when user logs in, fallback to localStorage
  useEffect(() => {
    if (!user) return;

    const cartRef = ref(db, `carts/${user.uid}`);
    const unsubscribe = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      if (data && Array.isArray(data) && data.length > 0) {
        setItems(data);
        saveCartToStorage(data);
      } else if (data && typeof data === 'object') {
        const cartItems = Object.values(data) as CartItem[];
        if (cartItems.length > 0) {
          setItems(cartItems);
          saveCartToStorage(cartItems);
        }
      }
      // If Firebase returns empty, keep localStorage items
    });

    return () => unsubscribe();
  }, [user]);

  // Save cart to Firebase and localStorage
  const saveCartToFirebase = async (newItems: CartItem[]) => {
    saveCartToStorage(newItems);
    if (!user) return;
    try {
      const cartRef = ref(db, `carts/${user.uid}`);
      await set(cartRef, newItems);
    } catch (error) {
      console.error("Failed to save cart to Firebase:", error);
    }
  };

  const addItem = (newItem: CartItem) => {
    if (!user) {
      toast({
        title: "Faça login primeiro",
        description: "Você precisa ter uma conta para adicionar ao carrinho.",
        variant: "destructive",
      });
      return;
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find(
        (item) => item.productId === newItem.productId && item.size === newItem.size
      );

      let updatedItems: CartItem[];

      if (existingItem) {
        toast({
          title: "Produto atualizado",
          description: `${newItem.name} (Tam: ${newItem.size}) atualizado no carrinho.`,
        });
        updatedItems = prevItems.map((item) =>
          item.id === existingItem.id
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item
        );
      } else {
        toast({
          title: "Adicionado ao carrinho",
          description: `${newItem.name} (Tam: ${newItem.size}) foi adicionado.`,
        });
        updatedItems = [...prevItems, newItem];
      }

      // Save to Firebase
      saveCartToFirebase(updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.id !== id);
      saveCartToFirebase(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) => 
        item.id === id ? { ...item, quantity } : item
      );
      saveCartToFirebase(updatedItems);
      return updatedItems;
    });
  };

  const updateItem = (id: string, updates: Partial<Pick<CartItem, 'size' | 'color'>>) => {
    setItems((prevItems) => {
      const updatedItems = prevItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      saveCartToFirebase(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    saveCartToFirebase([]);
  };

  const totalItems = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalPrice = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateItem,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
