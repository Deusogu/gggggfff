# 🔧 Quick MongoDB Fix - Use MongoDB Atlas Instead!

Since your VPS CPU doesn't support AVX instructions required by MongoDB, let's use MongoDB Atlas (free cloud database) instead!

## Step 1: Clean Up Failed MongoDB Installation

```bash
# Remove all MongoDB packages
sudo apt remove --purge mongodb-org*
sudo rm -r /var/log/mongodb
sudo rm -r /var/lib/mongodb
sudo rm /etc/apt/sources.list.d/mongodb-org-*.list
sudo apt autoremove
sudo apt update
```

## Step 2: Set Up MongoDB Atlas (FREE)

1. **Create Account**: Go to https://www.mongodb.com/cloud/atlas/register
2. **Create Free Cluster**: 
   - Choose FREE Shared
   - Pick any provider (AWS is fine)
   - Choose region close to your VPS
   - Name it "fail-ac-cluster"

3. **Set Up Database User**:
   - Go to "Database Access"
   - Add New Database User
   - Username: `marketplaceAdmin`
   - Password: Create a strong one and SAVE IT!
   - Privileges: Atlas Admin

4. **Set Up Network Access**:
   - Go to "Network Access"
   - Add IP Address
   - Allow Access from Anywhere (0.0.0.0/0)
   - Confirm

5. **Get Connection String**:
   - Go to "Database" → "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## Step 3: Update Your Backend Configuration

Edit your backend .env file:
```bash
cd ~/fail-ac/backend
nano .env
```

Change the MONGODB_URI line to your Atlas connection string:
```
MONGODB_URI=mongodb+srv://marketplaceAdmin:YOUR_PASSWORD@fail-ac-cluster.xxxxx.mongodb.net/fail-ac?retryWrites=true&w=majority
```

## Step 4: Test Connection (Optional)

If you want to test:
```bash
# Install just the MongoDB shell
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-mongosh

# Test connection
mongosh "YOUR_CONNECTION_STRING"
```

## That's It! 🎉

No more MongoDB installation issues! Atlas handles everything for you:
- ✅ No AVX requirements
- ✅ No libssl issues  
- ✅ Automatic backups
- ✅ Always available
- ✅ FREE for small projects

Continue with the rest of your setup guide from Step 5!
