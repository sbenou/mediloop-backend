#!/bin/bash

echo "=== Step 1: Register Doctor ==="
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdoctor@clinic.com",
    "password": "Test123!",
    "fullName": "Dr. Test Smith",
    "role": "doctor",
    "workplaceName": "Test Clinic"
  }')

echo $REGISTER_RESPONSE | jq '.'

# Extract values (requires jq - install with: brew install jq)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
TENANT_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.tenant_id')

echo ""
echo "=== Extracted Values ==="
echo "ACCESS_TOKEN: $ACCESS_TOKEN"
echo "TENANT_ID: $TENANT_ID"

echo ""
echo "=== Step 2: Create Invitation ==="
curl -X POST http://localhost:8000/api/invitations/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"email\": \"nurse@clinic.com\",
    \"tenantId\": \"$TENANT_ID\",
    \"role\": \"nurse\",
    \"message\": \"Welcome to our clinic!\"
  }" | jq '.'