import type { CartItem } from '../../types';

interface CartPanelProps {
  items: CartItem[];
  totalPrice: number;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onClose: () => void;
  isOpen: boolean;
}

export function CartPanel({
  items,
  totalPrice,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onClose,
  isOpen,
}: CartPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="cart-panel__overlay" onClick={onClose}>
      <div
        className="cart-panel"
        role="dialog"
        aria-label="Shopping cart"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cart-panel__header">
          <h2 className="cart-panel__title">Your Cart</h2>
          <button
            className="cart-panel__close"
            onClick={onClose}
            aria-label="Close cart"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="cart-panel__empty">Your cart is empty.</p>
        ) : (
          <>
            <ul className="cart-panel__items">
              {items.map((item) => (
                <li key={item.productId} className="cart-panel__item">
                  <div className="cart-panel__item-info">
                    <span className="cart-panel__item-name">{item.productName}</span>
                    <span className="cart-panel__item-price">
                      ${item.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="cart-panel__item-actions">
                    <div className="cart-panel__quantity">
                      <button
                        className="cart-panel__quantity-btn"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.productName}`}
                      >
                        −
                      </button>
                      <span className="cart-panel__quantity-value" aria-label={`Quantity: ${item.quantity}`}>
                        {item.quantity}
                      </span>
                      <button
                        className="cart-panel__quantity-btn"
                        onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
                        disabled={item.quantity >= 5}
                        aria-label={`Increase quantity of ${item.productName}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-panel__item-total">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                    <button
                      className="cart-panel__remove-btn"
                      onClick={() => onRemoveItem(item.productId)}
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-panel__footer">
              <div className="cart-panel__total">
                <span>Total:</span>
                <span className="cart-panel__total-price">${totalPrice.toFixed(2)}</span>
              </div>
              <button
                className="cart-panel__clear-btn"
                onClick={onClearCart}
                aria-label="Clear cart"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}