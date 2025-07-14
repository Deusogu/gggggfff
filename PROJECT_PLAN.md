# Cheat Marketplace Platform - Development Plan

## Project Structure
```
cheat-marketplace/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── litecoin.js
│   │   │   └── jwt.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Order.js
│   │   │   ├── LicenseKey.js
│   │   │   └── Transaction.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── productController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   └── adminController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── products.js
│   │   │   ├── orders.js
│   │   │   ├── payments.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── emailService.js
│   │   │   ├── licenseService.js
│   │   │   └── paymentService.js
│   │   └── app.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Auth/
│   │   │   ├── Marketplace/
│   │   │   ├── Purchase/
│   │   │   ├── Seller/
│   │   │   └── Admin/
│   │   ├── pages/
│   │   │   ├── index.js
│   │   │   ├── marketplace.js
│   │   │   ├── purchase-confirmation.js
│   │   │   ├── seller-dashboard.js
│   │   │   └── admin.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── auth.js
│   │   │   └── payment.js
│   │   ├── context/
│   │   │   └── AuthContext.js
│   │   └── styles/
│   ├── package.json
│   └── next.config.js
├── discord-bot/
│   ├── src/
│   │   ├── commands/
│   │   │   ├── setstatus.js
│   │   │   ├── addkeys.js
│   │   │   ├── checkstock.js
│   │   │   ├── sales.js
│   │   │   ├── earnings.js
│   │   │   ├── updatelinks.js
│   │   │   └── updatesupport.js
│   │   ├── utils/
│   │   │   └── api.js
│   │   └── index.js
│   ├── package.json
│   └── .env.example
└── docker-compose.yml
```

## Database Schema

### Users Collection/Table
```javascript
{
  _id: ObjectId,
  email: String,
  password: String (hashed),
  username: String,
  role: String (buyer/seller/admin),
  isVerified: Boolean,
  sellerInfo: {
    businessName: String,
    payoutAddress: String,
    commission: Number,
    totalEarnings: Number,
    pendingEarnings: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Products Collection/Table
```javascript
{
  _id: ObjectId,
  sellerId: ObjectId,
  name: String,
  description: String,
  game: String,
  price: Number,
  duration: String,
  status: String (undetected/detected/updating),
  screenshots: [String],
  instruction_url: String,
  support_contact: String,
  rating: Number,
  totalReviews: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection/Table
```javascript
{
  _id: ObjectId,
  orderId: String,
  buyerId: ObjectId,
  sellerId: ObjectId,
  productId: ObjectId,
  amount: Number,
  total: Number,
  commission: Number,
  paymentMethod: String,
  paymentStatus: String,
  transactionId: String,
  license_key: String,
  purchaseDate: Date,
  email: String
}
```

### LicenseKeys Collection/Table
```javascript
{
  _id: ObjectId,
  productId: ObjectId,
  sellerId: ObjectId,
  key: String,
  isUsed: Boolean,
  orderId: ObjectId,
  createdAt: Date,
  usedAt: Date
}
```

## Implementation Steps

1. **Backend Setup**
   - Initialize Node.js/Express project
   - Set up MongoDB connection
   - Create database models
   - Implement JWT authentication
   - Create API endpoints
   - Integrate Litecoin payment gateway
   - Set up email notifications

2. **Frontend Development**
   - Initialize Next.js project
   - Create authentication system
   - Build marketplace UI
   - Implement purchase flow
   - Create seller dashboard
   - Build admin panel

3. **Discord Bot**
   - Set up Discord.js bot
   - Implement commands
   - Connect to backend API

4. **Security Implementation**
   - Input validation
   - Rate limiting
   - CORS configuration
   - Environment variables
   - SSL/TLS setup

5. **Testing & Deployment**
   - Unit tests
   - Integration tests
   - Docker configuration
   - CI/CD pipeline
