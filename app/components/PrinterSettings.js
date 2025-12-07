import React, { useState, useEffect } from 'react';
import { ThermalPrinter } from '../lib/thermalPrinter';

const PrinterSettings = () => {
  const [printerSettings, setPrinterSettings] = useState({
    method: 'webserial', // 'webserial', 'network', 'file'
    networkIP: '192.168.1.100',
    networkPort: '9100',
    autoConnect: true,
    paperWidth: 32, // characters per line
  });

  const [testResult, setTestResult] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('printerSettings');
    if (saved) {
      setPrinterSettings(JSON.parse(saved));
    }
  }, []);

  const saveSettings = () => {
    localStorage.setItem('printerSettings', JSON.stringify(printerSettings));
    alert('Printer settings saved!');
  };

  const testConnection = async () => {
    try {
      setTestResult('Testing connection...');
      const printer = new ThermalPrinter();
      
      const testTransaction = {
        id: 'TEST' + Date.now(),
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Test Item', price: 1.00, quantity: 1, taxable: true }
        ],
        subtotal: 1.00,
        tax: 0.13,
        total: 1.13,
        paymentBreakdown: [
          { method: 'cash', amount: 1.13 }
        ]
      };

      let result;
      if (printerSettings.method === 'webserial') {
        result = await printer.printThermalReceipt(testTransaction);
      } else if (printerSettings.method === 'network') {
        const receiptData = printer.formatReceipt(testTransaction);
        result = await printer.printViaNetwork(receiptData, printerSettings.networkIP, printerSettings.networkPort);
      } else {
        result = await printer.printThermalReceipt(testTransaction);
      }

      if (result.success) {
        setTestResult(`✅ Test successful! Method: ${result.method}`);
        setIsConnected(true);
      } else {
        setTestResult('❌ Test failed');
        setIsConnected(false);
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error.message}`);
      setIsConnected(false);
    }
  };

  const testPaperFeed = async () => {
    try {
      const printer = new ThermalPrinter();
      const feedCommand = printer.commands.INIT + printer.commands.FEED_LINES(3) + printer.commands.CUT_FULL_WITH_FEED;
      
      if (printerSettings.method === 'webserial') {
        await printer.printViaWebSerial(feedCommand);
        setTestResult('✅ Paper feed test sent');
      } else {
        setTestResult('Paper feed test only works with Web Serial connection');
      }
    } catch (error) {
      setTestResult(`❌ Feed test error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>🖨️ Citizen S2000 Printer Settings</h2>
      
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Connection Method</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="radio"
              name="method"
              value="webserial"
              checked={printerSettings.method === 'webserial'}
              onChange={(e) => setPrinterSettings({...printerSettings, method: e.target.value})}
              style={{ marginRight: '8px' }}
            />
            <span>USB/Serial Connection (Web Serial API)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <input
              type="radio"
              name="method"
              value="network"
              checked={printerSettings.method === 'network'}
              onChange={(e) => setPrinterSettings({...printerSettings, method: e.target.value})}
              style={{ marginRight: '8px' }}
            />
            <span>Network Connection (Ethernet/WiFi)</span>
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="radio"
              name="method"
              value="file"
              checked={printerSettings.method === 'file'}
              onChange={(e) => setPrinterSettings({...printerSettings, method: e.target.value})}
              style={{ marginRight: '8px' }}
            />
            <span>File Download (Manual printing)</span>
          </label>
        </div>
        
        {printerSettings.method === 'network' && (
          <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Printer IP Address:</label>
              <input
                type="text"
                value={printerSettings.networkIP}
                onChange={(e) => setPrinterSettings({...printerSettings, networkIP: e.target.value})}
                placeholder="192.168.1.100"
                style={{ width: '200px', padding: '5px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Port:</label>
              <input
                type="text"
                value={printerSettings.networkPort}
                onChange={(e) => setPrinterSettings({...printerSettings, networkPort: e.target.value})}
                placeholder="9100"
                style={{ width: '100px', padding: '5px' }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h3>Printer Configuration</h3>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Paper Width (characters per line):</label>
          <input
            type="number"
            value={printerSettings.paperWidth}
            onChange={(e) => setPrinterSettings({...printerSettings, paperWidth: parseInt(e.target.value)})}
            min="24"
            max="48"
            style={{ width: '100px', padding: '5px' }}
          />
          <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
            Citizen S2000 typically uses 32 characters per line
          </small>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={saveSettings}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          💾 Save Settings
        </button>
        
        <button
          onClick={testConnection}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          🧪 Test Print
        </button>
        
        <button
          onClick={testPaperFeed}
          style={{
            padding: '10px 20px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📄 Test Paper Feed & Cut
        </button>
      </div>

      {testResult && (
        <div style={{
          padding: '15px',
          backgroundColor: testResult.includes('✅') ? '#e8f5e8' : '#ffeaea',
          border: `1px solid ${testResult.includes('✅') ? '#4CAF50' : '#f44336'}`,
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>Test Result:</strong> {testResult}
        </div>
      )}

      <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h4>📋 Setup Instructions for Citizen S2000:</h4>
        <ol style={{ marginLeft: '20px' }}>
          <li><strong>USB Connection:</strong> Connect printer via USB and select "USB/Serial Connection"</li>
          <li><strong>Network Connection:</strong> Connect printer to network and enter its IP address</li>
          <li><strong>Browser Permissions:</strong> Modern browsers will ask for permission to access the printer</li>
          <li><strong>Test Print:</strong> Use "Test Print" to verify connection and paper feed</li>
          <li><strong>Paper Issues:</strong> If paper doesn't cut properly, try "Test Paper Feed & Cut"</li>
        </ol>
        
        <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
          ⚠️ If you're still getting long paper feeds, the issue is likely:
        </p>
        <ul style={{ marginLeft: '20px' }}>
          <li>Missing cut commands (fixed in new thermal printer integration)</li>
          <li>Printer not recognizing ESC/POS commands (check printer mode)</li>
          <li>Wrong paper width setting (try adjusting above)</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterSettings;