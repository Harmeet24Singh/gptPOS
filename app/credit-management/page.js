'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CreditManagementStyles = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '2px solid #e74c3c'
  },
  title: {
    fontSize: '2rem',
    color: '#2c3e50',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  },
  statCard: {
    background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  },
  statLabel: {
    fontSize: '0.9rem',
    opacity: 0.9
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  searchInput: {
    padding: '0.75rem',
    border: '2px solid #ddd',
    borderRadius: '8px',
    fontSize: '1rem',
    minWidth: '300px',
    flex: 1
  },
  button: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  primaryButton: {
    background: '#27ae60',
    color: 'white'
  },
  secondaryButton: {
    background: '#3498db',
    color: 'white'
  },
  dangerButton: {
    background: '#e74c3c',
    color: 'white'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #2c3e50, #34495e)',
    color: 'white'
  },
  th: {
    padding: '1rem',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #34495e'
  },
  td: {
    padding: '1rem',
    borderBottom: '1px solid #ecf0f1',
    verticalAlign: 'top'
  },
  evenRow: {
    background: '#f8f9fa'
  },
  oddRow: {
    background: 'white'
  },
  amount: {
    fontWeight: 'bold',
    fontSize: '1.1rem'
  },
  highAmount: {
    color: '#e74c3c'
  },
  mediumAmount: {
    color: '#f39c12'
  },
  lowAmount: {
    color: '#27ae60'
  },
  actionButton: {
    padding: '0.4rem 0.8rem',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginRight: '0.5rem',
    transition: 'all 0.2s ease'
  },
  payButton: {
    background: '#27ae60',
    color: 'white'
  },
  editButton: {
    background: '#3498db',
    color: 'white'
  },
  deleteButton: {
    background: '#e74c3c',
    color: 'white'
  },
  loading: {
    textAlign: 'center',
    padding: '3rem',
    color: '#7f8c8d',
    fontSize: '1.2rem'
  },
  noData: {
    textAlign: 'center',
    padding: '3rem',
    color: '#7f8c8d',
    fontSize: '1.1rem'
  },
  contactInfo: {
    fontSize: '0.9rem',
    color: '#7f8c8d',
    marginTop: '0.25rem'
  },
  lastActivity: {
    fontSize: '0.8rem',
    color: '#95a5a6',
    fontStyle: 'italic'
  }
};

