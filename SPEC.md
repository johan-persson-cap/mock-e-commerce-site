# Feature Spec: Shopping Cart — View, Manage & Max-Quantity Enforcement

## Overview

Users can view their cart, see item and total prices, and manage selections before checkout. The cart is accessible from the existing cart icon in the header. Each product has a maximum purchase quantity of 5 — attempts to exceed this are rejected. A new PUT endpoint allows updating the quantity of an item already in the cart.

---

## Ambiguity Resolutions

### 1. Max-quantity enforcement on updates (PUT)

The max quantity of 5 applies to the **absolute quantity** being set, not an increment. `PUT /api/cart/{productId}` with `{ "quantity": 6 }` is rejected with 400 regardless of the current cart state.

### 2. Max-quantity enforcement on add (POST) with existing cart item

When a product is already in the cart, `POST /api/cart` adds `request.Quantity` to the existing quantity. If the **resulting total** would exceed 5, the request is rejected with 400. Example: item already has quantity 3, request adds 4 → rejected (total would be 7).

### 3. PUT semantics — set vs. increment

PUT sets the **absolute quantity** (not an increment). `PUT /api/cart/1` with `{ "quantity": 3 }` sets the cart item's quantity to exactly 3, regardless of its previous value.

### 4. PUT on a product not in the cart

Returns `404 Not Found` with body `"Product {productId} is not in the cart."`. PUT is for updating existing items only; use POST to add new items.

### 5. Error response format

All validation errors (quantity out of range, missing fields) return **400** using ASP.NET's `TypedResults.ValidationProblem()`, which produces RFC 7807 Problem Details JSON:

```json
{
  "type": "https://tools.ietf.org/html/rfc7807",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Quantity": ["Quantity must be between 1 and 5."]
  }
}
```

Not-found errors (invalid product ID, item not in cart) return **404** with a plain string body.

### 6. UI approach for cart view

The cart is a **slide-out panel** (overlay from the right side) toggled by clicking the existing cart icon in the header. It is not a separate page. Clicking outside the panel or pressing a close button dismisses it.

### 7. Quantity of zero via PUT

`PUT` with `{ "quantity": 0 }` returns 400 — quantity must be between 1 and 5. To remove an item, use `DELETE /api/cart/{productId}`.

---

## API Endpoints

### Existing (stubbed — to be implemented)

| Method | Route | Request Body | Success Response | Error Responses |
|--------|-------|-------------|------------------|-----------------|
| GET | `/api/cart` | — | `200 OK` — `CartItem[]` | — |
| POST | `/api/cart` | `{ "productId": int, "quantity": int }` | `201 Created` — `CartItem` (new item) or `200 OK` — `CartItem` (updated existing) | `400` — quantity < 1, quantity > 5, or resulting total > 5; `404` — product ID not found in catalog |
| DELETE | `/api/cart/{productId:int}` | — | `204 No Content` | `404` — product not in cart |
| DELETE | `/api/cart` | — | `204 No Content` | — |

### New endpoint

| Method | Route | Request Body | Success Response | Error Responses |
|--------|-------|-------------|------------------|-----------------|
| PUT | `/api/cart/{productId:int}` | `{ "quantity": int }` | `200 OK` — `CartItem` | `400` — quantity < 1 or > 5; `404` — product not in cart |

### Request DTOs

```csharp
public record AddToCartRequest(int ProductId, int Quantity);       // existing
public record UpdateCartItemRequest(int Quantity);                  // new
```

---

## Models

### CartItem (existing — no changes)

| Property | Type | Notes |
|----------|------|-------|
| ProductId | int | FK to product catalog |
| ProductName | string | Snapshot at time of adding |
| UnitPrice | decimal | Snapshot at time of adding |
| Quantity | int | 1–5 inclusive |
| TotalPrice | decimal | Computed: UnitPrice × Quantity |

---

## Service Layer

### ICartService changes

