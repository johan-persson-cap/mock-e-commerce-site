using Microsoft.AspNetCore.Http.HttpResults;
using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Endpoints;

/// <summary>
/// Maps shopping cart endpoints under <c>/api/cart</c>.
/// </summary>
public static class CartEndpoints
{
    private const int MaxQuantity = 5;

    /// <summary>Registers cart-related routes on the given endpoint route builder.</summary>
    public static void MapCartEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/cart")
            .WithTags("Cart");

        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Returns all items currently in the cart.");

        group.MapPost("/", AddToCart)
            .WithName("AddToCart")
            .WithSummary("Adds a product to the cart or increments quantity if already present.");

        group.MapPut("/{productId:int}", UpdateCartItem)
            .WithName("UpdateCartItem")
            .WithSummary("Updates the quantity of a cart item.");

        group.MapDelete("/{productId:int}", RemoveFromCart)
            .WithName("RemoveFromCart")
            .WithSummary("Removes a single product from the cart by its product ID.");

        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Removes all items from the cart.");
    }

    /// <summary>Returns all items currently in the cart.</summary>
    internal static Ok<IEnumerable<CartItem>> GetCart(ICartService cartService)
    {
        return TypedResults.Ok(cartService.GetAll());
    }

    /// <summary>Adds a product to the cart or increments quantity if already present.</summary>
    internal static Results<Created<CartItem>, Ok<CartItem>, NotFound<string>, ValidationProblem> AddToCart(
        AddToCartRequest request,
        IProductService productService,
        ICartService cartService)
    {
        if (request.Quantity < 1 || request.Quantity > MaxQuantity)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                { "Quantity", ["Quantity must be between 1 and 5."] }
            });
        }

        var product = productService.GetById(request.ProductId);
        if (product is null)
        {
            return TypedResults.NotFound($"Product {request.ProductId} not found.");
        }

        var existing = cartService.GetByProductId(request.ProductId);
        if (existing is not null)
        {
            var newTotal = existing.Quantity + request.Quantity;
            if (newTotal > MaxQuantity)
            {
                return TypedResults.ValidationProblem(new Dictionary<string, string[]>
                {
                    { "Quantity", [$"Adding {request.Quantity} would exceed the maximum quantity of 5 for this product (currently {existing.Quantity} in cart)."] }
                });
            }
        }

        var cartItem = new CartItem
        {
            ProductId = product.Id,
            ProductName = product.Name,
            UnitPrice = product.Price,
            Quantity = request.Quantity
        };

        var result = cartService.Add(cartItem);

        if (existing is not null)
        {
            return TypedResults.Ok(result);
        }

        return TypedResults.Created($"/api/cart/{result.ProductId}", result);
    }

    /// <summary>Updates the quantity of a cart item.</summary>
    internal static Results<Ok<CartItem>, NotFound<string>, ValidationProblem> UpdateCartItem(
        int productId,
        UpdateCartItemRequest request,
        ICartService cartService)
    {
        if (request.Quantity < 1 || request.Quantity > MaxQuantity)
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                { "Quantity", ["Quantity must be between 1 and 5."] }
            });
        }

        var result = cartService.Update(productId, request.Quantity);
        if (result is null)
        {
            return TypedResults.NotFound($"Product {productId} is not in the cart.");
        }

        return TypedResults.Ok(result);
    }

    /// <summary>Removes a single product from the cart by its product ID.</summary>
    internal static Results<NoContent, NotFound> RemoveFromCart(int productId, ICartService cartService)
    {
        var removed = cartService.Remove(productId);
        if (!removed)
        {
            return TypedResults.NotFound();
        }

        return TypedResults.NoContent();
    }

    /// <summary>Removes all items from the cart.</summary>
    internal static NoContent ClearCart(ICartService cartService)
    {
        cartService.Clear();
        return TypedResults.NoContent();
    }
}

/// <summary>Request body for adding a product to the cart.</summary>
public record AddToCartRequest(int ProductId, int Quantity);

/// <summary>Request body for updating a cart item's quantity.</summary>
public record UpdateCartItemRequest(int Quantity);
