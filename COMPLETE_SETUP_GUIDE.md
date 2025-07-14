# Complete Setup Guide - Cheat Marketplace Platform

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Getting API Keys & Services](#getting-api-keys--services)
3. [Platform Installation](#platform-installation)
4. [Configuration Guide](#configuration-guide)
5. [Commission & Revenue Setup](#commission--revenue-setup)
6. [First-Time Admin Setup](#first-time-admin-setup)
7. [Managing Sellers](#managing-sellers)
8. [Payment Configuration](#payment-configuration)
9. [Discord Bot Setup](#discord-bot-setup)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v16 or higher): [Download](https://nodejs.org/)
- **MongoDB** (v5.0 or higher): [Download](https://www.mongodb.com/try/download/community)
- **Git**: [Download](https://git-scm.com/)
- **Docker** (optional but recommended): [Download](https://www.docker.com/)

### Required Accounts
- **MongoDB Atlas** (for cloud database) or local MongoDB
- **Litecoin wallet** and payment processor account
- **Email service** (Gmail, SendGrid, etc.)
- **Discord Developer Account** (for bot)
- **Domain name** (for production)

---

## Getting API Keys & Services

### 1. MongoDB Database Setup

#### Option A: MongoDB Atlas (Cloud - Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster:
   - Choose "Shared" (free tier)
   - Select your region
   - Click "Create Cluster"
4. Set up database access:
   - Go to "Database Access"
   - Add new database user
   - Username: `marketplace_admin`
   - Password: Generate secure password
   - Save these credentials!
5. Set up network access:
   - Go to "Network Access"
   - Add IP Address → "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, restrict to your server IP
6. Get connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Your string: `mongodb+srv://marketplace_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cheat-marketplace?retryWrites=true&w=majority`

#### Option B: Local MongoDB
```bash
# Install MongoDB locally
# Windows: Use installer from mongodb.com
# Mac: brew install mongodb-community
# Linux: Follow MongoDB docs for your distro

# Start MongoDB
mongod --dbpath /path/to/data

# Your connection string will be:
mongodb://localhost:27017/cheat-marketplace
```

### 2. Litecoin Payment Setup

#### Option A: CoinPayments (Recommended)
1. Go to [CoinPayments](https://www.coinpayments.net)
2. Create a merchant account
3. Complete verification (KYC required)
4. Go to "Account" → "API Keys"
5. Generate new API keys:
   - **Public Key**: `your_public_key`
   - **Private Key**: `your_private_key`
   - **IPN Secret**: Generate one (for webhooks)
6. Configure IPN Settings:
   - Go to "Account" → "Settings"
   - Set IPN URL: `https://yourdomain.com/api/payments/webhook`
   - Enable "LTC" in accepted coins

#### Option B: BTCPay Server (Self-hosted)
1. Deploy BTCPay Server: [Guide](https://docs.btcpayserver.org/)
2. Create a store
3. Enable Litecoin
4. Get API keys from store settings

#### Getting Your Litecoin Wallet Address
1. **Option 1 - Exchange Wallet** (Easiest):
   - Create account on Binance/Coinbase/Kraken
   - Go to Wallet → Litecoin → Deposit
   - Copy your LTC address
   
2. **Option 2 - Software Wallet**:
   - Download [Exodus](https://www.exodus.com/) or [Electrum-LTC](https://electrum-ltc.org/)
   - Create new wallet
   - Backup seed phrase!
   - Get receive address

3. **Option 3 - Hardware Wallet** (Most Secure):
   - Use Ledger/Trezor
   - Install Litecoin app
   - Get receive address

### 3. Email Service Setup

#### Option A: Gmail (Easy, Limited)
1. Use your Gmail account
2. Enable "Less secure app access" or better:
3. Enable 2FA and create App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → Enable
   - Security → App passwords
   - Generate password for "Mail"
   - Save this password!
4. SMTP Settings:
   ```
   Host: smtp.gmail.com
   Port: 587
   User: your-email@gmail.com
   Pass: your-app-password
   ```

#### Option B: SendGrid (Professional)
1. Go to [SendGrid](https://sendgrid.com/)
2. Create account (100 emails/day free)
3. Verify your email
4. Create API Key:
   - Settings → API Keys → Create
   - Full Access
   - Copy the key!
5. Verify sender:
   - Settings → Sender Authentication
   - Verify your domain or email

#### Option C: Mailgun
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Add and verify your domain
3. Get API credentials from dashboard

### 4. Discord Bot Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Name: "Cheat Marketplace Bot"
4. Go to "Bot" section
5. Click "Add Bot"
6. Configure bot:
   - Username: Your bot name
   - Icon: Upload logo
7. Get token:
   - Click "Reset Token"
   - Copy and save the token!
8. Configure permissions:
   - Under "Privileged Gateway Intents":
     - Enable "Message Content Intent"
9. Generate invite link:
   - Go to "OAuth2" → "URL Generator"
   - Scopes: Select "bot" and "applications.commands"
   - Bot Permissions: Select "Send Messages", "Use Slash Commands"
   - Copy the generated URL
10. Add bot to your Discord server:
    - Open the invite URL
    - Select your server
    - Authorize

---

## Platform Installation

### 1. Clone the Repository
```bash
# Clone the repository
git clone <your-repo-url> cheat-marketplace
cd cheat-marketplace
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file with your values (see Configuration Guide below)
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local file
```

### 4. Discord Bot Setup
```bash
cd ../discord-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env file
```

---

## Configuration Guide

### Backend Configuration (.env)
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (use your MongoDB connection string)
MONGODB_URI=mongodb+srv://marketplace_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cheat-marketplace?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=generate-a-random-64-character-string-here
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Cheat Marketplace <noreply@yoursite.com>

# Litecoin Configuration (CoinPayments example)
LITECOIN_API_KEY=your-coinpayments-private-key
LITECOIN_PUBLIC_KEY=your-coinpayments-public-key
LITECOIN_IPN_SECRET=your-ipn-secret
LITECOIN_WALLET_ADDRESS=your-litecoin-wallet-address

# Commission (15% default)
DEFAULT_COMMISSION_RATE=0.15

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token
BOT_API_KEY=generate-random-api-key-for-bot-auth

# Admin Account (first admin)
ADMIN_EMAIL=admin@yoursite.com
ADMIN_PASSWORD=strong-admin-password
ADMIN_USERNAME=admin
```

### Frontend Configuration (.env.local)
```bash
# API URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Cheat Marketplace
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Litecoin
NEXT_PUBLIC_LITECOIN_PUBLIC_KEY=your-coinpayments-public-key
```

### Discord Bot Configuration (.env)
```bash
# Discord Configuration
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-discord-server-id

# API Configuration
API_URL=http://localhost:5000/api
API_KEY=same-api-key-as-backend-BOT_API_KEY

# Bot Settings
BOT_PREFIX=!
EMBED_COLOR=#0099ff
```

---

## Commission & Revenue Setup

### Understanding the Commission System

The platform takes a percentage cut from each sale. Here's how it works:

1. **Default Commission**: Set in `DEFAULT_COMMISSION_RATE` (0.15 = 15%)
2. **Per-Seller Commission**: Can override default for specific sellers
3. **Revenue Split Example**:
   - Product sells for 10 LTC
   - Commission is 15%
   - Platform gets: 1.5 LTC
   - Seller gets: 8.5 LTC

### Setting Commission Rates

#### 1. Global Default Commission
Edit in backend `.env`:
```bash
DEFAULT_COMMISSION_RATE=0.15  # 15% commission
```

#### 2. Per-Seller Commission (as Admin)
```javascript
// When approving a seller, set their commission:
PUT /api/admin/sellers/:id/approve
{
  "commission": 0.20  // 20% for this specific seller
}
```

#### 3. Commission Ranges
- Minimum: 5% (0.05)
- Maximum: 30% (0.30)
- Recommended: 10-20%

### Accessing Your Revenue

1. **View Platform Earnings**:
   - Login as admin
   - Go to Admin Dashboard
   - View "Total Commission" earned

2. **Withdraw Funds**:
   - Funds accumulate in your Litecoin wallet
   - Check wallet balance regularly
   - Transfer to exchange to convert to fiat

3. **Revenue Reports**:
   - Admin Dashboard → Analytics
   - Export monthly reports
   - Track seller performance

---

## First-Time Admin Setup

### 1. Initialize Admin Account

Run this script after starting the backend:
```bash
cd backend
node scripts/create-admin.js
```

Or manually:
1. Start the backend: `npm run dev`
2. Register a normal account
3. Directly update in MongoDB:
   ```javascript
   // In MongoDB console or Compass
   db.users.updateOne(
     { email: "admin@yoursite.com" },
     { $set: { role: "admin" } }
   )
   ```

### 2. Configure Platform Settings

1. Login as admin
2. Go to `/admin/dashboard`
3. Navigate to Settings
4. Configure:
   - Commission rates
   - Payout frequency
   - Minimum payout amount
   - Supported games list

### 3. Create Initial Categories

Add popular games:
```javascript
POST /api/admin/games
{
  "games": [
    "Counter-Strike 2",
    "Valorant",
    "Apex Legends",
    "Call of Duty",
    "Fortnite",
    "PUBG",
    "Rust",
    "Escape from Tarkov"
  ]
}
```

---

## Managing Sellers

### Seller Approval Process

1. **Seller Registration**:
   - Sellers sign up with business info
   - Provide payout Litecoin address
   - Submit verification documents (optional)

2. **Admin Review**:
   - Go to Admin Dashboard → Pending Sellers
   - Review seller information
   - Set commission rate
   - Approve or reject

3. **Approval API**:
   ```javascript
   PUT /api/admin/sellers/:id/approve
   {
     "commission": 0.15,  // 15% commission for this seller
     "notes": "Verified seller"
   }
   ```

### Setting Seller Commissions

1. **During Approval**:
   - Set individual rate when approving
   - Overrides default commission

2. **Update Existing Seller**:
   ```javascript
   PUT /api/admin/sellers/:id/commission
   {
     "commission": 0.20  // Update to 20%
   }
   ```

3. **Commission Tiers**:
   - New sellers: 20%
   - Established sellers: 15%
   - Premium sellers: 10%

### Product Approval

1. **Enable Product Approval**:
   - All new products require admin approval
   - Prevents scam/low-quality products

2. **Review Process**:
   - Admin Dashboard → Pending Products
   - Check product details
   - Verify screenshots
   - Test download link (if provided)
   - Approve or reject with reason

3. **Freeze Products**:
   - If cheat gets detected
   - If seller violates terms
   - Temporarily disable sales

---

## Payment Configuration

### Setting Up Payment Webhooks

1. **Configure Webhook URL**:
   - CoinPayments: Account → API → IPN Settings
   - Set URL: `https://yourdomain.com/api/payments/webhook`
   - Set IPN Secret

2. **Test Webhooks**:
   ```bash
   # Test webhook locally with ngrok
   npm install -g ngrok
   ngrok http 5000
   # Use ngrok URL for webhook testing
   ```

3. **Webhook Security**:
   - Verify IPN signatures
   - Check payment amounts
   - Validate order IDs

### Payment Flow Configuration

1. **Minimum Order Amount**:
   ```javascript
   // In backend/src/config/payments.js
   MIN_ORDER_AMOUNT: 0.001  // 0.001 LTC minimum
   ```

2. **Payment Timeout**:
   ```javascript
   PAYMENT_TIMEOUT: 3600  // 1 hour to complete payment
   ```

3. **Confirmation Requirements**:
   ```javascript
   REQUIRED_CONFIRMATIONS: 2  // 2 blockchain confirmations
   ```

---

## Discord Bot Setup

### 1. Deploy Bot Commands

```bash
cd discord-bot
npm run deploy-commands
```

### 2. Configure Bot Permissions

In your Discord server:
1. Create a role for the bot
2. Give permissions:
   - Send Messages
   - Use Slash Commands
   - Embed Links
   - Read Message History

### 3. Set Up Seller Roles

1. Create a "Seller" role in Discord
2. Assign to verified sellers
3. Bot commands only work for users with this role

### 4. Link Discord to Platform

Sellers link their Discord:
```javascript
POST /api/seller/link-discord
{
  "discordId": "123456789",
  "discordUsername": "seller#1234"
}
```

---

## Production Deployment

### 1. Domain Setup

1. Buy domain from Namecheap/GoDaddy
2. Point to your server:
   ```
   A Record: @ → Your-Server-IP
   A Record: www → Your-Server-IP
   ```

### 2. SSL Certificate

```bash
# Install Certbot
sudo apt-get install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 4. Process Management (PM2)

```bash
# Install PM2
npm install -g pm2

# Start services
cd backend && pm2 start src/app.js --name marketplace-api
cd ../frontend && pm2 start npm --name marketplace-frontend -- start
cd ../discord-bot && pm2 start src/index.js --name marketplace-bot

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Environment Variables for Production

Update all `.env` files:
- Change URLs to production domain
- Use strong passwords
- Enable production mode
- Set secure JWT secrets

---

## Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Check connection string
   - Verify network access in Atlas
   - Check username/password

2. **Email Not Sending**
   - Verify SMTP settings
   - Check app password (not regular password)
   - Look for firewall blocking port 587

3. **Payment Webhook Not Working**
   - Verify webhook URL is accessible
   - Check IPN secret matches
   - Look at webhook logs in payment processor

4. **Discord Bot Not Responding**
   - Check bot token is correct
   - Verify bot has proper permissions
   - Check if bot is online in server

5. **Commission Not Calculating**
   - Verify seller has commission rate set
   - Check DEFAULT_COMMISSION_RATE is decimal (0.15 not 15)

### Getting Help

1. **Check Logs**:
   ```bash
   # Backend logs
   pm2 logs marketplace-api
   
   # Frontend logs
   pm2 logs marketplace-frontend
   
   # Bot logs
   pm2 logs marketplace-bot
   ```

2. **Database Issues**:
   - Use MongoDB Compass to inspect data
   - Check for missing indexes
   - Verify data structure

3. **Payment Issues**:
   - Check payment processor dashboard
   - Verify API keys are correct
   - Test with small amounts first

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secret (64+ characters)
- [ ] Enable MongoDB authentication
- [ ] Restrict MongoDB network access
- [ ] Use HTTPS in production
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Backup database regularly
- [ ] Monitor for suspicious activity

---

## Maintenance Tasks

### Daily
- Check for new seller applications
- Review pending products
- Monitor payment issues
- Check Discord bot status

### Weekly
- Review platform analytics
- Process seller payouts
- Update detected cheat statuses
- Backup database

### Monthly
- Security updates
- Performance optimization
- Review commission rates
- Generate revenue reports

---

This completes the full setup guide. Follow each section carefully, and you'll have a fully functional cheat marketplace with automated commission handling and complete seller management.
