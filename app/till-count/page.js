'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { Container, Title, Button } from '../styles/inventoryStyles';
import styled from 'styled-components';

const TillContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const TillCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e8ed;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #3498db;
  }
`;

const StatusBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  ${props => props.status === 'open' ? `
    background: #d5f4e6;
    color: #27ae60;
  ` : `
    background: #fdeaea;
    color: #e74c3c;
  `}
`;

const TillHistory = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DenominationSection = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 2px solid #4a5568;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const DenominationTitle = styled.h3`
  color: white;
  background: #4a5568;
  margin: -20px -20px 20px -20px;
  padding: 15px 20px;
  font-size: 1.2rem;
  font-weight: 600;
  border-radius: 6px 6px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DenominationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 15px;
  font-size: 0.9rem;
`;

const CategoryHeader = styled.tr`
  background: #e2e8f0;
`;

const CategoryTitle = styled.td`
  padding: 12px;
  font-weight: 600;
  color: #2d3748;
  border-bottom: 2px solid #cbd5e0;
  text-align: left;
  font-size: 1rem;
`;

const TableHeader = styled.th`
  background: #f7fafc;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: #4a5568;
  border: 1px solid #e2e8f0;
  font-size: 0.85rem;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f7fafc;
  }
  
  &:hover {
    background: #edf2f7;
  }
`;

const TableCell = styled.td`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
`;

const DenominationLabel = styled.td`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
  font-weight: 500;
  color: #2d3748;
`;

const DenominationInput = styled.input`
  width: 60px;
  padding: 6px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
  
  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }
`;

const DenominationValue = styled.td`
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: right;
  font-weight: 600;
  color: #38a169;
`;

const TotalSection = styled.div`
  border-top: 2px solid #dee2e6;
  padding-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
`;

const TotalLabel = styled.span`
  font-weight: 600;
  color: #495057;
  font-size: 1.1rem;
`;

const TotalAmount = styled.span`
  font-size: 1.3rem;
  font-weight: bold;
  color: #28a745;
