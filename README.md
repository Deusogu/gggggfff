# Fail.ac - Game Enhancement Marketplace Platform

A complete marketplace platform for game cheat resellers with cryptocurrency payments, Discord bot integration, and comprehensive seller/buyer management.

## Features

### For Buyers
- Browse marketplace with search/filter capabilities
- Purchase cheats with Litecoin payments
- Automatic license key delivery
- Order history and purchase confirmations
- Review/rating system

### For Sellers
- Product listing management
- License key bulk upload system
- Real-time inventory management
- Sales analytics dashboard
- Earnings tracking and payout requests
- Discord bot for remote management

### Platform Features
- JWT-based authentication
- Litecoin payment integration
- Automated escrow system
- Email notification system
- Admin panel for platform management
- Discord bot with seller commands

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB
- **Frontend**: Next.js, React, Tailwind CSS
- **Payment**: Litecoin integration
- **Bot**: Discord.js
- **Authentication**: JWT

## Project Structure

```
cheat-marketplace/
├── backend/           # Express.js API server
├── frontend/          # Next.js web application
├── discord-bot/       # Discord bot for sellers
└── docker-compose.yml # Docker configuration
```

## Installation

### Prerequisites
- Node.js 16+
- MongoDB
- Discord Bot Token
- Litecoin API credentials

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

### Discord Bot Setup

1. Navigate to discord-bot directory:
```bash
cd discord-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Configure Discord bot token and API credentials

5. Start the bot:
```bash
npm start
```

## Discord Bot Commands

- `/setstatus [cheat-id] [status]` - Update cheat status
- `/addkeys [cheat-id] [keys]` - Add license keys (comma-separated)
- `/checkstock [cheat-id]` - View remaining license count
- `/sales` - View recent sales summary
- `/earnings` - Check current earnings
- `/updatelinks [cheat-id] [instruction-url]` - Update instruction/loader link
- `/updatesupport [cheat-id] [support-contact]` - Update support contact

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (seller)
- `PUT /api/products/:id` - Update product (seller)
- `DELETE /api/products/:id` - Delete product (seller)

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/my-purchases` - Get buyer orders
- `GET /api/orders/my-sales` - Get seller orders

### Payments
- `GET /api/payments/order/:orderId` - Get payment details
- `POST /api/payments/webhook` - Payment webhook
- `GET /api/payments/ltc-price` - Get current LTC price

## Database Schema

### Users
- Email, username, password (hashed)
- Role (buyer/seller/admin)
- Seller info (business name, payout address, earnings)
- Verification status

### Products
- Name, description, game, price, duration
- Status (undetected/detected/updating)
- Screenshots, instruction URL, support contact
- Stock count, ratings

### Orders
- Order ID, buyer/seller IDs, product ID
- Payment details (amount, status, transaction ID)
- License key
- Timestamps

### License Keys
- Product ID, seller ID
- Key value, usage status
- Assignment details

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting
- Input validation
- CORS configuration
- Environment variable protection

## Payment Flow

1. Buyer creates order
2. System generates payment address
3. Buyer sends Litecoin to address
4. Webhook confirms payment
5. System assigns license key
6. Buyer receives confirmation
7. Seller notified of sale

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Building for Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## Deployment

### Using Docker
```bash
docker-compose up -d
```

### Manual Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Build and deploy backend API
4. Build and deploy Next.js frontend
5. Deploy Discord bot
6. Configure reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact the development team or create an issue in the repository.
