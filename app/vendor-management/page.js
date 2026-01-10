"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

// Styled components for vendor management
const VendorGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const VendorCard = styled(Card)`
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  border: 2px solid ${props => props.isSelected ? '#3498db' : 'transparent'};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  }
`;

const ProductPricingTable = styled(Table)`
  .price-input {
    width: 100px;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    text-align: right;
  }
  
  .vendor-select {
    width: 150px;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
`;

const FormSection = styled.div`
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
`;

export default function VendorManagementPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorPricing, setVendorPricing] = useState({}); // { productId: { vendorId: price } }
  const [inventoryReceiving, setInventoryReceiving] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [activeTab, setActiveTab] = useState('vendors'); // 'vendors', 'pricing', 'receiving', 'profits'

  // New vendor form
  const [newVendor, setNewVendor] = useState({
    name: '',
    contact: '',
    phone: '',
    email: ''
  });

  // Inventory receiving form
  const [receivingForm, setReceivingForm] = useState({
    productId: '',
    vendorId: '',
    quantity: '',
    purchasePrice: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!user) return;
    loadVendorData();
    loadProducts();
  }, [user]);

  const loadVendorData = async () => {
    try {
      // Load from localStorage for now (can be moved to API later)
      const savedVendors = JSON.parse(localStorage.getItem('vendors') || '[]');
      const savedVendorPricing = JSON.parse(localStorage.getItem('vendorPricing') || '{}');
      const savedInventoryReceiving = JSON.parse(localStorage.getItem('inventoryReceiving') || '[]');
      
      setVendors(savedVendors);
      setVendorPricing(savedVendorPricing);
      setInventoryReceiving(savedInventoryReceiving);
    } catch (error) {
      console.error('Error loading vendor data:', error);
    }
  };

  const loadProducts = async () => {
    try {
      // Load products from existing inventory
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const inventoryData = await response.json();
        setProducts(inventoryData);
      } else {
        // Fallback to localStorage
        const savedInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        setProducts(savedInventory);
      }
    } catch (error) {
      console.error('Error loading products:', error);
      const savedInventory = JSON.parse(localStorage.getItem('inventory') || '[]');
      setProducts(savedInventory);
    }
  };

  const saveVendorData = () => {
    localStorage.setItem('vendors', JSON.stringify(vendors));
    localStorage.setItem('vendorPricing', JSON.stringify(vendorPricing));
    localStorage.setItem('inventoryReceiving', JSON.stringify(inventoryReceiving));
  };

  const addVendor = () => {
    if (!newVendor.name.trim()) {
      alert('Please enter vendor name');
      return;
    }

    const vendor = {
      id: Date.now().toString(),
      name: newVendor.name.trim(),
      contact: newVendor.contact.trim(),
      phone: newVendor.phone.trim(),
      email: newVendor.email.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedVendors = [...vendors, vendor];
    setVendors(updatedVendors);
    setNewVendor({ name: '', contact: '', phone: '', email: '' });
    
    // Save to storage
    localStorage.setItem('vendors', JSON.stringify(updatedVendors));
    alert('Vendor added successfully!');
  };

  const updateVendorPrice = (productId, vendorId, price) => {
    const updatedPricing = {
      ...vendorPricing,
      [productId]: {
        ...vendorPricing[productId],
        [vendorId]: parseFloat(price) || 0
      }
    };
    setVendorPricing(updatedPricing);
    localStorage.setItem('vendorPricing', JSON.stringify(updatedPricing));
  };

  const addInventoryReceiving = () => {
    if (!receivingForm.productId || !receivingForm.vendorId || !receivingForm.quantity || !receivingForm.purchasePrice) {
      alert('Please fill all required fields');
      return;
    }

    const receiving = {
      id: Date.now().toString(),
      productId: receivingForm.productId,
      vendorId: receivingForm.vendorId,
      quantity: parseInt(receivingForm.quantity),
      purchasePrice: parseFloat(receivingForm.purchasePrice),
      date: receivingForm.date,
      createdAt: new Date().toISOString()
    };

    const updatedReceiving = [...inventoryReceiving, receiving];
    setInventoryReceiving(updatedReceiving);
    setReceivingForm({
      productId: '',
      vendorId: '',
      quantity: '',
      purchasePrice: '',
      date: new Date().toISOString().split('T')[0]
    });

    localStorage.setItem('inventoryReceiving', JSON.stringify(updatedReceiving));
    alert('Inventory received successfully!');
  };

  const calculateProductProfit = (productId) => {
    const product = products.find(p => p.id == productId);
    if (!product) return { totalProfit: 0, totalSold: 0, avgCost: 0 };

    // Get all inventory received for this product
    const productReceiving = inventoryReceiving.filter(r => r.productId == productId);
    
    // Calculate average purchase cost
    let totalCost = 0;
    let totalQuantityPurchased = 0;
    
    productReceiving.forEach(receiving => {
      totalCost += receiving.quantity * receiving.purchasePrice;
      totalQuantityPurchased += receiving.quantity;
    });

    const avgCost = totalQuantityPurchased > 0 ? totalCost / totalQuantityPurchased : 0;
    
    // Calculate sold quantity (initial stock - current stock + total purchased)
    const initialStock = product.stock + totalQuantityPurchased;
    const soldQuantity = initialStock - product.stock;
    
    // Calculate profit (selling price - average cost) * sold quantity
    const profitPerUnit = (product.price || 0) - avgCost;
    const totalProfit = profitPerUnit * soldQuantity;

    return {
      totalProfit,
      totalSold: soldQuantity,
      avgCost,
      sellingPrice: product.price || 0,
      profitPerUnit
    };
  };

  const getMonthlyProfit = () => {
    let monthlyData = {};
    
    products.forEach(product => {
      const profitData = calculateProductProfit(product.id);
      if (profitData.totalProfit !== 0) {
        monthlyData[product.id] = {
          name: product.name,
          ...profitData
        };
      }
    });

    return monthlyData;
  };

  if (!user) {
    return (
      <Container>
        <Title>Please log in to access Vendor Management</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Title>🏪 Vendor Management & Profit Tracking</Title>
      
      {/* Navigation Tabs */}
      <FilterContainer>
        <Button 
          onClick={() => setActiveTab('vendors')}
          style={{ backgroundColor: activeTab === 'vendors' ? '#3498db' : '#95a5a6' }}
        >
          👥 Vendors
        </Button>
        <Button 
          onClick={() => setActiveTab('pricing')}
          style={{ backgroundColor: activeTab === 'pricing' ? '#3498db' : '#95a5a6' }}
        >
          💰 Product Pricing
        </Button>
        <Button 
          onClick={() => setActiveTab('receiving')}
          style={{ backgroundColor: activeTab === 'receiving' ? '#3498db' : '#95a5a6' }}
        >
          📦 Receive Inventory
        </Button>
        <Button 
          onClick={() => setActiveTab('profits')}
          style={{ backgroundColor: activeTab === 'profits' ? '#3498db' : '#95a5a6' }}
        >
          📊 Profit Reports
        </Button>
      </FilterContainer>

      {/* Vendors Tab */}
      {activeTab === 'vendors' && (
        <div>
          <FormSection>
            <h3>Add New Vendor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Vendor Name *</label>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({...newVendor, name: e.target.value})}
                  placeholder="Enter vendor name"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <label>Contact Person</label>
                <input
                  type="text"
                  value={newVendor.contact}
                  onChange={(e) => setNewVendor({...newVendor, contact: e.target.value})}
                  placeholder="Contact person name"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  type="text"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({...newVendor, phone: e.target.value})}
                  placeholder="Phone number"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({...newVendor, email: e.target.value})}
                  placeholder="Email address"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
            </div>
            <Button onClick={addVendor} style={{ marginTop: '1rem', backgroundColor: '#27ae60' }}>
              Add Vendor
            </Button>
          </FormSection>

          <h3>Existing Vendors ({vendors.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {vendors.map(vendor => (
              <VendorCard key={vendor.id}>
                <h4>{vendor.name}</h4>
                {vendor.contact && <p><strong>Contact:</strong> {vendor.contact}</p>}
                {vendor.phone && <p><strong>Phone:</strong> {vendor.phone}</p>}
                {vendor.email && <p><strong>Email:</strong> {vendor.email}</p>}
                <p><small>Added: {new Date(vendor.createdAt).toLocaleDateString()}</small></p>
              </VendorCard>
            ))}
          </div>
          {vendors.length === 0 && <p>No vendors added yet. Add your first vendor above.</p>}
        </div>
      )}

      {/* Pricing Tab */}
      {activeTab === 'pricing' && (
        <div>
          <h3>Product Pricing by Vendor</h3>
          <ProductPricingTable>
            <thead>
              <tr>
                <th>Product</th>
                <th>Selling Price</th>
                {vendors.map(vendor => (
                  <th key={vendor.id}>{vendor.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>${(product.price || 0).toFixed(2)}</td>
                  {vendors.map(vendor => (
                    <td key={vendor.id}>
                      <input
                        type="number"
                        step="0.01"
                        className="price-input"
                        value={vendorPricing[product.id]?.[vendor.id] || ''}
                        onChange={(e) => updateVendorPrice(product.id, vendor.id, e.target.value)}
                        placeholder="0.00"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </ProductPricingTable>
          {products.length === 0 && <p>No products found. Please add products to inventory first.</p>}
        </div>
      )}

      {/* Receiving Tab */}
      {activeTab === 'receiving' && (
        <div>
          <FormSection>
            <h3>Receive Inventory</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label>Product *</label>
                <select
                  value={receivingForm.productId}
                  onChange={(e) => setReceivingForm({...receivingForm, productId: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                >
                  <option value="">Select Product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Vendor *</label>
                <select
                  value={receivingForm.vendorId}
                  onChange={(e) => setReceivingForm({...receivingForm, vendorId: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity *</label>
                <input
                  type="number"
                  value={receivingForm.quantity}
                  onChange={(e) => setReceivingForm({...receivingForm, quantity: e.target.value})}
                  placeholder="Enter quantity"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <label>Purchase Price per Unit *</label>
                <input
                  type="number"
                  step="0.01"
                  value={receivingForm.purchasePrice}
                  onChange={(e) => setReceivingForm({...receivingForm, purchasePrice: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
              <div>
                <label>Date</label>
                <input
                  type="date"
                  value={receivingForm.date}
                  onChange={(e) => setReceivingForm({...receivingForm, date: e.target.value})}
                  style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem' }}
                />
              </div>
            </div>
            <Button onClick={addInventoryReceiving} style={{ marginTop: '1rem', backgroundColor: '#27ae60' }}>
              Record Inventory Receipt
            </Button>
          </FormSection>

          <h3>Recent Inventory Receiving</h3>
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Vendor</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {inventoryReceiving.slice().reverse().slice(0, 20).map(receiving => {
                const product = products.find(p => p.id == receiving.productId);
                const vendor = vendors.find(v => v.id === receiving.vendorId);
                return (
                  <tr key={receiving.id}>
                    <td>{new Date(receiving.date).toLocaleDateString()}</td>
                    <td>{product?.name || 'Unknown Product'}</td>
                    <td>{vendor?.name || 'Unknown Vendor'}</td>
                    <td>{receiving.quantity}</td>
                    <td>${receiving.purchasePrice.toFixed(2)}</td>
                    <td>${(receiving.quantity * receiving.purchasePrice).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          {inventoryReceiving.length === 0 && <p>No inventory received yet. Record your first receipt above.</p>}
        </div>
      )}

      {/* Profits Tab */}
      {activeTab === 'profits' && (
        <div>
          <h3>Product Profit Analysis</h3>
          <Table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Avg Cost</th>
                <th>Selling Price</th>
                <th>Profit/Unit</th>
                <th>Units Sold</th>
                <th>Total Profit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(getMonthlyProfit()).map(([productId, data]) => (
                <tr key={productId}>
                  <td>{data.name}</td>
                  <td>${data.avgCost.toFixed(2)}</td>
                  <td>${data.sellingPrice.toFixed(2)}</td>
                  <td style={{ color: data.profitPerUnit >= 0 ? '#27ae60' : '#e74c3c' }}>
                    ${data.profitPerUnit.toFixed(2)}
                  </td>
                  <td>{data.totalSold}</td>
                  <td style={{ 
                    color: data.totalProfit >= 0 ? '#27ae60' : '#e74c3c',
                    fontWeight: 'bold'
                  }}>
                    ${data.totalProfit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4>Total Summary</h4>
            <p><strong>Total Profit: </strong>
              <span style={{ 
                color: Object.values(getMonthlyProfit()).reduce((sum, data) => sum + data.totalProfit, 0) >= 0 ? '#27ae60' : '#e74c3c',
                fontSize: '1.2rem',
                fontWeight: 'bold'
              }}>
                ${Object.values(getMonthlyProfit()).reduce((sum, data) => sum + data.totalProfit, 0).toFixed(2)}
              </span>
            </p>
          </div>

          {Object.keys(getMonthlyProfit()).length === 0 && (
            <p>No profit data available. Start by receiving inventory and recording vendor prices.</p>
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/">
          <Button style={{ backgroundColor: '#95a5a6' }}>← Back to Dashboard</Button>
        </Link>
      </div>
    </Container>
  );
}