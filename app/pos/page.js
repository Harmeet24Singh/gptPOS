"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useInventoryManager, useAppDispatch } from "../lib/hooks";
import { useEnsureInventory } from "../lib/withInventory";
import {
  updateInventoryAfterTransaction,
  updateItemStockLocal,
  loadInventory,
} from "../lib/slices/inventorySlice";
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
import OnScreenKeyboard from "../components/OnScreenKeyboard";
import styled from "styled-components";

// Wrapper to handle keyboard spacing
const POSWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-height: 100vh;
  overflow: hidden;
`;

const KeyboardArea = styled.div`
  height: 180px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

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
    name: "Marlboro Red",
    category: "Tobacco",
    price: 12.99,
    stock: 5,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 6,
    name: "Camel Blue",
    category: "Tobacco",
    price: 13.49,
    stock: 4,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 7,
    name: "Newport Menthol",
    category: "Tobacco",
    price: 13.99,
    stock: 6,
    lowStockThreshold: 5,
    taxable: true,
  },
  {
    id: 8,
    name: "Red Bull 250ml",
    category: "Beverages",
    price: 3.99,
    stock: 18,
    lowStockThreshold: 8,
    taxable: true,
  },
  {
    id: 9,
    name: "Milk 1L",
    category: "Dairy",
    price: 2.79,
    stock: 15,
    lowStockThreshold: 5,
    taxable: false,
  },
  {
    id: 10,
    name: "Banana (each)",
    category: "Fresh Produce",
    price: 0.89,
    stock: 25,
    lowStockThreshold: 10,
    taxable: false,
  },
  {
    id: 11,
    name: "Coffee Cup 12oz",
    category: "Beverages",
    price: 1.99,
    stock: 30,
    lowStockThreshold: 10,
    taxable: true,
  },
];

