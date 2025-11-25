# Chase Terminal Setup Guide

## Overview
This guide helps you integrate your existing Chase payment terminal with the POS system using Chase Paymentech (now Chase Merchant Services).

## 🏦 Chase Terminal Integration

### What You'll Need
1. **Chase Merchant Account** - Active merchant services account
2. **Terminal Device** - Your existing Chase terminal
3. **API Credentials** - Provided by Chase technical support
4. **Terminal ID** - Found on your terminal or merchant statement

### Step 1: Gather Chase Credentials

Contact Chase Merchant Services to get:
- **Merchant ID** - Your unique merchant identifier
- **API Key/Password** - For API authentication  
- **Terminal ID** - Your specific terminal device ID
- **API Endpoint URL** - Usually `https://orbital1.paymentech.net/`

**Chase Support:** 1-800-CHASE-PAYMENTECH (1-800-242-7372)

### Step 2: Configure Environment Variables

Create or update your `.env.local` file:
```env
# Chase Paymentech Configuration
CHASE_MERCHANT_ID=123456789
CHASE_API_KEY=your_api_key_here
CHASE_TERMINAL_ID=001
CHASE_API_URL=https://orbital1.paymentech.net/authorize

# Set Chase as default processor
PAYMENT_PROCESSOR=chase
CURRENCY=USD  # or CAD for Canadian merchants
```

### Step 3: Terminal Setup

#### Physical Terminal Setup:
1. **Power on** your Chase terminal
2. **Connect** to internet (Ethernet or WiFi)
3. **Verify connection** - terminal should show "Ready" or similar
4. **Note terminal ID** - usually displayed on startup or in settings

#### Network Requirements:
- **Stable internet connection** (minimum 1 Mbps)
- **Open ports** for Chase API (usually 443/HTTPS)
- **Firewall exceptions** for Chase endpoints

### Step 4: Test Integration

#### Test Mode (Sandbox):
Chase provides test credentials for development:
```env
# Test credentials (replace with real ones from Chase)
CHASE_MERCHANT_ID=000001
CHASE_API_KEY=test_api_key
CHASE_TERMINAL_ID=001
CHASE_API_URL=https://orbitalvar1.paymentech.net/authorize
```

#### Testing Steps:
1. **Start POS system** - `npm run dev`
2. **Add test items** to cart
3. **Click "💳 Terminal" button**
4. **Follow terminal prompts**
5. **Use test card numbers** provided by Chase
6. **Verify transaction** in Chase merchant portal

### Step 5: Common Chase Test Cards

| Card Type | Number | CVV | Exp |
|-----------|--------|-----|-----|
| Visa | 4788250000028291 | 123 | 12/25 |
| Mastercard | 5454545454545454 | 123 | 12/25 |
| Amex | 371449635398431 | 1234 | 12/25 |
| Discover | 6011000000000012 | 123 | 12/25 |

### Step 6: Go Live

#### Switch to Production:
1. **Get production credentials** from Chase
2. **Update `.env.local`** with live credentials
3. **Change API URL** to production endpoint
4. **Test with real card** (small amount first)
5. **Verify in Chase merchant portal**

#### Production Environment:
```env
# Production settings
CHASE_MERCHANT_ID=your_real_merchant_id
CHASE_API_KEY=your_real_api_key
CHASE_TERMINAL_ID=your_real_terminal_id
CHASE_API_URL=https://orbital1.paymentech.net/authorize
```

## 🔧 Chase Terminal Types

### Supported Terminal Models:
- **Chase Freedom Flex** - Countertop terminal
- **Chase Freedom Mobile** - Portable terminal  
- **Chase Integrated** - Built-in terminal solutions
- **Chase Virtual Terminal** - Software-based processing

### Terminal Features:
- ✅ **EMV Chip** - Secure chip card processing
- ✅ **Contactless/NFC** - Tap-to-pay (Apple Pay, Google Pay)
- ✅ **Magnetic Stripe** - Traditional swipe cards
- ✅ **PIN Debit** - PIN-based debit transactions
- ✅ **Signature** - Signature capture for credit cards

## 🔐 Security & Compliance

### PCI Compliance:
Chase terminals are **PCI DSS certified**, ensuring:
- **End-to-end encryption** of card data
- **Secure key management** 
- **Regular security updates**
- **Compliance reporting**

### Data Security:
- **No card data** stored in POS system
- **Tokenization** for recurring payments
- **TLS encryption** for all API calls
- **Audit trails** for all transactions

## 💰 Chase Pricing (Typical)

| Transaction Type | Fee Structure |
|-----------------|---------------|
| **Credit Cards** | 2.6% + $0.10 |
| **Debit Cards** | $0.25 per transaction |
| **Contactless** | Same as credit/debit |
| **Monthly Fee** | $9.95 - $24.95 |
| **Terminal Rental** | $15 - $35/month |

*Actual rates vary by merchant agreement and processing volume*

## 🆘 Troubleshooting

### Common Issues:

#### 1. "Terminal Not Found"
- **Check terminal ID** in environment variables
- **Verify terminal is powered on** and connected
- **Confirm network connectivity**
- **Contact Chase** to verify terminal registration

#### 2. "Authentication Failed"
- **Double-check merchant ID** and API key
- **Ensure no extra spaces** in credentials
- **Verify API endpoint URL** is correct
- **Check if credentials are for test vs production**

#### 3. "Transaction Declined"
- **Normal behavior** for invalid test cards in production
- **Check card expiration** and CVV
- **Verify sufficient funds** (for real transactions)
- **Review Chase merchant portal** for decline reasons

#### 4. "Network Error"
- **Check internet connection** stability
- **Verify firewall settings** allow Chase endpoints
- **Test with different network** if available
- **Contact IT support** for network configuration

### Getting Help:

#### Chase Support:
- **Technical Support:** 1-800-242-7372
- **Merchant Services:** 1-800-935-9935
- **24/7 Support:** Available for critical issues
- **Online Portal:** [Chase Merchant Services](https://www.chase.com/business/payments)

#### POS System Support:
- **Check logs** in browser developer console
- **Review API responses** for error details  
- **Test in demo mode** first
- **Contact your developer** for custom integration issues

## ✅ Checklist

Before going live, ensure:
- [ ] Chase merchant account is active
- [ ] Terminal is connected and showing "Ready"
- [ ] API credentials are configured correctly
- [ ] Test transactions work in sandbox mode
- [ ] Production credentials are obtained from Chase
- [ ] Small live transaction tested successfully
- [ ] Staff trained on terminal procedures
- [ ] Backup payment method available

## 📞 Support Contacts

- **Chase Technical Support:** 1-800-242-7372
- **Chase Merchant Services:** 1-800-935-9935  
- **Emergency After Hours:** 1-800-242-7372
- **Online Help:** [merchant.chase.com](https://merchant.chase.com)

Your Chase terminal is now integrated with the POS system! The terminal will handle all card data securely while the POS manages inventory, receipts, and reporting.