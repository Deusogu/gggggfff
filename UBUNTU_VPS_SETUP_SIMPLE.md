# 🚀 Super Simple Ubuntu VPS Setup Guide - Fail.ac

This guide explains EVERYTHING step-by-step, like you're 6 years old! Just copy and paste each command.

## 📋 What You Need Before Starting

1. **A VPS (Virtual Private Server)**
   - Go to [DigitalOcean](https://www.digitalocean.com) or [Vultr](https://www.vultr.com)
   - Create an account
   - Choose "Ubuntu 22.04" as your operating system
   - Choose at least 2GB RAM (4GB is better)
   - Write down your server's IP address (looks like: 123.456.789.0)

2. **A Domain Name** 
   - Buy from [Namecheap](https://www.namecheap.com) or [GoDaddy](https://www.godaddy.com)
   - Example: fail.ac or yourmarket.com

3. **Your Computer**
   - Windows, Mac, or Linux - doesn't matter!

---

## 🔧 Step 1: Connect to Your Server

### On Windows:
1. Download [PuTTY](https://www.putty.org/)
2. Open PuTTY
3. In "Host Name" box, type your server IP (like 123.456.789.0)
4. Click "Open"
5. When it asks for login, type: `root`
6. Type the password your VPS provider gave you (you won't see it typing - that's normal!)

### On Mac/Linux:
1. Open Terminal
2. Type this (replace YOUR_SERVER_IP with your actual IP):
```bash
ssh root@YOUR_SERVER_IP
```
3. Type `yes` when asked
4. Enter your password (you won't see it typing - that's normal!)

---

## 🏗️ Step 2: Prepare Your Server

Copy and paste these commands ONE BY ONE. Wait for each to finish before doing the next!

### Update Everything First
```bash
apt update && apt upgrade -y
```
**What this does:** Updates all software to latest versions. This might take 2-3 minutes.

### Install Basic Tools
```bash
apt install -y curl wget git build-essential software-properties-common
```
**What this does:** Installs tools we need. Takes about 1 minute.

---

## 👤 Step 3: Create a Safe User (Don't Use Root!)

### Create New User
```bash
adduser marketplace
```
**What happens:**
- It asks for a password - TYPE A STRONG PASSWORD AND REMEMBER IT!
- Press ENTER for all other questions (name, phone, etc.)

### Give User Power
```bash
usermod -aG sudo marketplace
```
**What this does:** Lets your new user install software.

### Switch to New User
```bash
su - marketplace
```
**What this does:** Now you're logged in as "marketplace" not "root" (safer!)

---

## 📦 Step 4: Install Required Software

### Install Node.js (JavaScript Runner)
Copy and paste these THREE commands:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
```
Wait for it to finish, then:
```bash
sudo apt install -y nodejs
```
Check it worked:
```bash
node --version
```
**You should see:** Something like `v18.17.0`

### Set Up MongoDB Atlas (Free Cloud Database)

**🌟 MUCH EASIER: Use MongoDB Atlas instead of installing locally!**

MongoDB Atlas is FREE and works perfectly. No installation headaches!

#### Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email
3. Verify your email

#### Step 2: Create Your Free Cluster

1. Choose **FREE Shared** option
2. Pick any cloud provider (AWS is fine)
3. Choose a region close to your VPS location
4. Name your cluster "fail-ac-cluster" (or anything you want)
5. Click "Create Cluster" (takes 1-3 minutes)

#### Step 3: Set Up Database Access

1. On left menu, click **"Database Access"**
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `marketplaceAdmin`
5. Password: **CREATE A STRONG PASSWORD AND SAVE IT!**
6. Under "Database User Privileges", select **"Atlas Admin"**
7. Click **"Add User"**

#### Step 4: Set Up Network Access

1. On left menu, click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for now)
4. Click **"Confirm"**

**Note:** Later you can restrict this to just your VPS IP for better security

#### Step 5: Get Your Connection String

1. Go back to **"Database"** in the left menu
2. Click **"Connect"** button on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string, it looks like:
   ```
   mongodb+srv://marketplaceAdmin:<password>@fail-ac-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password

#### Step 6: Test Your Connection (Optional)

If you want to test the connection from your VPS:
```bash
# Install MongoDB Shell only (small download)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-mongosh

# Test connection (replace with your connection string)
mongosh "mongodb+srv://marketplaceAdmin:YOUR_PASSWORD@fail-ac-cluster.xxxxx.mongodb.net/"
```

If it connects, type `exit` to quit.

**That's it! No local MongoDB needed!** 🎉


### Install PM2 (Keeps Your Site Running)
```bash
sudo npm install -g pm2
```

### Install Nginx (Web Server)
```bash
sudo apt install -y nginx
```

---

## 📥 Step 5: Download Your Marketplace Code

### Go to Home Folder
```bash
cd ~
```

### Download the Code
```bash
git clone https://github.com/YOUR_USERNAME/fail-ac.git
```
**IMPORTANT:** Replace `YOUR_USERNAME` with your actual GitHub username!

### Enter the Project
```bash
cd fail-ac
```

---

## ⚙️ Step 6: Set Up Backend (The Brain)

### Go to Backend Folder
```bash
cd backend
```

### Install Backend Stuff
```bash
npm install
```
**This takes 2-3 minutes. You'll see lots of text - that's normal!**

### Create Settings File
```bash
cp .env.example .env
```

### Edit Settings File
```bash
nano .env
```

**Now you're in a text editor! Here's what to do:**

1. Use ARROW KEYS to move around
2. Change these lines (I'll explain each):

```
PORT=5000
NODE_ENV=production

# Database - USE YOUR MONGODB ATLAS CONNECTION STRING!
MONGODB_URI=mongodb+srv://marketplaceAdmin:YOUR_PASSWORD@fail-ac-cluster.xxxxx.mongodb.net/fail-ac?retryWrites=true&w=majority

# Make a super secret password (just mash your keyboard!)
JWT_SECRET=asdkfj3409dfgkj345kjsdfg98345jksdfg

# Your email settings (use Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=yourapppassword

# Litecoin settings (get from CoinPayments.net)
LITECOIN_API_KEY=get-from-coinpayments
LITECOIN_PUBLIC_KEY=get-from-coinpayments
LITECOIN_IPN_SECRET=make-something-up
LITECOIN_WALLET_ADDRESS=your-litecoin-address

# Your cut (0.15 = 15%)
DEFAULT_COMMISSION_RATE=0.15

# Your website address
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# Discord bot token (get from Discord Developer Portal)
DISCORD_BOT_TOKEN=your-discord-bot-token
BOT_API_KEY=make-up-a-random-key

# Admin account
ADMIN_EMAIL=youradmin@email.com
ADMIN_PASSWORD=strong-admin-password
ADMIN_USERNAME=admin
```

3. Press `CTRL + X` to exit
4. Press `Y` to save
5. Press `ENTER` to confirm

### Go Back to Main Folder
```bash
cd ..
```

---

## 🎨 Step 7: Set Up Frontend (The Pretty Part)

### Go to Frontend Folder
```bash
cd frontend
```

### Install Frontend Stuff
```bash
npm install
```
**This takes 3-4 minutes!**

### Create Settings File
```bash
cp .env.example .env.local
```

### Edit Settings File
```bash
nano .env.local
```

Change these lines:
```
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SITE_NAME=Fail.ac
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_LITECOIN_PUBLIC_KEY=your-coinpayments-public-key
```

Save: `CTRL + X`, then `Y`, then `ENTER`

### Build the Website
```bash
npm run build
```
**This takes 2-3 minutes. You'll see a progress bar!**

### Go Back
```bash
cd ..
```

---

## 🤖 Step 8: Set Up Discord Bot

### Go to Bot Folder
```bash
cd discord-bot
```

### Install Bot Stuff
```bash
npm install
```

### Create Settings File
```bash
cp .env.example .env
```

### Edit Settings File
```bash
nano .env
```

Change these:
```
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-discord-server-id
API_URL=http://localhost:5000/api
API_KEY=same-as-backend-BOT_API_KEY
```

Save: `CTRL + X`, then `Y`, then `ENTER`

### Go Back Home
```bash
cd ~
```

---

## 🌐 Step 9: Connect Your Domain

### Point Domain to Server
1. Log into your domain provider (Namecheap/GoDaddy)
2. Find "DNS Settings" or "Manage DNS"
3. Add these records:
   - Type: `A`, Name: `@`, Value: `YOUR_SERVER_IP`
   - Type: `A`, Name: `www`, Value: `YOUR_SERVER_IP`
4. Save and wait 5-10 minutes

---

## 🔧 Step 10: Configure Web Server

### Remove Default Site
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### Create Your Site Config
```bash
sudo nano /etc/nginx/sites-available/fail-ac
```

**COPY AND PASTE THIS ENTIRE BLOCK** (change yourdomain.com to your actual domain):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    client_max_body_size 10M;
}
```

Save: `CTRL + X`, then `Y`, then `ENTER`

### Enable Your Site
```bash
sudo ln -s /etc/nginx/sites-available/fail-ac /etc/nginx/sites-enabled/
```

### Test Configuration
```bash
sudo nginx -t
```
**You should see:** "syntax is ok"

### Restart Nginx
```bash
sudo systemctl reload nginx
```

---

## 🔒 Step 11: Get SSL Certificate (HTTPS)

### Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### Get Certificate
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**What happens:**
1. Enter your email
2. Type `A` to agree
3. Type `N` for no emails
4. Type `2` to redirect to HTTPS

---

## 🚀 Step 12: Start Everything!

### Create Startup File
```bash
cd ~/fail-ac
nano ecosystem.config.js
```

**COPY AND PASTE THIS ENTIRE BLOCK:**
```javascript
module.exports = {
  apps: [
    {
      name: 'backend',
      script: './backend/src/app.js',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    {
      name: 'frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'discord-bot',
      script: './discord-bot/src/index.js',
      cwd: './discord-bot',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Save: `CTRL + X`, then `Y`, then `ENTER`

### Start Everything
```bash
pm2 start ecosystem.config.js
```

### Save PM2 Config
```bash
pm2 save
pm2 startup
```
**IMPORTANT:** It will show you a command to copy/paste - DO IT!

### Check Everything is Running
```bash
pm2 status
```
**You should see:** 3 green "online" items

---

## ✅ Step 13: Create Admin Account

### Run Admin Setup
```bash
cd ~/fail-ac/backend
node -e "
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./src/models/User');
  const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
  
  await User.create({
    username: process.env.ADMIN_USERNAME,
    email: process.env.ADMIN_EMAIL,
    password: password,
    role: 'admin',
    isVerified: true
  });
  
  console.log('Admin created!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

---

## 🎉 YOU'RE DONE!

### Visit Your Website
Open your browser and go to: `https://yourdomain.com`

### Login as Admin
1. Click "Sign In"
2. Use the admin email/password from your .env file
3. Go to Admin Dashboard

---

## 🔧 Useful Commands

### See if everything is running:
```bash
pm2 status
```

### Restart everything:
```bash
pm2 restart all
```

### See logs (if something breaks):
```bash
pm2 logs
```

### Stop everything:
```bash
pm2 stop all
```

### Update your code:
```bash
cd ~/fail-ac
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ../discord-bot && npm install
cd ..
pm2 restart all
```

---

## ❓ Common Problems & Fixes

### "Permission Denied"
Add `sudo` before the command

### "Command not found"
You might be in wrong folder. Type `cd ~/fail-ac`

### Website not loading
1. Check PM2: `pm2 status`
2. Check logs: `pm2 logs`
3. Restart: `pm2 restart all`

### Can't connect to server
Make sure you're using the right IP address and password

---

## 📞 Getting Help

If you're stuck:
1. Take a screenshot of the error
2. Note which step you're on
3. Check the logs: `pm2 logs`

Remember: Every expert was once a beginner. You got this! 🚀
