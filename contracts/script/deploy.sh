#!/bin/bash
# deploy.sh — Deploy Autarch contracts to Somnia Testnet using forge create
# Usage: ./script/deploy.sh

set -e

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/../.env"

RPC_URL="${SOMNIA_RPC_URL:-https://dream-rpc.somnia.network}"
PLATFORM_ADDRESS="${NEXT_PUBLIC_PLATFORM_ADDRESS:-0x037Bb9C718F3f7fe5eCBDB0b600D607b52706776}"

echo "============================================"
echo "  Autarch Deployment — Somnia Testnet"
echo "============================================"
echo ""

# Step 1: Deploy Autarch (core contract, no arbiter yet)
echo "[1/4] Deploying Autarch..."
AUTARCH_OUTPUT=$(forge create --broadcast --legacy \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    src/Autarch.sol:Autarch \
    --constructor-args "$PLATFORM_ADDRESS")

AUTARCH_ADDRESS=$(echo "$AUTARCH_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "  ✅ Autarch deployed to: $AUTARCH_ADDRESS"
echo ""

# Step 2: Deploy AutorchArbiter (with Autarch address + deployer as trusted arbiter)
echo "[2/4] Deploying AutorchArbiter..."
DEPLOYER_ADDRESS=$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null || echo "")
if [ -z "$DEPLOYER_ADDRESS" ]; then
    # Fallback: extract from forge create output
    DEPLOYER_ADDRESS=$(echo "$AUTARCH_OUTPUT" | grep "Deployer:" | awk '{print $2}')
fi

ARBITER_OUTPUT=$(forge create --broadcast --legacy \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    src/AutorchArbiter.sol:AutorchArbiter \
    --constructor-args "$AUTARCH_ADDRESS" "$DEPLOYER_ADDRESS")

ARBITER_ADDRESS=$(echo "$ARBITER_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "  ✅ AutorchArbiter deployed to: $ARBITER_ADDRESS"
echo ""

# Step 3: Set the arbiter address on Autarch
echo "[3/4] Setting arbiter on Autarch..."
SET_ARBITER_TX=$(cast send --legacy \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    "$AUTARCH_ADDRESS" \
    "setArbiter(address)" \
    "$ARBITER_ADDRESS")
echo "  ✅ Arbiter set on Autarch"
echo ""

# Step 4: Deploy AutorchRegistry
echo "[4/4] Deploying AutorchRegistry..."
REGISTRY_OUTPUT=$(forge create --broadcast --legacy \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    src/AutorchRegistry.sol:AutorchRegistry \
    --constructor-args "$AUTARCH_ADDRESS")

REGISTRY_ADDRESS=$(echo "$REGISTRY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo "  ✅ AutorchRegistry deployed to: $REGISTRY_ADDRESS"
echo ""

# Summary
echo "============================================"
echo "  Deployment Complete!"
echo "============================================"
echo ""
echo "  Autarch:         $AUTARCH_ADDRESS"
echo "  AutorchArbiter:  $ARBITER_ADDRESS"
echo "  AutorchRegistry: $REGISTRY_ADDRESS"
echo ""
echo "  Update your frontend .env with:"
echo "  NEXT_PUBLIC_AUTARCH_ADDRESS=$AUTARCH_ADDRESS"
echo "============================================"
