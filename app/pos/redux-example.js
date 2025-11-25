'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch, useCart, useCartCalculations } from '../lib/hooks';
import { loadInventory } from '../lib/slices/inventorySlice';
import { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  toggleItemTax,
  setCashAmount,
  setCardAmount,
  setAutoFillOther,
  processPayment,
  startNewSale,
  autoFillPayments
} from '../lib/slices/cartSlice';
import {
  Container,
  POSGrid,
  ProductsPanel,
  CheckoutPanel,
  ProductItem,
  CartItem,
  SearchBar,
  Button,
  CategoryFilter,
  Total,
  CheckoutButton,
  ReceiptSection,
} from "../styles/posStyles";
import { useState } from 'react';

export default function ReduxPOSExample() {
  const dispatch = useAppDispatch();
  
  // Redux state
  const inventory = useAppSelector((state) => state.inventory);
  const cart = useAppSelector((state) => state.cart);
  const auth = useAppSelector((state) => state.auth);
  
  // Cart calculations
  const { getCartSummary } = useCartCalculations();
  
  // Local UI state (could also be moved to Redux if needed)
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Load inventory when component mounts
  useEffect(() => {
    if (inventory.items.length === 0 && !inventory.loading) {
      dispatch(loadInventory());
    }
  }, [dispatch, inventory.items.length, inventory.loading]);

  // Auto-fill payments when cart changes
  useEffect(() => {
    if (cart.items.length > 0) {
      const { total } = getCartSummary();
      dispatch(autoFillPayments({ total }));
    }
  }, [cart.items, dispatch, getCartSummary]);

  // Filter inventory based on search and category
  const filteredInventory = inventory.items.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory && product.stock > 0;
  });

  // Get unique categories
  const categories = [...new Set(inventory.items.map(item => item.category))];

  // Event handlers
  const handleAddToCart = (product) => {
    if (product.stock > 0) {
      dispatch(addToCart(product));
    }
  };

  const handleRemoveFromCart = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleUpdateQuantity = (productId, quantity) => {
    dispatch(updateCartQuantity({ productId, quantity }));
  };

  const handleToggleItemTax = (productId) => {
    dispatch(toggleItemTax(productId));
  };

  const handleCashAmountChange = (amount) => {
    dispatch(setCashAmount(amount));
  };

  const handleCardAmountChange = (amount) => {
    dispatch(setCardAmount(amount));
  };

  const handleAutoFillToggle = (enabled) => {
    dispatch(setAutoFillOther(enabled));
  };

  const handleProcessCheckout = () => {
    const { subtotal, tax, total, taxableAmount, nonTaxableAmount } = getCartSummary();
    
    const paidCash = Number(parseFloat(cart.cashAmount) || 0);
    const paidCard = Number(parseFloat(cart.cardAmount) || 0);
    const paidTotal = +(paidCash + paidCard).toFixed(2);
    
    if (paidTotal + 0.0001 < total) {
      return; // Insufficient payment
    }

    const change = Math.max(0, +(paidTotal - total).toFixed(2));
    const paymentBreakdown = [];
    
    if (paidCash > 0) paymentBreakdown.push({ method: 'cash', amount: +paidCash.toFixed(2) });
    if (paidCard > 0) paymentBreakdown.push({ method: 'card', amount: +paidCard.toFixed(2) });

    const paymentData = {
      subtotal,
      taxableAmount,
      nonTaxableAmount,
      tax,
      total,
      paymentBreakdown,
      change,
    };

    dispatch(processPayment({ cart: cart.items, paymentData }));
  };

  const handleStartNewSale = () => {
    dispatch(startNewSale());
  };

  // Calculate totals
  const { subtotal, tax, total, taxableAmount, nonTaxableAmount } = getCartSummary();
  const paidCash = Number(parseFloat(cart.cashAmount) || 0);
  const paidCard = Number(parseFloat(cart.cardAmount) || 0);
  const paidTotal = +(paidCash + paidCard).toFixed(2);
  const isSufficient = paidTotal + 0.0001 >= total;
  const change = Math.max(0, +(paidTotal - total).toFixed(2));

  // Receipt view
  if (cart.showReceipt && cart.lastTransaction) {
    return (
      <Container>
        <ReceiptSection>
          <h2>Transaction Complete!</h2>
          <div className="receipt">
            <h3>CONVENIENCE STORE</h3>
            <p>Scarborough, Ontario</p>
            <p>Transaction #{cart.lastTransaction.id}</p>
            <p>{new Date(cart.lastTransaction.timestamp).toLocaleString()}</p>
            <hr />
            {cart.lastTransaction.items.map((item) => (
              <div key={item.id} className="receipt-item">
                <span>{item.name} {!item.taxable && "(No HST)"}</span>
                <span>
                  {item.quantity} x ${item.price.toFixed(2)} = $
                  {(item.quantity * item.price).toFixed(2)}
                </span>
              </div>
            ))}
            <hr />
            <div className="receipt-totals">
              {cart.lastTransaction.taxableAmount > 0 && cart.lastTransaction.nonTaxableAmount > 0 && (
                <>
                  <div>Taxable Items: ${cart.lastTransaction.taxableAmount.toFixed(2)}</div>
                  <div>Non-Taxable Items: ${cart.lastTransaction.nonTaxableAmount.toFixed(2)}</div>
                </>
              )}
              <div>Subtotal: ${cart.lastTransaction.subtotal.toFixed(2)}</div>
              {cart.lastTransaction.tax > 0 && <div>HST (13%): ${cart.lastTransaction.tax.toFixed(2)}</div>}
              <div className="total">Total: ${cart.lastTransaction.total.toFixed(2)}</div>
              {cart.lastTransaction.paymentBreakdown && cart.lastTransaction.paymentBreakdown.length > 0 && (
                <>
                  <hr />
                  <div><strong>Payments</strong></div>
                  {cart.lastTransaction.paymentBreakdown.map((p, idx) => (
                    <div key={idx}>{p.method.toUpperCase()}: ${p.amount.toFixed(2)}</div>
                  ))}
                  {cart.lastTransaction.change > 0 && (
                    <div>Change: ${cart.lastTransaction.change.toFixed(2)}</div>
                  )}
                </>
              )}
            </div>
            <hr />
            <p>Thank you for your business!</p>
          </div>
          <Button onClick={handleStartNewSale} style={{ marginTop: "2rem" }}>
            New Sale
          </Button>
        </ReceiptSection>
      </Container>
    );
  }

  return (
    <Container>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: "1rem", color: "#243746", fontSize: "1.6rem" }}>
            Point of Sale (Redux Powered)
          </h1>
          <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#7f8c8d" }}>
            Using Redux for state management — inventory, cart, and payments.
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#7f8c8d', textAlign: 'right' }}>
          <div>Inventory Source: {inventory.source || 'loading...'}</div>
          <div>Items: {inventory.items.length}</div>
          <div>Cart: {cart.items.length} items</div>
        </div>
      </div>

      <POSGrid>
        <ProductsPanel>
          <h2>Products</h2>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <SearchBar
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <CategoryFilter
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </CategoryFilter>
          </div>

          {inventory.loading && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#f39c12' }}>
              <h3>Loading inventory...</h3>
              <p>Fetching products from {inventory.source || 'database'}</p>
            </div>
          )}

          {inventory.error && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#e74c3c' }}>
              <h3>Error loading inventory</h3>
              <p>{inventory.error}</p>
              <Button onClick={() => dispatch(loadInventory())}>Retry</Button>
            </div>
          )}

          <div className="products-grid">
            {filteredInventory.length === 0 && inventory.items.length > 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#f39c12' }}>
                <h3>No products match your search</h3>
                <p>Try clearing the search term or category filter</p>
              </div>
            )}

            {filteredInventory.map((product) => (
              <ProductItem
                key={product.id}
                onClick={() => handleAddToCart(product)}
                style={{
                  opacity: product.stock === 0 ? 0.5 : 1,
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <h4>{product.name}</h4>
                <div className="price-row">
                  <div className="price">${product.price.toFixed(2)}</div>
                  <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                    {product.taxable ? "HST" : "No HST"}
                  </div>
                </div>
                <div className="stock" style={{
                  color: product.stock === 0 ? '#e74c3c' : 
                         product.stock <= product.lowStockThreshold ? '#f39c12' : '#27ae60'
                }}>
                  Stock: {product.stock} {product.stock === 0 ? '(Out of Stock)' : 
                                          product.stock <= product.lowStockThreshold ? '(Low Stock)' : ''}
                </div>
              </ProductItem>
            ))}
          </div>
        </ProductsPanel>

        <CheckoutPanel>
          <h2>Current Sale</h2>
          <div className="cart-items">
            {cart.items.length === 0 ? (
              <p style={{ textAlign: "center", color: "#7f8c8d", marginTop: "2rem" }}>
                No items in cart — add products from the left panel
              </p>
            ) : (
              cart.items.map((item) => (
                <CartItem key={item.id}>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>${item.price.toFixed(2)} each</p>
                    <button
                      onClick={() => handleToggleItemTax(item.id)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        border: "none",
                        background: item.applyTax === true ? "#27ae60" : "#95a5a6",
                        color: "white",
                        cursor: "pointer",
                        marginTop: "0.25rem",
                      }}
                    >
                      {item.applyTax === true ? "HST ON" : "HST OFF"}
                    </button>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <div className="item-total">
                    <div>${(item.price * item.quantity).toFixed(2)}</div>
                    {item.applyTax === true && (
                      <div style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>
                        +${(item.price * item.quantity * 0.13).toFixed(2)} HST
                      </div>
                    )}
                  </div>
                  <button className="remove-btn" onClick={() => handleRemoveFromCart(item.id)}>×</button>
                </CartItem>
              ))
            )}
          </div>

          {cart.items.length > 0 && (
            <div className="checkout-summary">
              <Total>
                {taxableAmount > 0 && nonTaxableAmount > 0 && (
                  <>
                    <div>Taxable: ${taxableAmount.toFixed(2)}</div>
                    <div>Non-Taxable: ${nonTaxableAmount.toFixed(2)}</div>
                  </>
                )}
                <div>Subtotal: ${subtotal.toFixed(2)}</div>
                {tax > 0 && <div>HST (13%): ${tax.toFixed(2)}</div>}
                <div className="final-total">Total: ${total.toFixed(2)}</div>
              </Total>

              <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={cart.autoFillOther}
                    onChange={(e) => handleAutoFillToggle(e.target.checked)}
                  />
                  <span style={{ fontSize: "0.9rem" }}>Auto-fill other payment</span>
                </label>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <label style={{ minWidth: "80px" }}>Cash:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cart.cashAmount}
                    onChange={(e) => handleCashAmountChange(Number(e.target.value) || 0)}
                    style={{ padding: "0.4rem", flex: 1 }}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <label style={{ minWidth: "80px" }}>Card:</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cart.cardAmount}
                    onChange={(e) => handleCardAmountChange(Number(e.target.value) || 0)}
                    style={{ padding: "0.4rem", flex: 1 }}
                  />
                </div>

                <div style={{ color: isSufficient ? "#2ecc71" : "#e74c3c", fontWeight: "600" }}>
                  {isSufficient
                    ? `Paid: $${paidTotal.toFixed(2)}${change > 0 ? ` — Change: $${change.toFixed(2)}` : ""}`
                    : `Amount due: $${(total - paidTotal).toFixed(2)}`}
                </div>

                {cart.paymentError && (
                  <div style={{ color: "#e74c3c" }}>{cart.paymentError}</div>
                )}

                <CheckoutButton
                  onClick={handleProcessCheckout}
                  disabled={!isSufficient || cart.processing}
                >
                  {cart.processing ? 'Processing...' : 'Process Payment'}
                </CheckoutButton>
              </div>
            </div>
          )}
        </CheckoutPanel>
      </POSGrid>
    </Container>
  );
}