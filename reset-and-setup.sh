#!/bin/bash
# Script to reset the chain, deploy contracts, and assign roles

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     SafeBite Chain Reset and Setup Script                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Stop any running Hardhat node
echo "1️⃣  Stopping any running Hardhat node..."
pkill -f "hardhat node" 2>/dev/null || true
sleep 2
echo "   ✅ Done"
echo ""

# Step 2: Clear deployments
echo "2️⃣  Clearing old deployments..."
rm -f deployments/local.json
echo "   ✅ Old deployments cleared"
echo ""

# Step 3: Start Hardhat node in background
echo "3️⃣  Starting Hardhat node..."
cd "$(dirname "$0")"
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
HARDHAT_PID=$!
echo "   ⏳ Waiting for node to start..."
sleep 5
echo "   ✅ Hardhat node started (PID: $HARDHAT_PID)"
echo ""

# Step 4: Deploy contracts to the running node
echo "4️⃣  Deploying contracts to Hardhat node..."
npx hardhat run scripts/deploy-local.js --network localhost
echo ""

# Step 5: Wait for backend to be ready (if running)
echo "5️⃣  Waiting for backend to be ready..."
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "   ✅ Backend is ready"
        break
    fi
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
        echo "   ⚠️  Backend not running. Please start it manually: cd backend && npm start"
        echo "   Then run: ./assign-roles.sh"
        exit 0
    fi
    sleep 1
done
echo ""

# Step 6: Assign PRODUCER role to Account 1
echo "6️⃣  Assigning PRODUCER role to Account 1..."
ACCOUNT_1="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

response=$(curl -s -X POST http://localhost:3000/api/roles/grant-dev \
    -H "Content-Type: application/json" \
    -d "{
        \"accountAddress\": \"$ACCOUNT_1\",
        \"role\": 0
    }")

if echo "$response" | grep -q "success.*true"; then
    echo "   ✅ Successfully assigned PRODUCER role to Account 1"
else
    echo "   ❌ Failed to assign role: $response"
fi
echo ""

# Step 7: Display account information
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              Account Information for MetaMask                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Hardhat Test Accounts (Chain ID: 1337)"
echo ""
echo "Account 1: PRODUCER"
echo "  Address:    0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo "  Role:        PRODUCER (assigned)"
echo ""
echo "Account 2: (No role assigned)"
echo "  Address:    0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "  Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo "  Role:        CONSUMER (default - no assignment needed)"
echo ""
echo "Account 3: (No role assigned)"
echo "  Address:    0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
echo "  Private Key: 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
echo "  Role:        CONSUMER (default - no assignment needed)"
echo ""
echo "Account 4: (No role assigned)"
echo "  Address:    0x90F79bf6EB2c4f870365E785982E1f101E93b906"
echo "  Private Key: 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"
echo "  Role:        CONSUMER (default - no assignment needed)"
echo ""
echo "Account 5: (No role assigned)"
echo "  Address:    0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
echo "  Private Key: 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f873c9dbdacbe608b0810"
echo "  Role:        CONSUMER (default - no assignment needed)"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📝 To import into MetaMask:"
echo "   1. Open MetaMask"
echo "   2. Click account icon → Import Account"
echo "   3. Select 'Private Key'"
echo "   4. Paste the private key above"
echo "   5. Click 'Import'"
echo ""
echo "🌐 Network Settings for MetaMask:"
echo "   Network Name: Hardhat Local"
echo "   RPC URL:      http://127.0.0.1:8545"
echo "   Chain ID:     1337"
echo "   Currency:     ETH"
echo ""
echo "✅ Setup complete!"
echo ""

