import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CartPanel } from '../../../../src/frontend/src/components/CartPanel';
import type { CartItem } from '../../../../src/frontend/src/types';

const mockItems: CartItem[] = [
  {
    productId: 1,
    productName: 'Wireless Headphones',
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

const defaultProps = {
  items: mockItems,
  totalPrice: 219.97,
  onUpdateQuantity: vi.fn(),
  onRemoveItem: vi.fn(),
  onClearCart: vi.fn(),
  onClose: vi.fn(),
  isOpen: true,
};

describe('CartPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CartPanel {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders cart items when open', () => {
    render(<CartPanel {...defaultProps} />);

    expect(screen.getByText('Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('Running Shoes')).toBeInTheDocument();
  });

  it('renders item prices', () => {
    render(<CartPanel {...defaultProps} />);

    expect(screen.getByText('$79.99')).toBeInTheDocument();
    expect(screen.getAllByText('$59.99').length).toBeGreaterThanOrEqual(1);
  });

  it('renders item quantities', () => {
    render(<CartPanel {...defaultProps} />);

    expect(screen.getByLabelText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity: 1')).toBeInTheDocument();
  });

  it('renders total price', () => {
    render(<CartPanel {...defaultProps} />);

    expect(screen.getByText('$219.97')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity with incremented value when + clicked', async () => {
    const onUpdateQuantity = vi.fn();
    render(<CartPanel {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);

    const increaseButtons = screen.getAllByLabelText(/increase quantity/i);
    await userEvent.click(increaseButtons[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 3);
  });

  it('calls onUpdateQuantity with decremented value when - clicked', async () => {
    const onUpdateQuantity = vi.fn();
    render(<CartPanel {...defaultProps} onUpdateQuantity={onUpdateQuantity} />);

    const decreaseButtons = screen.getAllByLabelText(/decrease quantity/i);
    await userEvent.click(decreaseButtons[0]);

    expect(onUpdateQuantity).toHaveBeenCalledWith(1, 1);
  });

  it('disables - button when quantity is 1', () => {
    render(<CartPanel {...defaultProps} />);

    const decreaseButtons = screen.getAllByLabelText(/decrease quantity/i);
    // Second item (Running Shoes) has quantity 1
    expect(decreaseButtons[1]).toBeDisabled();
  });

  it('disables + button when quantity is 5', () => {
    const itemsWithMax: CartItem[] = [
      { productId: 1, productName: 'Max Item', unitPrice: 10, quantity: 5, totalPrice: 50 },
    ];
    render(<CartPanel {...defaultProps} items={itemsWithMax} totalPrice={50} />);

    const increaseButton = screen.getByLabelText(/increase quantity/i);
    expect(increaseButton).toBeDisabled();
  });

  it('calls onRemoveItem when remove button clicked', async () => {
    const onRemoveItem = vi.fn();
    render(<CartPanel {...defaultProps} onRemoveItem={onRemoveItem} />);

    const removeButtons = screen.getAllByLabelText(/remove .* from cart/i);
    await userEvent.click(removeButtons[0]);

    expect(onRemoveItem).toHaveBeenCalledWith(1);
  });

  it('calls onClearCart when clear cart clicked', async () => {
    const onClearCart = vi.fn();
    render(<CartPanel {...defaultProps} onClearCart={onClearCart} />);

    await userEvent.click(screen.getByLabelText('Clear cart'));

    expect(onClearCart).toHaveBeenCalled();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<CartPanel {...defaultProps} onClose={onClose} />);

    await userEvent.click(screen.getByLabelText('Close cart'));

    expect(onClose).toHaveBeenCalled();
  });

  it('shows empty state when no items', () => {
    render(<CartPanel {...defaultProps} items={[]} totalPrice={0} />);

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('has dialog role with proper aria-label', () => {
    render(<CartPanel {...defaultProps} />);

    expect(screen.getByRole('dialog', { name: 'Shopping cart' })).toBeInTheDocument();
  });

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn();
    render(<CartPanel {...defaultProps} onClose={onClose} />);

    // Click the overlay (the parent element with cart-panel__overlay class)
    const overlay = screen.getByRole('dialog').parentElement!;
    await userEvent.click(overlay);

    expect(onClose).toHaveBeenCalled();
  });
});