`;



export default function TillCountPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTill, setCurrentTill] = useState(null);
  const [startAmount, setStartAmount] = useState('');
  const [endAmount, setEndAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [tillHistory, setTillHistory] = useState([]);
  const [error, setError] = useState('');
  const [denominations, setDenominations] = useState({
    // Bills
    hundreds: 0,
    fifties: 0,
    twenties: 0,
    tens: 0,
    fives: 0,
    // Coins
    toonies: 0,
    loonies: 0,
    quarters: 0,
    dimes: 0,
    nickels: 0,
    // Rolls
    nickelRolls: 0,
    dimeRolls: 0,
    quarterRolls: 0,
    loonieRolls: 0,
    toonieRolls: 0
  });
  
  const denominationValues = {
    // Bills
    hundreds: 100,
    fifties: 50,
    twenties: 20,
    tens: 10,
    fives: 5,
    // Individual Coins
    toonies: 2,
    loonies: 1,
    quarters: 0.25,
    dimes: 0.10,
    nickels: 0.05,
    // Coin Rolls
    nickelRolls: 2.00,   // 40 nickels
    dimeRolls: 5.00,     // 50 dimes
    quarterRolls: 10.00, // 40 quarters
    loonieRolls: 25.00,  // 25 loonies
    toonieRolls: 50.00   // 25 toonies
  };
  
  const denominationLabels = {
    // Bills
    hundreds: '$100 Bill',
    fifties: '$50 Bill',
    twenties: '$20 Bill',
    tens: '$10 Bill',
    fives: '$5 Bill',
    // Individual Coins
    toonies: '$2 Coin (Toonie)',
    loonies: '$1 Coin (Loonie)',
    quarters: '25¢ Quarter',
    dimes: '10¢ Dime',
    nickels: '5¢ Nickel',
    // Coin Rolls
    nickelRolls: 'Nickel Roll ($2.00)',
    dimeRolls: 'Dime Roll ($5.00)',
    quarterRolls: 'Quarter Roll ($10.00)',
    loonieRolls: 'Loonie Roll ($25.00)',
    toonieRolls: 'Toonie Roll ($50.00)'
  };

  const denominationCategories = {
    bills: ['hundreds', 'fifties', 'twenties', 'tens', 'fives'],
    coins: ['toonies', 'loonies', 'quarters', 'dimes', 'nickels'],
    rolls: ['toonieRolls', 'loonieRolls', 'quarterRolls', 'dimeRolls', 'nickelRolls']
  };

  // Redirect to POS if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/pos');
    }
  }, [user, router]);

  useEffect(() => {
    loadTillData();
  }, []);

  const loadTillData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/till-count', {
        headers: {
          'x-api-key': 'dev-secret'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentTill(data.currentTill);
        setTillHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading till data:', error);
      setError('Failed to load till data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTill = async () => {
    const calculatedAmount = calculateTotalFromDenominations();
    if (calculatedAmount <= 0) {
      setError('Please count your cash denominations before starting the till');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/till-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-secret'
        },
        body: JSON.stringify({
          action: 'start',
          startAmount: calculatedAmount,
          denominations: denominations,
          userName: user?.name || 'Unknown User'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentTill(data.till);
        resetDenominations();
        loadTillData(); // Refresh the data
        alert(`Till started successfully with ${formatCurrency(calculatedAmount)}!`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to start till');
      }
    } catch (error) {
      console.error('Error starting till:', error);
      setError('Failed to start till');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTill = async () => {
    const calculatedAmount = calculateTotalFromDenominations();
    if (calculatedAmount <= 0) {
      setError('Please count your cash denominations before closing the till');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/till-count', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'dev-secret'
        },
        body: JSON.stringify({
          action: 'end',
          endAmount: calculatedAmount,
          denominations: denominations,
          userName: user?.name || 'Unknown User'
        })
      });

      if (response.ok) {
        const difference = calculatedAmount - currentTill.startAmount;
        setCurrentTill(null);
        resetDenominations();
        loadTillData(); // Refresh the data
        alert(`Till closed successfully with ${formatCurrency(calculatedAmount)}! Difference: ${difference >= 0 ? '+' : ''}${formatCurrency(difference)}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to close till');
      }
    } catch (error) {
      console.error('Error closing till:', error);
      setError('Failed to close till');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateTotalFromDenominations = () => {
    return Object.keys(denominations).reduce((total, key) => {
      return total + (denominations[key] * denominationValues[key]);
    }, 0);
  };

  const handleDenominationChange = (key, value) => {
    const numValue = parseInt(value) || 0;
    setDenominations(prev => ({
      ...prev,
      [key]: numValue
    }));
  };

  const resetDenominations = () => {
    setDenominations({
      // Bills
      hundreds: 0,
      fifties: 0,
      twenties: 0,
      tens: 0,
      fives: 0,
      // Coins
      toonies: 0,
      loonies: 0,
      quarters: 0,
      dimes: 0,
      nickels: 0,
      // Rolls
      nickelRolls: 0,
      dimeRolls: 0,
      quarterRolls: 0,
      loonieRolls: 0,
      toonieRolls: 0
    });
  };

  const canStartTill = () => {
    return calculateTotalFromDenominations() > 0;
  };

  const canEndTill = () => {
    return calculateTotalFromDenominations() > 0;
  };

  const renderDenominationSection = (tillStatus) => (
    <DenominationSection>
      <DenominationTitle>
        <span>💵 Denomination Count - {tillStatus}</span>
        <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
          Cashier ID: {user?.name || 'Unknown'} | Till Name: Main Till
        </span>
      </DenominationTitle>
      <DenominationTable>
        <thead>
          <tr>
            <TableHeader style={{ textAlign: 'left', width: '40%' }}>Denomination</TableHeader>
            <TableHeader style={{ width: '20%' }}>Qty</TableHeader>
            <TableHeader style={{ width: '20%' }}>@ Value</TableHeader>
            <TableHeader style={{ width: '20%' }}>Amount</TableHeader>
          </tr>
        </thead>
        <tbody>
          {/* Bills Section */}
          <CategoryHeader>
            <CategoryTitle colSpan={4} style={{ background: '#e2e8f0', fontWeight: 'bold' }}>
              💷 Bills
            </CategoryTitle>
          </CategoryHeader>
          {denominationCategories.bills.map((key) => (
            <TableRow key={key}>
              <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
              <TableCell>
                <DenominationInput
                  type="number"
                  min="0"
                  value={denominations[key]}
                  onChange={(e) => handleDenominationChange(key, e.target.value)}
                  placeholder="0"
                />
              </TableCell>
              <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
              <DenominationValue>
                {formatCurrency(denominations[key] * denominationValues[key])}
              </DenominationValue>
            </TableRow>
          ))}
          {/* Individual Coins Section */}
          <CategoryHeader>
            <CategoryTitle colSpan={4} style={{ background: '#fef5e7', fontWeight: 'bold' }}>
              🪙 Individual Coins
            </CategoryTitle>
          </CategoryHeader>
          {denominationCategories.coins.map((key) => (
            <TableRow key={key}>
              <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
              <TableCell>
                <DenominationInput
                  type="number"
                  min="0"
                  value={denominations[key]}
                  onChange={(e) => handleDenominationChange(key, e.target.value)}
                  placeholder="0"
                />
              </TableCell>
              <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
              <DenominationValue>
                {formatCurrency(denominations[key] * denominationValues[key])}
              </DenominationValue>
            </TableRow>
          ))}
          {/* Coin Rolls Section */}
          <CategoryHeader>
            <CategoryTitle colSpan={4} style={{ background: '#e6fffa', fontWeight: 'bold' }}>
              📦 Coin Rolls
            </CategoryTitle>
          </CategoryHeader>
          {denominationCategories.rolls.map((key) => (
            <TableRow key={key}>
              <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
              <TableCell>
                <DenominationInput
                  type="number"
                  min="0"
                  value={denominations[key]}
                  onChange={(e) => handleDenominationChange(key, e.target.value)}
                  placeholder="0"
                />
              </TableCell>
              <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
              <DenominationValue>
                {formatCurrency(denominations[key] * denominationValues[key])}
              </DenominationValue>
            </TableRow>
          ))}
        </tbody>
      </DenominationTable>
      <TotalSection>
        <TotalLabel>💰 Total Cash Count:</TotalLabel>
        <TotalAmount>{formatCurrency(calculateTotalFromDenominations())}</TotalAmount>
      </TotalSection>
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
        <Button
          onClick={resetDenominations}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            maxWidth: '200px'
          }}
        >
          🔄 Clear All Counts
        </Button>
      </div>
    </DenominationSection>
  );

  if (loading && !currentTill && tillHistory.length === 0) {
    return (
      <Container>
        <TillContainer>
          <Title>Loading till data...</Title>
        </TillContainer>
      </Container>
    );
  }

  return (
    <Container>
      <TillContainer>
        <Title>💰 Till Count Management</Title>
        
        {error && (
          <div style={{ 
            background: '#fdeaea', 
            color: '#e74c3c', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1rem' 
          }}>
            {error}
          </div>
        )}

        {/* Current Till Status */}
        <TillCard>
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Current Till Status
            <StatusBadge status={currentTill ? 'open' : 'closed'}>
              {currentTill ? 'OPEN' : 'CLOSED'}
            </StatusBadge>
          </h2>
          
          {currentTill ? (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Started by:</strong> {currentTill.startUser}<br/>
                <strong>Start Time:</strong> {formatDateTime(currentTill.startTime)}<br/>
                <strong>Start Amount:</strong> {formatCurrency(currentTill.startAmount)}
              </div>
              
              <div style={{ marginBottom: '1rem', padding: '15px', background: '#e8f4f8', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                <strong>📊 Till Close Process:</strong>
                <p style={{ margin: '5px 0 0 0', color: '#0c5460', fontSize: '0.9rem' }}>
                  Count your physical cash using the denomination table below, then close the till.
                </p>
              </div>
              
              {renderDenominationSection("Till Close")}
                <DenominationSection>
                  <DenominationTitle>
                    <span>💵 Denomination Count - Till Close</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
                      Cashier ID: {user?.name || 'Unknown'} | Till Name: Main Till
                    </span>
                  </DenominationTitle>
                  
                  <DenominationTable>
                    <thead>
                      <tr>
                        <TableHeader style={{ textAlign: 'left', width: '40%' }}>Denomination</TableHeader>
                        <TableHeader style={{ width: '20%' }}>Qty</TableHeader>
                        <TableHeader style={{ width: '20%' }}>@ Value</TableHeader>
                        <TableHeader style={{ width: '20%' }}>Amount</TableHeader>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Bills Section */}
                      <CategoryHeader>
                        <CategoryTitle colSpan={4} style={{ background: '#e2e8f0', fontWeight: 'bold' }}>
                          💷 Bills
                        </CategoryTitle>
                      </CategoryHeader>
                      {denominationCategories.bills.map((key) => (
                        <TableRow key={key}>
                          <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
                          <TableCell>
                            <DenominationInput
                              type="number"
                              min="0"
                              value={denominations[key]}
                              onChange={(e) => handleDenominationChange(key, e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
                          <DenominationValue>
                            {formatCurrency(denominations[key] * denominationValues[key])}
                          </DenominationValue>
                        </TableRow>
                      ))}
                      
                      {/* Individual Coins Section */}
                      <CategoryHeader>
                        <CategoryTitle colSpan={4} style={{ background: '#fef5e7', fontWeight: 'bold' }}>
                          🪙 Individual Coins
                        </CategoryTitle>
                      </CategoryHeader>
                      {denominationCategories.coins.map((key) => (
                        <TableRow key={key}>
                          <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
                          <TableCell>
                            <DenominationInput
                              type="number"
                              min="0"
                              value={denominations[key]}
                              onChange={(e) => handleDenominationChange(key, e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
                          <DenominationValue>
                            {formatCurrency(denominations[key] * denominationValues[key])}
                          </DenominationValue>
                        </TableRow>
                      ))}
                      
                      {/* Coin Rolls Section */}
                      <CategoryHeader>
                        <CategoryTitle colSpan={4} style={{ background: '#e6fffa', fontWeight: 'bold' }}>
                          📦 Coin Rolls
                        </CategoryTitle>
                      </CategoryHeader>
                      {denominationCategories.rolls.map((key) => (
                        <TableRow key={key}>
                          <DenominationLabel>{denominationLabels[key]}</DenominationLabel>
                          <TableCell>
                            <DenominationInput
                              type="number"
                              min="0"
                              value={denominations[key]}
                              onChange={(e) => handleDenominationChange(key, e.target.value)}
                              placeholder="0"
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(denominationValues[key])}</TableCell>
                          <DenominationValue>
                            {formatCurrency(denominations[key] * denominationValues[key])}
                          </DenominationValue>
                        </TableRow>
                      ))}
                    </tbody>
                  </DenominationTable>
                  
                  <TotalSection>
                    <TotalLabel>💰 Total Cash Count:</TotalLabel>
                    <TotalAmount>{formatCurrency(calculateTotalFromDenominations())}</TotalAmount>
                  </TotalSection>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px', justifyContent: 'center' }}>
                    <Button
                      onClick={resetDenominations}
                      style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        maxWidth: '200px'
                      }}
                    >
                      🔄 Clear All Counts
                    </Button>
                  </div>
                </DenominationSection>
              
              <Button
                onClick={handleEndTill}
                disabled={loading || !canEndTill()}
                style={{
                  backgroundColor: canEndTill() ? '#e74c3c' : '#6c757d',
                  color: 'white'
                }}
              >
                {loading ? 'Closing Till...' : `🔒 Close Till ${canEndTill() ? `(${formatCurrency(calculateTotalFromDenominations())})` : '- Count Cash First'}`}
              </Button>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '1.5rem', color: '#7f8c8d' }}>
                No till is currently open. Start a new till to begin tracking.
              </p>
              
              <div style={{ marginBottom: '1rem', padding: '15px', background: '#d4edda', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                <strong>🚀 Till Start Process:</strong>
                <p style={{ margin: '5px 0 0 0', color: '#155724', fontSize: '0.9rem' }}>
                  Count your starting cash using the denomination table below, then start your till.
                </p>
              </div>
              
              {renderDenominationSection("Till Open")}

              
              <Button
                onClick={handleStartTill}
                disabled={loading || !canStartTill()}
                style={{
                  backgroundColor: canStartTill() ? '#27ae60' : '#6c757d',
                  color: 'white'
                }}
              >
                {loading ? 'Starting Till...' : `🔓 Start New Till ${canStartTill() ? `(${formatCurrency(calculateTotalFromDenominations())})` : '- Count Cash First'}`}
              </Button>
            </div>
          )}
        </TillCard>

        {/* Till History */}
        {tillHistory.length > 0 && (
          <TillCard>
            <h2 style={{ marginBottom: '1rem' }}>📊 Till History</h2>
            <TillHistory>
              {tillHistory.slice(0, 10).map((till, index) => {
                const difference = till.endAmount - till.startAmount;
                return (
                  <HistoryItem key={till.id || index}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                        {formatDateTime(till.startTime)} - {till.endTime ? formatDateTime(till.endTime) : 'Still Open'}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                        Started by: {till.startUser} {till.endUser && `• Closed by: ${till.endUser}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>Start: {formatCurrency(till.startAmount)}</div>
                      {till.endAmount !== null && (
                        <>
                          <div>End: {formatCurrency(till.endAmount)}</div>
                          <div style={{ 
                            color: difference >= 0 ? '#27ae60' : '#e74c3c',
                            fontWeight: '600'
                          }}>
                            {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                          </div>
                        </>
                      )}
                    </div>
                  </HistoryItem>
                );
              })}
            </TillHistory>
          </TillCard>
        )}
      </TillContainer>
    </Container>
  );
}