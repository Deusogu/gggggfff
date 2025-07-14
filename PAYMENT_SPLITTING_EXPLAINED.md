# 💰 Payment Splitting Explained - Cheat Marketplace

## How Payment Splitting Works

The current implementation uses an **escrow-based system** where payments are collected to a single wallet and then distributed. Here's how it works:

### 🔄 Payment Flow

1. **Customer Makes Payment**
   - Customer pays the full amount to YOUR Litecoin wallet
   - Payment goes to a single address generated for that order
   - The system tracks which payment belongs to which order

2. **Payment Verification**
   - CoinPayments (or your payment processor) sends a webhook when payment is confirmed
   - System verifies the payment amount matches the order
   - After 3 confirmations, payment is marked as complete

3. **Commission Calculation**
   - When order is created, commission is calculated:
   ```javascript
   const commission = product.price * 0.15; // 15% default
   const sellerEarnings = product.price - commission;
   ```
   - This is stored in the order record

4. **Earnings Tracking**
   - Seller's earnings are added to their `pendingEarnings` balance
   - Platform keeps track of total commission earned
   - No automatic split happens at payment time

### 📊 Current System Architecture

```
Customer Payment (100%)
         ↓
Your Platform Wallet
         ↓
    [Tracked in Database]
         ↓
┌─────────────────┬──────────────────┐
│ Seller Earnings │ Your Commission  │
│      (85%)      │      (15%)       │
└─────────────────┴──────────────────┘
         ↓                  ↓
  Pending Balance    Platform Revenue
         ↓
  Manual Payout
```

### 🏦 Payout Process

Currently, sellers request payouts manually:
1. Seller clicks "Request Payout" in dashboard
2. System checks minimum payout amount (0.1 LTC)
3. Admin manually processes the payout
4. Seller receives their earnings minus any fees

## 🚀 Automatic Payment Splitting Options

To automatically split payments, you have several options:

### Option 1: Smart Contract (Most Automated)
Use a blockchain smart contract that automatically splits incoming payments:
- **Pros**: Fully automated, transparent, trustless
- **Cons**: Requires smart contract development, higher fees
- **Best for**: High-volume platforms

### Option 2: Payment Processor Split (Recommended)
Many crypto payment processors offer automatic splitting:

**CoinPayments Business Account Features:**
- Set up multiple wallets
- Configure automatic forwarding rules
- Split payments by percentage
- API for managing splits

**Implementation:**
```javascript
// Example with CoinPayments API
const payment = await coinpayments.createTransaction({
  amount: product.price,
  currency: 'LTC',
  buyer_email: email,
  // Split configuration
  split_payments: [
    {
      address: sellerWallet,
      percentage: 85
    },
    {
      address: platformWallet,
      percentage: 15
    }
  ]
});
```

### Option 3: Automated Payout System
Keep current architecture but automate payouts:

```javascript
// Add to a scheduled job (runs every hour)
async function processAutomaticPayouts() {
  const sellers = await User.find({
    'sellerInfo.pendingEarnings': { $gte: 0.1 }, // Min payout
    'sellerInfo.payoutAddress': { $exists: true }
  });

  for (const seller of sellers) {
    try {
      // Send LTC to seller
      const tx = await litecoinClient.sendToAddress(
        seller.sellerInfo.payoutAddress,
        seller.sellerInfo.pendingEarnings
      );
      
      // Update database
      seller.sellerInfo.pendingEarnings = 0;
      seller.sellerInfo.withdrawnEarnings += amount;
      await seller.save();
      
      // Log transaction
      await PayoutLog.create({
        sellerId: seller._id,
        amount,
        transactionId: tx,
        status: 'completed'
      });
    } catch (error) {
      console.error('Payout failed:', error);
    }
  }
}
```

### Option 4: Multi-Signature Wallets
Use multi-sig wallets for shared control:
- Requires both platform and seller signatures
- More complex but very secure
- Good for high-value transactions

## 🛠️ Implementing Automatic Splits

### Step 1: Choose Your Method
For most platforms, **Option 2 (Payment Processor Split)** is best because:
- No manual work needed
- Instant payments to sellers
- Lower trust requirements
- Built-in reporting

### Step 2: Update Payment Service
Modify `backend/src/services/paymentService.js`:

```javascript
async createPaymentAddress(orderId, amount, sellerWallet) {
  const order = await Order.findById(orderId).populate('sellerId');
  
  // Create split payment
  const payment = await this.client.createTransaction({
    amount: amount,
    currency1: 'LTC',
    currency2: 'LTC',
    buyer_email: order.email,
    custom: orderId,
    ipn_url: `${process.env.API_URL}/api/payments/webhook`,
    // Automatic split
    auto_confirm: 1,
    split_payments: [
      {
        address: sellerWallet,
        percentage: 85,
        memo: `Payment for order ${orderId}`
      },
      {
        address: process.env.PLATFORM_WALLET,
        percentage: 15,
        memo: `Commission for order ${orderId}`
      }
    ]
  });
  
  return payment;
}
```

### Step 3: Update Order Creation
Modify the order creation to include seller's wallet:

```javascript
// In createOrder function
const seller = await User.findById(product.sellerId);
if (!seller.sellerInfo.payoutAddress) {
  // Handle missing wallet
  return res.status(400).json({
    message: 'Seller has not configured payout address'
  });
}

const paymentDetails = await paymentService.createPaymentAddress(
  order._id, 
  product.price,
  seller.sellerInfo.payoutAddress
);
```

## 💡 Best Practices

1. **Always Validate Wallets**
   - Check wallet addresses are valid before creating orders
   - Require sellers to verify their wallets

2. **Handle Edge Cases**
   - What if seller changes wallet after order?
   - What if payment is partial?
   - What about refunds?

3. **Keep Detailed Logs**
   ```javascript
   const PaymentSplit = new Schema({
     orderId: ObjectId,
     totalAmount: Number,
     splits: [{
       recipient: String,
       address: String,
       amount: Number,
       percentage: Number,
       transactionId: String,
       status: String
     }],
     createdAt: Date
   });
   ```

4. **Provide Transparency**
   - Show sellers exactly how much they'll receive
   - Display fees clearly before purchase
   - Provide detailed transaction history

## 🔒 Security Considerations

1. **Never Store Private Keys**
   - Use HD wallets for generating addresses
   - Keep private keys in secure hardware

2. **Validate Everything**
   - Check amounts match
   - Verify wallet addresses
   - Confirm seller identity

3. **Rate Limiting**
   - Limit payout requests
   - Prevent withdrawal spam
   - Monitor for suspicious activity

## 📈 Recommended Setup

For a production marketplace, I recommend:

1. **Use CoinPayments Business Account**
   - Automatic splitting
   - Good API support
   - Handles multiple cryptocurrencies

2. **Set Up Monitoring**
   - Track failed payments
   - Monitor payout delays
   - Alert on large transactions

3. **Implement Fallbacks**
   - Manual payout option
   - Support ticket system
   - Emergency wallet switching

## 🚨 Important Notes

- The current system requires **manual payouts** by admin
- All payments go to **one wallet** initially
- Sellers must **request withdrawals**
- Consider legal/tax implications of holding funds

To implement automatic splitting, you'll need to:
1. Upgrade your payment processor account
2. Update the payment service code
3. Ensure all sellers have valid payout addresses
4. Test thoroughly with small amounts first

Would you like me to implement any of these automatic splitting options?
