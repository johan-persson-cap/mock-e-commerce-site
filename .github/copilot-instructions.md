# Copilot Instructions — Mock E-Commerce Site

## Tech Stack

- **Frontend**: React 19, TypeScript 6, Vite 8, plain CSS (BEM naming)
- **Backend**: .NET 10, ASP.NET Core Minimal APIs, C#
- **Testing**: Vitest + React Testing Library + jsdom (frontend), xUnit + WebApplicationFactory (backend)
- **Monorepo**: npm workspaces at root, .NET solution in `src/backend/`

## Project Layout

```
src/frontend/src/           # React app source
  api/index.ts              # API client — plain fetch, base URL /api (proxied by Vite)
  types/index.ts            # Shared TypeScript interfaces (Product, AddToCartRequest)
  hooks/useProducts.ts      # Custom hook for fetching products
  components/               # Each component: Folder/Component.tsx + index.ts barrel export
    Header/, HeroBanner/, ProductCard/, ProductList/

src/backend/MockEcommerce.Api/
  Program.cs                # Entry point — DI registration, CORS, OpenAPI, endpoint mapping
  Models/                   # Product.cs, CartItem.cs
  Services/                 # Interfaces (IProductService, ICartService) + implementations
  Endpoints/                # Static classes with MapGroup extension methods

test/frontend/              # Vitest tests mirroring src/frontend/src/ structure
test/backend/MockEcommerce.Api.Tests/
  Endpoints/                # Integration tests using WebApplicationFactory
  Services/                 # Unit tests instantiating services directly
```

## Conventions

### Frontend

- **Named exports only** — no default exports. Every component folder has a barrel `index.ts`.
- **Props interfaces** defined in the same file as the component.
- **Shared types** go in `src/types/index.ts`.
- **Custom hooks** in `hooks/`, prefixed with `use`.
- **API functions** in `api/index.ts` — use plain `fetch`, no external HTTP client.
- **CSS**: BEM class names (`product-card__body`, `header__inner`). Plain `.css` files, no modules or styled-components.
- **Accessibility**: use ARIA labels on interactive elements and landmark roles.
- **State management**: React `useState`/`useEffect`/`useRef` only. No external state library.

### Backend

- **Minimal API pattern**: endpoints are static classes with a single `Map*Endpoints(this WebApplication app)` extension method.
- **Endpoint grouping**: `MapGroup("api/products").WithTags("Products")` — each route gets `WithName()` and `WithSummary()`.
- **Typed results**: use `Results<Ok<T>, NotFound>` return types and `TypedResults.Ok()` / `TypedResults.NotFound()`.
- **Service layer**: interface + implementation, registered as singletons in DI.
- **XML doc comments** on all public members.
- **Nullable reference types** enabled.
- **Models**: classes with `{ get; set; }`. Records used only for request DTOs (e.g. `AddToCartRequest`).
- **`public partial class Program { }`** exists at the bottom of `Program.cs` to support `WebApplicationFactory<Program>` in integration tests. Do not remove it.

## What's Implemented vs. Stubbed

### Implemented

- `MockProductService` — returns 5 hardcoded products. `GetAll()` and `GetById()` work.
- `ProductEndpoints` — `GET /api/products` and `GET /api/products/{id}`.
- All frontend components, API client, `useProducts` hook.
- Full test coverage for the above.

### Stubbed (all throw `NotImplementedException`)

- **`InMemoryCartService`** — all methods: `GetAll`, `GetByProductId`, `Add`, `Remove`, `Clear`. Has scaffolding (`List<CartItem> _cart`, `Lock _lock`) but no logic.
- **`CartEndpoints`** — all handlers: `GetCart`, `AddToCart`, `RemoveFromCart`, `ClearCart`. Routes are registered, signatures exist, bodies throw.

When implementing cart functionality, follow the patterns established by `MockProductService` and `ProductEndpoints`.

## API Routes

| Method | Route | Status |
|--------|-------|--------|
| GET | `/api/products` | Implemented |
| GET | `/api/products/{id:int}` | Implemented |
| GET | `/api/cart` | Stubbed |
| POST | `/api/cart` | Stubbed — body: `AddToCartRequest { ProductId, Quantity }` |
| DELETE | `/api/cart/{productId:int}` | Stubbed |
| DELETE | `/api/cart` | Stubbed |

OpenAPI spec served at `/openapi/v1.json`.

## Running the App

| Action | Command | Directory |
|--------|---------|-----------|
| Start backend | `dotnet run --project src/backend/MockEcommerce.Api` | repo root |
| Start frontend | `npm run dev` | `src/frontend/` |
| Build frontend | `npm run build` | `src/frontend/` |
| Lint frontend | `npm run lint` | `src/frontend/` |

- Backend listens on `http://localhost:5063`
- Frontend dev server on `http://localhost:5173`, proxies `/api` → backend

## Running Tests

| Scope | Command | Directory |
|-------|---------|-----------|
| Frontend | `npm test` | repo root |
| Backend | `dotnet test test/backend/MockEcommerce.Api.Tests` | repo root |

### Frontend test patterns

- Test files: `test/frontend/**/*.test.{ts,tsx}` — mirror the `src/frontend/src/` folder structure.
- Use `vi.mock()` for module mocking, `vi.mocked()` for type-safe mock access.
- Use `renderHook` from `@testing-library/react` for hook tests.
- Use `userEvent` (not `fireEvent`) for simulating user interactions.
- Setup file (`src/frontend/src/test-setup.ts`) imports `@testing-library/jest-dom` matchers.

### Backend test patterns

- Integration tests: `IClassFixture<WebApplicationFactory<Program>>`, make HTTP requests against the in-memory server.
- Unit tests: instantiate services directly (e.g. `new MockProductService()`).
- Test class naming: `*Tests.cs`, in folders matching the source structure (`Endpoints/`, `Services/`).
