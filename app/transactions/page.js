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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem 0;
  margin-bottom: 2rem;
`;

// Compact card component
const CompactCard = styled(Card)`
  padding: 1.2rem;
  min-width: 200px;
  
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
  border: 2px solid ${props => props.isActive ? '#3498db' : 'transparent'};
  background: ${props => props.isActive ? '#e8f4fd' : 'white'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
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
      router.push('/pos');
    }
  }, [user, router]);
  const [dateFilter, setDateFilter] = useState("today");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState("list"); // "list" or "daily"
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all"); // "all", "cash", "card", "credit", "lotto", "unpaid"
  
  // Payment method editing state
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
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
    topProducts: true
  });
  const [showPreferencesDropdown, setShowPreferencesDropdown] = useState(false);
  const [showDeleteButtons, setShowDeleteButtons] = useState(false);

  // Load dashboard preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch('/api/dashboard-preferences');
        const data = await res.json();
        if (data.visibleSections) {
          setVisibleSections(data.visibleSections);
        }
      } catch (error) {
        console.error('Failed to load dashboard preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.preferences-dropdown')) {
        setShowPreferencesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Save dashboard preferences
  const savePreferences = async (newVisibleSections) => {
    try {
      await fetch('/api/dashboard-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ visibleSections: newVisibleSections }),
      });
    } catch (error) {
      console.error('Failed to save dashboard preferences:', error);
    }
  };

  // Toggle section visibility
  const toggleSection = (sectionKey) => {
    const newVisibleSections = {
      ...visibleSections,
      [sectionKey]: !visibleSections[sectionKey]
    };
    setVisibleSections(newVisibleSections);
    savePreferences(newVisibleSections);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPreferencesDropdown && !event.target.closest('.preferences-dropdown')) {
        setShowPreferencesDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPreferencesDropdown]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/transaction");
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        
        // Debug: Log transaction data to identify the issue
        console.log('Loaded transactions:', list.length);
        list.forEach((tx, index) => {
          const shortId = (tx.id || tx._id || '').toString().slice(-8);
          if (shortId === '4cefa6aa') {
            console.log('🔍 Found transaction #4cefa6aa:', {
              id: tx.id,
              _id: tx._id,
              items: tx.items,
              itemsIsArray: Array.isArray(tx.items),
              itemsLength: tx.items ? tx.items.length : 'N/A',
              total: tx.total,
              subtotal: tx.subtotal
            });
          }
        });
        
        setTransactions(list.reverse());
        setFilteredTransactions(list.reverse());
      } catch (err) {
        console.error("Failed to load transactions from server", err);
        const savedTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        
        // Debug localStorage transactions too
        console.log('Loaded from localStorage:', savedTransactions.length);
        savedTransactions.forEach((tx, index) => {
          const shortId = (tx.id || tx._id || '').toString().slice(-8);
          if (shortId === '4cefa6aa') {
            console.log('🔍 Found localStorage transaction #4cefa6aa:', {
              id: tx.id,
              _id: tx._id,
              items: tx.items,
              itemsIsArray: Array.isArray(tx.items),
              itemsLength: tx.items ? tx.items.length : 'N/A',
              total: tx.total,
              subtotal: tx.subtotal
            });
          }
        });
        
        setTransactions(savedTransactions.reverse());
        setFilteredTransactions(savedTransactions.reverse());
      }
    };
    load();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [dateFilter, selectedDate, transactions, transactionTypeFilter]);

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
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/transaction/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-secret'
        }
      });

      if (response.ok) {
        // Refresh transactions list by calling the load function from useEffect
        const res = await fetch('/api/transaction');
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setTransactions(list.reverse());
        setFilteredTransactions(list.reverse());
        alert('Transaction deleted successfully');
      } else {
        const error = await response.json();
        alert(`Failed to delete transaction: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    // First, filter by date
    if (dateFilter === "today") {
      const today = new Date().toDateString();
      filtered = transactions.filter(
        (t) => new Date(t.timestamp).toDateString() === today
      );
    } else if (dateFilter === "yesterday") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      filtered = transactions.filter(
        (t) => new Date(t.timestamp).toDateString() === yesterday.toDateString()
      );
    } else if (dateFilter === "specific") {
      const selectedDay = new Date(selectedDate).toDateString();
      filtered = transactions.filter(
        (t) => new Date(t.timestamp).toDateString() === selectedDay
      );
    } else if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = transactions.filter((t) => new Date(t.timestamp) >= weekAgo);
    } else if (dateFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = transactions.filter((t) => new Date(t.timestamp) >= monthAgo);
    }

    // Then, filter by transaction type
    if (transactionTypeFilter !== "all") {
      if (transactionTypeFilter === "unpaid") {
        filtered = filtered.filter(t => 
          (t.isCreditSale && t.creditStatus === 'unpaid') ||
          (t.isPartialPayment && t.creditBalance > 0)
        );
      } else {
        filtered = filtered.filter(t => t.transactionType === transactionTypeFilter);
      }
    }

    setFilteredTransactions(filtered);
  };

  const getTotalSales = () => {
    const { cashTotal, cardTotal } = getPaymentMethodBreakdown();
    const { lottoWinnings } = getLottoWinningsFromItems();
    
    // Total sales = Cash earnings + Card earnings + Lotto winnings (69+190.25+133.89)
    return cashTotal + cardTotal + lottoWinnings;
  };

  const getTotalTransactions = () => {
    return filteredTransactions.length;
  };

  // Get lotto winnings from top selling items (only 'Lotto Winnings' item)
  const getLottoWinningsFromItems = () => {
    const topItems = getTopSellingItems();
    let lottoWinnings = 0;
    let lottoQuantity = 0;

    topItems.forEach(item => {
      if (item.name === 'Lotto Winnings') {
        lottoWinnings += Math.abs(item.totalRevenue);
        lottoQuantity += item.quantitySold;
      }
    });

    return { lottoWinnings, lottoQuantity };
  };

  const getAverageTransaction = () => {
    if (filteredTransactions.length === 0) return 0;
    return getTotalSales() / getTotalTransactions();
  };

  const getTransactionPaymentMethod = (transaction) => {
    // Check if transaction has enhanced payment type fields (new format)
    if (transaction.transactionType) {
      switch (transaction.transactionType) {
        case 'cash': return { type: 'Cash', icon: '💵', color: '#27ae60' };
        case 'card': return { type: 'Card', icon: '💳', color: '#3498db' };
        case 'mixed': return { type: 'Mixed', icon: '🔄', color: '#f39c12' };
        case 'credit': return { type: 'Credit', icon: '📝', color: '#e74c3c' };
        case 'lotto': return { type: 'Lotto', icon: '🎰', color: '#9b59b6' };
        case 'lotto_mixed': return { type: 'Lotto+Payment', icon: '🎰💳', color: '#8e44ad' };
        default: return { type: 'Unknown', icon: '❓', color: '#95a5a6' };
      }
    }

    // Fallback to legacy paymentBreakdown analysis
    if (transaction.paymentBreakdown && Array.isArray(transaction.paymentBreakdown)) {
      let hasCash = false;
      let hasCard = false;
      let hasCredit = false;

      transaction.paymentBreakdown.forEach(payment => {
        if (payment.method === 'cash' && payment.amount > 0) hasCash = true;
        else if (payment.method === 'card' && payment.amount > 0) hasCard = true;
        else if (payment.method === 'credit' && payment.amount > 0) hasCredit = true;
      });

      if (hasCredit) return { type: 'Credit', icon: '📝', color: '#e74c3c' };
      else if (hasCash && hasCard) return { type: 'Mixed', icon: '🔄', color: '#f39c12' };
      else if (hasCard) return { type: 'Card', icon: '💳', color: '#3498db' };
      else if (hasCash) return { type: 'Cash', icon: '💵', color: '#27ae60' };
    }

    return { type: 'Unknown', icon: '❓', color: '#95a5a6' };
  };



  const getDailyBreakdown = () => {
    const breakdown = {};
    transactions.forEach(transaction => {
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
          lottoTransactions: 0
        };
      }
      breakdown[date].transactions.push(transaction);
      breakdown[date].totalItems += (transaction.items && Array.isArray(transaction.items)) 
        ? transaction.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
        : 0;
      breakdown[date].transactionCount++;

      // Handle lottery transactions separately
      if (transaction.transactionType === 'lotto' || transaction.transactionType === 'lotto_mixed') {
        breakdown[date].lottoEarnings += Math.abs(transaction.total); // Positive earnings for lottery redeem
        breakdown[date].cashEarnings -= Math.abs(transaction.total); // Reduce cash (money going out)
        breakdown[date].lottoTransactions++;
      }
      
      // Calculate cash and card earnings for this day (excluding lotto transactions)
      else if (transaction.paymentBreakdown && Array.isArray(transaction.paymentBreakdown)) {
        let hasCash = false;
        let hasCard = false;
        
        transaction.paymentBreakdown.forEach(payment => {
          if (payment.method === 'cash') {
            breakdown[date].cashEarnings += payment.amount;
            hasCash = true;
          } else if (payment.method === 'card') {
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
            .filter(p => p.method === 'cash' && p.amount > 0)
            .reduce((sum, p) => sum + p.amount, 0);
          const cardAmount = transaction.paymentBreakdown
            .filter(p => p.method === 'card')
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
    Object.values(breakdown).forEach(day => {
      day.totalSales = day.cashEarnings + day.cardEarnings + day.lottoEarnings;
    });
    
    return Object.values(breakdown).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getHourlyBreakdown = () => {
    const hourly = {};
    filteredTransactions.forEach(transaction => {
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
          creditAmount: 0
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
      if (transactionType === 'cash') {
        hourly[hour].cashCount++;
      } else if (transactionType === 'card') {
        hourly[hour].cardCount++;
      } else if (transactionType === 'mixed') {
        hourly[hour].mixedCount++;
      } else if (transactionType === 'credit' || transactionType === 'partial_credit') {
        hourly[hour].creditCount++;
      } else if (transactionType === 'lotto' || transactionType === 'lotto_mixed') {
        hourly[hour].lottoCount++;
      } else {
        // Fallback for older transactions without transactionType field
        const paymentBreakdown = transaction.paymentBreakdown || [];
        let fallbackCashAmount = 0;
        let fallbackCardAmount = 0;
        let fallbackCreditAmount = 0;
        
        paymentBreakdown.forEach(payment => {
          const amount = Number(payment.amount || 0);
          switch (payment.method?.toLowerCase()) {
            case 'cash':
              fallbackCashAmount += amount;
              break;
            case 'card':
              fallbackCardAmount += amount;
              break;
            case 'credit':
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
    
    filteredTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const category = item.category || 'Uncategorized';
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            itemsSold: 0,
            totalRevenue: 0,
            transactionCount: 0,
            avgPrice: 0
          };
        }
        
        categoryStats[category].itemsSold += item.quantity;
        categoryStats[category].totalRevenue += (item.price * item.quantity);
        });
      }
    });
    
    // Calculate transaction count and average price for each category
    Object.keys(categoryStats).forEach(category => {
      const transactionCount = filteredTransactions.filter(transaction =>
        transaction.items && Array.isArray(transaction.items) && 
        transaction.items.some(item => (item.category || 'Uncategorized') === category)
      ).length;
      
      categoryStats[category].transactionCount = transactionCount;
      categoryStats[category].avgPrice = categoryStats[category].itemsSold > 0 
        ? categoryStats[category].totalRevenue / categoryStats[category].itemsSold 
        : 0;
    });
    
    return Object.entries(categoryStats)
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .slice(0, 10); // Top 10 categories
  };

  const getTopSellingItems = () => {
    const itemStats = {};
    
    filteredTransactions.forEach(transaction => {
      if (transaction.items && Array.isArray(transaction.items)) {
        transaction.items.forEach(item => {
          const itemKey = item.name;
        
        if (!itemStats[itemKey]) {
          itemStats[itemKey] = {
            name: item.name,
            category: item.category || 'Uncategorized',
            quantitySold: 0,
            totalRevenue: 0,
            price: item.price
          };
        }
        
        itemStats[itemKey].quantitySold += item.quantity;
        itemStats[itemKey].totalRevenue += (item.price * item.quantity);
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
    if (currentMethod.type === 'Cash') {
      setNewPaymentMethod('cash');
    } else if (currentMethod.type === 'Card') {
      setNewPaymentMethod('card');
    } else if (currentMethod.type === 'Credit') {
      setNewPaymentMethod('credit');
    } else if (currentMethod.type === 'Mixed') {
      setNewPaymentMethod('mixed');
    } else {
      setNewPaymentMethod('cash'); // Default fallback
    }
  };

  const cancelEditingPaymentMethod = () => {
    setEditingPaymentMethod(null);
    setNewPaymentMethod('');
  };

  const updatePaymentMethod = async (transaction) => {
    if (!newPaymentMethod || isUpdatingPayment) return;
    
    setIsUpdatingPayment(true);
    
    try {
      const transactionId = transaction.id || transaction._id;
      
      // Prepare update data based on new payment method
      const updateData = {
        transactionType: newPaymentMethod
      };

      // Update amounts based on payment method
      const total = transaction.total;
      
      if (newPaymentMethod === 'cash') {
        updateData.cashAmount = total;
        updateData.cardAmount = 0;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (transaction.transactionType === 'credit' || transaction.creditAmount > 0) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [{ method: 'cash', amount: total }];
      } else if (newPaymentMethod === 'card') {
        updateData.cashAmount = 0;
        updateData.cardAmount = total;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (transaction.transactionType === 'credit' || transaction.creditAmount > 0) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [{ method: 'card', amount: total }];
      } else if (newPaymentMethod === 'credit') {
        updateData.cashAmount = 0;
        updateData.cardAmount = 0;
        updateData.creditAmount = total;
        updateData.paymentBreakdown = [{ method: 'credit', amount: total }];
      } else if (newPaymentMethod === 'mixed') {
        // For mixed, split evenly between cash and card
        const halfAmount = total / 2;
        updateData.cashAmount = halfAmount;
        updateData.cardAmount = halfAmount;
        // Only clear creditAmount if we're changing FROM credit to another method
        if (transaction.transactionType === 'credit' || transaction.creditAmount > 0) {
          updateData.creditAmount = 0;
        }
        updateData.paymentBreakdown = [
          { method: 'cash', amount: halfAmount },
          { method: 'card', amount: halfAmount }
        ];
        updateData.transactionType = 'mixed';
      }

      console.log('Sending PUT request to:', `/api/transaction/${transactionId}`);
      console.log('Update data:', updateData);
      
      const response = await fetch(`/api/transaction/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-secret',
        },
        body: JSON.stringify(updateData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const result = await response.json();
      console.log('Response result:', result);

      if (response.ok && result.success) {
        // Update local state
        const updatedTransactions = transactions.map(t => 
          (t.id || t._id) === transactionId 
            ? { ...t, ...updateData }
            : t
        );
        const updatedFilteredTransactions = filteredTransactions.map(t => 
          (t.id || t._id) === transactionId 
            ? { ...t, ...updateData }
            : t
        );
        
        setTransactions(updatedTransactions);
        setFilteredTransactions(updatedFilteredTransactions);
        
        // Reset editing state
        setEditingPaymentMethod(null);
        setNewPaymentMethod('');
        
        alert(`Payment method updated successfully to ${newPaymentMethod.toUpperCase()}`);
      } else {
        throw new Error(result.message || 'Failed to update payment method');
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
      alert(`Error updating payment method: ${error.message}`);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const printTransactionReceipt = (transaction) => {
    if (!transaction) return;
    
    const printWindow = window.open('', '_blank');
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - Transaction #${(transaction.id || transaction._id || 'N/A').toString().slice(-8)}</title>
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
            <div>Transaction #${(transaction.id || transaction._id || 'N/A').toString().slice(-8)}</div>
            <div>${new Date(transaction.timestamp).toLocaleString()}</div>
          </div>
          
          <hr>
          
          ${(transaction.items && Array.isArray(transaction.items) ? transaction.items : []).map(item => `
            <div class="receipt-item">
              <div>${item.name} ${!item.taxable ? '(No HST)' : ''}</div>
            </div>
            <div class="receipt-item">
              <div>${item.quantity} x $${item.price.toFixed(2)}</div>
              <div>$${(item.quantity * item.price).toFixed(2)}</div>
            </div>
          `).join('')}
          
          <hr>
          
          <div class="receipt-totals">
            ${transaction.taxableAmount > 0 && transaction.nonTaxableAmount > 0 ? `
              <div class="receipt-item">
                <span>Taxable Items:</span>
                <span>$${transaction.taxableAmount.toFixed(2)}</span>
              </div>
              <div class="receipt-item">
                <span>Non-Taxable Items:</span>
                <span>$${transaction.nonTaxableAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div class="receipt-item">
              <span>Subtotal:</span>
              <span>$${transaction.subtotal.toFixed(2)}</span>
            </div>
            
            ${transaction.includeTax !== false && transaction.tax > 0 ? `
              <div class="receipt-item">
                <span>HST (13%):</span>
                <span>$${transaction.tax.toFixed(2)}</span>
              </div>
            ` : ''}
            
            <div class="receipt-item total">
              <span>Total:</span>
              <span>$${transaction.total.toFixed(2)}</span>
            </div>
            
            ${transaction.cashback && transaction.cashback > 0 ? `
              <div class="receipt-item" style="font-weight: bold; color: #e67e22;">
                <span>Cashback:</span>
                <span>$${transaction.cashback.toFixed(2)}</span>
              </div>
            ` : ''}
            
            ${transaction.paymentBreakdown && transaction.paymentBreakdown.length > 0 ? `
              <hr>
              <div style="font-weight: bold; margin-bottom: 5px;">Payments</div>
              ${transaction.paymentBreakdown.map(p => `
                <div class="receipt-item">
                  <span>${p.method.toUpperCase()}:</span>
                  <span>$${p.amount.toFixed(2)}</span>
                </div>
              `).join('')}
              ${transaction.change && transaction.change > 0 ? `
                <div class="receipt-item">
                  <span>Change:</span>
                  <span>$${transaction.change.toFixed(2)}</span>
                </div>
              ` : ''}
            ` : ''}
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

  const getLotteryBreakdown = () => {
    let lottoTotal = 0;
    let lottoTransactionCount = 0;

    filteredTransactions.forEach(transaction => {
      if (transaction.transactionType === 'lotto' || transaction.transactionType === 'lotto_mixed') {
        lottoTotal += Math.abs(transaction.total); // Take absolute value since lotto winnings are positive sales
        lottoTransactionCount++;
      }
    });

    return { lottoTotal, lottoTransactionCount };
  };

  const getPaymentMethodBreakdown = () => {
    let cashTotal = 0;
    let cardTotal = 0;
    let cashTransactionCount = 0;
    let cardTransactionCount = 0;

    filteredTransactions.forEach(transaction => {
      // Handle lottery transactions - they reduce cash but don't count as regular cash transactions
      if (transaction.transactionType === 'lotto' || transaction.transactionType === 'lotto_mixed') {
        // Lottery winnings reduce cash (negative impact on cash flow)
        cashTotal -= Math.abs(transaction.total);
        return;
      }

      if (transaction.paymentBreakdown && Array.isArray(transaction.paymentBreakdown)) {
        transaction.paymentBreakdown.forEach(payment => {
          if (payment.method === 'cash') {
            // Handle negative cash amounts (cashback transactions)
            if (payment.amount >= 0) {
              cashTotal += payment.amount;
            } else {
              cashTotal += payment.amount; // Keep negative for cashback
            }
          } else if (payment.method === 'card') {
            cardTotal += payment.amount;
          }
        });

        // Add credit card fees to card earnings (these are business earnings)
        if (transaction.creditCardCharge && transaction.creditCardCharge > 0) {
          cardTotal += transaction.creditCardCharge;
        }

        // Count transactions by primary payment method
        const hasCash = transaction.paymentBreakdown.some(p => p.method === 'cash' && p.amount > 0);
        const hasCard = transaction.paymentBreakdown.some(p => p.method === 'card' && p.amount > 0);
        
        if (hasCash && !hasCard) cashTransactionCount++;
        else if (hasCard && !hasCash) cardTransactionCount++;
        else if (hasCash && hasCard) {
          // Mixed payment - count towards primary method (larger amount)
          const cashAmount = transaction.paymentBreakdown
            .filter(p => p.method === 'cash' && p.amount > 0)
            .reduce((sum, p) => sum + p.amount, 0);
          const cardAmount = transaction.paymentBreakdown
            .filter(p => p.method === 'card')
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

    filteredTransactions.forEach(transaction => {
      // Check if this is a credit transaction using the new transactionType field
      if (transaction.transactionType === "credit" || transaction.transactionType === "partial_credit") {
        creditTotal += transaction.creditAmount || 0;
        creditTransactionCount++;
      } else if (transaction.paymentBreakdown && Array.isArray(transaction.paymentBreakdown)) {
        // Fallback to check paymentBreakdown for credit amounts
        const creditAmount = transaction.paymentBreakdown
          .filter(payment => payment.method === "credit")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        if (creditAmount > 0) {
          creditTotal += creditAmount;
          creditTransactionCount++;
        }
      }
    });

    return { creditTotal, creditTransactionCount };
  };

  const getUnpaidAmounts = () => {
    let unpaidTotal = 0;
    let unpaidTransactionCount = 0;
    const unpaidDetails = []; // Debug array to track unpaid transactions

    filteredTransactions.forEach(transaction => {
      // Check if this is a credit transaction - credit sales are unpaid by definition
      if (transaction.transactionType === "credit" || transaction.transactionType === "partial_credit") {
        const amount = transaction.creditAmount || transaction.total || 0;
        unpaidTotal += amount;
        unpaidTransactionCount++;
        unpaidDetails.push({
          id: transaction.id,
          type: 'Credit Sale',
          amount: amount,
          timestamp: transaction.timestamp,
          reason: 'Credit transaction'
        });
        return; // Credit transactions are handled above
      }

      // Check paymentBreakdown for credit amounts
      if (transaction.paymentBreakdown && Array.isArray(transaction.paymentBreakdown)) {
        const creditAmount = transaction.paymentBreakdown
          .filter(payment => payment.method === "credit")
          .reduce((sum, payment) => sum + (payment.amount || 0), 0);
        
        if (creditAmount > 0) {
          unpaidTotal += creditAmount;
          unpaidTransactionCount++;
          unpaidDetails.push({
            id: transaction.id,
            type: 'Credit Payment',
            amount: creditAmount,
            timestamp: transaction.timestamp,
            reason: 'Credit amount in payment breakdown'
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
            .filter(payment => payment.amount > 0) // Only count positive amounts as payments
            .reduce((sum, payment) => sum + payment.amount, 0);
          transactionTotal = transaction.finalTotal; // Use finalTotal for cashback transactions
        } else {
          // Regular transactions: Sum all payment amounts
          totalPaid = transaction.paymentBreakdown.reduce((sum, payment) => sum + payment.amount, 0);
        }
        
        const unpaidAmount = transactionTotal - totalPaid;
        
        if (unpaidAmount > 0.01) { // Consider amounts over 1 cent as unpaid
          unpaidTotal += unpaidAmount;
          if (creditAmount === 0) { // Only count as separate transaction if no credit was involved
            unpaidTransactionCount++;
          }
          unpaidDetails.push({
            id: transaction.id,
            type: 'Partial Payment',
            amount: unpaidAmount,
            timestamp: transaction.timestamp,
            reason: `Total: $${transactionTotal.toFixed(2)}, Paid: $${totalPaid.toFixed(2)}${transaction.cashback > 0 ? ` (Cashback: $${transaction.cashback.toFixed(2)}, FinalTotal: $${transaction.finalTotal.toFixed(2)})` : ''}`
          });
        }
      } else if (!transaction.paymentBreakdown || transaction.paymentBreakdown.length === 0) {
        // No payment breakdown means unpaid transaction
        unpaidTotal += transaction.total;
        unpaidTransactionCount++;
      }
    });

    // Debug logging for the $8 unpaid amount investigation
    console.log('Unpaid Amount Details:', unpaidDetails);
    console.log('Total Unpaid Amount:', Math.round(unpaidTotal * 100) / 100);

    return { 
      unpaidTotal, 
      unpaidTransactionCount,
      details: unpaidDetails // Return details for debugging
    };
  };

  // Calculate summary data once to avoid multiple calls
  const unpaidAmounts = getUnpaidAmounts();

  return (
    <Container>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Title>Sales Transactions</Title>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Show Delete Buttons Checkbox */}
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
            <input 
              type="checkbox"
              checked={showDeleteButtons}
              onChange={(e) => setShowDeleteButtons(e.target.checked)}
              style={{ transform: "scale(1.2)" }}
            />
            <span style={{ fontSize: "0.9rem", color: "#666" }}>Show Delete Buttons</span>
          </label>
          
          {/* Dashboard Preferences Dropdown */}
          <div style={{ position: "relative" }} className="preferences-dropdown">
          <Button
            onClick={() => setShowPreferencesDropdown(!showPreferencesDropdown)}
            style={{ 
              backgroundColor: "#34495e", 
              color: "white",
              padding: "0.5rem 1rem",
              fontSize: "0.9rem"
            }}
          >
            ⚙️ Display Options
          </Button>
          
          {showPreferencesDropdown && (
            <div style={{
              position: "absolute",
              top: "100%",
              right: "0",
              backgroundColor: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "1rem",
              minWidth: "250px",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              zIndex: 1000
            }}>
              <h4 style={{ margin: "0 0 0.75rem 0", color: "#2c3e50" }}>Show/Hide Sections</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { key: 'totalSales', label: '📊 Total Sales' },
                  { key: 'totalTransactions', label: '🧾 Total Transactions' },
                  { key: 'averageSale', label: '📈 Average Sale' },
                  { key: 'peakHour', label: '⏰ Peak Hour' },
                  { key: 'cashEarnings', label: '💵 Cash Earnings' },
                  { key: 'cardEarnings', label: '💳 Card Earnings' },
                  { key: 'creditEarnings', label: '📝 Credit Sales' },
                  { key: 'lotteryEarnings', label: '🎰 Lottery Redeem' },
                  { key: 'paymentRatio', label: '📊 Payment Ratio' },
                  { key: 'topProducts', label: '🏆 Top Products' }
                ].map(section => (
                  <label 
                    key={section.key}
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem", 
                      cursor: "pointer",
                      padding: "0.25rem",
                      borderRadius: "4px",
                      backgroundColor: visibleSections[section.key] ? "#e8f5e8" : "transparent"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={visibleSections[section.key]}
                      onChange={() => toggleSection(section.key)}
                      style={{ margin: 0 }}
                    />
                    <span style={{ fontSize: "0.9rem" }}>{section.label}</span>
                  </label>
                ))}
              </div>
              
              <div style={{ 
                marginTop: "0.75rem", 
                paddingTop: "0.75rem", 
                borderTop: "1px solid #eee",
                fontSize: "0.8rem",
                color: "#7f8c8d"
              }}>
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
              ${getTotalSales().toFixed(2)}
            </p>
            <p>{
              dateFilter === "today" ? "Today" :
              dateFilter === "yesterday" ? "Yesterday" :
              dateFilter === "specific" ? new Date(selectedDate).toLocaleDateString() :
              "For selected period"
            }</p>
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
              ${getPaymentMethodBreakdown().cashTotal.toFixed(2)}
            </p>
            <p>{getPaymentMethodBreakdown().cashTransactionCount} transactions</p>
            {transactionTypeFilter === "cash" && (
              <div style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "0.5rem", fontWeight: "600" }}>
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
              ${getPaymentMethodBreakdown().cardTotal.toFixed(2)}
            </p>
            <p>{getPaymentMethodBreakdown().cardTransactionCount} transactions</p>
            {transactionTypeFilter === "card" && (
              <div style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "0.5rem", fontWeight: "600" }}>
                🔍 Filtered
              </div>
            )}
          </ClickableCard>
        )}

        {/* Credit Sales */}
        {visibleSections.creditEarnings && getCreditEarningsBreakdown().creditTransactionCount > 0 && (
          <ClickableCard 
            isActive={transactionTypeFilter === "credit"}
            onClick={() => handleCardFilter("credit")}
          >
            <h3>📝 Credit Sales</h3>
            <p style={{ fontWeight: "bold", color: "#e74c3c" }}>
              ${getCreditEarningsBreakdown().creditTotal.toFixed(2)}
            </p>
            <p>{getCreditEarningsBreakdown().creditTransactionCount} credit sales</p>
            {transactionTypeFilter === "credit" && (
              <div style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "0.5rem", fontWeight: "600" }}>
                🔍 Filtered
              </div>
            )}
          </ClickableCard>
        )}

        {/* Lottery Earnings */}
        {visibleSections.lotteryEarnings && getLotteryBreakdown().lottoTransactionCount > 0 && (
          <ClickableCard 
            isActive={transactionTypeFilter === "lotto"}
            onClick={() => handleCardFilter("lotto")}
          >
            <h3>🎰 Lottery Redeem</h3>
            <p style={{ fontWeight: "bold", color: "#9b59b6" }}>
              ${getLotteryBreakdown().lottoTotal.toFixed(2)}
            </p>
            <p>{getLotteryBreakdown().lottoTransactionCount} winnings paid</p>
            {transactionTypeFilter === "lotto" && (
              <div style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "0.5rem", fontWeight: "600" }}>
                🔍 Filtered
              </div>
            )}
          </ClickableCard>
        )}

        {/* Fourth priority: Unpaid Amounts */}
        <ClickableCard 
          isActive={transactionTypeFilter === "unpaid"}
          onClick={() => handleCardFilter("unpaid")}
        >
          <h3>⏳ Unpaid Amounts</h3>
          <p style={{ 
            fontWeight: "bold", 
            color: unpaidAmounts.unpaidTotal > 0 ? "#e74c3c" : "#27ae60" 
          }}>
            ${unpaidAmounts.unpaidTotal.toFixed(2)}
          </p>
          <p>{unpaidAmounts.unpaidTotal > 0 ? `${unpaidAmounts.unpaidTransactionCount} pending` : "All paid"}</p>
          {transactionTypeFilter === "unpaid" && (
            <div style={{ fontSize: "0.75rem", color: "#3498db", marginTop: "0.5rem", fontWeight: "600" }}>
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
                const cardPercentage = total > 0 ? ((cardTotal / total) * 100) : 0;
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
                const peak = Object.entries(hourly).reduce((max, [hour, data]) => 
                  data.count > (max.data?.count || 0) ? { hour, data } : max, {}
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
          <p style={{ 
            fontWeight: "bold", 
            color: getPaymentMethodBreakdown().cashTotal >= 0 ? "#27ae60" : "#e74c3c" 
          }}>
            ${getPaymentMethodBreakdown().cashTotal.toFixed(2)}
          </p>
          <p>{getPaymentMethodBreakdown().cashTotal >= 0 ? "Cash gained" : "Cash reduced"}</p>
        </CompactCard>
      </CompactCardGrid>

      {/* Payment Method Breakdown - Now consolidated in CompactCardGrid above */}

      <FilterContainer style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="specific">Specific Date</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
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
                fontSize: "1rem"
              }}
            />
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
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#e8f4fd",
              border: "1px solid #3498db",
              borderRadius: "6px",
              padding: "0.5rem 0.75rem",
              fontSize: "0.9rem",
              color: "#2c3e50"
            }}>
              <span>🔍 Filter: {
                transactionTypeFilter === "cash" ? "Cash Earnings" :
                transactionTypeFilter === "card" ? "Card Earnings" :
                transactionTypeFilter === "credit" ? "Credit Sales" :
                transactionTypeFilter === "lotto" ? "Lottery" :
                transactionTypeFilter === "unpaid" ? "Unpaid Amounts" :
                transactionTypeFilter
              }</span>
              <button
                onClick={() => setTransactionTypeFilter("all")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#e74c3c",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0",
                  marginLeft: "0.25rem"
                }}
                title="Clear filter"
              >
                ×
              </button>
            </div>
          )}
          <Link href="/pos">
            <Button>New Sale</Button>
          </Link>
        </div>
      </FilterContainer>

      {/* Daily Summary View */}
      {viewMode === "daily" && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ marginBottom: "1rem", color: "#2c3e50" }}>Daily Sales Summary</h2>
          {getDailyBreakdown().map((day) => (
            <Card key={day.date} style={{ marginBottom: "1rem" }}>
              <h3 style={{ color: "#2c3e50", marginBottom: "1rem" }}>
                {new Date(day.date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "1rem" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#27ae60" }}>
                    ${day.totalSales.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Total Sales</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#27ae60" }}>
                    ${day.cashEarnings.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>💵 Cash Earned</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#3498db" }}>
                    ${day.cardEarnings.toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>💳 Card Earned</div>
                </div>
                {day.lottoEarnings > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#9b59b6" }}>
                      ${day.lottoEarnings.toFixed(2)}
                    </div>
                    <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>🎰 Lottery Redeem</div>
                  </div>
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#8e44ad" }}>
                    {day.transactionCount}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Transactions</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f39c12" }}>
                    {day.totalItems}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Items Sold</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#9b59b6" }}>
                    ${(day.totalSales / day.transactionCount).toFixed(2)}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Avg Sale</div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div style={{ 
                marginTop: "1rem", 
                padding: "0.75rem", 
                backgroundColor: "#f8f9fa", 
                borderRadius: "8px",
                display: "grid", 
                gridTemplateColumns: day.lottoTransactions > 0 ? "1fr 1fr 1fr" : "1fr 1fr", 
                gap: "1rem" 
              }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#27ae60" }}>
                    {day.cashTransactions}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>Cash Transactions</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#3498db" }}>
                    {day.cardTransactions}
                  </div>
                  <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>Card Transactions</div>
                </div>
                {day.lottoTransactions > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#9b59b6" }}>
                      {day.lottoTransactions}
                    </div>
                    <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>Lottery Transactions</div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}



      {/* Hourly Breakdown for filtered transactions */}
      {viewMode === "list" && filteredTransactions.length > 0 && (dateFilter === "today" || dateFilter === "yesterday" || dateFilter === "specific") && (
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ color: "#2c3e50", marginBottom: "1rem" }}>
            Hourly Breakdown - {
              dateFilter === "today" ? "Today" :
              dateFilter === "yesterday" ? "Yesterday" :
              new Date(selectedDate).toLocaleDateString()
            }
          </h3>
          
          {/* Payment Method Summary */}
          {(() => {
            const totalCashTransactions = filteredTransactions.filter(tx => tx.transactionType === 'cash').length;
            const totalCardTransactions = filteredTransactions.filter(tx => tx.transactionType === 'card').length;
            const totalMixedTransactions = filteredTransactions.filter(tx => tx.transactionType === 'mixed').length;
            const totalCreditTransactions = filteredTransactions.filter(tx => 
              tx.transactionType === 'credit' || tx.transactionType === 'partial_credit'
            ).length;
            const totalLottoTransactions = filteredTransactions.filter(tx => 
              tx.transactionType === 'lotto' || tx.transactionType === 'lotto_mixed'
            ).length;
            
            const totalCashAmount = filteredTransactions.reduce((sum, tx) => sum + (tx.cashAmount || 0), 0);
            const totalCardAmount = filteredTransactions.reduce((sum, tx) => sum + (tx.cardAmount || 0), 0);
            const totalCreditAmount = filteredTransactions.reduce((sum, tx) => sum + (tx.creditAmount || 0), 0);
            
            return (
              <div style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1rem",
                color: "white"
              }}>
                <h4 style={{ margin: "0 0 0.8rem 0", textAlign: "center", opacity: 0.9 }}>
                  Payment Method Summary
                </h4>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
                  gap: "0.8rem" 
                }}>
                  {totalCashTransactions > 0 && (
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>💵 Cash</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{totalCashTransactions} txns</div>
                      <div style={{ fontSize: "0.9rem" }}>${totalCashAmount.toFixed(2)}</div>
                    </div>
                  )}
                  {totalCardTransactions > 0 && (
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>💳 Card</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{totalCardTransactions} txns</div>
                      <div style={{ fontSize: "0.9rem" }}>${totalCardAmount.toFixed(2)}</div>
                    </div>
                  )}
                  {totalMixedTransactions > 0 && (
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>🔄 Mixed</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{totalMixedTransactions} txns</div>
                      <div style={{ fontSize: "0.9rem" }}>Cash+Card</div>
                    </div>
                  )}
                  {totalCreditTransactions > 0 && (
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>📝 Credit</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{totalCreditTransactions} txns</div>
                      <div style={{ fontSize: "0.9rem" }}>${totalCreditAmount.toFixed(2)}</div>
                    </div>
                  )}
                  {totalLottoTransactions > 0 && (
                    <div style={{ textAlign: "center", background: "rgba(255,255,255,0.15)", padding: "0.6rem", borderRadius: "6px" }}>
                      <div style={{ fontSize: "0.85rem", opacity: 0.8 }}>🎰 Lotto</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{totalLottoTransactions} txns</div>
                      <div style={{ fontSize: "0.9rem" }}>Winnings</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
            gap: "0.8rem",
            background: "white",
            padding: "1.5rem",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)"
          }}>
            {Object.entries(getHourlyBreakdown()).map(([hour, data]) => (
              <div key={hour} style={{ 
                textAlign: "center", 
                padding: "0.8rem 0.5rem",
                background: data.count > 0 ? "#e8f5e8" : "#f8f9fa",
                borderRadius: "6px",
                border: data.count > 0 ? "1px solid #27ae60" : "1px solid #e9ecef",
                minHeight: "140px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}>
                <div style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "1rem", marginBottom: "0.5rem" }}>
                  {hour}:00
                </div>
                
                <div style={{ fontSize: "0.9rem", color: "#27ae60", fontWeight: "600", marginBottom: "0.5rem" }}>
                  {data.count} sales
                </div>
                
                <div style={{ fontSize: "0.85rem", color: "#2c3e50", fontWeight: "bold", marginBottom: "0.5rem" }}>
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
                      📝 {data.creditCount} credit (${data.creditAmount.toFixed(2)})
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
                  <td>#{(transaction.id || transaction._id || 'N/A').toString().slice(-8)}</td>
                  <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                  <td>
                    {transaction.items && Array.isArray(transaction.items) 
                      ? transaction.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                      : 0}{" "}
                    items
                    {(!transaction.items || !Array.isArray(transaction.items) || transaction.items.length === 0) && (
                      <span style={{ color: "#e74c3c", fontSize: "0.8rem", marginLeft: "0.5rem" }}>
                        (No items data)
                      </span>
                    )}
                  </td>
                  <td>${transaction.subtotal.toFixed(2)}</td>
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
                      const paymentMethod = getTransactionPaymentMethod(transaction);
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
                            border: `1px solid ${paymentMethod.color}40`
                          }}
                        >
                          {paymentMethod.icon} {paymentMethod.type}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      <Button
                        onClick={() => toggleTransactionDetails(transaction.id || transaction._id)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                          background:
                            expandedTransaction === (transaction.id || transaction._id)
                              ? "#e74c3c"
                              : "#3498db",
                        }}
                      >
                        {expandedTransaction === (transaction.id || transaction._id)
                          ? "Hide"
                          : "Details"}
                      </Button>
                      <Button
                        onClick={() => printTransactionReceipt(transaction)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                          background: "#27ae60",
                          color: "white"
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
                          color: "white"
                        }}
                        title="Change Payment Method"
                      >
                        💳 Edit Payment
                      </Button>
                      {showDeleteButtons && (
                        <Button
                          onClick={() => handleDeleteTransaction(transaction.id || transaction._id)}
                          style={{
                            padding: "0.4rem 0.8rem",
                            fontSize: "0.8rem",
                            background: "#e74c3c",
                            color: "white"
                          }}
                          title="Delete Transaction"
                        >
                          🗑️ Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
                {editingPaymentMethod === (transaction.id || transaction._id) && (
                  <tr>
                    <td colSpan="8" style={{ backgroundColor: "#fff3cd", padding: "1rem", border: "2px solid #f39c12" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                        <div style={{ fontWeight: "bold", color: "#856404" }}>
                          Change Payment Method:
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <select
                            value={newPaymentMethod}
                            onChange={(e) => setNewPaymentMethod(e.target.value)}
                            style={{
                              padding: "0.5rem",
                              border: "1px solid #f39c12",
                              borderRadius: "4px",
                              fontSize: "0.9rem"
                            }}
                          >
                            <option value="cash">💵 Cash</option>
                            <option value="card">💳 Card</option>
                            <option value="credit">📝 Credit</option>
                            <option value="mixed">🔄 Mixed (Cash + Card)</option>
                          </select>
                          <Button
                            onClick={() => updatePaymentMethod(transaction)}
                            disabled={isUpdatingPayment}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.9rem",
                              background: isUpdatingPayment ? "#95a5a6" : "#27ae60",
                              color: "white",
                              opacity: isUpdatingPayment ? 0.7 : 1
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
                              color: "white"
                            }}
                          >
                            ✗ Cancel
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                {expandedTransaction === (transaction.id || transaction._id) && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{ backgroundColor: "#f8f9fa", padding: "1rem" }}
                    >
                      <h4 style={{ marginBottom: "1rem", color: "#2c3e50" }}>
                        Transaction Details
                      </h4>
                      <div style={{ display: "grid", gap: "0.5rem" }}>
                        {(transaction.items && Array.isArray(transaction.items) ? transaction.items : []).map((item) => (
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
            Sales by Category - {
              dateFilter === "today" ? "Today" :
              dateFilter === "yesterday" ? "Yesterday" :
              dateFilter === "specific" ? new Date(selectedDate).toLocaleDateString() :
              "Selected Period"
            }
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {getCategoryBreakdown().map(([category, stats]) => (
              <Card key={category} style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white"
              }}>
                <h3 style={{ color: "white", marginBottom: "1rem", display: "flex", alignItems: "center" }}>
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
                  {!["Tobacco", "Beverages", "Snacks", "Groceries", "Alcohol", "Personal Care", "Household", "Candy", "Dairy", "Frozen"].includes(category) && "📦"} 
                  &nbsp;{category}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      ${stats.totalRevenue.toFixed(2)}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>Total Revenue</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                      {stats.itemsSold}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>Items Sold</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      {stats.transactionCount}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>Transactions</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                      ${stats.avgPrice.toFixed(2)}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: "0.9rem" }}>Avg Price</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Top Selling Items */}
          <h3 style={{ marginBottom: "1rem", color: "#2c3e50" }}>Top Selling Items</h3>
          <div style={{ 
            background: "white", 
            borderRadius: "8px", 
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            overflow: "hidden"
          }}>
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
                    <td style={{ 
                      fontWeight: "bold", 
                      color: index === 0 ? "#f1c40f" : index === 1 ? "#95a5a6" : index === 2 ? "#e67e22" : "#2c3e50"
                    }}>
                      #{index + 1}
                    </td>
                    <td style={{ fontWeight: "600" }}>{item.name}</td>
                    <td>
                      <span style={{
                        background: "#ecf0f1",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "12px",
                        fontSize: "0.8rem",
                        color: "#2c3e50"
                      }}>
                        {item.category}
                      </span>
                    </td>
                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>{item.quantitySold}</td>
                    <td style={{ fontWeight: "bold", color: "#27ae60" }}>${item.totalRevenue.toFixed(2)}</td>
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