Add one new method:

```csharp
/// <summary>
/// Updates the quantity of an existing cart item.
/// </summary>
/// <returns>The updated cart item, or null if the product is not in the cart.</returns>
CartItem? Update(int productId, int quantity);
```

### InMemoryCartService behavior

| Method | Behavior |
|--------|----------|
| `GetAll()` | Returns a snapshot of all cart items (under lock) |
| `GetByProductId(int)` | Returns the matching item or `null` |
| `Add(CartItem)` | If product exists in cart, increments quantity and returns updated item. Otherwise adds new item and returns it. Does **not** enforce max-qty (that's the endpoint's job). |
| `Update(int, int)` | Sets absolute quantity on existing item, returns updated item. Returns `null` if not found. |
| `Remove(int)` | Removes by product ID, returns `true`/`false` |
| `Clear()` | Removes all items |

All methods acquire `_lock` for thread safety.

---

## Frontend

### Types (additions to `src/frontend/src/types/index.ts`)

```typescript
export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
```

### API functions (additions to `src/frontend/src/api/index.ts`)

| Function | Method | Route | Returns |
|----------|--------|-------|---------|
| `fetchCart()` | GET | `/api/cart` | `CartItem[]` |
| `updateCartItem(productId, request)` | PUT | `/api/cart/{productId}` | `CartItem` |
| `removeFromCart(productId)` | DELETE | `/api/cart/{productId}` | `void` |
| `clearCart()` | DELETE | `/api/cart` | `void` |

### useCart hook (`src/frontend/src/hooks/useCart.ts`)

Manages cart state. Exposes:
- `items: CartItem[]` — current cart contents
- `loading: boolean`
- `error: string | null`
- `addToCart(product: Product, quantity?: number): Promise<void>`
- `updateQuantity(productId: number, quantity: number): Promise<void>`
- `removeItem(productId: number): Promise<void>`
- `clearCart(): Promise<void>`
- `totalPrice: number` — sum of all item totals
- `totalItems: number` — sum of all item quantities

Fetches cart on mount. Refetches after each mutation to stay in sync with server.

### CartPanel component (`src/frontend/src/components/CartPanel/`)

- Slide-out overlay from the right, toggled by header cart icon click
- Shows list of cart items: name, unit price, quantity with +/− buttons, item total, remove button
- Quantity +/− buttons: disable − at 1, disable + at 5
- Shows cart total at the bottom
- Empty state: "Your cart is empty" message
- Close button (×) and click-outside-to-close
- BEM class names: `cart-panel`, `cart-panel__overlay`, `cart-panel__item`, etc.
- ARIA: `role="dialog"`, `aria-label="Shopping cart"`, focus management

### Header changes

- Add `onCartClick` callback prop
- Wire existing cart button `onClick` to call `onCartClick`

### App.tsx changes

- Add `isCartOpen` state, pass toggle to Header
- Render `CartPanel` conditionally
- Move cart logic to `useCart` hook, pass state/actions to CartPanel and Header

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| POST with quantity > 5 | 400 — `"Quantity must be between 1 and 5."` |
| POST with quantity 3, item already has quantity 4 | 400 — `"Adding 3 would exceed the maximum quantity of 5 for this product (currently 4 in cart)."` |
| POST with quantity 0 or negative | 400 — `"Quantity must be between 1 and 5."` |
| POST with non-existent product ID | 404 — `"Product {id} not found."` |
| PUT with quantity 0, negative, or > 5 | 400 — `"Quantity must be between 1 and 5."` |
| PUT on product not in cart | 404 — `"Product {productId} is not in the cart."` |
| DELETE on product not in cart | 404 |
| GET on empty cart | 200 — `[]` |
| DELETE /api/cart on empty cart | 204 (idempotent, no error) |
| Frontend: click + at quantity 5 | Button disabled, no request sent |
| Frontend: click − at quantity 1 | Button disabled, no request sent |
