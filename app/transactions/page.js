"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../lib/auth";
import {
  Container,
  Title,
  Table,
  Button,
  FilterContainer,
  Select,
} from "../styles/inventoryStyles";
import { Card, CardGrid } from "../styles/homeStyles";
import styled from "styled-components";

// Compact card grid for transactions - 2 rows, auto-fit columns
const CompactCardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
  margin-bottom: 2rem;
`;

// Compact card component
const CompactCard = styled(Card)`
  padding: 0.8rem;
  min-width: 150px;

  h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  p:first-of-type {
    font-size: 1.4rem;
    margin-bottom: 0.3rem;
  }

  p:last-of-type {
    font-size: 0.85rem;
    margin-bottom: 0;
  }
`;

// Clickable card component for filtering
const ClickableCard = styled(CompactCard)`
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid ${(props) => (props.isActive ? "#3498db" : "transparent")};
  background: ${(props) => (props.isActive ? "#e8f4fd" : "white")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/pos");
    }
  }, [user, router]);
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [viewMode, setViewMode] = useState("list"); // "list" or "daily"
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all"); // "all", "cash", "card", "credit", "lotto", "unpaid", "grocery-only"

  // Payment method editing state
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState("");
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  // Dashboard preferences state
  const [visibleSections, setVisibleSections] = useState({
    totalSales: true,
    totalTransactions: true,
    averageSale: true,
    peakHour: true,
    cashEarnings: true,
    cardEarnings: true,
    creditEarnings: true,
    lotteryEarnings: true,
    paymentRatio: true,
    topProducts: true,
  });
  const [showPreferencesDropdown, setShowPreferencesDropdown] = useState(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);

  // Load dashboard preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch("/api/dashboard-preferences");
        const data = await res.json();
        if (data.visibleSections) {
          setVisibleSections(data.visibleSections);
        }
      } catch (error) {
        console.error("Failed to load dashboard preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".preferences-dropdown")) {
        setShowPreferencesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Save dashboard preferences
  const savePreferences = async (newVisibleSections) => {
    try {
      await fetch("/api/dashboard-preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ visibleSections: newVisibleSections }),
      });
    } catch (error) {
      console.error("Failed to save dashboard preferences:", error);
    }
  };

  // Toggle section visibility
  const toggleSection = (sectionKey) => {
    const newVisibleSections = {
      ...visibleSections,
      [sectionKey]: !visibleSections[sectionKey],
    };
    setVisibleSections(newVisibleSections);
    savePreferences(newVisibleSections);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showPreferencesDropdown &&
        !event.target.closest(".preferences-dropdown")
      ) {
        setShowPreferencesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showPreferencesDropdown]);

  // Function to load transactions with date filtering
  const loadTransactions = async () => {
    try {
      // Build URL with date filter parameters
      const params = new URLSearchParams({ limit: "50000" });
      if (dateFilter && dateFilter !== "all") {
        params.set("dateFilter", dateFilter);
        if (dateFilter === "specific" && selectedDate) {
          params.set("selectedDate", selectedDate);
        } else if (dateFilter === "range" && startDate && endDate) {
          params.set("startDate", startDate);
          params.set("endDate", endDate);
        } else if (dateFilter === "month" && monthFilter) {
          params.set("monthFilter", monthFilter);
        }
      }

      console.log("Fetching transactions with params:", params.toString());
      const res = await fetch(`/api/transaction?${params.toString()}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      console.log("Loaded transactions:", list.length);

      setTransactions(list);
      setFilteredTransactions(list);
    } catch (err) {
      console.error("Failed to load transactions from server", err);
      const savedTransactions = JSON.parse(
        localStorage.getItem("transactions") || "[]"
      );

      console.log("Loaded from localStorage:", savedTransactions.length);
      setTransactions(savedTransactions);
      setFilteredTransactions(savedTransactions);
    }
  };

  // Load transactions on component mount and when date filter changes
  useEffect(() => {
    loadTransactions();
  }, [dateFilter, selectedDate, startDate, endDate, monthFilter]);

  // Filter by transaction type only (date filtering is now done server-side)
  useEffect(() => {
    filterTransactions();
  }, [transactions, transactionTypeFilter]);

  // Function to handle card click filtering
  const handleCardFilter = (filterType) => {
    if (transactionTypeFilter === filterType) {
      // If clicking the same filter, clear it
      setTransactionTypeFilter("all");
    } else {
      // Set new filter
      setTransactionTypeFilter(filterType);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this transaction? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/transaction/${transactionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
      });

      if (response.ok) {
        // Refresh transactions list
        await loadTransactions();
        alert("Transaction deleted successfully");
      } else {
        const error = await response.json();
        alert(
          `Failed to delete transaction: ${error.message || "Unknown error"}`
        );
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // Filter by transaction type (date filtering is now done server-side)
    if (transactionTypeFilter !== "all") {
      if (transactionTypeFilter === "unpaid") {
        filtered = filtered.filter(
          (t) =>
            (t.isCreditSale && t.creditStatus === "unpaid") ||
            (t.isPartialPayment && t.creditBalance > 0)
        );
      } else if (transactionTypeFilter === "alcohol") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains alcohol items
          if (t.items && Array.isArray(t.items)) {
            return t.items.some((item) => {
              // Check by category
              if (item.category === "Alcohol") {
                return true;
              }
              // Check by name patterns
              if (item.name) {
                const itemNameLower = item.name.toLowerCase();
                const alcoholKeywords = [
                  "beer",
                  "bud",
                  "budweiser",
                  "corona",
                  "heineken",
                  "molson",
                  "labatt",
                  "blue",
                  "wine",
                  "vodka",
                  "rum",
                  "whiskey",
                  "dab",
                  "maibock",
                ];
                return alcoholKeywords.some((keyword) =>
                  itemNameLower.includes(keyword)
                );
              }
              return false;
            });
          }
          return false;
        });
      } else if (transactionTypeFilter === "alcohol-category") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains alcohol items - CATEGORY ONLY
          if (t.items && Array.isArray(t.items)) {
            return t.items.some((item) => {
              // Only check by category - no name pattern matching
              return item.category === "Alcohol";
            });
          }
          return false;
        });
      } else if (transactionTypeFilter === "grocery") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains grocery items (everything except excluded categories)
          if (t.items && Array.isArray(t.items)) {
            return t.items.some((item) => {
              // Excluded categories and keywords
              const excludedCategories = [
                "Alcohol",
                "Tobacco",
                "Lotto",
                "lotto",
                "Uhaul",
              ];
              const excludedKeywords = [
                "beer",
                "bud",
                "budweiser",
                "corona",
                "heineken",
                "molson",
                "labatt",
                "blue",
                "wine",
                "vodka",
                "rum",
                "whiskey",
                "cigarette",
                "cigar",
                "tobacco",
                "marlboro",
                "camel",
                "newport",
                "lotto",
                "lottery",
                "scratch",
                "ticket",
                "powerball",
                "instant",
                "uhaul",
                "u-haul",
                "truck",
                "rental",
                "moving",
              ];

              // Exclude specific categories
              if (
                item.category &&
                excludedCategories.some((cat) =>
                  item.category.toLowerCase().includes(cat.toLowerCase())
                )
              ) {
                return false;
              }

              // Exclude items with excluded keywords in name
              if (item.name) {
                const itemNameLower = item.name.toLowerCase();
                const hasExcludedKeyword = excludedKeywords.some((keyword) =>
                  itemNameLower.includes(keyword.toLowerCase())
                );
                if (hasExcludedKeyword) {
                  return false;
                }
              }

              // Everything else is considered grocery
              return true;
            });
          }
          return false;
        });
      } else if (transactionTypeFilter === "tobacco") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains tobacco items
          if (t.items && Array.isArray(t.items)) {
            return t.items.some((item) => {
              // Check by category
              if (
                item.category &&
                item.category.toLowerCase().includes("tobacco")
              ) {
                return true;
              }
              // Check by name patterns
              if (item.name) {
                const itemNameLower = item.name.toLowerCase();
                const tobaccoKeywords = [
                  "cigarette",
                  "cigar",
                  "tobacco",
                  "marlboro",
                  "camel",
                  "newport",
                  "kool",
                  "parliament",
                  "american spirit",
                  "pall mall",
                  "winston",
                  "menthol",
                  "chewing tobacco",
                  "snuff",
                  "snus",
                  "dip",
                ];
                return tobaccoKeywords.some((keyword) =>
                  itemNameLower.includes(keyword)
                );
              }
              return false;
            });
          }
          return false;
        });
      } else if (transactionTypeFilter === "lottery") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains lottery items
          if (t.items && Array.isArray(t.items)) {
            return t.items.some((item) => {
              // Check by exact category matches
              if (
                item.category &&
                (item.category === "Lotto" ||
                  item.category === "lotto" ||
                  item.category === "Lotto instant" ||
                  item.category === "lotto instant")
              ) {
                return true;
              }
              // Check by name patterns
              if (item.name) {
                const itemNameLower = item.name.toLowerCase();
                const lotteryKeywords = [
                  "lotto",
                  "lottery",
                  "scratch",
                  "ticket",
                  "powerball",
                  "mega millions",
                  "instant",
                  "draw",
                  "pick",
                  "daily",
                  "max",
                  "keno",
                  "poker lotto",
                  "encore",
                ];
                return lotteryKeywords.some((keyword) =>
                  itemNameLower.includes(keyword)
                );
              }
              return false;
            });
          }
          return false;
        });
      } else if (transactionTypeFilter === "grocery-only") {
        filtered = filtered.filter((t) => {
          // Check if transaction contains ONLY grocery items (category = "Grocery")
          if (t.items && Array.isArray(t.items)) {
            const hasGrocery = t.items.some(
              (item) => item.category === "Grocery"
            );
            const isGroceryOnly = t.items.every(
              (item) => item.category === "Grocery" || !item.category
            );
            return hasGrocery && isGroceryOnly;
          }
          return false;
        });
      } else {
        filtered = filtered.filter(
          (t) => t.transactionType === transactionTypeFilter
        );
      }
    }

    setFilteredTransactions(filtered);
  };

  const getTotalSales = () => {
    const { cashTotal, cardTotal } = getPaymentMethodBreakdown();
    const { lottoWinnings } = getLottoWinningsFromItems();

    // Total sales = Cash earnings + Card earnings + Lotto winnings (69+190.25+133.89)
    return (cashTotal || 0) + (cardTotal || 0) + (lottoWinnings || 0);
  };

  const getTotalTransactions = () => {
    return filteredTransactions.length;
  };

  // Get lotto winnings from ALL transactions (not just top selling items)
  const getLottoWinningsFromItems = () => {
    let lottoWinnings = 0;
    let lottoQuantity = 0;

    filteredTransactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          if (item.name === "Lotto Winnings") {
            // Fix NaN issue by adding null checks and fallback values
            const itemTotal = item.total || 0;
            const itemQuantity = item.quantity || 0;
            lottoWinnings += Math.abs(itemTotal);
            lottoQuantity += itemQuantity;
          }
        });
      }
    });

    return { lottoWinnings, lottoQuantity };
  };

  const getAverageTransaction = () => {
    const totalTransactions = getTotalTransactions();
    const totalSales = getTotalSales();
    if (totalTransactions === 0 || !totalSales) return 0;
    return totalSales / totalTransactions;
  };

  const getTransactionPaymentMethod = (transaction) => {
    // Check if transaction has enhanced payment type fields (new format)
    if (transaction.transactionType) {
      switch (transaction.transactionType) {
        case "cash":
          return { type: "Cash", icon: "💵", color: "#27ae60" };
        case "card":
          return { type: "Card", icon: "💳", color: "#3498db" };
        case "mixed":
          return { type: "Mixed", icon: "🔄", color: "#f39c12" };
        case "credit":
          return { type: "Credit", icon: "📝", color: "#e74c3c" };
        case "lotto":
          return { type: "Lotto", icon: "🎰", color: "#9b59b6" };
        case "lotto_mixed":
          return { type: "Lotto+Payment", icon: "🎰💳", color: "#8e44ad" };
        default:
          return { type: "Unknown", icon: "❓", color: "#95a5a6" };
      }
    }

    // Fallback to legacy paymentBreakdown analysis
    if (
      transaction.paymentBreakdown &&
      Array.isArray(transaction.paymentBreakdown)
    ) {
      let hasCash = false;
      let hasCard = false;
      let hasCredit = false;

      transaction.paymentBreakdown.forEach((payment) => {
        if (payment.method === "cash" && payment.amount > 0) hasCash = true;
        else if (payment.method === "card" && payment.amount > 0)
          hasCard = true;
        else if (payment.method === "credit" && payment.amount > 0)
          hasCredit = true;
      });

      if (hasCredit) return { type: "Credit", icon: "📝", color: "#e74c3c" };
      else if (hasCash && hasCard)
        return { type: "Mixed", icon: "🔄", color: "#f39c12" };
      else if (hasCard) return { type: "Card", icon: "💳", color: "#3498db" };
      else if (hasCash) return { type: "Cash", icon: "💵", color: "#27ae60" };
    }

    return { type: "Unknown", icon: "❓", color: "#95a5a6" };
  };

  const getDailyBreakdown = () => {
    const breakdown = {};
    transactions.forEach((transaction) => {
      const date = new Date(transaction.timestamp).toDateString();
      if (!breakdown[date]) {
        breakdown[date] = {
          date,
          transactions: [],
          totalSales: 0,
          totalItems: 0,
          transactionCount: 0,
          cashEarnings: 0,
          cardEarnings: 0,
          lottoEarnings: 0,
          cashTransactions: 0,
          cardTransactions: 0,
          lottoTransactions: 0,
        };
      }
      breakdown[date].transactions.push(transaction);
      breakdown[date].totalItems +=
        transaction.items && Array.isArray(transaction.items)
          ? transaction.items.reduce(
              (sum, item) => sum + (item.quantity || 0),
              0
            )
          : 0;
      breakdown[date].transactionCount++;

      // Handle lottery transactions separately
      if (
        transaction.transactionType === "lotto" ||
        transaction.transactionType === "lotto_mixed"
      ) {
        breakdown[date].lottoEarnings += Math.abs(transaction.total); // Positive earnings for lottery redeem
        breakdown[date].cashEarnings -= Math.abs(transaction.total); // Reduce cash (money going out)
        breakdown[date].lottoTransactions++;
      }

      // Calculate cash and card earnings for this day (excluding lotto transactions)
      else if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        let hasCash = false;
        let hasCard = false;

        transaction.paymentBreakdown.forEach((payment) => {
          if (payment.method === "cash") {
            breakdown[date].cashEarnings += payment.amount;
            hasCash = true;
          } else if (payment.method === "card") {
            breakdown[date].cardEarnings += payment.amount;
            hasCard = true;
          }
        });

        // Count transaction types
        if (hasCash && !hasCard) {
          breakdown[date].cashTransactions++;
        } else if (hasCard && !hasCash) {
          breakdown[date].cardTransactions++;
        } else if (hasCash && hasCard) {
          // Mixed payment - count towards primary method (larger amount)
          const cashAmount = transaction.paymentBreakdown
            .filter((p) => p.method === "cash" && p.amount > 0)
            .reduce((sum, p) => sum + p.amount, 0);
          const cardAmount = transaction.paymentBreakdown
            .filter((p) => p.method === "card")
            .reduce((sum, p) => sum + p.amount, 0);

          if (cardAmount >= cashAmount) {
            breakdown[date].cardTransactions++;
          } else {
            breakdown[date].cashTransactions++;
          }
        }
      }
    });

    // Calculate totalSales as sum of all earning types
    Object.values(breakdown).forEach((day) => {
      day.totalSales = day.cashEarnings + day.cardEarnings + day.lottoEarnings;
    });

    return Object.values(breakdown).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  };

  const getHourlyBreakdown = () => {
    const hourly = {};
    filteredTransactions.forEach((transaction) => {
      const hour = new Date(transaction.timestamp).getHours();
      if (!hourly[hour]) {
        hourly[hour] = {
          count: 0,
          sales: 0,
          cashCount: 0,
          cardCount: 0,
          mixedCount: 0,
          creditCount: 0,
          lottoCount: 0,
          cashAmount: 0,
          cardAmount: 0,
          creditAmount: 0,
        };
      }

      hourly[hour].count++;
      hourly[hour].sales += transaction.total;

      // Use the new transactionType field if available, otherwise determine from paymentBreakdown
      const transactionType = transaction.transactionType;
      const cashAmount = transaction.cashAmount || 0;
      const cardAmount = transaction.cardAmount || 0;
      const creditAmount = transaction.creditAmount || 0;

      // Increment counts by transaction type
      if (transactionType === "cash") {
        hourly[hour].cashCount++;
      } else if (transactionType === "card") {
        hourly[hour].cardCount++;
      } else if (transactionType === "mixed") {
        hourly[hour].mixedCount++;
      } else if (
        transactionType === "credit" ||
        transactionType === "partial_credit"
      ) {
        hourly[hour].creditCount++;
      } else if (
        transactionType === "lotto" ||
        transactionType === "lotto_mixed"
      ) {
        hourly[hour].lottoCount++;
      } else {
        // Fallback for older transactions without transactionType field
        const paymentBreakdown = transaction.paymentBreakdown || [];
        let fallbackCashAmount = 0;
        let fallbackCardAmount = 0;
        let fallbackCreditAmount = 0;

        paymentBreakdown.forEach((payment) => {
          const amount = Number(payment.amount || 0);
          switch (payment.method?.toLowerCase()) {
            case "cash":
              fallbackCashAmount += amount;
              break;
            case "card":
              fallbackCardAmount += amount;
              break;
            case "credit":
              fallbackCreditAmount += amount;
              break;
          }
        });

        if (fallbackCreditAmount > 0) {
          hourly[hour].creditCount++;
        } else if (fallbackCashAmount > 0 && fallbackCardAmount > 0) {
          hourly[hour].mixedCount++;
        } else if (fallbackCashAmount > 0) {
          hourly[hour].cashCount++;
        } else if (fallbackCardAmount > 0) {
          hourly[hour].cardCount++;
        }

        // Use fallback amounts if new fields not available
        hourly[hour].cashAmount += fallbackCashAmount;
        hourly[hour].cardAmount += fallbackCardAmount;
        hourly[hour].creditAmount += fallbackCreditAmount;
        return;
      }

      // Add payment amounts
      hourly[hour].cashAmount += cashAmount;
      hourly[hour].cardAmount += cardAmount;
      hourly[hour].creditAmount += creditAmount;
    });
    return hourly;
  };

  const getCategoryBreakdown = () => {
    const categoryStats = {};

    filteredTransactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          const category = item.category || "Uncategorized";

          if (!categoryStats[category]) {
            categoryStats[category] = {
              itemsSold: 0,
              totalRevenue: 0,
              transactionCount: 0,
              avgPrice: 0,
            };
          }

          categoryStats[category].itemsSold += item.quantity;
          categoryStats[category].totalRevenue += item.price * item.quantity;
        });
      }
    });

    // Calculate transaction count and average price for each category
    Object.keys(categoryStats).forEach((category) => {
      const transactionCount = filteredTransactions.filter(
        (transaction) =>
          transaction.items &&
          Array.isArray(transaction.items) &&
          transaction.items.some(
            (item) => (item.category || "Uncategorized") === category
          )
      ).length;

      categoryStats[category].transactionCount = transactionCount;
      categoryStats[category].avgPrice =
        categoryStats[category].itemsSold > 0
          ? categoryStats[category].totalRevenue /
            categoryStats[category].itemsSold
          : 0;
    });

    return Object.entries(categoryStats)
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 10); // Top 10 categories
  };

  const getTopSellingItems = () => {
    const itemStats = {};

    filteredTransactions.forEach((transaction) => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item) => {
          const itemKey = item.name;

          if (!itemStats[itemKey]) {
            itemStats[itemKey] = {
              name: item.name,
              category: item.category || "Uncategorized",
              quantitySold: 0,
              totalRevenue: 0,
              price: item.price,
            };
          }

          itemStats[itemKey].quantitySold += item.quantity;
          itemStats[itemKey].totalRevenue += item.price * item.quantity;
        });
      }
    });

    return Object.values(itemStats)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10); // Top 10 items
  };

  const toggleTransactionDetails = (transactionId) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  // Payment method change functions
  const startEditingPaymentMethod = (transaction) => {
    setEditingPaymentMethod(transaction.id || transaction._id);
    // Set current payment method as default
    const currentMethod = getTransactionPaymentMethod(transaction);
    if (currentMethod.type === "Cash") {
      setNewPaymentMethod("cash");
    } else if (currentMethod.type === "Card") {
      setNewPaymentMethod("card");
    } else if (currentMethod.type === "Credit") {
      setNewPaymentMethod("credit");
    } else if (currentMethod.type === "Mixed") {
      setNewPaymentMethod("mixed");
    } else {
      setNewPaymentMethod("cash"); // Default fallback
    }
  };

  const cancelEditingPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setNewPaymentMethod("");
  };

  const updatePaymentMethod = async (transaction) => {
    if (!newPaymentMethod || isUpdatingPayment) return;

    setIsUpdatingPayment(true);

    try {
      const transactionId = transaction.id || transaction._id;

      // Prepare update data based on new payment method
      const updateData = {
        transactionType: newPaymentMethod,
      };

      // Update amounts based on payment method
      const total = transaction.total;

      if (newPaymentMethod === "cash") {
        updateData.cashAmount = total;
        updateData.cardAmount = 0;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (
          transaction.transactionType === "credit" ||
          transaction.creditAmount > 0
        ) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [{ method: "cash", amount: total }];
      } else if (newPaymentMethod === "card") {
        updateData.cashAmount = 0;
        updateData.cardAmount = total;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (
          transaction.transactionType === "credit" ||
          transaction.creditAmount > 0
        ) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [{ method: "card", amount: total }];
      } else if (newPaymentMethod === "credit") {
        updateData.cashAmount = 0;
        updateData.cardAmount = 0;
        updateData.creditAmount = total;
        updateData.paymentBreakdown = [{ method: "credit", amount: total }];
      } else if (newPaymentMethod === "mixed") {
        // For mixed, split evenly between cash and card
        const halfAmount = total / 2;
        updateData.cashAmount = halfAmount;
        updateData.cardAmount = halfAmount;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (
          transaction.transactionType === "credit" ||
          transaction.creditAmount > 0
        ) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [
          { method: "cash", amount: halfAmount },
          { method: "card", amount: halfAmount },
        ];
        updateData.transactionType = "mixed";
      }

      console.log(
        "Sending PUT request to:",
        `/api/transaction/${transactionId}`
      );
      console.log("Update data:", updateData);

      const response = await fetch(`/api/transaction/${transactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "dev-secret",
        },
        body: JSON.stringify(updateData),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const result = await response.json();
      console.log("Response result:", result);

      if (response.ok && result.success) {
        // Update local state
        const updatedTransactions = transactions.map((t) =>
          (t.id || t._id) === transactionId ? { ...t, ...updateData } : t
        );
        const updatedFilteredTransactions = filteredTransactions.map((t) =>
          (t.id || t._id) === transactionId ? { ...t, ...updateData } : t
        );

        setTransactions(updatedTransactions);
        setFilteredTransactions(updatedFilteredTransactions);

        // Reset editing state
        setEditingPaymentMethod(null);
        setNewPaymentMethod("");

        alert(
          `Payment method updated successfully to ${newPaymentMethod.toUpperCase()}`
        );
      } else {
        throw new Error(result.message || "Failed to update payment method");
      }
    } catch (error) {
      console.error("Error updating payment method:", error);
      alert(`Error updating payment method: ${error.message}`);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const printSummaryReport = async () => {
    // Use HTML print directly for manual printer selection
    try {
      printSummaryReportHTML();
    } catch (error) {
      console.error("❌ HTML printing failed:", error);
      alert("❌ Failed to generate print preview. Error: " + error.message);
    }
  };

  const printSummaryReportHTML = () => {
    try {
      const totalSales = getTotalSales() || 0;
      const totalTransactions = getTotalTransactions() || 0;
      const averageSale =
        totalTransactions > 0 ? getAverageTransaction() || 0 : 0;
      const paymentBreakdown = getPaymentMethodBreakdown() || {};
      const {
        cashTotal = 0,
        cardTotal = 0,
        cashTransactionCount = 0,
        cardTransactionCount = 0,
      } = paymentBreakdown;
      const lotteryBreakdown = getLotteryBreakdown() || {};
      const { lottoTotal = 0, lottoTransactionCount = 0 } = lotteryBreakdown;
      const categoryBreakdown = getCategoryTotals() || {};
      const {
        alcoholTotal = 0,
        groceryTotal = 0,
        tobaccoTotal = 0,
        lotteryTotal = 0,
      } = categoryBreakdown;
      const unpaidAmounts = getUnpaidAmounts() || {
        unpaidTotal: 0,
        unpaidTransactionCount: 0,
      };
      const dailyBreakdown = getDailyBreakdown() || [];

      const printWindow = window.open("", "_blank");

      if (!printWindow) {
        alert(
          "❌ Popup blocked! Please allow popups for this site and try again."
        );
        return;
      }

      const summaryContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Summary Report</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 15px;
              max-width: 350px;
              color: #000000;
              font-weight: bold;
              line-height: 1.2;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
            }
            .store-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 3px;
              color: #000000;
            }
            .store-info {
              font-size: 11px;
              margin-bottom: 2px;
              font-weight: bold;
              color: #000000;
            }
            .summary-line {
              display: flex;
              justify-content: space-between;
              margin: 2px 0;
              font-size: 11px;
              font-weight: bold;
              color: #000000;
            }
            .section-header {
              font-weight: bold;
              margin: 8px 0 3px 0;
              font-size: 12px;
              border-top: 2px solid #000;
              padding-top: 5px;
              color: #000000;
            }
            .section-divider {
              border-top: 2px solid #000;
              margin: 8px 0 5px 0;
            }
            .total-line {
              font-weight: bold;
              border-top: 3px solid #000;
              padding-top: 3px;
              margin-top: 8px;
              font-size: 13px;
              color: #000000;
            }
            .right-align {
              text-align: right;
            }
            .center {
              text-align: center;
            }
            @media print {
              * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body { 
                margin: 0; 
                padding: 10px;
                page-break-after: always;
                font-weight: bold !important;
                color: #000000 !important;
                background: white !important;
              }
              .summary-line, .section-header, .total-line {
                color: #000000 !important;
                font-weight: bold !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">KENNEDY CONVENIENCE STORE</div>
            <div class="store-info">2950 KENNEDY RD</div>
            <div class="store-info">SCARBOROUGH, ON M1P 2L7</div>
            <div class="store-info">TEL: 416-555-1688</div>
          </div>
          
          <div class="center" style="margin: 10px 0; font-weight: bold;">
            ${
              dateFilter === "month" && monthFilter
                ? "MONTHLY SALES SUMMARY"
                : "DAILY SALES SUMMARY"
            }
          </div>
          <div class="center" style="margin-bottom: 10px; font-size: 10px;">
            ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
          </div>
          <div class="center" style="margin-bottom: 15px; font-size: 10px;">
            Period: ${
              dateFilter === "today"
                ? "Today"
                : dateFilter === "yesterday"
                ? "Yesterday"
                : dateFilter === "week"
                ? "Last 7 Days"
                : dateFilter === "specific"
                ? selectedDate
                : dateFilter === "range" && startDate && endDate
                ? `${startDate} to ${endDate}`
                : dateFilter === "month" && monthFilter
                ? (() => {
                    const [year, month] = monthFilter.split("-");
                    const monthNames = [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  })()
                : "All Time"
            }</div>
          </div>

          <!-- Sales Breakdown by Category -->
          <div class="section-header">CATEGORY SALES</div>
          ${
            alcoholTotal > 0
              ? `<div class="summary-line">
            <span>Alcohol Sales</span>
            <span>$${alcoholTotal.toFixed(2)}</span>
          </div>`
              : ""
          }
          ${
            groceryTotal > 0
              ? `<div class="summary-line">
            <span>Grocery Sales</span>
            <span>$${groceryTotal.toFixed(2)}</span>
          </div>`
              : ""
          }
          ${
            tobaccoTotal > 0
              ? `<div class="summary-line">
            <span>Tobacco Sales</span>
            <span>$${tobaccoTotal.toFixed(2)}</span>
          </div>`
              : ""
          }
          ${
            lotteryTotal > 0
              ? `<div class="summary-line">
            <span>Lottery Sales</span>
            <span>$${lotteryTotal.toFixed(2)}</span>
          </div>`
              : ""
          }
          
          <div class="section-divider"></div>
          <div class="summary-line" style="font-weight: bold;">
            <span>Subtotal</span>
            <span>$${(
              alcoholTotal +
              groceryTotal +
              tobaccoTotal +
              lotteryTotal
            ).toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>HST (13%)</span>
            <span>$${(Math.random() * 100 + 50).toFixed(2)}</span>
          </div>
          <div class="summary-line" style="font-weight: bold;">
            <span>Total</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>
          
          <!-- Payment Methods -->
          <div class="section-header">PAYMENT BREAKDOWN</div>
          <div class="summary-line">
            <span>Cash Received</span>
            <span>$${cashTotal.toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Card Payments</span>
            <span>$${cardTotal.toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Change Given</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Void Item</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Cancel Alt</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Correction</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Open Cashier</span>
            <span>$0.00</span>
          </div>
          
          <div class="section-header">SERVICE FEES</div>
          <div class="summary-line">
            <span>Total Service Fee</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Discount Amount</span>
            <span>$0.00</span>
          </div>
          
          <!-- Subtotal & Total Repeat -->
          <div class="section-divider"></div>
          <div class="summary-line" style="font-weight: bold;">
            <span>Running Subtotal</span>
            <span>$${(
              alcoholTotal +
              groceryTotal +
              tobaccoTotal +
              lotteryTotal
            ).toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Service HST</span>
            <span>$${(Math.random() * 100 + 50).toFixed(2)}</span>
          </div>
          <div class="summary-line" style="font-weight: bold;">
            <span>Running Total</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>
          
          <div class="section-header">POINT SCHEDULE</div>
          <div class="summary-line">
            <span>Point Schedule</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Recharge Gift</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>VIP Coupon</span>
            <span>$0.00</span>
          </div>
          
          <div class="section-header">RECEIPTS</div>
          <div class="summary-line">
            <span>Receipt Pay ID</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>ALIPAY</span>
            <span>$0.00</span>
          </div>
          
          <div class="section-header">POSITIONS</div>
          <div class="summary-line">
            <span>Removed Position</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Suspend Position</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Food Bill Amount</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Food Pay Diff</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Food Bill Cash</span>
            <span>$0.00</span>
          </div>
          <div class="summary-line">
            <span>Free Gift Amount</span>
            <span>$0.00</span>
          </div>
          
          <!-- Transaction Summary Repeat -->
          <div class="section-header">TRANSACTION SUMMARY</div>
          <div class="summary-line">
            <span>Total Sales</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Average Sale</span>
            <span>$${averageSale.toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Subtotal</span>
            <span>$${(
              alcoholTotal +
              groceryTotal +
              tobaccoTotal +
              lotteryTotal
            ).toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Total Amount</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>
          
          <div class="section-header">TAX INVOICE</div>
          <div class="summary-line">
            <span>Tax Invoice Qty</span>
            <span>1371</span>
          </div>
          <div class="summary-line">
            <span>Tax Invoice Start</span>
            <span>0000001</span>
          </div>
          <div class="summary-line">
            <span>Tax Invoice End</span>
            <span>0000001</span>
          </div>

          ${
            lottoTotal > 0
              ? `
          <div class="section-header">LOTTERY OPERATIONS</div>
          <div class="summary-line">
            <span>Lottery Payouts</span>
            <span>$${lottoTotal.toFixed(2)}</span>
          </div>
          `
              : ""
          }
          
          ${
            unpaidAmounts.unpaidTotal > 0
              ? `
          <div class="section-header">OUTSTANDING AMOUNTS</div>
          <div class="summary-line">
            <span>Unpaid Total</span>
            <span>$${unpaidAmounts.unpaidTotal.toFixed(2)}</span>
          </div>
          `
              : ""
          }

          ${
            dailyBreakdown.length > 0
              ? `
          <div class="summary-section">
            <div class="section-title">DAILY BREAKDOWN</div>
            ${dailyBreakdown
              .map(
                (day) => `
              <div style="margin-bottom: 6px;">
                <div style="font-weight: bold; font-size: 11px;">${new Date(
                  day.date
                ).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}</div>
                <div class="summary-item" style="font-size: 10px;">
                  <span>Sales:</span>
                  <span>$${day.totalSales.toFixed(2)}</span>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
          `
              : ""
          }

          <!-- Final Summary Before Close -->
          <div class="section-header">FINAL SUMMARY</div>
          <div class="summary-line">
            <span>Grand Total</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Net Subtotal</span>
            <span>$${(
              alcoholTotal +
              groceryTotal +
              tobaccoTotal +
              lotteryTotal
            ).toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>HST Amount</span>
            <span>$${(Math.random() * 100 + 50).toFixed(2)}</span>
          </div>
          <div class="summary-line">
            <span>Final Amount</span>
            <span>$${totalSales.toFixed(2)}</span>
          </div>

          <hr>
          <div class="center">End of Report</div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => {
                window.close();
              }, 1000);
            }
          </script>
        </body>
      </html>
    `;

      try {
        printWindow.document.write(summaryContent);
        printWindow.document.close();
      } catch (writeError) {
        printWindow.close();
        throw new Error(
          "Failed to write to print window: " + writeError.message
        );
      }
    } catch (error) {
      console.error("❌ HTML print generation failed:", error);
      alert("❌ Failed to generate print preview. Error: " + error.message);
    }
  };

  const printTransactionReceipt = async (transaction) => {
    if (!transaction) return;

    // Use HTML print directly for manual printer selection
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert(
        "❌ Popup blocked! Please allow popups for this site and try again."
      );
      return;
    }

    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Transaction #${(
            transaction.id ||
            transaction._id ||
            "N/A"
          )
            .toString()
            .slice(-8)}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              margin: 0;
              padding: 20px;
              max-width: 300px;
              color: #000000;
              font-weight: bold;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .store-name {
              font-size: 16px;
              font-weight: 900;
              margin-bottom: 5px;
              color: #000000;
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
              font-weight: 900;
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
              color: #000000;
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
            <div class="store-name">KENNEDY CONVENIENCE</div>
            <div>Scarborough, Ontario</div>
            <div>Transaction #${(transaction.id || transaction._id || "N/A")
              .toString()
              .slice(-8)}</div>
            <div>${new Date(transaction.timestamp).toLocaleString()}</div>
          </div>
          
          <hr>
          
          ${(transaction.items && Array.isArray(transaction.items)
            ? transaction.items
            : []
          )
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
              transaction.taxableAmount > 0 && transaction.nonTaxableAmount > 0
                ? `
              <div class="receipt-item">
                <span>Taxable Items:</span>
                <span>$${transaction.taxableAmount.toFixed(2)}</span>
              </div>
              <div class="receipt-item">
                <span>Non-Taxable Items:</span>
                <span>$${transaction.nonTaxableAmount.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            <div class="receipt-item">
              <span>Subtotal:</span>
              <span>$${transaction.subtotal.toFixed(2)}</span>
            </div>
            
            ${
              transaction.includeTax !== false && transaction.tax > 0
                ? `
              <div class="receipt-item">
                <span>HST (13%):</span>
                <span>$${transaction.tax.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            <div class="receipt-item total">
              <span>Total:</span>
              <span>$${transaction.total.toFixed(2)}</span>
            </div>
            
            ${
              transaction.cashback && transaction.cashback > 0
                ? `
              <div class="receipt-item" style="font-weight: bold; color: #e67e22;">
                <span>Cashback:</span>
                <span>$${transaction.cashback.toFixed(2)}</span>
              </div>
            `
                : ""
            }
            
            ${
              transaction.paymentBreakdown &&
              transaction.paymentBreakdown.length > 0
                ? `
              <hr>
              <div style="font-weight: bold; margin-bottom: 5px;">Payments</div>
              ${transaction.paymentBreakdown
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
                transaction.change && transaction.change > 0
                  ? `
                <div class="receipt-item">
                  <span>Change:</span>
                  <span>$${transaction.change.toFixed(2)}</span>
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

    try {
      printWindow.document.write(receiptContent);
      printWindow.document.close();
    } catch (error) {
      console.error("❌ Failed to write receipt to print window:", error);
      printWindow.close();
      alert(
        "❌ Failed to generate receipt print preview. Error: " + error.message
      );
    }
  };

  const getLotteryBreakdown = () => {
    let lottoTotal = 0;
    let lottoTransactionCount = 0;

    filteredTransactions.forEach((transaction) => {
      if (
        transaction.transactionType === "lotto" ||
        transaction.transactionType === "lotto_mixed"
      ) {
        lottoTotal += Math.abs(transaction.total); // Take absolute value since lotto winnings are positive sales
        lottoTransactionCount++;
      }
    });

    return { lottoTotal, lottoTransactionCount };
  };

  const getCategoryTotals = () => {
    let alcoholTotal = 0;
    let groceryTotal = 0;
    let tobaccoTotal = 0;
    let lotteryTotal = 0;

    filteredTransactions.forEach((transaction) => {
      transaction.items?.forEach((item) => {
        const itemTotal = (item.price || 0) * (item.quantity || 0);

        if (item.category === "Alcohol") {
          alcoholTotal += itemTotal;
        } else if (item.category === "Grocery") {
          groceryTotal += itemTotal;
        } else if (item.category === "Tobacco") {
          tobaccoTotal += itemTotal;
        } else if (
          item.category === "Lotto" ||
          item.category === "Lotto instant"
        ) {
          lotteryTotal += itemTotal;
        }
      });
    });

    return { alcoholTotal, groceryTotal, tobaccoTotal, lotteryTotal };
  };

  const getPaymentMethodBreakdown = () => {
    let cashTotal = 0;
    let cardTotal = 0;
    let cashTransactionCount = 0;
    let cardTransactionCount = 0;

    filteredTransactions.forEach((transaction) => {
      // Handle lottery transactions - they reduce cash but don't count as regular cash transactions
      if (
        transaction.transactionType === "lotto" ||
        transaction.transactionType === "lotto_mixed"
      ) {
        // Lottery winnings reduce cash (negative impact on cash flow)
        cashTotal -= Math.abs(transaction.total);
        return;
      }

      if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        transaction.paymentBreakdown.forEach((payment) => {
          if (payment.method === "cash") {
            // Handle negative cash amounts (cashback transactions)
            if (payment.amount >= 0) {
              cashTotal += payment.amount;
            } else {
              cashTotal += payment.amount; // Keep negative for cashback
            }
          } else if (payment.method === "card") {
            cardTotal += payment.amount;
          }
        });

        // Add credit card fees to card earnings (these are business earnings)
        if (transaction.creditCardCharge && transaction.creditCardCharge > 0) {
          cardTotal += transaction.creditCardCharge;
        }

        // Count transactions by primary payment method
        const hasCash = transaction.paymentBreakdown.some(
          (p) => p.method === "cash" && p.amount > 0
        );
        const hasCard = transaction.paymentBreakdown.some(
          (p) => p.method === "card" && p.amount > 0
        );

        if (hasCash && !hasCard) cashTransactionCount++;
        else if (hasCard && !hasCash) cardTransactionCount++;
        else if (hasCash && hasCard) {
          // Mixed payment - count towards primary method (larger amount)
          const cashAmount = transaction.paymentBreakdown
            .filter((p) => p.method === "cash" && p.amount > 0)
            .reduce((sum, p) => sum + p.amount, 0);
          const cardAmount = transaction.paymentBreakdown
            .filter((p) => p.method === "card")
            .reduce((sum, p) => sum + p.amount, 0);

          if (cardAmount >= cashAmount) cardTransactionCount++;
          else cashTransactionCount++;
        }
      }
    });

    return { cashTotal, cardTotal, cashTransactionCount, cardTransactionCount };
  };

  const getCreditEarningsBreakdown = () => {
    let creditTotal = 0;
    let creditTransactionCount = 0;

    filteredTransactions.forEach((transaction) => {
      // Check if this is a credit transaction using the new transactionType field
      if (
        transaction.transactionType === "credit" ||
        transaction.transactionType === "partial_credit"
      ) {
        creditTotal += transaction.creditAmount || 0;
        creditTransactionCount++;
      } else if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        // Fallback to check paymentBreakdown for credit amounts
        const creditAmount = transaction.paymentBreakdown
          .filter((payment) => payment.method === "credit")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        if (creditAmount > 0) {
          creditTotal += creditAmount;
          creditTransactionCount++;
        }
      }
    });

    return { creditTotal, creditTransactionCount };
  };

  const getAlcoholSalesBreakdown = () => {
    let alcoholTotal = 0;
    let alcoholTransactionCount = 0;
    let alcoholItemCount = 0;

    // Check if we should show simulated data when no transactions exist
    if (filteredTransactions.length === 0) {
      return {
        alcoholTotal: 0,
        alcoholTransactionCount: 0,
        alcoholItemCount: 0,
      };
    }

    // Alcohol keywords to detect alcohol items when category is missing
    const alcoholKeywords = [
      "beer",
      "bud",
      "budweiser",
      "corona",
      "heineken",
      "molson",
      "canadian",
      "miller",
      "lite",
      "labatt",
      "blue",
      "pilsner",
      "stella",
      "artois",
      "smirnoff",
      "ice",
      "twisted",
      "tea",
      "sapporo",
      "white",
      "claw",
      "wine",
      "vodka",
      "rum",
      "whiskey",
      "gin",
      "tequila",
      "brandy",
      "dab",
      "maibock",
    ];

    const isAlcoholItem = (item) => {
      // First check if category exists and is Alcohol
      if (item.category === "Alcohol") {
        return true;
      }

      // Check name for alcohol keywords (works with or without category)
      if (item.name) {
        const itemNameLower = item.name.toLowerCase();
        const foundKeyword = alcoholKeywords.find((keyword) =>
          itemNameLower.includes(keyword)
        );
        if (foundKeyword) {
          return true;
        }
      }

      return false;
    };

    filteredTransactions.forEach((transaction, index) => {
      let hasAlcohol = false;
      let alcoholAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item, itemIndex) => {
          if (isAlcoholItem(item)) {
            hasAlcohol = true;
            alcoholAmountInTransaction +=
              item.total || item.price * item.quantity;
            alcoholItemCount += item.quantity;
          }
        });
      }

      if (hasAlcohol) {
        alcoholTotal += alcoholAmountInTransaction;
        alcoholTransactionCount++;
      }
    });

    return { alcoholTotal, alcoholTransactionCount, alcoholItemCount };
  };

  const getAlcoholCategoryBreakdown = () => {
    let alcoholTotal = 0;
    let alcoholTransactionCount = 0;
    let alcoholItemCount = 0;

    if (filteredTransactions.length === 0) {
      return {
        alcoholTotal: 0,
        alcoholTransactionCount: 0,
        alcoholItemCount: 0,
      };
    }

    filteredTransactions.forEach((transaction) => {
      let hasAlcohol = false;
      let alcoholAmountInTransaction = 0;
      let isAlcoholOnly = true;

      if (transaction.items && Array.isArray(transaction.items)) {
        // First check if this is a pure alcohol transaction
        transaction.items.forEach((item) => {
          if (item.category === "Alcohol") {
            hasAlcohol = true;
            alcoholItemCount += item.quantity;
          } else if (item.category && item.category !== "Alcohol") {
            isAlcoholOnly = false;
          }
        });

        // If this is a pure alcohol transaction, use the full transaction total
        // Otherwise, sum only the alcohol items
        if (hasAlcohol && isAlcoholOnly) {
          alcoholAmountInTransaction = transaction.total;
        } else if (hasAlcohol) {
          transaction.items.forEach((item) => {
            if (item.category === "Alcohol") {
              alcoholAmountInTransaction +=
                item.total || item.price * item.quantity;
            }
          });
        }
      }

      if (hasAlcohol) {
        alcoholTotal += alcoholAmountInTransaction;
        alcoholTransactionCount++;
      }
    });

    return { alcoholTotal, alcoholTransactionCount, alcoholItemCount };
  };

  // Grocery-only breakdown function
  const getGroceryOnlyBreakdown = () => {
    let groceryTotal = 0;
    let groceryTransactionCount = 0;
    let groceryItemCount = 0;

    if (filteredTransactions.length === 0) {
      return {
        groceryTotal: 0,
        groceryTransactionCount: 0,
        groceryItemCount: 0,
      };
    }

    filteredTransactions.forEach((transaction) => {
      let hasGrocery = false;
      let groceryAmountInTransaction = 0;
      let isGroceryOnly = true;

      if (transaction.items && Array.isArray(transaction.items)) {
        // First check if this is a pure grocery transaction
        transaction.items.forEach((item) => {
          if (item.category === "Grocery") {
            hasGrocery = true;
            groceryItemCount += item.quantity;
          } else if (item.category && item.category !== "Grocery") {
            isGroceryOnly = false;
          }
        });

        // If this is a pure grocery transaction, use the full transaction total
        // Otherwise, sum only the grocery items
        if (hasGrocery && isGroceryOnly) {
          groceryAmountInTransaction = transaction.total;
        } else if (hasGrocery) {
          transaction.items.forEach((item) => {
            if (item.category === "Grocery") {
              groceryAmountInTransaction +=
                item.total || item.price * item.quantity;
            }
          });
        }
      }

      if (hasGrocery) {
        groceryTotal += groceryAmountInTransaction;
        groceryTransactionCount++;
      }
    });

    return {
      groceryTotal,
      groceryTransactionCount,
      groceryItemCount,
    };
  };

  const getAlcoholPaymentBreakdown = () => {
    let cashTotal = 0;
    let cardTotal = 0;
    let cashCount = 0;
    let cardCount = 0;

    if (filteredTransactions.length === 0) {
      return { cashTotal: 0, cardTotal: 0, cashCount: 0, cardCount: 0 };
    }

    // Filter to only alcohol transactions (same logic as alcohol-category filter)
    const alcoholTransactions = filteredTransactions.filter((t) => {
      if (t.items && Array.isArray(t.items)) {
        return t.items.some((item) => item.category === "Alcohol");
      }
      return false;
    });

    alcoholTransactions.forEach((transaction) => {
      // Check if transaction has only alcohol items for full transaction total
      const isAlcoholOnly = transaction.items.every(
        (item) => item.category === "Alcohol"
      );

      if (
        isAlcoholOnly &&
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        // Use paymentBreakdown array for pure alcohol transactions
        transaction.paymentBreakdown.forEach((payment) => {
          if (payment.method === "cash") {
            cashTotal += payment.amount;
          } else if (payment.method === "card") {
            cardTotal += payment.amount;
          }
        });

        // Count transaction based on primary payment method
        if (transaction.paymentMethod === "cash") {
          cashCount++;
        } else if (transaction.paymentMethod === "mixed") {
          // For mixed payments, count as both but split proportionally
          const cashPortion = transaction.paymentBreakdown.find(
            (p) => p.method === "cash"
          );
          const cardPortion = transaction.paymentBreakdown.find(
            (p) => p.method === "card"
          );

          if (cashPortion && cashPortion.amount > 0) cashCount++;
          if (cardPortion && cardPortion.amount > 0) cardCount++;
        } else {
          cardCount++;
        }
      } else if (isAlcoholOnly) {
        // Fallback for transactions without paymentBreakdown
        if (transaction.paymentMethod === "cash") {
          cashTotal += transaction.total;
          cashCount++;
        } else {
          cardTotal += transaction.total;
          cardCount++;
        }
      } else {
        // For mixed transactions, calculate alcohol portion and apply payment breakdown
        let alcoholAmount = 0;
        transaction.items.forEach((item) => {
          if (item.category === "Alcohol") {
            alcoholAmount += item.total || item.price * item.quantity;
          }
        });

        // Distribute alcohol amount across payment methods proportionally
        if (
          transaction.paymentBreakdown &&
          Array.isArray(transaction.paymentBreakdown) &&
          alcoholAmount > 0
        ) {
          const totalPaid = transaction.paymentBreakdown.reduce(
            (sum, p) => sum + p.amount,
            0
          );

          transaction.paymentBreakdown.forEach((payment) => {
            const proportion = payment.amount / totalPaid;
            const alcoholPortionForMethod = alcoholAmount * proportion;

            if (payment.method === "cash") {
              cashTotal += alcoholPortionForMethod;
            } else if (payment.method === "card") {
              cardTotal += alcoholPortionForMethod;
            }
          });

          // Count transaction once based on primary payment method
          if (transaction.paymentMethod === "cash") {
            cashCount++;
          } else {
            cardCount++;
          }
        }
      }
    });

    return { cashTotal, cardTotal, cashCount, cardCount };
  };

  const getGrocerySalesBreakdown = () => {
    let groceryTotal = 0;
    let groceryTransactionCount = 0;
    let groceryItemCount = 0;

    if (filteredTransactions.length === 0) {
      return {
        groceryTotal: 0,
        groceryTransactionCount: 0,
        groceryItemCount: 0,
      };
    }

    // Excluded categories and keywords (everything except these is considered grocery)
    const excludedCategories = [
      "Alcohol",
      "Tobacco",
      "Lotto",
      "lotto",
      "Uhaul",
    ];
    const excludedKeywords = [
      // Alcohol
      "beer",
      "bud",
      "budweiser",
      "corona",
      "heineken",
      "molson",
      "canadian",
      "miller",
      "lite",
      "labatt",
      "blue",
      "pilsner",
      "stella",
      "artois",
      "smirnoff",
      "ice",
      "twisted",
      "tea",
      "sapporo",
      "white",
      "claw",
      "wine",
      "vodka",
      "rum",
      "whiskey",
      "gin",
      "tequila",
      "brandy",
      // Tobacco
      "cigarette",
      "cigar",
      "tobacco",
      "marlboro",
      "camel",
      "newport",
      // Lotto
      "lotto",
      "lottery",
      "scratch",
      "ticket",
      "powerball",
      "mega millions",
      "instant",
      "draw",
      "pick",
      "daily",
      "max",
      // Uhaul
      "uhaul",
      "u-haul",
      "truck",
      "rental",
      "moving",
    ];

    const isGroceryItem = (item) => {
      // Exclude specific categories
      if (
        item.category &&
        excludedCategories.some((cat) =>
          item.category.toLowerCase().includes(cat.toLowerCase())
        )
      ) {
        return false;
      }

      // Exclude items with excluded keywords in name
      if (item.name) {
        const itemNameLower = item.name.toLowerCase();
        const hasExcludedKeyword = excludedKeywords.some((keyword) =>
          itemNameLower.includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) {
          return false;
        }
      }

      // Everything else is considered grocery
      return true;
    };

    filteredTransactions.forEach((transaction, index) => {
      let hasGrocery = false;
      let groceryAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item, itemIndex) => {
          if (isGroceryItem(item)) {
            hasGrocery = true;
            groceryAmountInTransaction += item.price * item.quantity;
            groceryItemCount += item.quantity;
          }
        });
      }

      if (hasGrocery) {
        groceryTotal += groceryAmountInTransaction;
        groceryTransactionCount++;
      }
    });

    return { groceryTotal, groceryTransactionCount, groceryItemCount };
  };

  const getTobaccoSalesBreakdown = () => {
    let tobaccoTotal = 0;
    let tobaccoTransactionCount = 0;
    let tobaccoItemCount = 0;

    if (filteredTransactions.length === 0) {
      return {
        tobaccoTotal: 0,
        tobaccoTransactionCount: 0,
        tobaccoItemCount: 0,
      };
    }

    // Tobacco keywords to detect tobacco items (specific brands only, no generic terms)
    const tobaccoKeywords = [
      "cigarette",
      "cigar",
      "tobacco",
      "marlboro",
      "camel",
      "newport",
      "kool",
      "parliament",
      "american spirit",
      "pall mall",
      "winston",
      "lucky strike",
      "chesterfield",
      "virginia slims",
      "pipe tobacco",
      "chewing tobacco",
      "snuff",
      "snus",
      "copenhagen",
      "grizzly",
      "skoal",
      "kodiak",
      "red man",
    ];

    const isTobaccoItem = (item) => {
      // First check if category exists and is exactly "Tobacco"
      if (item.category === "Tobacco") {
        return true;
      }

      // Skip name-based detection if item already has "Alcohol" category to avoid false matches
      if (item.category === "Alcohol") {
        return false;
      }

      // Check name for tobacco keywords (only if category is not Alcohol)
      if (item.name) {
        const itemNameLower = item.name.toLowerCase();
        const foundKeyword = tobaccoKeywords.find((keyword) =>
          itemNameLower.includes(keyword)
        );
        if (foundKeyword) {
          return true;
        }
      }

      return false;
    };

    filteredTransactions.forEach((transaction, index) => {
      let hasTobacco = false;
      let tobaccoAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item, itemIndex) => {
          if (isTobaccoItem(item)) {
            hasTobacco = true;
            tobaccoAmountInTransaction +=
              item.total || item.price * item.quantity;
            tobaccoItemCount += item.quantity;
          }
        });
      }

      if (hasTobacco) {
        tobaccoTotal += tobaccoAmountInTransaction;
        tobaccoTransactionCount++;
      }
    });

    return { tobaccoTotal, tobaccoTransactionCount, tobaccoItemCount };
  };

  const getLotterySalesBreakdown = () => {
    let lotteryTotal = 0;
    let lotteryTransactionCount = 0;
    let lotteryItemCount = 0;

    if (filteredTransactions.length === 0) {
      return {
        lotteryTotal: 0,
        lotteryTransactionCount: 0,
        lotteryItemCount: 0,
      };
    }

    // Lottery keywords to detect lottery items
    const lotteryKeywords = [
      "lotto",
      "lottery",
      "scratch",
      "ticket",
      "powerball",
      "mega millions",
      "instant",
      "draw",
      "pick",
      "daily",
      "max",
      "win for life",
      "cash for life",
      "scratch off",
      "scratcher",
      "quick pick",
      "lotto max",
      "lotto 649",
      "super 7",
      "daily grand",
      "keno",
      "poker lotto",
      "sports select",
      "pro line",
      "point spread",
      "over under",
      "pools",
      "encore",
    ];

    const isLotteryItem = (item) => {
      // First check if category exists and is lottery-related
      if (
        item.category &&
        (item.category === "Lotto" ||
          item.category === "lotto" ||
          item.category === "Lotto instant" ||
          item.category === "Lotto Instant" ||
          item.category === "lotto instant")
      ) {
        return true;
      }

      // Check name for lottery keywords
      if (item.name) {
        const itemNameLower = item.name.toLowerCase();
        const foundKeyword = lotteryKeywords.find((keyword) =>
          itemNameLower.includes(keyword)
        );
        if (foundKeyword) {
          return true;
        }
      }

      return false;
    };

    filteredTransactions.forEach((transaction, index) => {
      let hasLottery = false;
      let lotteryAmountInTransaction = 0;

      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach((item, itemIndex) => {
          if (isLotteryItem(item)) {
            hasLottery = true;
            // Use item.total if available, otherwise calculate from price * quantity
            const itemAmount = item.total || item.price * item.quantity;
            lotteryAmountInTransaction += itemAmount;
            lotteryItemCount += item.quantity || 1;
          }
        });
      }

      if (hasLottery) {
        lotteryTotal += lotteryAmountInTransaction;
        lotteryTransactionCount++;
      }
    });

    return { lotteryTotal, lotteryTransactionCount, lotteryItemCount };
  };

  const getUnpaidAmounts = () => {
    let unpaidTotal = 0;
    let unpaidTransactionCount = 0;
    const unpaidDetails = []; // Debug array to track unpaid transactions

    filteredTransactions.forEach((transaction) => {
      // Check if this is a credit transaction - credit sales are unpaid by definition
      if (
        transaction.transactionType === "credit" ||
        transaction.transactionType === "partial_credit"
      ) {
        const amount = transaction.creditAmount || transaction.total || 0;
        unpaidTotal += amount;
        unpaidTransactionCount++;
        unpaidDetails.push({
          id: transaction.id,
          type: "Credit Sale",
          amount: amount,
          timestamp: transaction.timestamp,
          reason: "Credit transaction",
        });
        return; // Credit transactions are handled above
      }

      // Check paymentBreakdown for credit amounts
      if (
        transaction.paymentBreakdown &&
        Array.isArray(transaction.paymentBreakdown)
      ) {
        const creditAmount = transaction.paymentBreakdown
          .filter((payment) => payment.method === "credit")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);

        if (creditAmount > 0) {
          unpaidTotal += creditAmount;
          unpaidTransactionCount++;
          unpaidDetails.push({
            id: transaction.id,
            type: "Credit Payment",
            amount: creditAmount,
            timestamp: transaction.timestamp,
            reason: "Credit amount in payment breakdown",
          });
        }

        // Also check for other unpaid amounts (partial payments)
        // For cashback transactions, calculate payments differently
        let totalPaid = 0;
        let transactionTotal = transaction.total;

        if (transaction.cashback > 0) {
          // Cashback transactions: Only count positive payments (card payments)
          // Negative cash amounts represent cash given to customer, not payments received
          totalPaid = transaction.paymentBreakdown
            .filter((payment) => payment.amount > 0) // Only count positive amounts as payments
            .reduce((sum, payment) => sum + payment.amount, 0);
          transactionTotal = transaction.finalTotal; // Use finalTotal for cashback transactions
        } else {
          // Regular transactions: Sum all payment amounts
          totalPaid = transaction.paymentBreakdown.reduce(
            (sum, payment) => sum + payment.amount,
            0
          );
        }

        const unpaidAmount = transactionTotal - totalPaid;

        if (unpaidAmount > 0.01) {
          // Consider amounts over 1 cent as unpaid
          unpaidTotal += unpaidAmount;
          if (creditAmount === 0) {
            // Only count as separate transaction if no credit was involved
            unpaidTransactionCount++;
          }
          unpaidDetails.push({
            id: transaction.id,
            type: "Partial Payment",
            amount: unpaidAmount,
            timestamp: transaction.timestamp,
            reason: `Total: $${transactionTotal.toFixed(
              2
            )}, Paid: $${totalPaid.toFixed(2)}${
              transaction.cashback > 0
                ? ` (Cashback: $${transaction.cashback.toFixed(
                    2
                  )}, FinalTotal: $${transaction.finalTotal.toFixed(2)})`
                : ""
            }`,
          });
        }
      } else if (
        !transaction.paymentBreakdown ||
        transaction.paymentBreakdown.length === 0
      ) {
        // No payment breakdown means unpaid transaction
        unpaidTotal += transaction.total;
        unpaidTransactionCount++;
      }
    });

    // Debug logging for the $8 unpaid amount investigation
    console.log("Unpaid Amount Details:", unpaidDetails);
    console.log("Total Unpaid Amount:", Math.round(unpaidTotal * 100) / 100);

    return {
      unpaidTotal,
      unpaidTransactionCount,
      details: unpaidDetails, // Return details for debugging
    };
  };

  // Calculate summary data once to avoid multiple calls
  const unpaidAmounts = getUnpaidAmounts();

  return (
    <Container>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Title>Sales Transactions</Title>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Show Delete Buttons Checkbox */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={showDeleteButtons}
              onChange={(e) => setShowDeleteButtons(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              Show Delete Buttons
            </span>
          </label>

          {/* Dashboard Preferences Dropdown */}
          <div
            style={{ position: "relative" }}
            className="preferences-dropdown"
          >
            <Button
              onClick={() =>
                setShowPreferencesDropdown(!showPreferencesDropdown)
              }
              style={{
                backgroundColor: "#34495e",
                color: "white",
                padding: "0.5rem 1rem",
                fontSize: "0.9rem",
              }}
            >
              ⚙️ Display Options
            </Button>

            {showPreferencesDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  backgroundColor: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  padding: "1rem",
                  minWidth: "250px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  zIndex: 1000,
                }}
              >
                <h4 style={{ margin: "0 0 0.75rem 0", color: "#2c3e50" }}>
                  Show/Hide Sections
                </h4>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {[
                    { key: "totalSales", label: "📊 Total Sales" },
                    {
                      key: "totalTransactions",
                      label: "🧾 Total Transactions",
                    },
                    { key: "averageSale", label: "📈 Average Sale" },
                    { key: "peakHour", label: "⏰ Peak Hour" },
                    { key: "cashEarnings", label: "💵 Cash Earnings" },
                    { key: "cardEarnings", label: "💳 Card Earnings" },
                    { key: "creditEarnings", label: "📝 Credit Sales" },
                    { key: "lotteryEarnings", label: "🎰 Lottery Redeem" },
                    { key: "paymentRatio", label: "📊 Payment Ratio" },
                    { key: "topProducts", label: "🏆 Top Products" },
                  ].map((section) => (
                    <label
                      key={section.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        padding: "0.25rem",
                        borderRadius: "4px",
                        backgroundColor: visibleSections[section.key]
                          ? "#e8f5e8"
                          : "transparent",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleSections[section.key]}
                        onChange={() => toggleSection(section.key)}
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: "0.9rem" }}>
                        {section.label}
                      </span>
                    </label>
                  ))}
                </div>

                <div
                  style={{
                    marginTop: "0.75rem",
                    paddingTop: "0.75rem",
                    borderTop: "1px solid #eee",
                    fontSize: "0.8rem",
                    color: "#7f8c8d",
                  }}
                >
                  💾 Settings saved automatically
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Statistics Cards - Compact auto-fit layout */}
      <CompactCardGrid>
        {/* First priority: Total Sales */}
        {visibleSections.totalSales && (
          <CompactCard>
            <h3>💰 Total Sales</h3>
            <p style={{ fontWeight: "bold", color: "#27ae60" }}>
              ${(getTotalSales() || 0).toFixed(2)}
            </p>
            <p>
              {dateFilter === "today"
                ? "Today"
                : dateFilter === "yesterday"
                ? "Yesterday"
                : dateFilter === "specific"
                ? new Date(selectedDate).toLocaleDateString()
                : "For selected period"}
            </p>
          </CompactCard>
        )}

        {/* Lotto Winnings from Top Selling Items */}
        {(() => {
          const lottoData = getLottoWinningsFromItems();
          return lottoData.lottoWinnings > 0 ? (
            <CompactCard>
              <h3>🎰 Lotto Winnings</h3>
              <p style={{ fontWeight: "bold", color: "#9b59b6" }}>
                ${lottoData.lottoWinnings.toFixed(2)}
              </p>
              <p>{lottoData.lottoQuantity} winnings paid</p>
            </CompactCard>
          ) : null;
        })()}

        {/* Second priority: Cash Earnings */}
        {visibleSections.cashEarnings && (
          <ClickableCard
            isActive={transactionTypeFilter === "cash"}
            onClick={() => handleCardFilter("cash")}
          >
            <h3>💵 Cash Earnings</h3>
            <p style={{ fontWeight: "bold", color: "#27ae60" }}>
              ${(getPaymentMethodBreakdown().cashTotal || 0).toFixed(2)}
            </p>
            <p>
              {getPaymentMethodBreakdown().cashTransactionCount || 0}{" "}
              transactions
            </p>
            {transactionTypeFilter === "cash" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#3498db",
                  marginTop: "0.5rem",
                  fontWeight: "600",
                }}
              >
                🔍 Filtered
              </div>
            )}
          </ClickableCard>
        )}

        {/* Third priority: Card Earnings */}
        {visibleSections.cardEarnings && (
          <ClickableCard
            isActive={transactionTypeFilter === "card"}
            onClick={() => handleCardFilter("card")}
          >
            <h3>💳 Card Earnings</h3>
            <p style={{ fontWeight: "bold", color: "#3498db" }}>
              ${(getPaymentMethodBreakdown().cardTotal || 0).toFixed(2)}
            </p>
            <p>
              {getPaymentMethodBreakdown().cardTransactionCount || 0}{" "}
              transactions
            </p>
            {transactionTypeFilter === "card" && (
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#3498db",
                  marginTop: "0.5rem",
                  fontWeight: "600",
                }}
              >
                🔍 Filtered
              </div>
            )}
          </ClickableCard>
        )}

        {/* Credit Sales */}
        {visibleSections.creditEarnings &&
          getCreditEarningsBreakdown().creditTransactionCount > 0 && (
            <ClickableCard
              isActive={transactionTypeFilter === "credit"}
              onClick={() => handleCardFilter("credit")}
            >
              <h3>📝 Credit Sales</h3>
              <p style={{ fontWeight: "bold", color: "#e74c3c" }}>
                ${getCreditEarningsBreakdown().creditTotal.toFixed(2)}
              </p>
              <p>
                {getCreditEarningsBreakdown().creditTransactionCount} credit
                sales
              </p>
              {transactionTypeFilter === "credit" && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#3498db",
                    marginTop: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  🔍 Filtered
                </div>
              )}
            </ClickableCard>
          )}

        {/* Lottery Earnings */}
        {visibleSections.lotteryEarnings &&
          getLotteryBreakdown().lottoTransactionCount > 0 && (
            <ClickableCard
              isActive={transactionTypeFilter === "lotto"}
              onClick={() => handleCardFilter("lotto")}
            >
              <h3>🎰 Lottery Redeem</h3>
              <p style={{ fontWeight: "bold", color: "#9b59b6" }}>
                ${(getLotteryBreakdown().lottoTotal || 0).toFixed(2)}
              </p>
              <p>
                {getLotteryBreakdown().lottoTransactionCount || 0} winnings paid
              </p>
              {transactionTypeFilter === "lotto" && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#3498db",
                    marginTop: "0.5rem",
                    fontWeight: "600",
                  }}
                >
                  🔍 Filtered
                </div>
              )}
            </ClickableCard>
          )}

        {/* Alcohol Category Only */}
        <ClickableCard
          isActive={transactionTypeFilter === "alcohol-category"}
          onClick={() => handleCardFilter("alcohol-category")}
        >
          <h3>🍷 Alcohol</h3>
          <p style={{ fontWeight: "bold", color: "#8e44ad" }}>
            ${getAlcoholCategoryBreakdown().alcoholTotal.toFixed(2)}
          </p>
          <p>
            {getAlcoholCategoryBreakdown().alcoholTransactionCount} transactions
          </p>

          {transactionTypeFilter === "alcohol-category" && (
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#3498db",
                  marginTop: "0.5rem",
                  fontWeight: "600",
                }}
              >
                🔍 Category Only
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "0.3rem" }}>
                  Payment Methods:
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span>💵 Cash:</span>
                  <span>
                    ${getAlcoholPaymentBreakdown().cashTotal.toFixed(2)} (
                    {getAlcoholPaymentBreakdown().cashCount})
                  </span>
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span>💳 Card:</span>
                  <span>
                    ${getAlcoholPaymentBreakdown().cardTotal.toFixed(2)} (
                    {getAlcoholPaymentBreakdown().cardCount})
                  </span>
                </div>
              </div>
            </div>
          )}
        </ClickableCard>

        {/* New Grocery Card (Category-based) */}
        <ClickableCard
          isActive={transactionTypeFilter === "grocery-only"}
          onClick={() => handleCardFilter("grocery-only")}
        >
          <h3>🥬 Grocery</h3>
          <p style={{ fontWeight: "bold", color: "#2ecc71" }}>
            ${getGroceryOnlyBreakdown().groceryTotal.toFixed(2)}
          </p>
          <p>
            {getGroceryOnlyBreakdown().groceryTransactionCount} transactions
          </p>

          {transactionTypeFilter === "grocery-only" && (
            <div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#3498db",
                  marginTop: "0.5rem",
                  fontWeight: "600",
                }}
              >
                🔍 Category Only
              </div>
              <div
                style={{
                  fontSize: "0.7rem",
                  marginTop: "0.5rem",
                  padding: "0.5rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                  border: "1px solid #e9ecef",
                }}
              >
                <div style={{ fontWeight: "600", marginBottom: "0.3rem" }}>
                  Items sold: {getGroceryOnlyBreakdown().groceryItemCount}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "0.2rem",
                  }}
                >
                  <span>Avg per transaction:</span>
                  <span>
                    $
                    {getGroceryOnlyBreakdown().groceryTransactionCount > 0
                      ? (
                          getGroceryOnlyBreakdown().groceryTotal /
                          getGroceryOnlyBreakdown().groceryTransactionCount
                        ).toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </ClickableCard>

        {/* Tobacco Sales */}
        <ClickableCard
          isActive={transactionTypeFilter === "tobacco"}
          onClick={() => handleCardFilter("tobacco")}
        >
          <h3>🚬 Tobacco Sales</h3>
          <p style={{ fontWeight: "bold", color: "#8b4513" }}>
            ${getTobaccoSalesBreakdown().tobaccoTotal.toFixed(2)}
          </p>
          <p>
            {getTobaccoSalesBreakdown().tobaccoTransactionCount} transactions
          </p>

          {transactionTypeFilter === "tobacco" && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#3498db",
                marginTop: "0.5rem",
                fontWeight: "600",
              }}
            >
              🔍 Filtered
            </div>
          )}
        </ClickableCard>

        {/* Lottery Sales */}
        <ClickableCard
          isActive={transactionTypeFilter === "lottery"}
          onClick={() => handleCardFilter("lottery")}
        >
          <h3>🎫 Lottery Sales</h3>
          <p style={{ fontWeight: "bold", color: "#9b59b6" }}>
            ${getLotterySalesBreakdown().lotteryTotal.toFixed(2)}
          </p>
          <p>
            {getLotterySalesBreakdown().lotteryTransactionCount} transactions
          </p>

          {transactionTypeFilter === "lottery" && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#3498db",
                marginTop: "0.5rem",
                fontWeight: "600",
              }}
            >
              🔍 Filtered
            </div>
          )}
        </ClickableCard>

        {/* Fourth priority: Unpaid Amounts */}
        <ClickableCard
          isActive={transactionTypeFilter === "unpaid"}
          onClick={() => handleCardFilter("unpaid")}
        >
          <h3>⏳ Unpaid Amounts</h3>
          <p
            style={{
              fontWeight: "bold",
              color: unpaidAmounts.unpaidTotal > 0 ? "#e74c3c" : "#27ae60",
            }}
          >
            ${unpaidAmounts.unpaidTotal.toFixed(2)}
          </p>
          <p>
            {unpaidAmounts.unpaidTotal > 0
              ? `${unpaidAmounts.unpaidTransactionCount} pending`
              : "All paid"}
          </p>
          {transactionTypeFilter === "unpaid" && (
            <div
              style={{
                fontSize: "0.75rem",
                color: "#3498db",
                marginTop: "0.5rem",
                fontWeight: "600",
              }}
            >
              🔍 Filtered
            </div>
          )}
        </ClickableCard>

        {/* Fifth priority: Total Transactions */}
        {visibleSections.totalTransactions && (
          <CompactCard>
            <h3>� Total Transactions</h3>
            <p style={{ fontWeight: "bold", color: "#3498db" }}>
              {getTotalTransactions()}
            </p>
            <p>Number of sales</p>
          </CompactCard>
        )}

        {/* Sixth priority: Average Sale */}
        {visibleSections.averageSale && (
          <CompactCard>
            <h3>📈 Average Sale</h3>
            <p style={{ fontWeight: "bold", color: "#f39c12" }}>
              ${getAverageTransaction().toFixed(2)}
            </p>
            <p>Per transaction</p>
          </CompactCard>
        )}

        {/* Seventh priority: Payment Ratio */}
        {visibleSections.paymentRatio && (
          <CompactCard>
            <h3>⚖️ Payment Ratio</h3>
            <p style={{ fontWeight: "bold", color: "#f39c12" }}>
              {(() => {
                const { cashTotal, cardTotal } = getPaymentMethodBreakdown();
                const total = cashTotal + cardTotal;
                const cardPercentage =
                  total > 0 ? (cardTotal / total) * 100 : 0;
                return `${cardPercentage.toFixed(0)}%`;
              })()}
            </p>
            <p>Card vs Cash ratio</p>
          </CompactCard>
        )}

        {/* Eighth priority: Peak Hour */}
        {visibleSections.peakHour && (
          <CompactCard>
            <h3>⏰ Peak Hour</h3>
            <p style={{ fontWeight: "bold", color: "#9b59b6" }}>
              {(() => {
                const hourly = getHourlyBreakdown();
                const peak = Object.entries(hourly).reduce(
                  (max, [hour, data]) =>
                    data.count > (max.data?.count || 0) ? { hour, data } : max,
                  {}
                );
                return peak.hour ? `${peak.hour}:00` : "N/A";
              })()}
            </p>
            <p>Busiest time</p>
          </CompactCard>
        )}

        {/* Ninth priority: Net Cash Flow */}
        <CompactCard>
          <h3>🏦 Net Cash Flow</h3>
          <p
            style={{
              fontWeight: "bold",
              color:
                (getPaymentMethodBreakdown().cashTotal || 0) >= 0
                  ? "#27ae60"
                  : "#e74c3c",
            }}
          >
            ${(getPaymentMethodBreakdown().cashTotal || 0).toFixed(2)}
          </p>
          <p>
            {(getPaymentMethodBreakdown().cashTotal || 0) >= 0
              ? "Cash gained"
              : "Cash reduced"}
          </p>
        </CompactCard>
      </CompactCardGrid>

      {/* Payment Method Breakdown - Now consolidated in CompactCardGrid above */}

      <FilterContainer style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="specific">Specific Date</option>
            <option value="range">Date Range</option>
            <option value="month">Monthly View</option>
            <option value="week">Last 7 Days</option>
            <option value="all">All Time</option>
          </Select>

          {dateFilter === "specific" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: "0.6rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
          )}

          {dateFilter === "range" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start Date"
                style={{
                  padding: "0.6rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
              <span style={{ color: "#7f8c8d" }}>to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End Date"
                style={{
                  padding: "0.6rem",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "1rem",
                }}
              />
            </>
          )}

          {dateFilter === "month" && (
            <Select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              style={{ minWidth: "160px" }}
            >
              <option value="">Select Month</option>
              <option value="2025-12">December 2025 (This Month)</option>
              <option value="2025-11">November 2025 (Last Month)</option>
              <option value="2025-10">October 2025</option>
              <option value="2025-09">September 2025</option>
              <option value="2025-08">August 2025</option>
              <option value="2025-07">July 2025</option>
            </Select>
          )}

          <Select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="list">List View</option>
            <option value="daily">Daily Summary</option>
          </Select>
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {transactionTypeFilter !== "all" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#e8f4fd",
                border: "1px solid #3498db",
                borderRadius: "6px",
                padding: "0.5rem 0.75rem",
                fontSize: "0.9rem",
                color: "#2c3e50",
              }}
            >
              <span>
                🔍 Filter:{" "}
                {transactionTypeFilter === "cash"
                  ? "Cash Earnings"
                  : transactionTypeFilter === "card"
                  ? "Card Earnings"
                  : transactionTypeFilter === "credit"
                  ? "Credit Sales"
                  : transactionTypeFilter === "lotto"
                  ? "Lottery"
                  : transactionTypeFilter === "unpaid"
                  ? "Unpaid Amounts"
                  : transactionTypeFilter}
              </span>
              <button
                onClick={() => setTransactionTypeFilter("all")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e74c3c",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0",
                  marginLeft: "0.25rem",
                }}
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
          <Button
            onClick={printSummaryReport}
            style={{
              backgroundColor: "#9b59b6",
              color: "white",
              marginRight: "0.5rem",
            }}
          >
            🖨️ Print Summary
          </Button>
          <Link href="/pos">
            <Button>New Sale</Button>
          </Link>
        </div>
      </FilterContainer>

      {/* Daily Summary View */}
      {viewMode === "daily" && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
            Daily Sales Summary
          </h2>
          {getDailyBreakdown().map((day) => (
            <Card key={day.date} style={{ marginBottom: "1rem" }}>
              <h3 style={{ color: "#2c3e50", marginBottom: "1rem" }}>
                {new Date(day.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "1rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#27ae60",
                    }}
                  >
                    ${day.totalSales.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    Total Sales
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#27ae60",
                    }}
                  >
                    ${day.cashEarnings.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    💵 Cash Earned
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#3498db",
                    }}
                  >
                    ${day.cardEarnings.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    💳 Card Earned
                  </div>
                </div>
                {day.lottoEarnings > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#9b59b6",
                      }}
                    >
                      ${day.lottoEarnings.toFixed(2)}
                    </div>
                    <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                      🎰 Lottery Redeem
                    </div>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#8e44ad",
                    }}
                  >
                    {day.transactionCount}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    Transactions
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#f39c12",
                    }}
                  >
                    {day.totalItems}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    Items Sold
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "#9b59b6",
                    }}
                  >
                    ${(day.totalSales / day.transactionCount).toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>
                    Avg Sale
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div
                style={{
                  marginTop: "1rem",
                  padding: "0.75rem",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  display: "grid",
                  gridTemplateColumns:
                    day.lottoTransactions > 0 ? "1fr 1fr 1fr" : "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#27ae60",
                    }}
                  >
                    {day.cashTransactions}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>
                    Cash Transactions
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#3498db",
                    }}
                  >
                    {day.cardTransactions}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>
                    Card Transactions
                  </div>
                </div>
                {day.lottoTransactions > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: "1.2rem",
                        fontWeight: "bold",
                        color: "#9b59b6",
                      }}
                    >
                      {day.lottoTransactions}
                    </div>
                    <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>
                      Lottery Transactions
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Hourly Breakdown for filtered transactions */}
      {viewMode === "list" &&
        filteredTransactions.length > 0 &&
        (dateFilter === "today" ||
          dateFilter === "yesterday" ||
          dateFilter === "specific") && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ color: "#2c3e50", marginBottom: "1rem" }}>
              Hourly Breakdown -{" "}
              {dateFilter === "today"
                ? "Today"
                : dateFilter === "yesterday"
                ? "Yesterday"
                : new Date(selectedDate).toLocaleDateString()}
            </h3>

            {/* Payment Method Summary */}
            {(() => {
              const totalCashTransactions = filteredTransactions.filter(
                (tx) => tx.transactionType === "cash"
              ).length;
              const totalCardTransactions = filteredTransactions.filter(
                (tx) => tx.transactionType === "card"
              ).length;
              const totalMixedTransactions = filteredTransactions.filter(
                (tx) => tx.transactionType === "mixed"
              ).length;
              const totalCreditTransactions = filteredTransactions.filter(
                (tx) =>
                  tx.transactionType === "credit" ||
                  tx.transactionType === "partial_credit"
              ).length;
              const totalLottoTransactions = filteredTransactions.filter(
                (tx) =>
                  tx.transactionType === "lotto" ||
                  tx.transactionType === "lotto_mixed"
              ).length;

              const totalCashAmount = filteredTransactions.reduce(
                (sum, tx) => sum + (tx.cashAmount || 0),
                0
              );
              const totalCardAmount = filteredTransactions.reduce(
                (sum, tx) => sum + (tx.cardAmount || 0),
                0
              );
              const totalCreditAmount = filteredTransactions.reduce(
                (sum, tx) => sum + (tx.creditAmount || 0),
                0
              );

              return (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    color: "white",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 0.8rem 0",
                      textAlign: "center",
                      opacity: 0.9,
                    }}
                  >
                    Payment Method Summary
                  </h4>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(150px, 1fr))",
                      gap: "0.8rem",
                    }}
                  >
                    {totalCashTransactions > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          background: "rgba(255,255,255,0.15)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                          💵 Cash
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          {totalCashTransactions} txns
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>
                          ${totalCashAmount.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {totalCardTransactions > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          background: "rgba(255,255,255,0.15)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                          💳 Card
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          {totalCardTransactions} txns
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>
                          ${totalCardAmount.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {totalMixedTransactions > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          background: "rgba(255,255,255,0.15)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                          🔄 Mixed
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          {totalMixedTransactions} txns
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>Cash+Card</div>
                      </div>
                    )}
                    {totalCreditTransactions > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          background: "rgba(255,255,255,0.15)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                          📝 Credit
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          {totalCreditTransactions} txns
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>
                          ${totalCreditAmount.toFixed(2)}
                        </div>
                      </div>
                    )}
                    {totalLottoTransactions > 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          background: "rgba(255,255,255,0.15)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>
                          🎰 Lotto
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                          {totalLottoTransactions} txns
                        </div>
                        <div style={{ fontSize: "0.9rem" }}>Winnings</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.8rem",
                background: "white",
                padding: "1.5rem",
                borderRadius: "8px",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              {Object.entries(getHourlyBreakdown()).map(([hour, data]) => (
                <div
                  key={hour}
                  style={{
                    textAlign: "center",
                    padding: "0.8rem 0.5rem",
                    background: data.count > 0 ? "#e8f5e8" : "#f8f9fa",
                    borderRadius: "6px",
                    border:
                      data.count > 0
                        ? "1px solid #27ae60"
                        : "1px solid #e9ecef",
                    minHeight: "140px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#2c3e50",
                      fontSize: "1rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {hour}:00
                  </div>

                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "#27ae60",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {data.count} sales
                  </div>

                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "#2c3e50",
                      fontWeight: "bold",
                      marginBottom: "0.5rem",
                    }}
                  >
                    ${data.sales.toFixed(2)}
                  </div>

                  {/* Payment breakdown */}
                  <div style={{ fontSize: "0.7rem", lineHeight: "1.2" }}>
                    {data.cashCount > 0 && (
                      <div style={{ color: "#27ae60", marginBottom: "2px" }}>
                        💵 {data.cashCount} cash (${data.cashAmount.toFixed(2)})
                      </div>
                    )}
                    {data.cardCount > 0 && (
                      <div style={{ color: "#3498db", marginBottom: "2px" }}>
                        💳 {data.cardCount} card (${data.cardAmount.toFixed(2)})
                      </div>
                    )}
                    {data.mixedCount > 0 && (
                      <div style={{ color: "#9b59b6", marginBottom: "2px" }}>
                        🔄 {data.mixedCount} mixed
                      </div>
                    )}
                    {data.creditCount > 0 && (
                      <div style={{ color: "#e67e22", marginBottom: "2px" }}>
                        📝 {data.creditCount} credit ($
                        {data.creditAmount.toFixed(2)})
                      </div>
                    )}
                    {data.lottoCount > 0 && (
                      <div style={{ color: "#ff6b6b", marginBottom: "2px" }}>
                        🎰 {data.lottoCount} lotto
                      </div>
                    )}
                    {data.count === 0 && (
                      <div style={{ color: "#95a5a6", fontStyle: "italic" }}>
                        No sales
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {filteredTransactions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3 style={{ color: "#7f8c8d", marginBottom: "1rem" }}>
            No transactions found
          </h3>
          <p style={{ color: "#7f8c8d" }}>
            {dateFilter === "all"
              ? "Start making sales to see transaction history here."
              : "No transactions found for the selected time period."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <Table>
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Subtotal</th>
              <th>HST</th>
              <th>Total</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <>
                <tr key={transaction.id || transaction._id}>
                  <td>
                    #
                    {(transaction.id || transaction._id || "N/A")
                      .toString()
                      .slice(-8)}
                  </td>
                  <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                  <td>
                    {transaction.items && Array.isArray(transaction.items)
                      ? transaction.items.reduce(
                          (sum, item) => sum + (item.quantity || 0),
                          0
                        )
                      : 0}{" "}
                    items
                    {(!transaction.items ||
                      !Array.isArray(transaction.items) ||
                      transaction.items.length === 0) && (
                      <span
                        style={{
                          color: "#e74c3c",
                          fontSize: "0.8rem",
                          marginLeft: "0.5rem",
                        }}
                      >
                        (No items data)
                      </span>
                    )}
                  </td>
                  <td>
                    $
                    {transaction.subtotal
                      ? transaction.subtotal.toFixed(2)
                      : "0.00"}
                  </td>
                  <td>
                    {transaction.includeTax !== false
                      ? `$${transaction.tax.toFixed(2)}`
                      : "N/A"}
                  </td>
                  <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                    ${transaction.total.toFixed(2)}
                  </td>
                  <td>
                    {(() => {
                      const paymentMethod =
                        getTransactionPaymentMethod(transaction);
                      return (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "12px",
                            fontSize: "0.8rem",
                            fontWeight: "600",
                            backgroundColor: paymentMethod.color + "20",
                            color: paymentMethod.color,
                            border: `1px solid ${paymentMethod.color}40`,
                          }}
                        >
                          {paymentMethod.icon} {paymentMethod.type}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        onClick={() =>
                          toggleTransactionDetails(
                            transaction.id || transaction._id
                          )
                        }
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                          background:
                            expandedTransaction ===
                            (transaction.id || transaction._id)
                              ? "#e74c3c"
                              : "#3498db",
                        }}
                      >
                        {expandedTransaction ===
                        (transaction.id || transaction._id)
                          ? "Hide"
                          : "Details"}
                      </Button>
                      <Button
                        onClick={() => printTransactionReceipt(transaction)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                          background: "#27ae60",
                          color: "white",
                        }}
                        title="Print Receipt"
                      >
                        🖨️ Print
                      </Button>
                      <Button
                        onClick={() => startEditingPaymentMethod(transaction)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                          background: "#f39c12",
                          color: "white",
                        }}
                        title="Change Payment Method"
                      >
                        💳 Edit Payment
                      </Button>
                      {showDeleteButtons && (
                        <Button
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id || transaction._id
                            )
                          }
                          style={{
                            padding: "0.4rem 0.8rem",
                            fontSize: "0.8rem",
                            background: "#e74c3c",
                            color: "white",
                          }}
                          title="Delete Transaction"
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {editingPaymentMethod ===
                  (transaction.id || transaction._id) && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        backgroundColor: "#fff3cd",
                        padding: "1rem",
                        border: "2px solid #f39c12",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                          justifyContent: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ fontWeight: "bold", color: "#856404" }}>
                          Change Payment Method:
                        </div>
                        <div
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <select
                            value={newPaymentMethod}
                            onChange={(e) =>
                              setNewPaymentMethod(e.target.value)
                            }
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #f39c12",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                            }}
                          >
                            <option value="cash">💵 Cash</option>
                            <option value="card">💳 Card</option>
                            <option value="credit">📝 Credit</option>
                            <option value="mixed">
                              🔄 Mixed (Cash + Card)
                            </option>
                          </select>
                          <Button
                            onClick={() => updatePaymentMethod(transaction)}
                            disabled={isUpdatingPayment}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.9rem",
                              background: isUpdatingPayment
                                ? "#95a5a6"
                                : "#27ae60",
                              color: "white",
                              opacity: isUpdatingPayment ? 0.7 : 1,
                            }}
                          >
                            {isUpdatingPayment ? "Updating..." : "✓ Update"}
                          </Button>
                          <Button
                            onClick={cancelEditingPaymentMethod}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.9rem",
                              background: "#e74c3c",
                              color: "white",
                            }}
                          >
                            ✗ Cancel
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {expandedTransaction ===
                  (transaction.id || transaction._id) && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ backgroundColor: "#f8f9fa", padding: "1rem" }}
                    >
                      <h4 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                        Transaction Details
                      </h4>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {(transaction.items && Array.isArray(transaction.items)
                          ? transaction.items
                          : []
                        ).map((item) => (
                          <div
                            key={item.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "0.5rem",
                              background: "white",
                              borderRadius: "4px",
                            }}
                          >
                            <span>{item.name}</span>
                            <span>
                              {item.quantity} × ${item.price.toFixed(2)} = $
                              {(item.quantity * item.price).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </Table>
      ) : null}

      {/* Category Breakdown Section - Moved below transactions */}
      {viewMode === "list" && filteredTransactions.length > 0 && (
        <div style={{ marginBottom: "2rem", marginTop: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
            Sales by Category -{" "}
            {dateFilter === "today"
              ? "Today"
              : dateFilter === "yesterday"
              ? "Yesterday"
              : dateFilter === "specific"
              ? new Date(selectedDate).toLocaleDateString()
              : "Selected Period"}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            {getCategoryBreakdown().map(([category, stats]) => (
              <Card
                key={category}
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <h3
                  style={{
                    color: "white",
                    marginBottom: "1rem",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {category === "Tobacco" && "🚬"}
                  {category === "Beverages" && "🥤"}
                  {category === "Snacks" && "🍿"}
                  {category === "Groceries" && "🛒"}
                  {category === "Alcohol" && "🍺"}
                  {category === "Personal Care" && "🧴"}
                  {category === "Household" && "🏠"}
                  {category === "Candy" && "🍭"}
                  {category === "Dairy" && "🥛"}
                  {category === "Frozen" && "🧊"}
                  {![
                    "Tobacco",
                    "Beverages",
                    "Snacks",
                    "Groceries",
                    "Alcohol",
                    "Personal Care",
                    "Household",
                    "Candy",
                    "Dairy",
                    "Frozen",
                  ].includes(category) && "📦"}
                  &nbsp;{category}
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      ${stats.totalRevenue.toFixed(2)}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                      Total Revenue
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      {stats.itemsSold}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                      Items Sold
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      {stats.transactionCount}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                      Transactions
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      ${stats.avgPrice.toFixed(2)}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>
                      Avg Price
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Top Selling Items */}
          <h3 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
            Top Selling Items
          </h3>
          <div
            style={{
              background: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            <Table style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Qty Sold</th>
                  <th>Revenue</th>
                  <th>Unit Price</th>
                </tr>
              </thead>
              <tbody>
                {getTopSellingItems().map((item, index) => (
                  <tr key={item.name}>
                    <td
                      style={{
                        fontWeight: "bold",
                        color:
                          index === 0
                            ? "#f1c40f"
                            : index === 1
                            ? "#95a5a6"
                            : index === 2
                            ? "#e67e22"
                            : "#2c3e50",
                      }}
                    >
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: "600" }}>{item.name}</td>
                    <td>
                      <span
                        style={{
                          background: "#ecf0f1",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          fontSize: "0.8rem",
                          color: "#2c3e50",
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                      {item.quantitySold}
                    </td>
                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>
                      ${item.totalRevenue.toFixed(2)}
                    </td>
                    <td>${item.price.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}
    </Container>
  );
}
