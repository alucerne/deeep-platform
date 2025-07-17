#!/bin/bash

# DEEEP Platform - Supabase Edge Function Email Validation Test
# Endpoint: https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails

echo "🧪 Testing DEEEP Platform Email Validation API"
echo "=============================================="

# Test 1: Basic email validation with array format
echo ""
echo "📧 Test 1: Basic email validation (array format)"
echo "------------------------------------------------"

curl -X POST \
  "https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audlabY4qjL)129" \
  -d '{
    "emails": [
      "test@example.com",
      "user@gmail.com",
      "contact@company.org",
      "invalid-email",
      "another@test.co.uk",
      "fake@domain.xyz",
      "real@business.com",
      "spam@trash.net"
    ]
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"

echo ""
echo "=============================================="

# Test 2: Email validation with comma-separated string format
echo ""
echo "📧 Test 2: Email validation (comma-separated string)"
echo "---------------------------------------------------"

curl -X POST \
  "https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audlabY4qjL)129" \
  -d '{
    "emails": "test@example.com,user@gmail.com,contact@company.org,invalid-email,another@test.co.uk"
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"

echo ""
echo "=============================================="

# Test 3: Make.com compatible array format
echo ""
echo "📧 Test 3: Make.com compatible format"
echo "-------------------------------------"

curl -X POST \
  "https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audlabY4qjL)129" \
  -d '[
    {
      "emails": "test@example.com,user@gmail.com,contact@company.org"
    }
  ]' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"

echo ""
echo "=============================================="

# Test 4: Single email test
echo ""
echo "📧 Test 4: Single email validation"
echo "----------------------------------"

curl -X POST \
  "https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer audlabY4qjL)129" \
  -d '{
    "emails": ["test@example.com"]
  }' \
  -w "\n\nHTTP Status: %{http_code}\nTotal Time: %{time_total}s\n"

echo ""
echo "=============================================="

# Test 5: Check batch status (replace BATCH_ID with actual batch ID from previous responses)
echo ""
echo "📧 Test 5: Check batch status (example - replace BATCH_ID)"
echo "----------------------------------------------------------"

echo "To check batch status, use:"
echo "curl -X POST \"https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails?check_status=true&batch_id=YOUR_BATCH_ID\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer audlabY4qjL)129\""

echo ""
echo "✅ Testing completed!"
echo "==============================================" 