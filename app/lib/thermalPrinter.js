// Thermal Printer Control for Citizen S2000
// ESC/POS command utilities

export class ThermalPrinter {
  constructor() {
    this.commands = {
      // Basic commands
      ESC: '\x1B',
      GS: '\x1D',
      
      // Initialize printer
      INIT: '\x1B\x40',
      
      // Text formatting
      BOLD_ON: '\x1B\x45\x01',
      BOLD_OFF: '\x1B\x45\x00',
      UNDERLINE_ON: '\x1B\x2D\x01',
      UNDERLINE_OFF: '\x1B\x2D\x00',
      
      // Alignment
      ALIGN_LEFT: '\x1B\x61\x00',
      ALIGN_CENTER: '\x1B\x61\x01',
      ALIGN_RIGHT: '\x1B\x61\x02',
      
      // Font size
      FONT_SIZE_NORMAL: '\x1D\x21\x00',
      FONT_SIZE_DOUBLE_HEIGHT: '\x1D\x21\x10',
      FONT_SIZE_DOUBLE_WIDTH: '\x1D\x21\x20',
      FONT_SIZE_DOUBLE: '\x1D\x21\x11',
      
      // Line spacing
      LINE_SPACING_DEFAULT: '\x1B\x32',
      LINE_SPACING_TIGHT: '\x1B\x33\x00',
      
      // Paper control
      FEED_LINE: '\x0A',
      FEED_LINES: (n) => '\x1B\x64' + String.fromCharCode(n),
      
      // Cut commands
      CUT_FULL: '\x1D\x56\x00',
      CUT_PARTIAL: '\x1D\x56\x01',
      CUT_FULL_WITH_FEED: '\x1D\x56\x41',
      CUT_PARTIAL_WITH_FEED: '\x1D\x56\x42',
      
      // Drawer control (cash drawer)
      OPEN_DRAWER: '\x1B\x70\x00\x19\xFA',
    };
  }

  // Create a complete receipt with proper commands
  formatReceipt(transaction) {
    let receipt = '';
    
    // Initialize printer
    receipt += this.commands.INIT;
    
    // Header
    receipt += this.commands.ALIGN_CENTER;
    receipt += this.commands.BOLD_ON;
    receipt += this.commands.FONT_SIZE_DOUBLE_HEIGHT;
    receipt += 'KENNEDY CONVENIENCE\n';
    receipt += this.commands.FONT_SIZE_NORMAL;
    receipt += this.commands.BOLD_OFF;
    receipt += 'Scarborough, Ontario\n';
    receipt += this.commands.FEED_LINE;
    
    // Transaction info
    receipt += this.commands.ALIGN_LEFT;
    receipt += `Transaction #${(transaction.id || 'N/A').toString().slice(-8)}\n`;
    receipt += `${new Date(transaction.timestamp).toLocaleString()}\n`;
    receipt += this.printLine('-', 32);
    
    // Items
    if (transaction.items && transaction.items.length > 0) {
      transaction.items.forEach(item => {
        const itemName = this.truncateText(item.name, 20);
        const itemLine = `${item.quantity}x ${itemName}`;
        const price = `$${(item.quantity * item.price).toFixed(2)}`;
        receipt += this.formatLine(itemLine, price, 32);
        
        if (!item.taxable) {
          receipt += '  (No HST)\n';
        }
      });
    }
    
    receipt += this.printLine('-', 32);
    
    // Totals
    if (transaction.taxableAmount > 0 && transaction.nonTaxableAmount > 0) {
      receipt += this.formatLine('Taxable:', `$${transaction.taxableAmount.toFixed(2)}`, 32);
      receipt += this.formatLine('Non-Taxable:', `$${transaction.nonTaxableAmount.toFixed(2)}`, 32);
    }
    
    if (transaction.discount > 0) {
      receipt += this.formatLine('Items Subtotal:', `$${transaction.originalSubtotal.toFixed(2)}`, 32);
      receipt += this.formatLine('Discount:', `-$${transaction.discount.toFixed(2)}`, 32);
    }
    
    receipt += this.formatLine('Subtotal:', `$${transaction.subtotal.toFixed(2)}`, 32);
    
    if (transaction.includeTax && transaction.tax > 0) {
      receipt += this.formatLine('HST (13%):', `$${transaction.tax.toFixed(2)}`, 32);
    }
    
    receipt += this.printLine('-', 32);
    receipt += this.commands.BOLD_ON;
    receipt += this.formatLine('TOTAL:', `$${transaction.total.toFixed(2)}`, 32);
    receipt += this.commands.BOLD_OFF;
    
    // Payments
    if (transaction.paymentBreakdown && transaction.paymentBreakdown.length > 0) {
      receipt += this.commands.FEED_LINE;
      receipt += 'PAYMENTS:\n';
      transaction.paymentBreakdown.forEach(payment => {
        receipt += this.formatLine(`${payment.method.toUpperCase()}:`, `$${payment.amount.toFixed(2)}`, 32);
      });
      
      if (transaction.change > 0) {
        receipt += this.formatLine('CHANGE:', `$${transaction.change.toFixed(2)}`, 32);
      }
    }
    
    if (transaction.cashback > 0) {
      receipt += this.formatLine('CASHBACK:', `$${transaction.cashback.toFixed(2)}`, 32);
    }
    
    // Footer
    receipt += this.commands.FEED_LINE;
    receipt += this.printLine('-', 32);
    receipt += this.commands.ALIGN_CENTER;
    receipt += 'Thank you for your business!\n';
    receipt += this.commands.ALIGN_LEFT;
    
    // Feed lines before cut
    receipt += this.commands.FEED_LINES(3);
    
    // Cut paper
    receipt += this.commands.CUT_FULL_WITH_FEED;
    
    return receipt;
  }

