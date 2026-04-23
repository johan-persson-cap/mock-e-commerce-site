import { useState, useEffect, useCallback } from 'react';
import type { CartItem, Product } from '../types';
import { fetchCart, addToCart as apiAddToCart, updateCartItem, removeFromCart, clearCart as apiClearCart } from '../api';

interface UseCartResult {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalPrice: number;
  totalItems: number;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      const cartItems = await fetchCart();
      setItems(cartItems);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    loadCart().finally(() => setLoading(false));
  }, [loadCart]);

  const addToCart = useCallback(async (product: Product, quantity: number = 1) => {
    await apiAddToCart({ productId: product.id, quantity });
    await loadCart();
  }, [loadCart]);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    await updateCartItem(productId, { quantity });
    await loadCart();
  }, [loadCart]);

  const removeItem = useCallback(async (productId: number) => {
    await removeFromCart(productId);
    await loadCart();
  }, [loadCart]);

  const clearCartAction = useCallback(async () => {
    await apiClearCart();
    await loadCart();
  }, [loadCart]);

  const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    loading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart: clearCartAction,
    totalPrice,
    totalItems,
  };
}