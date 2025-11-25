# Payment Terminal Integration Guide

## Overview
This guide shows how to connect physical payment terminals to your POS system. The integration supports multiple payment processors popular in Canada and worldwide.

## Supported Payment Processors

### 1. **Square Terminal** 🟦
**Best for:** Small to medium businesses, easy setup
**Hardware:** Square Terminal, Square Register
**Fees:** 2.65% + 10¢ per transaction
```bash
# Install Square SDK
npm install squareup

# Environment variables needed:
SQUARE_ACCESS_TOKEN=your_access_token
SQUARE_TERMINAL_DEVICE_ID=your_device_id
```

### 2. **Stripe Terminal** 🟣  
**Best for:** Tech-savvy businesses, custom integration
**Hardware:** BBPOS WisePad 3, Verifone P400
**Fees:** 2.9% + 30¢ per transaction
```bash
# Install Stripe Terminal SDK
npm install @stripe/terminal-js

# Environment variables needed:
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### 3. **Moneris** 🇨🇦
**Best for:** Canadian businesses, established processor
**Hardware:** Moneris terminals (ICT220, ICT250, etc.)
**Fees:** Varies by merchant agreement
```bash
# Environment variables needed:
MONERIS_STORE_ID=your_store_id
MONERIS_API_TOKEN=your_api_token
MONERIS_TERMINAL_ID=your_terminal_id
```

### 4. **PayPal Zettle** 💙
**Best for:** PayPal merchants, international
**Hardware:** PayPal Chip and Tap Reader
**Fees:** 2.29% per transaction

### 5. **Clover** 🍀
**Best for:** Restaurant/retail, all-in-one solutions
**Hardware:** Clover Station, Clover Mini, Clover Flex
**Fees:** Varies by plan

## Setup Instructions

### Step 1: Choose Your Payment Processor
1. **Research fees** - Compare transaction fees, monthly costs, hardware costs
2. **Check availability** - Ensure the processor operates in your region
3. **Consider integration complexity** - Some are easier to set up than others
4. **Hardware requirements** - Check what terminals are supported

### Step 2: Get Developer Credentials
Each processor requires API credentials:

**Square:**
1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Create application
3. Get Access Token and Application ID
4. Set up webhook endpoints for payment notifications

**Stripe:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get API keys from Developers > API keys
3. Set up webhook endpoints
4. Configure terminal settings

**Moneris:**
1. Contact Moneris to get API credentials
2. Get Store ID and API Token
3. Register terminal device IDs

### Step 3: Install Required Packages
```bash
# For Square
npm install squareup

# For Stripe  
npm install @stripe/terminal-js stripe

# For Moneris (custom implementation)
npm install axios

# For PayPal
npm install @paypal/checkout-server-sdk

# For Clover
npm install axios
```

### Step 4: Configure Environment Variables
Create `.env.local` file in your project root:
```env
# Copy from .env.example and fill in your values
PAYMENT_PROCESSOR=square  # or stripe, moneris, etc.
SQUARE_ACCESS_TOKEN=your_token_here
SQUARE_TERMINAL_DEVICE_ID=your_device_id_here
```

### Step 5: Hardware Setup
1. **Obtain terminal hardware** from your chosen processor
2. **Connect terminal** to power and internet (WiFi or Ethernet)
3. **Register device** with processor (get device ID)
4. **Test connection** using processor's test tools

### Step 6: Test Integration
1. Use demo/sandbox mode first
2. Test with small amounts ($0.01, $1.00)
3. Verify transaction appears in processor dashboard
4. Test error scenarios (declined cards, network issues)
5. Switch to production when testing is complete

## Code Integration

### Basic Terminal Button (Already Added)
The POS system now includes a "💳 Terminal" button that:
- Calculates total amount automatically
- Handles payment processing
- Updates payment fields on success
- Shows error messages on failure

### API Endpoint
Terminal payments are processed through `/api/terminal` which:
- Accepts amount and processor type
- Handles different payment processor APIs
- Returns standardized response format
- Includes error handling and logging

### Payment Flow
1. **User clicks Terminal button**
2. **System calculates total** (items + tax + fees - discounts)
3. **API call made** to selected processor
4. **Terminal prompts** for card presentation
5. **Payment processed** by terminal
6. **Result returned** to POS system
7. **Transaction completed** automatically on success

## Security Considerations

### PCI Compliance
- **Never store card data** in your system
- **Use processor's secure APIs** only
- **Terminal handles** all sensitive card data
- **Keep software updated** regularly

### API Security
- **Use HTTPS only** for all API calls
- **Store credentials** in environment variables
- **Validate all inputs** before processing
- **Log transactions** for audit trail

### Network Security
- **Secure WiFi** for terminal connection
- **Firewall rules** to protect API endpoints
- **VPN recommended** for remote locations
- **Regular security audits**

## Troubleshooting

### Common Issues
1. **Terminal not connecting**
   - Check internet connection
   - Verify device ID in dashboard
   - Restart terminal device

2. **API authentication errors**
   - Verify credentials in .env.local
   - Check sandbox vs production settings
   - Ensure API permissions are correct

3. **Payment declined**
   - Normal for test cards in production
   - Check card details and limits
   - Verify processor account status

4. **Timeout errors**
   - Increase timeout settings
   - Check network stability
   - Contact processor support

### Getting Help
- **Square:** [Square Developer Support](https://developer.squareup.com/support)
- **Stripe:** [Stripe Terminal Documentation](https://stripe.com/docs/terminal)
- **Moneris:** Contact Moneris technical support
- **PayPal:** [PayPal Developer Support](https://developer.paypal.com/support/)

## Next Steps

1. **Choose your processor** based on your business needs
2. **Sign up for developer account** with chosen processor
3. **Order terminal hardware** (if not already available)
4. **Set up test environment** using sandbox credentials
5. **Test thoroughly** before going live
6. **Train staff** on new terminal procedures
7. **Go live** and monitor transactions

## Cost Comparison (Canada)

| Processor | Transaction Fee | Monthly Fee | Terminal Cost | Setup |
|-----------|----------------|-------------|---------------|-------|
| Square | 2.65% + 10¢ | $0 | $299-$899 | Easy |
| Stripe | 2.9% + 30¢ | $0 | $149-$399 | Medium |
| Moneris | 2.65%+ | $10-30 | $200-$500 | Medium |
| PayPal | 2.29% | $0 | $79-$179 | Easy |
| Clover | 2.3%+ | $14.95+ | $199-$1649 | Hard |

*Fees are approximate and may vary by merchant volume and agreement*