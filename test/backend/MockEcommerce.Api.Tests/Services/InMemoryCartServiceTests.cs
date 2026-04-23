using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Tests.Services;

public class InMemoryCartServiceTests
{
    private readonly InMemoryCartService _service = new();

    [Fact]
    public void GetAll_ReturnsEmptyListInitially()
    {
        var items = _service.GetAll().ToList();
        Assert.Empty(items);
    }

    [Fact]
    public void Add_NewItem_ReturnsAddedItem()
    {
        var item = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 };
        var result = _service.Add(item);

        Assert.Equal(1, result.ProductId);
        Assert.Equal("Test", result.ProductName);
        Assert.Equal(10m, result.UnitPrice);
        Assert.Equal(1, result.Quantity);
    }

    [Fact]
    public void Add_ExistingProduct_IncrementsQuantity()
    {
        var item1 = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 2 };
        var item2 = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 3 };

        _service.Add(item1);
        var result = _service.Add(item2);

        Assert.Equal(5, result.Quantity);
        Assert.Single(_service.GetAll());
    }

    [Fact]
    public void GetByProductId_ExistingProduct_ReturnsItem()
    {
        var item = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 };
        _service.Add(item);

        var result = _service.GetByProductId(1);

        Assert.NotNull(result);
        Assert.Equal(1, result.ProductId);
    }

    [Fact]
    public void GetByProductId_NonExistentProduct_ReturnsNull()
    {
        var result = _service.GetByProductId(999);
        Assert.Null(result);
    }

    [Fact]
    public void Update_ExistingItem_SetsAbsoluteQuantity()
    {
        var item = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 2 };
        _service.Add(item);

        var result = _service.Update(1, 4);

        Assert.NotNull(result);
        Assert.Equal(4, result.Quantity);
    }

    [Fact]
    public void Update_NonExistentItem_ReturnsNull()
    {
        var result = _service.Update(999, 3);
        Assert.Null(result);
    }

    [Fact]
    public void Remove_ExistingItem_ReturnsTrueAndRemoves()
    {
        var item = new CartItem { ProductId = 1, ProductName = "Test", UnitPrice = 10m, Quantity = 1 };
        _service.Add(item);

        var result = _service.Remove(1);

        Assert.True(result);
        Assert.Empty(_service.GetAll());
    }

    [Fact]
    public void Remove_NonExistentItem_ReturnsFalse()
    {
        var result = _service.Remove(999);
        Assert.False(result);
    }

    [Fact]
    public void Clear_RemovesAllItems()
    {
        _service.Add(new CartItem { ProductId = 1, ProductName = "A", UnitPrice = 10m, Quantity = 1 });
        _service.Add(new CartItem { ProductId = 2, ProductName = "B", UnitPrice = 20m, Quantity = 2 });

        _service.Clear();

        Assert.Empty(_service.GetAll());
    }
}