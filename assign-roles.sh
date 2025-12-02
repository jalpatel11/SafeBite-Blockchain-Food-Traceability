#!/bin/bash

ACCOUNT_1="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
ACCOUNT_2="0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
ACCOUNT_3="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
ACCOUNT_4="0x90F79bf6EB2c4f870365E785982E1f101E93b906"

ROLES=("PRODUCER" "DISTRIBUTOR" "RETAILER" "REGULATOR" "CONSUMER")

assign_role() {
    local address=$1
    local role=$2
    local role_name=${ROLES[$role]}
    
    echo "Assigning $role_name to $address..."
    
    response=$(curl -s -X POST http://localhost:3000/api/roles/grant-dev \
        -H "Content-Type: application/json" \
        -d "{
            \"accountAddress\": \"$address\",
            \"role\": $role
        }")
    
    if echo "$response" | grep -q "success.*true"; then
        echo " $role_name assigned to $address"
    else
        echo " Failed: $response"
    fi
    echo ""
}

if ! curl -s http://localhost:3000/health > /dev/null; then
    echo " Backend not running on http://localhost:3000"
    exit 1
fi

assign_role "$ACCOUNT_1" 0
assign_role "$ACCOUNT_2" 1
assign_role "$ACCOUNT_3" 2
assign_role "$ACCOUNT_4" 3

echo " Role assignment complete"

