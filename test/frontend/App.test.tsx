import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frontend/src/App';
import type { Product } from '../../src/frontend/src/types';

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Test Headphones',
    description: 'Great sound quality.',
    price: 79.99,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'https://example.com/headphones.jpg',
  },
];

vi.mock('../../src/frontend/src/hooks/useProducts');
vi.mock('../../src/frontend/src/hooks/useCart');
vi.mock('../../src/frontend/src/api');

import { useProducts } from '../../src/frontend/src/hooks/useProducts';
import { useCart } from '../../src/frontend/src/hooks/useCart';

const mockedUseProducts = vi.mocked(useProducts);
const mockedUseCart = vi.mocked(useCart);

const defaultCartReturn = {
  items: [],
  loading: false,
  error: null,
  addToCart: vi.fn(),
  updateQuantity: vi.fn(),
  removeItem: vi.fn(),
  clearCart: vi.fn(),
  totalPrice: 0,
  totalItems: 0,
};

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    mockedUseCart.mockReturnValue({ ...defaultCartReturn });
  });

  it('renders the header with shop name', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });

    render(<App />);

    expect(screen.getByText('Mock Shop')).toBeInTheDocument();
  });

  it('renders the hero banner', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });

    render(<App />);

    expect(screen.getByText(/discover quality products/i)).toBeInTheDocument();
  });

  it('renders the products section heading', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });

    render(<App />);

    expect(screen.getByRole('heading', { name: /our products/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: true, error: null });

    render(<App />);

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: 'Network error' });

    render(<App />);

    expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
  });

  it('renders product list when loaded', () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });

    render(<App />);

    expect(screen.getByText('Test Headphones')).toBeInTheDocument();
  });

  it('shows notification after adding to cart', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    const addToCart = vi.fn().mockResolvedValue(undefined);
    mockedUseCart.mockReturnValue({ ...defaultCartReturn, addToCart });

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('"Test Headphones" added to cart!');
  });

  it('shows error notification when add to cart fails', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    const addToCart = vi.fn().mockRejectedValue(new Error('Server error'));
    mockedUseCart.mockReturnValue({ ...defaultCartReturn, addToCart });

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Failed to add item to cart.');
  });

  it('opens cart panel when cart button is clicked', async () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockedUseCart.mockReturnValue({
      ...defaultCartReturn,
      items: [{ productId: 1, productName: 'Test', unitPrice: 10, quantity: 1, totalPrice: 10 }],
      totalPrice: 10,
      totalItems: 1,
    });

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /shopping cart/i }));

    expect(screen.getByRole('dialog', { name: 'Shopping cart' })).toBeInTheDocument();
  });
});
