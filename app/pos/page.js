"use client";

import { useState, useEffect } from "react";
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

export default function POSPage() {
  const [inventory, setInventory] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [autoFillOther, setAutoFillOther] = useState(true);
  const [lastEdited, setLastEdited] = useState(null); // 'cash' | 'card' | null

  // Initial inventory data as fallback
  const initialInventory = [
    {
      id: 1,
      name: "Coca Cola 355ml",
      category: "Beverages",
      price: 1.5,
      stock: 24,
      lowStockThreshold: 10,
      taxable: true,
    },
    {
      id: 2,
      name: "Lays Classic Chips",
      category: "Snacks",
      price: 2.99,
      stock: 8,
      lowStockThreshold: 15,
      taxable: true,
    },
    {
      id: 3,
      name: "Wonder Bread",
      category: "Bakery",
      price: 3.49,
      stock: 12,
      lowStockThreshold: 5,
      taxable: false,
    },
    {
      id: 4,
      name: "Marlboro Gold",
      category: "Tobacco",
      price: 12.99,
      stock: 3,
      lowStockThreshold: 5,
      taxable: true,
    },
    {
      id: 5,
      name: "Red Bull 250ml",
      category: "Beverages",
      price: 3.99,
      stock: 18,
      lowStockThreshold: 8,
      taxable: true,
    },
  ];

  useEffect(() => {
    // Load inventory from server (SQLite)
    const load = async () => {
      try {
        const res = await fetch("/api/inventory");
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) {
          // Seed initial inventory into DB
          await fetch("/api/inventory", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(initialInventory),
          });
          const r2 = await fetch("/api/inventory");
          const d2 = await r2.json();
          setInventory(d2.filter((item) => item.stock > 0));
        } else {
          setInventory(data.filter((item) => item.stock > 0));
        }
      } catch (err) {
        console.error("Failed to load inventory from server", err);
        // fallback to in-memory initial inventory
        setInventory(initialInventory.filter((item) => item.stock > 0));
      }
    };
    load();
  }, []);

  const categories = [...new Set(inventory.map((item) => item.category))];

  const filteredInventory = inventory.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory && item.stock > 0;
  });

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        alert("Not enough stock available");
      }
    } else {
      setCart([
        ...cart,
        { ...product, quantity: 1, applyTax: product.taxable === true },
      ]);
    }
  };

  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      setCart(cart.filter((item) => item.id !== id));
    } else {
      const product = inventory.find((p) => p.id === id);
      if (newQuantity <= product.stock) {
        setCart(
          cart.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        alert("Not enough stock available");
      }
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  const toggleItemTax = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, applyTax: !item.applyTax } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTax = () => {
    // Calculate tax only on items where applyTax is true
    return cart.reduce((tax, item) => {
      if (item.applyTax === true) {
        return tax + item.price * item.quantity * 0.13; // 13% HST for Ontario, Canada
      }
      return tax;
    }, 0);
  };

  const getTaxableTotal = () => {
    return cart.reduce((total, item) => {
      if (item.applyTax === true) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const getNonTaxableTotal = () => {
    return cart.reduce((total, item) => {
      if (item.applyTax !== true) {
        return total + item.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const processCheckout = () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    // Save transaction (send to server which will deduct stock)
    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = subtotal + tax;

    // Validate payment amounts
    const paidCash = Number(parseFloat(cashAmount) || 0);
    const paidCard = Number(parseFloat(cardAmount) || 0);
    const paidTotal = paidCash + paidCard;
    if (isNaN(paidCash) || isNaN(paidCard) || paidCash < 0 || paidCard < 0) {
      setPaymentError("Invalid payment amounts");
      return;
    }
    if (paidTotal < total - 0.001) {
      // allow tiny floating point slack
      setPaymentError("Payment is insufficient");
      return;
    }

    const change = Math.max(0, +(paidTotal - total).toFixed(2));

    const paymentBreakdown = [];
    if (paidCash > 0)
      paymentBreakdown.push({ method: "cash", amount: +paidCash.toFixed(2) });
    if (paidCard > 0)
      paymentBreakdown.push({ method: "card", amount: +paidCard.toFixed(2) });

    const transaction = {
      timestamp: new Date().toISOString(),
      items: cart.map((c) => ({
        id: c.id,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        applyTax: c.applyTax,
      })),
      subtotal: subtotal,
      taxableAmount: getTaxableTotal(),
      nonTaxableAmount: getNonTaxableTotal(),
      tax: tax,
      total: total,
      paymentBreakdown,
      change,
    };

    // send to server
    fetch("/api/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "dev-secret",
      },
      body: JSON.stringify(transaction),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data && data.transaction) {
          setLastTransaction({ id: data.id, ...data.transaction });
          setShowReceipt(true);
          setCart([]);
          setCashAmount(0);
          setCardAmount(0);
          setPaymentError("");
          // refresh inventory from server
          const resp = await fetch("/api/inventory");
          const items = await resp.json();
          setInventory(items.filter((item) => item.stock > 0));
        } else {
          console.error("Unexpected response from transaction API", data);
          setPaymentError("Failed to complete transaction");
        }
      })
      .catch((err) => {
        console.error("Transaction API error", err);
        setPaymentError("Failed to complete transaction");
      });
  };

  const startNewSale = () => {
    setShowReceipt(false);
    setLastTransaction(null);
    setCart([]);
  };

  // When cart changes, reset payment amounts (default card covers total)
  useEffect(() => {
    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = +(subtotal + tax).toFixed(2);
    // default: card covers the total
    setCashAmount(0);
    setCardAmount(total);
    setLastEdited("card");
    setPaymentError("");
  }, [cart]);

  // If auto-fill is enabled and lastEdited is set, update the other amount
  useEffect(() => {
    if (!autoFillOther || !lastEdited) return;
    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = +(subtotal + tax).toFixed(2);

    if (lastEdited === "cash") {
      const paidCash = Number(parseFloat(cashAmount) || 0);
      const newCard = Math.max(0, +(total - paidCash).toFixed(2));
      setCardAmount(newCard);
    } else if (lastEdited === "card") {
      const paidCard = Number(parseFloat(cardAmount) || 0);
      const newCash = Math.max(0, +(total - paidCard).toFixed(2));
      setCashAmount(newCash);
    }
  }, [autoFillOther, lastEdited, cashAmount, cardAmount, cart]);

  if (showReceipt && lastTransaction) {
    return (
      <Container>
        <ReceiptSection>
          <h2>Transaction Complete!</h2>
          <div className="receipt">
            <h3>CONVENIENCE STORE</h3>
            <p>Scarborough, Ontario</p>
            <p>Transaction #{lastTransaction.id}</p>
            <p>{new Date(lastTransaction.timestamp).toLocaleString()}</p>
            <hr />
            {lastTransaction.items.map((item) => (
              <div key={item.id} className="receipt-item">
                <span>
                  {item.name} {!item.taxable && "(No HST)"}
                </span>
                <span>
                  {item.quantity} x ${item.price.toFixed(2)} = $
                  {(item.quantity * item.price).toFixed(2)}
                </span>
              </div>
            ))}
            <hr />
            <div className="receipt-totals">
              {lastTransaction.taxableAmount > 0 &&
                lastTransaction.nonTaxableAmount > 0 && (
                  <>
                    <div>
                      Taxable Items: ${lastTransaction.taxableAmount.toFixed(2)}
                    </div>
                    <div>
                      Non-Taxable Items: $
                      {lastTransaction.nonTaxableAmount.toFixed(2)}
                    </div>
                  </>
                )}
              <div>Subtotal: ${lastTransaction.subtotal.toFixed(2)}</div>
              {lastTransaction.includeTax && lastTransaction.tax > 0 && (
                <div>HST (13%): ${lastTransaction.tax.toFixed(2)}</div>
              )}
              <div className="total">
                Total: ${lastTransaction.total.toFixed(2)}
              </div>
              {lastTransaction.paymentBreakdown &&
                lastTransaction.paymentBreakdown.length > 0 && (
                  <>
                    <hr />
                    <div>
                      <strong>Payments</strong>
                    </div>
                    {lastTransaction.paymentBreakdown.map((p, idx) => (
                      <div key={idx}>
                        {p.method.toUpperCase()}: ${p.amount.toFixed(2)}
                      </div>
                    ))}
                    {lastTransaction.change > 0 && (
                      <div>Change: ${lastTransaction.change.toFixed(2)}</div>
                    )}
                  </>
                )}
            </div>
            <hr />
            <p>Thank you for your business!</p>
          </div>
          <Button onClick={startNewSale} style={{ marginTop: "2rem" }}>
            New Sale
          </Button>
        </ReceiptSection>
      </Container>
    );
  }

  return (
    <Container>
      <h1
        style={{ marginBottom: "1rem", color: "#243746", fontSize: "1.6rem" }}
      >
        Point of Sale
      </h1>
      <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#7f8c8d" }}>
        Quick checkout — add items, split payments and complete the sale.
      </p>

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

          <div className="products-grid">
            {filteredInventory.map((product) => (
              <ProductItem key={product.id} onClick={() => addToCart(product)}>
                <h4>{product.name}</h4>
                <div className="price-row">
                  <div className="price">${product.price.toFixed(2)}</div>
                  <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                    {product.taxable ? "HST" : "No HST"}
                  </div>
                </div>
                <div className="stock">Stock: {product.stock}</div>
              </ProductItem>
            ))}
          </div>
        </ProductsPanel>

        <CheckoutPanel>
          <h2>Current Sale</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#7f8c8d",
                  marginTop: "2rem",
                }}
              >
                No items in cart — add products from the left panel
              </p>
            ) : (
              cart.map((item) => (
                <CartItem key={item.id}>
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p>${item.price.toFixed(2)} each</p>
                    <button
                      onClick={() => toggleItemTax(item.id)}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "12px",
                        border: "none",
                        background:
                          item.applyTax === true ? "#27ae60" : "#95a5a6",
                        color: "white",
                        cursor: "pointer",
                        marginTop: "0.25rem",
                      }}
                    >
                      {item.applyTax === true ? "HST ON" : "HST OFF"}
                    </button>
                  </div>
                  <div className="quantity-controls">
                    <button
                      onClick={() =>
                        updateCartQuantity(item.id, item.quantity - 1)
                      }
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateCartQuantity(item.id, item.quantity + 1)
                      }
                    >
                      +
                    </button>
                  </div>
                  <div className="item-total">
                    <div>${(item.price * item.quantity).toFixed(2)}</div>
                    {item.applyTax === true && (
                      <div style={{ fontSize: "0.75rem", color: "#7f8c8d" }}>
                        +${(item.price * item.quantity * 0.13).toFixed(2)} HST
                      </div>
                    )}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    ×
                  </button>
                </CartItem>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="checkout-summary">
              {(() => {
                const subtotal = calculateTotal();
                const tax = calculateTax();
                const total = +(subtotal + tax).toFixed(2);
                const paidCash = Number(parseFloat(cashAmount) || 0);
                const paidCard = Number(parseFloat(cardAmount) || 0);
                const paidTotal = +(paidCash + paidCard).toFixed(2);
                const isSufficient = paidTotal + 0.0001 >= total;
                const change = Math.max(0, +(paidTotal - total).toFixed(2));

                return (
                  <>
                    <Total>
                      {getTaxableTotal() > 0 && getNonTaxableTotal() > 0 && (
                        <>
                          <div>Taxable: ${getTaxableTotal().toFixed(2)}</div>
                          <div>
                            Non-Taxable: ${getNonTaxableTotal().toFixed(2)}
                          </div>
                        </>
                      )}
                      <div>Subtotal: ${subtotal.toFixed(2)}</div>
                      {tax > 0 && <div>HST (13%): ${tax.toFixed(2)}</div>}
                      <div className="final-total">
                        Total: ${total.toFixed(2)}
                      </div>
                    </Total>

                    <div
                      style={{
                        marginTop: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <label
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={autoFillOther}
                            onChange={(e) =>
                              setAutoFillOther(!!e.target.checked)
                            }
                          />
                          <span style={{ fontSize: "0.9rem" }}>
                            Auto-fill other payment
                          </span>
                        </label>
                        <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>
                          Toggle to automatically fill the other field
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <label style={{ minWidth: "80px" }}>Cash:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cashAmount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parsed = raw === "" ? 0 : Number(raw);
                            setLastEdited("cash");
                            setCashAmount(parsed);
                            // If auto-fill is off, do not auto-change cardAmount here; effect will handle when autoFillOther true
                            if (!autoFillOther) return;
                            const subtotal = calculateTotal();
                            const tax = calculateTax();
                            const total = +(subtotal + tax).toFixed(2);
                            const newCard = Math.max(
                              0,
                              +(total - parsed).toFixed(2)
                            );
                            setCardAmount(newCard);
                          }}
                          style={{ padding: "0.4rem", flex: 1 }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <label style={{ minWidth: "80px" }}>Card:</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cardAmount}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const parsed = raw === "" ? 0 : Number(raw);
                            setLastEdited("card");
                            setCardAmount(parsed);
                            if (!autoFillOther) return;
                            const subtotal = calculateTotal();
                            const tax = calculateTax();
                            const total = +(subtotal + tax).toFixed(2);
                            const newCash = Math.max(
                              0,
                              +(total - parsed).toFixed(2)
                            );
                            setCashAmount(newCash);
                          }}
                          style={{ padding: "0.4rem", flex: 1 }}
                        />
                      </div>

                      <div
                        style={{
                          color: isSufficient ? "#2ecc71" : "#e74c3c",
                          fontWeight: "600",
                        }}
                      >
                        {isSufficient
                          ? `Paid: $${paidTotal.toFixed(2)}${
                              change > 0
                                ? ` — Change: $${change.toFixed(2)}`
                                : ""
                            }`
                          : `Amount due: $${(total - paidTotal).toFixed(2)}`}
                      </div>

                      {paymentError && (
                        <div style={{ color: "#e74c3c" }}>{paymentError}</div>
                      )}

                      <CheckoutButton
                        onClick={processCheckout}
                        disabled={!isSufficient}
                      >
                        Process Payment
                      </CheckoutButton>
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </CheckoutPanel>
      </POSGrid>
    </Container>
  );
}
