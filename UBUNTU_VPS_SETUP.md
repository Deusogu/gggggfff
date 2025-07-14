# Ubuntu VPS Setup Guide - Cheat Marketplace Platform

## Table of Contents
1. [VPS Requirements](#vps-requirements)
2. [Initial Server Setup](#initial-server-setup)
3. [Installing Required Software](#installing-required-software)
4. [Cloning and Configuring the Platform](#cloning-and-configuring-the-platform)
5. [Setting Up Environment Variables](#setting-up-environment-variables)
6. [Installing and Configuring Nginx](#installing-and-configuring-nginx)
7. [SSL Certificate Setup](#ssl-certificate-setup)
8. [Starting Services with PM2](#starting-services-with-pm2)
9. [Firewall Configuration](#firewall-configuration)
10. [Automated Backups](#automated-backups)
11. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## VPS Requirements

### Minimum Specifications
- **OS**: Ubuntu 20.04 LTS or 22.04 LTS
- **RAM**: 2GB minimum (4GB recommended)
- **CPU**: 2 vCPUs
- **Storage**: 40GB SSD
- **Bandwidth**: Unlimited preferred

### Recommended VPS Providers
- DigitalOcean ($12/month droplet)
- Vultr ($12/month)
- Linode ($10/month)
- Hetzner (€4.90/month)

---

## Initial Server Setup

### 1. Connect to Your VPS
```bash
# From your local machine
ssh root@your-server-ip
```

### 2. Update System
```bash
# Update package list and upgrade system
apt update && apt upgrade -y

# Install essential packages
apt install -y curl wget git build-essential software-properties-common
```

### 3. Create a New User (Don't use root)
```bash
# Create new user
adduser marketplace

# Add user to sudo group
usermod -aG sudo marketplace

# Switch to new user
su - marketplace
```

### 4. Setup SSH Key Authentication (Optional but Recommended)
```bash
# On your local machine
ssh-copy-id marketplace@your-server-ip

# On server, disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd
```

---

## Installing Required Software

### 1. Install Node.js (v18 LTS)
```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install MongoDB
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create list file for MongoDB
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt update

# Install MongoDB
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
sudo systemctl status mongod
```

### 3. Install PM2 (Process Manager)
```bash
# Install PM2 globally
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs
```

### 4. Install Nginx
```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Install Certbot (for SSL)
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## Cloning and Configuring the Platform

### 1. Clone the Repository
```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/yourusername/cheat-marketplace.git
cd cheat-marketplace
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install

# Create environment file
cp .env.example .env
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install

# Create environment file
cp .env.example .env.local

# Build frontend for production
npm run build
```

### 4. Install Discord Bot Dependencies
```bash
cd ../discord-bot
npm install

# Create environment file
cp .env.example .env
```

---

## Setting Up Environment Variables

### 1. Configure Backend (.env)
```bash
cd ~/cheat-marketplace/backend
nano .env
```

Add your configuration:
```bash
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (local MongoDB)
MONGODB_URI=mongodb://localhost:27017/cheat-marketplace

# JWT Configuration (generate secure secret)
JWT_SECRET=$(openssl rand -base64 64)
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Cheat Marketplace <noreply@yourdomain.com>

# Litecoin Configuration
LITECOIN_API_KEY=your-coinpayments-private-key
LITECOIN_PUBLIC_KEY=your-coinpayments-public-key
LITECOIN_IPN_SECRET=your-ipn-secret
LITECOIN_WALLET_ADDRESS=your-litecoin-wallet-address

# Commission
DEFAULT_COMMISSION_RATE=0.15

# URLs (update with your domain)
FRONTEND_URL=https://yourdomain.com
API_URL=https://yourdomain.com/api

# Discord Bot
DISCORD_BOT_TOKEN=your-discord-bot-token
BOT_API_KEY=$(openssl rand -base64 32)

# Admin Account
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=strong-admin-password
ADMIN_USERNAME=admin
```

### 2. Configure Frontend (.env.local)
```bash
cd ~/cheat-marketplace/frontend
nano .env.local
```

```bash
# API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com/api

# Site Configuration
NEXT_PUBLIC_SITE_NAME=Cheat Marketplace
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# Litecoin
NEXT_PUBLIC_LITECOIN_PUBLIC_KEY=your-coinpayments-public-key
```

### 3. Configure Discord Bot (.env)
```bash
cd ~/cheat-marketplace/discord-bot
nano .env
```

```bash
# Discord Configuration
DISCORD_TOKEN=your-discord-bot-token
CLIENT_ID=your-bot-client-id
GUILD_ID=your-discord-server-id

# API Configuration
API_URL=http://localhost:5000/api
API_KEY=same-as-backend-BOT_API_KEY

# Bot Settings
BOT_PREFIX=!
EMBED_COLOR=#0099ff
```

---

## Installing and Configuring Nginx

### 1. Remove Default Nginx Configuration
```bash
sudo rm /etc/nginx/sites-enabled/default
```

### 2. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/cheat-marketplace
```

Add this configuration (replace yourdomain.com):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL configuration (will be added by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for payment webhooks
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Socket.io
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File upload limits
    client_max_body_size 10M;
}
```

### 3. Enable the Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/cheat-marketplace /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## SSL Certificate Setup

### 1. Obtain SSL Certificate
```bash
# Make sure your domain is pointing to your server IP first!
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts:
# - Enter email
# - Agree to terms
# - Choose redirect option (recommended)
```

### 2. Auto-Renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up a cron job for renewal
```

---

## Starting Services with PM2

### 1. Create PM2 Ecosystem File
```bash
cd ~/cheat-marketplace
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'marketplace-backend',
      script: './backend/src/app.js',
      cwd: './backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    },
    {
      name: 'marketplace-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true
    },
    {
      name: 'marketplace-bot',
      script: './discord-bot/src/index.js',
      cwd: './discord-bot',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/bot-error.log',
      out_file: './logs/bot-out.log',
      log_file: './logs/bot-combined.log',
      time: true
    }
  ]
};
```

### 2. Create Log Directory
```bash
mkdir -p ~/cheat-marketplace/logs
```

### 3. Start All Services
```bash
cd ~/cheat-marketplace

# Start all services
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# View status
pm2 status

# View logs
pm2 logs
```

### 4. Create Admin Account
```bash
cd ~/cheat-marketplace/backend

# Create admin setup script
nano scripts/create-admin.js
```

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    
    const admin = await User.create({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true
    });
    
    console.log('Admin account created:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
}

createAdmin();
```

```bash
# Run the script
node scripts/create-admin.js
```

---

## Firewall Configuration

### 1. Configure UFW (Ubuntu Firewall)
```bash
# Allow SSH (important - do this first!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MongoDB only from localhost
sudo ufw allow from 127.0.0.1 to any port 27017

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Automated Backups

### 1. Create Backup Script
```bash
mkdir -p ~/backups
nano ~/backups/backup.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/marketplace/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cheat-marketplace"
RETENTION_DAYS=7

# Create backup directory
mkdir -p $BACKUP_DIR/db
mkdir -p $BACKUP_DIR/files

# Backup MongoDB
mongodump --db $DB_NAME --out $BACKUP_DIR/db/backup_$DATE

# Compress backup
tar -czf $BACKUP_DIR/db/backup_$DATE.tar.gz -C $BACKUP_DIR/db backup_$DATE
rm -rf $BACKUP_DIR/db/backup_$DATE

# Backup uploaded files and environment files
tar -czf $BACKUP_DIR/files/files_$DATE.tar.gz \
  /home/marketplace/cheat-marketplace/backend/.env \
  /home/marketplace/cheat-marketplace/frontend/.env.local \
  /home/marketplace/cheat-marketplace/discord-bot/.env \
  /home/marketplace/cheat-marketplace/backend/uploads

# Remove old backups
find $BACKUP_DIR/db -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR/files -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

### 2. Make Script Executable
```bash
chmod +x ~/backups/backup.sh
```

### 3. Setup Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 3 AM
0 3 * * * /home/marketplace/backups/backup.sh >> /home/marketplace/backups/backup.log 2>&1
```

---

## Monitoring and Maintenance

### 1. Install Monitoring Tools
```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install netdata for real-time monitoring (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

### 2. Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/marketplace
```

```
/home/marketplace/cheat-marketplace/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 marketplace marketplace
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Monitor Services
```bash
# Check PM2 services
pm2 status

# Monitor in real-time
pm2 monit

# Check system resources
htop

# Check disk usage
df -h

# Check MongoDB status
sudo systemctl status mongod

# Check Nginx status
sudo systemctl status nginx
```

### 4. Useful Commands
```bash
# Restart all services
pm2 restart all

# Restart specific service
pm2 restart marketplace-backend

# View logs
pm2 logs marketplace-backend --lines 100

# Check error logs
pm2 logs marketplace-backend --err --lines 100

# Update platform
cd ~/cheat-marketplace
git pull
cd backend && npm install
cd ../frontend && npm install && npm run build
cd ../discord-bot && npm install
pm2 restart all
```

---

## Security Hardening

### 1. Secure MongoDB
```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "adminUser",
  pwd: "strongPassword123",
  roles: [ { role: "userAdminAnyDatabase", db: "admin" } ]
})

# Create database user
use cheat-marketplace
db.createUser({
  user: "marketplaceUser",
  pwd: "anotherStrongPassword",
  roles: [ { role: "readWrite", db: "cheat-marketplace" } ]
})

# Enable authentication
sudo nano /etc/mongod.conf
# Add under security:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod

# Update backend .env with new connection string
MONGODB_URI=mongodb://marketplaceUser:anotherStrongPassword@localhost:27017/cheat-marketplace?authSource=cheat-marketplace
```

### 2. Additional Security Measures
```bash
# Install fail2ban
sudo apt install -y fail2ban

# Configure fail2ban for SSH
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

---

## Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   ```bash
   # Check if services are running
   pm2 status
   # Restart services
   pm2 restart all
   ```

2. **MongoDB Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   # Check logs
   sudo journalctl -u mongod -n 50
   ```

3. **SSL Certificate Issues**
   ```bash
   # Renew certificate
   sudo certbot renew --force-renewal
   # Restart Nginx
   sudo systemctl restart nginx
   ```

4. **Out of Memory**
   ```bash
   # Check memory usage
   free -h
   # Restart services to free memory
   pm2 restart all
   ```

---

## Performance Optimization

### 1. Enable Swap (for low RAM VPS)
```bash
# Create swap file (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

### 2. Optimize Node.js
```bash
# Set Node.js memory limit in ecosystem.config.js
node_args: '--max-old-space-size=1024'
```

---

This completes the Ubuntu VPS setup. Your cheat marketplace should now be running securely on your Ubuntu server with automatic backups, SSL, and proper monitoring.
