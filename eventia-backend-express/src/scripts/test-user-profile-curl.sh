#!/bin/bash

# Script to test the UserProfile API functionality using curl

# Server URL
BASE_URL="http://localhost:4000"

# Create a test user
echo "Creating test user..."

# Note: In a real scenario, you would first register and login to get a JWT token
# For this test, we'll use a placeholder token
TOKEN="your-jwt-token-here"

# Test getting user profile
echo "\nGetting user profile..."
curl -X GET \
  "$BASE_URL/api/v1/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Test updating user profile with address
echo "\n\nUpdating user profile with address..."
curl -X PUT \
  "$BASE_URL/api/v1/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "address": {
      "street": "123 Main St",
      "city": "Anytown",
      "state": "ST",
      "postalCode": "12345",
      "country": "Country"
    }
  }'

# Test getting updated user profile
echo "\n\nGetting updated user profile..."
curl -X GET \
  "$BASE_URL/api/v1/users/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo "\n\nUserProfile API curl tests completed!"