function POSContent() {
  const dispatch = useAppDispatch();
  const {
    items: inventory,
    loading: inventoryLoading,
    categories,
    getFilteredInventory,
  } = useInventoryManager();
  const { inventoryLoaded } = useEnsureInventory();
  const searchParams = useSearchParams();

  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const searchInputRef = useRef(null);
  const cashAmountRef = useRef(null);
  const cardAmountRef = useRef(null);
  const discountRef = useRef(null);
  const cashbackAmountRef = useRef(null);
  const cashbackFeeRef = useRef(null);
  const lottoWinningsRef = useRef(null);
  const creditCustomerNameRef = useRef(null);
  const [barcodeBuffer, setBarcodeBuffer] = useState("");
  const [lastKeyTime, setLastKeyTime] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [cashAmount, setCashAmount] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cashbackAmount, setCashbackAmount] = useState("");
  const [cashbackFee, setCashbackFee] = useState("");
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [lottoWinnings, setLottoWinnings] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [autoFillOther, setAutoFillOther] = useState(true);
  const [lastEdited, setLastEdited] = useState(null); // 'cash' | 'card' | null

  // Virtual keyboard states
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [activeInputRef, setActiveInputRef] = useState(null);
  const [keyboardMode, setKeyboardMode] = useState("numeric"); // 'full' or 'numeric'

  // Helper function to handle input focus and show appropriate keyboard
  const handleInputFocus = (inputRef, isNumeric = true) => {
    setActiveInputRef(inputRef);
    // Only change keyboard mode if it's not already active for this input
    // This preserves manual mode changes made by the user
    if (activeInputRef !== inputRef) {
      setKeyboardMode(isNumeric ? "numeric" : "full");
    }
    setShowKeyboard(true);
  };

  // Function to show keyboard for already active input without changing mode
  const showKeyboardForInput = (inputRef) => {
    setActiveInputRef(inputRef);
    setShowKeyboard(true);
    // Don't change keyboard mode - preserve user's choice
  };

  // Credit sale states
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [creditCustomerName, setCreditCustomerName] = useState("");
  const [creditAmount, setCreditAmount] = useState(0); // Specific credit amount
  const [isAutoCalculating, setIsAutoCalculating] = useState(false); // Prevent circular updates

  // Credit customer management states
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBalance, setCustomerBalance] = useState(0);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  // Card fee states
  const [cardType, setCardType] = useState("debit"); // 'debit' | 'credit'
  const [cardFeeEnabled, setCardFeeEnabled] = useState(false);
  const CARD_FEE_AMOUNT = 0.25; // $0.25 fee for credit cards

  // Check if this is a balance payment (customer selected and no cart items)
  const isBalancePayment = selectedCustomer && cart.length === 0;

  // Discount states
  const [discountAmount, setDiscountAmount] = useState("");

  // Manual item entry states
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualItem, setManualItem] = useState({
    name: "",
    price: "",
    category: categories.length > 0 ? categories[0] : "grocery-taxable",
    quantity: 1,
  });

  // Use Redux-managed inventory with smart filtering
  const filteredInventory = getFilteredInventory(searchTerm, categoryFilter);

  const addToCart = (product) => {
    // For manual items, find existing item by name, price, and category instead of ID
    let existingItem;
    if (product.isManual) {
      existingItem = cart.find(
        (item) =>
          item.isManual &&
          item.name === product.name &&
          item.price === product.price &&
          item.category === product.category
      );
    } else {
      existingItem = cart.find((item) => item.id === product.id);
    }

    if (existingItem) {
      setCart(
        cart.map((item) => {
          // For manual items, match by name, price, and category
          const isMatch = product.isManual
            ? item.isManual &&
              item.name === product.name &&
              item.price === product.price &&
              item.category === product.category
            : item.id === product.id;

          return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
        })
      );

      // Update inventory stock immediately (optimistic update)
      if (!product.isManual && product.id) {
        dispatch(
          updateItemStockLocal({
            id: product.id,
            newStock: product.stock - 1,
          })
        );
      }
    } else {
      setCart([
        ...cart,
        { ...product, quantity: 1, applyTax: product.taxable === true },
      ]);

      // Update inventory stock immediately (optimistic update)
      if (!product.isManual && product.id) {
        dispatch(
          updateItemStockLocal({
            id: product.id,
            newStock: product.stock - 1,
          })
        );
      }
    }
  };

  const handleVoidItem = (itemId, itemName) => {
    const confirmVoid = confirm(
      `Void item: "${itemName}"?\n\nThis will remove the item completely from the cart.`
    );
    if (confirmVoid) {
      // Find the item being voided to restore stock
      const itemToVoid = cart.find((item) => item.id === itemId);

      if (itemToVoid && !itemToVoid.isManual) {
        // Find the corresponding product in inventory
        const product = inventory.find((p) => p.id === itemId);

        if (product) {
          // Restore stock by adding back the quantity being voided
          dispatch(
            updateItemStockLocal({
              id: product.id,
              newStock: product.stock + itemToVoid.quantity,
            })
          );
        }
      }

      setCart(cart.filter((item) => item.id !== itemId));
    }
  };

  const handleDecreaseQuantity = (itemId) => {
    const item = cart.find((item) => item.id === itemId);
    if (!item || item.quantity <= 1) return; // Don't allow decrease below 1

    // Decrease quantity normally
    updateCartQuantity(itemId, item.quantity - 1);
  };

  const updateCartQuantity = (id, newQuantity) => {
    if (newQuantity === 0) {
      // When quantity would become 0, prompt for void confirmation
      const item = cart.find((item) => item.id === id);
      if (item) {
        handleVoidItem(id, item.name);
      }
    } else {
      // Find the item in cart to check if it's manual
      const cartItem = cart.find((item) => item.id === id);

      if (cartItem && cartItem.isManual) {
        // Manual items have unlimited stock
        setCart(
          cart.map((item) =>
            item.id === id ? { ...item, quantity: newQuantity } : item
          )
        );
      } else {
        // Regular inventory items - check stock and update inventory
        const product = inventory.find((p) => p.id === id);
        const cartItem = cart.find((item) => item.id === id);

        if (product && cartItem) {
          const quantityDiff = newQuantity - cartItem.quantity;
          const newStock = product.stock - quantityDiff;

          setCart(
            cart.map((item) =>
              item.id === id ? { ...item, quantity: newQuantity } : item
            )
          );

          // Update inventory stock immediately
          dispatch(
            updateItemStockLocal({
              id: product.id,
              newStock: newStock,
            })
          );
        }
      }
    }
  };

  const removeFromCart = (id) => {
    // Find the item being removed to restore stock
    const itemToRemove = cart.find((item) => item.id === id);

    if (itemToRemove && !itemToRemove.isManual) {
      // Find the corresponding product in inventory
      const product = inventory.find((p) => p.id === id);

      if (product) {
        // Restore stock by adding back the quantity being removed
        dispatch(
          updateItemStockLocal({
            id: product.id,
            newStock: product.stock + itemToRemove.quantity,
          })
        );
      }
    }

    setCart(cart.filter((item) => item.id !== id));
  };

  const toggleItemTax = (id) => {
    setCart(
      cart.map((item) =>
        item.id === id ? { ...item, applyTax: !item.applyTax } : item
      )
    );
  };

  // Function to handle search when Enter is pressed
  const handleSearchEnter = () => {
    if (!searchTerm.trim()) return;

    // Check if any products match the search term
    const searchResults = filteredInventory;

    if (searchResults.length === 0) {
      // No products found, prompt for manual entry
      const itemName = searchTerm.trim();
      setManualItem((prev) => ({
        ...prev,
        name: itemName,
      }));
      setShowManualEntry(true);
    } else if (searchResults.length === 1) {
      // Exactly one product found - automatically add to cart
      const foundItem = searchResults[0];
      addToCart(foundItem);
      setSearchTerm(""); // Clear search after adding

      // Focus back on search input for next scan
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
    // If multiple results, do nothing - let user see the results and click manually
  };

  // Debug function to force refresh inventory from database
  const handleDebugRefresh = async () => {
    console.log("=== DEBUG REFRESH TRIGGERED ===");
    console.log("Current inventory count:", inventory.length);

    // Clear search and filters
    setSearchTerm("");
    setCategoryFilter("");

    // Force refresh inventory by bypassing cache
    await dispatch(loadInventory(true));

    console.log("=== DEBUG REFRESH COMPLETED ===");
    console.log("New inventory count:", inventory.length);

    // Focus back on search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Helper function to determine if a category should be taxable
  const isCategoryTaxable = (category) => {
    // Check if category name contains indicators of taxable items
    const taxableKeywords = [
      "taxable",
      "lotto",
      "lottery",
      "tobacco",
      "alcohol",
    ];
    const nonTaxableKeywords = [
      "non-taxable",
      "untaxable",
      "basic",
      "essential",
    ];

    const categoryLower = category.toLowerCase();

    // First check for explicit non-taxable indicators
    if (nonTaxableKeywords.some((keyword) => categoryLower.includes(keyword))) {
      return false;
    }

    // Then check for explicit taxable indicators
    if (taxableKeywords.some((keyword) => categoryLower.includes(keyword))) {
      return true;
    }

    // Default to taxable for unknown categories (safer for tax compliance)
    return true;
  };

  // Function to add manual item to cart
  const addManualItem = () => {
    if (
      !manualItem.name.trim() ||
      !manualItem.price ||
      parseFloat(manualItem.price) <= 0
    ) {
      alert("Please enter item name and valid price");
      return;
    }

    // Create a consistent ID based on name, price, and category for manual items
    const normalizedName = manualItem.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
    const priceStr = parseFloat(manualItem.price).toFixed(2);
    const manualId = `manual-${normalizedName}-${priceStr}-${manualItem.category}`;

    const newItem = {
      id: manualId, // Consistent ID for same manual items
      name: manualItem.name.trim(),
      price: parseFloat(manualItem.price),
      category: manualItem.category,
      applyTax: isCategoryTaxable(manualItem.category),
      stock: 999, // Manual items don't affect inventory
      isManual: true, // Flag to identify manual items
    };

    // Add to cart with specified quantity
    for (let i = 0; i < manualItem.quantity; i++) {
      addToCart(newItem);
    }

    // Reset manual item form and clear search
    setManualItem({
      name: "",
      price: "",
      category: categories.length > 0 ? categories[0] : "grocery-taxable",
      quantity: 1,
    });
    setShowManualEntry(false);
    setSearchTerm(""); // Clear search term after adding item
  };

  const calculateSubtotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = Number(parseFloat(discountAmount) || 0);
    const cbFee = Number(parseFloat(cashbackFee) || 0); // Add cashback fee if present

    // Card fee logic - apply fee when enabled
    const cardFeeInTotal = cardFeeEnabled ? CARD_FEE_AMOUNT : 0;

    return Math.max(0, subtotal - discount + cbFee + cardFeeInTotal); // Ensure total doesn't go negative
  };

  const calculateTax = () => {
    // Calculate tax on discounted amount for taxable items
    const discountedSubtotal = calculateTotal(); // This already has discount applied
    const originalSubtotal = calculateSubtotal();
    const taxableOriginal = getTaxableTotal();

    if (originalSubtotal === 0) return 0;

    // Calculate proportional discount on taxable items
    const taxableDiscounted =
      taxableOriginal * (discountedSubtotal / originalSubtotal);
    return taxableDiscounted * 0.13; // 13% HST for Ontario, Canada
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

  // Process payment for existing customer balance
  const processCustomerBalancePayment = async (
    paymentTotal,
    cashPaid,
    cardPaid
  ) => {
    if (!selectedCustomer || customerBalance <= 0) {
      alert("No customer selected or customer has no outstanding balance");
      return;
    }

    if (paymentTotal <= 0) {
      alert("Please enter a payment amount in cash or card");
      return;
    }

    // Calculate remaining balance after payment
    const remainingBalance = Math.max(0, customerBalance - paymentTotal);

    try {
      // Process the payment against customer's account
      const response = await fetch("/api/credit/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "payment",
          customerName: selectedCustomer.customerName,
          amount: paymentTotal,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment processing failed");
      }

      const result = await response.json();

      // Create a payment transaction record
      const paymentTransaction = {
        timestamp: new Date().toISOString(),
        items: [
          {
            id: "balance-payment",
            name: `Balance Payment - ${selectedCustomer.customerName}`,
            quantity: 1,
            price: paymentTotal,
            applyTax: false,
            category: "Payment",
          },
        ],
        originalSubtotal: paymentTotal,
        discount: 0,
        subtotal: paymentTotal,
        taxableAmount: 0,
        nonTaxableAmount: paymentTotal,
        tax: 0,
        total: paymentTotal,
        finalTotal: paymentTotal,
        cashback: 0,
        paymentBreakdown: [
          ...(cashPaid > 0 ? [{ method: "cash", amount: cashPaid }] : []),
          ...(cardPaid > 0 ? [{ method: "card", amount: cardPaid }] : []),
        ],
        change: 0,
        isCreditSale: false,
        isPartialPayment: false,
        creditBalance: 0,
        paidAmount: paymentTotal,
        creditCustomerName: selectedCustomer.customerName,
        creditStatus: "payment",
        lottoWinnings: 0,
        isBalancePayment: true, // Special flag for balance payments
        previousBalance: customerBalance,
        newBalance: remainingBalance,
      };

      // Save the payment transaction
      const transactionResponse = await fetch("/api/transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify(paymentTransaction),
      });

      if (transactionResponse.ok) {
        const transactionData = await transactionResponse.json();

        // Show success message and receipt
        setLastTransaction({
          id: transactionData.id,
          ...paymentTransaction,
        });
        setShowReceipt(true);

        // Update local state
        setCustomerBalance(remainingBalance);
        setSelectedCustomer({ ...selectedCustomer, balance: remainingBalance });
        setExistingCustomers((prev) =>
          prev.map((c) =>
            c.customerName === selectedCustomer.customerName
              ? { ...c, balance: remainingBalance }
              : c
          )
        );

        // Reset payment fields
        setCashAmount("");
        setCardAmount("");
        setPaymentError("");

        console.log(
          `Payment processed: $${paymentTotal.toFixed(
            2
          )} paid, remaining balance: $${remainingBalance.toFixed(2)}`
        );
      } else {
        throw new Error("Failed to record payment transaction");
      }
    } catch (error) {
      console.error("Error processing customer payment:", error);
      setPaymentError(error.message || "Failed to process payment");
    }
  };

  // Terminal Payment Handler
  const handleTerminalPayment = async (amount) => {
    try {
      // Show processing indicator
      setPaymentError(
        "Processing payment via terminal... Please present card."
      );

      // Call terminal API
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          processor: "chase", // Using Chase terminal
          terminalId: null, // Will use default Chase terminal ID from env
        }),
      });

      const terminalResult = await response.json();

      if (!response.ok) {
        throw new Error(terminalResult.error || "Terminal request failed");
      }

      if (terminalResult.success) {
        // Set payment amounts for successful terminal payment
        setCashAmount("0");
        setCardAmount(String(amount.toFixed(2)));
        setLastEdited("card");

        // Auto-process checkout after successful terminal payment
        alert(
          `✅ Payment Approved!\n\nTransaction ID: ${
            terminalResult.transactionId
          }\nCard: ${terminalResult.cardType} ****${
            terminalResult.last4
          }\nAmount: $${amount.toFixed(2)}\n\nProcessing sale...`
        );

        // Trigger checkout after short delay
        setTimeout(() => {
          processCheckout();
        }, 500);
      }
    } catch (error) {
      console.error("Terminal payment failed:", error);
      alert(
        `❌ Payment Failed\n\n${error.message}\n\nPlease try again or use manual payment entry.`
      );
      setPaymentError(error.message);
    }
  };

  const processCheckout = () => {
    const originalSubtotal = calculateSubtotal(); // Items total before discount
    const discount = Number(parseFloat(discountAmount) || 0);
    const subtotalWithFees = calculateTotal(); // Use calculateTotal() which includes discount and card fees
    const tax = calculateTax();
    const total = subtotalWithFees + tax;
    const cashback = Number(parseFloat(cashbackAmount) || 0);
    const cbFee = Number(parseFloat(cashbackFee) || 0);

    // Get payment amounts
    const paidCash = Number(parseFloat(cashAmount) || 0);
    const paidCard = Number(parseFloat(cardAmount) || 0);
    const paidTotal = paidCash + paidCard;
    const tempLottoAmount = Number(parseFloat(lottoWinnings) || 0);

    // Special case: Customer balance payment (no items in cart, just paying existing debt)
    if (
      selectedCustomer &&
      customerBalance > 0 &&
      cart.length === 0 &&
      paidTotal > 0
    ) {
      processCustomerBalancePayment(paidTotal, paidCash, paidCard);
      return;
    }

    // Check if there's anything to process (items, cashback, or lotto winnings)
    if (cart.length === 0 && cashback === 0 && tempLottoAmount === 0) {
      alert(
        "No items in cart, no cashback amount, and no lotto winnings entered"
      );
      return;
    }

    // Validate credit sale
    if (isCreditSale && !creditCustomerName.trim()) {
      alert("Please enter customer name for credit sale");
      return;
    }

    // Initialize payment variables (reuse the ones already declared above)
    const lottoAmount = Number(parseFloat(lottoWinnings) || 0);
    let totalWithCashback = total + cashback;
    let change = 0;
    let creditBalance = 0;
    let isPartialPayment = false;

    if (
      isNaN(paidCash) ||
      isNaN(paidCard) ||
      isNaN(cashback) ||
      isNaN(lottoAmount) ||
      paidCash < 0 ||
      paidCard < 0 ||
      cashback < 0 ||
      lottoAmount < 0
    ) {
      setPaymentError("Invalid payment amounts");
      return;
    }

    // Calculate total including cashback as line item, minus lotto winnings
    // Note: card fee is already included in total from calculateTotal()
    const cardFeeForCalc = cardFeeEnabled ? CARD_FEE_AMOUNT : 0;
    const totalCardFee = cardFeeForCalc;

    totalWithCashback = total + cashback - lottoAmount;

    if (isCreditSale) {
      // Use specific credit amount if provided, otherwise calculate from payment difference
      const specifiedCreditAmount = Number(parseFloat(creditAmount) || 0);

      if (specifiedCreditAmount > 0) {
        // Customer specified exact credit amount
        creditBalance = specifiedCreditAmount;
        const requiredPayment = totalWithCashback - creditBalance;

        if (requiredPayment > paidTotal + 0.001) {
          setPaymentError(
            `Need $${requiredPayment.toFixed(
              2
            )} payment for $${creditBalance.toFixed(
              2
            )} credit (Currently paid: $${paidTotal.toFixed(2)})`
          );
          return;
        }

        isPartialPayment = creditBalance > 0 && paidTotal > 0;
      } else {
        // Traditional mode: credit = remaining balance after payment
        creditBalance = Math.max(0, totalWithCashback - paidTotal);
        isPartialPayment = paidTotal > 0 && creditBalance > 0;
      }

      // Validate customer name for any credit amount
      if (creditBalance > 0 && !creditCustomerName.trim()) {
        alert("Please enter customer name for credit amount");
        return;
      }

      // If no payment and no credit amount specified, require customer name
      if (
        paidTotal === 0 &&
        creditBalance === 0 &&
        !creditCustomerName.trim()
      ) {
        alert("Please enter customer name or specify payment/credit amounts");
        return;
      }
    } else {
      // For non-credit sales, require full payment
      // For cashback transactions, require card payment to cover total including cashback
      if (cashback > 0) {
        if (paidCard < totalWithCashback - 0.001) {
          setPaymentError(
            `Cashback requires card payment of $${totalWithCashback.toFixed(
              2
            )} (Total with Cashback: $${totalWithCashback.toFixed(2)})`
          );
          return;
        }
      } else {
        // Regular transaction without cashback
        if (paidTotal < totalWithCashback - 0.001) {
          setPaymentError(
            `Payment is insufficient. Need $${totalWithCashback.toFixed(
              2
            )} for purchase`
          );
          return;
        }
      }

      change =
        cashback > 0
          ? 0
          : Math.max(0, +(paidTotal - totalWithCashback).toFixed(2));
    }

    // Payment breakdown for different transaction types
    let finalCashAmount = 0;
    let finalCardAmount = 0;

    if (isCreditSale) {
      // Credit sale - no immediate payment
      finalCashAmount = 0;
      finalCardAmount = 0;
    } else {
      // Regular payment handling - record only the actual sale amount, not overpayment
      // Cash amount should be the portion of the total that was paid in cash (up to total owed)
      const totalOwed = totalWithCashback;
      finalCashAmount = Math.min(paidCash, Math.max(0, totalOwed));
      finalCardAmount = Math.min(
        paidCard,
        Math.max(0, totalOwed - finalCashAmount)
      );

      if (cashback > 0) {
        // Cashback transactions: record cash going out and card payment
        finalCashAmount = -cashback; // Cash reduced from register
        finalCardAmount = paidCard; // Card payment covers purchase + cashback
      }

      // Handle lotto winnings - customer gets cash back if total is negative
      if (lottoAmount > 0 && totalWithCashback < 0) {
        // Customer owes nothing and gets money back (lotto winnings exceed purchase total)
        finalCashAmount = totalWithCashback; // Negative cash amount = cash going out of register
        finalCardAmount = 0; // No card payment needed
      } else if (lottoAmount > 0) {
        // Lotto winnings reduce the amount customer needs to pay
        // Adjust payment amounts proportionally
        const remainingTotal = totalWithCashback;
        if (remainingTotal > 0) {
          const cashRatio = paidCash / paidTotal;
          const cardRatio = paidCard / paidTotal;
          finalCashAmount = remainingTotal * cashRatio;
          finalCardAmount = remainingTotal * cardRatio;
        }
      }
    }

    const paymentBreakdown = [];
    if (isCreditSale) {
      // For partial payments, record both payment and credit
      if (isPartialPayment) {
        if (paidCash > 0)
          paymentBreakdown.push({
            method: "cash",
            amount: +paidCash.toFixed(2),
          });
        if (paidCard > 0)
          paymentBreakdown.push({
            method: "card",
            amount: +paidCard.toFixed(2),
          });
        paymentBreakdown.push({
          method: "credit",
          amount: +creditBalance.toFixed(2),
          customerName: creditCustomerName.trim(),
        });
      } else {
        // Full credit sale (no payment)
        paymentBreakdown.push({
          method: "credit",
          amount: +totalWithCashback.toFixed(2),
          customerName: creditCustomerName.trim(),
        });
      }
    } else {
      if (finalCashAmount !== 0)
        paymentBreakdown.push({
          method: "cash",
          amount: +finalCashAmount.toFixed(2),
        });
      if (finalCardAmount > 0)
        paymentBreakdown.push({
          method: "card",
          amount: +finalCardAmount.toFixed(2),
        });
    }

    // Add lotto winnings to payment breakdown for tracking
    if (lottoAmount > 0)
      paymentBreakdown.push({
        method: "lotto",
        amount: +lottoAmount.toFixed(2),
      });

    // Include cashback as an item if present
    const transactionItems = cart.map((c) => ({
      id: c.id,
      name: c.name,
      quantity: c.quantity,
      price: c.price,
      applyTax: c.applyTax,
      category: c.category,
    }));

    // Add cashback as a line item if present
    if (cashback > 0) {
      transactionItems.push({
        id: "cashback-item",
        name: "Cashback",
        quantity: 1,
        price: cashback,
        applyTax: false,
        category: "Cashback",
      });
    }

    // Add cashback fee as a line item if present
    if (cbFee > 0) {
      transactionItems.push({
        id: "cashback-fee-item",
        name: "Cashback Fee",
        quantity: 1,
        price: cbFee,
        applyTax: true, // Cashback fees are typically taxable
        category: "Fees",
      });
    }

    // Add card fee as a line item if present
    const cardFeeForItem = cardFeeEnabled ? CARD_FEE_AMOUNT : 0;
    const ccChargeForLineItem = cardFeeForItem;
    if (ccChargeForLineItem > 0) {
      transactionItems.push({
        id: "card-processing-fee-item",
        name: "Card Processing Fee",
        quantity: 1,
        price: ccChargeForLineItem,
        applyTax: false, // Card processing fees are typically not taxable
        category: "Fees",
      });
    }

    // Add lotto winnings as a line item if present (negative price = discount)
    if (lottoAmount > 0) {
      transactionItems.push({
        id: "lotto-winnings",
        name: "Lotto Winnings",
        quantity: 1,
        price: -lottoAmount, // Negative price = credit/discount
        applyTax: false,
        category: "Lotto",
      });
    }

    // Add discount as a line item if present (negative price = discount)
    if (discount > 0) {
      transactionItems.push({
        id: "discount-item",
        name: "Discount",
        quantity: 1,
        price: -discount,
        applyTax: false,
        category: "Discount",
      });
    }

    // Recalculate totals with cashback, lotto winnings, discount, and cashback fee included as items
    const newSubtotal =
      originalSubtotal + cashback - lottoAmount - discount + cbFee;
    const newTaxableTotal = getTaxableTotal() + cbFee; // cashback fee is taxable, discount/cashback/lotto are non-taxable
    const newNonTaxableTotal =
      getNonTaxableTotal() + cashback - lottoAmount - discount;
    const newTax = tax; // tax already calculated on discounted amount
    const newTotal = total + cashback - lottoAmount + ccChargeForLineItem;

    const transaction = {
      timestamp: new Date().toISOString(),
      items: transactionItems,
      originalSubtotal: originalSubtotal, // Items total before discount
      discount: discount,
      subtotal: newSubtotal,
      taxableAmount: newTaxableTotal,
      nonTaxableAmount: newNonTaxableTotal,
      tax: newTax,
      total: newTotal,
      finalTotal: totalWithCashback, // Total amount customer owes
      cashback: cashback,
      paymentBreakdown,
      change,
      isCreditSale: isCreditSale,
      isPartialPayment: isPartialPayment,
      creditBalance: creditBalance,
      paidAmount: paidTotal,
      creditCustomerName: isCreditSale ? creditCustomerName.trim() : null,
      creditStatus: isCreditSale
        ? creditBalance > 0
          ? "unpaid"
          : "paid"
        : null,
      lottoWinnings: lottoAmount,
      // Enhanced card fee tracking
      cardType: cardType,
      cardFeeEnabled: cardFeeEnabled,
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
          setCashAmount("");
          setCardAmount("");
          setCashbackAmount("");
          setLottoWinnings("");
          setDiscountAmount("");
          setIsCreditSale(false);
          setCreditCustomerName("");
          setCreditAmount(0);
          setPaymentError("");
          // Reset card fee states
          setCardType("debit");
          setCardFeeEnabled(false);
          // Update inventory for all sales except full credit sales (no payment)
          // Partial payments should update inventory since goods are delivered
          if (!isCreditSale || isPartialPayment) {
            dispatch(updateInventoryAfterTransaction(cart));
          }

          // Update credit account if this is a credit sale
          if (isCreditSale && creditCustomerName.trim()) {
            try {
              const creditAccountResponse = await fetch(
                "/api/credit/accounts",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    action: "addCredit",
                    customerName: creditCustomerName.trim(),
                    amount: creditBalance,
                    transactionId: data.id,
                  }),
                }
              );

              if (!creditAccountResponse.ok) {
                console.warn(
                  "Failed to update credit account:",
                  await creditAccountResponse.text()
                );
              } else {
                const updatedCustomerResponse =
                  await creditAccountResponse.json();
                const updatedAccount = updatedCustomerResponse.account;
                console.log(
                  "Credit account updated successfully for customer:",
                  creditCustomerName.trim(),
                  "New balance:",
                  updatedAccount.balance
                );

                // Update local state if this customer was selected
                if (
                  selectedCustomer &&
                  selectedCustomer.customerName === creditCustomerName.trim()
                ) {
                  setCustomerBalance(updatedAccount.balance);
                  setSelectedCustomer(updatedAccount);

                  // Update the customers list
                  setExistingCustomers((prev) =>
                    prev.map((c) =>
                      c.customerName === creditCustomerName.trim()
                        ? updatedAccount
                        : c
                    )
                  );
                } else {
                  // If no customer selected, refresh the entire list
                  fetchExistingCustomers();
                }
              }
            } catch (err) {
              console.warn("Error updating credit account:", err);
            }
          }
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
    setCashAmount("");
    setCardAmount("");
    setCashbackAmount("");
    setCashbackFee("");
    setCashbackEnabled(false);
    setLottoWinnings("");
    setDiscountAmount("");
    setIsCreditSale(false);
    setCreditCustomerName("");
    setCreditAmount(0);
    setPaymentError("");
    // Reset card fee states
    setCardType("debit");
    setCardFeeEnabled(false);
  };

  // Credit customer management functions
  const fetchExistingCustomers = async () => {
    try {
      const response = await fetch("/api/credit/accounts");
      if (response.ok) {
        const data = await response.json();
        // The API returns accounts in an 'accounts' property
        const customers = data.accounts || [];
        console.log("Fetched existing customers:", customers);
        setExistingCustomers(customers);
      } else {
        console.error("Failed to fetch existing customers");
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    }
  };

  const handleCustomerNameChange = (value) => {
    setCreditCustomerName(value);

    if (value.length > 0 && Array.isArray(existingCustomers)) {
      const matchingCustomers = existingCustomers.filter(
        (customer) =>
          customer &&
          customer.customerName &&
          customer.customerName.toLowerCase().includes(value.toLowerCase())
      );
      // Always show suggestions when typing (for existing customers or new customer option)
      setShowCustomerSuggestions(true);

      // Auto-select if exact match
      const exactMatch = existingCustomers.find(
        (customer) =>
          customer &&
          customer.customerName &&
          customer.customerName.toLowerCase() === value.toLowerCase()
      );
      if (exactMatch) {
        setSelectedCustomer(exactMatch);
        setCustomerBalance(exactMatch.balance || 0);
        setShowPaymentOptions(true);
      } else {
        setSelectedCustomer(null);
        setCustomerBalance(0);
        setShowPaymentOptions(false);
      }
    } else {
      setShowCustomerSuggestions(false);
      setSelectedCustomer(null);
      setCustomerBalance(0);
      setShowPaymentOptions(false);
    }
  };

  const handleCustomerSelection = (customer) => {
    setCreditCustomerName(customer.customerName);
    setSelectedCustomer(customer);
    setCustomerBalance(customer.balance || 0);
    setShowCustomerSuggestions(false);
    setShowPaymentOptions(true);
  };

  const processCustomerPayment = async (paymentAmount) => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch("/api/credit/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "payment",
          customerName: selectedCustomer.customerName,
          amount: paymentAmount,
        }),
      });

      if (response.ok) {
        const updatedCustomer = await response.json();
        setCustomerBalance(updatedCustomer.balance);
        setSelectedCustomer(updatedCustomer);

        // Update the customers list
        setExistingCustomers((prev) =>
          prev.map((c) =>
            c.customerName === updatedCustomer.customerName
              ? updatedCustomer
              : c
          )
        );
      }
    } catch (err) {
      console.error("Error processing payment:", err);
    }
  };

  // Load existing customers when credit sale mode is activated
  useEffect(() => {
    if (isCreditSale && existingCustomers.length === 0) {
      fetchExistingCustomers();
    }
  }, [isCreditSale]);

  // Handle creditPayment URL parameter from credit management page
  useEffect(() => {
    const creditPaymentParam = searchParams?.get("creditPayment");
    if (creditPaymentParam) {
      console.log("Credit payment parameter detected:", creditPaymentParam);

      // Enable credit sale mode
      setIsCreditSale(true);

      // Set the customer name
      setCreditCustomerName(creditPaymentParam);

      // Fetch existing customers to find this specific customer
      fetchExistingCustomers().then(() => {
        // This will be handled by the next useEffect when existingCustomers updates
      });
    }
  }, [searchParams]);

  // Auto-select customer when creditPayment parameter is used
  useEffect(() => {
    const creditPaymentParam = searchParams?.get("creditPayment");
    if (creditPaymentParam && existingCustomers.length > 0) {
      const targetCustomer = existingCustomers.find(
        (customer) =>
          customer.customerName.toLowerCase() ===
          creditPaymentParam.toLowerCase()
      );

      if (targetCustomer) {
        console.log("Auto-selecting customer:", targetCustomer);
        setSelectedCustomer(targetCustomer);
        setCustomerBalance(targetCustomer.balance || 0);
        setShowPaymentOptions(true);
        setShowCustomerSuggestions(false);
      }
    }
  }, [existingCustomers, searchParams]);

  // Reset to new sale when navigating to POS (e.g., from header navigation)
  useEffect(() => {
    const newSaleParam = searchParams?.get("newSale");
    if (newSaleParam === "true") {
      // Auto-start new sale when newSale=true parameter is present
      startNewSale();

      // Clear the newSale parameter from URL without page reload
      const url = new URL(window.location);
      url.searchParams.delete("newSale");
      window.history.replaceState({}, "", url);
    }
  }, [searchParams]);

  const swapPayments = () => {
    const currentCash = cashAmount;
    const currentCard = cardAmount;

    setCashAmount(currentCard);
    setCardAmount(currentCash);

    // Update last edited to reflect the swap
    if ((Number(currentCard) || 0) > 0) {
      setLastEdited("cash");
    } else if ((Number(currentCash) || 0) > 0) {
      setLastEdited("card");
    }
  };

  const printReceipt = () => {
    if (!lastTransaction) return;

    const printWindow = window.open("", "_blank");
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Transaction #${(lastTransaction.id || "N/A")
            .toString()
            .slice(-8)}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 20px;
              max-width: 300px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .receipt-item {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
            }
            .receipt-totals {
              margin-top: 10px;
            }
            .total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            hr {
              border: none;
              border-top: 1px solid #000;
              margin: 10px 0;
            }
            .center {
              text-align: center;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">CONVENIENCE STORE</div>
            <div>Scarborough, Ontario</div>
            <div>Transaction #${(lastTransaction.id || "N/A")
              .toString()
              .slice(-8)}</div>
            <div>${new Date(lastTransaction.timestamp).toLocaleString()}</div>
          </div>
          
          <hr>
          
          ${lastTransaction.items
            .map(
              (item) => `
            <div class="receipt-item">
              <div>${item.name} ${!item.taxable ? "(No HST)" : ""}</div>
            </div>
            <div class="receipt-item">
              <div>${item.quantity} x $${item.price.toFixed(2)}</div>
              <div>$${(item.quantity * item.price).toFixed(2)}</div>
            </div>
          `
            )
            .join("")}
          
          <hr>
          
          <div class="receipt-totals">
            ${
              lastTransaction.taxableAmount > 0 &&
              lastTransaction.nonTaxableAmount > 0
                ? `
              <div class="receipt-item">
                <span>Taxable Items:</span>
                <span>$${lastTransaction.taxableAmount.toFixed(2)}</span>
              </div>
              <div class="receipt-item">
                <span>Non-Taxable Items:</span>
                <span>$${lastTransaction.nonTaxableAmount.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            ${
              lastTransaction.discount > 0
                ? `
              <div class="receipt-item">
                <span>Items Subtotal:</span>
                <span>$${lastTransaction.originalSubtotal.toFixed(2)}</span>
              </div>
              <div class="receipt-item" style="font-weight: bold; color: #e65100;">
                <span>Discount:</span>
                <span>-$${lastTransaction.discount.toFixed(2)}</span>
              </div>
              <div class="receipt-item">
                <span>Subtotal:</span>
                <span>$${lastTransaction.subtotal.toFixed(2)}</span>
              </div>
            `
                : `
              <div class="receipt-item">
                <span>Subtotal:</span>
                <span>$${lastTransaction.subtotal.toFixed(2)}</span>
              </div>
            `
            }
            
            ${
              lastTransaction.includeTax && lastTransaction.tax > 0
                ? `
              <div class="receipt-item">
                <span>HST (13%):</span>
                <span>$${lastTransaction.tax.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            <div class="receipt-item total">
              <span>Total:</span>
              <span>$${lastTransaction.total.toFixed(2)}</span>
            </div>
            
            ${
              lastTransaction.cashback > 0
                ? `
              <div class="receipt-item" style="font-weight: bold; color: #e67e22;">
                <span>Cashback:</span>
                <span>$${lastTransaction.cashback.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            ${
              lastTransaction.paymentBreakdown &&
              lastTransaction.paymentBreakdown.length > 0
                ? `
              <hr>
              <div style="font-weight: bold; margin-bottom: 5px;">Payments</div>
              ${lastTransaction.paymentBreakdown
                .map(
                  (p) => `
                <div class="receipt-item">
                  <span>${p.method.toUpperCase()}:</span>
                  <span>$${p.amount.toFixed(2)}</span>
                </div>
              `
                )
                .join("")}
              ${
                lastTransaction.change > 0
                  ? `
                <div class="receipt-item">
                  <span>Change:</span>
                  <span>$${lastTransaction.change.toFixed(2)}</span>
                </div>
              `
                  : ""
              }
            `
                : ""
            }
          </div>
          
          <hr>
          <div class="center">Thank you for your business!</div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(receiptContent);
    printWindow.document.close();
  };

  // When cart changes, reset payment amounts (default card for cashback, otherwise cash)
  useEffect(() => {
    // Don't auto-reset payment amounts when in credit sale mode - let user control them
    if (isCreditSale) {
      setPaymentError("");
      return;
    }

    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = +(subtotal + tax).toFixed(2);
    const cashback = Number(parseFloat(cashbackAmount) || 0);
    const lotto = Number(parseFloat(lottoWinnings) || 0);
    const totalWithCashback = total + cashback - lotto;

    // For cashback transactions, force card payment only
    if (cashback > 0) {
      setCashAmount("");
      setCardAmount(Math.max(0, totalWithCashback));
      setLastEdited("card");
    } else {
      // Default: cash covers the total minus lotto winnings
      setCashAmount(Math.max(0, totalWithCashback));
      setCardAmount(0);
      setLastEdited("cash");
    }
    setPaymentError("");
  }, [
    cart,
    cashbackAmount,
    cashbackFee,
    lottoWinnings,
    discountAmount,
    isCreditSale,
    cardFeeEnabled,
  ]);

  // If auto-fill is enabled and lastEdited is set, update the other amount
  useEffect(() => {
    if (!autoFillOther || !lastEdited || isCreditSale) return; // Don't auto-fill in credit sale mode
    const subtotal = calculateTotal();
    const tax = calculateTax();
    const total = +(subtotal + tax).toFixed(2);
    const cashback = Number(parseFloat(cashbackAmount) || 0);
    const lotto = Number(parseFloat(lottoWinnings) || 0);
    const totalWithCashback = total + cashback - lotto;

    // For cashback transactions, only allow card payment
    if (cashback > 0) {
      setCashAmount("");
      setCardAmount(Math.max(0, totalWithCashback));
      return;
    }

    if (lastEdited === "cash") {
      const paidCash = Number(parseFloat(cashAmount) || 0);
      const newCard = Math.max(0, +(totalWithCashback - paidCash).toFixed(2));
      setCardAmount(newCard);
    } else if (lastEdited === "card") {
      const paidCard = Number(parseFloat(cardAmount) || 0);
      const newCash = Math.max(0, +(totalWithCashback - paidCard).toFixed(2));
      setCashAmount(newCash);
    }
  }, [
    autoFillOther,
    lastEdited,
    cashAmount,
    cardAmount,
    cart,
    cashbackAmount,
    cashbackFee,
    lottoWinnings,
    discountAmount,
    isCreditSale,
    cardFeeEnabled,
  ]);

  // Barcode Scanner Functionality
  useEffect(() => {
    // Auto-focus search input when component mounts
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }

    const handleKeyDown = (event) => {
      // Don't interfere with barcode scanner when manual entry modal is open
      if (showManualEntry) {
        return;
      }

      // Don't interfere if user is typing in input fields or form elements
      const activeElement = document.activeElement;
      const isTypingInInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.contentEditable === "true");

      if (isTypingInInput) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;

      // If time between keystrokes is less than 50ms, it's likely a barcode scanner
      // Barcode scanners type very fast (typically 10-30ms between characters)
      const isScannerInput = timeDiff < 50 && timeDiff > 0;

      // Only focus search input if user is not typing in any input field and it's not already focused
      if (
        document.activeElement !== searchInputRef.current &&
        !isTypingInInput &&
        ![
          "Tab",
          "Escape",
          "F1",
          "F2",
          "F3",
          "F4",
          "F5",
          "F6",
          "F7",
          "F8",
          "F9",
          "F10",
          "F11",
          "F12",
        ].includes(event.key)
      ) {
        searchInputRef.current?.focus();
      }

      // Handle barcode scanning (only if not typing in input fields)
      if (!isTypingInInput) {
        if (event.key === "Enter") {
          // End of barcode scan - process the buffer
          if (barcodeBuffer.trim().length > 0) {
            handleBarcodeScanned(barcodeBuffer.trim());
            setBarcodeBuffer("");
          }
        } else if (isScannerInput && event.key.length === 1) {
          // Add character to barcode buffer
          setBarcodeBuffer((prev) => prev + event.key);
        } else if (!isScannerInput) {
          // Reset buffer if typing is too slow (manual typing)
          setBarcodeBuffer("");
        }
      }

      setLastKeyTime(currentTime);
    };

    const handleFocusAnywhere = (event) => {
      // Don't interfere when manual entry modal is open
      if (showManualEntry) {
        return;
      }

      // Don't refocus if clicking on form elements that need focus
      const clickedElement = event.target;
      const isFormElement =
        clickedElement.tagName === "SELECT" ||
        clickedElement.tagName === "OPTION" ||
        clickedElement.tagName === "INPUT" ||
        clickedElement.tagName === "BUTTON" ||
        clickedElement.tagName === "TEXTAREA";

      // Don't refocus if clicking on the category filter or its options
      const isCategoryFilter =
        clickedElement.closest("select") || clickedElement.tagName === "SELECT";

      if (isFormElement || isCategoryFilter) {
        return; // Let the form element handle its own focus
      }

      // Ensure search input stays focused when clicking elsewhere on the page
      setTimeout(() => {
        if (
          searchInputRef.current &&
          document.activeElement !== searchInputRef.current &&
          !document.activeElement.closest("select")
        ) {
          searchInputRef.current.focus();
        }
      }, 100);
    };

    // Add event listeners
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleFocusAnywhere);

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleFocusAnywhere);
    };
  }, [barcodeBuffer, lastKeyTime, showManualEntry]);

  // Handle barcode scanned
  const handleBarcodeScanned = (barcode) => {
    console.log("Barcode scanned:", barcode);

    // Use the enhanced search functionality to find products
    // This will search by barcode, productId, id, name, and category
    const searchResults = getFilteredInventory(barcode);

    if (searchResults.length === 1) {
      // Exactly one product found - automatically add to cart
      const foundProduct = searchResults[0];
      addToCart(foundProduct);
      console.log("Product added to cart via barcode:", foundProduct.name);
    } else if (searchResults.length > 1) {
      // Multiple matches - show in search results for user to choose
      setSearchTerm(barcode);
      console.log(
        `Multiple products found for barcode ${barcode}:`,
        searchResults.map((p) => p.name)
      );
    } else {
      // No product found - automatically prompt for manual entry
      setSearchTerm(barcode);
      setManualItem((prev) => ({
        ...prev,
        name: barcode,
      }));
      setShowManualEntry(true);
      console.log(
        "Product not found for barcode:",
        barcode,
        "- opening manual entry"
      );
    }
  };

  if (showReceipt && lastTransaction) {
    return (
      <POSWrapper>
        <Container>
          <ReceiptSection>
            <h2>Transaction Complete!</h2>
            <div className="receipt">
              <h3>CONVENIENCE STORE</h3>
              <p>Scarborough, Ontario</p>
              <p>
                Transaction #
                {(lastTransaction.id || "N/A").toString().slice(-8)}
              </p>
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
                        Taxable Items: $
                        {lastTransaction.taxableAmount.toFixed(2)}
                      </div>
                      <div>
                        Non-Taxable Items: $
                        {lastTransaction.nonTaxableAmount.toFixed(2)}
                      </div>
                    </>
                  )}
                {lastTransaction.discount > 0 ? (
                  <>
                    <div>
                      Items Subtotal: $
                      {lastTransaction.originalSubtotal.toFixed(2)}
                    </div>
                    <div style={{ fontWeight: "600", color: "#e65100" }}>
                      Discount: -${lastTransaction.discount.toFixed(2)}
                    </div>
                    <div>Subtotal: ${lastTransaction.subtotal.toFixed(2)}</div>
                  </>
                ) : (
                  <div>Subtotal: ${lastTransaction.subtotal.toFixed(2)}</div>
                )}
                {lastTransaction.includeTax && lastTransaction.tax > 0 && (
                  <div>HST (13%): ${lastTransaction.tax.toFixed(2)}</div>
                )}
                <div className="total">
                  Total: ${lastTransaction.total.toFixed(2)}
                </div>
                {lastTransaction.cashback > 0 && (
                  <div style={{ fontWeight: "600", color: "#e67e22" }}>
                    Cashback: ${lastTransaction.cashback.toFixed(2)}
                  </div>
                )}
                {lastTransaction.paymentBreakdown &&
                  lastTransaction.paymentBreakdown.length > 0 && (
                    <>
                      <hr />
                      <div>
                        <strong>Payments</strong>
                      </div>
                      {lastTransaction.paymentBreakdown.map((p, idx) => (
                        <div key={`payment-${p.method}-${idx}`}>
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
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <Button
                onClick={printReceipt}
                style={{ backgroundColor: "#27ae60", color: "white" }}
              >
                🖨️ Print Receipt
              </Button>
              <Button onClick={startNewSale}>New Sale</Button>
            </div>
          </ReceiptSection>
        </Container>
      </POSWrapper>
    );
  }

  return (
    <POSWrapper>
      <Container>
        <POSGrid>
          <ProductsPanel>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <h2>Products</h2>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#7f8c8d",
                  padding: "0.25rem 0.5rem",
                  background: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                {inventory.length} items loaded
                {inventoryLoaded && (
                  <span
                    style={{
                      marginLeft: "0.5rem",
                      color: inventoryLoading ? "#f39c12" : "#27ae60",
                    }}
                  >
                    • {inventoryLoading ? "syncing..." : "ready"}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ position: "relative", flex: 1, display: "flex" }}>
                <SearchBar
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products... (Barcode Scanner Ready)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => handleInputFocus(searchInputRef)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearchEnter();
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    if (showKeyboard && activeInputRef === searchInputRef) {
                      setShowKeyboard(false);
                    } else if (activeInputRef === searchInputRef) {
                      // Keyboard was hidden but search input was the last active - preserve mode
                      showKeyboardForInput(searchInputRef);
                    } else {
                      // First time focusing search input - use numeric keyboard for barcodes
                      handleInputFocus(searchInputRef);
                    }
                  }}
                  style={{
                    marginLeft: "0.5rem",
                    padding: "0.75rem",
                    background:
                      showKeyboard && activeInputRef === searchInputRef
                        ? "#27ae60"
                        : "#3498db",
                    minWidth: "auto",
                  }}
                  title="Toggle Virtual Keyboard"
                >
                  ⌨️
                </Button>
                {barcodeBuffer && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-25px",
                      right: "0",
                      background: "#27ae60",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: "bold",
                    }}
                  >
                    📷 Scanning...
                  </div>
                )}
              </div>
              <button
                onClick={handleDebugRefresh}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#e74c3c",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  whiteSpace: "nowrap",
                }}
                title="Force refresh inventory from database (Debug)"
              >
                🔄 Refresh
              </button>
              <CategoryFilter
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  // After selection, return focus to search bar
                  setTimeout(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }, 100);
                }}
                onBlur={(e) => {
                  // When dropdown loses focus (after selection or clicking away), return to search
                  setTimeout(() => {
                    if (
                      searchInputRef.current &&
                      document.activeElement !== searchInputRef.current
                    ) {
                      searchInputRef.current.focus();
                    }
                  }, 100);
                }}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </CategoryFilter>

              <button
                onClick={() => setShowManualEntry(true)}
                style={{
                  marginLeft: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Manual Item
              </button>
            </div>

            {/* Category Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "0.8rem",
                marginBottom: "1.5rem",
                maxHeight: "200px",
                overflowX: "auto",
              }}
            >
              {[
                {
                  name: "Lotto",
                  key: "Lotto",
                  icon: "🎲",
                  color: "#e74c3c",
                  description: "Type amount & click to add",
                },
                {
                  name: "Grocery",
                  key: "Grocery",
                  icon: "🛒",
                  color: "#27ae60",
                  description: "Type amount & click to add",
                },
                {
                  name: "Western Union",
                  key: "WesternUnion",
                  icon: "💸",
                  color: "#8e44ad",
                  description: "Type amount & click to add",
                },
                {
                  name: "Tea",
                  key: "Tea",
                  icon: "🍵",
                  color: "#d35400",
                  description: "Type amount & click to add",
                },
                {
                  name: "Bakery",
                  key: "Bakery",
                  icon: "🍞",
                  color: "#f39c12",
                  description: "Bread & Baked Goods",
                },
                {
                  name: "Dairy",
                  key: "Dairy",
                  icon: "🥛",
                  color: "#16a085",
                  description: "Milk & Dairy Products",
                },
                {
                  name: "Beverages",
                  key: "Beverages",
                  icon: "🥤",
                  color: "#3498db",
                  description: "Drinks & Refreshments",
                },
                {
                  name: "Tobacco",
                  key: "Tobacco",
                  icon: "🚬",
                  color: "#95a5a6",
                  description: "Cigarettes & Cigars",
                },
                {
                  name: "Snacks",
                  key: "Snacks",
                  icon: "🍿",
                  color: "#e67e22",
                  description: "Chips & Snacks",
                },
              ].map((category) => (
                <div
                  key={category.key}
                  data-category={category.key}
                  onClick={() => {
                    // Special handling for Lotto, Grocery, Western Union, and Tea categories
                    if (
                      category.key === "Lotto" ||
                      category.key === "Grocery" ||
                      category.key === "WesternUnion" ||
                      category.key === "Tea"
                    ) {
                      // Check search term first, then currently focused input field
                      let inputValue = searchTerm.trim();

                      // If search is empty, check the currently active input field
                      if (
                        !inputValue &&
                        activeInputRef &&
                        activeInputRef.current
                      ) {
                        inputValue = activeInputRef.current.value;
                      }

                      // If still no value, check other input fields that might have values
                      if (!inputValue) {
                        const inputs = [
                          discountRef,
                          cashAmountRef,
                          cardAmountRef,
                          cashbackAmountRef,
                          lottoWinningsRef,
                        ];
                        for (const inputRef of inputs) {
                          if (inputRef.current && inputRef.current.value) {
                            inputValue = inputRef.current.value;
                            break;
                          }
                        }
                      }

                      const numericValue = parseFloat(inputValue);

                      // Check if search term is a valid number
                      if (!isNaN(numericValue) && numericValue > 0) {
                        // Create item with the specified amount based on category
                        let newItem;

                        if (category.key === "Lotto") {
                          newItem = {
                            id: `lotto-${Date.now()}`, // Unique ID for manual lotto item
                            name: `Lotto $${numericValue.toFixed(2)}`,
                            category: "Lotto",
                            price: numericValue,
                            stock: 999,
                            lowStockThreshold: 0,
                            applyTax: true, // Lotto is typically taxable
                            isManual: true,
                          };
                        } else if (category.key === "Grocery") {
                          newItem = {
                            id: `grocery-${Date.now()}`, // Unique ID for manual grocery item
                            name: `Grocery Item $${numericValue.toFixed(2)}`,
                            category: "Grocery",
                            price: numericValue,
                            stock: 999,
                            lowStockThreshold: 0,
                            applyTax: true, // Grocery is typically taxable
                            isManual: true,
                          };
                        } else if (category.key === "WesternUnion") {
                          newItem = {
                            id: `western-union-${Date.now()}`, // Unique ID for manual Western Union item
                            name: `Western Union $${numericValue.toFixed(2)}`,
                            category: "Western Union",
                            price: numericValue,
                            stock: 999,
                            lowStockThreshold: 0,
                            applyTax: true, // Western Union is typically taxable
                            isManual: true,
                          };
                        } else if (category.key === "Tea") {
                          newItem = {
                            id: `tea-${Date.now()}`, // Unique ID for manual Tea item
                            name: `Tea $${numericValue.toFixed(2)}`,
                            category: "Tea",
                            price: numericValue,
                            stock: 999,
                            lowStockThreshold: 0,
                            applyTax: true, // Tea is typically taxable
                            isManual: true,
                          };
                        }

                        // Add to cart
                        addToCart(newItem);

                        // Clear the input field that was used
                        if (searchTerm.trim()) {
                          setSearchTerm("");
                        } else if (activeInputRef && activeInputRef.current) {
                          // Clear the currently active input field
                          activeInputRef.current.value = "";
                          // Trigger onChange event to update state
                          const event = new Event("input", { bubbles: true });
                          activeInputRef.current.dispatchEvent(event);
                        }

                        // Show success feedback
                        console.log(`Added ${newItem.name} to cart`);

                        // Brief visual feedback by temporarily highlighting the card
                        const currentCard = document.querySelector(
                          `[data-category="${category.key}"]`
                        );
                        if (currentCard) {
                          currentCard.style.transform = "scale(1.05)";
                          setTimeout(() => {
                            currentCard.style.transform = "scale(1)";
                          }, 200);
                        }

                        // Return focus to search bar
                        setTimeout(() => {
                          if (searchInputRef.current) {
                            searchInputRef.current.focus();
                          }
                        }, 100);

                        return; // Don't set category filter, just add the item
                      }
                    }

                    // Default behavior: set category filter
                    setCategoryFilter(category.key);
                    // Return focus to search bar after category selection
                    setTimeout(() => {
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }, 100);
                  }}
                  style={{
                    background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`,
                    color: "white",
                    padding: "0.8rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    boxShadow:
                      categoryFilter === category.key
                        ? `0 8px 25px ${category.color}40`
                        : "0 4px 15px rgba(0,0,0,0.1)",
                    transform:
                      categoryFilter === category.key
                        ? "translateY(-2px)"
                        : "translateY(0)",
                    border:
                      categoryFilter === category.key
                        ? `3px solid ${category.color}`
                        : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (categoryFilter !== category.key) {
                      e.target.style.transform = "translateY(-1px)";
                      e.target.style.boxShadow = `0 6px 20px ${category.color}30`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (categoryFilter !== category.key) {
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                    }
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                    {category.icon}
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: "600",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {category.name}
                  </div>
                  <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                    {category.description}
                  </div>
                </div>
              ))}

              {/* Clear Filter Card */}
              <div
                onClick={() => {
                  setCategoryFilter("");
                  setTimeout(() => {
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }, 100);
                }}
                style={{
                  background:
                    categoryFilter === ""
                      ? "linear-gradient(135deg, #2c3e50, #34495e)"
                      : "linear-gradient(135deg, #ecf0f1, #bdc3c7)",
                  color: categoryFilter === "" ? "white" : "#2c3e50",
                  padding: "0.8rem",
                  borderRadius: "10px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all 0.2s ease",
                  boxShadow:
                    categoryFilter === ""
                      ? "0 8px 25px rgba(44,62,80,0.3)"
                      : "0 4px 15px rgba(0,0,0,0.1)",
                  transform:
                    categoryFilter === ""
                      ? "translateY(-2px)"
                      : "translateY(0)",
                  border:
                    categoryFilter === ""
                      ? "3px solid #2c3e50"
                      : "3px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (categoryFilter !== "") {
                    e.target.style.transform = "translateY(-1px)";
                    e.target.style.boxShadow = "0 6px  20px rgba(44,62,80,0.2)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (categoryFilter !== "") {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(0,0,0,0.1)";
                  }
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  🏪
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    marginBottom: "0.25rem",
                  }}
                >
                  All Categories
                </div>
                <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                  View All Products
                </div>
              </div>
            </div>

            {/* Manual Entry Modal */}
            {showManualEntry && (
              <div
                style={{
                  position: "fixed",
                  top: "0",
                  left: "0",
                  right: "0",
                  bottom: "0",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    backgroundColor: "white",
                    padding: "2rem",
                    borderRadius: "8px",
                    minWidth: "400px",
                    maxWidth: "500px",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowManualEntry(false);
                      setManualItem({
                        name: "",
                        price: "",
                        category:
                          categories.length > 0
                            ? categories[0]
                            : "grocery-taxable",
                        quantity: 1,
                      });
                    }
                  }}
                >
                  <h3 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                    Add Manual Item
                  </h3>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Item Name:
                    </label>
                    <input
                      type="text"
                      value={manualItem.name}
                      onChange={(e) =>
                        setManualItem((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter item name or description"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                      autoFocus
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Price:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={manualItem.price}
                      onChange={(e) =>
                        setManualItem((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Category:
                    </label>
                    <select
                      value={manualItem.category}
                      onChange={(e) =>
                        setManualItem((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    >
                      {categories.length > 0 ? (
                        // Use categories from Redux/database
                        categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))
                      ) : (
                        // Fallback to hardcoded options if no categories loaded
                        <>
                          <option value="grocery-taxable">
                            Grocery (Taxable)
                          </option>
                          <option value="grocery-non-taxable">
                            Grocery (Non-Taxable)
                          </option>
                          <option value="lotto">Lotto (Taxable)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div style={{ marginBottom: "1.5rem" }}>
                    <label
                      style={{
                        display: "block",
                        marginBottom: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={manualItem.quantity}
                      onChange={(e) =>
                        setManualItem((prev) => ({
                          ...prev,
                          quantity: parseInt(e.target.value) || 1,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "0.5rem",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => {
                        setShowManualEntry(false);
                        setManualItem({
                          name: "",
                          price: "",
                          category:
                            categories.length > 0
                              ? categories[0]
                              : "grocery-taxable",
                          quantity: 1,
                        });
                      }}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#95a5a6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={addManualItem}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#27ae60",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Keyboard Area */}
            <KeyboardArea>
              <OnScreenKeyboard
                show={true}
                mode={keyboardMode}
                onClose={() => setShowKeyboard(false)}
                inputRef={activeInputRef}
                onKeyPress={(key) => {
                  console.log("Virtual key pressed:", key);
                }}
                onModeToggle={(newMode) => setKeyboardMode(newMode)}
              />
            </KeyboardArea>

            <div className="products-grid">
              {filteredInventory.length === 0 &&
                inventory.length > 0 &&
                searchTerm && (
                  <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#f39c12",
                    }}
                  >
                    <h3>No products match your search</h3>
                    <p>
                      Search: "{searchTerm}"{" "}
                      {categoryFilter && `| Category: "${categoryFilter}"`}
                    </p>
                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "0.75rem",
                        backgroundColor: "#fff3cd",
                        border: "1px solid #ffeaa7",
                        borderRadius: "4px",
                        color: "#856404",
                      }}
                    >
                      💡 <strong>Press Enter</strong> to add "{searchTerm}" as a
                      manual item with custom price
                    </div>
                  </div>
                )}
              {inventoryLoading && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#3498db",
                  }}
                >
                  <h3>Loading products...</h3>
                  <p>Please wait while we load the inventory from database</p>
                </div>
              )}
              {inventory.length === 0 && !inventoryLoading && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#e74c3c",
                  }}
                >
                  <h3>No products available</h3>
                  <p>
                    No inventory items found. Please check your connection or
                    contact support.
                  </p>
                </div>
              )}
              {filteredInventory.map((product) => (
                <ProductItem
                  key={product.id}
                  onClick={() => addToCart(product)}
                  style={{
                    opacity: product.stock <= 0 ? 0.7 : 1,
                    cursor: "pointer",
                  }}
                >
                  <h4>{product.name}</h4>
                  <div className="price-row">
                    <div className="price">${product.price.toFixed(2)}</div>
                    <div style={{ fontSize: "0.8rem", color: "#7f8c8d" }}>
                      {product.taxable ? "HST" : "No HST"}
                    </div>
                  </div>
                  <div
                    className="stock"
                    style={{
                      color:
                        product.stock < 0
                          ? "#e74c3c"
                          : product.stock === 0
                          ? "#f39c12"
                          : product.stock <= product.lowStockThreshold
                          ? "#f39c12"
                          : "#27ae60",
                    }}
                  >
                    Stock: {product.stock}{" "}
                    {product.stock < 0
                      ? "(Negative Stock)"
                      : product.stock === 0
                      ? "(Out of Stock)"
                      : product.stock <= product.lowStockThreshold
                      ? "(Low Stock)"
                      : ""}
                  </div>
                </ProductItem>
              ))}
            </div>
          </ProductsPanel>

          <CheckoutPanel>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <h2 style={{ margin: 0 }}>Current Sale</h2>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button
                  onClick={() => {
                    setIsCreditSale(!isCreditSale);
                    if (isCreditSale) {
                      setCreditCustomerName("");
                      setCreditAmount(0);
                      setSelectedCustomer(null);
                      setCustomerBalance(0);
                    }
                  }}
                  style={{
                    background: isCreditSale ? "#28a745" : "#6c757d",
                    color: "white",
                    padding: "0.5rem 0.75rem",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                  }}
                >
                  💳 Credit
                </Button>
              </div>
            </div>

            {/* Credit Sale Status Indicator */}
            {isCreditSale && (
              <div
                style={{
                  padding: "0.5rem",
                  backgroundColor: "#fff3cd",
                  border: "2px solid #ffc107",
                  borderRadius: "8px",
                  marginBottom: "0.75rem",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: "600",
                    color: "#856404",
                    fontSize: "0.9rem",
                  }}
                >
                  💳 CREDIT SALE MODE ACTIVE
                </div>
                {creditCustomerName && (
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "#856404",
                      marginTop: "0.25rem",
                    }}
                  >
                    Customer: <strong>{creditCustomerName}</strong>
                    {selectedCustomer && (
                      <span style={{ marginLeft: "0.5rem" }}>
                        (Balance: ${Math.abs(customerBalance).toFixed(2)}{" "}
                        {customerBalance > 0 ? "owed" : "credit"})
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
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
                        onClick={() => handleDecreaseQuantity(item.id)}
                        disabled={item.quantity <= 1}
                        style={{
                          opacity: item.quantity <= 1 ? 0.5 : 1,
                          cursor:
                            item.quantity <= 1 ? "not-allowed" : "pointer",
                        }}
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

            {/* Scrollable checkout sections */}
            <div className="checkout-sections">
              {/* Cashback Option */}
              <div
                style={{
                  margin: "0.5rem 0",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e9ecef",
                  borderRadius: "6px",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={cashbackEnabled}
                    onChange={(e) => {
                      setCashbackEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setCashbackAmount("");
                        setCashbackFee("");
                      }
                    }}
                    style={{ transform: "scale(1.2)" }}
                  />
                  <span>Add Cashback</span>
                </label>

                {cashbackEnabled && (
                  <>
                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <label style={{ minWidth: "70px", fontSize: "0.9rem" }}>
                        Amount:
                      </label>
                      <input
                        ref={cashbackAmountRef}
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={cashbackAmount}
                        onFocus={() => handleInputFocus(cashbackAmountRef)}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty, numbers, and decimal point
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setCashbackAmount(value);
                          }
                        }}
                        style={{
                          padding: "0.4rem",
                          flex: 1,
                          borderRadius: "4px",
                          border: "1px solid #ddd",
                        }}
                        placeholder="0.00"
                      />
                    </div>

                    <div
                      style={{
                        marginTop: "0.5rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <label
                        style={{
                          minWidth: "70px",
                          fontSize: "0.9rem",
                          color: "#e67e22",
                        }}
                      >
                        Fee:
                      </label>
                      <input
                        ref={cashbackFeeRef}
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={cashbackFee}
                        onFocus={() => handleInputFocus(cashbackFeeRef)}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Allow empty, numbers, and decimal point
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setCashbackFee(value);
                          }
                        }}
                        style={{
                          padding: "0.4rem",
                          flex: 1,
                          borderRadius: "4px",
                          border: "1px solid #e67e22",
                          backgroundColor: "#fef5e7",
                        }}
                        placeholder="0.00"
                      />
                    </div>

                    {(Number(cashbackFee) || 0) > 0 && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.8rem",
                          color: "#e67e22",
                          fontStyle: "italic",
                          backgroundColor: "#fef5e7",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #f4d03f",
                        }}
                      >
                        💰 Cashback fee: $
                        {(Number(cashbackFee) || 0).toFixed(2)} added to total
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Discount */}
              <div
                style={{
                  margin: "0.5rem 0",
                  padding: "0.5rem",
                  backgroundColor: "#fff3e0",
                  border: "1px solid #ffcc80",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>💰 Discount</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label style={{ minWidth: "70px", fontSize: "0.9rem" }}>
                    Amount:
                  </label>
                  <input
                    ref={discountRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={discountAmount}
                    onFocus={() => handleInputFocus(discountRef)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty, numbers, and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setDiscountAmount(value);
                      }
                    }}
                    style={{
                      padding: "0.4rem",
                      flex: 1,
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    placeholder="0.00"
                  />
                </div>
                {(Number(discountAmount) || 0) > 0 && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      color: "#e65100",
                      fontStyle: "italic",
                    }}
                  >
                    💸 Customer saves $
                    {(Number(discountAmount) || 0).toFixed(2)}
                  </div>
                )}
              </div>

              {/* Enhanced Card Fee Section */}
              <div
                style={{
                  margin: "0.5rem 0",
                  padding: "0.5rem",
                  backgroundColor: "#f8f4ff",
                  border: "1px solid #d4c5f9",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                    fontWeight: "500",
                  }}
                >
                  <span>💳 Card Fees</span>
                </div>

                {/* Card Fee Enable/Disable */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: cardFeeEnabled ? "0.5rem" : "0",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={cardFeeEnabled}
                      onChange={(e) => {
                        const isEnabled = e.target.checked;
                        setCardFeeEnabled(isEnabled);

                        const currentCardAmount = Number(
                          parseFloat(cardAmount) || 0
                        );
                        const currentCashAmount = Number(
                          parseFloat(cashAmount) || 0
                        );

                        if (isEnabled) {
                          // When enabling, add card fee to total
                          const totalAmount =
                            currentCardAmount +
                            currentCashAmount +
                            CARD_FEE_AMOUNT;
                          setCardAmount(String(totalAmount.toFixed(2)));
                          setCashAmount("0");
                          setLastEdited("card");
                        } else {
                          // When disabling, remove card fee from total
                          if (currentCardAmount >= CARD_FEE_AMOUNT) {
                            const newCardAmount = Math.max(
                              0,
                              currentCardAmount - CARD_FEE_AMOUNT
                            );
                            setCardAmount(String(newCardAmount.toFixed(2)));
                          }
                        }
                      }}
                      style={{
                        marginRight: "0.25rem",
                        transform: "scale(1.1)",
                      }}
                    />
                    Apply card fee (+${CARD_FEE_AMOUNT.toFixed(2)})
                  </label>
                </div>

                {/* Fee Status Display */}
                {cardFeeEnabled && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.25rem 0.5rem",
                      backgroundColor: "#fff3cd",
                      border: "1px solid #ffeaa7",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      color: "#856404",
                    }}
                  >
                    💰 Card processing fee: ${CARD_FEE_AMOUNT.toFixed(2)} added
                    to total
                  </div>
                )}
              </div>

              {/* Lotto Winnings */}
              <div
                style={{
                  margin: "0.5rem 0",
                  padding: "0.5rem",
                  backgroundColor: "#e8f5e8",
                  border: "1px solid #c3e6c3",
                  borderRadius: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontWeight: "500",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span>🎰 Lotto Winnings</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <label style={{ minWidth: "70px", fontSize: "0.9rem" }}>
                    Amount:
                  </label>
                  <input
                    ref={lottoWinningsRef}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*\.?[0-9]*"
                    value={lottoWinnings}
                    onFocus={() => handleInputFocus(lottoWinningsRef)}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty, numbers, and decimal point
                      if (value === "" || /^\d*\.?\d*$/.test(value)) {
                        setLottoWinnings(value);
                      }
                    }}
                    style={{
                      padding: "0.4rem",
                      flex: 1,
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                    }}
                    placeholder="0.00"
                  />
                </div>

                {(Number(lottoWinnings) || 0) > 0 && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.8rem",
                      color: "#28a745",
                      fontStyle: "italic",
                    }}
                  >
                    💰 Customer won ${(Number(lottoWinnings) || 0).toFixed(2)}{" "}
                    in lottery
                  </div>
                )}
              </div>
            </div>

            <div className="checkout-summary">
              {(() => {
                const originalSubtotal = calculateSubtotal(); // Items total before discount
                const discount = Number(parseFloat(discountAmount) || 0);
                const subtotal = calculateTotal(); // After discount
                const tax = calculateTax();
                const total = +(subtotal + tax).toFixed(2);
                const cashback = Number(parseFloat(cashbackAmount) || 0);
                const lotto = Number(parseFloat(lottoWinnings) || 0);
                const paidCash = Number(parseFloat(cashAmount) || 0);
                const paidCard = Number(parseFloat(cardAmount) || 0);
                const paidTotal = +(paidCash + paidCard).toFixed(2);

                // Calculate final total with cashback and lotto winnings
                const finalTotal = total + cashback - lotto;

                // For cashback transactions, require card payment to cover total + cashback
                let isSufficient;
                if (cashback > 0 && lotto === 0) {
                  const totalNeeded = total + cashback;
                  isSufficient = paidCard + 0.0001 >= totalNeeded;
                } else if (lotto > 0) {
                  // With lotto winnings, customer may owe less or even get money back
                  isSufficient =
                    finalTotal <= 0 || paidTotal + 0.0001 >= finalTotal;
                } else {
                  isSufficient = paidTotal + 0.0001 >= total;
                }

                const change =
                  cashback > 0 && lotto === 0
                    ? 0
                    : Math.max(0, +(paidTotal - finalTotal).toFixed(2));

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
                      {discount > 0 ? (
                        <>
                          <div>
                            Items Subtotal: ${originalSubtotal.toFixed(2)}
                          </div>
                          <div style={{ color: "#e65100", fontWeight: "500" }}>
                            Discount: -${discount.toFixed(2)}
                          </div>
                          <div>Subtotal: ${subtotal.toFixed(2)}</div>
                        </>
                      ) : (
                        <div>Subtotal: ${subtotal.toFixed(2)}</div>
                      )}
                      {tax > 0 && <div>HST (13%): ${tax.toFixed(2)}</div>}
                      <div>Purchase Total: ${total.toFixed(2)}</div>
                      {cashback > 0 && (
                        <div style={{ color: "#e67e22", fontWeight: "500" }}>
                          Cashback: ${cashback.toFixed(2)}
                        </div>
                      )}
                      {Number(parseFloat(cashbackFee) || 0) > 0 && (
                        <div style={{ color: "#d35400", fontWeight: "500" }}>
                          Cashback Fee: $
                          {Number(parseFloat(cashbackFee) || 0).toFixed(2)}
                        </div>
                      )}
                      {lotto > 0 && (
                        <div style={{ color: "#28a745", fontWeight: "500" }}>
                          Lotto Winnings: -${lotto.toFixed(2)}
                        </div>
                      )}
                      <div className="final-total">
                        {isBalancePayment ? (
                          <>
                            <div
                              style={{
                                color: "#17a2b8",
                                fontWeight: "600",
                                marginBottom: "5px",
                              }}
                            >
                              🏦 Customer Balance Payment
                            </div>
                            <div>
                              Paying for:{" "}
                              {selectedCustomer?.name || "Selected Customer"}
                            </div>
                            <div>
                              Current Balance: $
                              {selectedCustomer?.balance?.toFixed(2) || "0.00"}
                            </div>
                          </>
                        ) : (
                          <>
                            Total Amount Due: $
                            {finalTotal >= 0
                              ? finalTotal.toFixed(2)
                              : `(${Math.abs(finalTotal).toFixed(2)}) Credit`}
                          </>
                        )}
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
                      {/* Credit Sale Section */}
                      <div
                        style={{
                          padding: "1rem",
                          backgroundColor: "#fff3cd",
                          border: "2px solid #ffc107",
                          borderRadius: "8px",
                        }}
                      >
                        {/* Credit Sale Toggle */}
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                            fontWeight: "600",
                            fontSize: "1.1rem",
                            color: "#856404",
                            marginBottom: isCreditSale ? "0.75rem" : "0",
                            justifyContent: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isCreditSale}
                            onChange={(e) => {
                              setIsCreditSale(e.target.checked);
                              if (!e.target.checked) {
                                setCreditCustomerName("");
                                setCreditAmount(0);
                              } else {
                                // Clear existing payments when entering credit mode
                                setCashAmount("");
                                setCardAmount("");
                                setCreditAmount(0);
                              }
                            }}
                            style={{ transform: "scale(1.2)" }}
                          />
                          <span>💳 Credit Sale Mode</span>
                        </label>

                        {isCreditSale && (
                          <>
                            {/* Credit Sale Inputs */}
                            <div style={{ marginBottom: "0.75rem" }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  marginBottom: "0.5rem",
                                  position: "relative",
                                }}
                              >
                                <label
                                  style={{
                                    minWidth: "80px",
                                    fontSize: "0.9rem",
                                    color: "#856404",
                                    fontWeight: "500",
                                  }}
                                >
                                  Customer:
                                </label>
                                <div
                                  style={{
                                    flex: 1,
                                    position: "relative",
                                    display: "flex",
                                    gap: "0.25rem",
                                  }}
                                >
                                  <input
                                    ref={creditCustomerNameRef}
                                    type="text"
                                    value={creditCustomerName}
                                    onFocus={() =>
                                      handleInputFocus(
                                        creditCustomerNameRef,
                                        false
                                      )
                                    }
                                    onChange={(e) =>
                                      handleCustomerNameChange(e.target.value)
                                    }
                                    style={{
                                      padding: "0.4rem",
                                      flex: 1,
                                      borderRadius: "4px",
                                      border: "1px solid #ddd",
                                    }}
                                    placeholder="Enter customer name"
                                  />
                                  <button
                                    onClick={fetchExistingCustomers}
                                    style={{
                                      padding: "0.4rem",
                                      backgroundColor: "#6c757d",
                                      color: "white",
                                      border: "none",
                                      borderRadius: "4px",
                                      cursor: "pointer",
                                      fontSize: "0.8rem",
                                    }}
                                    title="Refresh customer list"
                                  >
                                    🔄
                                  </button>

                                  {/* Customer suggestions dropdown */}
                                  {showCustomerSuggestions && (
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "100%",
                                        left: 0,
                                        right: 0,
                                        backgroundColor: "white",
                                        border: "1px solid #ddd",
                                        borderRadius: "4px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                        zIndex: 1000,
                                        maxHeight: "150px",
                                        overflowY: "auto",
                                      }}
                                    >
                                      {(() => {
                                        const filteredCustomers = Array.isArray(
                                          existingCustomers
                                        )
                                          ? existingCustomers.filter(
                                              (customer) =>
                                                customer &&
                                                customer.customerName &&
                                                customer.customerName
                                                  .toLowerCase()
                                                  .includes(
                                                    creditCustomerName.toLowerCase()
                                                  )
                                            )
                                          : [];

                                        const exactMatch =
                                          filteredCustomers.find(
                                            (customer) =>
                                              customer.customerName.toLowerCase() ===
                                              creditCustomerName.toLowerCase()
                                          );

                                        return (
                                          <>
                                            {filteredCustomers.map(
                                              (customer, index) => (
                                                <div
                                                  key={index}
                                                  onClick={() =>
                                                    handleCustomerSelection(
                                                      customer
                                                    )
                                                  }
                                                  style={{
                                                    padding: "0.5rem",
                                                    cursor: "pointer",
                                                    borderBottom:
                                                      "1px solid #eee",
                                                    display: "flex",
                                                    justifyContent:
                                                      "space-between",
                                                    alignItems: "center",
                                                  }}
                                                  onMouseEnter={(e) =>
                                                    (e.target.style.backgroundColor =
                                                      "#f5f5f5")
                                                  }
                                                  onMouseLeave={(e) =>
                                                    (e.target.style.backgroundColor =
                                                      "white")
                                                  }
                                                >
                                                  <span>
                                                    {customer.customerName}
                                                  </span>
                                                  <span
                                                    style={{
                                                      fontSize: "0.8rem",
                                                      color:
                                                        customer.balance > 0
                                                          ? "#dc3545"
                                                          : "#28a745",
                                                      fontWeight: "500",
                                                    }}
                                                  >
                                                    $
                                                    {Math.abs(
                                                      customer.balance || 0
                                                    ).toFixed(2)}{" "}
                                                    {customer.balance > 0
                                                      ? "owed"
                                                      : "credit"}
                                                  </span>
                                                </div>
                                              )
                                            )}

                                            {/* Add New Customer option when no exact match found */}
                                            {creditCustomerName.trim().length >
                                              0 &&
                                              !exactMatch && (
                                                <div
                                                  onClick={() => {
                                                    // Create new customer with entered name
                                                    const newCustomer = {
                                                      customerName:
                                                        creditCustomerName.trim(),
                                                      balance: 0,
                                                      isNewCustomer: true,
                                                    };
                                                    handleCustomerSelection(
                                                      newCustomer
                                                    );
                                                  }}
                                                  style={{
                                                    padding: "0.5rem",
                                                    cursor: "pointer",
                                                    borderTop:
                                                      filteredCustomers.length >
                                                      0
                                                        ? "2px solid #e9ecef"
                                                        : "none",
                                                    backgroundColor: "#e8f5e8",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.5rem",
                                                    fontWeight: "500",
                                                    color: "#155724",
                                                  }}
                                                  onMouseEnter={(e) =>
                                                    (e.target.style.backgroundColor =
                                                      "#d4edda")
                                                  }
                                                  onMouseLeave={(e) =>
                                                    (e.target.style.backgroundColor =
                                                      "#e8f5e8")
                                                  }
                                                >
                                                  <span>➕</span>
                                                  <span>
                                                    Add "
                                                    {creditCustomerName.trim()}"
                                                    as new credit customer
                                                  </span>
                                                </div>
                                              )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Debug info for customer data */}
                              {existingCustomers.length > 0 && (
                                <div
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#6c757d",
                                    marginBottom: "0.5rem",
                                    padding: "0.25rem",
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "4px",
                                  }}
                                >
                                  Loaded {existingCustomers.length} customers.{" "}
                                  {creditCustomerName &&
                                    `Searching for: "${creditCustomerName}"`}
                                </div>
                              )}

                              {/* Customer balance display */}
                              {selectedCustomer && (
                                <div
                                  style={{
                                    padding: "0.5rem",
                                    backgroundColor:
                                      customerBalance > 0
                                        ? "#f8d7da"
                                        : "#d4edda",
                                    border: `1px solid ${
                                      customerBalance > 0
                                        ? "#f5c6cb"
                                        : "#c3e6cb"
                                    }`,
                                    borderRadius: "4px",
                                    marginBottom: "0.5rem",
                                    fontSize: "0.9rem",
                                  }}
                                >
                                  <strong>
                                    {selectedCustomer.customerName}
                                  </strong>{" "}
                                  - Current Balance:
                                  <span
                                    style={{
                                      color:
                                        customerBalance > 0
                                          ? "#721c24"
                                          : "#155724",
                                      fontWeight: "600",
                                      marginLeft: "0.25rem",
                                    }}
                                  >
                                    ${Math.abs(customerBalance).toFixed(2)}{" "}
                                    {customerBalance > 0 ? "owed" : "credit"}
                                  </span>
                                  <div
                                    style={{
                                      fontSize: "0.7rem",
                                      color: "#6c757d",
                                      marginTop: "0.25rem",
                                    }}
                                  >
                                    ID: {selectedCustomer.id} | Last updated:{" "}
                                    {new Date(
                                      selectedCustomer.updatedAt
                                    ).toLocaleTimeString()}
                                  </div>
                                </div>
                              )}
                            </div>{" "}
                            {(() => {
                              const subtotal = calculateTotal();
                              const tax = calculateTax();
                              const total = +(subtotal + tax).toFixed(2);
                              const cashback = Number(
                                parseFloat(cashbackAmount) || 0
                              );
                              const lotto = Number(
                                parseFloat(lottoWinnings) || 0
                              );
                              const finalTotal = total + cashback - lotto;
                              const paidCash = Number(
                                parseFloat(cashAmount) || 0
                              );
                              const paidCard = Number(
                                parseFloat(cardAmount) || 0
                              );
                              const paidTotal = paidCash + paidCard;
                              const specifiedCreditAmount = Number(
                                parseFloat(creditAmount) || 0
                              );

                              // Use specified credit amount or calculate from payment difference
                              const creditBalance =
                                specifiedCreditAmount > 0
                                  ? specifiedCreditAmount
                                  : Math.max(0, finalTotal - paidTotal);
                              const requiredPayment =
                                specifiedCreditAmount > 0
                                  ? finalTotal - specifiedCreditAmount
                                  : paidTotal;

                              if (specifiedCreditAmount > 0) {
                                // Specified credit amount mode
                                const paymentNeeded =
                                  finalTotal - specifiedCreditAmount;
                                const paymentStatus =
                                  paidTotal >= paymentNeeded - 0.001;

                                return (
                                  <div
                                    style={{
                                      backgroundColor: paymentStatus
                                        ? "#e8f5e8"
                                        : "#fff3cd",
                                      border: `1px solid ${
                                        paymentStatus ? "#28a745" : "#ffc107"
                                      }`,
                                      borderRadius: "4px",
                                      padding: "0.5rem",
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    <div>
                                      <strong>Specified Credit Mode:</strong>
                                    </div>
                                    <div>
                                      � Unpaid Balance: $
                                      {specifiedCreditAmount.toFixed(2)}
                                    </div>
                                    <div>
                                      💰 Payment Needed: $
                                      {paymentNeeded.toFixed(2)}
                                    </div>
                                    <div>
                                      📊 Payment Status: ${paidTotal.toFixed(2)}{" "}
                                      / ${paymentNeeded.toFixed(2)}
                                    </div>
                                    {!paymentStatus && (
                                      <div
                                        style={{
                                          color: "#dc3545",
                                          fontWeight: "500",
                                          marginTop: "0.25rem",
                                        }}
                                      >
                                        ⚠️ Need $
                                        {(paymentNeeded - paidTotal).toFixed(2)}{" "}
                                        more
                                      </div>
                                    )}
                                  </div>
                                );
                              } else if (paidTotal > 0 && creditBalance > 0) {
                                return (
                                  <div
                                    style={{
                                      backgroundColor: "#e8f5e8",
                                      border: "1px solid #28a745",
                                      borderRadius: "4px",
                                      padding: "0.5rem",
                                      fontSize: "0.9rem",
                                    }}
                                  >
                                    <div>
                                      <strong>Auto-Calculate Mode:</strong>
                                    </div>
                                    {paidCash > 0 && (
                                      <div>💵 Cash: ${paidCash.toFixed(2)}</div>
                                    )}
                                    {paidCard > 0 && (
                                      <div>💳 Card: ${paidCard.toFixed(2)}</div>
                                    )}
                                    <div
                                      style={{
                                        color: "#dc3545",
                                        fontWeight: "500",
                                      }}
                                    >
                                      📝 Credit Balance: $
                                      {creditBalance.toFixed(2)}
                                    </div>
                                  </div>
                                );
                              } else if (paidTotal >= finalTotal) {
                                return (
                                  <div
                                    style={{
                                      backgroundColor: "#e8f5e8",
                                      border: "1px solid #28a745",
                                      borderRadius: "4px",
                                      padding: "0.5rem",
                                      fontSize: "0.9rem",
                                      textAlign: "center",
                                    }}
                                  >
                                    ✅{" "}
                                    <strong>
                                      Fully Paid - No Credit Balance
                                    </strong>
                                  </div>
                                );
                              } else {
                                return (
                                  <div
                                    style={{
                                      backgroundColor: "#f8d7da",
                                      border: "1px solid #dc3545",
                                      borderRadius: "4px",
                                      padding: "0.5rem",
                                      fontSize: "0.9rem",
                                      textAlign: "center",
                                    }}
                                  >
                                    📝{" "}
                                    <strong>
                                      Full Credit: ${creditBalance.toFixed(2)}
                                    </strong>
                                  </div>
                                );
                              }
                            })()}
                          </>
                        )}
                      </div>

                      {/* Payment Input Fields - Always Visible */}
                      {!isCreditSale && (
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
                          <div
                            style={{ fontSize: "0.85rem", color: "#7f8c8d" }}
                          >
                            Toggle to automatically fill the other field
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >
                        <label
                          style={{
                            minWidth: "80px",
                            color:
                              (Number(cashbackAmount) || 0) > 0
                                ? "#95a5a6"
                                : "inherit",
                          }}
                        >
                          Cash:
                        </label>
                        <input
                          ref={cashAmountRef}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={cashAmount}
                          disabled={(Number(cashbackAmount) || 0) > 0}
                          onFocus={() => handleInputFocus(cashAmountRef)}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            // Allow empty, numbers, and decimal point
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setLastEdited("cash");
                              setCashAmount(value);
                            } else {
                              return; // Don't process invalid input
                            }

                            // Only do validation and auto-fill if value is not empty and not currently being typed
                            if (value !== "") {
                              const parsed = Number(value);

                              if (isCreditSale) {
                                // Check if this is a balance payment (no items in cart)
                                const isBalancePayment =
                                  cart.length === 0 &&
                                  selectedCustomer &&
                                  customerBalance > 0;

                                if (isBalancePayment) {
                                  // For balance payments, allow any amount up to the customer's balance
                                  const validCashAmount = Math.min(
                                    parsed,
                                    customerBalance
                                  );
                                  if (parsed > customerBalance) {
                                    setCashAmount(String(validCashAmount));
                                  }
                                  // Clear card when cash is entered
                                  if (validCashAmount > 0) {
                                    setCardAmount("");
                                  }
                                  return;
                                }

                                // For regular credit sales with items in cart
                                const subtotal = calculateTotal();
                                const tax = calculateTax();
                                const total = +(subtotal + tax).toFixed(2);
                                const cashback = Number(
                                  parseFloat(cashbackAmount) || 0
                                );
                                const lotto = Number(
                                  parseFloat(lottoWinnings) || 0
                                );
                                const finalTotal = total + cashback - lotto;
                                const currentCredit = Number(
                                  parseFloat(creditAmount) || 0
                                );
                                const remainingAmount = Math.max(
                                  0,
                                  finalTotal - currentCredit
                                );

                                // If customer has existing balance, allow payment up to transaction total + existing balance
                                let maxAllowedPayment = remainingAmount;
                                if (selectedCustomer && customerBalance > 0) {
                                  maxAllowedPayment =
                                    finalTotal + customerBalance;
                                }

                                // Allow cash up to max allowed payment
                                const validCashAmount = Math.min(
                                  parsed,
                                  maxAllowedPayment
                                );
                                if (parsed > maxAllowedPayment) {
                                  setCashAmount(String(validCashAmount));
                                }

                                // If user enters cash, clear card (only one payment method)
                                if (validCashAmount > 0) {
                                  setCardAmount("");
                                }
                                return;
                              }

                              if (autoFillOther) {
                                // Regular mode auto-fill
                                const subtotal = calculateTotal();
                                const tax = calculateTax();
                                const total = +(subtotal + tax).toFixed(2);
                                const newCard = Math.max(
                                  0,
                                  +(total - parsed).toFixed(2)
                                );
                                setCardAmount(String(newCard));
                              }
                            }
                          }}
                          style={{
                            padding: "0.4rem",
                            flex: 1,
                            backgroundColor: isCreditSale ? "#f8f9fa" : "white",
                          }}
                          placeholder={
                            isCreditSale ? "Enter partial payment" : "0.00"
                          }
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                          position: "relative",
                        }}
                      >
                        {/* Swap Button - Absolutely positioned between Cash and Card */}
                        <button
                          onClick={swapPayments}
                          disabled={isCreditSale}
                          style={{
                            position: "absolute",
                            left: "40px",
                            top: "-15px",
                            background: isCreditSale
                              ? "#f8f9fa"
                              : "linear-gradient(135deg, #3498db, #2980b9)",
                            border: "none",
                            borderRadius: "50%",
                            width: "20px",
                            height: "20px",
                            cursor: isCreditSale ? "not-allowed" : "pointer",
                            color: "white",
                            fontSize: "10px",
                            fontWeight: "bold",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isCreditSale
                              ? "none"
                              : "0 1px 4px rgba(52, 152, 219, 0.3)",
                            transition: "all 0.2s ease",
                            opacity: isCreditSale ? 0.4 : 1,
                            zIndex: 10,
                          }}
                          onMouseEnter={(e) => {
                            if (!isCreditSale) {
                              e.target.style.transform =
                                "rotate(180deg) scale(1.2)";
                              e.target.style.boxShadow =
                                "0 2px 6px rgba(52, 152, 219, 0.4)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isCreditSale) {
                              e.target.style.transform =
                                "rotate(0deg) scale(1)";
                              e.target.style.boxShadow =
                                "0 1px 4px rgba(52, 152, 219, 0.3)";
                            }
                          }}
                          title={
                            isCreditSale
                              ? "Swap disabled in credit mode"
                              : "Swap cash and card amounts"
                          }
                        >
                          ⇅
                        </button>
                        <label style={{ minWidth: "80px" }}>Card:</label>
                        <input
                          ref={cardAmountRef}
                          type="text"
                          inputMode="decimal"
                          pattern="[0-9]*\.?[0-9]*"
                          value={cardAmount}
                          onFocus={() => handleInputFocus(cardAmountRef)}
                          onChange={(e) => {
                            const value = e.target.value;
                            
                            // Allow empty, numbers, and decimal point
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setLastEdited("card");
                              setCardAmount(value);
                            } else {
                              return; // Don't process invalid input
                            }

                            // Only do validation and auto-fill if value is not empty and not currently being typed
                            if (value !== "") {
                              const parsed = Number(value);

                              if (isCreditSale) {
                                // Check if this is a balance payment (no items in cart)
                                const isBalancePayment =
                                  cart.length === 0 &&
                                  selectedCustomer &&
                                  customerBalance > 0;

                                if (isBalancePayment) {
                                  // For balance payments, allow any amount up to the customer's balance
                                  const validCardAmount = Math.min(
                                    parsed,
                                    customerBalance
                                  );
                                  if (parsed > customerBalance) {
                                    setCardAmount(String(validCardAmount));
                                  }
                                  // Clear cash when card is entered
                                  if (validCardAmount > 0) {
                                    setCashAmount("");
                                  }
                                  return;
                                }

                                // For regular credit sales with items in cart
                                const subtotal = calculateTotal();
                                const tax = calculateTax();
                                const total = +(subtotal + tax).toFixed(2);
                                const cashback = Number(
                                  parseFloat(cashbackAmount) || 0
                                );
                                const lotto = Number(
                                  parseFloat(lottoWinnings) || 0
                                );
                                const finalTotal = total + cashback - lotto;
                                const currentCredit = Number(
                                  parseFloat(creditAmount) || 0
                                );
                                const remainingAmount = Math.max(
                                  0,
                                  finalTotal - currentCredit
                                );

                                // If customer has existing balance, allow payment up to transaction total + existing balance
                                let maxAllowedPayment = remainingAmount;
                                if (selectedCustomer && customerBalance > 0) {
                                  maxAllowedPayment =
                                    finalTotal + customerBalance;
                                }

                                // Allow card up to max allowed payment
                                const validCardAmount = Math.min(
                                  parsed,
                                  maxAllowedPayment
                                );
                                if (parsed > maxAllowedPayment) {
                                  setCardAmount(String(validCardAmount));
                                }

                                // If user enters card, clear cash (only one payment method)
                                if (validCardAmount > 0) {
                                  setCashAmount("");
                                }
                                return;
                              }

                              if (autoFillOther) {
                                // Regular mode auto-fill
                                const subtotal = calculateTotal();
                                const tax = calculateTax();
                                const total = +(subtotal + tax).toFixed(2);
                                const newCash = Math.max(
                                  0,
                                  +(total - parsed).toFixed(2)
                                );
                                setCashAmount(String(newCash));
                              }
                            }
                          }}
                          style={{
                            padding: "0.4rem",
                            flex: 1,
                            backgroundColor: isCreditSale ? "#f8f9fa" : "white",
                          }}
                          placeholder={
                            isCreditSale ? "Enter partial payment" : "0.00"
                          }
                        />
                        {/* Payment Terminal Button */}
                        <button
                          onClick={() => {
                            // Calculate total for terminal payment
                            const subtotal = calculateTotal();
                            const tax = calculateTax();
                            const total = +(subtotal + tax).toFixed(2);
                            const cashback = Number(
                              parseFloat(cashbackAmount) || 0
                            );
                            const lotto = Number(
                              parseFloat(lottoWinnings) || 0
                            );
                            // Note: total already includes credit card charge from calculateTotal()
                            const finalTotal = total + cashback - lotto;

                            // Process terminal payment
                            handleTerminalPayment(finalTotal);
                          }}
                          disabled={isCreditSale || cart.length === 0}
                          style={{
                            padding: "0.4rem 0.8rem",
                            backgroundColor:
                              isCreditSale || cart.length === 0
                                ? "#f8f9fa"
                                : "#6f42c1",
                            color:
                              isCreditSale || cart.length === 0
                                ? "#6c757d"
                                : "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor:
                              isCreditSale || cart.length === 0
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "0.85rem",
                            fontWeight: "600",
                            marginLeft: "0.5rem",
                            transition: "all 0.2s ease",
                            opacity:
                              isCreditSale || cart.length === 0 ? 0.6 : 1,
                          }}
                          title={
                            isCreditSale
                              ? "Terminal disabled in credit mode"
                              : cart.length === 0
                              ? "Add items to cart first"
                              : "Process payment via terminal"
                          }
                        >
                          💳 Terminal
                        </button>
                      </div>

                      {/* Cashback Card-Only Notice */}
                      {(Number(cashbackAmount) || 0) > 0 && (
                        <div
                          style={{
                            padding: "0.5rem",
                            backgroundColor: "#e8f4fd",
                            border: "1px solid #85c1e9",
                            borderRadius: "4px",
                            fontSize: "0.85rem",
                            color: "#2e86c1",
                            textAlign: "center",
                            fontWeight: "500",
                            marginTop: "0.5rem",
                          }}
                        >
                          🚫{" "}
                          <strong>
                            Cash payment disabled for cashback transactions
                          </strong>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              marginTop: "0.25rem",
                              opacity: 0.9,
                            }}
                          >
                            Customer must pay by card • Cash register: -
                            {(Number(cashbackAmount) || 0).toFixed(2)} +{" "}
                            {(Number(cashbackFee) || 0).toFixed(2)} profit
                          </div>
                        </div>
                      )}

                      {!isCreditSale && (
                        <>
                          {cashback > 0 && (
                            <div
                              style={{
                                padding: "0.5rem",
                                backgroundColor: "#fff3cd",
                                border: "1px solid #ffeaa7",
                                borderRadius: "4px",
                                marginTop: "0.5rem",
                              }}
                            >
                              <strong>Cashback: ${cashback.toFixed(2)}</strong>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#856404",
                                }}
                              >
                                Requires card payment: $
                                {(total + cashback).toFixed(2)} (Purchase: $
                                {total.toFixed(2)} + Cashback: $
                                {cashback.toFixed(2)})
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#d68910",
                                  marginTop: "0.25rem",
                                  fontWeight: "500",
                                }}
                              >
                                💳 Customer pays by card • 💵 You give $
                                {cashback.toFixed(2)} cash from register
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              color: isSufficient ? "#2ecc71" : "#e74c3c",
                              fontWeight: "600",
                            }}
                          >
                            {isSufficient
                              ? `Card Payment: $${paidCard.toFixed(2)}${
                                  change > 0 && cashback === 0
                                    ? ` — Change: $${change.toFixed(2)}`
                                    : ""
                                }${
                                  cashback > 0
                                    ? ` — Cashback Given: $${cashback.toFixed(
                                        2
                                      )}`
                                    : ""
                                }`
                              : cashback > 0
                              ? `Card payment needed: $${(
                                  total + cashback
                                ).toFixed(2)} (Current: $${paidCard.toFixed(
                                  2
                                )})`
                              : `Amount due: $${(total - paidTotal).toFixed(
                                  2
                                )}`}
                          </div>

                          {paymentError && (
                            <div style={{ color: "#e74c3c" }}>
                              {paymentError}
                            </div>
                          )}
                        </>
                      )}

                      <CheckoutButton
                        onClick={processCheckout}
                        disabled={isCreditSale ? false : !isSufficient}
                      >
                        {(() => {
                          // Check if this is a balance payment
                          if (isBalancePayment) {
                            const paidCash = Number(
                              parseFloat(cashAmount) || 0
                            );
                            const paidCard = Number(
                              parseFloat(cardAmount) || 0
                            );
                            const paymentTotal = paidCash + paidCard;
                            const customerBalance =
                              selectedCustomer?.balance || 0;
                            const remainingBalance =
                              customerBalance - paymentTotal;

                            if (paymentTotal === 0) {
                              return "Enter Payment Amount";
                            } else if (remainingBalance > 0) {
                              return `Pay $${paymentTotal.toFixed(
                                2
                              )} (Balance Remaining: $${remainingBalance.toFixed(
                                2
                              )})`;
                            } else {
                              return `Pay $${paymentTotal.toFixed(
                                2
                              )} (Balance Paid)`;
                            }
                          }

                          if (!isCreditSale) return "Process Payment";

                          const subtotal = calculateTotal();
                          const tax = calculateTax();
                          const total = +(subtotal + tax).toFixed(2);
                          const cashback = Number(
                            parseFloat(cashbackAmount) || 0
                          );
                          const lotto = Number(parseFloat(lottoWinnings) || 0);
                          const finalTotal = total + cashback - lotto;
                          const paidCash = Number(parseFloat(cashAmount) || 0);
                          const paidCard = Number(parseFloat(cardAmount) || 0);
                          const paidTotal = paidCash + paidCard;
                          const specifiedCreditAmount = Number(
                            parseFloat(creditAmount) || 0
                          );

                          if (specifiedCreditAmount > 0) {
                            const paymentNeeded =
                              finalTotal - specifiedCreditAmount;
                            return `Process Sale (Payment: $${paymentNeeded.toFixed(
                              2
                            )}, Credit: $${specifiedCreditAmount.toFixed(2)})`;
                          } else {
                            const creditBalance = Math.max(
                              0,
                              finalTotal - paidTotal
                            );
                            if (paidTotal > 0 && creditBalance > 0) {
                              return `Process Partial Payment (Credit: $${creditBalance.toFixed(
                                2
                              )})`;
                            } else if (paidTotal >= finalTotal) {
                              return "Process Full Payment";
                            } else {
                              return "Create Full Credit Sale";
                            }
                          }
                        })()}
                      </CheckoutButton>
                    </div>
                  </>
                );
              })()}
            </div>
          </CheckoutPanel>
        </POSGrid>
      </Container>
    </POSWrapper>
  );
}

export default function POSPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "2rem", textAlign: "center" }}>
          Loading POS system...
        </div>
      }
    >
      <POSContent />
    </Suspense>
  );
}
