"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";

const CreditPayContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 70vh;
  overflow-y: auto;
`;

const SearchSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  font-size: 1rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #3498db;
  }
`;

const CustomerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
`;

const CustomerItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 0.75rem;
  background: ${props => props.selected ? '#e8f5e8' : '#f8f9fa'};
  border: 1px solid ${props => props.selected ? '#27ae60' : '#ddd'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.selected ? '#e8f5e8' : '#e9ecef'};
    border-color: ${props => props.selected ? '#27ae60' : '#aaa'};
  }
`;

const CustomerInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const CustomerName = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1.05rem;
`;

const CustomerBalance = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  font-weight: 500;
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px solid #e9ecef;
`;

const PaymentAmount = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #e74c3c;
  text-align: center;
  padding: 1rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #ddd;
`;

const PaymentInput = styled.input`
  padding: 0.75rem;
  font-size: 1.1rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;

  &:focus {
    border-color: #3498db;
    outline: none;
  }
`;

const PaymentButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const PaymentButton = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  
  ${props => {
    if (props.variant === 'full') {
      return `
        background: #27ae60;
        color: white;
        &:hover { background: #229954; }
      `;
    } else if (props.variant === 'partial') {
      return `
        background: #f39c12;
        color: white;
        &:hover { background: #e67e22; }
      `;
    } else if (props.variant === 'cancel') {
      return `
        background: #95a5a6;
        color: white;
        &:hover { background: #7f8c8d; }
      `;
    }
  }}
`;

const TransactionsList = styled.div`
  max-height: 200px;
  overflow-y: auto;
  margin-top: 1rem;
`;

const TransactionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
  }
`;

export default function CreditPayment({ onClose, onPaymentSuccess }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search for customers with unpaid credits
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      searchCustomers(searchTerm);
    } else {
      setCustomers([]);
    }
  }, [searchTerm]);

  const searchCustomers = async (term) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/credit/customers?search=${encodeURIComponent(term)}`);
      const data = await response.json();
      
      if (response.ok) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || 'Failed to search customers');
      }
    } catch (err) {
      setError('Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setError("");
  };

  const processPayment = async (isFullPayment = false) => {
    if (!selectedCustomer) {
      setError("Please select a customer");
      return;
    }

    const amount = isFullPayment ? selectedCustomer.totalUnpaid : parseFloat(paymentAmount);
    
    if (!amount || amount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (amount > selectedCustomer.totalUnpaid) {
      setError("Payment amount cannot exceed unpaid balance");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/credit/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: selectedCustomer.customerName,
          paymentAmount: amount,
          paymentMethod: 'cash', // Default to cash, can be extended
          isFullPayment
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        onPaymentSuccess(result);
        onClose();
      } else {
        setError(result.error || 'Payment processing failed');
      }
    } catch (err) {
      setError('Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CreditPayContainer>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#2c3e50' }}>💳 Credit Payment</h3>
        <button 
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#7f8c8d'
          }}
        >
          ×
        </button>
      </div>

      <SearchSection>
        <SearchInput
          type="text"
          placeholder="Search customer by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        {loading && (
          <div style={{ textAlign: 'center', color: '#7f8c8d' }}>
            🔍 Searching customers...
          </div>
        )}

        {customers.length > 0 && (
          <CustomerList>
            {customers.map((customer, index) => (
              <CustomerItem
                key={index}
                selected={selectedCustomer?.customerName === customer.customerName}
                onClick={() => selectCustomer(customer)}
              >
                <CustomerInfo>
                  <CustomerName>{customer.customerName}</CustomerName>
                  <CustomerBalance>
                    Unpaid: ${customer.totalUnpaid.toFixed(2)} ({customer.unpaidTransactions} transactions)
                  </CustomerBalance>
                </CustomerInfo>
              </CustomerItem>
            ))}
          </CustomerList>
        )}

        {searchTerm.length >= 2 && customers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '1rem' }}>
            No customers found with unpaid credits
          </div>
        )}
      </SearchSection>

      {selectedCustomer && (
        <PaymentSection>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>
              {selectedCustomer.customerName}
            </h4>
            <PaymentAmount>
              Total Unpaid: ${selectedCustomer.totalUnpaid.toFixed(2)}
            </PaymentAmount>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#2c3e50' }}>
              Payment Amount:
            </label>
            <PaymentInput
              type="number"
              step="0.01"
              min="0"
              max={selectedCustomer.totalUnpaid}
              placeholder="Enter amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />
          </div>

          <PaymentButtons>
            <PaymentButton
              variant="full"
              onClick={() => processPayment(true)}
              disabled={loading}
            >
              💰 Pay Full Amount (${selectedCustomer.totalUnpaid.toFixed(2)})
            </PaymentButton>
            
            <PaymentButton
              variant="partial"
              onClick={() => processPayment(false)}
              disabled={loading || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              💵 Pay Partial (${parseFloat(paymentAmount || 0).toFixed(2)})
            </PaymentButton>
          </PaymentButtons>

          <div>
            <h5 style={{ margin: '1rem 0 0.5rem 0', color: '#2c3e50' }}>
              Account Information:
            </h5>
            <div style={{
              background: '#f8f9fa',
              padding: '0.75rem',
              borderRadius: '6px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div><strong>Total Transactions:</strong> {selectedCustomer.unpaidTransactions}</div>
                <div><strong>Last Activity:</strong> {new Date(selectedCustomer.lastTransactionDate).toLocaleDateString()}</div>
                {selectedCustomer.phone && (
                  <div><strong>Phone:</strong> {selectedCustomer.phone}</div>
                )}
                {selectedCustomer.email && (
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                )}
              </div>
              {selectedCustomer.notes && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#7f8c8d' }}>
                  <strong>Notes:</strong> {selectedCustomer.notes}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ 
              color: '#e74c3c', 
              textAlign: 'center', 
              padding: '0.75rem', 
              background: '#fdf2f2', 
              border: '1px solid #f5b7b1', 
              borderRadius: '6px' 
            }}>
              ⚠️ {error}
            </div>
          )}

          <PaymentButtons style={{ marginTop: '1rem' }}>
            <PaymentButton variant="cancel" onClick={onClose}>
              Cancel
            </PaymentButton>
          </PaymentButtons>
        </PaymentSection>
      )}
    </CreditPayContainer>
  );
}