  // Helper functions
  formatLine(left, right, width) {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, spaces)) + right + '\n';
  }

  printLine(char, width) {
    return char.repeat(width) + '\n';
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
  }

  // Format summary report for thermal printing
  formatSummaryReport(summaryData) {
    try {
      let report = '';
      const data = summaryData?.reportData;
      
      if (!data) {
        throw new Error('No report data provided');
      }
      
      // Initialize printer
      report += this.commands.INIT;
    
    // Header
    report += this.commands.ALIGN_CENTER;
    report += this.commands.BOLD_ON;
    report += this.commands.FONT_SIZE_DOUBLE_HEIGHT;
    report += 'KENNEDY CONVENIENCE\n';
    report += this.commands.FONT_SIZE_NORMAL;
    report += 'SALES SUMMARY REPORT\n';
    report += this.commands.BOLD_OFF;
    report += `${new Date().toLocaleString()}\n`;
    report += `Period: ${data.dateRange}\n`;
    report += this.commands.FEED_LINE;
    
    report += this.commands.ALIGN_LEFT;
    report += this.printLine('=', 32);
    
    // Overall Summary
    report += this.commands.BOLD_ON;
    report += 'OVERALL SUMMARY\n';
    report += this.commands.BOLD_OFF;
    report += this.printLine('-', 32);
    report += this.formatLine('Total Sales:', `$${data.totalSales.toFixed(2)}`, 32);
    report += this.formatLine('Total Transactions:', data.totalTransactions.toString(), 32);
    report += this.formatLine('Average Sale:', `$${data.averageSale.toFixed(2)}`, 32);
    report += this.commands.FEED_LINE;
    
    // Payment Methods
    report += this.commands.BOLD_ON;
    report += 'PAYMENT METHODS\n';
    report += this.commands.BOLD_OFF;
    report += this.printLine('-', 32);
    report += this.formatLine('Cash Sales:', `$${data.cashTotal.toFixed(2)}`, 32);
    report += this.formatLine('Cash Transactions:', data.cashTransactionCount.toString(), 32);
    report += this.formatLine('Card Sales:', `$${data.cardTotal.toFixed(2)}`, 32);
    report += this.formatLine('Card Transactions:', data.cardTransactionCount.toString(), 32);
    report += this.commands.FEED_LINE;
    
    // Lottery (if any)
    if (data.lottoTotal > 0) {
      report += this.commands.BOLD_ON;
      report += 'LOTTERY\n';
      report += this.commands.BOLD_OFF;
      report += this.printLine('-', 32);
      report += this.formatLine('Lottery Sales:', `$${data.lottoTotal.toFixed(2)}`, 32);
      report += this.formatLine('Lottery Transactions:', data.lottoTransactionCount.toString(), 32);
      report += this.commands.FEED_LINE;
    }
    
    // Unpaid Amounts (if any)
    if (data.unpaidTotal > 0) {
      report += this.commands.BOLD_ON;
      report += 'UNPAID AMOUNTS\n';
      report += this.commands.BOLD_OFF;
      report += this.printLine('-', 32);
      report += this.formatLine('Unpaid Total:', `$${data.unpaidTotal.toFixed(2)}`, 32);
      report += this.formatLine('Unpaid Transactions:', data.unpaidTransactionCount.toString(), 32);
      report += this.commands.FEED_LINE;
    }
    
    // Daily Breakdown (last 5 days)
    if (data.dailyBreakdown && data.dailyBreakdown.length > 0) {
      report += this.commands.BOLD_ON;
      report += 'DAILY BREAKDOWN\n';
      report += this.commands.BOLD_OFF;
      report += this.printLine('-', 32);
      
      data.dailyBreakdown.forEach(day => {
        const date = new Date(day.date).toLocaleDateString();
        report += this.commands.BOLD_ON;
        report += `${date}\n`;
        report += this.commands.BOLD_OFF;
        report += this.formatLine('  Sales:', `$${day.totalSales.toFixed(2)}`, 32);
        report += this.formatLine('  Transactions:', day.transactionCount.toString(), 32);
        report += this.commands.FEED_LINE;
      });
    }
    
    // Footer
    report += this.printLine('=', 32);
    report += this.commands.ALIGN_CENTER;
    report += 'END OF REPORT\n';
    report += this.commands.ALIGN_LEFT;
    
    // Feed lines before cut
    report += this.commands.FEED_LINES(3);
    
    // Cut paper
    report += this.commands.CUT_FULL_WITH_FEED;
    
    return report;
    } catch (error) {
      console.error('Error formatting summary report:', error);
      throw new Error(`Failed to format summary report: ${error.message}`);
    }
  }

  // Print summary report to thermal printer
  async printSummaryReport(summaryData) {
    const reportData = this.formatSummaryReport(summaryData);
    
    try {
      // Check if Web Serial API is available
      if ('serial' in navigator) {
        return await this.printViaWebSerial(reportData);
      }
      
      // Fallback: Create a text file for manual printing
      return this.printViaTextFile(reportData, 'summary_report');
      
    } catch (error) {
      console.error('Thermal printing error:', error);
      throw error;
    }
  }

  // Print to thermal printer via browser
  async printThermalReceipt(transaction) {
    const receiptData = this.formatReceipt(transaction);
    
    try {
      // Check if Web Serial API is available
      if ('serial' in navigator) {
        return await this.printViaWebSerial(receiptData);
      }
      
      // Fallback: Create a text file for manual printing
      return this.printViaTextFile(receiptData);
      
    } catch (error) {
      console.error('Thermal printing error:', error);
      throw error;
    }
  }

  // Print via Web Serial API (modern browsers)
  async printViaWebSerial(receiptData) {
    try {
      // Request a port
      const port = await navigator.serial.requestPort({
        filters: [
          { usbVendorId: 0x1CB0 }, // Citizen vendor ID
        ]
      });
      
      // Open the port
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      
      // Write the receipt data
      const writer = port.writable.getWriter();
      const encoder = new TextEncoder();
      await writer.write(encoder.encode(receiptData));
      writer.releaseLock();
      
      // Close the port
      await port.close();
      
      return { success: true, method: 'webserial' };
    } catch (error) {
      console.error('Web Serial printing failed:', error);
      
      // Provide more user-friendly error messages
      if (error.message.includes('No port selected')) {
        throw new Error('No printer port selected. Please connect your Citizen S2000 printer and select the correct port when prompted.');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No compatible printers found. Please check that your Citizen S2000 is connected via USB.');
      } else if (error.name === 'SecurityError') {
        throw new Error('Permission denied. Please allow access to serial ports in your browser settings.');
      } else {
        throw error;
      }
    }
  }

  // Fallback: Create downloadable text file with ESC/POS commands
  printViaTextFile(receiptData, fileType = 'receipt') {
    const blob = new Blob([receiptData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileType}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return { 
      success: true, 
      method: 'file',
      message: `${fileType} file downloaded. Send this file to your printer or copy to printer software.`
    };
  }

  // Alternative: Print via network (if printer has network interface)
  async printViaNetwork(receiptData, printerIP = '192.168.1.100', port = 9100) {
    try {
      const response = await fetch(`http://${printerIP}:${port}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: receiptData
      });
      
      if (response.ok) {
        return { success: true, method: 'network' };
      } else {
        throw new Error(`Network print failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Network printing failed:', error);
      throw error;
    }
  }
}

export default ThermalPrinter;