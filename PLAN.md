# Implementation Plan: Shopping Cart Feature

Sequenced steps to implement the cart feature defined in [SPEC.md](SPEC.md). Each step lists the files to change, what to do, and acceptance criteria.

---

## Phase 1: Backend Service Layer

### Step 1 — Implement `InMemoryCartService`

**Files:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Replace all `throw new NotImplementedException()` bodies with working logic:

- `GetAll()` — lock, return `_cart.ToList()` (snapshot).
- `GetByProductId(int productId)` — lock, return `_cart.FirstOrDefault(c => c.ProductId == productId)`.
- `Add(CartItem item)` — lock, check if product already in cart. If yes, increment `Quantity` and return existing item. If no, add to `_cart` and return the new item.
- `Remove(int productId)` — lock, find item, remove it, return `true`/`false`.
- `Clear()` — lock, `_cart.Clear()`.

All methods acquire `_lock` for thread safety.

**Done when:** all five methods return correct results (verified in Step 7 unit tests).

---

### Step 2 — Add `Update` method to `ICartService` and `InMemoryCartService`

**Files:**
- `src/backend/MockEcommerce.Api/Services/ICartService.cs` — add `CartItem? Update(int productId, int quantity);`
- `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs` — implement: lock, find item by `productId`, set `Quantity` to the new value, return the item. Return `null` if not found.

**Done when:** `Update` compiles, sets absolute quantity, returns `null` for missing items.

---

## Phase 2: Backend Endpoints

### Step 3 — Implement existing stubbed endpoint handlers

**Files:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

Implement the four existing handler methods:

- `GetCart` — call `cartService.GetAll()`, return `TypedResults.Ok(items)`.
- `AddToCart` — validate `request.Quantity` is 1–5 (return `ValidationProblem` if not). Check product exists via `productService.GetById()` (return `NotFound` if not). Check if item already in cart; if so, verify resulting total ≤ 5 (return `ValidationProblem` if not). Build `CartItem` from product data, call `cartService.Add()`. Return `TypedResults.Created` for new items, `TypedResults.Ok` for updated existing items.
- `RemoveFromCart` — call `cartService.Remove(productId)`, return `NoContent` or `NotFound`.
- `ClearCart` — call `cartService.Clear()`, return `NoContent`.

**Done when:** all four endpoints return correct status codes and bodies.

---

### Step 4 — Add PUT endpoint for updating cart item quantity

**Files:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

- Add `public record UpdateCartItemRequest(int Quantity);` (alongside existing `AddToCartRequest`).
- Add `UpdateCartItem` handler: validate `Quantity` is 1–5 (return `ValidationProblem`). Call `cartService.Update(productId, request.Quantity)`. Return `Ok<CartItem>` or `NotFound<string>` if not in cart.
- Register route: `group.MapPut("/{productId:int}", UpdateCartItem).WithName("UpdateCartItem").WithSummary("Updates the quantity of a cart item.")`.

**Done when:** `PUT /api/cart/1` with `{ "quantity": 3 }` returns 200 with updated item; invalid quantities return 400; missing items return 404.

---

## Phase 3: Frontend Types & API Client

### Step 5 — Add shared types

**Files:** `src/frontend/src/types/index.ts`

- Add `CartItem` interface: `productId`, `productName`, `unitPrice`, `quantity`, `totalPrice`.
- Add `UpdateCartItemRequest` interface: `quantity`.

**Files:** `src/frontend/src/api/index.ts`

- Remove the local `CartItem` interface (now imported from types).
- Add functions: `fetchCart(): Promise<CartItem[]>`, `updateCartItem(productId: number, request: UpdateCartItemRequest): Promise<CartItem>`, `removeFromCart(productId: number): Promise<void>`, `clearCart(): Promise<void>`.
- Import new types from `../types`.

**Done when:** all API functions compile and use shared types.

---

## Phase 4: Frontend Cart UI

### Step 6a — Create `useCart` hook

**Files:** `src/frontend/src/hooks/useCart.ts`

- State: `items: CartItem[]`, `loading`, `error`.
- Fetch cart on mount via `fetchCart()`.
- Expose: `addToCart(product, quantity?)`, `updateQuantity(productId, quantity)`, `removeItem(productId)`, `clearCart()`.
- Computed: `totalPrice` (sum of item totals), `totalItems` (sum of quantities).
- Each mutation calls the API, then refetches cart to sync state.

**Done when:** hook compiles, fetches cart, and mutations trigger refetch.

---

### Step 6b — Create `CartPanel` component

**Files:**
- `src/frontend/src/components/CartPanel/CartPanel.tsx`
- `src/frontend/src/components/CartPanel/index.ts`

Component receives props:
- `items: CartItem[]`
- `totalPrice: number`
- `onUpdateQuantity(productId: number, quantity: number): void`
- `onRemoveItem(productId: number): void`
- `onClearCart(): void`
- `onClose(): void`
- `isOpen: boolean`

UI:
- Overlay backdrop + slide-in panel from the right.
- Header: "Your Cart" + close (×) button.
- Item list: product name, unit price, quantity with −/+ buttons, item total, remove button.
- Disable − button when quantity = 1, disable + button when quantity = 5.
- Footer: cart total, "Clear cart" link.
- Empty state: "Your cart is empty."
- ARIA: `role="dialog"`, `aria-label="Shopping cart"`.

**Done when:** component renders items, quantity controls work, empty state displays.

---

### Step 6c — Wire cart into App and Header

**Files:**
- `src/frontend/src/components/Header/Header.tsx` — add `onCartClick?: () => void` prop, wire to cart button `onClick`.
- `src/frontend/src/App.tsx` — add `isCartOpen` state, use `useCart` hook, pass props to `Header` and `CartPanel`, handle add-to-cart via hook.

**Done when:** clicking cart icon opens panel, adding products updates cart count in header, panel shows correct items.

---

### Step 6d — Add cart panel styles

**Files:** `src/frontend/src/App.css`

Add BEM styles for `cart-panel`, `cart-panel__overlay`, `cart-panel__header`, `cart-panel__items`, `cart-panel__item`, `cart-panel__quantity`, `cart-panel__footer`, etc. Slide-in transition from right.

**Done when:** cart panel looks correct and transitions smoothly.

---

## Phase 5: Backend Tests

### Step 7 — Unit tests for `InMemoryCartService`

**Files:** `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs`

Test cases:
- `GetAll` returns empty list initially.
- `Add` adds a new item and returns it.
- `Add` same product twice increments quantity.
- `GetByProductId` returns correct item.
- `GetByProductId` returns null for missing product.
- `Update` sets absolute quantity and returns updated item.
- `Update` returns null for product not in cart.
- `Remove` returns true and removes item.
- `Remove` returns false for missing product.
- `Clear` empties the cart.

**Done when:** `dotnet test` passes all cart service tests.

---

### Step 8 — Integration tests for cart endpoints

**Files:** `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs`

Test cases:
- `GET /api/cart` returns 200 with empty array initially.
- `POST /api/cart` with valid product returns 201 with CartItem.
- `POST /api/cart` with same product increments quantity, returns 200.
- `POST /api/cart` with quantity > 5 returns 400.
- `POST /api/cart` where sum would exceed 5 returns 400.
- `POST /api/cart` with non-existent product returns 404.
- `PUT /api/cart/{id}` updates quantity, returns 200.
- `PUT /api/cart/{id}` with quantity > 5 returns 400.
- `PUT /api/cart/{id}` with quantity 0 returns 400.
- `PUT /api/cart/{id}` for item not in cart returns 404.
- `DELETE /api/cart/{id}` returns 204.
- `DELETE /api/cart/{id}` for missing item returns 404.
- `DELETE /api/cart` returns 204 and empties cart.

Use `IClassFixture<WebApplicationFactory<Program>>`, `HttpClient`, `ReadFromJsonAsync`.

**Done when:** `dotnet test` passes all cart endpoint tests.

---

## Phase 6: Frontend Tests

### Step 9 — Test `useCart` hook

**Files:** `test/frontend/hooks/useCart.test.ts`

- Mock `api/index.ts` functions.
- Test: fetches cart on mount.
- Test: `addToCart` calls API and refetches.
- Test: `updateQuantity` calls API and refetches.
- Test: `removeItem` calls API and refetches.
- Test: `clearCart` calls API and refetches.
- Test: computes `totalPrice` and `totalItems`.

---

### Step 10 — Test `CartPanel` component

**Files:** `test/frontend/components/CartPanel/CartPanel.test.tsx`

- Renders items with names, prices, quantities.
- + button calls `onUpdateQuantity` with quantity + 1.
- − button calls `onUpdateQuantity` with quantity − 1.
- + button disabled at quantity 5.
- − button disabled at quantity 1.
- Remove button calls `onRemoveItem`.
- Clear cart calls `onClearCart`.
- Empty state shows "Your cart is empty."
- Close button calls `onClose`.

---

### Step 11 — Update existing frontend tests

**Files:**
- `test/frontend/components/Header/Header.test.tsx` — test `onCartClick` callback fires on cart button click.
- `test/frontend/App.test.tsx` — update mocks for `useCart`, test cart panel toggle.

**Done when:** `npm test` passes all frontend tests.

---

## Verification Checklist

1. `dotnet test test/backend/MockEcommerce.Api.Tests` — all pass
2. `npm test` (from repo root) — all pass
3. Manual: start backend (`dotnet run --project src/backend/MockEcommerce.Api`) + frontend (`npm run dev` in `src/frontend/`), add items to cart, open cart panel, update quantities, verify max-qty 5 enforcement, remove items, clear cart
