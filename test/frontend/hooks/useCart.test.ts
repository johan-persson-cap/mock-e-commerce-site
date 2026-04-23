import { renderHook, waitFor, act } from '@testing-library/react';
import { useCart } from '../../../src/frontend/src/hooks/useCart';
import type { CartItem, Product } from '../../../src/frontend/src/types';

const mockCartItems: CartItem[] = [
  {
    productId: 1,
    productName: 'Headphones',
    unitPrice: 79.99,
    quantity: 2,
    totalPrice: 159.98,
  },
  {
    productId: 2,
    productName: 'Running Shoes',
    unitPrice: 59.99,
    quantity: 1,
    totalPrice: 59.99,
  },
];

const mockProduct: Product = {
  id: 3,
  name: 'Water Bottle',
  description: 'Insulated bottle.',
  price: 24.99,
  category: 'Accessories',
  stock: 50,
  imageUrl: 'https://example.com/bottle.jpg',
};

vi.mock('../../../src/frontend/src/api', () => ({
  fetchProducts: vi.fn(),
  fetchProductById: vi.fn(),
  addToCart: vi.fn(),
  fetchCart: vi.fn(),
  updateCartItem: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
}));

import { fetchCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../../../src/frontend/src/api';

const mockedFetchCart = vi.mocked(fetchCart);
const mockedAddToCart = vi.mocked(addToCart);
const mockedUpdateCartItem = vi.mocked(updateCartItem);
const mockedRemoveFromCart = vi.mocked(removeFromCart);
const mockedClearCart = vi.mocked(clearCart);

describe('useCart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches cart on mount', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.items).toEqual(mockCartItems);
    expect(mockedFetchCart).toHaveBeenCalledOnce();
  });

  it('returns loading true initially', () => {
    mockedFetchCart.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useCart());

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
  });

  it('computes totalPrice correctly', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.totalPrice).toBeCloseTo(219.97);
  });

  it('computes totalItems correctly', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.totalItems).toBe(3);
  });

  it('addToCart calls API and refetches', async () => {
    mockedFetchCart.mockResolvedValue([]);
    mockedAddToCart.mockResolvedValue({
      productId: 3,
      productName: 'Water Bottle',
      unitPrice: 24.99,
      quantity: 1,
      totalPrice: 24.99,
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addToCart(mockProduct, 1);
    });

    expect(mockedAddToCart).toHaveBeenCalledWith({ productId: 3, quantity: 1 });
    expect(mockedFetchCart).toHaveBeenCalledTimes(2);
  });

  it('updateQuantity calls API and refetches', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedUpdateCartItem.mockResolvedValue({ ...mockCartItems[0], quantity: 3, totalPrice: 239.97 });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity(1, 3);
    });

    expect(mockedUpdateCartItem).toHaveBeenCalledWith(1, { quantity: 3 });
    expect(mockedFetchCart).toHaveBeenCalledTimes(2);
  });

  it('removeItem calls API and refetches', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedRemoveFromCart.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(mockedRemoveFromCart).toHaveBeenCalledWith(1);
    expect(mockedFetchCart).toHaveBeenCalledTimes(2);
  });

  it('clearCart calls API and refetches', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedClearCart.mockResolvedValue(undefined);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clearCart();
    });

    expect(mockedClearCart).toHaveBeenCalled();
    expect(mockedFetchCart).toHaveBeenCalledTimes(2);
  });

  it('sets error on fetch failure', async () => {
    mockedFetchCart.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('Network error');
  });
});