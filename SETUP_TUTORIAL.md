# Cheat Marketplace Platform - Setup Tutorial for Ubuntu VPS

This tutorial will guide you through setting up the Cheat Marketplace Platform on an Ubuntu VPS. It covers installing dependencies, configuring environment variables, running the backend, frontend, and Discord bot, and using Docker for easier deployment.

---

## Prerequisites

- Ubuntu 20.04 or later VPS with root or sudo access
- Basic knowledge of Linux command line
- Domain name (optional, for production)
- Email account for SMTP (Gmail or other)
- Discord bot token and client ID
- Litecoin API credentials (see below)

---

## Step 1: Update and Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### Install Node.js (v18 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

### Install MongoDB

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

---

## Step 2: Clone the Repository

```bash
git clone <your-repo-url> cheat-marketplace
cd cheat-marketplace
```

---

## Step 3: Configure Environment Variables

Copy the example environment file and edit it:

```bash
cp .env.example .env
nano .env
```

Fill in the following:

- `MONGO_PASSWORD`: Your MongoDB password (if using authentication)
- `JWT_SECRET`: A strong secret key for JWT tokens. You can generate one using:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`: SMTP settings for email notifications. For Gmail, you can use [Google App Passwords](https://support.google.com/accounts/answer/185833) for secure authentication.
- `LITECOIN_API_KEY`, `LITECOIN_WALLET_ADDRESS`, `LITECOIN_WEBHOOK_SECRET`: Litecoin payment integration credentials.

### How to get Litecoin API credentials:

1. Sign up for a Litecoin payment gateway or blockchain API provider such as [BlockCypher](https://www.blockcypher.com/), [Chain.so](https://chain.so/), or [Litecoin.net](https://litecoin.net/).
2. Create an API key from their dashboard.
3. Set up a Litecoin wallet address to receive payments.
4. Configure webhook URLs in the provider dashboard to point to your backend payment webhook endpoint (e.g., `https://yourdomain.com/api/payments/webhook`).
5. Use a secret token for webhook verification and set it as `LITECOIN_WEBHOOK_SECRET`.

- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`: Obtain these by creating a Discord bot in the [Discord Developer Portal](https://discord.com/developers/applications).
- `BOT_API_KEY`: Internal API key for Discord bot communication. Generate a strong random string similar to `JWT_SECRET`.

- `FRONTEND_URL`: URL where frontend will be hosted (e.g., http://yourdomain.com)
- `API_URL` and `SOCKET_URL`: Backend API and socket URLs (e.g., http://yourdomain.com/api)

Save and exit (`Ctrl+O`, `Enter`, `Ctrl+X`).

---

## Step 4: Using Docker (Recommended)

Make sure Docker and Docker Compose are installed:

```bash
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
docker --version
docker-compose --version
```

Build and start all services:

```bash
docker-compose up -d --build
```

Check running containers:

```bash
docker ps
```

Logs:

```bash
docker-compose logs -f
```

---

## Step 5: Manual Setup (If not using Docker)

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Discord Bot

```bash
cd discord-bot
npm install
npm start
```

---

## Step 6: Access the Platform

- Frontend: http://your-vps-ip:3000 or your domain
- Backend API: http://your-vps-ip:5000/api
- Discord Bot: Should be online in your Discord server

---

## Step 7: Additional Configuration

- Set up reverse proxy (e.g., Nginx) for SSL termination and domain routing
- Configure firewall to allow necessary ports (80, 443, 3000, 5000)
- Set up SSL certificates (Let's Encrypt recommended)
- Configure email sending limits and monitoring

---

## Troubleshooting

- Check logs for backend, frontend, and bot using Docker or terminal
- Verify environment variables are correctly set
- Ensure MongoDB is running and accessible
- Confirm Discord bot token and permissions
- Verify Litecoin API credentials and webhook URLs

---

## Support

For further assistance, please contact the development team or open an issue in the repository.

---

This tutorial is designed to be clear and easy to follow for anyone with basic Linux and server management knowledge.