export default function CreditManagement() {
  const router = useRouter();
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadCreditAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/credit/accounts', {
        headers: {
          'x-api-key': 'dev-secret'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setFilteredAccounts(data.accounts || []);
        setSummary(data.summary || {});
      } else {
        setError('Failed to load credit accounts');
      }
    } catch (err) {
      setError('Error loading credit accounts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditAccounts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAccounts(accounts);
    } else {
      const filtered = accounts.filter(account => 
        account.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.phone && account.phone.includes(searchTerm)) ||
        (account.email && account.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, accounts]);

  const getAmountStyle = (amount) => {
    if (amount >= 100) return { ...CreditManagementStyles.amount, ...CreditManagementStyles.highAmount };
    if (amount >= 50) return { ...CreditManagementStyles.amount, ...CreditManagementStyles.mediumAmount };
    return { ...CreditManagementStyles.amount, ...CreditManagementStyles.lowAmount };
  };

  const handlePayment = (customerName, currentBalance) => {
    // Navigate to POS with credit payment mode
    router.push(`/pos?creditPayment=${encodeURIComponent(customerName)}`);
  };

  const handleEdit = (account) => {
    // TODO: Implement edit functionality
    alert(`Edit functionality for ${account.customerName} - Coming soon!`);
  };

  const handleDelete = async (account) => {
    if (!confirm(`Are you sure you want to delete the credit account for "${account.customerName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/credit/accounts/${account._id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': 'dev-secret'
        }
      });

      if (response.ok) {
        alert('Account deleted successfully');
        loadCreditAccounts(); // Reload data
      } else {
        alert('Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={CreditManagementStyles.container}>
        <div style={CreditManagementStyles.loading}>
          📊 Loading credit accounts...
        </div>
      </div>
    );
  }

  return (
      <div style={CreditManagementStyles.container}>
        <div style={CreditManagementStyles.header}>
          <h1 style={CreditManagementStyles.title}>
            💳 Credit Management
          </h1>
          <button 
            style={{...CreditManagementStyles.button, ...CreditManagementStyles.primaryButton}}
            onClick={loadCreditAccounts}
          >
            🔄 Refresh
          </button>
        </div>

        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Summary Statistics */}
        <div style={CreditManagementStyles.stats}>
          <div style={CreditManagementStyles.statCard}>
            <div style={CreditManagementStyles.statValue}>{summary.totalAccounts || 0}</div>
            <div style={CreditManagementStyles.statLabel}>Total Accounts</div>
          </div>
          <div style={CreditManagementStyles.statCard}>
            <div style={CreditManagementStyles.statValue}>{summary.accountsWithBalance || 0}</div>
            <div style={CreditManagementStyles.statLabel}>With Unpaid Balance</div>
          </div>
          <div style={CreditManagementStyles.statCard}>
            <div style={CreditManagementStyles.statValue}>${(summary.totalBalance || 0).toFixed(2)}</div>
            <div style={CreditManagementStyles.statLabel}>Total Outstanding</div>
          </div>
          <div style={CreditManagementStyles.statCard}>
            <div style={CreditManagementStyles.statValue}>${summary.totalBalance && summary.accountsWithBalance ? (summary.totalBalance / summary.accountsWithBalance).toFixed(2) : '0.00'}</div>
            <div style={CreditManagementStyles.statLabel}>Average Balance</div>
          </div>
        </div>

        {/* Search and Controls */}
        <div style={CreditManagementStyles.controls}>
          <input
            type="text"
            placeholder="🔍 Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={CreditManagementStyles.searchInput}
          />
          <button 
            style={{...CreditManagementStyles.button, ...CreditManagementStyles.secondaryButton}}
            onClick={() => setSearchTerm('')}
          >
            Clear
          </button>
        </div>

        {/* Credit Accounts Table */}
        {filteredAccounts.length === 0 ? (
          <div style={CreditManagementStyles.noData}>
            {accounts.length === 0 ? (
              <>
                📝 No credit accounts found.<br />
                Credit accounts will appear here when customers make credit purchases.
              </>
            ) : (
              <>
                🔍 No accounts match your search criteria.<br />
                Try a different search term or clear the search.
              </>
            )}
          </div>
        ) : (
          <table style={CreditManagementStyles.table}>
            <thead style={CreditManagementStyles.tableHeader}>
              <tr>
                <th style={CreditManagementStyles.th}>Customer</th>
                <th style={CreditManagementStyles.th}>Outstanding Amount</th>
                <th style={CreditManagementStyles.th}>Contact Info</th>
                <th style={CreditManagementStyles.th}>Activity</th>
                <th style={CreditManagementStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account, index) => (
                <tr 
                  key={account._id} 
                  style={index % 2 === 0 ? CreditManagementStyles.evenRow : CreditManagementStyles.oddRow}
                >
                  <td style={CreditManagementStyles.td}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#2c3e50' }}>
                      {account.customerName}
                    </div>
                    {account.notes && (
                      <div style={{ fontSize: '0.9rem', color: '#7f8c8d', marginTop: '0.25rem' }}>
                        📝 {account.notes}
                      </div>
                    )}
                  </td>
                  
                  <td style={CreditManagementStyles.td}>
                    <div style={getAmountStyle(Number(account.balance || 0))}>
                      ${Number(account.balance || 0).toFixed(2)}
                    </div>
                  </td>
                  
                  <td style={CreditManagementStyles.td}>
                    {account.phone && (
                      <div style={CreditManagementStyles.contactInfo}>
                        📞 {account.phone}
                      </div>
                    )}
                    {account.email && (
                      <div style={CreditManagementStyles.contactInfo}>
                        ✉️ {account.email}
                      </div>
                    )}
                    {account.address && (
                      <div style={CreditManagementStyles.contactInfo}>
                        🏠 {account.address}
                      </div>
                    )}
                    {!account.phone && !account.email && !account.address && (
                      <div style={CreditManagementStyles.contactInfo}>
                        No contact info
                      </div>
                    )}
                  </td>
                  
                  <td style={CreditManagementStyles.td}>
                    <div style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                      {account.transactionCount || 0} transactions
                    </div>
                    {account.lastTransactionDate && (
                      <div style={CreditManagementStyles.lastActivity}>
                        Last: {new Date(account.lastTransactionDate).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  
                  <td style={CreditManagementStyles.td}>
                    <button
                      style={{...CreditManagementStyles.actionButton, ...CreditManagementStyles.payButton}}
                      onClick={() => handlePayment(account.customerName, account.balance)}
                      title="Process Payment"
                    >
                      💰 Pay
                    </button>
                    <button
                      style={{...CreditManagementStyles.actionButton, ...CreditManagementStyles.editButton}}
                      onClick={() => handleEdit(account)}
                      title="Edit Account"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      style={{...CreditManagementStyles.actionButton, ...CreditManagementStyles.deleteButton}}
                      onClick={() => handleDelete(account)}
                      title="Delete Account"
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
  );
}