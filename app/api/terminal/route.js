import { NextResponse } from 'next/server';

// Payment Terminal Integration API
// Supports multiple payment processors: Square, Stripe, Moneris, etc.

export async function POST(request) {
  try {
    const { amount, processor, terminalId } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!processor) {
      return NextResponse.json({ error: 'Payment processor not specified' }, { status: 400 });
    }

    let result;

    switch (processor.toLowerCase()) {
      case 'square':
        result = await processSquareTerminal(amount, terminalId);
        break;
      
      case 'stripe':
        result = await processStripeTerminal(amount, terminalId);
        break;
      
      case 'moneris':
        result = await processMonerisTerminal(amount, terminalId);
        break;
      
      case 'chase':
      case 'paymentech':
        result = await processChaseTerminal(amount, terminalId);
        break;
      
      case 'demo':
      default:
        result = await processDemoTerminal(amount);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Terminal payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed', details: error.message }, 
      { status: 500 }
    );
  }
}

// Square Terminal Integration
async function processSquareTerminal(amount, terminalId) {
  // For now, return demo response since Square SDK is not installed
  // To enable: npm install squareup and configure credentials
  throw new Error('Square integration not available. Install Square SDK with: npm install squareup');
}

// Stripe Terminal Integration
async function processStripeTerminal(amount, terminalId) {
  // For now, return error since Stripe SDK is not installed
  // To enable: npm install stripe and configure credentials
  throw new Error('Stripe integration not available. Install Stripe SDK with: npm install stripe');
}

// Moneris Terminal Integration (Popular in Canada)
async function processMonerisTerminal(amount, terminalId) {
  try {
    // Moneris API integration
    const monerisRequest = {
      store_id: process.env.MONERIS_STORE_ID,
      api_token: process.env.MONERIS_API_TOKEN,
      transaction_type: 'purchase',
      amount: amount.toFixed(2),
      terminal_id: terminalId || process.env.MONERIS_TERMINAL_ID,
      order_id: `POS${Date.now()}`
    };

    // Note: Replace with actual Moneris API call
    const response = await fetch('https://esqa.moneris.com/gateway2/servlet/MpgRequest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(monerisRequest)
    });

    const result = await response.json();

    return {
      success: result.ResponseCode === '00' || result.ResponseCode === '000',
      processor: 'moneris',
      transactionId: result.TransID,
      responseCode: result.ResponseCode,
      message: result.Message,
      amount: amount
    };
  } catch (error) {
    throw new Error(`Moneris Terminal Error: ${error.message}`);
  }
}

// Chase Paymentech Terminal Integration
async function processChaseTerminal(amount, terminalId) {
  try {
    // Chase Paymentech API integration
    const chaseRequest = {
      // Authentication
      merchantId: process.env.CHASE_MERCHANT_ID,
      terminalId: terminalId || process.env.CHASE_TERMINAL_ID,
      apiKey: process.env.CHASE_API_KEY,
      
      // Transaction details
      transactionType: 'SALE',
      amount: (amount * 100).toString(), // Convert to cents
      currency: 'USD', // or 'CAD' for Canadian merchants
      
      // Additional fields
      orderId: `POS${Date.now()}`,
      timestamp: new Date().toISOString(),
      
      // Terminal specific
      terminalCapability: 'CHIP_AND_PIN',
      entryMode: 'CHIP' // Will be determined by terminal
    };

    // Chase Paymentech API endpoint (varies by integration type)
    const apiUrl = process.env.CHASE_API_URL || 'https://orbital1.paymentech.net/authorize';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml', // Chase often uses XML
        'Authorization': `Bearer ${process.env.CHASE_API_KEY}`,
        'X-Merchant-ID': process.env.CHASE_MERCHANT_ID
      },
      body: buildChaseXMLRequest(chaseRequest)
    });

    const responseText = await response.text();
    const result = parseChaseResponse(responseText);

    if (result.responseCode === '000' || result.responseCode === '00') {
      return {
        success: true,
        processor: 'chase',
        transactionId: result.transactionId,
        authCode: result.authorizationCode,
        responseCode: result.responseCode,
        message: result.responseMessage,
        cardType: result.cardType,
        last4: result.last4Digits,
        amount: amount,
        terminalId: terminalId
      };
    } else {
      throw new Error(`Chase Terminal Error: ${result.responseMessage} (Code: ${result.responseCode})`);
    }
  } catch (error) {
    throw new Error(`Chase Terminal Error: ${error.message}`);
  }
}

// Helper function to build Chase XML request
function buildChaseXMLRequest(request) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Request>
  <NewOrder>
    <OrbitalConnectionUsername>${request.merchantId}</OrbitalConnectionUsername>
    <OrbitalConnectionPassword>${request.apiKey}</OrbitalConnectionPassword>
    <IndustryType>EC</IndustryType>
    <MessageType>AC</MessageType>
    <MerchantID>${request.merchantId}</MerchantID>
    <TerminalID>${request.terminalId}</TerminalID>
    <CardBrand>CC</CardBrand>
    <AccountNum>TERMINAL_INPUT</AccountNum>
    <OrderID>${request.orderId}</OrderID>
    <Amount>${request.amount}</Amount>
    <CustomerRefNum>${request.orderId}</CustomerRefNum>
  </NewOrder>
</Request>`;
}

// Helper function to parse Chase XML response
function parseChaseResponse(xmlResponse) {
  // Simple XML parsing - in production, use proper XML parser
  const getXMLValue = (xml, tag) => {
    const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
  };

  return {
    responseCode: getXMLValue(xmlResponse, 'ProcStatus'),
    responseMessage: getXMLValue(xmlResponse, 'StatusMsg'),
    transactionId: getXMLValue(xmlResponse, 'TxRefNum'),
    authorizationCode: getXMLValue(xmlResponse, 'AuthCode'),
    cardType: getXMLValue(xmlResponse, 'CardBrand'),
    last4Digits: getXMLValue(xmlResponse, 'AccountNum')?.slice(-4) || '0000'
  };
}

// Demo Terminal (for testing)
async function processDemoTerminal(amount) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          processor: 'demo',
          transactionId: `DEMO${Date.now()}`,
          amount: amount,
          cardType: ['Visa', 'Mastercard', 'Amex'][Math.floor(Math.random() * 3)],
          last4: String(Math.floor(Math.random() * 9999)).padStart(4, '0'),
          method: ['chip', 'tap', 'swipe'][Math.floor(Math.random() * 3)],
          approvalCode: String(Math.floor(Math.random() * 999999)).padStart(6, '0')
        });
      } else {
        reject(new Error('Payment declined - Insufficient funds'));
      }
    }, 1500); // Simulate processing time
  });
}