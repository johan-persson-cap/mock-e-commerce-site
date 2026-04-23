using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Tests.Endpoints;

public class CartEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CartEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    private async Task ClearCartAsync()
    {
        await _client.DeleteAsync("/api/cart");
    }

    [Fact]
    public async Task GetCart_ReturnsEmptyArrayInitially()
    {
        await ClearCartAsync();

        var response = await _client.GetAsync("/api/cart");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task AddToCart_ValidProduct_ReturnsCreated()
    {
        await ClearCartAsync();

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(1, item.ProductId);
        Assert.Equal(1, item.Quantity);
        Assert.Equal("Wireless Headphones", item.ProductName);
        Assert.Equal(79.99m, item.UnitPrice);
    }

    [Fact]
    public async Task AddToCart_ExistingProduct_IncrementsAndReturnsOk()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 2 });

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task AddToCart_QuantityOverMax_ReturnsBadRequest()
    {
        await ClearCartAsync();

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 6 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_QuantityZero_ReturnsBadRequest()
    {
        await ClearCartAsync();

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_NegativeQuantity_ReturnsBadRequest()
    {
        await ClearCartAsync();

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = -1 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_WouldExceedMax_ReturnsBadRequest()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 4 });

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 3 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_NonExistentProduct_ReturnsNotFound()
    {
        await ClearCartAsync();

        var response = await _client.PostAsJsonAsync("/api/cart", new { ProductId = 9999, Quantity = 1 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_ValidQuantity_ReturnsOk()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        var response = await _client.PutAsJsonAsync("/api/cart/1", new { Quantity = 3 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task UpdateCartItem_QuantityOverMax_ReturnsBadRequest()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        var response = await _client.PutAsJsonAsync("/api/cart/1", new { Quantity = 6 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_QuantityZero_ReturnsBadRequest()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        var response = await _client.PutAsJsonAsync("/api/cart/1", new { Quantity = 0 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartItem_NotInCart_ReturnsNotFound()
    {
        await ClearCartAsync();

        var response = await _client.PutAsJsonAsync("/api/cart/1", new { Quantity = 3 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_ExistingItem_ReturnsNoContent()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });

        var response = await _client.DeleteAsync("/api/cart/1");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_NonExistentItem_ReturnsNotFound()
    {
        await ClearCartAsync();

        var response = await _client.DeleteAsync("/api/cart/9999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task ClearCart_ReturnsNoContentAndEmptiesCart()
    {
        await ClearCartAsync();
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 1, Quantity = 1 });
        await _client.PostAsJsonAsync("/api/cart", new { ProductId = 2, Quantity = 2 });

        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await _client.GetAsync("/api/cart");
        var items = await getResponse.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task ClearCart_EmptyCart_ReturnsNoContent()
    {
        await ClearCartAsync();

        var response = await _client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }
}